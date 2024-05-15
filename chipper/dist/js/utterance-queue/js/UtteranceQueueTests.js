// Copyright 2022-2024, University of Colorado Boulder

/**
 * QUnit tests for Utterance and UtteranceQueue that use voicingManager as the Announcer.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import stepTimer from '../../axon/js/stepTimer.js';
import { Display, voicingManager } from '../../scenery/js/imports.js';
import responseCollector from './responseCollector.js';
import Utterance from './Utterance.js';
import UtteranceQueue from './UtteranceQueue.js';
import SpeechSynthesisAnnouncer from './SpeechSynthesisAnnouncer.js';
import UtteranceQueueTestUtils from './UtteranceQueueTestUtils.js';
const queryParameters = QueryStringMachine.getAll({
  // When enabled, extra tests are run that verify the timing of Utterances. It requires the browser to actually
  // speak with SpeechSynthesis. That is only possibly if there is some manual input into the browser window.
  // With this query parameter, there is a brief pause before the first tests are run, so that you can click
  // somewhere in the browser window.
  manualInput: {
    type: 'flag'
  }
});

// See VOICING_UTTERANCE_INTERVAL in voicingManager for why this is necessary. We need to wait this long before
// checking on the utteranceQueue state when working with voicing.
const VOICING_UTTERANCE_INTERVAL = 125;

// When we want to add a little time to make that an interval has completed.
const TIMING_BUFFER = VOICING_UTTERANCE_INTERVAL + 50;
const DEFAULT_VOICE_TIMEOUT = 3000;

// @ts-expect-error we don't want to expose the constructor of this singleton just for unit tests.
const testVoicingManager = new voicingManager.constructor();
const testVoicingUtteranceQueue = new UtteranceQueue(testVoicingManager);
const setDefaultVoice = async () => {
  let resolved = false;
  return new Promise(resolve => {
    const setIt = () => {
      if (!resolved) {
        testVoicingManager.voiceProperty.value = testVoicingManager.voicesProperty.value[0] || null;
        clearTimeout(timeout);
        resolved = true;
        resolve();
      }
    };
    const timeout = setTimeout(() => {
      // eslint-disable-line bad-sim-text
      setIt();
    }, DEFAULT_VOICE_TIMEOUT);
    if (testVoicingManager.voicesProperty.value.length > 0) {
      setIt();
    } else {
      testVoicingManager.voicesProperty.lazyLink(() => {
        setIt();
      });
    }
  });
};
testVoicingManager.initialize(Display.userGestureEmitter);
testVoicingManager.enabledProperty.value = true;

// helper es6 functions from  https://stackoverflow.com/questions/33289726/combination-of-async-function-await-settimeout/33292942
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms)); // eslint-disable-line bad-sim-text
}
let alerts = [];

// Utterance options that will have no cancellation from cancelSelf and cancelOther
const noCancelOptions = {
  cancelSelf: false,
  cancelOther: false
};
const timeUtterance = utterance => {
  return new Promise(resolve => {
    const startTime = Date.now();
    testVoicingUtteranceQueue.addToBack(utterance);
    testVoicingManager.announcementCompleteEmitter.addListener(function toRemove(completeUtterance) {
      if (completeUtterance === utterance) {
        resolve(Date.now() - startTime);
        testVoicingManager.announcementCompleteEmitter.removeListener(toRemove);
      }
    });
  });
};

// Reach into the testVoicingManager and get a reference to the Utterance that is currently being spoken for tests.
// Returns null if the Announcer doesn't have a currentlySpeakingUtterance
const getSpeakingUtterance = () => {
  return testVoicingManager['speakingSpeechSynthesisUtteranceWrapper'] ? testVoicingManager['speakingSpeechSynthesisUtteranceWrapper'].utterance : null;
};
const firstUtterance = new Utterance({
  alert: 'This is the first utterance',
  alertStableDelay: 0,
  announcerOptions: noCancelOptions
});
const secondUtterance = new Utterance({
  alert: 'This is the second utterance',
  alertStableDelay: 0,
  announcerOptions: noCancelOptions
});
const thirdUtterance = new Utterance({
  alert: 'This is the third utterance',
  alertStableDelay: 0,
  announcerOptions: noCancelOptions
});
let timeForFirstUtterance;
let timeForSecondUtterance;
let timeForThirdUtterance;
let intervalID;
QUnit.module('UtteranceQueue', {
  before: async () => {
    // timer step in seconds, stepped 60 times per second
    const timerInterval = 1 / 60;

    // step the timer, because utteranceQueue runs on timer
    let previousTime = Date.now(); // in ms

    intervalID = window.setInterval(() => {
      // eslint-disable-line bad-sim-text

      // in ms
      const currentTime = Date.now();
      const elapsedTime = currentTime - previousTime;
      stepTimer.emit(elapsedTime / 1000); // step timer in seconds

      previousTime = currentTime;
    }, timerInterval * 1000);

    // whenever announcing, get a callback and populate the alerts array
    testVoicingManager.announcementCompleteEmitter.addListener(utterance => {
      alerts.unshift(utterance);
    });
    if (queryParameters.manualInput) {
      // This seems long, but gives us time to click into the browser before the first test. The following
      // timeUtterance calls can run almost instantly and if you don't click into the sim before they start
      // the tests can break. We try to verify that you clicked into the browser with the following error, but
      // it won't catch everyting. If you click into the browser halfway through speaking the first utterance,
      // the time for the first utterance may be greater than 2000 ms but the timings will still be off.
      await timeout(3000);
      timeForFirstUtterance = await timeUtterance(firstUtterance);
      timeForSecondUtterance = await timeUtterance(secondUtterance);
      timeForThirdUtterance = await timeUtterance(thirdUtterance);

      // Make sure that speech synthesis is enabled and the Utterances are long enough for timing tests to be
      // consistent. Note that speech is faster or slower depending on your browser. Currently the test
      // utterances take ~1400 ms on Safari and ~2000 ms on Chrome.
      if (timeForFirstUtterance < 1200 || timeForSecondUtterance < 1200 || timeForThirdUtterance < 1200) {
        console.log(`timeForFirstUtterance: ${timeForFirstUtterance}, timeForThirdUtterance: ${timeForSecondUtterance}, timeForThirdUtterane: ${timeForThirdUtterance}`);
        throw new Error('time for Utterances is too short, did you click in the window before the first test started?');
      }
    }
    alerts = [];

    // Set a default voice
    await setDefaultVoice();
  },
  beforeEach: async () => {
    testVoicingUtteranceQueue.cancel();

    // all have default priority for the next test
    firstUtterance.priorityProperty.value = 1;
    secondUtterance.priorityProperty.value = 1;
    thirdUtterance.priorityProperty.value = 1;

    // Apply some workarounds that will hopefully make the tests more consistent when running on CT,
    // see https://github.com/phetsims/utterance-queue/issues/115.
    await UtteranceQueueTestUtils.beforeEachTimingWorkarounds();
    responseCollector.reset();

    // clear the alerts before each new test
    alerts = [];
  },
  after() {
    clearInterval(intervalID);
  }
});
QUnit.test('Welcome to UtteranceQueueTests!', async assert => {
  assert.ok(true, 'UtteranceQueue tests take time, run with ?manualInput and click in the window before the first test');
});
QUnit.test('prioritize utterances on add to back', async assert => {
  const utterance1 = new Utterance({
    alert: '1',
    priority: 5
  });
  const utterance2 = new Utterance({
    alert: '2',
    priority: 1
  });
  const utterance3 = new Utterance({
    alert: '3',
    priority: 1
  });
  const utterance4 = new Utterance({
    alert: '4',
    priority: 1,
    announcerOptions: {
      cancelOther: false
    }
  });
  const utterance5 = new Utterance({
    alert: '5',
    priority: 1,
    announcerOptions: {
      cancelOther: false
    }
  });
  const speechSynthesisAnnouncer = new SpeechSynthesisAnnouncer();
  speechSynthesisAnnouncer.hasSpoken = true; // HAX

  const utteranceQueue = new UtteranceQueue(speechSynthesisAnnouncer);
  assert.ok(utteranceQueue['queue'].length === 0, 'nothing man');
  utteranceQueue.addToBack(utterance1);
  assert.ok(utteranceQueue['queue'].length === 1, 'one add to back');
  utteranceQueue.addToBack(utterance2);
  assert.ok(utteranceQueue['queue'].length === 2, 'one add to back');
  utteranceQueue.addToBack(utterance3);
  assert.ok(utteranceQueue['queue'].length === 2, 'one add to back');
  assert.ok(utteranceQueue['queue'][0].utterance === utterance1, 'one add to back');
  assert.ok(utteranceQueue['queue'][1].utterance === utterance3, 'utterance3 removed utterance1 because cancelOther:true');
  utteranceQueue.addToBack(utterance4);
  assert.ok(utteranceQueue['queue'].length === 3, 'one add to back');
  assert.ok(utteranceQueue['queue'][0].utterance === utterance1, 'one add to back');
  assert.ok(utteranceQueue['queue'][1].utterance === utterance3, 'utterance3 removed utterance1 because cancelOther:true');
  assert.ok(utteranceQueue['queue'][2].utterance === utterance4, 'utterance4 does not removed utterance3 because cancelOther:true');
  utteranceQueue.addToBack(utterance5);
  assert.ok(utteranceQueue['queue'].length === 4, 'one add to back');
  assert.ok(utteranceQueue['queue'][0].utterance === utterance1, 'one add to back');
  assert.ok(utteranceQueue['queue'][1].utterance === utterance3, 'utterance3 removed utterance1 because cancelOther:true');
  assert.ok(utteranceQueue['queue'][2].utterance === utterance4, 'utterance4 does not removed utterance3 because cancelOther:true');
  assert.ok(utteranceQueue['queue'][3].utterance === utterance5, 'utterance4 does not removed utterance3 because cancelOther:true');

  /**
   * UtteranceQueue.prioritizeUtterances() handles prioritizing utterances before AND after the changed utterance. We want
   * to test here that it can handle that when both need updating in the same call. Thus, don't notify for one case,
   * and let the prioritization of the queue occur all during one priority listener call.
   *
   * HAX alert - please make this value between the utterance4 value below and also lower than utterance1.
   */
  utterance5.priorityProperty['setPropertyValue'](3);
  utterance4.priorityProperty.value = 2;
  assert.ok(utteranceQueue['queue'].length === 2, 'one add to back');
  assert.ok(utteranceQueue['queue'][0].utterance === utterance1, 'one add to back');
  assert.ok(utteranceQueue['queue'][1].utterance === utterance5, 'utterance5 kicked utterance4 outta the park.');
});

// CT and some headless browsers don't support SpeechSynthesis
if (testVoicingManager.voicesProperty.value > 0) {
  QUnit.test('utterance.announcerOptions.voice', async assert => {
    const done = assert.async();
    testVoicingManager.voiceProperty.value = null;
    const voice = testVoicingManager.voicesProperty.value[0];
    const utterance = new Utterance({
      alert: 'one',
      announcerOptions: {
        voice: voice
      }
    });
    testVoicingManager.endSpeakingEmitter.addListener(function myListener() {
      const x = testVoicingManager['speakingSpeechSynthesisUtteranceWrapper'];
      assert.ok(x, 'we should have one');
      assert.ok(x.speechSynthesisUtterance.voice === voice, 'voice should match the provided utterance\'s');
      testVoicingManager.endSpeakingEmitter.removeListener(myListener);
      done();
    });
    testVoicingManager.speakIgnoringEnabled(utterance);
    testVoicingManager.voiceProperty.value = voice;
  });
}
if (queryParameters.manualInput) {
  QUnit.test('Basic UtteranceQueue test', async assert => {
    // basic test, we should hear all three Utterances
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    await timeout(timeForFirstUtterance + timeForSecondUtterance + timeForThirdUtterance + TIMING_BUFFER * 3);
    assert.ok(alerts.length === 3, 'Three basic Utterances went through the queue');
  });
  QUnit.test('cancelUtterance tests', async assert => {
    // Test that cancelUtterance will not introduce a memory leak with multiple listeners on the Property
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    await timeout(timeForFirstUtterance / 2);
    testVoicingUtteranceQueue.cancelUtterance(firstUtterance);

    // Make sure that we handle the `end` event happening asynchronously from the cancel, this should not crash
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance was cancelled');
    assert.ok(testVoicingUtteranceQueue['queue'].length === 1, 'There is one Utterance in the queue');
  });
  QUnit.test('PriorityProperty interruption', async assert => {
    // Add all 3 to back
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    assert.ok(testVoicingUtteranceQueue['queue'].length === 3, 'All three utterances in the queue');

    // make the third Utterance high priority, it should remove the other two Utterances
    thirdUtterance.priorityProperty.value = 2;
    assert.ok(testVoicingUtteranceQueue['queue'].length === 1, 'Only the one Utterance remains');
    assert.ok(testVoicingUtteranceQueue['queue'][0].utterance === thirdUtterance, 'Only the third Utterance remains');
  });
  QUnit.test('Announced Utterance can also be in queue and interruption during announcement', async assert => {
    // while an Utterance is being announced, make sure that we can add the same Utterance to the queue and that
    // priorityProperty is still observed
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    await timeout(timeForFirstUtterance / 2);
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    await timeout(timeForFirstUtterance); // Time to get halfway through second announcement of firstUtterance

    // reduce priorityProperty of firstUtterance while it is being announced, secondUtterance should interrupt
    firstUtterance.priorityProperty.value = 0;
    await timeout(timeForSecondUtterance / 2);
    assert.ok(getSpeakingUtterance() === secondUtterance, 'Utterance being announced still observes priorityProperty');
    assert.ok(testVoicingUtteranceQueue['queue'].length === 0, 'queue empty after interruption and sending secondUtterance to Announcer');
  });
  QUnit.test('Higher priority removes earlier Utterances from queue', async assert => {
    // Unit test cases taken from examples that demonstrated the priorityProperty feature in
    // https://github.com/phetsims/utterance-queue/issues/50
    //------------------------------------------------------------------------------------------------------------------

    // Add all 3 to back
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    assert.ok(testVoicingUtteranceQueue['queue'].length === 3, 'All three utterances in the queue');
    secondUtterance.priorityProperty.value = 2;

    // enough time for the secondUtterance to start speaking while the firstUtterance was just removed from the queue
    await timeout(timeForSecondUtterance / 2);
    assert.ok(getSpeakingUtterance() === secondUtterance, 'The secondUtterance interrupted the firstUtterance because it is higher priority.');

    // enough time to finish the secondUtterance and start speaking the thirdUtterance
    await timeout(timeForSecondUtterance / 2 + timeForThirdUtterance / 2);
    assert.ok(alerts[0] === secondUtterance, 'secondUtterance spoken in full');
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance spoken after secondUtterance finished');
    //------------------------------------------------------------------------------------------------------------------
  });
  QUnit.test('Utterance removed because of self priority reduction before another is added to queue', async assert => {
    firstUtterance.priorityProperty.value = 10;
    testVoicingUtteranceQueue.addToBack(firstUtterance);

    // reduce priorityProperty before adding thirdUtterance to queue
    firstUtterance.priorityProperty.value = 0;
    testVoicingUtteranceQueue.addToBack(thirdUtterance);

    // enough time to start speaking either the first or third Utterances
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance spoken because firstUtterance.priorityProperty was reduced before adding thirdUtterance to the queue');
  });
  QUnit.test('Utterance removed because of self priority reduction after another is added to queue', async assert => {
    firstUtterance.priorityProperty.value = 10;
    testVoicingUtteranceQueue.addToBack(firstUtterance);

    // reduce priorityProperty AFTER adding thirdUtterance to queue
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    firstUtterance.priorityProperty.value = 0;

    // enough time to start speaking either the first or third Utterances
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance spoken because firstUtterance.priorityProperty was reduced after adding thirdUtterance to the queue');
  });
  QUnit.test('Utterance interruption because self priority reduced while being announced', async assert => {
    firstUtterance.priorityProperty.value = 10;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance);

    // reducing priority below third utterance should interrupt firstUtterance for thirdUtterance
    firstUtterance.priorityProperty.value = 0;

    // not enough time for firstUtterance to finish in full, but enough time to verify that it was interrupted
    await timeout(timeForFirstUtterance / 4);
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance was interrupted because its priority was reduced while it was being announced');

    // enough time for thirdUtterance to start speaking
    await timeout(timeForThirdUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance being announced after interrupting firstUtterance');
  });
  QUnit.test('Utterance interruption during annoumcement because another in the queue made higher priority', async assert => {
    firstUtterance.priorityProperty.value = 0;
    thirdUtterance.priorityProperty.value = 0;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance, 'firstUtterance being announced');

    // increasing priority of thirdUtterance in the queue should interrupt firstUtterance being announced
    thirdUtterance.priorityProperty.value = 3;

    // not enough time for firstUtterance to finish, but enough to make sure that it was interrupted
    await timeout(timeForFirstUtterance / 4);
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance was interrupted because an Utterance in the queue was made higher priority');

    // enough time for thirdUtterance to start speaking
    await timeout(timeForThirdUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance being announced after interrupting firstUtterance');
  });
  QUnit.test('Utterance NOT interrupted because self priority still relatively higher', async assert => {
    firstUtterance.priorityProperty.value = 10;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);
    await timeout(timeForFirstUtterance / 2);

    // we should still hear both Utterances in full, new priority for firstUtterance is higher than thirdUtterance
    firstUtterance.priorityProperty.value = 5;

    // not enough time for firstUtterance to finish, but enough to make sure that it was not interrupted
    await timeout(timeForFirstUtterance / 10);
    assert.ok(alerts.length === 0, 'firstUtterance was not interrupted because priority was set to a value higher than next utterance in queue');

    // enough time for thirdUtterance to start speaking after firstUtterance finishes
    await timeout(timeForThirdUtterance / 2 + timeForFirstUtterance / 2);
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance finished being announced');
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance being announced after waiting for firstUtterance');
  });
  QUnit.test('announceImmediately', async assert => {
    testVoicingUtteranceQueue.announceImmediately(firstUtterance);
    assert.ok(testVoicingUtteranceQueue['queue'].length === 0, 'announceImmediately should be synchronous with voicingManager for an empty queue');
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance, 'first utterance spoken immediately');
  });
  QUnit.test('announceImmediately reduces duplicate Utterances in queue', async assert => {
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.addToBack(thirdUtterance);

    // now speak the first utterance immediately
    testVoicingUtteranceQueue.announceImmediately(firstUtterance);
    await timeout(timeForFirstUtterance / 2);
    assert.ok(testVoicingUtteranceQueue['queue'].length === 2, 'announcing firstUtterance immediately should remove the duplicate firstUtterance in the queue');
    assert.ok(getSpeakingUtterance() === firstUtterance, 'first utterance is being spoken after announceImmediately');
  });
  QUnit.test('announceImmediately does nothing when Utterance has low priority relative to queued Utterances', async assert => {
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    firstUtterance.priorityProperty.value = 2;
    thirdUtterance.priorityProperty.value = 1;
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);

    // thirdUtterance is lower priority than next item in the queue, it should not be spoken and should not be
    // in the queue at all
    assert.ok(testVoicingUtteranceQueue['queue'].length === 2, 'only first and second utterances in the queue');
    assert.ok(!testVoicingUtteranceQueue.hasUtterance(thirdUtterance), 'thirdUtterance not in queue after announceImmediately');
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance);
    assert.ok(alerts[0] !== thirdUtterance, 'thirdUtterance was not spoken with announceImmediately');
  });
  QUnit.test('anounceImmediatelety does nothing when Utterance has low priority relative to announcing Utterance', async assert => {
    firstUtterance.priorityProperty.value = 1;
    thirdUtterance.priorityProperty.value = 1;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    firstUtterance.priorityProperty.value = 2;
    thirdUtterance.priorityProperty.value = 1;
    await timeout(timeForFirstUtterance / 2);
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);

    // thirdUtterance is lower priority than what is currently being spoken so it should NOT be heard
    await timeout(timeForFirstUtterance / 4); // less than remaining time for firstUtterance checking for interruption
    assert.ok(getSpeakingUtterance() !== thirdUtterance, 'announceImmediately should not interrupt a higher priority utterance');
    assert.ok(!testVoicingUtteranceQueue.hasUtterance(thirdUtterance), 'lower priority thirdUtterance should be dropped from the queue');
  });
  QUnit.test('Utterance spoken with announceImmediately should be interrupted if priority is reduced', async assert => {
    //--------------------------------------------------------------------------------------------------
    // The Utterance spoken with announceImmediately should be interrupted if its priority is reduced
    // below another item in the queue
    //--------------------------------------------------------------------------------------------------
    firstUtterance.priorityProperty.value = 2;
    thirdUtterance.priorityProperty.value = 2;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);
    await timeout(timeForThirdUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance is announced immediately');
    thirdUtterance.priorityProperty.value = 1;

    // the priority of the thirdUtterance is reduced while being spoken from announceImmediately, it should be
    // interrupted and the next item in the queue should be spoken
    await timeout(timeForThirdUtterance / 4); // less than the remaining time for third utterance for interruption
    assert.ok(alerts[0] === thirdUtterance, 'third utterance was interrupted by reducing its priority');
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance, 'moved on to next utterance in queue');
  });
  QUnit.test('Utterance spoken by announceImmediately is interrupted by raising priority of queued utterance', async assert => {
    firstUtterance.priorityProperty.value = 1;
    thirdUtterance.priorityProperty.value = 1;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);
    await timeout(timeForThirdUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance is announced immediately');
    firstUtterance.priorityProperty.value = 2;

    // the priority of firstUtterance is increased so the utterance of announceImmediately should be interrupted
    await timeout(timeForThirdUtterance / 4); // less than remaining time for third utterance for interruption
    assert.ok(alerts[0] === thirdUtterance, 'third utterance was interrupted by the next Utterance increasing priority');
    await timeout(timeForFirstUtterance / 2);
    assert.ok(getSpeakingUtterance() === firstUtterance, 'moved on to higher priority utterance in queue');
  });
  QUnit.test('announceImmediately interrupts another Utterance if new Utterance is high priority', async assert => {
    firstUtterance.priorityProperty.value = 1;
    thirdUtterance.priorityProperty.value = 2;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    await timeout(timeForFirstUtterance / 2);
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);
    await timeout(timeForFirstUtterance / 4); // should not be enough time for firstUtterance to finish
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance interrupted because it had lower priority');
    await timeout(timeForThirdUtterance / 2);
    assert.ok(getSpeakingUtterance() === thirdUtterance, 'thirdUtterance spoken immediately');
  });
  QUnit.test('announceImmediately will not interrupt Utterance of equal or lesser priority ', async assert => {
    firstUtterance.priorityProperty.value = 1;
    thirdUtterance.priorityProperty.value = 1;
    testVoicingUtteranceQueue.addToBack(firstUtterance);
    testVoicingUtteranceQueue.addToBack(secondUtterance);
    await timeout(timeForFirstUtterance / 2);
    testVoicingUtteranceQueue.announceImmediately(thirdUtterance);
    await timeout(timeForFirstUtterance / 4);
    assert.ok(getSpeakingUtterance() === firstUtterance, 'firstUtterance not interrupted, it has equal priority');
    assert.ok(testVoicingUtteranceQueue['queue'][0].utterance === secondUtterance, 'thirdUtterance was added to the front of the queue');
    assert.ok(testVoicingUtteranceQueue['queue'].length === 1, 'thirdUtterance was not added to queue and will never be announced');
    await timeout(timeForFirstUtterance / 4 + timeForThirdUtterance / 2);
    assert.ok(alerts[0] === firstUtterance, 'firstUtterance spoken in full');
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdGVwVGltZXIiLCJEaXNwbGF5Iiwidm9pY2luZ01hbmFnZXIiLCJyZXNwb25zZUNvbGxlY3RvciIsIlV0dGVyYW5jZSIsIlV0dGVyYW5jZVF1ZXVlIiwiU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIiwiVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHMiLCJxdWVyeVBhcmFtZXRlcnMiLCJRdWVyeVN0cmluZ01hY2hpbmUiLCJnZXRBbGwiLCJtYW51YWxJbnB1dCIsInR5cGUiLCJWT0lDSU5HX1VUVEVSQU5DRV9JTlRFUlZBTCIsIlRJTUlOR19CVUZGRVIiLCJERUZBVUxUX1ZPSUNFX1RJTUVPVVQiLCJ0ZXN0Vm9pY2luZ01hbmFnZXIiLCJjb25zdHJ1Y3RvciIsInRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUiLCJzZXREZWZhdWx0Vm9pY2UiLCJyZXNvbHZlZCIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0SXQiLCJ2b2ljZVByb3BlcnR5IiwidmFsdWUiLCJ2b2ljZXNQcm9wZXJ0eSIsImNsZWFyVGltZW91dCIsInRpbWVvdXQiLCJzZXRUaW1lb3V0IiwibGVuZ3RoIiwibGF6eUxpbmsiLCJpbml0aWFsaXplIiwidXNlckdlc3R1cmVFbWl0dGVyIiwiZW5hYmxlZFByb3BlcnR5IiwibXMiLCJhbGVydHMiLCJub0NhbmNlbE9wdGlvbnMiLCJjYW5jZWxTZWxmIiwiY2FuY2VsT3RoZXIiLCJ0aW1lVXR0ZXJhbmNlIiwidXR0ZXJhbmNlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImFkZFRvQmFjayIsImFubm91bmNlbWVudENvbXBsZXRlRW1pdHRlciIsImFkZExpc3RlbmVyIiwidG9SZW1vdmUiLCJjb21wbGV0ZVV0dGVyYW5jZSIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0U3BlYWtpbmdVdHRlcmFuY2UiLCJmaXJzdFV0dGVyYW5jZSIsImFsZXJ0IiwiYWxlcnRTdGFibGVEZWxheSIsImFubm91bmNlck9wdGlvbnMiLCJzZWNvbmRVdHRlcmFuY2UiLCJ0aGlyZFV0dGVyYW5jZSIsInRpbWVGb3JGaXJzdFV0dGVyYW5jZSIsInRpbWVGb3JTZWNvbmRVdHRlcmFuY2UiLCJ0aW1lRm9yVGhpcmRVdHRlcmFuY2UiLCJpbnRlcnZhbElEIiwiUVVuaXQiLCJtb2R1bGUiLCJiZWZvcmUiLCJ0aW1lckludGVydmFsIiwicHJldmlvdXNUaW1lIiwid2luZG93Iiwic2V0SW50ZXJ2YWwiLCJjdXJyZW50VGltZSIsImVsYXBzZWRUaW1lIiwiZW1pdCIsInVuc2hpZnQiLCJjb25zb2xlIiwibG9nIiwiRXJyb3IiLCJiZWZvcmVFYWNoIiwiY2FuY2VsIiwicHJpb3JpdHlQcm9wZXJ0eSIsImJlZm9yZUVhY2hUaW1pbmdXb3JrYXJvdW5kcyIsInJlc2V0IiwiYWZ0ZXIiLCJjbGVhckludGVydmFsIiwidGVzdCIsImFzc2VydCIsIm9rIiwidXR0ZXJhbmNlMSIsInByaW9yaXR5IiwidXR0ZXJhbmNlMiIsInV0dGVyYW5jZTMiLCJ1dHRlcmFuY2U0IiwidXR0ZXJhbmNlNSIsInNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciIsImhhc1Nwb2tlbiIsInV0dGVyYW5jZVF1ZXVlIiwiZG9uZSIsImFzeW5jIiwidm9pY2UiLCJlbmRTcGVha2luZ0VtaXR0ZXIiLCJteUxpc3RlbmVyIiwieCIsInNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrSWdub3JpbmdFbmFibGVkIiwiY2FuY2VsVXR0ZXJhbmNlIiwiYW5ub3VuY2VJbW1lZGlhdGVseSIsImhhc1V0dGVyYW5jZSJdLCJzb3VyY2VzIjpbIlV0dGVyYW5jZVF1ZXVlVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUVVuaXQgdGVzdHMgZm9yIFV0dGVyYW5jZSBhbmQgVXR0ZXJhbmNlUXVldWUgdGhhdCB1c2Ugdm9pY2luZ01hbmFnZXIgYXMgdGhlIEFubm91bmNlci5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgc3RlcFRpbWVyIGZyb20gJy4uLy4uL2F4b24vanMvc3RlcFRpbWVyLmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgRGlzcGxheSwgdm9pY2luZ01hbmFnZXIgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgcmVzcG9uc2VDb2xsZWN0b3IgZnJvbSAnLi9yZXNwb25zZUNvbGxlY3Rvci5qcyc7XHJcbmltcG9ydCBVdHRlcmFuY2UgZnJvbSAnLi9VdHRlcmFuY2UuanMnO1xyXG5pbXBvcnQgVXR0ZXJhbmNlUXVldWUgZnJvbSAnLi9VdHRlcmFuY2VRdWV1ZS5qcyc7XHJcbmltcG9ydCBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIgZnJvbSAnLi9TcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIuanMnO1xyXG5pbXBvcnQgVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHMgZnJvbSAnLi9VdHRlcmFuY2VRdWV1ZVRlc3RVdGlscy5qcyc7XHJcblxyXG5jb25zdCBxdWVyeVBhcmFtZXRlcnMgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsKCB7XHJcblxyXG4gIC8vIFdoZW4gZW5hYmxlZCwgZXh0cmEgdGVzdHMgYXJlIHJ1biB0aGF0IHZlcmlmeSB0aGUgdGltaW5nIG9mIFV0dGVyYW5jZXMuIEl0IHJlcXVpcmVzIHRoZSBicm93c2VyIHRvIGFjdHVhbGx5XHJcbiAgLy8gc3BlYWsgd2l0aCBTcGVlY2hTeW50aGVzaXMuIFRoYXQgaXMgb25seSBwb3NzaWJseSBpZiB0aGVyZSBpcyBzb21lIG1hbnVhbCBpbnB1dCBpbnRvIHRoZSBicm93c2VyIHdpbmRvdy5cclxuICAvLyBXaXRoIHRoaXMgcXVlcnkgcGFyYW1ldGVyLCB0aGVyZSBpcyBhIGJyaWVmIHBhdXNlIGJlZm9yZSB0aGUgZmlyc3QgdGVzdHMgYXJlIHJ1biwgc28gdGhhdCB5b3UgY2FuIGNsaWNrXHJcbiAgLy8gc29tZXdoZXJlIGluIHRoZSBicm93c2VyIHdpbmRvdy5cclxuICBtYW51YWxJbnB1dDoge1xyXG4gICAgdHlwZTogJ2ZsYWcnXHJcbiAgfVxyXG59ICk7XHJcblxyXG4vLyBTZWUgVk9JQ0lOR19VVFRFUkFOQ0VfSU5URVJWQUwgaW4gdm9pY2luZ01hbmFnZXIgZm9yIHdoeSB0aGlzIGlzIG5lY2Vzc2FyeS4gV2UgbmVlZCB0byB3YWl0IHRoaXMgbG9uZyBiZWZvcmVcclxuLy8gY2hlY2tpbmcgb24gdGhlIHV0dGVyYW5jZVF1ZXVlIHN0YXRlIHdoZW4gd29ya2luZyB3aXRoIHZvaWNpbmcuXHJcbmNvbnN0IFZPSUNJTkdfVVRURVJBTkNFX0lOVEVSVkFMID0gMTI1O1xyXG5cclxuLy8gV2hlbiB3ZSB3YW50IHRvIGFkZCBhIGxpdHRsZSB0aW1lIHRvIG1ha2UgdGhhdCBhbiBpbnRlcnZhbCBoYXMgY29tcGxldGVkLlxyXG5jb25zdCBUSU1JTkdfQlVGRkVSID0gVk9JQ0lOR19VVFRFUkFOQ0VfSU5URVJWQUwgKyA1MDtcclxuXHJcbmNvbnN0IERFRkFVTFRfVk9JQ0VfVElNRU9VVCA9IDMwMDA7XHJcblxyXG4vLyBAdHMtZXhwZWN0LWVycm9yIHdlIGRvbid0IHdhbnQgdG8gZXhwb3NlIHRoZSBjb25zdHJ1Y3RvciBvZiB0aGlzIHNpbmdsZXRvbiBqdXN0IGZvciB1bml0IHRlc3RzLlxyXG5jb25zdCB0ZXN0Vm9pY2luZ01hbmFnZXIgPSBuZXcgdm9pY2luZ01hbmFnZXIuY29uc3RydWN0b3IoKTtcclxuY29uc3QgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZSA9IG5ldyBVdHRlcmFuY2VRdWV1ZSggdGVzdFZvaWNpbmdNYW5hZ2VyICk7XHJcblxyXG5jb25zdCBzZXREZWZhdWx0Vm9pY2UgPSBhc3luYyAoKSA9PiB7XHJcbiAgbGV0IHJlc29sdmVkID0gZmFsc2U7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KCByZXNvbHZlID0+IHtcclxuICAgIGNvbnN0IHNldEl0ID0gKCkgPT4ge1xyXG4gICAgICBpZiAoICFyZXNvbHZlZCApIHtcclxuICAgICAgICB0ZXN0Vm9pY2luZ01hbmFnZXIudm9pY2VQcm9wZXJ0eS52YWx1ZSA9IHRlc3RWb2ljaW5nTWFuYWdlci52b2ljZXNQcm9wZXJ0eS52YWx1ZVsgMCBdIHx8IG51bGw7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KCB0aW1lb3V0ICk7XHJcbiAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCAoKSA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgICAgIHNldEl0KCk7XHJcbiAgICB9LCBERUZBVUxUX1ZPSUNFX1RJTUVPVVQgKTtcclxuXHJcbiAgICBpZiAoIHRlc3RWb2ljaW5nTWFuYWdlci52b2ljZXNQcm9wZXJ0eS52YWx1ZS5sZW5ndGggPiAwICkge1xyXG4gICAgICBzZXRJdCgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRlc3RWb2ljaW5nTWFuYWdlci52b2ljZXNQcm9wZXJ0eS5sYXp5TGluayggKCkgPT4ge1xyXG4gICAgICAgIHNldEl0KCk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9ICk7XHJcbn07XHJcblxyXG50ZXN0Vm9pY2luZ01hbmFnZXIuaW5pdGlhbGl6ZSggRGlzcGxheS51c2VyR2VzdHVyZUVtaXR0ZXIgKTtcclxudGVzdFZvaWNpbmdNYW5hZ2VyLmVuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcblxyXG4vLyBoZWxwZXIgZXM2IGZ1bmN0aW9ucyBmcm9tICBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMzI4OTcyNi9jb21iaW5hdGlvbi1vZi1hc3luYy1mdW5jdGlvbi1hd2FpdC1zZXR0aW1lb3V0LzMzMjkyOTQyXHJcbmZ1bmN0aW9uIHRpbWVvdXQoIG1zOiBudW1iZXIgKTogUHJvbWlzZTx1bmtub3duPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHNldFRpbWVvdXQoIHJlc29sdmUsIG1zICkgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxufVxyXG5cclxubGV0IGFsZXJ0czogVXR0ZXJhbmNlW10gPSBbXTtcclxuXHJcbi8vIFV0dGVyYW5jZSBvcHRpb25zIHRoYXQgd2lsbCBoYXZlIG5vIGNhbmNlbGxhdGlvbiBmcm9tIGNhbmNlbFNlbGYgYW5kIGNhbmNlbE90aGVyXHJcbmNvbnN0IG5vQ2FuY2VsT3B0aW9ucyA9IHtcclxuICBjYW5jZWxTZWxmOiBmYWxzZSxcclxuICBjYW5jZWxPdGhlcjogZmFsc2VcclxufTtcclxuXHJcbmNvbnN0IHRpbWVVdHRlcmFuY2UgPSAoIHV0dGVyYW5jZTogVXR0ZXJhbmNlICk6IFByb21pc2U8bnVtYmVyPiA9PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdXR0ZXJhbmNlICk7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdNYW5hZ2VyLmFubm91bmNlbWVudENvbXBsZXRlRW1pdHRlci5hZGRMaXN0ZW5lciggZnVuY3Rpb24gdG9SZW1vdmUoIGNvbXBsZXRlVXR0ZXJhbmNlOiBVdHRlcmFuY2UgKSB7XHJcbiAgICAgIGlmICggY29tcGxldGVVdHRlcmFuY2UgPT09IHV0dGVyYW5jZSApIHtcclxuICAgICAgICByZXNvbHZlKCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lICk7XHJcbiAgICAgICAgdGVzdFZvaWNpbmdNYW5hZ2VyLmFubm91bmNlbWVudENvbXBsZXRlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdG9SZW1vdmUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxufTtcclxuXHJcbi8vIFJlYWNoIGludG8gdGhlIHRlc3RWb2ljaW5nTWFuYWdlciBhbmQgZ2V0IGEgcmVmZXJlbmNlIHRvIHRoZSBVdHRlcmFuY2UgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgc3Bva2VuIGZvciB0ZXN0cy5cclxuLy8gUmV0dXJucyBudWxsIGlmIHRoZSBBbm5vdW5jZXIgZG9lc24ndCBoYXZlIGEgY3VycmVudGx5U3BlYWtpbmdVdHRlcmFuY2VcclxuY29uc3QgZ2V0U3BlYWtpbmdVdHRlcmFuY2UgPSAoKTogVXR0ZXJhbmNlIHwgbnVsbCA9PiB7XHJcbiAgcmV0dXJuIHRlc3RWb2ljaW5nTWFuYWdlclsgJ3NwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcicgXSA/IHRlc3RWb2ljaW5nTWFuYWdlclsgJ3NwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcicgXS51dHRlcmFuY2UgOiBudWxsO1xyXG59O1xyXG5cclxuY29uc3QgZmlyc3RVdHRlcmFuY2UgPSBuZXcgVXR0ZXJhbmNlKCB7XHJcbiAgYWxlcnQ6ICdUaGlzIGlzIHRoZSBmaXJzdCB1dHRlcmFuY2UnLFxyXG4gIGFsZXJ0U3RhYmxlRGVsYXk6IDAsXHJcbiAgYW5ub3VuY2VyT3B0aW9uczogbm9DYW5jZWxPcHRpb25zXHJcbn0gKTtcclxuY29uc3Qgc2Vjb25kVXR0ZXJhbmNlID0gbmV3IFV0dGVyYW5jZSgge1xyXG4gIGFsZXJ0OiAnVGhpcyBpcyB0aGUgc2Vjb25kIHV0dGVyYW5jZScsXHJcbiAgYWxlcnRTdGFibGVEZWxheTogMCxcclxuICBhbm5vdW5jZXJPcHRpb25zOiBub0NhbmNlbE9wdGlvbnNcclxufSApO1xyXG5cclxuY29uc3QgdGhpcmRVdHRlcmFuY2UgPSBuZXcgVXR0ZXJhbmNlKCB7XHJcbiAgYWxlcnQ6ICdUaGlzIGlzIHRoZSB0aGlyZCB1dHRlcmFuY2UnLFxyXG4gIGFsZXJ0U3RhYmxlRGVsYXk6IDAsXHJcbiAgYW5ub3VuY2VyT3B0aW9uczogbm9DYW5jZWxPcHRpb25zXHJcbn0gKTtcclxuXHJcblxyXG5sZXQgdGltZUZvckZpcnN0VXR0ZXJhbmNlOiBudW1iZXI7XHJcbmxldCB0aW1lRm9yU2Vjb25kVXR0ZXJhbmNlOiBudW1iZXI7XHJcbmxldCB0aW1lRm9yVGhpcmRVdHRlcmFuY2U6IG51bWJlcjtcclxuXHJcbmxldCBpbnRlcnZhbElEOiBudW1iZXI7XHJcblFVbml0Lm1vZHVsZSggJ1V0dGVyYW5jZVF1ZXVlJywge1xyXG4gIGJlZm9yZTogYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgIC8vIHRpbWVyIHN0ZXAgaW4gc2Vjb25kcywgc3RlcHBlZCA2MCB0aW1lcyBwZXIgc2Vjb25kXHJcbiAgICBjb25zdCB0aW1lckludGVydmFsID0gMSAvIDYwO1xyXG5cclxuICAgIC8vIHN0ZXAgdGhlIHRpbWVyLCBiZWNhdXNlIHV0dGVyYW5jZVF1ZXVlIHJ1bnMgb24gdGltZXJcclxuICAgIGxldCBwcmV2aW91c1RpbWUgPSBEYXRlLm5vdygpOyAvLyBpbiBtc1xyXG5cclxuICAgIGludGVydmFsSUQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoICgpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuXHJcbiAgICAgIC8vIGluIG1zXHJcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgY29uc3QgZWxhcHNlZFRpbWUgPSBjdXJyZW50VGltZSAtIHByZXZpb3VzVGltZTtcclxuXHJcbiAgICAgIHN0ZXBUaW1lci5lbWl0KCBlbGFwc2VkVGltZSAvIDEwMDAgKTsgLy8gc3RlcCB0aW1lciBpbiBzZWNvbmRzXHJcblxyXG4gICAgICBwcmV2aW91c1RpbWUgPSBjdXJyZW50VGltZTtcclxuICAgIH0sIHRpbWVySW50ZXJ2YWwgKiAxMDAwICk7XHJcblxyXG4gICAgLy8gd2hlbmV2ZXIgYW5ub3VuY2luZywgZ2V0IGEgY2FsbGJhY2sgYW5kIHBvcHVsYXRlIHRoZSBhbGVydHMgYXJyYXlcclxuICAgIHRlc3RWb2ljaW5nTWFuYWdlci5hbm5vdW5jZW1lbnRDb21wbGV0ZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICggdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKSA9PiB7XHJcbiAgICAgIGFsZXJ0cy51bnNoaWZ0KCB1dHRlcmFuY2UgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIHF1ZXJ5UGFyYW1ldGVycy5tYW51YWxJbnB1dCApIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgc2VlbXMgbG9uZywgYnV0IGdpdmVzIHVzIHRpbWUgdG8gY2xpY2sgaW50byB0aGUgYnJvd3NlciBiZWZvcmUgdGhlIGZpcnN0IHRlc3QuIFRoZSBmb2xsb3dpbmdcclxuICAgICAgLy8gdGltZVV0dGVyYW5jZSBjYWxscyBjYW4gcnVuIGFsbW9zdCBpbnN0YW50bHkgYW5kIGlmIHlvdSBkb24ndCBjbGljayBpbnRvIHRoZSBzaW0gYmVmb3JlIHRoZXkgc3RhcnRcclxuICAgICAgLy8gdGhlIHRlc3RzIGNhbiBicmVhay4gV2UgdHJ5IHRvIHZlcmlmeSB0aGF0IHlvdSBjbGlja2VkIGludG8gdGhlIGJyb3dzZXIgd2l0aCB0aGUgZm9sbG93aW5nIGVycm9yLCBidXRcclxuICAgICAgLy8gaXQgd29uJ3QgY2F0Y2ggZXZlcnl0aW5nLiBJZiB5b3UgY2xpY2sgaW50byB0aGUgYnJvd3NlciBoYWxmd2F5IHRocm91Z2ggc3BlYWtpbmcgdGhlIGZpcnN0IHV0dGVyYW5jZSxcclxuICAgICAgLy8gdGhlIHRpbWUgZm9yIHRoZSBmaXJzdCB1dHRlcmFuY2UgbWF5IGJlIGdyZWF0ZXIgdGhhbiAyMDAwIG1zIGJ1dCB0aGUgdGltaW5ncyB3aWxsIHN0aWxsIGJlIG9mZi5cclxuICAgICAgYXdhaXQgdGltZW91dCggMzAwMCApO1xyXG5cclxuICAgICAgdGltZUZvckZpcnN0VXR0ZXJhbmNlID0gYXdhaXQgdGltZVV0dGVyYW5jZSggZmlyc3RVdHRlcmFuY2UgKTtcclxuICAgICAgdGltZUZvclNlY29uZFV0dGVyYW5jZSA9IGF3YWl0IHRpbWVVdHRlcmFuY2UoIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgICB0aW1lRm9yVGhpcmRVdHRlcmFuY2UgPSBhd2FpdCB0aW1lVXR0ZXJhbmNlKCB0aGlyZFV0dGVyYW5jZSApO1xyXG5cclxuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgc3BlZWNoIHN5bnRoZXNpcyBpcyBlbmFibGVkIGFuZCB0aGUgVXR0ZXJhbmNlcyBhcmUgbG9uZyBlbm91Z2ggZm9yIHRpbWluZyB0ZXN0cyB0byBiZVxyXG4gICAgICAvLyBjb25zaXN0ZW50LiBOb3RlIHRoYXQgc3BlZWNoIGlzIGZhc3RlciBvciBzbG93ZXIgZGVwZW5kaW5nIG9uIHlvdXIgYnJvd3Nlci4gQ3VycmVudGx5IHRoZSB0ZXN0XHJcbiAgICAgIC8vIHV0dGVyYW5jZXMgdGFrZSB+MTQwMCBtcyBvbiBTYWZhcmkgYW5kIH4yMDAwIG1zIG9uIENocm9tZS5cclxuICAgICAgaWYgKCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgPCAxMjAwIHx8IHRpbWVGb3JTZWNvbmRVdHRlcmFuY2UgPCAxMjAwIHx8IHRpbWVGb3JUaGlyZFV0dGVyYW5jZSA8IDEyMDAgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGB0aW1lRm9yRmlyc3RVdHRlcmFuY2U6ICR7dGltZUZvckZpcnN0VXR0ZXJhbmNlfSwgdGltZUZvclRoaXJkVXR0ZXJhbmNlOiAke3RpbWVGb3JTZWNvbmRVdHRlcmFuY2V9LCB0aW1lRm9yVGhpcmRVdHRlcmFuZTogJHt0aW1lRm9yVGhpcmRVdHRlcmFuY2V9YCApO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ3RpbWUgZm9yIFV0dGVyYW5jZXMgaXMgdG9vIHNob3J0LCBkaWQgeW91IGNsaWNrIGluIHRoZSB3aW5kb3cgYmVmb3JlIHRoZSBmaXJzdCB0ZXN0IHN0YXJ0ZWQ/JyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWxlcnRzID0gW107XHJcblxyXG4gICAgLy8gU2V0IGEgZGVmYXVsdCB2b2ljZVxyXG4gICAgYXdhaXQgc2V0RGVmYXVsdFZvaWNlKCk7XHJcbiAgfSxcclxuICBiZWZvcmVFYWNoOiBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5jYW5jZWwoKTtcclxuXHJcbiAgICAvLyBhbGwgaGF2ZSBkZWZhdWx0IHByaW9yaXR5IGZvciB0aGUgbmV4dCB0ZXN0XHJcbiAgICBmaXJzdFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuICAgIHNlY29uZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuICAgIHRoaXJkVXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAxO1xyXG5cclxuICAgIC8vIEFwcGx5IHNvbWUgd29ya2Fyb3VuZHMgdGhhdCB3aWxsIGhvcGVmdWxseSBtYWtlIHRoZSB0ZXN0cyBtb3JlIGNvbnNpc3RlbnQgd2hlbiBydW5uaW5nIG9uIENULFxyXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy91dHRlcmFuY2UtcXVldWUvaXNzdWVzLzExNS5cclxuICAgIGF3YWl0IFV0dGVyYW5jZVF1ZXVlVGVzdFV0aWxzLmJlZm9yZUVhY2hUaW1pbmdXb3JrYXJvdW5kcygpO1xyXG5cclxuICAgIHJlc3BvbnNlQ29sbGVjdG9yLnJlc2V0KCk7XHJcblxyXG4gICAgLy8gY2xlYXIgdGhlIGFsZXJ0cyBiZWZvcmUgZWFjaCBuZXcgdGVzdFxyXG4gICAgYWxlcnRzID0gW107XHJcbiAgfSxcclxuICBhZnRlcigpIHtcclxuICAgIGNsZWFySW50ZXJ2YWwoIGludGVydmFsSUQgKTtcclxuICB9XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdXZWxjb21lIHRvIFV0dGVyYW5jZVF1ZXVlVGVzdHMhJywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIHRydWUsICdVdHRlcmFuY2VRdWV1ZSB0ZXN0cyB0YWtlIHRpbWUsIHJ1biB3aXRoID9tYW51YWxJbnB1dCBhbmQgY2xpY2sgaW4gdGhlIHdpbmRvdyBiZWZvcmUgdGhlIGZpcnN0IHRlc3QnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdwcmlvcml0aXplIHV0dGVyYW5jZXMgb24gYWRkIHRvIGJhY2snLCBhc3luYyBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHV0dGVyYW5jZTEgPSBuZXcgVXR0ZXJhbmNlKCB7XHJcbiAgICBhbGVydDogJzEnLFxyXG4gICAgcHJpb3JpdHk6IDVcclxuICB9ICk7XHJcbiAgY29uc3QgdXR0ZXJhbmNlMiA9IG5ldyBVdHRlcmFuY2UoIHtcclxuICAgIGFsZXJ0OiAnMicsXHJcbiAgICBwcmlvcml0eTogMVxyXG4gIH0gKTtcclxuICBjb25zdCB1dHRlcmFuY2UzID0gbmV3IFV0dGVyYW5jZSgge1xyXG4gICAgYWxlcnQ6ICczJyxcclxuICAgIHByaW9yaXR5OiAxXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCB1dHRlcmFuY2U0ID0gbmV3IFV0dGVyYW5jZSgge1xyXG4gICAgYWxlcnQ6ICc0JyxcclxuICAgIHByaW9yaXR5OiAxLFxyXG4gICAgYW5ub3VuY2VyT3B0aW9uczoge1xyXG4gICAgICBjYW5jZWxPdGhlcjogZmFsc2VcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHV0dGVyYW5jZTUgPSBuZXcgVXR0ZXJhbmNlKCB7XHJcbiAgICBhbGVydDogJzUnLFxyXG4gICAgcHJpb3JpdHk6IDEsXHJcbiAgICBhbm5vdW5jZXJPcHRpb25zOiB7XHJcbiAgICAgIGNhbmNlbE90aGVyOiBmYWxzZVxyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3Qgc3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyID0gbmV3IFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlcigpO1xyXG4gIHNwZWVjaFN5bnRoZXNpc0Fubm91bmNlci5oYXNTcG9rZW4gPSB0cnVlOyAvLyBIQVhcclxuXHJcbiAgY29uc3QgdXR0ZXJhbmNlUXVldWUgPSBuZXcgVXR0ZXJhbmNlUXVldWUoIHNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciApO1xyXG5cclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF0ubGVuZ3RoID09PSAwLCAnbm90aGluZyBtYW4nICk7XHJcbiAgdXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCB1dHRlcmFuY2UxICk7XHJcblxyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDEsICdvbmUgYWRkIHRvIGJhY2snICk7XHJcbiAgdXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCB1dHRlcmFuY2UyICk7XHJcbiAgYXNzZXJ0Lm9rKCB1dHRlcmFuY2VRdWV1ZVsgJ3F1ZXVlJyBdLmxlbmd0aCA9PT0gMiwgJ29uZSBhZGQgdG8gYmFjaycgKTtcclxuICB1dHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHV0dGVyYW5jZTMgKTtcclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF0ubGVuZ3RoID09PSAyLCAnb25lIGFkZCB0byBiYWNrJyApO1xyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXVsgMCBdLnV0dGVyYW5jZSA9PT0gdXR0ZXJhbmNlMSwgJ29uZSBhZGQgdG8gYmFjaycgKTtcclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF1bIDEgXS51dHRlcmFuY2UgPT09IHV0dGVyYW5jZTMsICd1dHRlcmFuY2UzIHJlbW92ZWQgdXR0ZXJhbmNlMSBiZWNhdXNlIGNhbmNlbE90aGVyOnRydWUnICk7XHJcbiAgdXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCB1dHRlcmFuY2U0ICk7XHJcbiAgYXNzZXJ0Lm9rKCB1dHRlcmFuY2VRdWV1ZVsgJ3F1ZXVlJyBdLmxlbmd0aCA9PT0gMywgJ29uZSBhZGQgdG8gYmFjaycgKTtcclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF1bIDAgXS51dHRlcmFuY2UgPT09IHV0dGVyYW5jZTEsICdvbmUgYWRkIHRvIGJhY2snICk7XHJcbiAgYXNzZXJ0Lm9rKCB1dHRlcmFuY2VRdWV1ZVsgJ3F1ZXVlJyBdWyAxIF0udXR0ZXJhbmNlID09PSB1dHRlcmFuY2UzLCAndXR0ZXJhbmNlMyByZW1vdmVkIHV0dGVyYW5jZTEgYmVjYXVzZSBjYW5jZWxPdGhlcjp0cnVlJyApO1xyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXVsgMiBdLnV0dGVyYW5jZSA9PT0gdXR0ZXJhbmNlNCwgJ3V0dGVyYW5jZTQgZG9lcyBub3QgcmVtb3ZlZCB1dHRlcmFuY2UzIGJlY2F1c2UgY2FuY2VsT3RoZXI6dHJ1ZScgKTtcclxuXHJcbiAgdXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCB1dHRlcmFuY2U1ICk7XHJcblxyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDQsICdvbmUgYWRkIHRvIGJhY2snICk7XHJcbiAgYXNzZXJ0Lm9rKCB1dHRlcmFuY2VRdWV1ZVsgJ3F1ZXVlJyBdWyAwIF0udXR0ZXJhbmNlID09PSB1dHRlcmFuY2UxLCAnb25lIGFkZCB0byBiYWNrJyApO1xyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXVsgMSBdLnV0dGVyYW5jZSA9PT0gdXR0ZXJhbmNlMywgJ3V0dGVyYW5jZTMgcmVtb3ZlZCB1dHRlcmFuY2UxIGJlY2F1c2UgY2FuY2VsT3RoZXI6dHJ1ZScgKTtcclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF1bIDIgXS51dHRlcmFuY2UgPT09IHV0dGVyYW5jZTQsICd1dHRlcmFuY2U0IGRvZXMgbm90IHJlbW92ZWQgdXR0ZXJhbmNlMyBiZWNhdXNlIGNhbmNlbE90aGVyOnRydWUnICk7XHJcbiAgYXNzZXJ0Lm9rKCB1dHRlcmFuY2VRdWV1ZVsgJ3F1ZXVlJyBdWyAzIF0udXR0ZXJhbmNlID09PSB1dHRlcmFuY2U1LCAndXR0ZXJhbmNlNCBkb2VzIG5vdCByZW1vdmVkIHV0dGVyYW5jZTMgYmVjYXVzZSBjYW5jZWxPdGhlcjp0cnVlJyApO1xyXG5cclxuICAvKipcclxuICAgKiBVdHRlcmFuY2VRdWV1ZS5wcmlvcml0aXplVXR0ZXJhbmNlcygpIGhhbmRsZXMgcHJpb3JpdGl6aW5nIHV0dGVyYW5jZXMgYmVmb3JlIEFORCBhZnRlciB0aGUgY2hhbmdlZCB1dHRlcmFuY2UuIFdlIHdhbnRcclxuICAgKiB0byB0ZXN0IGhlcmUgdGhhdCBpdCBjYW4gaGFuZGxlIHRoYXQgd2hlbiBib3RoIG5lZWQgdXBkYXRpbmcgaW4gdGhlIHNhbWUgY2FsbC4gVGh1cywgZG9uJ3Qgbm90aWZ5IGZvciBvbmUgY2FzZSxcclxuICAgKiBhbmQgbGV0IHRoZSBwcmlvcml0aXphdGlvbiBvZiB0aGUgcXVldWUgb2NjdXIgYWxsIGR1cmluZyBvbmUgcHJpb3JpdHkgbGlzdGVuZXIgY2FsbC5cclxuICAgKlxyXG4gICAqIEhBWCBhbGVydCAtIHBsZWFzZSBtYWtlIHRoaXMgdmFsdWUgYmV0d2VlbiB0aGUgdXR0ZXJhbmNlNCB2YWx1ZSBiZWxvdyBhbmQgYWxzbyBsb3dlciB0aGFuIHV0dGVyYW5jZTEuXHJcbiAgICovXHJcbiAgKCB1dHRlcmFuY2U1LnByaW9yaXR5UHJvcGVydHkgYXMgdW5rbm93biBhcyBSZWFkT25seVByb3BlcnR5PG51bWJlcj4gKVsgJ3NldFByb3BlcnR5VmFsdWUnIF0oIDMgKTtcclxuICB1dHRlcmFuY2U0LnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAyO1xyXG5cclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF0ubGVuZ3RoID09PSAyLCAnb25lIGFkZCB0byBiYWNrJyApO1xyXG4gIGFzc2VydC5vayggdXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXVsgMCBdLnV0dGVyYW5jZSA9PT0gdXR0ZXJhbmNlMSwgJ29uZSBhZGQgdG8gYmFjaycgKTtcclxuICBhc3NlcnQub2soIHV0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF1bIDEgXS51dHRlcmFuY2UgPT09IHV0dGVyYW5jZTUsICd1dHRlcmFuY2U1IGtpY2tlZCB1dHRlcmFuY2U0IG91dHRhIHRoZSBwYXJrLicgKTtcclxufSApO1xyXG5cclxuLy8gQ1QgYW5kIHNvbWUgaGVhZGxlc3MgYnJvd3NlcnMgZG9uJ3Qgc3VwcG9ydCBTcGVlY2hTeW50aGVzaXNcclxuaWYgKCB0ZXN0Vm9pY2luZ01hbmFnZXIudm9pY2VzUHJvcGVydHkudmFsdWUgPiAwICkge1xyXG5cclxuICBRVW5pdC50ZXN0KCAndXR0ZXJhbmNlLmFubm91bmNlck9wdGlvbnMudm9pY2UnLCBhc3luYyBhc3NlcnQgPT4ge1xyXG5cclxuICAgIGNvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKTtcclxuXHJcbiAgICB0ZXN0Vm9pY2luZ01hbmFnZXIudm9pY2VQcm9wZXJ0eS52YWx1ZSA9IG51bGw7XHJcblxyXG4gICAgY29uc3Qgdm9pY2UgPSB0ZXN0Vm9pY2luZ01hbmFnZXIudm9pY2VzUHJvcGVydHkudmFsdWVbIDAgXTtcclxuICAgIGNvbnN0IHV0dGVyYW5jZSA9IG5ldyBVdHRlcmFuY2UoIHtcclxuICAgICAgYWxlcnQ6ICdvbmUnLFxyXG4gICAgICBhbm5vdW5jZXJPcHRpb25zOiB7XHJcbiAgICAgICAgdm9pY2U6IHZvaWNlXHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0ZXN0Vm9pY2luZ01hbmFnZXIuZW5kU3BlYWtpbmdFbWl0dGVyLmFkZExpc3RlbmVyKCBmdW5jdGlvbiBteUxpc3RlbmVyKCkge1xyXG5cclxuICAgICAgY29uc3QgeCA9IHRlc3RWb2ljaW5nTWFuYWdlclsgJ3NwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcicgXSE7XHJcbiAgICAgIGFzc2VydC5vayggeCwgJ3dlIHNob3VsZCBoYXZlIG9uZScgKTtcclxuICAgICAgYXNzZXJ0Lm9rKCB4LnNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZS52b2ljZSA9PT0gdm9pY2UsICd2b2ljZSBzaG91bGQgbWF0Y2ggdGhlIHByb3ZpZGVkIHV0dGVyYW5jZVxcJ3MnICk7XHJcbiAgICAgIHRlc3RWb2ljaW5nTWFuYWdlci5lbmRTcGVha2luZ0VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIG15TGlzdGVuZXIgKTtcclxuICAgICAgZG9uZSgpO1xyXG4gICAgfSApO1xyXG4gICAgdGVzdFZvaWNpbmdNYW5hZ2VyLnNwZWFrSWdub3JpbmdFbmFibGVkKCB1dHRlcmFuY2UgKTtcclxuXHJcbiAgICB0ZXN0Vm9pY2luZ01hbmFnZXIudm9pY2VQcm9wZXJ0eS52YWx1ZSA9IHZvaWNlO1xyXG4gIH0gKTtcclxufVxyXG5cclxuXHJcbmlmICggcXVlcnlQYXJhbWV0ZXJzLm1hbnVhbElucHV0ICkge1xyXG5cclxuICBRVW5pdC50ZXN0KCAnQmFzaWMgVXR0ZXJhbmNlUXVldWUgdGVzdCcsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgLy8gYmFzaWMgdGVzdCwgd2Ugc2hvdWxkIGhlYXIgYWxsIHRocmVlIFV0dGVyYW5jZXNcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlICsgdGltZUZvclNlY29uZFV0dGVyYW5jZSArIHRpbWVGb3JUaGlyZFV0dGVyYW5jZSArIFRJTUlOR19CVUZGRVIgKiAzICk7XHJcbiAgICBhc3NlcnQub2soIGFsZXJ0cy5sZW5ndGggPT09IDMsICdUaHJlZSBiYXNpYyBVdHRlcmFuY2VzIHdlbnQgdGhyb3VnaCB0aGUgcXVldWUnICk7XHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnY2FuY2VsVXR0ZXJhbmNlIHRlc3RzJywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuXHJcbiAgICAvLyBUZXN0IHRoYXQgY2FuY2VsVXR0ZXJhbmNlIHdpbGwgbm90IGludHJvZHVjZSBhIG1lbW9yeSBsZWFrIHdpdGggbXVsdGlwbGUgbGlzdGVuZXJzIG9uIHRoZSBQcm9wZXJ0eVxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmNhbmNlbFV0dGVyYW5jZSggZmlyc3RVdHRlcmFuY2UgKTtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSBoYW5kbGUgdGhlIGBlbmRgIGV2ZW50IGhhcHBlbmluZyBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBjYW5jZWwsIHRoaXMgc2hvdWxkIG5vdCBjcmFzaFxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICBhc3NlcnQub2soIGFsZXJ0c1sgMCBdID09PSBmaXJzdFV0dGVyYW5jZSwgJ2ZpcnN0VXR0ZXJhbmNlIHdhcyBjYW5jZWxsZWQnICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDEsICdUaGVyZSBpcyBvbmUgVXR0ZXJhbmNlIGluIHRoZSBxdWV1ZScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdQcmlvcml0eVByb3BlcnR5IGludGVycnVwdGlvbicsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgLy8gQWRkIGFsbCAzIHRvIGJhY2tcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgYXNzZXJ0Lm9rKCB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF0ubGVuZ3RoID09PSAzLCAnQWxsIHRocmVlIHV0dGVyYW5jZXMgaW4gdGhlIHF1ZXVlJyApO1xyXG5cclxuICAgIC8vIG1ha2UgdGhlIHRoaXJkIFV0dGVyYW5jZSBoaWdoIHByaW9yaXR5LCBpdCBzaG91bGQgcmVtb3ZlIHRoZSBvdGhlciB0d28gVXR0ZXJhbmNlc1xyXG4gICAgdGhpcmRVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDEsICdPbmx5IHRoZSBvbmUgVXR0ZXJhbmNlIHJlbWFpbnMnICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXVsgMCBdLnV0dGVyYW5jZSA9PT0gdGhpcmRVdHRlcmFuY2UsICdPbmx5IHRoZSB0aGlyZCBVdHRlcmFuY2UgcmVtYWlucycgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdBbm5vdW5jZWQgVXR0ZXJhbmNlIGNhbiBhbHNvIGJlIGluIHF1ZXVlIGFuZCBpbnRlcnJ1cHRpb24gZHVyaW5nIGFubm91bmNlbWVudCcsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgLy8gd2hpbGUgYW4gVXR0ZXJhbmNlIGlzIGJlaW5nIGFubm91bmNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgY2FuIGFkZCB0aGUgc2FtZSBVdHRlcmFuY2UgdG8gdGhlIHF1ZXVlIGFuZCB0aGF0XHJcbiAgICAvLyBwcmlvcml0eVByb3BlcnR5IGlzIHN0aWxsIG9ic2VydmVkXHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggZmlyc3RVdHRlcmFuY2UgKTtcclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlICk7IC8vIFRpbWUgdG8gZ2V0IGhhbGZ3YXkgdGhyb3VnaCBzZWNvbmQgYW5ub3VuY2VtZW50IG9mIGZpcnN0VXR0ZXJhbmNlXHJcblxyXG4gICAgLy8gcmVkdWNlIHByaW9yaXR5UHJvcGVydHkgb2YgZmlyc3RVdHRlcmFuY2Ugd2hpbGUgaXQgaXMgYmVpbmcgYW5ub3VuY2VkLCBzZWNvbmRVdHRlcmFuY2Ugc2hvdWxkIGludGVycnVwdFxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDA7XHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yU2Vjb25kVXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSBzZWNvbmRVdHRlcmFuY2UsICdVdHRlcmFuY2UgYmVpbmcgYW5ub3VuY2VkIHN0aWxsIG9ic2VydmVzIHByaW9yaXR5UHJvcGVydHknICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDAsICdxdWV1ZSBlbXB0eSBhZnRlciBpbnRlcnJ1cHRpb24gYW5kIHNlbmRpbmcgc2Vjb25kVXR0ZXJhbmNlIHRvIEFubm91bmNlcicgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdIaWdoZXIgcHJpb3JpdHkgcmVtb3ZlcyBlYXJsaWVyIFV0dGVyYW5jZXMgZnJvbSBxdWV1ZScsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgLy8gVW5pdCB0ZXN0IGNhc2VzIHRha2VuIGZyb20gZXhhbXBsZXMgdGhhdCBkZW1vbnN0cmF0ZWQgdGhlIHByaW9yaXR5UHJvcGVydHkgZmVhdHVyZSBpblxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3V0dGVyYW5jZS1xdWV1ZS9pc3N1ZXMvNTBcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gQWRkIGFsbCAzIHRvIGJhY2tcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHRoaXJkVXR0ZXJhbmNlICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDMsICdBbGwgdGhyZWUgdXR0ZXJhbmNlcyBpbiB0aGUgcXVldWUnICk7XHJcblxyXG4gICAgc2Vjb25kVXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAyO1xyXG5cclxuICAgIC8vIGVub3VnaCB0aW1lIGZvciB0aGUgc2Vjb25kVXR0ZXJhbmNlIHRvIHN0YXJ0IHNwZWFraW5nIHdoaWxlIHRoZSBmaXJzdFV0dGVyYW5jZSB3YXMganVzdCByZW1vdmVkIGZyb20gdGhlIHF1ZXVlXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yU2Vjb25kVXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSBzZWNvbmRVdHRlcmFuY2UsICdUaGUgc2Vjb25kVXR0ZXJhbmNlIGludGVycnVwdGVkIHRoZSBmaXJzdFV0dGVyYW5jZSBiZWNhdXNlIGl0IGlzIGhpZ2hlciBwcmlvcml0eS4nICk7XHJcblxyXG4gICAgLy8gZW5vdWdoIHRpbWUgdG8gZmluaXNoIHRoZSBzZWNvbmRVdHRlcmFuY2UgYW5kIHN0YXJ0IHNwZWFraW5nIHRoZSB0aGlyZFV0dGVyYW5jZVxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvclNlY29uZFV0dGVyYW5jZSAvIDIgKyB0aW1lRm9yVGhpcmRVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGFsZXJ0c1sgMCBdID09PSBzZWNvbmRVdHRlcmFuY2UsICdzZWNvbmRVdHRlcmFuY2Ugc3Bva2VuIGluIGZ1bGwnICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IHRoaXJkVXR0ZXJhbmNlLCAndGhpcmRVdHRlcmFuY2Ugc3Bva2VuIGFmdGVyIHNlY29uZFV0dGVyYW5jZSBmaW5pc2hlZCcgKTtcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnVXR0ZXJhbmNlIHJlbW92ZWQgYmVjYXVzZSBvZiBzZWxmIHByaW9yaXR5IHJlZHVjdGlvbiBiZWZvcmUgYW5vdGhlciBpcyBhZGRlZCB0byBxdWV1ZScsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDEwO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcblxyXG4gICAgLy8gcmVkdWNlIHByaW9yaXR5UHJvcGVydHkgYmVmb3JlIGFkZGluZyB0aGlyZFV0dGVyYW5jZSB0byBxdWV1ZVxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDA7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdGhpcmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICAvLyBlbm91Z2ggdGltZSB0byBzdGFydCBzcGVha2luZyBlaXRoZXIgdGhlIGZpcnN0IG9yIHRoaXJkIFV0dGVyYW5jZXNcclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggZ2V0U3BlYWtpbmdVdHRlcmFuY2UoKSA9PT0gdGhpcmRVdHRlcmFuY2UsICd0aGlyZFV0dGVyYW5jZSBzcG9rZW4gYmVjYXVzZSBmaXJzdFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5IHdhcyByZWR1Y2VkIGJlZm9yZSBhZGRpbmcgdGhpcmRVdHRlcmFuY2UgdG8gdGhlIHF1ZXVlJyApO1xyXG4gIH0gKTtcclxuXHJcbiAgUVVuaXQudGVzdCggJ1V0dGVyYW5jZSByZW1vdmVkIGJlY2F1c2Ugb2Ygc2VsZiBwcmlvcml0eSByZWR1Y3Rpb24gYWZ0ZXIgYW5vdGhlciBpcyBhZGRlZCB0byBxdWV1ZScsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDEwO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcblxyXG4gICAgLy8gcmVkdWNlIHByaW9yaXR5UHJvcGVydHkgQUZURVIgYWRkaW5nIHRoaXJkVXR0ZXJhbmNlIHRvIHF1ZXVlXHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdGhpcmRVdHRlcmFuY2UgKTtcclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAwO1xyXG5cclxuICAgIC8vIGVub3VnaCB0aW1lIHRvIHN0YXJ0IHNwZWFraW5nIGVpdGhlciB0aGUgZmlyc3Qgb3IgdGhpcmQgVXR0ZXJhbmNlc1xyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSB0aGlyZFV0dGVyYW5jZSwgJ3RoaXJkVXR0ZXJhbmNlIHNwb2tlbiBiZWNhdXNlIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkgd2FzIHJlZHVjZWQgYWZ0ZXIgYWRkaW5nIHRoaXJkVXR0ZXJhbmNlIHRvIHRoZSBxdWV1ZScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdVdHRlcmFuY2UgaW50ZXJydXB0aW9uIGJlY2F1c2Ugc2VsZiBwcmlvcml0eSByZWR1Y2VkIHdoaWxlIGJlaW5nIGFubm91bmNlZCcsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDEwO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdGhpcmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlICk7XHJcblxyXG4gICAgLy8gcmVkdWNpbmcgcHJpb3JpdHkgYmVsb3cgdGhpcmQgdXR0ZXJhbmNlIHNob3VsZCBpbnRlcnJ1cHQgZmlyc3RVdHRlcmFuY2UgZm9yIHRoaXJkVXR0ZXJhbmNlXHJcbiAgICBmaXJzdFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMDtcclxuXHJcbiAgICAvLyBub3QgZW5vdWdoIHRpbWUgZm9yIGZpcnN0VXR0ZXJhbmNlIHRvIGZpbmlzaCBpbiBmdWxsLCBidXQgZW5vdWdoIHRpbWUgdG8gdmVyaWZ5IHRoYXQgaXQgd2FzIGludGVycnVwdGVkXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyA0ICk7XHJcbiAgICBhc3NlcnQub2soIGFsZXJ0c1sgMCBdID09PSBmaXJzdFV0dGVyYW5jZSwgJ2ZpcnN0VXR0ZXJhbmNlIHdhcyBpbnRlcnJ1cHRlZCBiZWNhdXNlIGl0cyBwcmlvcml0eSB3YXMgcmVkdWNlZCB3aGlsZSBpdCB3YXMgYmVpbmcgYW5ub3VuY2VkJyApO1xyXG5cclxuICAgIC8vIGVub3VnaCB0aW1lIGZvciB0aGlyZFV0dGVyYW5jZSB0byBzdGFydCBzcGVha2luZ1xyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvclRoaXJkVXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSB0aGlyZFV0dGVyYW5jZSwgJ3RoaXJkVXR0ZXJhbmNlIGJlaW5nIGFubm91bmNlZCBhZnRlciBpbnRlcnJ1cHRpbmcgZmlyc3RVdHRlcmFuY2UnICk7XHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnVXR0ZXJhbmNlIGludGVycnVwdGlvbiBkdXJpbmcgYW5ub3VtY2VtZW50IGJlY2F1c2UgYW5vdGhlciBpbiB0aGUgcXVldWUgbWFkZSBoaWdoZXIgcHJpb3JpdHknLCBhc3luYyBhc3NlcnQgPT4ge1xyXG5cclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAwO1xyXG4gICAgdGhpcmRVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDA7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdGhpcmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3RVdHRlcmFuY2UgYmVpbmcgYW5ub3VuY2VkJyApO1xyXG5cclxuICAgIC8vIGluY3JlYXNpbmcgcHJpb3JpdHkgb2YgdGhpcmRVdHRlcmFuY2UgaW4gdGhlIHF1ZXVlIHNob3VsZCBpbnRlcnJ1cHQgZmlyc3RVdHRlcmFuY2UgYmVpbmcgYW5ub3VuY2VkXHJcbiAgICB0aGlyZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMztcclxuXHJcbiAgICAvLyBub3QgZW5vdWdoIHRpbWUgZm9yIGZpcnN0VXR0ZXJhbmNlIHRvIGZpbmlzaCwgYnV0IGVub3VnaCB0byBtYWtlIHN1cmUgdGhhdCBpdCB3YXMgaW50ZXJydXB0ZWRcclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDQgKTtcclxuICAgIGFzc2VydC5vayggYWxlcnRzWyAwIF0gPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3RVdHRlcmFuY2Ugd2FzIGludGVycnVwdGVkIGJlY2F1c2UgYW4gVXR0ZXJhbmNlIGluIHRoZSBxdWV1ZSB3YXMgbWFkZSBoaWdoZXIgcHJpb3JpdHknICk7XHJcblxyXG4gICAgLy8gZW5vdWdoIHRpbWUgZm9yIHRoaXJkVXR0ZXJhbmNlIHRvIHN0YXJ0IHNwZWFraW5nXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yVGhpcmRVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IHRoaXJkVXR0ZXJhbmNlLCAndGhpcmRVdHRlcmFuY2UgYmVpbmcgYW5ub3VuY2VkIGFmdGVyIGludGVycnVwdGluZyBmaXJzdFV0dGVyYW5jZScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdVdHRlcmFuY2UgTk9UIGludGVycnVwdGVkIGJlY2F1c2Ugc2VsZiBwcmlvcml0eSBzdGlsbCByZWxhdGl2ZWx5IGhpZ2hlcicsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDEwO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdGhpcmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcblxyXG4gICAgLy8gd2Ugc2hvdWxkIHN0aWxsIGhlYXIgYm90aCBVdHRlcmFuY2VzIGluIGZ1bGwsIG5ldyBwcmlvcml0eSBmb3IgZmlyc3RVdHRlcmFuY2UgaXMgaGlnaGVyIHRoYW4gdGhpcmRVdHRlcmFuY2VcclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSA1O1xyXG5cclxuICAgIC8vIG5vdCBlbm91Z2ggdGltZSBmb3IgZmlyc3RVdHRlcmFuY2UgdG8gZmluaXNoLCBidXQgZW5vdWdoIHRvIG1ha2Ugc3VyZSB0aGF0IGl0IHdhcyBub3QgaW50ZXJydXB0ZWRcclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDEwICk7XHJcbiAgICBhc3NlcnQub2soIGFsZXJ0cy5sZW5ndGggPT09IDAsICdmaXJzdFV0dGVyYW5jZSB3YXMgbm90IGludGVycnVwdGVkIGJlY2F1c2UgcHJpb3JpdHkgd2FzIHNldCB0byBhIHZhbHVlIGhpZ2hlciB0aGFuIG5leHQgdXR0ZXJhbmNlIGluIHF1ZXVlJyApO1xyXG5cclxuICAgIC8vIGVub3VnaCB0aW1lIGZvciB0aGlyZFV0dGVyYW5jZSB0byBzdGFydCBzcGVha2luZyBhZnRlciBmaXJzdFV0dGVyYW5jZSBmaW5pc2hlc1xyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvclRoaXJkVXR0ZXJhbmNlIC8gMiArIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggYWxlcnRzWyAwIF0gPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3RVdHRlcmFuY2UgZmluaXNoZWQgYmVpbmcgYW5ub3VuY2VkJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSB0aGlyZFV0dGVyYW5jZSwgJ3RoaXJkVXR0ZXJhbmNlIGJlaW5nIGFubm91bmNlZCBhZnRlciB3YWl0aW5nIGZvciBmaXJzdFV0dGVyYW5jZScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdhbm5vdW5jZUltbWVkaWF0ZWx5JywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuXHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFubm91bmNlSW1tZWRpYXRlbHkoIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDAsICdhbm5vdW5jZUltbWVkaWF0ZWx5IHNob3VsZCBiZSBzeW5jaHJvbm91cyB3aXRoIHZvaWNpbmdNYW5hZ2VyIGZvciBhbiBlbXB0eSBxdWV1ZScgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3QgdXR0ZXJhbmNlIHNwb2tlbiBpbW1lZGlhdGVseScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdhbm5vdW5jZUltbWVkaWF0ZWx5IHJlZHVjZXMgZHVwbGljYXRlIFV0dGVyYW5jZXMgaW4gcXVldWUnLCBhc3luYyBhc3NlcnQgPT4ge1xyXG5cclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgLy8gbm93IHNwZWFrIHRoZSBmaXJzdCB1dHRlcmFuY2UgaW1tZWRpYXRlbHlcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYW5ub3VuY2VJbW1lZGlhdGVseSggZmlyc3RVdHRlcmFuY2UgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDIsICdhbm5vdW5jaW5nIGZpcnN0VXR0ZXJhbmNlIGltbWVkaWF0ZWx5IHNob3VsZCByZW1vdmUgdGhlIGR1cGxpY2F0ZSBmaXJzdFV0dGVyYW5jZSBpbiB0aGUgcXVldWUnICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3QgdXR0ZXJhbmNlIGlzIGJlaW5nIHNwb2tlbiBhZnRlciBhbm5vdW5jZUltbWVkaWF0ZWx5JyApO1xyXG4gIH0gKTtcclxuXHJcbiAgUVVuaXQudGVzdCggJ2Fubm91bmNlSW1tZWRpYXRlbHkgZG9lcyBub3RoaW5nIHdoZW4gVXR0ZXJhbmNlIGhhcyBsb3cgcHJpb3JpdHkgcmVsYXRpdmUgdG8gcXVldWVkIFV0dGVyYW5jZXMnLCBhc3luYyBhc3NlcnQgPT4ge1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggc2Vjb25kVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcbiAgICB0aGlyZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYW5ub3VuY2VJbW1lZGlhdGVseSggdGhpcmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICAvLyB0aGlyZFV0dGVyYW5jZSBpcyBsb3dlciBwcmlvcml0eSB0aGFuIG5leHQgaXRlbSBpbiB0aGUgcXVldWUsIGl0IHNob3VsZCBub3QgYmUgc3Bva2VuIGFuZCBzaG91bGQgbm90IGJlXHJcbiAgICAvLyBpbiB0aGUgcXVldWUgYXQgYWxsXHJcbiAgICBhc3NlcnQub2soIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWVbICdxdWV1ZScgXS5sZW5ndGggPT09IDIsICdvbmx5IGZpcnN0IGFuZCBzZWNvbmQgdXR0ZXJhbmNlcyBpbiB0aGUgcXVldWUnICk7XHJcbiAgICBhc3NlcnQub2soICF0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmhhc1V0dGVyYW5jZSggdGhpcmRVdHRlcmFuY2UgKSwgJ3RoaXJkVXR0ZXJhbmNlIG5vdCBpbiBxdWV1ZSBhZnRlciBhbm5vdW5jZUltbWVkaWF0ZWx5JyApO1xyXG5cclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggZ2V0U3BlYWtpbmdVdHRlcmFuY2UoKSA9PT0gZmlyc3RVdHRlcmFuY2UgKTtcclxuICAgIGFzc2VydC5vayggYWxlcnRzWyAwIF0gIT09IHRoaXJkVXR0ZXJhbmNlLCAndGhpcmRVdHRlcmFuY2Ugd2FzIG5vdCBzcG9rZW4gd2l0aCBhbm5vdW5jZUltbWVkaWF0ZWx5JyApO1xyXG4gIH0gKTtcclxuXHJcbiAgUVVuaXQudGVzdCggJ2Fub3VuY2VJbW1lZGlhdGVsZXR5IGRvZXMgbm90aGluZyB3aGVuIFV0dGVyYW5jZSBoYXMgbG93IHByaW9yaXR5IHJlbGF0aXZlIHRvIGFubm91bmNpbmcgVXR0ZXJhbmNlJywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAxO1xyXG4gICAgdGhpcmRVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDE7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggc2Vjb25kVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcbiAgICB0aGlyZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFubm91bmNlSW1tZWRpYXRlbHkoIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgLy8gdGhpcmRVdHRlcmFuY2UgaXMgbG93ZXIgcHJpb3JpdHkgdGhhbiB3aGF0IGlzIGN1cnJlbnRseSBiZWluZyBzcG9rZW4gc28gaXQgc2hvdWxkIE5PVCBiZSBoZWFyZFxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlIC8gNCApOyAvLyBsZXNzIHRoYW4gcmVtYWluaW5nIHRpbWUgZm9yIGZpcnN0VXR0ZXJhbmNlIGNoZWNraW5nIGZvciBpbnRlcnJ1cHRpb25cclxuICAgIGFzc2VydC5vayggZ2V0U3BlYWtpbmdVdHRlcmFuY2UoKSAhPT0gdGhpcmRVdHRlcmFuY2UsICdhbm5vdW5jZUltbWVkaWF0ZWx5IHNob3VsZCBub3QgaW50ZXJydXB0IGEgaGlnaGVyIHByaW9yaXR5IHV0dGVyYW5jZScgKTtcclxuICAgIGFzc2VydC5vayggIXRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuaGFzVXR0ZXJhbmNlKCB0aGlyZFV0dGVyYW5jZSApLCAnbG93ZXIgcHJpb3JpdHkgdGhpcmRVdHRlcmFuY2Ugc2hvdWxkIGJlIGRyb3BwZWQgZnJvbSB0aGUgcXVldWUnICk7XHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnVXR0ZXJhbmNlIHNwb2tlbiB3aXRoIGFubm91bmNlSW1tZWRpYXRlbHkgc2hvdWxkIGJlIGludGVycnVwdGVkIGlmIHByaW9yaXR5IGlzIHJlZHVjZWQnLCBhc3luYyBhc3NlcnQgPT4ge1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFRoZSBVdHRlcmFuY2Ugc3Bva2VuIHdpdGggYW5ub3VuY2VJbW1lZGlhdGVseSBzaG91bGQgYmUgaW50ZXJydXB0ZWQgaWYgaXRzIHByaW9yaXR5IGlzIHJlZHVjZWRcclxuICAgIC8vIGJlbG93IGFub3RoZXIgaXRlbSBpbiB0aGUgcXVldWVcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAyO1xyXG4gICAgdGhpcmRVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggc2Vjb25kVXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFubm91bmNlSW1tZWRpYXRlbHkoIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvclRoaXJkVXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSB0aGlyZFV0dGVyYW5jZSwgJ3RoaXJkVXR0ZXJhbmNlIGlzIGFubm91bmNlZCBpbW1lZGlhdGVseScgKTtcclxuXHJcbiAgICB0aGlyZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuXHJcbiAgICAvLyB0aGUgcHJpb3JpdHkgb2YgdGhlIHRoaXJkVXR0ZXJhbmNlIGlzIHJlZHVjZWQgd2hpbGUgYmVpbmcgc3Bva2VuIGZyb20gYW5ub3VuY2VJbW1lZGlhdGVseSwgaXQgc2hvdWxkIGJlXHJcbiAgICAvLyBpbnRlcnJ1cHRlZCBhbmQgdGhlIG5leHQgaXRlbSBpbiB0aGUgcXVldWUgc2hvdWxkIGJlIHNwb2tlblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvclRoaXJkVXR0ZXJhbmNlIC8gNCApOyAvLyBsZXNzIHRoYW4gdGhlIHJlbWFpbmluZyB0aW1lIGZvciB0aGlyZCB1dHRlcmFuY2UgZm9yIGludGVycnVwdGlvblxyXG4gICAgYXNzZXJ0Lm9rKCBhbGVydHNbIDAgXSA9PT0gdGhpcmRVdHRlcmFuY2UsICd0aGlyZCB1dHRlcmFuY2Ugd2FzIGludGVycnVwdGVkIGJ5IHJlZHVjaW5nIGl0cyBwcmlvcml0eScgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlLCAnbW92ZWQgb24gdG8gbmV4dCB1dHRlcmFuY2UgaW4gcXVldWUnICk7XHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnVXR0ZXJhbmNlIHNwb2tlbiBieSBhbm5vdW5jZUltbWVkaWF0ZWx5IGlzIGludGVycnVwdGVkIGJ5IHJhaXNpbmcgcHJpb3JpdHkgb2YgcXVldWVkIHV0dGVyYW5jZScsIGFzeW5jIGFzc2VydCA9PiB7XHJcbiAgICBmaXJzdFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuICAgIHRoaXJkVXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAxO1xyXG5cclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBmaXJzdFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIHNlY29uZFV0dGVyYW5jZSApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hbm5vdW5jZUltbWVkaWF0ZWx5KCB0aGlyZFV0dGVyYW5jZSApO1xyXG5cclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JUaGlyZFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggZ2V0U3BlYWtpbmdVdHRlcmFuY2UoKSA9PT0gdGhpcmRVdHRlcmFuY2UsICd0aGlyZFV0dGVyYW5jZSBpcyBhbm5vdW5jZWQgaW1tZWRpYXRlbHknICk7XHJcblxyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcblxyXG4gICAgLy8gdGhlIHByaW9yaXR5IG9mIGZpcnN0VXR0ZXJhbmNlIGlzIGluY3JlYXNlZCBzbyB0aGUgdXR0ZXJhbmNlIG9mIGFubm91bmNlSW1tZWRpYXRlbHkgc2hvdWxkIGJlIGludGVycnVwdGVkXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yVGhpcmRVdHRlcmFuY2UgLyA0ICk7IC8vIGxlc3MgdGhhbiByZW1haW5pbmcgdGltZSBmb3IgdGhpcmQgdXR0ZXJhbmNlIGZvciBpbnRlcnJ1cHRpb25cclxuICAgIGFzc2VydC5vayggYWxlcnRzWyAwIF0gPT09IHRoaXJkVXR0ZXJhbmNlLCAndGhpcmQgdXR0ZXJhbmNlIHdhcyBpbnRlcnJ1cHRlZCBieSB0aGUgbmV4dCBVdHRlcmFuY2UgaW5jcmVhc2luZyBwcmlvcml0eScgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICBhc3NlcnQub2soIGdldFNwZWFraW5nVXR0ZXJhbmNlKCkgPT09IGZpcnN0VXR0ZXJhbmNlLCAnbW92ZWQgb24gdG8gaGlnaGVyIHByaW9yaXR5IHV0dGVyYW5jZSBpbiBxdWV1ZScgKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdhbm5vdW5jZUltbWVkaWF0ZWx5IGludGVycnVwdHMgYW5vdGhlciBVdHRlcmFuY2UgaWYgbmV3IFV0dGVyYW5jZSBpcyBoaWdoIHByaW9yaXR5JywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuICAgIGZpcnN0VXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPSAxO1xyXG4gICAgdGhpcmRVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDI7XHJcblxyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hZGRUb0JhY2soIGZpcnN0VXR0ZXJhbmNlICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggc2Vjb25kVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlIC8gMiApO1xyXG4gICAgdGVzdFZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5hbm5vdW5jZUltbWVkaWF0ZWx5KCB0aGlyZFV0dGVyYW5jZSApO1xyXG5cclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JGaXJzdFV0dGVyYW5jZSAvIDQgKTsgLy8gc2hvdWxkIG5vdCBiZSBlbm91Z2ggdGltZSBmb3IgZmlyc3RVdHRlcmFuY2UgdG8gZmluaXNoXHJcbiAgICBhc3NlcnQub2soIGFsZXJ0c1sgMCBdID09PSBmaXJzdFV0dGVyYW5jZSwgJ2ZpcnN0VXR0ZXJhbmNlIGludGVycnVwdGVkIGJlY2F1c2UgaXQgaGFkIGxvd2VyIHByaW9yaXR5JyApO1xyXG5cclxuICAgIGF3YWl0IHRpbWVvdXQoIHRpbWVGb3JUaGlyZFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggZ2V0U3BlYWtpbmdVdHRlcmFuY2UoKSA9PT0gdGhpcmRVdHRlcmFuY2UsICd0aGlyZFV0dGVyYW5jZSBzcG9rZW4gaW1tZWRpYXRlbHknICk7XHJcbiAgfSApO1xyXG5cclxuICBRVW5pdC50ZXN0KCAnYW5ub3VuY2VJbW1lZGlhdGVseSB3aWxsIG5vdCBpbnRlcnJ1cHQgVXR0ZXJhbmNlIG9mIGVxdWFsIG9yIGxlc3NlciBwcmlvcml0eSAnLCBhc3luYyBhc3NlcnQgPT4ge1xyXG4gICAgZmlyc3RVdHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSA9IDE7XHJcbiAgICB0aGlyZFV0dGVyYW5jZS5wcmlvcml0eVByb3BlcnR5LnZhbHVlID0gMTtcclxuXHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggZmlyc3RVdHRlcmFuY2UgKTtcclxuICAgIHRlc3RWb2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCBzZWNvbmRVdHRlcmFuY2UgKTtcclxuXHJcbiAgICBhd2FpdCB0aW1lb3V0KCB0aW1lRm9yRmlyc3RVdHRlcmFuY2UgLyAyICk7XHJcbiAgICB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFubm91bmNlSW1tZWRpYXRlbHkoIHRoaXJkVXR0ZXJhbmNlICk7XHJcblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlIC8gNCApO1xyXG4gICAgYXNzZXJ0Lm9rKCBnZXRTcGVha2luZ1V0dGVyYW5jZSgpID09PSBmaXJzdFV0dGVyYW5jZSwgJ2ZpcnN0VXR0ZXJhbmNlIG5vdCBpbnRlcnJ1cHRlZCwgaXQgaGFzIGVxdWFsIHByaW9yaXR5JyApO1xyXG4gICAgYXNzZXJ0Lm9rKCB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF1bIDAgXS51dHRlcmFuY2UgPT09IHNlY29uZFV0dGVyYW5jZSwgJ3RoaXJkVXR0ZXJhbmNlIHdhcyBhZGRlZCB0byB0aGUgZnJvbnQgb2YgdGhlIHF1ZXVlJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCB0ZXN0Vm9pY2luZ1V0dGVyYW5jZVF1ZXVlWyAncXVldWUnIF0ubGVuZ3RoID09PSAxLCAndGhpcmRVdHRlcmFuY2Ugd2FzIG5vdCBhZGRlZCB0byBxdWV1ZSBhbmQgd2lsbCBuZXZlciBiZSBhbm5vdW5jZWQnICk7XHJcblxyXG4gICAgYXdhaXQgdGltZW91dCggdGltZUZvckZpcnN0VXR0ZXJhbmNlIC8gNCArIHRpbWVGb3JUaGlyZFV0dGVyYW5jZSAvIDIgKTtcclxuICAgIGFzc2VydC5vayggYWxlcnRzWyAwIF0gPT09IGZpcnN0VXR0ZXJhbmNlLCAnZmlyc3RVdHRlcmFuY2Ugc3Bva2VuIGluIGZ1bGwnICk7XHJcbiAgfSApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsU0FBUyxNQUFNLDRCQUE0QjtBQUVsRCxTQUFTQyxPQUFPLEVBQUVDLGNBQWMsUUFBUSw2QkFBNkI7QUFDckUsT0FBT0MsaUJBQWlCLE1BQU0sd0JBQXdCO0FBQ3RELE9BQU9DLFNBQVMsTUFBTSxnQkFBZ0I7QUFDdEMsT0FBT0MsY0FBYyxNQUFNLHFCQUFxQjtBQUNoRCxPQUFPQyx3QkFBd0IsTUFBTSwrQkFBK0I7QUFDcEUsT0FBT0MsdUJBQXVCLE1BQU0sOEJBQThCO0FBRWxFLE1BQU1DLGVBQWUsR0FBR0Msa0JBQWtCLENBQUNDLE1BQU0sQ0FB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