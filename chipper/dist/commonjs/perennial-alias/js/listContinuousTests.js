"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2020, University of Colorado Boulder

/**
 * This prints out (in JSON form) the tests and operations requested for continuous testing for whatever is in main
 * at this point.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var getActiveRepos = require('./common/getActiveRepos');
var getRepoList = require('./common/getRepoList');
var fs = require('fs');
var repos = getActiveRepos();
var phetioRepos = getRepoList('phet-io');
var phetioAPIStableRepos = getRepoList('phet-io-api-stable');
var runnableRepos = getRepoList('active-runnables');
var interactiveDescriptionRepos = getRepoList('interactive-description');
var phetioNoUnsupportedRepos = getRepoList('phet-io-state-unsupported');
var unitTestRepos = getRepoList('unit-tests');
var voicingRepos = getRepoList('voicing');
var phetioWrapperSuiteWrappers = getRepoList('wrappers');
var phetioHydrogenSims = JSON.parse(fs.readFileSync('../perennial/data/phet-io-hydrogen.json', 'utf8').trim());

// repos to not test multitouch fuzzing
var REPOS_EXCLUDED_FROM_MULTITOUCH_FUZZING = ['number-compare', 'number-play'];
var REPOS_EXCLUDED_FROM_LISTENER_ORDER_RANDOM = ['density', 'buoyancy', 'buoyancy-basics', 'fourier-making-waves' // see https://github.com/phetsims/fourier-making-waves/issues/240
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
var tests = [];
tests.push({
  test: ['perennial', 'lint-everything'],
  type: 'lint-everything',
  priority: 100
});

// phet and phet-io brand builds
[].concat(_toConsumableArray(runnableRepos), ['scenery', 'kite', 'dot']).forEach(function (repo) {
  tests.push({
    test: [repo, 'build'],
    type: 'build',
    brands: phetioRepos.includes(repo) ? ['phet', 'phet-io'] : ['phet'],
    repo: repo,
    priority: 1
  });
});

// lints
repos.forEach(function (repo) {
  // Rosetta specifies the lint task a bit differently, see https://github.com/phetsims/rosetta/issues/366
  if (fs.existsSync("../".concat(repo, "/Gruntfile.js")) || repo === 'rosetta') {
    tests.push({
      test: [repo, 'lint'],
      type: 'lint',
      repo: repo,
      priority: 8
    });
  }
});
runnableRepos.forEach(function (repo) {
  tests.push({
    test: [repo, 'fuzz', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzz',
    testQueryParameters: 'duration=90000' // This is the most important test, let's get some good coverage!
  });
  tests.push({
    test: [repo, 'xss-fuzz'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzz&stringTest=xss',
    testQueryParameters: 'duration=10000',
    priority: 0.3
  });
  tests.push({
    test: [repo, 'fuzz', 'unbuilt', 'assertSlow'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&eall&fuzz',
    priority: 0.001
  });
  if (!REPOS_EXCLUDED_FROM_LISTENER_ORDER_RANDOM.includes(repo)) {
    tests.push({
      test: [repo, 'fuzz', 'unbuilt', 'listenerOrderRandom'],
      type: 'sim-test',
      url: "".concat(repo, "/").concat(repo, "_en.html"),
      queryParameters: 'brand=phet&ea&fuzz&listenerOrder=random',
      priority: 0.3
    });
  }

  // don't test select repos for fuzzPointers=2
  if (!REPOS_EXCLUDED_FROM_MULTITOUCH_FUZZING.includes(repo)) {
    tests.push({
      test: [repo, 'multitouch-fuzz', 'unbuilt'],
      type: 'sim-test',
      url: "".concat(repo, "/").concat(repo, "_en.html"),
      queryParameters: 'brand=phet&ea&fuzz&fuzzPointers=2&supportsPanAndZoom=false'
    });
    tests.push({
      test: [repo, 'pan-and-zoom-fuzz', 'unbuilt'],
      type: 'sim-test',
      url: "".concat(repo, "/").concat(repo, "_en.html"),
      queryParameters: 'brand=phet&ea&fuzz&fuzzPointers=2&supportsPanAndZoom=true',
      priority: 0.5 // test this when there isn't other work to be done
    });
  }
  tests.push({
    test: [repo, 'fuzz', 'built'],
    type: 'sim-test',
    url: "".concat(repo, "/build/phet/").concat(repo, "_en_phet.html"),
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
      url: "".concat(repo, "/build/phet-io/").concat(repo, "_all_phet-io.html"),
      queryParameters: 'fuzz&phetioStandalone',
      testQueryParameters: 'duration=80000',
      brand: 'phet-io',
      buildDependencies: [repo],
      es5: true
    });
  }
});
phetioRepos.forEach(function (repo) {
  tests.push({
    test: [repo, 'phet-io-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'ea&brand=phet-io&phetioStandalone&fuzz'
  });

  // Test for API compatibility, for sims that support it
  phetioAPIStableRepos.includes(repo) && tests.push({
    test: [repo, 'phet-io-api-compatibility', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'ea&brand=phet-io&phetioStandalone&phetioCompareAPI&randomSeed=332211&locales=*&webgl=false',
    // NOTE: DUPLICATION ALERT: random seed must match that of API generation, see generatePhetioMacroAPI.js
    priority: 1.5 // more often than the average test
  });
  var phetioStateSupported = !phetioNoUnsupportedRepos.includes(repo);

  // phet-io wrappers tests for each PhET-iO Sim, these tests rely on phet-io state working
  phetioStateSupported && [false, true].forEach(function (useAssert) {
    tests.push({
      test: [repo, 'phet-io-wrappers-tests', useAssert ? 'assert' : 'no-assert'],
      type: 'qunit-test',
      url: "phet-io-wrappers/phet-io-wrappers-tests.html?sim=".concat(repo).concat(useAssert ? '&phetioDebug=true&phetioWrapperDebug=true' : ''),
      testQueryParameters: 'duration=600000' // phet-io-wrapper tests load the sim >5 times
    });
  });
  var wrappersToIgnore = ['migration', 'playback', 'login', 'input-record-and-playback'];
  phetioWrapperSuiteWrappers.forEach(function (wrapperPath) {
    var wrapperPathParts = wrapperPath.split('/');
    var wrapperName = wrapperPathParts[wrapperPathParts.length - 1];
    if (wrappersToIgnore.includes(wrapperName)) {
      return;
    }
    var testName = "phet-io-".concat(wrapperName, "-fuzz");
    var wrapperQueryParameters = "sim=".concat(repo, "&locales=*&phetioWrapperDebug=true&fuzz");
    if (wrapperName === 'studio') {
      // fuzz test important wrappers
      tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: "studio/?".concat(wrapperQueryParameters)
      });
    } else if (wrapperName === 'state') {
      // only test state on phet-io sims that support it
      phetioStateSupported && tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: "phet-io-wrappers/state/?".concat(wrapperQueryParameters, "&phetioDebug=true")
      });
    } else {
      tests.push({
        test: [repo, testName, 'unbuilt'],
        type: 'wrapper-test',
        url: "phet-io-wrappers/".concat(wrapperName, "/?").concat(wrapperQueryParameters, "&phetioDebug=true"),
        testQueryParameters: "duration=".concat(wrapperName === 'multi' ? '60000' : '15000')
      });
    }
  });
});
interactiveDescriptionRepos.forEach(function (repo) {
  tests.push({
    test: [repo, 'interactive-description-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzz&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzz-fuzzBoard-combo', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&supportsInteractiveDescription=true&fuzz&fuzzBoard',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzzBoard', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzzBoard&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'interactive-description-fuzz', 'built'],
    type: 'sim-test',
    url: "".concat(repo, "/build/phet/").concat(repo, "_en_phet.html"),
    queryParameters: 'fuzz&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000',
    brand: 'phet',
    buildDependencies: [repo],
    es5: true
  });
  tests.push({
    test: [repo, 'interactive-description-fuzzBoard', 'built'],
    type: 'sim-test',
    url: "".concat(repo, "/build/phet/").concat(repo, "_en_phet.html"),
    queryParameters: 'fuzzBoard&supportsInteractiveDescription=true',
    testQueryParameters: 'duration=40000',
    brand: 'phet',
    buildDependencies: [repo],
    es5: true
  });
});
voicingRepos.forEach(function (repo) {
  tests.push({
    test: [repo, 'voicing-fuzz', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzz&voicingInitiallyEnabled',
    testQueryParameters: 'duration=40000'
  });
  tests.push({
    test: [repo, 'voicing-fuzzBoard', 'unbuilt'],
    type: 'sim-test',
    url: "".concat(repo, "/").concat(repo, "_en.html"),
    queryParameters: 'brand=phet&ea&fuzzBoard&voicingInitiallyEnabled',
    testQueryParameters: 'duration=40000'
  });
});

// repo-specific Unit tests (unbuilt mode) from `grunt generate-test-harness`
unitTestRepos.forEach(function (repo) {
  // All tests should work with no query parameters, with assertions enabled, and should support PhET-iO also, so test
  // with brand=phet-io
  var queryParameters = ['', '?ea', '?brand=phet-io', '?ea&brand=phet-io'];
  queryParameters.forEach(function (queryString) {
    // Don't test phet-io or tandem unit tests in phet brand, they are meant for phet-io brand
    if ((repo === 'phet-io' || repo === 'tandem' || repo === 'phet-io-wrappers') && !queryString.includes('phet-io')) {
      return;
    }
    if (repo === 'phet-io-wrappers') {
      queryString += '&sim=gravity-and-orbits';
    }
    tests.push({
      test: [repo, 'top-level-unit-tests', "unbuilt".concat(queryString)],
      type: 'qunit-test',
      url: "".concat(repo, "/").concat(repo, "-tests.html").concat(queryString)
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
}].forEach(function (_ref) {
  var repo = _ref.repo,
    urls = _ref.urls;
  urls.forEach(function (pageloadRelativeURL) {
    tests.push({
      test: [repo, 'pageload', "/".concat(pageloadRelativeURL)],
      type: 'pageload-test',
      url: "".concat(repo, "/").concat(pageloadRelativeURL),
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
var commonQueryParameters = {
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
Object.keys(commonQueryParameters).forEach(function (name) {
  var queryString = commonQueryParameters[name];

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
phetioHydrogenSims.forEach(function (testData) {
  var simName = testData.sim;
  var oldVersion = testData.version;
  var getTest = function getTest(reportContext) {
    return {
      test: [simName, 'migration', "".concat(oldVersion, "->main"), reportContext],
      type: 'wrapper-test',
      testQueryParameters: 'duration=80000',
      // Loading 2 studios takes time!
      url: "phet-io-wrappers/migration/?sim=".concat(simName, "&oldVersion=").concat(oldVersion, "&phetioMigrationReport=").concat(reportContext) + '&locales=*&phetioDebug=true&phetioWrapperDebug=true&fuzz&migrationRate=5000&'
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
var decayProtons = Math.floor(Math.random() * 94.99);
var decayNeutrons = Math.floor(Math.random() * 146.99);
var chartIntroProtons = Math.floor(Math.random() * 10.99);
var chartIntroNeutrons = Math.floor(Math.random() * 12.99);
tests.push({
  test: ['build-a-nucleus', 'fuzz', 'unbuilt', 'query-parameters'],
  type: 'sim-test',
  url: 'build-a-nucleus/build-a-nucleus_en.html',
  queryParameters: "brand=phet&ea&fuzz&decayScreenProtons=".concat(decayProtons, "&decayScreenNeutrons=").concat(decayNeutrons, "&chartIntoScreenProtons=").concat(chartIntroProtons, "&chartIntoScreenNeutrons=").concat(chartIntroNeutrons)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRBY3RpdmVSZXBvcyIsInJlcXVpcmUiLCJnZXRSZXBvTGlzdCIsImZzIiwicmVwb3MiLCJwaGV0aW9SZXBvcyIsInBoZXRpb0FQSVN0YWJsZVJlcG9zIiwicnVubmFibGVSZXBvcyIsImludGVyYWN0aXZlRGVzY3JpcHRpb25SZXBvcyIsInBoZXRpb05vVW5zdXBwb3J0ZWRSZXBvcyIsInVuaXRUZXN0UmVwb3MiLCJ2b2ljaW5nUmVwb3MiLCJwaGV0aW9XcmFwcGVyU3VpdGVXcmFwcGVycyIsInBoZXRpb0h5ZHJvZ2VuU2ltcyIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsInRyaW0iLCJSRVBPU19FWENMVURFRF9GUk9NX01VTFRJVE9VQ0hfRlVaWklORyIsIlJFUE9TX0VYQ0xVREVEX0ZST01fTElTVEVORVJfT1JERVJfUkFORE9NIiwidGVzdHMiLCJwdXNoIiwidGVzdCIsInR5cGUiLCJwcmlvcml0eSIsImNvbmNhdCIsIl90b0NvbnN1bWFibGVBcnJheSIsImZvckVhY2giLCJyZXBvIiwiYnJhbmRzIiwiaW5jbHVkZXMiLCJleGlzdHNTeW5jIiwidXJsIiwicXVlcnlQYXJhbWV0ZXJzIiwidGVzdFF1ZXJ5UGFyYW1ldGVycyIsImJyYW5kIiwiYnVpbGREZXBlbmRlbmNpZXMiLCJlczUiLCJwaGV0aW9TdGF0ZVN1cHBvcnRlZCIsInVzZUFzc2VydCIsIndyYXBwZXJzVG9JZ25vcmUiLCJ3cmFwcGVyUGF0aCIsIndyYXBwZXJQYXRoUGFydHMiLCJzcGxpdCIsIndyYXBwZXJOYW1lIiwibGVuZ3RoIiwidGVzdE5hbWUiLCJ3cmFwcGVyUXVlcnlQYXJhbWV0ZXJzIiwicXVlcnlTdHJpbmciLCJ1cmxzIiwiX3JlZiIsInBhZ2Vsb2FkUmVsYXRpdmVVUkwiLCJjb21tb25RdWVyeVBhcmFtZXRlcnMiLCJhbGxvd0xpbmtzRmFsc2UiLCJzY3JlZW5zMSIsInNjcmVlbnMyMSIsInNjcmVlbnMyMU5vSG9tZSIsImluaXRpYWxTY3JlZW4yTm9Ib21lIiwiaW5pdGlhbFNjcmVlbjIiLCJzY3JlZW5zVmVyYm9zZSIsIndyb25nSW5pdGlhbFNjcmVlbjEiLCJ3cm9uZ0luaXRpYWxTY3JlZW4yIiwid3JvbmdTY3JlZW5zMSIsIndyb25nU2NyZWVuczIiLCJzY3JlZW5zT3RoZXIiLCJPYmplY3QiLCJrZXlzIiwibmFtZSIsInRlc3REYXRhIiwic2ltTmFtZSIsInNpbSIsIm9sZFZlcnNpb24iLCJ2ZXJzaW9uIiwiZ2V0VGVzdCIsInJlcG9ydENvbnRleHQiLCJkZWNheVByb3RvbnMiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJkZWNheU5ldXRyb25zIiwiY2hhcnRJbnRyb1Byb3RvbnMiLCJjaGFydEludHJvTmV1dHJvbnMiLCJjb25zb2xlIiwibG9nIiwic3RyaW5naWZ5Il0sInNvdXJjZXMiOlsibGlzdENvbnRpbnVvdXNUZXN0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhpcyBwcmludHMgb3V0IChpbiBKU09OIGZvcm0pIHRoZSB0ZXN0cyBhbmQgb3BlcmF0aW9ucyByZXF1ZXN0ZWQgZm9yIGNvbnRpbnVvdXMgdGVzdGluZyBmb3Igd2hhdGV2ZXIgaXMgaW4gbWFpblxyXG4gKiBhdCB0aGlzIHBvaW50LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZ2V0QWN0aXZlUmVwb3MgPSByZXF1aXJlKCAnLi9jb21tb24vZ2V0QWN0aXZlUmVwb3MnICk7XHJcbmNvbnN0IGdldFJlcG9MaXN0ID0gcmVxdWlyZSggJy4vY29tbW9uL2dldFJlcG9MaXN0JyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbmNvbnN0IHJlcG9zID0gZ2V0QWN0aXZlUmVwb3MoKTtcclxuY29uc3QgcGhldGlvUmVwb3MgPSBnZXRSZXBvTGlzdCggJ3BoZXQtaW8nICk7XHJcbmNvbnN0IHBoZXRpb0FQSVN0YWJsZVJlcG9zID0gZ2V0UmVwb0xpc3QoICdwaGV0LWlvLWFwaS1zdGFibGUnICk7XHJcbmNvbnN0IHJ1bm5hYmxlUmVwb3MgPSBnZXRSZXBvTGlzdCggJ2FjdGl2ZS1ydW5uYWJsZXMnICk7XHJcbmNvbnN0IGludGVyYWN0aXZlRGVzY3JpcHRpb25SZXBvcyA9IGdldFJlcG9MaXN0KCAnaW50ZXJhY3RpdmUtZGVzY3JpcHRpb24nICk7XHJcbmNvbnN0IHBoZXRpb05vVW5zdXBwb3J0ZWRSZXBvcyA9IGdldFJlcG9MaXN0KCAncGhldC1pby1zdGF0ZS11bnN1cHBvcnRlZCcgKTtcclxuY29uc3QgdW5pdFRlc3RSZXBvcyA9IGdldFJlcG9MaXN0KCAndW5pdC10ZXN0cycgKTtcclxuY29uc3Qgdm9pY2luZ1JlcG9zID0gZ2V0UmVwb0xpc3QoICd2b2ljaW5nJyApO1xyXG5jb25zdCBwaGV0aW9XcmFwcGVyU3VpdGVXcmFwcGVycyA9IGdldFJlcG9MaXN0KCAnd3JhcHBlcnMnICk7XHJcbmNvbnN0IHBoZXRpb0h5ZHJvZ2VuU2ltcyA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggJy4uL3BlcmVubmlhbC9kYXRhL3BoZXQtaW8taHlkcm9nZW4uanNvbicsICd1dGY4JyApLnRyaW0oKSApO1xyXG5cclxuLy8gcmVwb3MgdG8gbm90IHRlc3QgbXVsdGl0b3VjaCBmdXp6aW5nXHJcbmNvbnN0IFJFUE9TX0VYQ0xVREVEX0ZST01fTVVMVElUT1VDSF9GVVpaSU5HID0gW1xyXG4gICdudW1iZXItY29tcGFyZScsXHJcbiAgJ251bWJlci1wbGF5J1xyXG5dO1xyXG5cclxuY29uc3QgUkVQT1NfRVhDTFVERURfRlJPTV9MSVNURU5FUl9PUkRFUl9SQU5ET00gPSBbXHJcbiAgJ2RlbnNpdHknLFxyXG4gICdidW95YW5jeScsXHJcbiAgJ2J1b3lhbmN5LWJhc2ljcycsXHJcbiAgJ2ZvdXJpZXItbWFraW5nLXdhdmVzJyAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZvdXJpZXItbWFraW5nLXdhdmVzL2lzc3Vlcy8yNDBcclxuXTtcclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPE9iamVjdD59IHRlc3RcclxuICoge3N0cmluZ30gdHlwZVxyXG4gKiB7c3RyaW5nfSBbdXJsXVxyXG4gKiB7c3RyaW5nfSBbcmVwb11cclxuICoge3N0cmluZ30gW3F1ZXJ5UGFyYW1ldGVyc11cclxuICoge3N0cmluZ30gW3Rlc3RRdWVyeVBhcmFtZXRlcnNdXHJcbiAqIHtib29sZWFufSBbZXM1XVxyXG4gKiB7c3RyaW5nfSBbYnJhbmRdXHJcbiAqIHtudW1iZXJ9IFtwcmlvcml0eT0xXSAtIGhpZ2hlciBwcmlvcml0aWVzIGFyZSB0ZXN0ZWQgbW9yZSBlYWdlcmx5XHJcbiAqIHtBcnJheS48c3RyaW5nPn0gYnVpbGREZXBlbmRlbmNpZXNcclxuICovXHJcbmNvbnN0IHRlc3RzID0gW107XHJcblxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAncGVyZW5uaWFsJywgJ2xpbnQtZXZlcnl0aGluZycgXSxcclxuICB0eXBlOiAnbGludC1ldmVyeXRoaW5nJyxcclxuICBwcmlvcml0eTogMTAwXHJcbn0gKTtcclxuXHJcbi8vIHBoZXQgYW5kIHBoZXQtaW8gYnJhbmQgYnVpbGRzXHJcbltcclxuICAuLi5ydW5uYWJsZVJlcG9zLFxyXG4gICdzY2VuZXJ5JyxcclxuICAna2l0ZScsXHJcbiAgJ2RvdCdcclxuXS5mb3JFYWNoKCByZXBvID0+IHtcclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdidWlsZCcgXSxcclxuICAgIHR5cGU6ICdidWlsZCcsXHJcbiAgICBicmFuZHM6IHBoZXRpb1JlcG9zLmluY2x1ZGVzKCByZXBvICkgPyBbICdwaGV0JywgJ3BoZXQtaW8nIF0gOiBbICdwaGV0JyBdLFxyXG4gICAgcmVwbzogcmVwbyxcclxuICAgIHByaW9yaXR5OiAxXHJcbiAgfSApO1xyXG59ICk7XHJcblxyXG4vLyBsaW50c1xyXG5yZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICAvLyBSb3NldHRhIHNwZWNpZmllcyB0aGUgbGludCB0YXNrIGEgYml0IGRpZmZlcmVudGx5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3Jvc2V0dGEvaXNzdWVzLzM2NlxyXG4gIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vR3J1bnRmaWxlLmpzYCApIHx8IHJlcG8gPT09ICdyb3NldHRhJyApIHtcclxuICAgIHRlc3RzLnB1c2goIHtcclxuICAgICAgdGVzdDogWyByZXBvLCAnbGludCcgXSxcclxuICAgICAgdHlwZTogJ2xpbnQnLFxyXG4gICAgICByZXBvOiByZXBvLFxyXG4gICAgICBwcmlvcml0eTogOFxyXG4gICAgfSApO1xyXG4gIH1cclxufSApO1xyXG5cclxucnVubmFibGVSZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdmdXp6JywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj05MDAwMCcgLy8gVGhpcyBpcyB0aGUgbW9zdCBpbXBvcnRhbnQgdGVzdCwgbGV0J3MgZ2V0IHNvbWUgZ29vZCBjb3ZlcmFnZSFcclxuICB9ICk7XHJcblxyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ3hzcy1mdXp6JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vJHtyZXBvfV9lbi5odG1sYCxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZzdHJpbmdUZXN0PXhzcycsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249MTAwMDAnLFxyXG4gICAgcHJpb3JpdHk6IDAuM1xyXG4gIH0gKTtcclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAnZnV6eicsICd1bmJ1aWx0JywgJ2Fzc2VydFNsb3cnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYWxsJmZ1enonLFxyXG4gICAgcHJpb3JpdHk6IDAuMDAxXHJcbiAgfSApO1xyXG5cclxuICBpZiAoICFSRVBPU19FWENMVURFRF9GUk9NX0xJU1RFTkVSX09SREVSX1JBTkRPTS5pbmNsdWRlcyggcmVwbyApICkge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdmdXp6JywgJ3VuYnVpbHQnLCAnbGlzdGVuZXJPcmRlclJhbmRvbScgXSxcclxuICAgICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enombGlzdGVuZXJPcmRlcj1yYW5kb20nLFxyXG4gICAgICBwcmlvcml0eTogMC4zXHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvLyBkb24ndCB0ZXN0IHNlbGVjdCByZXBvcyBmb3IgZnV6elBvaW50ZXJzPTJcclxuICBpZiAoICFSRVBPU19FWENMVURFRF9GUk9NX01VTFRJVE9VQ0hfRlVaWklORy5pbmNsdWRlcyggcmVwbyApICkge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdtdWx0aXRvdWNoLWZ1enonLCAndW5idWlsdCcgXSxcclxuICAgICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomZnV6elBvaW50ZXJzPTImc3VwcG9ydHNQYW5BbmRab29tPWZhbHNlJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRlc3RzLnB1c2goIHtcclxuICAgICAgdGVzdDogWyByZXBvLCAncGFuLWFuZC16b29tLWZ1enonLCAndW5idWlsdCcgXSxcclxuICAgICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomZnV6elBvaW50ZXJzPTImc3VwcG9ydHNQYW5BbmRab29tPXRydWUnLFxyXG4gICAgICBwcmlvcml0eTogMC41IC8vIHRlc3QgdGhpcyB3aGVuIHRoZXJlIGlzbid0IG90aGVyIHdvcmsgdG8gYmUgZG9uZVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAnZnV6eicsICdidWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99L2J1aWxkL3BoZXQvJHtyZXBvfV9lbl9waGV0Lmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnZnV6eicsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249ODAwMDAnLFxyXG5cclxuICAgIC8vIFdlIHdhbnQgdG8gZWxldmF0ZSB0aGUgcHJpb3JpdHkgc28gdGhhdCB3ZSBnZXQgYSBtb3JlIGV2ZW4gYmFsYW5jZSAod2UgY2FuJ3QgdGVzdCB0aGVzZSB1bnRpbCB0aGV5IGFyZSBidWlsdCxcclxuICAgIC8vIHdoaWNoIGRvZXNuJ3QgaGFwcGVuIGFsd2F5cylcclxuICAgIHByaW9yaXR5OiAyLFxyXG5cclxuICAgIGJyYW5kOiAncGhldCcsXHJcbiAgICBidWlsZERlcGVuZGVuY2llczogWyByZXBvIF0sXHJcbiAgICBlczU6IHRydWVcclxuICB9ICk7XHJcblxyXG4gIGlmICggcGhldGlvUmVwb3MuaW5jbHVkZXMoIHJlcG8gKSApIHtcclxuICAgIHRlc3RzLnB1c2goIHtcclxuICAgICAgdGVzdDogWyByZXBvLCAnZnV6eicsICdidWlsdC1waGV0LWlvJyBdLFxyXG4gICAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99L2J1aWxkL3BoZXQtaW8vJHtyZXBvfV9hbGxfcGhldC1pby5odG1sYCxcclxuICAgICAgcXVlcnlQYXJhbWV0ZXJzOiAnZnV6eiZwaGV0aW9TdGFuZGFsb25lJyxcclxuICAgICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTgwMDAwJyxcclxuXHJcbiAgICAgIGJyYW5kOiAncGhldC1pbycsXHJcbiAgICAgIGJ1aWxkRGVwZW5kZW5jaWVzOiBbIHJlcG8gXSxcclxuICAgICAgZXM1OiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgfVxyXG59ICk7XHJcblxyXG5waGV0aW9SZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAncGhldC1pby1mdXp6JywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnZWEmYnJhbmQ9cGhldC1pbyZwaGV0aW9TdGFuZGFsb25lJmZ1enonXHJcbiAgfSApO1xyXG5cclxuICAvLyBUZXN0IGZvciBBUEkgY29tcGF0aWJpbGl0eSwgZm9yIHNpbXMgdGhhdCBzdXBwb3J0IGl0XHJcbiAgcGhldGlvQVBJU3RhYmxlUmVwb3MuaW5jbHVkZXMoIHJlcG8gKSAmJiB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdwaGV0LWlvLWFwaS1jb21wYXRpYmlsaXR5JywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnZWEmYnJhbmQ9cGhldC1pbyZwaGV0aW9TdGFuZGFsb25lJnBoZXRpb0NvbXBhcmVBUEkmcmFuZG9tU2VlZD0zMzIyMTEmbG9jYWxlcz0qJndlYmdsPWZhbHNlJywgLy8gTk9URTogRFVQTElDQVRJT04gQUxFUlQ6IHJhbmRvbSBzZWVkIG11c3QgbWF0Y2ggdGhhdCBvZiBBUEkgZ2VuZXJhdGlvbiwgc2VlIGdlbmVyYXRlUGhldGlvTWFjcm9BUEkuanNcclxuICAgIHByaW9yaXR5OiAxLjUgLy8gbW9yZSBvZnRlbiB0aGFuIHRoZSBhdmVyYWdlIHRlc3RcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHBoZXRpb1N0YXRlU3VwcG9ydGVkID0gIXBoZXRpb05vVW5zdXBwb3J0ZWRSZXBvcy5pbmNsdWRlcyggcmVwbyApO1xyXG5cclxuICAvLyBwaGV0LWlvIHdyYXBwZXJzIHRlc3RzIGZvciBlYWNoIFBoRVQtaU8gU2ltLCB0aGVzZSB0ZXN0cyByZWx5IG9uIHBoZXQtaW8gc3RhdGUgd29ya2luZ1xyXG4gIHBoZXRpb1N0YXRlU3VwcG9ydGVkICYmIFsgZmFsc2UsIHRydWUgXS5mb3JFYWNoKCB1c2VBc3NlcnQgPT4ge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdwaGV0LWlvLXdyYXBwZXJzLXRlc3RzJywgdXNlQXNzZXJ0ID8gJ2Fzc2VydCcgOiAnbm8tYXNzZXJ0JyBdLFxyXG4gICAgICB0eXBlOiAncXVuaXQtdGVzdCcsXHJcbiAgICAgIHVybDogYHBoZXQtaW8td3JhcHBlcnMvcGhldC1pby13cmFwcGVycy10ZXN0cy5odG1sP3NpbT0ke3JlcG99JHt1c2VBc3NlcnQgPyAnJnBoZXRpb0RlYnVnPXRydWUmcGhldGlvV3JhcHBlckRlYnVnPXRydWUnIDogJyd9YCxcclxuICAgICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTYwMDAwMCcgLy8gcGhldC1pby13cmFwcGVyIHRlc3RzIGxvYWQgdGhlIHNpbSA+NSB0aW1lc1xyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3Qgd3JhcHBlcnNUb0lnbm9yZSA9IFsgJ21pZ3JhdGlvbicsICdwbGF5YmFjaycsICdsb2dpbicsICdpbnB1dC1yZWNvcmQtYW5kLXBsYXliYWNrJyBdO1xyXG5cclxuICBwaGV0aW9XcmFwcGVyU3VpdGVXcmFwcGVycy5mb3JFYWNoKCB3cmFwcGVyUGF0aCA9PiB7XHJcblxyXG4gICAgY29uc3Qgd3JhcHBlclBhdGhQYXJ0cyA9IHdyYXBwZXJQYXRoLnNwbGl0KCAnLycgKTtcclxuICAgIGNvbnN0IHdyYXBwZXJOYW1lID0gd3JhcHBlclBhdGhQYXJ0c1sgd3JhcHBlclBhdGhQYXJ0cy5sZW5ndGggLSAxIF07XHJcblxyXG4gICAgaWYgKCB3cmFwcGVyc1RvSWdub3JlLmluY2x1ZGVzKCB3cmFwcGVyTmFtZSApICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGVzdE5hbWUgPSBgcGhldC1pby0ke3dyYXBwZXJOYW1lfS1mdXp6YDtcclxuICAgIGNvbnN0IHdyYXBwZXJRdWVyeVBhcmFtZXRlcnMgPSBgc2ltPSR7cmVwb30mbG9jYWxlcz0qJnBoZXRpb1dyYXBwZXJEZWJ1Zz10cnVlJmZ1enpgO1xyXG5cclxuICAgIGlmICggd3JhcHBlck5hbWUgPT09ICdzdHVkaW8nICkge1xyXG5cclxuICAgICAgLy8gZnV6eiB0ZXN0IGltcG9ydGFudCB3cmFwcGVyc1xyXG4gICAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgICAgdGVzdDogWyByZXBvLCB0ZXN0TmFtZSwgJ3VuYnVpbHQnIF0sXHJcbiAgICAgICAgdHlwZTogJ3dyYXBwZXItdGVzdCcsXHJcbiAgICAgICAgdXJsOiBgc3R1ZGlvLz8ke3dyYXBwZXJRdWVyeVBhcmFtZXRlcnN9YFxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggd3JhcHBlck5hbWUgPT09ICdzdGF0ZScgKSB7XHJcblxyXG4gICAgICAvLyBvbmx5IHRlc3Qgc3RhdGUgb24gcGhldC1pbyBzaW1zIHRoYXQgc3VwcG9ydCBpdFxyXG4gICAgICBwaGV0aW9TdGF0ZVN1cHBvcnRlZCAmJiB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgICAgdGVzdDogWyByZXBvLCB0ZXN0TmFtZSwgJ3VuYnVpbHQnIF0sXHJcbiAgICAgICAgdHlwZTogJ3dyYXBwZXItdGVzdCcsXHJcbiAgICAgICAgdXJsOiBgcGhldC1pby13cmFwcGVycy9zdGF0ZS8/JHt3cmFwcGVyUXVlcnlQYXJhbWV0ZXJzfSZwaGV0aW9EZWJ1Zz10cnVlYFxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGVzdHMucHVzaCgge1xyXG4gICAgICAgIHRlc3Q6IFsgcmVwbywgdGVzdE5hbWUsICd1bmJ1aWx0JyBdLFxyXG4gICAgICAgIHR5cGU6ICd3cmFwcGVyLXRlc3QnLFxyXG4gICAgICAgIHVybDogYHBoZXQtaW8td3JhcHBlcnMvJHt3cmFwcGVyTmFtZX0vPyR7d3JhcHBlclF1ZXJ5UGFyYW1ldGVyc30mcGhldGlvRGVidWc9dHJ1ZWAsXHJcbiAgICAgICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogYGR1cmF0aW9uPSR7d3JhcHBlck5hbWUgPT09ICdtdWx0aScgPyAnNjAwMDAnIDogJzE1MDAwJ31gXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbmludGVyYWN0aXZlRGVzY3JpcHRpb25SZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdpbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbi1mdXp6JywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbj10cnVlJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCdcclxuICB9ICk7XHJcblxyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgcmVwbywgJ2ludGVyYWN0aXZlLWRlc2NyaXB0aW9uLWZ1enotZnV6ekJvYXJkLWNvbWJvJywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb249dHJ1ZSZmdXp6JmZ1enpCb2FyZCcsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NDAwMDAnXHJcbiAgfSApO1xyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdpbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbi1mdXp6Qm9hcmQnLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enpCb2FyZCZzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb249dHJ1ZScsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NDAwMDAnXHJcbiAgfSApO1xyXG5cclxuICB0ZXN0cy5wdXNoKCB7XHJcbiAgICB0ZXN0OiBbIHJlcG8sICdpbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbi1mdXp6JywgJ2J1aWx0JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vYnVpbGQvcGhldC8ke3JlcG99X2VuX3BoZXQuaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdmdXp6JnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbj10cnVlJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCcsXHJcblxyXG4gICAgYnJhbmQ6ICdwaGV0JyxcclxuICAgIGJ1aWxkRGVwZW5kZW5jaWVzOiBbIHJlcG8gXSxcclxuICAgIGVzNTogdHJ1ZVxyXG4gIH0gKTtcclxuXHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAnaW50ZXJhY3RpdmUtZGVzY3JpcHRpb24tZnV6ekJvYXJkJywgJ2J1aWx0JyBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogYCR7cmVwb30vYnVpbGQvcGhldC8ke3JlcG99X2VuX3BoZXQuaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdmdXp6Qm9hcmQmc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uPXRydWUnLFxyXG4gICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTQwMDAwJyxcclxuXHJcbiAgICBicmFuZDogJ3BoZXQnLFxyXG4gICAgYnVpbGREZXBlbmRlbmNpZXM6IFsgcmVwbyBdLFxyXG4gICAgZXM1OiB0cnVlXHJcbiAgfSApO1xyXG59ICk7XHJcblxyXG52b2ljaW5nUmVwb3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAndm9pY2luZy1mdXp6JywgJ3VuYnVpbHQnIF0sXHJcbiAgICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gICAgdXJsOiBgJHtyZXBvfS8ke3JlcG99X2VuLmh0bWxgLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnZvaWNpbmdJbml0aWFsbHlFbmFibGVkJyxcclxuICAgIHRlc3RRdWVyeVBhcmFtZXRlcnM6ICdkdXJhdGlvbj00MDAwMCdcclxuICB9ICk7XHJcbiAgdGVzdHMucHVzaCgge1xyXG4gICAgdGVzdDogWyByZXBvLCAndm9pY2luZy1mdXp6Qm9hcmQnLCAndW5idWlsdCcgXSxcclxuICAgIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgICB1cmw6IGAke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enpCb2FyZCZ2b2ljaW5nSW5pdGlhbGx5RW5hYmxlZCcsXHJcbiAgICB0ZXN0UXVlcnlQYXJhbWV0ZXJzOiAnZHVyYXRpb249NDAwMDAnXHJcbiAgfSApO1xyXG59ICk7XHJcblxyXG4vLyByZXBvLXNwZWNpZmljIFVuaXQgdGVzdHMgKHVuYnVpbHQgbW9kZSkgZnJvbSBgZ3J1bnQgZ2VuZXJhdGUtdGVzdC1oYXJuZXNzYFxyXG51bml0VGVzdFJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG5cclxuICAvLyBBbGwgdGVzdHMgc2hvdWxkIHdvcmsgd2l0aCBubyBxdWVyeSBwYXJhbWV0ZXJzLCB3aXRoIGFzc2VydGlvbnMgZW5hYmxlZCwgYW5kIHNob3VsZCBzdXBwb3J0IFBoRVQtaU8gYWxzbywgc28gdGVzdFxyXG4gIC8vIHdpdGggYnJhbmQ9cGhldC1pb1xyXG4gIGNvbnN0IHF1ZXJ5UGFyYW1ldGVycyA9IFsgJycsICc/ZWEnLCAnP2JyYW5kPXBoZXQtaW8nLCAnP2VhJmJyYW5kPXBoZXQtaW8nIF07XHJcbiAgcXVlcnlQYXJhbWV0ZXJzLmZvckVhY2goIHF1ZXJ5U3RyaW5nID0+IHtcclxuXHJcbiAgICAvLyBEb24ndCB0ZXN0IHBoZXQtaW8gb3IgdGFuZGVtIHVuaXQgdGVzdHMgaW4gcGhldCBicmFuZCwgdGhleSBhcmUgbWVhbnQgZm9yIHBoZXQtaW8gYnJhbmRcclxuICAgIGlmICggKCByZXBvID09PSAncGhldC1pbycgfHwgcmVwbyA9PT0gJ3RhbmRlbScgfHwgcmVwbyA9PT0gJ3BoZXQtaW8td3JhcHBlcnMnICkgJiYgIXF1ZXJ5U3RyaW5nLmluY2x1ZGVzKCAncGhldC1pbycgKSApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKCByZXBvID09PSAncGhldC1pby13cmFwcGVycycgKSB7XHJcbiAgICAgIHF1ZXJ5U3RyaW5nICs9ICcmc2ltPWdyYXZpdHktYW5kLW9yYml0cyc7XHJcbiAgICB9XHJcbiAgICB0ZXN0cy5wdXNoKCB7XHJcbiAgICAgIHRlc3Q6IFsgcmVwbywgJ3RvcC1sZXZlbC11bml0LXRlc3RzJywgYHVuYnVpbHQke3F1ZXJ5U3RyaW5nfWAgXSxcclxuICAgICAgdHlwZTogJ3F1bml0LXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99LyR7cmVwb30tdGVzdHMuaHRtbCR7cXVlcnlTdHJpbmd9YFxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxufSApO1xyXG5cclxuLy8gUGFnZS1sb2FkIHRlc3RzIChub24tYnVpbHQpXHJcblsge1xyXG4gIHJlcG86ICdkb3QnLFxyXG4gIHVybHM6IFtcclxuICAgICcnLCAvLyB0aGUgcm9vdCBVUkxcclxuICAgICdkb2MvJyxcclxuICAgICdleGFtcGxlcy8nLFxyXG4gICAgJ2V4YW1wbGVzL2NvbnZleC1odWxsLTIuaHRtbCcsXHJcbiAgICAndGVzdHMvJyxcclxuICAgICd0ZXN0cy9wbGF5Z3JvdW5kLmh0bWwnXHJcbiAgXVxyXG59LCB7XHJcbiAgcmVwbzogJ2tpdGUnLFxyXG4gIHVybHM6IFtcclxuICAgICcnLCAvLyB0aGUgcm9vdCBVUkxcclxuICAgICdkb2MvJyxcclxuICAgICdleGFtcGxlcy8nLFxyXG4gICAgJ3Rlc3RzLycsXHJcbiAgICAndGVzdHMvcGxheWdyb3VuZC5odG1sJyxcclxuICAgICd0ZXN0cy92aXN1YWwtc2hhcGUtdGVzdC5odG1sJ1xyXG4gIF1cclxufSwge1xyXG4gIHJlcG86ICdzY2VuZXJ5JyxcclxuICB1cmxzOiBbXHJcbiAgICAnJywgLy8gdGhlIHJvb3QgVVJMXHJcbiAgICAnZG9jLycsXHJcbiAgICAnZG9jL2FjY2Vzc2liaWxpdHkvYWNjZXNzaWJpbGl0eS5odG1sJyxcclxuICAgICdkb2MvYWNjZXNzaWJpbGl0eS92b2ljaW5nLmh0bWwnLFxyXG4gICAgJ2RvYy9hLXRvdXItb2Ytc2NlbmVyeS5odG1sJyxcclxuICAgICdkb2MvaW1wbGVtZW50YXRpb24tbm90ZXMuaHRtbCcsXHJcbiAgICAnZG9jL2xheW91dC5odG1sJyxcclxuICAgICdkb2MvdXNlci1pbnB1dC5odG1sJyxcclxuICAgICdleGFtcGxlcy8nLFxyXG4gICAgJ2V4YW1wbGVzL2NyZWF0b3ItcGF0dGVybi5odG1sJyxcclxuICAgICdleGFtcGxlcy9jdXJzb3JzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2hlbGxvLXdvcmxkLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2lucHV0LW11bHRpcGxlLWRpc3BsYXlzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2lucHV0Lmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL21vdXNlLXdoZWVsLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL211bHRpLXRvdWNoLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL25vZGVzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL3NoYXBlcy5odG1sJyxcclxuICAgICdleGFtcGxlcy9zcHJpdGVzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktc2hhcGVzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktYnV0dG9uLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktYW5pbWF0aW9uLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktbGlzdGVuZXJzLmh0bWwnLFxyXG4gICAgJ2V4YW1wbGVzL2FjY2Vzc2liaWxpdHktdXBkYXRpbmctcGRvbS5odG1sJyxcclxuICAgICdleGFtcGxlcy9hY2Nlc3NpYmlsaXR5LXNsaWRlci5odG1sJyxcclxuICAgIC8vICdleGFtcGxlcy93ZWJnbG5vZGUuaHRtbCcsIC8vIGN1cnJlbnRseSBkaXNhYmxlZCwgc2luY2UgaXQgZmFpbHMgd2l0aG91dCB3ZWJnbFxyXG4gICAgJ3Rlc3RzLycsXHJcbiAgICAndGVzdHMvcGxheWdyb3VuZC5odG1sJyxcclxuICAgICd0ZXN0cy9yZW5kZXJlci1jb21wYXJpc29uLmh0bWw/cmVuZGVyZXJzPWNhbnZhcyxzdmcsZG9tJyxcclxuICAgICd0ZXN0cy9zYW5kYm94Lmh0bWwnLFxyXG4gICAgJ3Rlc3RzL3RleHQtYm91bmRzLWNvbXBhcmlzb24uaHRtbCcsXHJcbiAgICAndGVzdHMvdGV4dC1xdWFsaXR5LXRlc3QuaHRtbCdcclxuICBdXHJcbn0sIHtcclxuICByZXBvOiAncGhldC1saWInLFxyXG4gIHVybHM6IFtcclxuICAgICdkb2MvbGF5b3V0LWV4ZW1wbGFycy5odG1sJ1xyXG4gIF1cclxufSwge1xyXG4gIHJlcG86ICdwaGV0LWlvLXdyYXBwZXJzJyxcclxuICB1cmxzOiBbXHJcbiAgICAndGVzdHMvRkFNQi0yLjItcGhldGlvLXdyYXBwZXItdGVzdC5odG1sJ1xyXG4gIF1cclxufSwge1xyXG4gIHJlcG86ICdwaGV0LWlvLXdlYnNpdGUnLFxyXG4gIHVybHM6IFtcclxuICAgICdyb290L2Rldmd1aWRlLycsXHJcbiAgICAncm9vdC9kZXZndWlkZS9hcGlfb3ZlcnZpZXcuaHRtbCcsXHJcbiAgICAncm9vdC9pby1zb2x1dGlvbnMvJyxcclxuICAgICdyb290L2lvLWZlYXR1cmVzLycsXHJcbiAgICAncm9vdC9pby1zb2x1dGlvbnMvdmlydHVhbC1sYWIvc2F0dXJhdGlvbi5odG1sJyxcclxuICAgICdyb290L2lvLXNvbHV0aW9ucy9vbmxpbmUtaG9tZXdvcmsvJyxcclxuICAgICdyb290L2lvLXNvbHV0aW9ucy9lLXRleHRib29rLycsXHJcbiAgICAncm9vdC9pby1mZWF0dXJlcy9jdXN0b21pemUuaHRtbCcsXHJcbiAgICAncm9vdC9pby1mZWF0dXJlcy9pbnRlZ3JhdGUuaHRtbCcsXHJcbiAgICAncm9vdC9pby1mZWF0dXJlcy9hc3Nlc3MuaHRtbCcsXHJcbiAgICAncm9vdC9jb250YWN0LycsXHJcbiAgICAncm9vdC9hYm91dC8nLFxyXG4gICAgJ3Jvb3QvYWJvdXQvdGVhbS8nLFxyXG4gICAgJ3Jvb3QvcGFydG5lcnNoaXBzLycsXHJcbiAgICAncm9vdC8nXHJcbiAgXVxyXG59IF0uZm9yRWFjaCggKCB7IHJlcG8sIHVybHMgfSApID0+IHtcclxuICB1cmxzLmZvckVhY2goIHBhZ2Vsb2FkUmVsYXRpdmVVUkwgPT4ge1xyXG4gICAgdGVzdHMucHVzaCgge1xyXG4gICAgICB0ZXN0OiBbIHJlcG8sICdwYWdlbG9hZCcsIGAvJHtwYWdlbG9hZFJlbGF0aXZlVVJMfWAgXSxcclxuICAgICAgdHlwZTogJ3BhZ2Vsb2FkLXRlc3QnLFxyXG4gICAgICB1cmw6IGAke3JlcG99LyR7cGFnZWxvYWRSZWxhdGl2ZVVSTH1gLFxyXG4gICAgICBwcmlvcml0eTogNCAvLyBGYXN0IHRvIHRlc3QsIHNvIHRlc3QgdGhlbSBtb3JlXHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59ICk7XHJcblxyXG4vLyAvLyBQYWdlLWxvYWQgdGVzdHMgKGJ1aWx0KVxyXG4vLyBbXHJcbi8vXHJcbi8vIF0uZm9yRWFjaCggKCB7IHJlcG8sIHVybHMgfSApID0+IHtcclxuLy8gICB1cmxzLmZvckVhY2goIHBhZ2Vsb2FkUmVsYXRpdmVVUkwgPT4ge1xyXG4vLyAgICAgdGVzdHMucHVzaCgge1xyXG4vLyAgICAgICB0ZXN0OiBbIHJlcG8sICdwYWdlbG9hZCcsIGAvJHtwYWdlbG9hZFJlbGF0aXZlVVJMfWAgXSxcclxuLy8gICAgICAgdHlwZTogJ3BhZ2Vsb2FkLXRlc3QnLFxyXG4vLyAgICAgICB1cmw6IGAke3JlcG99LyR7cGFnZWxvYWRSZWxhdGl2ZVVSTH1gLFxyXG4vLyAgICAgICBwcmlvcml0eTogNSwgLy8gV2hlbiB0aGVzZSBhcmUgYnVpbHQsIGl0IHNob3VsZCBiZSByZWFsbHkgcXVpY2sgdG8gdGVzdFxyXG4vL1xyXG4vLyAgICAgICBicmFuZDogJ3BoZXQnLFxyXG4vLyAgICAgICBlczU6IHRydWVcclxuLy8gICAgIH0gKTtcclxuLy8gICB9ICk7XHJcbi8vIH0gKTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBQdWJsaWMgcXVlcnkgcGFyYW1ldGVyIHRlc3RzXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuLy8gdGVzdCBub24tZGVmYXVsdCBwdWJsaWMgcXVlcnkgcGFyYW1ldGVyIHZhbHVlcyB0byBtYWtlIHN1cmUgdGhlcmUgYXJlIG5vIG9idmlvdXMgcHJvYmxlbXMuXHJcbmNvbnN0IGNvbW1vblF1ZXJ5UGFyYW1ldGVycyA9IHtcclxuICBhbGxvd0xpbmtzRmFsc2U6ICdicmFuZD1waGV0JmZ1enomZWEmYWxsb3dMaW5rcz1mYWxzZScsXHJcbiAgc2NyZWVuczE6ICdicmFuZD1waGV0JmZ1enomZWEmc2NyZWVucz0xJyxcclxuICBzY3JlZW5zMjE6ICdicmFuZD1waGV0JmZ1enomZWEmc2NyZWVucz0yLDEnLFxyXG4gIHNjcmVlbnMyMU5vSG9tZTogJ2JyYW5kPXBoZXQmZnV6eiZlYSZzY3JlZW5zPTIsMSZob21lU2NyZWVuPWZhbHNlJyxcclxuICBpbml0aWFsU2NyZWVuMk5vSG9tZTogJ2JyYW5kPXBoZXQmZnV6eiZlYSZpbml0aWFsU2NyZWVuPTImaG9tZVNjcmVlbj1mYWxzZScsXHJcbiAgaW5pdGlhbFNjcmVlbjI6ICdicmFuZD1waGV0JmZ1enomZWEmaW5pdGlhbFNjcmVlbj0yJyxcclxuXHJcbiAgLy8gUHVycG9zZWZ1bGx5IHVzZSBpbmNvcnJlY3Qgc3ludGF4IHRvIG1ha2Ugc3VyZSBpdCBpcyBjYXVnaHQgY29ycmVjdGx5IHdpdGhvdXQgY3Jhc2hpbmdcclxuICBzY3JlZW5zVmVyYm9zZTogJ2JyYW5kPXBoZXQmZnV6eiZzY3JlZW5zPVNjcmVlbjEsU2NyZWVuMicsXHJcbiAgd3JvbmdJbml0aWFsU2NyZWVuMTogJ2JyYW5kPXBoZXQmZnV6eiZpbml0aWFsU2NyZWVuPTMnLFxyXG4gIHdyb25nSW5pdGlhbFNjcmVlbjI6ICdicmFuZD1waGV0JmZ1enomaW5pdGlhbFNjcmVlbj0yJnNjcmVlbnM9MScsXHJcbiAgd3JvbmdTY3JlZW5zMTogJ2JyYW5kPXBoZXQmZnV6eiZzY3JlZW5zPTMnLFxyXG4gIHdyb25nU2NyZWVuczI6ICdicmFuZD1waGV0JmZ1enomc2NyZWVucz0xLDIsMycsXHJcbiAgc2NyZWVuc090aGVyOiAnYnJhbmQ9cGhldCZmdXp6JnNjcmVlbnM9MS4xLFNjcmVlbjInXHJcbn07XHJcbk9iamVjdC5rZXlzKCBjb21tb25RdWVyeVBhcmFtZXRlcnMgKS5mb3JFYWNoKCBuYW1lID0+IHtcclxuICBjb25zdCBxdWVyeVN0cmluZyA9IGNvbW1vblF1ZXJ5UGFyYW1ldGVyc1sgbmFtZSBdO1xyXG5cclxuICAvLyByYW5kb21seSBwaWNrZWQgbXVsdGktc2NyZWVuIHNpbSB0byB0ZXN0IHF1ZXJ5IHBhcmFtZXRlcnMgKGhlbmNlIGNhbGxpbmcgaXQgYSBqb2lzdCB0ZXN0KVxyXG4gIHRlc3RzLnB1c2goIHtcclxuICAgIHRlc3Q6IFsgJ2pvaXN0JywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJywgbmFtZSBdLFxyXG4gICAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICAgIHVybDogJ2FjaWQtYmFzZS1zb2x1dGlvbnMvYWNpZC1iYXNlLXNvbHV0aW9uc19lbi5odG1sJyxcclxuICAgIHF1ZXJ5UGFyYW1ldGVyczogcXVlcnlTdHJpbmdcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIFBoRVQtaU8gbWlncmF0aW9uIHRlc3RpbmdcclxucGhldGlvSHlkcm9nZW5TaW1zLmZvckVhY2goIHRlc3REYXRhID0+IHtcclxuICBjb25zdCBzaW1OYW1lID0gdGVzdERhdGEuc2ltO1xyXG4gIGNvbnN0IG9sZFZlcnNpb24gPSB0ZXN0RGF0YS52ZXJzaW9uO1xyXG4gIGNvbnN0IGdldFRlc3QgPSByZXBvcnRDb250ZXh0ID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlc3Q6IFsgc2ltTmFtZSwgJ21pZ3JhdGlvbicsIGAke29sZFZlcnNpb259LT5tYWluYCwgcmVwb3J0Q29udGV4dCBdLFxyXG4gICAgICB0eXBlOiAnd3JhcHBlci10ZXN0JyxcclxuICAgICAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTgwMDAwJywgLy8gTG9hZGluZyAyIHN0dWRpb3MgdGFrZXMgdGltZSFcclxuICAgICAgdXJsOiBgcGhldC1pby13cmFwcGVycy9taWdyYXRpb24vP3NpbT0ke3NpbU5hbWV9Jm9sZFZlcnNpb249JHtvbGRWZXJzaW9ufSZwaGV0aW9NaWdyYXRpb25SZXBvcnQ9JHtyZXBvcnRDb250ZXh0fWAgK1xyXG4gICAgICAgICAgICcmbG9jYWxlcz0qJnBoZXRpb0RlYnVnPXRydWUmcGhldGlvV3JhcHBlckRlYnVnPXRydWUmZnV6eiZtaWdyYXRpb25SYXRlPTUwMDAmJ1xyXG4gICAgfTtcclxuICB9O1xyXG4gIHRlc3RzLnB1c2goIGdldFRlc3QoICdhc3NlcnQnICkgKTtcclxuICB0ZXN0cy5wdXNoKCBnZXRUZXN0KCAnZGV2JyApICk7IC8vIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydCBzdGF0ZSBncmFjZSB0byBtYWtlIHN1cmUgd2UgZG9uJ3QgZmFpbCB3aGlsZSBzZXR0aW5nIHRoZSBzdGF0ZS5cclxufSApO1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIEFkZGl0aW9uYWwgc2ltLXNwZWNpZmljIHRlc3RzXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuLy8gYmVlcnMtbGF3LWxhYjogdGVzdCB2YXJpb3VzIHF1ZXJ5IHBhcmFtZXRlcnNcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ2JlZXJzLWxhdy1sYWInLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdiZWVycy1sYXctbGFiL2JlZXJzLWxhdy1sYWJfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnNob3dTb2x1dGVBbW91bnQmY29uY2VudHJhdGlvbk1ldGVyVW5pdHM9cGVyY2VudCZiZWFrZXJVbml0cz1taWxsaWxpdGVycydcclxufSApO1xyXG5cclxuLy8gY2lyY3VpdC1jb25zdHJ1Y3Rpb24ta2l0LWFjOiB0ZXN0IHZhcmlvdXMgcXVlcnkgcGFyYW1ldGVyc1xyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnY2lyY3VpdC1jb25zdHJ1Y3Rpb24ta2l0LWFjJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnY2lyY3VpdC1jb25zdHJ1Y3Rpb24ta2l0LWFjL2NpcmN1aXQtY29uc3RydWN0aW9uLWtpdC1hY19lbi5odG1sJyxcclxuXHJcbiAgLy8gUHVibGljIHF1ZXJ5IHBhcmFtZXRlcnMgdGhhdCBjYW5ub3QgYmUgdHJpZ2dlcmVkIGZyb20gb3B0aW9ucyB3aXRoaW4gdGhlIHNpbVxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZzaG93Q3VycmVudCZhZGRSZWFsQnVsYnMmbW9yZVdpcmVzJm1vcmVJbmR1Y3RvcnMnXHJcbn0gKTtcclxuXHJcbi8vIGVuZXJneSBmb3JtcyBhbmQgY2hhbmdlczogZm91ciBibG9ja3MgYW5kIG9uZSBidXJuZXJcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlcycsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlcy9lbmVyZ3ktZm9ybXMtYW5kLWNoYW5nZXNfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnNjcmVlbnM9MSZlbGVtZW50cz1pcm9uLGJyaWNrLGlyb24sYnJpY2smYnVybmVycz0xJ1xyXG59ICk7XHJcblxyXG4vLyBlbmVyZ3kgZm9ybXMgYW5kIGNoYW5nZXM6IHR3byBiZWFrZXJzIGFuZCAyIGJ1cm5lcnNcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlcycsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycy0yJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzL2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlc19lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomc2NyZWVucz0xJiZlbGVtZW50cz1vbGl2ZU9pbCx3YXRlciZidXJuZXJzPTInXHJcbn0gKTtcclxuXHJcbi8vIGdhcy1wcm9wZXJ0aWVzOiB0ZXN0IHByZXNzdXJlTm9pc2UgcXVlcnkgcGFyYW1ldGVyXHJcbnRlc3RzLnB1c2goIHtcclxuICB0ZXN0OiBbICdnYXMtcHJvcGVydGllcycsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ2dhcy1wcm9wZXJ0aWVzL2dhcy1wcm9wZXJ0aWVzX2VuLmh0bWwnLFxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZwcmVzc3VyZU5vaXNlPWZhbHNlJ1xyXG59ICk7XHJcblxyXG4vLyBuYXR1cmFsLXNlbGVjdGlvbjogdGVzdCB2YXJpb3VzIHF1ZXJ5IHBhcmFtZXRlcnNcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ25hdHVyYWwtc2VsZWN0aW9uJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnbmF0dXJhbC1zZWxlY3Rpb24vbmF0dXJhbC1zZWxlY3Rpb25fZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JmFsbGVsZXNWaXNpYmxlPWZhbHNlJmludHJvTXV0YXRpb25zPUYmaW50cm9Qb3B1bGF0aW9uPTEwRmYmbGFiTXV0YXRpb25zPUZlVCZsYWJQb3B1bGF0aW9uPTJGRmVldHQsMmZmRUV0dCwyZmZlZVRUJ1xyXG59ICk7XHJcblxyXG4vLyBuYXR1cmFsLXNlbGVjdGlvbjogcnVuIHRoZSBnZW5lcmF0aW9uIGNsb2NrIGZhc3Rlciwgc28gdGhhdCBtb3JlIHRoaW5ncyBhcmUgbGlhYmxlIHRvIGhhcHBlblxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnbmF0dXJhbC1zZWxlY3Rpb24nLCAnZnV6eicsICd1bmJ1aWx0JywgJ3NlY29uZHNQZXJHZW5lcmF0aW9uJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnbmF0dXJhbC1zZWxlY3Rpb24vbmF0dXJhbC1zZWxlY3Rpb25fZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JnNlY29uZHNQZXJHZW5lcmF0aW9uPTEnXHJcbn0gKTtcclxuXHJcbi8vIHBoLXNjYWxlOiB0ZXN0IHRoZSBhdXRvZmlsbCBxdWVyeSBwYXJhbWV0ZXJcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ3BoLXNjYWxlJywgJ2F1dG9maWxsLWZ1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAncGgtc2NhbGUvcGgtc2NhbGVfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JmF1dG9GaWxsPWZhbHNlJ1xyXG59ICk7XHJcblxyXG4vLyBudW1iZXItcGxheTogdGVzdCB0aGUgc2Vjb25kIGxhbmd1YWdlIHByZWZlcmVuY2VcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ251bWJlci1wbGF5JywgJ3NlY29uZC1sYW5ndWFnZS1mdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ251bWJlci1wbGF5L251bWJlci1wbGF5X2VuLmh0bWwnLFxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZsb2NhbGVzPSomc2Vjb25kTG9jYWxlPWVzJ1xyXG59ICk7XHJcblxyXG4vLyBudW1iZXItY29tcGFyZTogdGVzdCB0aGUgc2Vjb25kIGxhbmd1YWdlIHByZWZlcmVuY2VcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ251bWJlci1jb21wYXJlJywgJ3NlY29uZC1sYW5ndWFnZS1mdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ251bWJlci1jb21wYXJlL251bWJlci1jb21wYXJlX2VuLmh0bWwnLFxyXG4gIHF1ZXJ5UGFyYW1ldGVyczogJ2JyYW5kPXBoZXQmZWEmZnV6eiZsb2NhbGVzPSomc2Vjb25kTG9jYWxlPWVzJ1xyXG59ICk7XHJcblxyXG4vLyBxdWFkcmlsYXRlcmFsOiB0ZXN0cyB0aGUgcHVibGljIHF1ZXJ5IHBhcmFtZXRlcnMgZm9yIGNvbmZpZ3VyYXRpb25zIHRoYXQgY2Fubm90IGJlIGNoYW5nZWQgZHVyaW5nIHJ1bnRpbWVcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ3F1YWRyaWxhdGVyYWwnLCAnZnV6eicsICd1bmJ1aWx0JywgJ3F1ZXJ5LXBhcmFtZXRlcnMnIF0sXHJcbiAgdHlwZTogJ3NpbS10ZXN0JyxcclxuICB1cmw6ICdxdWFkcmlsYXRlcmFsL3F1YWRyaWxhdGVyYWxfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiAnYnJhbmQ9cGhldCZlYSZmdXp6JmluaGVyaXRUcmFwZXpvaWRTb3VuZCZyZWR1Y2VkU3RlcFNpemUnXHJcbn0gKTtcclxuXHJcbi8vIGJ1aWxkLWEtbnVjbGV1czogdGVzdHMgdGhlIHB1YmxpYyBxdWVyeSBwYXJhbWV0ZXJzIGZvciBjb25maWd1cmF0aW9ucyB0aGF0IGNhbm5vdCBiZSBjaGFuZ2VkIGR1cmluZyBydW50aW1lXHJcbmNvbnN0IGRlY2F5UHJvdG9ucyA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiA5NC45OSApO1xyXG5jb25zdCBkZWNheU5ldXRyb25zID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDE0Ni45OSApO1xyXG5jb25zdCBjaGFydEludHJvUHJvdG9ucyA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAxMC45OSApO1xyXG5jb25zdCBjaGFydEludHJvTmV1dHJvbnMgPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogMTIuOTkgKTtcclxudGVzdHMucHVzaCgge1xyXG4gIHRlc3Q6IFsgJ2J1aWxkLWEtbnVjbGV1cycsICdmdXp6JywgJ3VuYnVpbHQnLCAncXVlcnktcGFyYW1ldGVycycgXSxcclxuICB0eXBlOiAnc2ltLXRlc3QnLFxyXG4gIHVybDogJ2J1aWxkLWEtbnVjbGV1cy9idWlsZC1hLW51Y2xldXNfZW4uaHRtbCcsXHJcbiAgcXVlcnlQYXJhbWV0ZXJzOiBgYnJhbmQ9cGhldCZlYSZmdXp6JmRlY2F5U2NyZWVuUHJvdG9ucz0ke2RlY2F5UHJvdG9uc30mZGVjYXlTY3JlZW5OZXV0cm9ucz0ke2RlY2F5TmV1dHJvbnN9JmNoYXJ0SW50b1NjcmVlblByb3RvbnM9JHtjaGFydEludHJvUHJvdG9uc30mY2hhcnRJbnRvU2NyZWVuTmV1dHJvbnM9JHtjaGFydEludHJvTmV1dHJvbnN9YFxyXG59ICk7XHJcblxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnYnVpbGQtYS1udWNsZXVzJywgJ2Z1enonLCAndW5idWlsdCcsICdxdWVyeS1wYXJhbWV0ZXJzLXdyb25nJyBdLFxyXG4gIHR5cGU6ICdzaW0tdGVzdCcsXHJcbiAgdXJsOiAnYnVpbGQtYS1udWNsZXVzL2J1aWxkLWEtbnVjbGV1c19lbi5odG1sJyxcclxuICBxdWVyeVBhcmFtZXRlcnM6ICdicmFuZD1waGV0JmVhJmZ1enomZGVjYXlTY3JlZW5Qcm90b25zPTIwMCZkZWNheVNjcmVlbk5ldXRyb25zPTIwMCZjaGFydEludG9TY3JlZW5Qcm90b25zPTIwMCZjaGFydEludG9TY3JlZW5OZXV0cm9ucz0yMDAnXHJcbn0gKTtcclxuXHJcbi8vIG15LXNvbGFyLXN5c3RlbVxyXG50ZXN0cy5wdXNoKCB7XHJcbiAgdGVzdDogWyAnbXktc29sYXItc3lzdGVtJywgJ2N1c3RvbS13cmFwcGVyJywgJ3VuYnVpbHQnIF0sXHJcbiAgdHlwZTogJ3dyYXBwZXItdGVzdCcsXHJcbiAgdGVzdFF1ZXJ5UGFyYW1ldGVyczogJ2R1cmF0aW9uPTcwMDAwJywgLy8gdGhlcmUgYXJlIG11bHRpcGxlIHN5c3RlbXMgdG8gcGxheSB0aHJvdWdoIGFuZCBmdXp6XHJcbiAgdXJsOiAncGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvbXktc29sYXItc3lzdGVtL3dyYXBwZXJzL215LXNvbGFyLXN5c3RlbS10ZXN0cy8/c2ltPW15LXNvbGFyLXN5c3RlbSZwaGV0aW9EZWJ1Zz10cnVlJnBoZXRpb1dyYXBwZXJEZWJ1Zz10cnVlJ1xyXG59ICk7XHJcblxyXG5jb25zb2xlLmxvZyggSlNPTi5zdHJpbmdpZnkoIHRlc3RzLCBudWxsLCAyICkgKTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLGNBQWMsR0FBR0MsT0FBTyxDQUFFLHlCQUEwQixDQUFDO0FBQzNELElBQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFFLHNCQUF1QixDQUFDO0FBQ3JELElBQU1FLEVBQUUsR0FBR0YsT0FBTyxDQUFFLElBQUssQ0FBQztBQUUxQixJQUFNRyxLQUFLLEdBQUdKLGNBQWMsQ0FBQyxDQUFDO0FBQzlCLElBQU1LLFdBQVcsR0FBR0gsV0FBVyxDQUFFLFNBQVUsQ0FBQztBQUM1QyxJQUFNSSxvQkFBb0IsR0FBR0osV0FBVyxDQUFFLG9CQUFxQixDQUFDO0FBQ2hFLElBQU1LLGFBQWEsR0FBR0wsV0FBVyxDQUFFLGtCQUFtQixDQUFDO0FBQ3ZELElBQU1NLDJCQUEyQixHQUFHTixXQUFXLENBQUUseUJBQTBCLENBQUM7QUFDNUUsSUFBTU8sd0JBQXdCLEdBQUdQLFdBQVcsQ0FBRSwyQkFBNEIsQ0FBQztBQUMzRSxJQUFNUSxhQUFhLEdBQUdSLFdBQVcsQ0FBRSxZQUFhLENBQUM7QUFDakQsSUFBTVMsWUFBWSxHQUFHVCxXQUFXLENBQUUsU0FBVSxDQUFDO0FBQzdDLElBQU1VLDBCQUEwQixHQUFHVixXQUFXLENBQUUsVUFBVyxDQUFDO0FBQzVELElBQU1XLGtCQUFrQixHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBRVosRUFBRSxDQUFDYSxZQUFZLENBQUUseUNBQXlDLEVBQUUsTUFBTyxDQUFDLENBQUNDLElBQUksQ0FBQyxDQUFFLENBQUM7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QUFHLEVBQUUscUNBQXFDO0VBQzFDQyxlQUFlLEVBQUU7QUFDbkIsQ0FBRSxDQUFDOztBQUVIO0FBQ0EsSUFBTTBDLFlBQVksR0FBR0MsSUFBSSxDQUFDQyxLQUFLLENBQUVELElBQUksQ0FBQ0UsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFNLENBQUM7QUFDeEQsSUFBTUMsYUFBYSxHQUFHSCxJQUFJLENBQUNDLEtBQUssQ0FBRUQsSUFBSSxDQUFDRSxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU8sQ0FBQztBQUMxRCxJQUFNRSxpQkFBaUIsR0FBR0osSUFBSSxDQUFDQyxLQUFLLENBQUVELElBQUksQ0FBQ0UsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFNLENBQUM7QUFDN0QsSUFBTUcsa0JBQWtCLEdBQUdMLElBQUksQ0FBQ0MsS0FBSyxDQUFFRCxJQUFJLENBQUNFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsS0FBTSxDQUFDO0FBQzlEMUQsS0FBSyxDQUFDQyxJQUFJLENBQUU7RUFDVkMsSUFBSSxFQUFFLENBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBRTtFQUNsRUMsSUFBSSxFQUFFLFVBQVU7RUFDaEJTLEdBQUcsRUFBRSx5Q0FBeUM7RUFDOUNDLGVBQWUsMkNBQUFSLE1BQUEsQ0FBMkNrRCxZQUFZLDJCQUFBbEQsTUFBQSxDQUF3QnNELGFBQWEsOEJBQUF0RCxNQUFBLENBQTJCdUQsaUJBQWlCLCtCQUFBdkQsTUFBQSxDQUE0QndELGtCQUFrQjtBQUN2TSxDQUFFLENBQUM7QUFFSDdELEtBQUssQ0FBQ0MsSUFBSSxDQUFFO0VBQ1ZDLElBQUksRUFBRSxDQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsd0JBQXdCLENBQUU7RUFDeEVDLElBQUksRUFBRSxVQUFVO0VBQ2hCUyxHQUFHLEVBQUUseUNBQXlDO0VBQzlDQyxlQUFlLEVBQUU7QUFDbkIsQ0FBRSxDQUFDOztBQUVIO0FBQ0FiLEtBQUssQ0FBQ0MsSUFBSSxDQUFFO0VBQ1ZDLElBQUksRUFBRSxDQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFNBQVMsQ0FBRTtFQUN4REMsSUFBSSxFQUFFLGNBQWM7RUFDcEJXLG1CQUFtQixFQUFFLGdCQUFnQjtFQUFFO0VBQ3ZDRixHQUFHLEVBQUU7QUFDUCxDQUFFLENBQUM7QUFFSGtELE9BQU8sQ0FBQ0MsR0FBRyxDQUFFckUsSUFBSSxDQUFDc0UsU0FBUyxDQUFFaEUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==