// Copyright 2020, University of Colorado Boulder

/**
 * This prints out (in JSON form) the tests and operations requested for continuous testing for whatever is in main
 * at this point.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const getActiveRepos = require('./common/getActiveRepos');
const getRepoList = require('./common/getRepoList');
const fs = require('fs');
const repos = getActiveRepos();
const phetioRepos = getRepoList('phet-io');
const phetioAPIStableRepos = getRepoList('phet-io-api-stable');
const runnableRepos = getRepoList('active-runnables');
const interactiveDescriptionRepos = getRepoList('interactive-description');
const phetioNoUnsupportedRepos = getRepoList('phet-io-state-unsupported');
const unitTestRepos = getRepoList('unit-tests');
const voicingRepos = getRepoList('voicing');
const phetioWrapperSuiteWrappers = getRepoList('wrappers');
const phetioHydrogenSims = JSON.parse(fs.readFileSync('../perennial/data/phet-io-hydrogen.json', 'utf8').trim());

// repos to not test multitouch fuzzing
const REPOS_EXCLUDED_FROM_MULTITOUCH_FUZZING = ['number-compare', 'number-play'];
const REPOS_EXCLUDED_FROM_LISTENER_ORDER_RANDOM = ['density', 'buoyancy', 'buoyancy-basics', 'fourier-making-waves' // see https://github.com/phetsims/fourier-making-waves/issues/240
];

/**
 * {Array.<Object>} test
 * {string} type
 * {string} [url]
 * {string} [repo]
 * {string} [queryParameters]
 * {string} [testQueryParameters]
 * {boolean} [es5]
 * {string} [brand]
 * {number} [priority=1] - higher priorities are tested more eagerly
 * {Array.<string>} buildDependencies
 */
const tests = [];
tests.push({
  test: ['perennial', 'lint-everything'],
  type: 'lint-everything',
  priority: 100
});

// phet and phet-io brand builds
[...runnableRepos, 'scenery', 'kite', 'dot'].forEach(repo => {
  tests.push({
    test: [repo, 'build'],
    type: 'build',
    brands: phetioRepos.includes(repo) ? ['phet', 'phet-io'] : ['phet'],
    repo: repo,
    priority: 1
  });
});

// lints
repos.forEach(repo => {
  // Rosetta specifies the lint task a bit differently, see https://github.com/phetsims/rosetta/issues/366
  if (fs.existsSync(`../${repo}/Gruntfile.js`) || repo === 'rosetta') {
    tests.push({
      test: [repo, 'lint'],
      type: 'lint',
      repo: repo,
      priority: 8
    });
  }
});
runnableRepos.forEach(repo => {
  tests.push({
    test: [repo, 'fuzz', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzz',
    testQueryParameters: 'duration=90000' // This is the most important test, let's get some good coverage!
  });
  tests.push({
    test: [repo, 'xss-fuzz'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzz&stringTest=xss',
    testQueryParameters: 'duration=10000',
    priority: 0.3
  });
  tests.push({
    test: [repo, 'fuzz', 'unbuilt', 'assertSlow'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&eall&fuzz',
    priority: 0.001
  });
  if (!REPOS_EXCLUDED_FROM_LISTENER_ORDER_RANDOM.includes(repo)) {
    tests.push({
      test: [repo, 'fuzz', 'unbuilt', 'listenerOrderRandom'],
      type: 'sim-test',
      url: `${repo}/${repo}_en.html`,
      queryParameters: 'brand=phet&ea&fuzz&listenerOrder=random',
      priority: 0.3
    });
  }

  // don't test select repos for fuzzPointers=2
  if (!REPOS_EXCLUDED_FROM_MULTITOUCH_FUZZING.includes(repo)) {
    tests.push({
      test: [repo, 'multitouch-fuzz', 'unbuilt'],
      type: 'sim-test',
      url: `${repo}/${repo}_en.html`,
      queryParameters: 'brand=phet&ea&fuzz&fuzzPointers=2&supportsPanAndZoom=false'
    });
    tests.push({
      test: [repo, 'pan-and-zoom-fuzz', 'unbuilt'],
      type: 'sim-test',
      url: `${repo}/${repo}_en.html`,
      queryParameters: 'brand=phet&ea&fuzz&fuzzPointers=2&supportsPanAndZoom=true',
      priority: 0.5 // test this when there isn't other work to be done
    });
  }
  tests.push({
    test: [repo, 'fuzz', 'built'],
    type: 'sim-test',
    url: `${repo}/build/phet/${repo}_en_phet.html`,
    queryParameters: 'fuzz',
    testQueryParameters: 'duration=80000',
    // We want to elevate the priority so that we get a more even balance (we can't test these until they are built,
    // which doesn't happen always)
    priority: 2,
    brand: 'phet',
    buildDependencies: [repo],
    es5: true
  });
  if (phetioRepos.includes(repo)) {
    tests.push({
      test: [repo, 'fuzz', 'built-phet-io'],
      type: 'sim-test',
      url: `${repo}/build/phet-io/${repo}_all_phet-io.html`,
      queryParameters: 'fuzz&phetioStandalone',
      testQueryParameters: 'duration=80000',
      brand: 'phet-io',
      buildDependencies: [repo],
      es5: true
    });
  }
});
phetioRepos.forEach(repo => {
  tests.push({
    test: [repo, 'phet-io-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'ea&brand=phet-io&phetioStandalone&fuzz'
  });

  // Test for API compatibility, for sims that support it
  phetioAPIStableRepos.includes(repo) && tests.push({
    test: [repo, 'phet-io-api-compatibility', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'ea&brand=phet-io&phetioStandalone&phetioCompareAPI&randomSeed=332211&locales=*&webgl=false',
    // NOTE: DUPLICATION ALERT: random seed must match that of API generation, see generatePhetioMacroAPI.js
    priority: 1.5 // more often than the average test
  });
  const phetioStateSupported = !phetioNoUnsupportedRepos.includes(repo);

  // phet-io wrappers tests for each PhET-iO Sim, these tests rely on phet-io state working
  phetioStateSupported && [false, true].forEach(useAssert => {
    tests.push({
      test: [repo, 'phet-io-wrappers-tests', useAssert ? 'assert' : 'no-assert'],
      type: 'qunit-test',
      url: `phet-io-wrappers/phet-io-wrappers-tests.html?sim=${repo}${useAssert ? '&phetioDebug=true&phetioWrapperDebug=true' : ''}`,
      testQueryParameters: 'duration=600000' // phet-io-wrapper tests load the sim >5 times
    });
  });
  const wrappersToIgnore = ['migration', 'playback', 'login', 'input-record-and-playback'];
  phetioWrapperSuiteWrappers.forEach(wrapperPath => {
    const wrapperPathParts = wrapperPath.split('/');
    const wrapperName = wrapperPathParts[wrapperPathParts.length - 1];
    if (wrappersToIgnore.includes(wrapperName)) {
      return;
    }
    const testName = `phet-io-${wrapperName}-fuzz`;
    const wrapperQueryParameters = `sim=${repo}&locales=*&phetioWrapperDebug=true&fuzz`;
    if (wrapperName === 'studio') {
      // fuzz test important wrappers
      tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: `studio/?${wrapperQueryParameters}`
      });
    } else if (wrapperName === 'state') {
      // only test state on phet-io sims that support it
      phetioStateSupported && tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: `phet-io-wrappers/state/?${wrapperQueryParameters}&phetioDebug=true`
      });
    } else {
      tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: `phet-io-wrappers/${wrapperName}/?${wrapperQueryParameters}&phetioDebug=true`,
        testQueryParameters: `duration=${wrapperName === 'multi' ? '60000' : '15000'}`
      });
    }
  });
});
interactiveDescriptionRepos.forEach(repo => {
  tests.push({
    test: [repo, 'interactive-description-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzz&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzz-fuzzBoard-combo', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&supportsInteractiveDescription=true&fuzz&fuzzBoard',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzzBoard', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzzBoard&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzz', 'built'],
    type: 'sim-test',
    url: `${repo}/build/phet/${repo}_en_phet.html`,
    queryParameters: 'fuzz&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000',
    brand: 'phet',
    buildDependencies: [repo],
    es5: true
  });
  tests.push({
    test: [repo, 'interactive-description-fuzzBoard', 'built'],
    type: 'sim-test',
    url: `${repo}/build/phet/${repo}_en_phet.html`,
    queryParameters: 'fuzzBoard&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000',
    brand: 'phet',
    buildDependencies: [repo],
    es5: true
  });
});
voicingRepos.forEach(repo => {
  tests.push({
    test: [repo, 'voicing-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzz&voicingInitiallyEnabled',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'voicing-fuzzBoard', 'unbuilt'],
    type: 'sim-test',
    url: `${repo}/${repo}_en.html`,
    queryParameters: 'brand=phet&ea&fuzzBoard&voicingInitiallyEnabled',
    testQueryParameters: 'duration=40000'
  });
});

// repo-specific Unit tests (unbuilt mode) from `grunt generate-test-harness`
unitTestRepos.forEach(repo => {
  // All tests should work with no query parameters, with assertions enabled, and should support PhET-iO also, so test
  // with brand=phet-io
  const queryParameters = ['', '?ea', '?brand=phet-io', '?ea&brand=phet-io'];
  queryParameters.forEach(queryString => {
    // Don't test phet-io or tandem unit tests in phet brand, they are meant for phet-io brand
    if ((repo === 'phet-io' || repo === 'tandem' || repo === 'phet-io-wrappers') && !queryString.includes('phet-io')) {
      return;
    }
    if (repo === 'phet-io-wrappers') {
      queryString += '&sim=gravity-and-orbits';
    }
    tests.push({
      test: [repo, 'top-level-unit-tests', `unbuilt${queryString}`],
      type: 'qunit-test',
      url: `${repo}/${repo}-tests.html${queryString}`
    });
  });
});

// Page-load tests (non-built)
[{
  repo: 'dot',
  urls: ['',
  // the root URL
  'doc/', 'examples/', 'examples/convex-hull-2.html', 'tests/', 'tests/playground.html']
}, {
  repo: 'kite',
  urls: ['',
  // the root URL
  'doc/', 'examples/', 'tests/', 'tests/playground.html', 'tests/visual-shape-test.html']
}, {
  repo: 'scenery',
  urls: ['',
  // the root URL
  'doc/', 'doc/accessibility/accessibility.html', 'doc/accessibility/voicing.html', 'doc/a-tour-of-scenery.html', 'doc/implementation-notes.html', 'doc/layout.html', 'doc/user-input.html', 'examples/', 'examples/creator-pattern.html', 'examples/cursors.html', 'examples/hello-world.html', 'examples/input-multiple-displays.html', 'examples/input.html', 'examples/mouse-wheel.html', 'examples/multi-touch.html', 'examples/nodes.html', 'examples/shapes.html', 'examples/sprites.html', 'examples/accessibility-shapes.html', 'examples/accessibility-button.html', 'examples/accessibility-animation.html', 'examples/accessibility-listeners.html', 'examples/accessibility-updating-pdom.html', 'examples/accessibility-slider.html',
  // 'examples/webglnode.html', // currently disabled, since it fails without webgl
  'tests/', 'tests/playground.html', 'tests/renderer-comparison.html?renderers=canvas,svg,dom', 'tests/sandbox.html', 'tests/text-bounds-comparison.html', 'tests/text-quality-test.html']
}, {
  repo: 'phet-lib',
  urls: ['doc/layout-exemplars.html']
}, {
  repo: 'phet-io-wrappers',
  urls: ['tests/FAMB-2.2-phetio-wrapper-test.html']
}, {
  repo: 'phet-io-website',
  urls: ['root/devguide/', 'root/devguide/api_overview.html', 'root/io-solutions/', 'root/io-features/', 'root/io-solutions/virtual-lab/saturation.html', 'root/io-solutions/online-homework/', 'root/io-solutions/e-textbook/', 'root/io-features/customize.html', 'root/io-features/integrate.html', 'root/io-features/assess.html', 'root/contact/', 'root/about/', 'root/about/team/', 'root/partnerships/', 'root/']
}].forEach(({
  repo,
  urls
}) => {
  urls.forEach(pageloadRelativeURL => {
    tests.push({
      test: [repo, 'pageload', `/${pageloadRelativeURL}`],
      type: 'pageload-test',
      url: `${repo}/${pageloadRelativeURL}`,
      priority: 4 // Fast to test, so test them more
    });
  });
});

// // Page-load tests (built)
// [
//
// ].forEach( ( { repo, urls } ) => {
//   urls.forEach( pageloadRelativeURL => {
//     tests.push( {
//       test: [ repo, 'pageload', `/${pageloadRelativeURL}` ],
//       type: 'pageload-test',
//       url: `${repo}/${pageloadRelativeURL}`,
//       priority: 5, // When these are built, it should be really quick to test
//
//       brand: 'phet',
//       es5: true
//     } );
//   } );
// } );

//----------------------------------------------------------------------------------------------------------------------
// Public query parameter tests
//----------------------------------------------------------------------------------------------------------------------

// test non-default public query parameter values to make sure there are no obvious problems.
const commonQueryParameters = {
  allowLinksFalse: 'brand=phet&fuzz&ea&allowLinks=false',
  screens1: 'brand=phet&fuzz&ea&screens=1',
  screens21: 'brand=phet&fuzz&ea&screens=2,1',
  screens21NoHome: 'brand=phet&fuzz&ea&screens=2,1&homeScreen=false',
  initialScreen2NoHome: 'brand=phet&fuzz&ea&initialScreen=2&homeScreen=false',
  initialScreen2: 'brand=phet&fuzz&ea&initialScreen=2',
  // Purposefully use incorrect syntax to make sure it is caught correctly without crashing
  screensVerbose: 'brand=phet&fuzz&screens=Screen1,Screen2',
  wrongInitialScreen1: 'brand=phet&fuzz&initialScreen=3',
  wrongInitialScreen2: 'brand=phet&fuzz&initialScreen=2&screens=1',
  wrongScreens1: 'brand=phet&fuzz&screens=3',
  wrongScreens2: 'brand=phet&fuzz&screens=1,2,3',
  screensOther: 'brand=phet&fuzz&screens=1.1,Screen2'
};
Object.keys(commonQueryParameters).forEach(name => {
  const queryString = commonQueryParameters[name];

  // randomly picked multi-screen sim to test query parameters (hence calling it a joist test)
  tests.push({
    test: ['joist', 'fuzz', 'unbuilt', 'query-parameters', name],
    type: 'sim-test',
    url: 'acid-base-solutions/acid-base-solutions_en.html',
    queryParameters: queryString
  });
});

/////////////////////////////////////////////////////
// PhET-iO migration testing
phetioHydrogenSims.forEach(testData => {
  const simName = testData.sim;
  const oldVersion = testData.version;
  const getTest = reportContext => {
    return {
      test: [simName, 'migration', `${oldVersion}->main`, reportContext],
      type: 'wrapper-test',
      testQueryParameters: 'duration=80000',
      // Loading 2 studios takes time!
      url: `phet-io-wrappers/migration/?sim=${simName}&oldVersion=${oldVersion}&phetioMigrationReport=${reportContext}` + '&locales=*&phetioDebug=true&phetioWrapperDebug=true&fuzz&migrationRate=5000&'
    };
  };
  tests.push(getTest('assert'));
  tests.push(getTest('dev')); // we still want to support state grace to make sure we don't fail while setting the state.
});
////////////////////////////////////////////

//----------------------------------------------------------------------------------------------------------------------
// Additional sim-specific tests
//----------------------------------------------------------------------------------------------------------------------

// beers-law-lab: test various query parameters
tests.push({
  test: ['beers-law-lab', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'beers-law-lab/beers-law-lab_en.html',
  queryParameters: 'brand=phet&ea&fuzz&showSoluteAmount&concentrationMeterUnits=percent&beakerUnits=milliliters'
});

// circuit-construction-kit-ac: test various query parameters
tests.push({
  test: ['circuit-construction-kit-ac', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'circuit-construction-kit-ac/circuit-construction-kit-ac_en.html',
  // Public query parameters that cannot be triggered from options within the sim
  queryParameters: 'brand=phet&ea&fuzz&showCurrent&addRealBulbs&moreWires&moreInductors'
});

// energy forms and changes: four blocks and one burner
tests.push({
  test: ['energy-forms-and-changes', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'energy-forms-and-changes/energy-forms-and-changes_en.html',
  queryParameters: 'brand=phet&ea&fuzz&screens=1&elements=iron,brick,iron,brick&burners=1'
});

// energy forms and changes: two beakers and 2 burners
tests.push({
  test: ['energy-forms-and-changes', 'fuzz', 'unbuilt', 'query-parameters-2'],
  type: 'sim-test',
  url: 'energy-forms-and-changes/energy-forms-and-changes_en.html',
  queryParameters: 'brand=phet&ea&fuzz&screens=1&&elements=oliveOil,water&burners=2'
});

// gas-properties: test pressureNoise query parameter
tests.push({
  test: ['gas-properties', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'gas-properties/gas-properties_en.html',
  queryParameters: 'brand=phet&ea&fuzz&pressureNoise=false'
});

// natural-selection: test various query parameters
tests.push({
  test: ['natural-selection', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'natural-selection/natural-selection_en.html',
  queryParameters: 'brand=phet&ea&fuzz&allelesVisible=false&introMutations=F&introPopulation=10Ff&labMutations=FeT&labPopulation=2FFeett,2ffEEtt,2ffeeTT'
});

// natural-selection: run the generation clock faster, so that more things are liable to happen
tests.push({
  test: ['natural-selection', 'fuzz', 'unbuilt', 'secondsPerGeneration'],
  type: 'sim-test',
  url: 'natural-selection/natural-selection_en.html',
  queryParameters: 'brand=phet&ea&fuzz&secondsPerGeneration=1'
});

// ph-scale: test the autofill query parameter
tests.push({
  test: ['ph-scale', 'autofill-fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'ph-scale/ph-scale_en.html',
  queryParameters: 'brand=phet&ea&fuzz&autoFill=false'
});

// number-play: test the second language preference
tests.push({
  test: ['number-play', 'second-language-fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'number-play/number-play_en.html',
  queryParameters: 'brand=phet&ea&fuzz&locales=*&secondLocale=es'
});

// number-compare: test the second language preference
tests.push({
  test: ['number-compare', 'second-language-fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'number-compare/number-compare_en.html',
  queryParameters: 'brand=phet&ea&fuzz&locales=*&secondLocale=es'
});

// quadrilateral: tests the public query parameters for configurations that cannot be changed during runtime
tests.push({
  test: ['quadrilateral', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'quadrilateral/quadrilateral_en.html',
  queryParameters: 'brand=phet&ea&fuzz&inheritTrapezoidSound&reducedStepSize'
});

// build-a-nucleus: tests the public query parameters for configurations that cannot be changed during runtime
const decayProtons = Math.floor(Math.random() * 94.99);
const decayNeutrons = Math.floor(Math.random() * 146.99);
const chartIntroProtons = Math.floor(Math.random() * 10.99);
const chartIntroNeutrons = Math.floor(Math.random() * 12.99);
tests.push({
  test: ['build-a-nucleus', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'build-a-nucleus/build-a-nucleus_en.html',
  queryParameters: `brand=phet&ea&fuzz&decayScreenProtons=${decayProtons}&decayScreenNeutrons=${decayNeutrons}&chartIntoScreenProtons=${chartIntroProtons}&chartIntoScreenNeutrons=${chartIntroNeutrons}`
});
tests.push({
  test: ['build-a-nucleus', 'fuzz', 'unbuilt', 'query-parameters-wrong'],
  type: 'sim-test',
  url: 'build-a-nucleus/build-a-nucleus_en.html',
  queryParameters: 'brand=phet&ea&fuzz&decayScreenProtons=200&decayScreenNeutrons=200&chartIntoScreenProtons=200&chartIntoScreenNeutrons=200'
});

// my-solar-system
tests.push({
  test: ['my-solar-system', 'custom-wrapper', 'unbuilt'],
  type: 'wrapper-test',
  testQueryParameters: 'duration=70000',
  // there are multiple systems to play through and fuzz
  url: 'phet-io-sim-specific/repos/my-solar-system/wrappers/my-solar-system-tests/?sim=my-solar-system&phetioDebug=true&phetioWrapperDebug=true'
});
console.log(JSON.stringify(tests, null, 2));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRBY3RpdmVSZXBvcyIsInJlcXVpcmUiLCJnZXRSZXBvTGlzdCIsImZzIiwicmVwb3MiLCJwaGV0aW9SZXBvcyIsInBoZXRpb0FQSVN0YWJsZVJlcG9zIiwicnVubmFibGVSZXBvcyIsImludGVyYWN0aXZlRGVzY3JpcHRpb25SZXBvcyIsInBoZXRpb05vVW5zdXBwb3J0ZWRSZXBvcyIsInVuaXRUZXN0UmVwb3MiLCJ2b2ljaW5nUmVwb3MiLCJwaGV0aW9XcmFwcGVyU3VpdGVXcmFwcGVycyIsInBoZXRpb0h5ZHJvZ2VuU2ltcyIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsInRyaW0iLCJSRVBPU19FWENMVURFRF9GUk9NX01VTFRJVE9VQ0hfRlVaWklORyIsIlJFUE9TX0VYQ0xVREVEX0ZST01fTElTVEVORVJfT1JERVJfUkFORE9NIiwidGVzdHMiLCJwdXNoIiwidGVzdCIsInR5cGUiLCJwcmlvcml0eSIsImZvckVhY2giLCJyZXBvIiwiYnJhbmRzIiwiaW5jbHVkZXMiLCJleGlzdHNTeW5jIiwidXJsIiwicXVlcnlQYXJhbWV0ZXJzIiwidGVzdFF1ZXJ5UGFyYW1ldGVycyIsImJyYW5kIiwiYnVpbGREZXBlbmRlbmNpZXMiLCJlczUiLCJwaGV0aW9TdGF0ZVN1cHBvcnRlZCIsInVzZUFzc2VydCIsIndyYXBwZXJzVG9JZ25vcmUiLCJ3cmFwcGVyUGF0aCIsIndyYXBwZXJQYXRoUGFydHMiLCJzcGxpdCIsIndyYXBwZXJOYW1lIiwibGVuZ3RoIiwidGVzdE5hbWUiLCJ3cmFwcGVyUXVlcnlQYXJhbWV0ZXJzIiwicXVlcnlTdHJpbmciLCJ1cmxzIiwicGFnZWxvYWRSZWxhdGl2ZVVSTCIsImNvbW1vblF1ZXJ5UGFyYW1ldGVycyIsImFsbG93TGlua3NGYWxzZSIsInNjcmVlbnMxIiwic2NyZWVuczIxIiwic2NyZWVuczIxTm9Ib21lIiwiaW5pdGlhbFNjcmVlbjJOb0hvbWUiLCJpbml0aWFsU2NyZWVuMiIsInNjcmVlbnNWZXJib3NlIiwid3JvbmdJbml0aWFsU2NyZWVuMSIsIndyb25nSW5pdGlhbFNjcmVlbjIiLCJ3cm9uZ1NjcmVlbnMxIiwid3JvbmdTY3JlZW5zMiIsInNjcmVlbnNPdGhlciIsIk9iamVjdCIsImtleXMiLCJuYW1lIiwidGVzdERhdGEiLCJzaW1OYW1lIiwic2ltIiwib2xkVmVyc2lvbiIsInZlcnNpb24iLCJnZXRUZXN0IiwicmVwb3J0Q29udGV4dCIsImRlY2F5UHJvdG9ucyIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImRlY2F5TmV1dHJvbnMiLCJjaGFydEludHJvUHJvdG9ucyIsImNoYXJ0SW50cm9OZXV0cm9ucyIsImNvbnNvbGUiLCJsb2ciLCJzdHJpbmdpZnkiXSwic291cmNlcyI6WyJsaXN0Q29udGludW91c1Rlc3RzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGlzIHByaW50cyBvdXQgKGluIEpTT04gZm9ybSkgdGhlIHRlc3RzIGFuZCBvcGVyYXRpb25zIHJlcXVlc3RlZCBmb3IgY29udGludW91cyB0ZXN0aW5nIGZvciB3aGF0ZXZlciBpcyBpbiBtYWluXHJcbiAqIGF0IHRoaXMgcG9pbnQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBnZXRBY3RpdmVSZXBvcyA9IHJlcXVpcmUoICcuL2NvbW1vbi9nZXRBY3RpdmVSZXBvcycgKTtcclxuY29uc3QgZ2V0UmVwb0xpc3QgPSByZXF1aXJlKCAnLi9jb21tb24vZ2V0UmVwb0xpc3QnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuY29uc3QgcmVwb3MgPSBnZXRBY3RpdmVSZXBvcygpO1xyXG5jb25zdCBwaGV0aW9SZXBvcyA9IGdldFJlcG9MaXN0KCAncGhldC1pbycgKTtcclxuY29uc3QgcGhldGlvQVBJU3RhYmxlUmVwb3MgPSBnZXRSZXBvTGlzdCggJ3BoZXQtaW8tYXBpLXN0YWJsZScgKTtcclxuY29uc3QgcnVubmFibGVSZXBvcyA9IGdldFJlcG9MaXN0KCAnYWN0aXZlLXJ1bm5hYmxlcycgKTtcclxuY29uc3QgaW50ZXJhY3RpdmVEZXNjcmlwdGlvblJlcG9zID0gZ2V0UmVwb0xpc3QoICdpbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbicgKTtcclxuY29uc3QgcGhldGlvTm9VbnN1cHBvcnRlZFJlcG9zID0gZ2V0UmVwb0xpc3QoICdwaGV0LWlvLXN0YXRlLXVuc3VwcG9ydGVkJyApO1xyXG5jb25zdCB1bml0VGVzdFJlcG9zID0gZ2V0UmVwb0xpc3QoICd1bml0LXRlc3RzJyApO1xyXG5jb25zdCB2b2ljaW5nUmVwb3MgPSBnZXRSZXBvTGlzdCggJ3ZvaWNpbmcnICk7XHJcbmNvbnN0IHBoZXRpb1dyYXBwZXJTdWl0ZVdyYXBwZXJzID0gZ2V0UmVwb0xpc3QoICd3cmFwcGVycycgKTtcclxuY29uc3QgcGhldGlvSHlkcm9nZW5TaW1zID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCAnLi4vcGVyZW5uaWFsL2RhdGEvcGhldC1pby1oeWRyb2dlbi5qc29uJywgJ3V0ZjgnICkudHJpbSgpICk7XHJcblxyXG4vLyByZXBvcyB0byBub3QgdGVzdCBtdWx0aXRvdWNoIGZ1enppbmdcclxuY29uc3QgUkVQT1NfRVhDTFVERURfRlJPTV9NVUxUSVRPVUNIX0ZVWlpJTkcgPSBbXHJcbiAgJ251bWJlci1jb21wYXJlJyxcclxuICAnbnVtYmVyLXBsYXknXHJcbl07XHJcblxyXG5jb25zdCBSRVBPU19FWENMVURFRF9GUk9NX0xJU1RFTkVSX09SREVSX1JBTkRPTSA9IFtcclxuICAnZGVuc2l0eScsXHJcbiAgJ2J1b3lhbmN5JyxcclxuICAnYnVveWFuY3ktYmFzaWNzJyxcclxuICAnZm91cmllci1tYWtpbmctd2F2ZXMnIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZm91cmllci1tYWtpbmctd2F2ZXMvaXNzdWVzLzI0MFxyXG5dO1xyXG5cclxuLyoqXHJcbiAqIHtBcnJheS48T2JqZWN0Pn0gdGVzdFxyXG4gKiB7c3RyaW5nfSB0eXBlXHJcbiAqIHtzdHJpbmd9IFt1cmxdXHJcbiAqIHtzdHJpbmd9IFtyZXBvXVxyXG4gKiB7c3RyaW5nfSBbcXVlcnlQYXJhbWV0ZXJzXVxyXG4gKiB7c3RyaW5nfSBbdGVzdFF1ZXJ5UGFyYW1ldGVyc11cclxuICoge2Jvb2xlYW59IFtlczVdXHJcbiAqIHtzdHJpbmd9IFticmFuZF1cclxuICoge251bWJlcn0gW3ByaW9yaXR5PTFdIC0gaGlnaGVyIHByaW9yaXRpZXMgYXJlIHRlc3RlZCBtb3JlIGVhZ2VybHlcclxuICoge0FycmF5LjxzdHJpbmc+fSBidWlsZERlcGVuZGVuY2llc1xyXG4gKi9cclxuY29uc3QgdGVzdHMgPSBbXTtcclxuXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICdwZXJlbm5pYWwnLCAnbGludC1ldmVyeXRoaW5nJyBdLFxyXG4gIHR5cGU6ICdsaW50LWV2ZXJ5dGhpbmcnLFxyXG4gIHByaW9yaXR5OiAxMDBcclxufSApO1xyXG5cclxuLy8gcGhldCBhbmQgcGhldC1pbyBicmFuZCBidWlsZHNcclxuW1xyXG4gIC4uLnJ1bm5hYmxlUmVwb3MsXHJcbiAgJ3NjZW5lcnknLFxyXG4gICdraXRlJyxcclxuICAnZG90J1xyXG5dLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2J1aWxkJyBdLFxyXG4gICAgdHlwZTogJ2J1aWxkJyxcclxuICAgIGJyYW5kczogcGhldGlvUmVwb3MuaW5jbHVkZXMoIHJlcG8gKSA/IFsgJ3BoZXQnLCAncGhldC1pbycgXSA6IFsgJ3BoZXQnIF0sXHJcbiAgICByZXBvOiByZXBvLFxyXG4gICAgcHJpb3JpdHk6IDFcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbi8vIGxpbnRzXHJcbnJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gIC8vIFJvc2V0dGEgc3BlY2lmaWVzIHRoZSBsaW50IHRhc2sgYSBiaXQgZGlmZmVyZW50bHksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcm9zZXR0YS9pc3N1ZXMvMzY2XHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS9HcnVudGZpbGUuanNgICkgfHwgcmVwbyA9PT0gJ3Jvc2V0dGEnICkge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdsaW50JyBdLFxyXG4gICAgICB0eXBlOiAnbGludCcsXHJcbiAgICAgIHJlcG86IHJlcG8sXHJcbiAgICAgIHByaW9yaXR5OiA4XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59ICk7XHJcblxyXG5ydW5uYWJsZVJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2Z1enonLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enonLFxyXG4gICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTkwMDAwJyAvLyBUaGlzIGlzIHRoZSBtb3N0IGltcG9ydGFudCB0ZXN0LCBsZXQncyBnZXQgc29tZSBnb29kIGNvdmVyYWdlIVxyXG4gIH0gKTtcclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAneHNzLWZ1enonIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnN0cmluZ1Rlc3Q9eHNzJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj0xMDAwMCcsXHJcbiAgICBwcmlvcml0eTogMC4zXHJcbiAgfSApO1xyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdmdXp6JywgJ3VuYnVpbHQnLCAnYXNzZXJ0U2xvdycgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhbGwmZnV6eicsXHJcbiAgICBwcmlvcml0eTogMC4wMDFcclxuICB9ICk7XHJcblxyXG4gIGlmICggIVJFUE9TX0VYQ0xVREVEX0ZST01fTElTVEVORVJfT1JERVJfUkFORE9NLmluY2x1ZGVzKCByZXBvICkgKSB7XHJcbiAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgIHRlc3Q6IFsgcmVwbywgJ2Z1enonLCAndW5idWlsdCcsICdsaXN0ZW5lck9yZGVyUmFuZG9tJyBdLFxyXG4gICAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZsaXN0ZW5lck9yZGVyPXJhbmRvbScsXHJcbiAgICAgIHByaW9yaXR5OiAwLjNcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8vIGRvbid0IHRlc3Qgc2VsZWN0IHJlcG9zIGZvciBmdXp6UG9pbnRlcnM9MlxyXG4gIGlmICggIVJFUE9TX0VYQ0xVREVEX0ZST01fTVVMVElUT1VDSF9GVVpaSU5HLmluY2x1ZGVzKCByZXBvICkgKSB7XHJcbiAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgIHRlc3Q6IFsgcmVwbywgJ211bHRpdG91Y2gtZnV6eicsICd1bmJ1aWx0JyBdLFxyXG4gICAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZmdXp6UG9pbnRlcnM9MiZzdXBwb3J0c1BhbkFuZFpvb209ZmFsc2UnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdwYW4tYW5kLXpvb20tZnV6eicsICd1bmJ1aWx0JyBdLFxyXG4gICAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZmdXp6UG9pbnRlcnM9MiZzdXBwb3J0c1BhbkFuZFpvb209dHJ1ZScsXHJcbiAgICAgIHByaW9yaXR5OiAwLjUgLy8gdGVzdCB0aGlzIHdoZW4gdGhlcmUgaXNuJ3Qgb3RoZXIgd29yayB0byBiZSBkb25lXHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdmdXp6JywgJ2J1aWx0JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vYnVpbGQvcGhldC8ke3JlcG99X2VuX3BoZXQuaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdmdXp6JyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj04MDAwMCcsXHJcblxyXG4gICAgLy8gV2Ugd2FudCB0byBlbGV2YXRlIHRoZSBwcmlvcml0eSBzbyB0aGF0IHdlIGdldCBhIG1vcmUgZXZlbiBiYWxhbmNlICh3ZSBjYW4ndCB0ZXN0IHRoZXNlIHVudGlsIHRoZXkgYXJlIGJ1aWx0LFxyXG4gICAgLy8gd2hpY2ggZG9lc24ndCBoYXBwZW4gYWx3YXlzKVxyXG4gICAgcHJpb3JpdHk6IDIsXHJcblxyXG4gICAgYnJhbmQ6ICdwaGV0JyxcclxuICAgIGJ1aWxkRGVwZW5kZW5jaWVzOiBbIHJlcG8gXSxcclxuICAgIGVzNTogdHJ1ZVxyXG4gIH0gKTtcclxuXHJcbiAgaWYgKCBwaGV0aW9SZXBvcy5pbmNsdWRlcyggcmVwbyApICkge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdmdXp6JywgJ2J1aWx0LXBoZXQtaW8nIF0sXHJcbiAgICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICAgIHVybDogYCR7cmVwb30vYnVpbGQvcGhldC1pby8ke3JlcG99X2FsbF9waGV0LWlvLmh0bWxgLFxyXG4gICAgICBxdWVyeVBhcmFtZXRlcnM6ICdmdXp6JnBoZXRpb1N0YW5kYWxvbmUnLFxyXG4gICAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249ODAwMDAnLFxyXG5cclxuICAgICAgYnJhbmQ6ICdwaGV0LWlvJyxcclxuICAgICAgYnVpbGREZXBlbmRlbmNpZXM6IFsgcmVwbyBdLFxyXG4gICAgICBlczU6IHRydWVcclxuICAgIH0gKTtcclxuICB9XHJcbn0gKTtcclxuXHJcbnBoZXRpb1JlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdwaGV0LWlvLWZ1enonLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdlYSZicmFuZD1waGV0LWlvJnBoZXRpb1N0YW5kYWxvbmUmZnV6eidcclxuICB9ICk7XHJcblxyXG4gIC8vIFRlc3QgZm9yIEFQSSBjb21wYXRpYmlsaXR5LCBmb3Igc2ltcyB0aGF0IHN1cHBvcnQgaXRcclxuICBwaGV0aW9BUElTdGFibGVSZXBvcy5pbmNsdWRlcyggcmVwbyApICYmIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ3BoZXQtaW8tYXBpLWNvbXBhdGliaWxpdHknLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdlYSZicmFuZD1waGV0LWlvJnBoZXRpb1N0YW5kYWxvbmUmcGhldGlvQ29tcGFyZUFQSSZyYW5kb21TZWVkPTMzMjIxMSZsb2NhbGVzPSomd2ViZ2w9ZmFsc2UnLCAvLyBOT1RFOiBEVVBMSUNBVElPTiBBTEVSVDogcmFuZG9tIHNlZWQgbXVzdCBtYXRjaCB0aGF0IG9mIEFQSSBnZW5lcmF0aW9uLCBzZWUgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSS5qc1xyXG4gICAgcHJpb3JpdHk6IDEuNSAvLyBtb3JlIG9mdGVuIHRoYW4gdGhlIGF2ZXJhZ2UgdGVzdFxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcGhldGlvU3RhdGVTdXBwb3J0ZWQgPSAhcGhldGlvTm9VbnN1cHBvcnRlZFJlcG9zLmluY2x1ZGVzKCByZXBvICk7XHJcblxyXG4gIC8vIHBoZXQtaW8gd3JhcHBlcnMgdGVzdHMgZm9yIGVhY2ggUGhFVC1pTyBTaW0sIHRoZXNlIHRlc3RzIHJlbHkgb24gcGhldC1pbyBzdGF0ZSB3b3JraW5nXHJcbiAgcGhldGlvU3RhdGVTdXBwb3J0ZWQgJiYgWyBmYWxzZSwgdHJ1ZSBdLmZvckVhY2goIHVzZUFzc2VydCA9PiB7XHJcbiAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgIHRlc3Q6IFsgcmVwbywgJ3BoZXQtaW8td3JhcHBlcnMtdGVzdHMnLCB1c2VBc3NlcnQgPyAnYXNzZXJ0JyA6ICduby1hc3NlcnQnIF0sXHJcbiAgICAgIHR5cGU6ICdxdW5pdC10ZXN0JyxcclxuICAgICAgdXJsOiBgcGhldC1pby13cmFwcGVycy9waGV0LWlvLXdyYXBwZXJzLXRlc3RzLmh0bWw/c2ltPSR7cmVwb30ke3VzZUFzc2VydCA/ICcmcGhldGlvRGVidWc9dHJ1ZSZwaGV0aW9XcmFwcGVyRGVidWc9dHJ1ZScgOiAnJ31gLFxyXG4gICAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NjAwMDAwJyAvLyBwaGV0LWlvLXdyYXBwZXIgdGVzdHMgbG9hZCB0aGUgc2ltID41IHRpbWVzXHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCB3cmFwcGVyc1RvSWdub3JlID0gWyAnbWlncmF0aW9uJywgJ3BsYXliYWNrJywgJ2xvZ2luJywgJ2lucHV0LXJlY29yZC1hbmQtcGxheWJhY2snIF07XHJcblxyXG4gIHBoZXRpb1dyYXBwZXJTdWl0ZVdyYXBwZXJzLmZvckVhY2goIHdyYXBwZXJQYXRoID0+IHtcclxuXHJcbiAgICBjb25zdCB3cmFwcGVyUGF0aFBhcnRzID0gd3JhcHBlclBhdGguc3BsaXQoICcvJyApO1xyXG4gICAgY29uc3Qgd3JhcHBlck5hbWUgPSB3cmFwcGVyUGF0aFBhcnRzWyB3cmFwcGVyUGF0aFBhcnRzLmxlbmd0aCAtIDEgXTtcclxuXHJcbiAgICBpZiAoIHdyYXBwZXJzVG9JZ25vcmUuaW5jbHVkZXMoIHdyYXBwZXJOYW1lICkgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0ZXN0TmFtZSA9IGBwaGV0LWlvLSR7d3JhcHBlck5hbWV9LWZ1enpgO1xyXG4gICAgY29uc3Qgd3JhcHBlclF1ZXJ5UGFyYW1ldGVycyA9IGBzaW09JHtyZXBvfSZsb2NhbGVzPSomcGhldGlvV3JhcHBlckRlYnVnPXRydWUmZnV6emA7XHJcblxyXG4gICAgaWYgKCB3cmFwcGVyTmFtZSA9PT0gJ3N0dWRpbycgKSB7XHJcblxyXG4gICAgICAvLyBmdXp6IHRlc3QgaW1wb3J0YW50IHdyYXBwZXJzXHJcbiAgICAgIHRlc3RzLnB1c2goIHtcclxuICAgICAgICB0ZXN0OiBbIHJlcG8sIHRlc3ROYW1lLCAndW5idWlsdCcgXSxcclxuICAgICAgICB0eXBlOiAnd3JhcHBlci10ZXN0JyxcclxuICAgICAgICB1cmw6IGBzdHVkaW8vPyR7d3JhcHBlclF1ZXJ5UGFyYW1ldGVyc31gXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB3cmFwcGVyTmFtZSA9PT0gJ3N0YXRlJyApIHtcclxuXHJcbiAgICAgIC8vIG9ubHkgdGVzdCBzdGF0ZSBvbiBwaGV0LWlvIHNpbXMgdGhhdCBzdXBwb3J0IGl0XHJcbiAgICAgIHBoZXRpb1N0YXRlU3VwcG9ydGVkICYmIHRlc3RzLnB1c2goIHtcclxuICAgICAgICB0ZXN0OiBbIHJlcG8sIHRlc3ROYW1lLCAndW5idWlsdCcgXSxcclxuICAgICAgICB0eXBlOiAnd3JhcHBlci10ZXN0JyxcclxuICAgICAgICB1cmw6IGBwaGV0LWlvLXdyYXBwZXJzL3N0YXRlLz8ke3dyYXBwZXJRdWVyeVBhcmFtZXRlcnN9JnBoZXRpb0RlYnVnPXRydWVgXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgICAgdGVzdDogWyByZXBvLCB0ZXN0TmFtZSwgJ3VuYnVpbHQnIF0sXHJcbiAgICAgICAgdHlwZTogJ3dyYXBwZXItdGVzdCcsXHJcbiAgICAgICAgdXJsOiBgcGhldC1pby13cmFwcGVycy8ke3dyYXBwZXJOYW1lfS8/JHt3cmFwcGVyUXVlcnlQYXJhbWV0ZXJzfSZwaGV0aW9EZWJ1Zz10cnVlYCxcclxuICAgICAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiBgZHVyYXRpb249JHt3cmFwcGVyTmFtZSA9PT0gJ211bHRpJyA/ICc2MDAwMCcgOiAnMTUwMDAnfWBcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxufSApO1xyXG5cclxuaW50ZXJhY3RpdmVEZXNjcmlwdGlvblJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2ludGVyYWN0aXZlLWRlc2NyaXB0aW9uLWZ1enonLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uPXRydWUnLFxyXG4gICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTQwMDAwJ1xyXG4gIH0gKTtcclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAnaW50ZXJhY3RpdmUtZGVzY3JpcHRpb24tZnV6ei1mdXp6Qm9hcmQtY29tYm8nLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbj10cnVlJmZ1enomZnV6ekJvYXJkJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCdcclxuICB9ICk7XHJcblxyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2ludGVyYWN0aXZlLWRlc2NyaXB0aW9uLWZ1enpCb2FyZCcsICd1bmJ1aWx0JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vJHtyZXBvfV9lbi5odG1sYCxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6ekJvYXJkJnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbj10cnVlJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCdcclxuICB9ICk7XHJcblxyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2ludGVyYWN0aXZlLWRlc2NyaXB0aW9uLWZ1enonLCAnYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS9idWlsZC9waGV0LyR7cmVwb31fZW5fcGhldC5odG1sYCxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2Z1enomc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uPXRydWUnLFxyXG4gICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTQwMDAwJyxcclxuXHJcbiAgICBicmFuZDogJ3BoZXQnLFxyXG4gICAgYnVpbGREZXBlbmRlbmNpZXM6IFsgcmVwbyBdLFxyXG4gICAgZXM1OiB0cnVlXHJcbiAgfSApO1xyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdpbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbi1mdXp6Qm9hcmQnLCAnYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS9idWlsZC9waGV0LyR7cmVwb31fZW5fcGhldC5odG1sYCxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2Z1enpCb2FyZCZzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb249dHJ1ZScsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NDAwMDAnLFxyXG5cclxuICAgIGJyYW5kOiAncGhldCcsXHJcbiAgICBidWlsZERlcGVuZGVuY2llczogWyByZXBvIF0sXHJcbiAgICBlczU6IHRydWVcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbnZvaWNpbmdSZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICd2b2ljaW5nLWZ1enonLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomdm9pY2luZ0luaXRpYWxseUVuYWJsZWQnLFxyXG4gICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTQwMDAwJ1xyXG4gIH0gKTtcclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICd2b2ljaW5nLWZ1enpCb2FyZCcsICd1bmJ1aWx0JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vJHtyZXBvfV9lbi5odG1sYCxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6ekJvYXJkJnZvaWNpbmdJbml0aWFsbHlFbmFibGVkJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCdcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbi8vIHJlcG8tc3BlY2lmaWMgVW5pdCB0ZXN0cyAodW5idWlsdCBtb2RlKSBmcm9tIGBncnVudCBnZW5lcmF0ZS10ZXN0LWhhcm5lc3NgXHJcbnVuaXRUZXN0UmVwb3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcblxyXG4gIC8vIEFsbCB0ZXN0cyBzaG91bGQgd29yayB3aXRoIG5vIHF1ZXJ5IHBhcmFtZXRlcnMsIHdpdGggYXNzZXJ0aW9ucyBlbmFibGVkLCBhbmQgc2hvdWxkIHN1cHBvcnQgUGhFVC1pTyBhbHNvLCBzbyB0ZXN0XHJcbiAgLy8gd2l0aCBicmFuZD1waGV0LWlvXHJcbiAgY29uc3QgcXVlcnlQYXJhbWV0ZXJzID0gWyAnJywgJz9lYScsICc/YnJhbmQ9cGhldC1pbycsICc/ZWEmYnJhbmQ9cGhldC1pbycgXTtcclxuICBxdWVyeVBhcmFtZXRlcnMuZm9yRWFjaCggcXVlcnlTdHJpbmcgPT4ge1xyXG5cclxuICAgIC8vIERvbid0IHRlc3QgcGhldC1pbyBvciB0YW5kZW0gdW5pdCB0ZXN0cyBpbiBwaGV0IGJyYW5kLCB0aGV5IGFyZSBtZWFudCBmb3IgcGhldC1pbyBicmFuZFxyXG4gICAgaWYgKCAoIHJlcG8gPT09ICdwaGV0LWlvJyB8fCByZXBvID09PSAndGFuZGVtJyB8fCByZXBvID09PSAncGhldC1pby13cmFwcGVycycgKSAmJiAhcXVlcnlTdHJpbmcuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoIHJlcG8gPT09ICdwaGV0LWlvLXdyYXBwZXJzJyApIHtcclxuICAgICAgcXVlcnlTdHJpbmcgKz0gJyZzaW09Z3Jhdml0eS1hbmQtb3JiaXRzJztcclxuICAgIH1cclxuICAgIHRlc3RzLnB1c2goIHtcclxuICAgICAgdGVzdDogWyByZXBvLCAndG9wLWxldmVsLXVuaXQtdGVzdHMnLCBgdW5idWlsdCR7cXVlcnlTdHJpbmd9YCBdLFxyXG4gICAgICB0eXBlOiAncXVuaXQtdGVzdCcsXHJcbiAgICAgIHVybDogYCR7cmVwb30vJHtyZXBvfS10ZXN0cy5odG1sJHtxdWVyeVN0cmluZ31gXHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59ICk7XHJcblxyXG4vLyBQYWdlLWxvYWQgdGVzdHMgKG5vbi1idWlsdClcclxuWyB7XHJcbiAgcmVwbzogJ2RvdCcsXHJcbiAgdXJsczogW1xyXG4gICAgJycsIC8vIHRoZSByb290IFVSTFxyXG4gICAgJ2RvYy8nLFxyXG4gICAgJ2V4YW1wbGVzLycsXHJcbiAgICAnZXhhbXBsZXMvY29udmV4LWh1bGwtMi5odG1sJyxcclxuICAgICd0ZXN0cy8nLFxyXG4gICAgJ3Rlc3RzL3BsYXlncm91bmQuaHRtbCdcclxuICBdXHJcbn0sIHtcclxuICByZXBvOiAna2l0ZScsXHJcbiAgdXJsczogW1xyXG4gICAgJycsIC8vIHRoZSByb290IFVSTFxyXG4gICAgJ2RvYy8nLFxyXG4gICAgJ2V4YW1wbGVzLycsXHJcbiAgICAndGVzdHMvJyxcclxuICAgICd0ZXN0cy9wbGF5Z3JvdW5kLmh0bWwnLFxyXG4gICAgJ3Rlc3RzL3Zpc3VhbC1zaGFwZS10ZXN0Lmh0bWwnXHJcbiAgXVxyXG59LCB7XHJcbiAgcmVwbzogJ3NjZW5lcnknLFxyXG4gIHVybHM6IFtcclxuICAgICcnLCAvLyB0aGUgcm9vdCBVUkxcclxuICAgICdkb2MvJyxcclxuICAgICdkb2MvYWNjZXNzaWJpbGl0eS9hY2Nlc3NpYmlsaXR5Lmh0bWwnLFxyXG4gICAgJ2RvYy9hY2Nlc3NpYmlsaXR5L3ZvaWNpbmcuaHRtbCcsXHJcbiAgICAnZG9jL2EtdG91ci1vZi1zY2VuZXJ5Lmh0bWwnLFxyXG4gICAgJ2RvYy9pbXBsZW1lbnRhdGlvbi1ub3Rlcy5odG1sJyxcclxuICAgICdkb2MvbGF5b3V0Lmh0bWwnLFxyXG4gICAgJ2RvYy91c2VyLWlucHV0Lmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzLycsXHJcbiAgICAnZXhhbXBsZXMvY3JlYXRvci1wYXR0ZXJuLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2N1cnNvcnMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvaGVsbG8td29ybGQuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvaW5wdXQtbXVsdGlwbGUtZGlzcGxheXMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvaW5wdXQuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvbW91c2Utd2hlZWwuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvbXVsdGktdG91Y2guaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvbm9kZXMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvc2hhcGVzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL3Nwcml0ZXMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvYWNjZXNzaWJpbGl0eS1zaGFwZXMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvYWNjZXNzaWJpbGl0eS1idXR0b24uaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvYWNjZXNzaWJpbGl0eS1hbmltYXRpb24uaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvYWNjZXNzaWJpbGl0eS1saXN0ZW5lcnMuaHRtbCcsXHJcbiAgICAnZXhhbXBsZXMvYWNjZXNzaWJpbGl0eS11cGRhdGluZy1wZG9tLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktc2xpZGVyLmh0bWwnLFxyXG4gICAgLy8gJ2V4YW1wbGVzL3dlYmdsbm9kZS5odG1sJywgLy8gY3VycmVudGx5IGRpc2FibGVkLCBzaW5jZSBpdCBmYWlscyB3aXRob3V0IHdlYmdsXHJcbiAgICAndGVzdHMvJyxcclxuICAgICd0ZXN0cy9wbGF5Z3JvdW5kLmh0bWwnLFxyXG4gICAgJ3Rlc3RzL3JlbmRlcmVyLWNvbXBhcmlzb24uaHRtbD9yZW5kZXJlcnM9Y2FudmFzLHN2Zyxkb20nLFxyXG4gICAgJ3Rlc3RzL3NhbmRib3guaHRtbCcsXHJcbiAgICAndGVzdHMvdGV4dC1ib3VuZHMtY29tcGFyaXNvbi5odG1sJyxcclxuICAgICd0ZXN0cy90ZXh0LXF1YWxpdHktdGVzdC5odG1sJ1xyXG4gIF1cclxufSwge1xyXG4gIHJlcG86ICdwaGV0LWxpYicsXHJcbiAgdXJsczogW1xyXG4gICAgJ2RvYy9sYXlvdXQtZXhlbXBsYXJzLmh0bWwnXHJcbiAgXVxyXG59LCB7XHJcbiAgcmVwbzogJ3BoZXQtaW8td3JhcHBlcnMnLFxyXG4gIHVybHM6IFtcclxuICAgICd0ZXN0cy9GQU1CLTIuMi1waGV0aW8td3JhcHBlci10ZXN0Lmh0bWwnXHJcbiAgXVxyXG59LCB7XHJcbiAgcmVwbzogJ3BoZXQtaW8td2Vic2l0ZScsXHJcbiAgdXJsczogW1xyXG4gICAgJ3Jvb3QvZGV2Z3VpZGUvJyxcclxuICAgICdyb290L2Rldmd1aWRlL2FwaV9vdmVydmlldy5odG1sJyxcclxuICAgICdyb290L2lvLXNvbHV0aW9ucy8nLFxyXG4gICAgJ3Jvb3QvaW8tZmVhdHVyZXMvJyxcclxuICAgICdyb290L2lvLXNvbHV0aW9ucy92aXJ0dWFsLWxhYi9zYXR1cmF0aW9uLmh0bWwnLFxyXG4gICAgJ3Jvb3QvaW8tc29sdXRpb25zL29ubGluZS1ob21ld29yay8nLFxyXG4gICAgJ3Jvb3QvaW8tc29sdXRpb25zL2UtdGV4dGJvb2svJyxcclxuICAgICdyb290L2lvLWZlYXR1cmVzL2N1c3RvbWl6ZS5odG1sJyxcclxuICAgICdyb290L2lvLWZlYXR1cmVzL2ludGVncmF0ZS5odG1sJyxcclxuICAgICdyb290L2lvLWZlYXR1cmVzL2Fzc2Vzcy5odG1sJyxcclxuICAgICdyb290L2NvbnRhY3QvJyxcclxuICAgICdyb290L2Fib3V0LycsXHJcbiAgICAncm9vdC9hYm91dC90ZWFtLycsXHJcbiAgICAncm9vdC9wYXJ0bmVyc2hpcHMvJyxcclxuICAgICdyb290LydcclxuICBdXHJcbn0gXS5mb3JFYWNoKCAoIHsgcmVwbywgdXJscyB9ICkgPT4ge1xyXG4gIHVybHMuZm9yRWFjaCggcGFnZWxvYWRSZWxhdGl2ZVVSTCA9PiB7XHJcbiAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgIHRlc3Q6IFsgcmVwbywgJ3BhZ2Vsb2FkJywgYC8ke3BhZ2Vsb2FkUmVsYXRpdmVVUkx9YCBdLFxyXG4gICAgICB0eXBlOiAncGFnZWxvYWQtdGVzdCcsXHJcbiAgICAgIHVybDogYCR7cmVwb30vJHtwYWdlbG9hZFJlbGF0aXZlVVJMfWAsXHJcbiAgICAgIHByaW9yaXR5OiA0IC8vIEZhc3QgdG8gdGVzdCwgc28gdGVzdCB0aGVtIG1vcmVcclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbi8vIC8vIFBhZ2UtbG9hZCB0ZXN0cyAoYnVpbHQpXHJcbi8vIFtcclxuLy9cclxuLy8gXS5mb3JFYWNoKCAoIHsgcmVwbywgdXJscyB9ICkgPT4ge1xyXG4vLyAgIHVybHMuZm9yRWFjaCggcGFnZWxvYWRSZWxhdGl2ZVVSTCA9PiB7XHJcbi8vICAgICB0ZXN0cy5wdXNoKCB7XHJcbi8vICAgICAgIHRlc3Q6IFsgcmVwbywgJ3BhZ2Vsb2FkJywgYC8ke3BhZ2Vsb2FkUmVsYXRpdmVVUkx9YCBdLFxyXG4vLyAgICAgICB0eXBlOiAncGFnZWxvYWQtdGVzdCcsXHJcbi8vICAgICAgIHVybDogYCR7cmVwb30vJHtwYWdlbG9hZFJlbGF0aXZlVVJMfWAsXHJcbi8vICAgICAgIHByaW9yaXR5OiA1LCAvLyBXaGVuIHRoZXNlIGFyZSBidWlsdCwgaXQgc2hvdWxkIGJlIHJlYWxseSBxdWljayB0byB0ZXN0XHJcbi8vXHJcbi8vICAgICAgIGJyYW5kOiAncGhldCcsXHJcbi8vICAgICAgIGVzNTogdHJ1ZVxyXG4vLyAgICAgfSApO1xyXG4vLyAgIH0gKTtcclxuLy8gfSApO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIFB1YmxpYyBxdWVyeSBwYXJhbWV0ZXIgdGVzdHNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4vLyB0ZXN0IG5vbi1kZWZhdWx0IHB1YmxpYyBxdWVyeSBwYXJhbWV0ZXIgdmFsdWVzIHRvIG1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb2J2aW91cyBwcm9ibGVtcy5cclxuY29uc3QgY29tbW9uUXVlcnlQYXJhbWV0ZXJzID0ge1xyXG4gIGFsbG93TGlua3NGYWxzZTogJ2JyYW5kPXBoZXQmZnV6eiZlYSZhbGxvd0xpbmtzPWZhbHNlJyxcclxuICBzY3JlZW5zMTogJ2JyYW5kPXBoZXQmZnV6eiZlYSZzY3JlZW5zPTEnLFxyXG4gIHNjcmVlbnMyMTogJ2JyYW5kPXBoZXQmZnV6eiZlYSZzY3JlZW5zPTIsMScsXHJcbiAgc2NyZWVuczIxTm9Ib21lOiAnYnJhbmQ9cGhldCZmdXp6JmVhJnNjcmVlbnM9MiwxJmhvbWVTY3JlZW49ZmFsc2UnLFxyXG4gIGluaXRpYWxTY3JlZW4yTm9Ib21lOiAnYnJhbmQ9cGhldCZmdXp6JmVhJmluaXRpYWxTY3JlZW49MiZob21lU2NyZWVuPWZhbHNlJyxcclxuICBpbml0aWFsU2NyZWVuMjogJ2JyYW5kPXBoZXQmZnV6eiZlYSZpbml0aWFsU2NyZWVuPTInLFxyXG5cclxuICAvLyBQdXJwb3NlZnVsbHkgdXNlIGluY29ycmVjdCBzeW50YXggdG8gbWFrZSBzdXJlIGl0IGlzIGNhdWdodCBjb3JyZWN0bHkgd2l0aG91dCBjcmFzaGluZ1xyXG4gIHNjcmVlbnNWZXJib3NlOiAnYnJhbmQ9cGhldCZmdXp6JnNjcmVlbnM9U2NyZWVuMSxTY3JlZW4yJyxcclxuICB3cm9uZ0luaXRpYWxTY3JlZW4xOiAnYnJhbmQ9cGhldCZmdXp6JmluaXRpYWxTY3JlZW49MycsXHJcbiAgd3JvbmdJbml0aWFsU2NyZWVuMjogJ2JyYW5kPXBoZXQmZnV6eiZpbml0aWFsU2NyZWVuPTImc2NyZWVucz0xJyxcclxuICB3cm9uZ1NjcmVlbnMxOiAnYnJhbmQ9cGhldCZmdXp6JnNjcmVlbnM9MycsXHJcbiAgd3JvbmdTY3JlZW5zMjogJ2JyYW5kPXBoZXQmZnV6eiZzY3JlZW5zPTEsMiwzJyxcclxuICBzY3JlZW5zT3RoZXI6ICdicmFuZD1waGV0JmZ1enomc2NyZWVucz0xLjEsU2NyZWVuMidcclxufTtcclxuT2JqZWN0LmtleXMoIGNvbW1vblF1ZXJ5UGFyYW1ldGVycyApLmZvckVhY2goIG5hbWUgPT4ge1xyXG4gIGNvbnN0IHF1ZXJ5U3RyaW5nID0gY29tbW9uUXVlcnlQYXJhbWV0ZXJzWyBuYW1lIF07XHJcblxyXG4gIC8vIHJhbmRvbWx5IHBpY2tlZCBtdWx0aS1zY3JlZW4gc2ltIHRvIHRlc3QgcXVlcnkgcGFyYW1ldGVycyAoaGVuY2UgY2FsbGluZyBpdCBhIGpvaXN0IHRlc3QpXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyAnam9pc3QnLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnLCBuYW1lIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiAnYWNpZC1iYXNlLXNvbHV0aW9ucy9hY2lkLWJhc2Utc29sdXRpb25zX2VuLmh0bWwnLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiBxdWVyeVN0cmluZ1xyXG4gIH0gKTtcclxufSApO1xyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gUGhFVC1pTyBtaWdyYXRpb24gdGVzdGluZ1xyXG5waGV0aW9IeWRyb2dlblNpbXMuZm9yRWFjaCggdGVzdERhdGEgPT4ge1xyXG4gIGNvbnN0IHNpbU5hbWUgPSB0ZXN0RGF0YS5zaW07XHJcbiAgY29uc3Qgb2xkVmVyc2lvbiA9IHRlc3REYXRhLnZlcnNpb247XHJcbiAgY29uc3QgZ2V0VGVzdCA9IHJlcG9ydENvbnRleHQgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVzdDogWyBzaW1OYW1lLCAnbWlncmF0aW9uJywgYCR7b2xkVmVyc2lvbn0tPm1haW5gLCByZXBvcnRDb250ZXh0IF0sXHJcbiAgICAgIHR5cGU6ICd3cmFwcGVyLXRlc3QnLFxyXG4gICAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249ODAwMDAnLCAvLyBMb2FkaW5nIDIgc3R1ZGlvcyB0YWtlcyB0aW1lIVxyXG4gICAgICB1cmw6IGBwaGV0LWlvLXdyYXBwZXJzL21pZ3JhdGlvbi8/c2ltPSR7c2ltTmFtZX0mb2xkVmVyc2lvbj0ke29sZFZlcnNpb259JnBoZXRpb01pZ3JhdGlvblJlcG9ydD0ke3JlcG9ydENvbnRleHR9YCArXHJcbiAgICAgICAgICAgJyZsb2NhbGVzPSomcGhldGlvRGVidWc9dHJ1ZSZwaGV0aW9XcmFwcGVyRGVidWc9dHJ1ZSZmdXp6Jm1pZ3JhdGlvblJhdGU9NTAwMCYnXHJcbiAgICB9O1xyXG4gIH07XHJcbiAgdGVzdHMucHVzaCggZ2V0VGVzdCggJ2Fzc2VydCcgKSApO1xyXG4gIHRlc3RzLnB1c2goIGdldFRlc3QoICdkZXYnICkgKTsgLy8gd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0IHN0YXRlIGdyYWNlIHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBmYWlsIHdoaWxlIHNldHRpbmcgdGhlIHN0YXRlLlxyXG59ICk7XHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gQWRkaXRpb25hbCBzaW0tc3BlY2lmaWMgdGVzdHNcclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4vLyBiZWVycy1sYXctbGFiOiB0ZXN0IHZhcmlvdXMgcXVlcnkgcGFyYW1ldGVyc1xyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnYmVlcnMtbGF3LWxhYicsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ2JlZXJzLWxhdy1sYWIvYmVlcnMtbGF3LWxhYl9lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomc2hvd1NvbHV0ZUFtb3VudCZjb25jZW50cmF0aW9uTWV0ZXJVbml0cz1wZXJjZW50JmJlYWtlclVuaXRzPW1pbGxpbGl0ZXJzJ1xyXG59ICk7XHJcblxyXG4vLyBjaXJjdWl0LWNvbnN0cnVjdGlvbi1raXQtYWM6IHRlc3QgdmFyaW91cyBxdWVyeSBwYXJhbWV0ZXJzXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICdjaXJjdWl0LWNvbnN0cnVjdGlvbi1raXQtYWMnLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdjaXJjdWl0LWNvbnN0cnVjdGlvbi1raXQtYWMvY2lyY3VpdC1jb25zdHJ1Y3Rpb24ta2l0LWFjX2VuLmh0bWwnLFxyXG5cclxuICAvLyBQdWJsaWMgcXVlcnkgcGFyYW1ldGVycyB0aGF0IGNhbm5vdCBiZSB0cmlnZ2VyZWQgZnJvbSBvcHRpb25zIHdpdGhpbiB0aGUgc2ltXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnNob3dDdXJyZW50JmFkZFJlYWxCdWxicyZtb3JlV2lyZXMmbW9yZUluZHVjdG9ycydcclxufSApO1xyXG5cclxuLy8gZW5lcmd5IGZvcm1zIGFuZCBjaGFuZ2VzOiBmb3VyIGJsb2NrcyBhbmQgb25lIGJ1cm5lclxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzL2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlc19lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomc2NyZWVucz0xJmVsZW1lbnRzPWlyb24sYnJpY2ssaXJvbixicmljayZidXJuZXJzPTEnXHJcbn0gKTtcclxuXHJcbi8vIGVuZXJneSBmb3JtcyBhbmQgY2hhbmdlczogdHdvIGJlYWtlcnMgYW5kIDIgYnVybmVyc1xyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzLTInIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdlbmVyZ3ktZm9ybXMtYW5kLWNoYW5nZXMvZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzX2VuLmh0bWwnLFxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZzY3JlZW5zPTEmJmVsZW1lbnRzPW9saXZlT2lsLHdhdGVyJmJ1cm5lcnM9MidcclxufSApO1xyXG5cclxuLy8gZ2FzLXByb3BlcnRpZXM6IHRlc3QgcHJlc3N1cmVOb2lzZSBxdWVyeSBwYXJhbWV0ZXJcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ2dhcy1wcm9wZXJ0aWVzJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnZ2FzLXByb3BlcnRpZXMvZ2FzLXByb3BlcnRpZXNfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnByZXNzdXJlTm9pc2U9ZmFsc2UnXHJcbn0gKTtcclxuXHJcbi8vIG5hdHVyYWwtc2VsZWN0aW9uOiB0ZXN0IHZhcmlvdXMgcXVlcnkgcGFyYW1ldGVyc1xyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnbmF0dXJhbC1zZWxlY3Rpb24nLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICduYXR1cmFsLXNlbGVjdGlvbi9uYXR1cmFsLXNlbGVjdGlvbl9lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomYWxsZWxlc1Zpc2libGU9ZmFsc2UmaW50cm9NdXRhdGlvbnM9RiZpbnRyb1BvcHVsYXRpb249MTBGZiZsYWJNdXRhdGlvbnM9RmVUJmxhYlBvcHVsYXRpb249MkZGZWV0dCwyZmZFRXR0LDJmZmVlVFQnXHJcbn0gKTtcclxuXHJcbi8vIG5hdHVyYWwtc2VsZWN0aW9uOiBydW4gdGhlIGdlbmVyYXRpb24gY2xvY2sgZmFzdGVyLCBzbyB0aGF0IG1vcmUgdGhpbmdzIGFyZSBsaWFibGUgdG8gaGFwcGVuXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICduYXR1cmFsLXNlbGVjdGlvbicsICdmdXp6JywgJ3VuYnVpbHQnLCAnc2Vjb25kc1BlckdlbmVyYXRpb24nIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICduYXR1cmFsLXNlbGVjdGlvbi9uYXR1cmFsLXNlbGVjdGlvbl9lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomc2Vjb25kc1BlckdlbmVyYXRpb249MSdcclxufSApO1xyXG5cclxuLy8gcGgtc2NhbGU6IHRlc3QgdGhlIGF1dG9maWxsIHF1ZXJ5IHBhcmFtZXRlclxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAncGgtc2NhbGUnLCAnYXV0b2ZpbGwtZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdwaC1zY2FsZS9waC1zY2FsZV9lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomYXV0b0ZpbGw9ZmFsc2UnXHJcbn0gKTtcclxuXHJcbi8vIG51bWJlci1wbGF5OiB0ZXN0IHRoZSBzZWNvbmQgbGFuZ3VhZ2UgcHJlZmVyZW5jZVxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnbnVtYmVyLXBsYXknLCAnc2Vjb25kLWxhbmd1YWdlLWZ1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnbnVtYmVyLXBsYXkvbnVtYmVyLXBsYXlfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JmxvY2FsZXM9KiZzZWNvbmRMb2NhbGU9ZXMnXHJcbn0gKTtcclxuXHJcbi8vIG51bWJlci1jb21wYXJlOiB0ZXN0IHRoZSBzZWNvbmQgbGFuZ3VhZ2UgcHJlZmVyZW5jZVxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnbnVtYmVyLWNvbXBhcmUnLCAnc2Vjb25kLWxhbmd1YWdlLWZ1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnbnVtYmVyLWNvbXBhcmUvbnVtYmVyLWNvbXBhcmVfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JmxvY2FsZXM9KiZzZWNvbmRMb2NhbGU9ZXMnXHJcbn0gKTtcclxuXHJcbi8vIHF1YWRyaWxhdGVyYWw6IHRlc3RzIHRoZSBwdWJsaWMgcXVlcnkgcGFyYW1ldGVycyBmb3IgY29uZmlndXJhdGlvbnMgdGhhdCBjYW5ub3QgYmUgY2hhbmdlZCBkdXJpbmcgcnVudGltZVxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAncXVhZHJpbGF0ZXJhbCcsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ3F1YWRyaWxhdGVyYWwvcXVhZHJpbGF0ZXJhbF9lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomaW5oZXJpdFRyYXBlem9pZFNvdW5kJnJlZHVjZWRTdGVwU2l6ZSdcclxufSApO1xyXG5cclxuLy8gYnVpbGQtYS1udWNsZXVzOiB0ZXN0cyB0aGUgcHVibGljIHF1ZXJ5IHBhcmFtZXRlcnMgZm9yIGNvbmZpZ3VyYXRpb25zIHRoYXQgY2Fubm90IGJlIGNoYW5nZWQgZHVyaW5nIHJ1bnRpbWVcclxuY29uc3QgZGVjYXlQcm90b25zID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDk0Ljk5ICk7XHJcbmNvbnN0IGRlY2F5TmV1dHJvbnMgPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogMTQ2Ljk5ICk7XHJcbmNvbnN0IGNoYXJ0SW50cm9Qcm90b25zID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDEwLjk5ICk7XHJcbmNvbnN0IGNoYXJ0SW50cm9OZXV0cm9ucyA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAxMi45OSApO1xyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnYnVpbGQtYS1udWNsZXVzJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnYnVpbGQtYS1udWNsZXVzL2J1aWxkLWEtbnVjbGV1c19lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6IGBicmFuZD1waGV0JmVhJmZ1enomZGVjYXlTY3JlZW5Qcm90b25zPSR7ZGVjYXlQcm90b25zfSZkZWNheVNjcmVlbk5ldXRyb25zPSR7ZGVjYXlOZXV0cm9uc30mY2hhcnRJbnRvU2NyZWVuUHJvdG9ucz0ke2NoYXJ0SW50cm9Qcm90b25zfSZjaGFydEludG9TY3JlZW5OZXV0cm9ucz0ke2NoYXJ0SW50cm9OZXV0cm9uc31gXHJcbn0gKTtcclxuXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICdidWlsZC1hLW51Y2xldXMnLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMtd3JvbmcnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdidWlsZC1hLW51Y2xldXMvYnVpbGQtYS1udWNsZXVzX2VuLmh0bWwnLFxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZkZWNheVNjcmVlblByb3RvbnM9MjAwJmRlY2F5U2NyZWVuTmV1dHJvbnM9MjAwJmNoYXJ0SW50b1NjcmVlblByb3RvbnM9MjAwJmNoYXJ0SW50b1NjcmVlbk5ldXRyb25zPTIwMCdcclxufSApO1xyXG5cclxuLy8gbXktc29sYXItc3lzdGVtXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICdteS1zb2xhci1zeXN0ZW0nLCAnY3VzdG9tLXdyYXBwZXInLCAndW5idWlsdCcgXSxcclxuICB0eXBlOiAnd3JhcHBlci10ZXN0JyxcclxuICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NzAwMDAnLCAvLyB0aGVyZSBhcmUgbXVsdGlwbGUgc3lzdGVtcyB0byBwbGF5IHRocm91Z2ggYW5kIGZ1enpcclxuICB1cmw6ICdwaGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy9teS1zb2xhci1zeXN0ZW0vd3JhcHBlcnMvbXktc29sYXItc3lzdGVtLXRlc3RzLz9zaW09bXktc29sYXItc3lzdGVtJnBoZXRpb0RlYnVnPXRydWUmcGhldGlvV3JhcHBlckRlYnVnPXRydWUnXHJcbn0gKTtcclxuXHJcbmNvbnNvbGUubG9nKCBKU09OLnN0cmluZ2lmeSggdGVzdHMsIG51bGwsIDIgKSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLGNBQWMsR0FBR0MsT0FBTyxDQUFFLHlCQUEwQixDQUFDO0FBQzNELE1BQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFFLHNCQUF1QixDQUFDO0FBQ3JELE1BQU1FLEVBQUUsR0FBR0YsT0FBTyxDQUFFLElBQUssQ0FBQztBQUUxQixNQUFNRyxLQUFLLEdBQUdKLGNBQWMsQ0FBQyxDQUFDO0FBQzlCLE1BQU1LLFdBQVcsR0FBR0gsV0FBVyxDQUFFLFNBQVUsQ0FBQztBQUM1QyxNQUFNSSxvQkFBb0IsR0FBR0osV0FBVyxDQUFFLG9CQUFxQixDQUFDO0FBQ2hFLE1BQU1LLGFBQWEsR0FBR0wsV0FBVyxDQUFFLGtCQUFtQixDQUFDO0FBQ3ZELE1BQU1NLDJCQUEyQixHQUFHTixXQUFXLENBQUUseUJBQTBCLENBQUM7QUFDNUUsTUFBTU8sd0JBQXdCLEdBQUdQLFdBQVcsQ0FBRSwyQkFBNEIsQ0FBQztBQUMzRSxNQUFNUSxhQUFhLEdBQUdSLFdBQVcsQ0FBRSxZQUFhLENBQUM7QUFDakQsTUFBTVMsWUFBWSxHQUFHVCxXQUFXLENBQUUsU0FBVSxDQUFDO0FBQzdDLE1BQU1VLDBCQUEwQixHQUFHVixXQUFXLENBQUUsVUFBVyxDQUFDO0FBQzVELE1BQU1XLGtCQUFrQixHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBRVosRUFBRSxDQUFDYSxZQUFZLENBQUUseUNBQXlDLEVBQUUsTUFBTyxDQUFDLENBQUNDLElBQUksQ0FBQyxDQUFFLENBQUM7O0FBRXBIO0FBQ0EsTUFBTUMsc0NBQXNDLEdBQUcsQ0FDN0MsZ0JBQWdCLEVB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