// Copyright 2018-2023, University of Colorado Boulder

/**
 * Tests related to ParallelDOM input and events.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import merge from '../../../../phet-core/js/merge.js';
import Display from '../../display/Display.js';
import Node from '../../nodes/Node.js';
import Rectangle from '../../nodes/Rectangle.js';
import globalKeyStateTracker from '../globalKeyStateTracker.js';
import KeyboardUtils from '../KeyboardUtils.js';

// constants
const TEST_LABEL = 'Test Label';
const TEST_LABEL_2 = 'Test Label 2';
let canRunTests = true;
QUnit.module('PDOMInput', {
  beforeEach: () => {
    // A test can only be run when the document has focus because tests require focus/blur events. Browsers
    // do not emit these events when the window is not active (especially true for pupetteer
    canRunTests = document.hasFocus();
    if (!canRunTests) {
      console.warn('Unable to run focus tests because the document does not have focus');
    }
  }
});

/**
 * Set up a test for accessible input by attaching a root node to a display and initializing events.
 * @param {Display} display
 */
const beforeTest = display => {
  display.initializeEvents();
  document.body.appendChild(display.domElement);
};

/**
 * Clean up a test by detaching events and removing the element from the DOM so that it doesn't interfere
 * with QUnit UI.
 * @param {Display} display
 */
const afterTest = display => {
  document.body.removeChild(display.domElement);
  display.dispose();
};
const dispatchEvent = (domElement, event) => {
  const Constructor = event.startsWith('key') ? window.KeyboardEvent : window.Event;
  domElement.dispatchEvent(new Constructor(event, {
    bubbles: true,
    // that is vital to all that scenery events hold near and dear to their hearts.
    code: KeyboardUtils.KEY_TAB
  }));
};

// create a fake DOM event and delegate to an HTMLElement
// TODO: Can this replace the dispatchEvent function above? EXTRA_TODO use KeyboardFuzzer.triggerDOMEvent as a guide to rewrite this. https://github.com/phetsims/scenery/issues/1581
const triggerDOMEvent = (event, element, key, options) => {
  options = merge({
    // secondary target for the event, behavior depends on event type
    relatedTarget: null,
    // Does the event bubble? Almost all scenery PDOM events should.
    bubbles: true,
    // Is the event cancelable? Most are, this should generally be true.
    cancelable: true,
    // Optional code for the event, most relevant if the eventType is window.KeyboardEvent.
    code: key,
    // {function} Constructor for the event.
    eventConstructor: window.Event
  }, options);
  const eventToDispatch = new options.eventConstructor(event, options);
  element.dispatchEvent ? element.dispatchEvent(eventToDispatch) : element.fireEvent(`on${eventToDispatch}`, eventToDispatch);
};
QUnit.test('focusin/focusout (focus/blur)', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  const b = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  const c = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });

  // rootNode
  //   /  \
  //  a    b
  //        \
  //         c
  rootNode.addChild(a);
  rootNode.addChild(b);
  b.addChild(c);
  let aGotFocus = false;
  let aLostFocus = false;
  let bGotFocus = false;
  let bGotBlur = false;
  let bGotFocusIn = false;
  let bGotFocusOut = false;
  let cGotFocusIn = false;
  let cGotFocusOut = false;
  const resetFocusVariables = () => {
    aGotFocus = false;
    aLostFocus = false;
    bGotFocus = false;
    bGotBlur = false;
    bGotFocusIn = false;
    bGotFocusOut = false;
    cGotFocusIn = false;
    cGotFocusOut = false;
  };
  a.addInputListener({
    focus() {
      aGotFocus = true;
    },
    blur() {
      aLostFocus = true;
    }
  });
  b.addInputListener({
    focus() {
      bGotFocus = true;
    },
    blur() {
      bGotBlur = true;
    },
    focusin() {
      bGotFocusIn = true;
    },
    focusout() {
      bGotFocusOut = true;
    }
  });
  c.addInputListener({
    focusin() {
      cGotFocusIn = true;
    },
    focusout() {
      cGotFocusOut = true;
    }
  });
  a.focus();
  assert.ok(aGotFocus, 'a should have been focused');
  assert.ok(!aLostFocus, 'a should not blur');
  resetFocusVariables();
  b.focus();
  assert.ok(bGotFocus, 'b should have been focused');
  assert.ok(aLostFocus, 'a should have lost focused');
  resetFocusVariables();
  c.focus();
  assert.ok(!bGotFocus, 'b should not receive focus (doesnt bubble)');
  assert.ok(cGotFocusIn, 'c should receive a focusin');
  assert.ok(bGotFocusIn, 'b should receive a focusin (from bubbling)');
  resetFocusVariables();
  c.blur();
  assert.ok(!bGotBlur, 'b should not receive a blur event (doesnt bubble)');
  assert.ok(cGotFocusOut, 'c should have received a focusout');
  assert.ok(bGotFocusOut, 'c should have received a focusout (from bubbling)');
  afterTest(display);
});
QUnit.test('tab focusin/focusout', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);

  // inner content for improved readability during debugging
  const buttonA = new Rectangle(0, 0, 5, 5, {
    tagName: 'button',
    innerContent: 'BUTTON A'
  });
  const buttonB = new Rectangle(0, 0, 5, 5, {
    tagName: 'button',
    innerContent: 'BUTTON B'
  });
  const buttonC = new Rectangle(0, 0, 5, 5, {
    tagName: 'button',
    innerContent: 'BUTTON C'
  });
  rootNode.children = [buttonA, buttonB, buttonC];
  const aPrimarySibling = buttonA.pdomInstances[0].peer.primarySibling;
  const bPrimarySibling = buttonB.pdomInstances[0].peer.primarySibling;

  // test that a blur listener on a node overides the "tab" like navigation moving focus to the next element
  buttonA.focus();
  assert.ok(buttonA.focused, 'butonA has focus initially');
  const overrideFocusListener = {
    blur: event => {
      buttonC.focus();
    }
  };
  buttonA.addInputListener(overrideFocusListener);

  // mimic a "tab" interaction, attempting to move focus to the next element
  triggerDOMEvent('focusout', aPrimarySibling, KeyboardUtils.KEY_TAB, {
    relatedTarget: bPrimarySibling
  });

  // the blur listener on buttonA should override the movement of focus on "tab" like interaction
  assert.ok(buttonC.focused, 'butonC now has focus');

  // test that a blur listener can prevent focus from moving to another element after "tab" like navigation
  buttonA.removeInputListener(overrideFocusListener);
  buttonA.focus();
  const makeUnfocusableListener = {
    blur: event => {
      buttonB.focusable = false;
    }
  };
  buttonA.addInputListener(makeUnfocusableListener);

  // mimic a tab press by moving focus to buttonB - this will automatically have the correct `relatedTarget` for
  // the `blur` event on buttonA because focus is moving from buttonA to buttonB.
  buttonB.focus();

  // the blur listener on buttonA should have made the default element unfocusable
  assert.ok(!buttonB.focused, 'buttonB cannot receive focus due to blur listener on buttonA');
  assert.ok(document.activeElement !== bPrimarySibling, 'element buttonB cannot receive focus due to blur listener on buttonA');
  assert.ok(!buttonA.focused, 'buttonA cannot keep focus when tabbing away, even if buttonB is not focusable');

  // cleanup for the next test
  buttonA.removeInputListener(makeUnfocusableListener);
  buttonB.focusable = true;
  buttonA.focus();
  const causeRedrawListener = {
    blur: event => {
      buttonB.focusable = true;
      buttonB.tagName = 'p';
    }
  };
  buttonA.addInputListener(causeRedrawListener);
  buttonB.focus();

  // the blur listener on buttonA will cause a full redraw of buttonB in the PDOM, but buttonB should receive focus
  assert.ok(buttonB.focused, 'buttonB should still have focus after a full redraw due to a blur listener');

  // cleanup
  buttonA.removeInputListener(causeRedrawListener);
  buttonA.focusable = true;
  buttonB.tagName = 'button';

  // sanity checks manipulating focus, and added because we were seeing very strange things while working on
  // https://github.com/phetsims/scenery/issues/1296, but these should definitely pass
  buttonA.focus();
  assert.ok(buttonA.focused, 'buttonA does not have focus after a basic focus call?');
  buttonB.blur();
  assert.ok(buttonA.focused, 'Blurring a non-focussed element should not remove focus from a non-focused element');
  afterTest(display);
});
QUnit.test('click', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  let gotFocus = false;
  let gotClick = false;
  let aClickCounter = 0;
  rootNode.addChild(a);
  a.addInputListener({
    focus() {
      gotFocus = true;
    },
    click() {
      gotClick = true;
      aClickCounter++;
    },
    blur() {
      gotFocus = false;
    }
  });
  a.pdomInstances[0].peer.primarySibling.focus();
  assert.ok(gotFocus && !gotClick, 'focus first');
  a.pdomInstances[0].peer.primarySibling.click(); // this works because it's a button
  assert.ok(gotClick && gotFocus && aClickCounter === 1, 'a should have been clicked');
  let bClickCounter = 0;
  const b = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  b.addInputListener({
    click() {
      bClickCounter++;
    }
  });
  a.addChild(b);
  b.pdomInstances[0].peer.primarySibling.focus();
  b.pdomInstances[0].peer.primarySibling.click();
  assert.ok(bClickCounter === 1 && aClickCounter === 2, 'a should have been clicked with b');
  a.pdomInstances[0].peer.primarySibling.click();
  assert.ok(bClickCounter === 1 && aClickCounter === 3, 'b still should not have been clicked.');

  // create a node
  const a1 = new Node({
    tagName: 'button'
  });
  a.addChild(a1);
  assert.ok(a1.inputListeners.length === 0, 'no input accessible listeners on instantiation');
  assert.ok(a1.labelContent === null, 'no label on instantiation');

  // add a listener
  const listener = {
    click() {
      a1.labelContent = TEST_LABEL;
    }
  };
  a1.addInputListener(listener);
  assert.ok(a1.inputListeners.length === 1, 'accessible listener added');

  // verify added with hasInputListener
  assert.ok(a1.hasInputListener(listener) === true, 'found with hasInputListener');

  // fire the event
  a1.pdomInstances[0].peer.primarySibling.click();
  assert.ok(a1.labelContent === TEST_LABEL, 'click fired, label set');
  const c = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  const d = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  const e = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  let cClickCount = 0;
  let dClickCount = 0;
  let eClickCount = 0;
  rootNode.addChild(c);
  c.addChild(d);
  d.addChild(e);
  c.addInputListener({
    click() {
      cClickCount++;
    }
  });
  d.addInputListener({
    click() {
      dClickCount++;
    }
  });
  e.addInputListener({
    click() {
      eClickCount++;
    }
  });
  e.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === dClickCount && cClickCount === eClickCount && cClickCount === 1, 'click should have bubbled to all parents');
  d.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 2 && dClickCount === 2 && eClickCount === 1, 'd should not trigger click on e');
  c.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 3 && dClickCount === 2 && eClickCount === 1, 'c should not trigger click on d or e');

  // reset click count
  cClickCount = 0;
  dClickCount = 0;
  eClickCount = 0;
  c.pdomOrder = [d, e];
  e.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 1 && dClickCount === 0 && eClickCount === 1, 'pdomOrder means click should bypass d');
  c.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 2 && dClickCount === 0 && eClickCount === 1, 'click c should not effect e or d.');
  d.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 3 && dClickCount === 1 && eClickCount === 1, 'click d should not effect e.');

  // reset click count
  cClickCount = 0;
  dClickCount = 0;
  eClickCount = 0;
  const f = new Rectangle(0, 0, 20, 20, {
    tagName: 'button'
  });
  let fClickCount = 0;
  f.addInputListener({
    click() {
      fClickCount++;
    }
  });
  e.addChild(f);

  // so its a chain in the scene graph c->d->e->f

  d.pdomOrder = [f];

  /* accessible instance tree:
       c
      / \
      d  e
      |
      f
  */

  f.pdomInstances[0].peer.primarySibling.click();
  assert.ok(cClickCount === 1 && dClickCount === 1 && eClickCount === 0 && fClickCount === 1, 'click d should not effect e.');
  afterTest(display);
});
QUnit.test('click extra', assert => {
  // create a node
  const a1 = new Node({
    tagName: 'button'
  });
  const root = new Node({
    tagName: 'div'
  });
  const display = new Display(root);
  beforeTest(display);
  root.addChild(a1);
  assert.ok(a1.inputListeners.length === 0, 'no input accessible listeners on instantiation');
  assert.ok(a1.labelContent === null, 'no label on instantiation');

  // add a listener
  const listener = {
    click: () => {
      a1.labelContent = TEST_LABEL;
    }
  };
  a1.addInputListener(listener);
  assert.ok(a1.inputListeners.length === 1, 'accessible listener added');

  // verify added with hasInputListener
  assert.ok(a1.hasInputListener(listener) === true, 'found with hasInputListener');

  // fire the event
  a1.pdomInstances[0].peer.primarySibling.click();
  assert.ok(a1.labelContent === TEST_LABEL, 'click fired, label set');

  // remove the listener
  a1.removeInputListener(listener);
  assert.ok(a1.inputListeners.length === 0, 'accessible listener removed');

  // verify removed with hasInputListener
  assert.ok(a1.hasInputListener(listener) === false, 'not found with hasInputListener');

  // make sure event listener was also removed from DOM element
  // click should not change the label
  a1.labelContent = TEST_LABEL_2;
  assert.ok(a1.labelContent === TEST_LABEL_2, 'before click');

  // setting the label redrew the pdom, so get a reference to the new dom element.
  a1.pdomInstances[0].peer.primarySibling.click();
  assert.ok(a1.labelContent === TEST_LABEL_2, 'click should not change label');

  // verify disposal removes accessible input listeners
  a1.addInputListener(listener);
  a1.dispose();

  // TODO: Since converting to use Node.inputListeners, we can't assume this anymore https://github.com/phetsims/scenery/issues/1581
  // assert.ok( a1.hasInputListener( listener ) === false, 'disposal removed accessible input listeners' );

  afterTest(display);
});
QUnit.test('input', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Rectangle(0, 0, 20, 20, {
    tagName: 'input',
    inputType: 'text'
  });
  let gotFocus = false;
  let gotInput = false;
  rootNode.addChild(a);
  a.addInputListener({
    focus() {
      gotFocus = true;
    },
    input() {
      gotInput = true;
    },
    blur() {
      gotFocus = false;
    }
  });
  a.pdomInstances[0].peer.primarySibling.focus();
  assert.ok(gotFocus && !gotInput, 'focus first');
  dispatchEvent(a.pdomInstances[0].peer.primarySibling, 'input');
  assert.ok(gotInput && gotFocus, 'a should have been an input');
  afterTest(display);
});
QUnit.test('change', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Rectangle(0, 0, 20, 20, {
    tagName: 'input',
    inputType: 'range'
  });
  let gotFocus = false;
  let gotChange = false;
  rootNode.addChild(a);
  a.addInputListener({
    focus() {
      gotFocus = true;
    },
    change() {
      gotChange = true;
    },
    blur() {
      gotFocus = false;
    }
  });
  a.pdomInstances[0].peer.primarySibling.focus();
  assert.ok(gotFocus && !gotChange, 'focus first');
  dispatchEvent(a.pdomInstances[0].peer.primarySibling, 'change');
  assert.ok(gotChange && gotFocus, 'a should have been an input');
  afterTest(display);
});
QUnit.test('keydown/keyup', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Rectangle(0, 0, 20, 20, {
    tagName: 'input',
    inputType: 'text'
  });
  let gotFocus = false;
  let gotKeydown = false;
  let gotKeyup = false;
  rootNode.addChild(a);
  a.addInputListener({
    focus() {
      gotFocus = true;
    },
    keydown() {
      gotKeydown = true;
    },
    keyup() {
      gotKeyup = true;
    },
    blur() {
      gotFocus = false;
    }
  });
  a.pdomInstances[0].peer.primarySibling.focus();
  assert.ok(gotFocus && !gotKeydown, 'focus first');
  dispatchEvent(a.pdomInstances[0].peer.primarySibling, 'keydown');
  assert.ok(gotKeydown && gotFocus, 'a should have had keydown');
  dispatchEvent(a.pdomInstances[0].peer.primarySibling, 'keyup');
  assert.ok(gotKeydown && gotKeyup && gotFocus, 'a should have had keyup');
  afterTest(display);
});
QUnit.test('Global KeyStateTracker tests', assert => {
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  beforeTest(display);
  const a = new Node({
    tagName: 'button'
  });
  const b = new Node({
    tagName: 'button'
  });
  const c = new Node({
    tagName: 'button'
  });
  const d = new Node({
    tagName: 'button'
  });
  a.addChild(b);
  b.addChild(c);
  c.addChild(d);
  rootNode.addChild(a);
  const dPrimarySibling = d.pdomInstances[0].peer.primarySibling;
  triggerDOMEvent('keydown', dPrimarySibling, KeyboardUtils.KEY_RIGHT_ARROW, {
    eventConstructor: window.KeyboardEvent
  });
  assert.ok(globalKeyStateTracker.isKeyDown(KeyboardUtils.KEY_RIGHT_ARROW), 'global keyStateTracker should be updated with right arrow key down');
  afterTest(display);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIkRpc3BsYXkiLCJOb2RlIiwiUmVjdGFuZ2xlIiwiZ2xvYmFsS2V5U3RhdGVUcmFja2VyIiwiS2V5Ym9hcmRVdGlscyIsIlRFU1RfTEFCRUwiLCJURVNUX0xBQkVMXzIiLCJjYW5SdW5UZXN0cyIsIlFVbml0IiwibW9kdWxlIiwiYmVmb3JlRWFjaCIsImRvY3VtZW50IiwiaGFzRm9jdXMiLCJjb25zb2xlIiwid2FybiIsImJlZm9yZVRlc3QiLCJkaXNwbGF5IiwiaW5pdGlhbGl6ZUV2ZW50cyIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImRvbUVsZW1lbnQiLCJhZnRlclRlc3QiLCJyZW1vdmVDaGlsZCIsImRpc3Bvc2UiLCJkaXNwYXRjaEV2ZW50IiwiZXZlbnQiLCJDb25zdHJ1Y3RvciIsInN0YXJ0c1dpdGgiLCJ3aW5kb3ciLCJLZXlib2FyZEV2ZW50IiwiRXZlbnQiLCJidWJibGVzIiwiY29kZSIsIktFWV9UQUIiLCJ0cmlnZ2VyRE9NRXZlbnQiLCJlbGVtZW50Iiwia2V5Iiwib3B0aW9ucyIsInJlbGF0ZWRUYXJnZXQiLCJjYW5jZWxhYmxlIiwiZXZlbnRDb25zdHJ1Y3RvciIsImV2ZW50VG9EaXNwYXRjaCIsImZpcmVFdmVudCIsInRlc3QiLCJhc3NlcnQiLCJvayIsInJvb3ROb2RlIiwidGFnTmFtZSIsImEiLCJiIiwiYyIsImFkZENoaWxkIiwiYUdvdEZvY3VzIiwiYUxvc3RGb2N1cyIsImJHb3RGb2N1cyIsImJHb3RCbHVyIiwiYkdvdEZvY3VzSW4iLCJiR290Rm9jdXNPdXQiLCJjR290Rm9jdXNJbiIsImNHb3RGb2N1c091dCIsInJlc2V0Rm9jdXNWYXJpYWJsZXMiLCJhZGRJbnB1dExpc3RlbmVyIiwiZm9jdXMiLCJibHVyIiwiZm9jdXNpbiIsImZvY3Vzb3V0IiwiYnV0dG9uQSIsImlubmVyQ29udGVudCIsImJ1dHRvbkIiLCJidXR0b25DIiwiY2hpbGRyZW4iLCJhUHJpbWFyeVNpYmxpbmciLCJwZG9tSW5zdGFuY2VzIiwicGVlciIsInByaW1hcnlTaWJsaW5nIiwiYlByaW1hcnlTaWJsaW5nIiwiZm9jdXNlZCIsIm92ZXJyaWRlRm9jdXNMaXN0ZW5lciIsInJlbW92ZUlucHV0TGlzdGVuZXIiLCJtYWtlVW5mb2N1c2FibGVMaXN0ZW5lciIsImZvY3VzYWJsZSIsImFjdGl2ZUVsZW1lbnQiLCJjYXVzZVJlZHJhd0xpc3RlbmVyIiwiZ290Rm9jdXMiLCJnb3RDbGljayIsImFDbGlja0NvdW50ZXIiLCJjbGljayIsImJDbGlja0NvdW50ZXIiLCJhMSIsImlucHV0TGlzdGVuZXJzIiwibGVuZ3RoIiwibGFiZWxDb250ZW50IiwibGlzdGVuZXIiLCJoYXNJbnB1dExpc3RlbmVyIiwiZCIsImUiLCJjQ2xpY2tDb3VudCIsImRDbGlja0NvdW50IiwiZUNsaWNrQ291bnQiLCJwZG9tT3JkZXIiLCJmIiwiZkNsaWNrQ291bnQiLCJyb290IiwiaW5wdXRUeXBlIiwiZ290SW5wdXQiLCJpbnB1dCIsImdvdENoYW5nZSIsImNoYW5nZSIsImdvdEtleWRvd24iLCJnb3RLZXl1cCIsImtleWRvd24iLCJrZXl1cCIsImRQcmltYXJ5U2libGluZyIsIktFWV9SSUdIVF9BUlJPVyIsImlzS2V5RG93biJdLCJzb3VyY2VzIjpbIlBET01JbnB1dFRlc3RzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRlc3RzIHJlbGF0ZWQgdG8gUGFyYWxsZWxET00gaW5wdXQgYW5kIGV2ZW50cy5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IERpc3BsYXkgZnJvbSAnLi4vLi4vZGlzcGxheS9EaXNwbGF5LmpzJztcclxuaW1wb3J0IE5vZGUgZnJvbSAnLi4vLi4vbm9kZXMvTm9kZS5qcyc7XHJcbmltcG9ydCBSZWN0YW5nbGUgZnJvbSAnLi4vLi4vbm9kZXMvUmVjdGFuZ2xlLmpzJztcclxuaW1wb3J0IGdsb2JhbEtleVN0YXRlVHJhY2tlciBmcm9tICcuLi9nbG9iYWxLZXlTdGF0ZVRyYWNrZXIuanMnO1xyXG5pbXBvcnQgS2V5Ym9hcmRVdGlscyBmcm9tICcuLi9LZXlib2FyZFV0aWxzLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBURVNUX0xBQkVMID0gJ1Rlc3QgTGFiZWwnO1xyXG5jb25zdCBURVNUX0xBQkVMXzIgPSAnVGVzdCBMYWJlbCAyJztcclxuXHJcbmxldCBjYW5SdW5UZXN0cyA9IHRydWU7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdQRE9NSW5wdXQnLCB7XHJcbiAgYmVmb3JlRWFjaDogKCkgPT4ge1xyXG5cclxuICAgIC8vIEEgdGVzdCBjYW4gb25seSBiZSBydW4gd2hlbiB0aGUgZG9jdW1lbnQgaGFzIGZvY3VzIGJlY2F1c2UgdGVzdHMgcmVxdWlyZSBmb2N1cy9ibHVyIGV2ZW50cy4gQnJvd3NlcnNcclxuICAgIC8vIGRvIG5vdCBlbWl0IHRoZXNlIGV2ZW50cyB3aGVuIHRoZSB3aW5kb3cgaXMgbm90IGFjdGl2ZSAoZXNwZWNpYWxseSB0cnVlIGZvciBwdXBldHRlZXJcclxuICAgIGNhblJ1blRlc3RzID0gZG9jdW1lbnQuaGFzRm9jdXMoKTtcclxuXHJcbiAgICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgICAgY29uc29sZS53YXJuKCAnVW5hYmxlIHRvIHJ1biBmb2N1cyB0ZXN0cyBiZWNhdXNlIHRoZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgfVxyXG4gIH1cclxufSApO1xyXG5cclxuLyoqXHJcbiAqIFNldCB1cCBhIHRlc3QgZm9yIGFjY2Vzc2libGUgaW5wdXQgYnkgYXR0YWNoaW5nIGEgcm9vdCBub2RlIHRvIGEgZGlzcGxheSBhbmQgaW5pdGlhbGl6aW5nIGV2ZW50cy5cclxuICogQHBhcmFtIHtEaXNwbGF5fSBkaXNwbGF5XHJcbiAqL1xyXG5jb25zdCBiZWZvcmVUZXN0ID0gZGlzcGxheSA9PiB7XHJcbiAgZGlzcGxheS5pbml0aWFsaXplRXZlbnRzKCk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xlYW4gdXAgYSB0ZXN0IGJ5IGRldGFjaGluZyBldmVudHMgYW5kIHJlbW92aW5nIHRoZSBlbGVtZW50IGZyb20gdGhlIERPTSBzbyB0aGF0IGl0IGRvZXNuJ3QgaW50ZXJmZXJlXHJcbiAqIHdpdGggUVVuaXQgVUkuXHJcbiAqIEBwYXJhbSB7RGlzcGxheX0gZGlzcGxheVxyXG4gKi9cclxuY29uc3QgYWZ0ZXJUZXN0ID0gZGlzcGxheSA9PiB7XHJcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbn07XHJcblxyXG5jb25zdCBkaXNwYXRjaEV2ZW50ID0gKCBkb21FbGVtZW50LCBldmVudCApID0+IHtcclxuICBjb25zdCBDb25zdHJ1Y3RvciA9IGV2ZW50LnN0YXJ0c1dpdGgoICdrZXknICkgPyB3aW5kb3cuS2V5Ym9hcmRFdmVudCA6IHdpbmRvdy5FdmVudDtcclxuICBkb21FbGVtZW50LmRpc3BhdGNoRXZlbnQoIG5ldyBDb25zdHJ1Y3RvciggZXZlbnQsIHtcclxuICAgIGJ1YmJsZXM6IHRydWUsIC8vIHRoYXQgaXMgdml0YWwgdG8gYWxsIHRoYXQgc2NlbmVyeSBldmVudHMgaG9sZCBuZWFyIGFuZCBkZWFyIHRvIHRoZWlyIGhlYXJ0cy5cclxuICAgIGNvZGU6IEtleWJvYXJkVXRpbHMuS0VZX1RBQlxyXG4gIH0gKSApO1xyXG59O1xyXG5cclxuLy8gY3JlYXRlIGEgZmFrZSBET00gZXZlbnQgYW5kIGRlbGVnYXRlIHRvIGFuIEhUTUxFbGVtZW50XHJcbi8vIFRPRE86IENhbiB0aGlzIHJlcGxhY2UgdGhlIGRpc3BhdGNoRXZlbnQgZnVuY3Rpb24gYWJvdmU/IEVYVFJBX1RPRE8gdXNlIEtleWJvYXJkRnV6emVyLnRyaWdnZXJET01FdmVudCBhcyBhIGd1aWRlIHRvIHJld3JpdGUgdGhpcy4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuY29uc3QgdHJpZ2dlckRPTUV2ZW50ID0gKCBldmVudCwgZWxlbWVudCwga2V5LCBvcHRpb25zICkgPT4ge1xyXG5cclxuICBvcHRpb25zID0gbWVyZ2UoIHtcclxuXHJcbiAgICAvLyBzZWNvbmRhcnkgdGFyZ2V0IGZvciB0aGUgZXZlbnQsIGJlaGF2aW9yIGRlcGVuZHMgb24gZXZlbnQgdHlwZVxyXG4gICAgcmVsYXRlZFRhcmdldDogbnVsbCxcclxuXHJcbiAgICAvLyBEb2VzIHRoZSBldmVudCBidWJibGU/IEFsbW9zdCBhbGwgc2NlbmVyeSBQRE9NIGV2ZW50cyBzaG91bGQuXHJcbiAgICBidWJibGVzOiB0cnVlLFxyXG5cclxuICAgIC8vIElzIHRoZSBldmVudCBjYW5jZWxhYmxlPyBNb3N0IGFyZSwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IGJlIHRydWUuXHJcbiAgICBjYW5jZWxhYmxlOiB0cnVlLFxyXG5cclxuICAgIC8vIE9wdGlvbmFsIGNvZGUgZm9yIHRoZSBldmVudCwgbW9zdCByZWxldmFudCBpZiB0aGUgZXZlbnRUeXBlIGlzIHdpbmRvdy5LZXlib2FyZEV2ZW50LlxyXG4gICAgY29kZToga2V5LFxyXG5cclxuICAgIC8vIHtmdW5jdGlvbn0gQ29uc3RydWN0b3IgZm9yIHRoZSBldmVudC5cclxuICAgIGV2ZW50Q29uc3RydWN0b3I6IHdpbmRvdy5FdmVudFxyXG4gIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgY29uc3QgZXZlbnRUb0Rpc3BhdGNoID0gbmV3IG9wdGlvbnMuZXZlbnRDb25zdHJ1Y3RvciggZXZlbnQsIG9wdGlvbnMgKTtcclxuICBlbGVtZW50LmRpc3BhdGNoRXZlbnQgPyBlbGVtZW50LmRpc3BhdGNoRXZlbnQoIGV2ZW50VG9EaXNwYXRjaCApIDogZWxlbWVudC5maXJlRXZlbnQoIGBvbiR7ZXZlbnRUb0Rpc3BhdGNofWAsIGV2ZW50VG9EaXNwYXRjaCApO1xyXG59O1xyXG5cclxuUVVuaXQudGVzdCggJ2ZvY3VzaW4vZm9jdXNvdXQgKGZvY3VzL2JsdXIpJywgYXNzZXJ0ID0+IHtcclxuICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1NraXBwaW5nIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGJlZm9yZVRlc3QoIGRpc3BsYXkgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcbiAgY29uc3QgYyA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcblxyXG4gIC8vIHJvb3ROb2RlXHJcbiAgLy8gICAvICBcXFxyXG4gIC8vICBhICAgIGJcclxuICAvLyAgICAgICAgXFxcclxuICAvLyAgICAgICAgIGNcclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBiICk7XHJcbiAgYi5hZGRDaGlsZCggYyApO1xyXG5cclxuICBsZXQgYUdvdEZvY3VzID0gZmFsc2U7XHJcbiAgbGV0IGFMb3N0Rm9jdXMgPSBmYWxzZTtcclxuICBsZXQgYkdvdEZvY3VzID0gZmFsc2U7XHJcbiAgbGV0IGJHb3RCbHVyID0gZmFsc2U7XHJcbiAgbGV0IGJHb3RGb2N1c0luID0gZmFsc2U7XHJcbiAgbGV0IGJHb3RGb2N1c091dCA9IGZhbHNlO1xyXG4gIGxldCBjR290Rm9jdXNJbiA9IGZhbHNlO1xyXG4gIGxldCBjR290Rm9jdXNPdXQgPSBmYWxzZTtcclxuXHJcbiAgY29uc3QgcmVzZXRGb2N1c1ZhcmlhYmxlcyA9ICgpID0+IHtcclxuICAgIGFHb3RGb2N1cyA9IGZhbHNlO1xyXG4gICAgYUxvc3RGb2N1cyA9IGZhbHNlO1xyXG4gICAgYkdvdEZvY3VzID0gZmFsc2U7XHJcbiAgICBiR290Qmx1ciA9IGZhbHNlO1xyXG4gICAgYkdvdEZvY3VzSW4gPSBmYWxzZTtcclxuICAgIGJHb3RGb2N1c091dCA9IGZhbHNlO1xyXG4gICAgY0dvdEZvY3VzSW4gPSBmYWxzZTtcclxuICAgIGNHb3RGb2N1c091dCA9IGZhbHNlO1xyXG4gIH07XHJcblxyXG4gIGEuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgZm9jdXMoKSB7XHJcbiAgICAgIGFHb3RGb2N1cyA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgYmx1cigpIHtcclxuICAgICAgYUxvc3RGb2N1cyA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBiLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgIGZvY3VzKCkge1xyXG4gICAgICBiR290Rm9jdXMgPSB0cnVlO1xyXG4gICAgfSxcclxuICAgIGJsdXIoKSB7XHJcbiAgICAgIGJHb3RCbHVyID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c2luKCkge1xyXG4gICAgICBiR290Rm9jdXNJbiA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNvdXQoKSB7XHJcbiAgICAgIGJHb3RGb2N1c091dCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBjLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgIGZvY3VzaW4oKSB7XHJcbiAgICAgIGNHb3RGb2N1c0luID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c291dCgpIHtcclxuICAgICAgY0dvdEZvY3VzT3V0ID0gdHJ1ZTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIGEuZm9jdXMoKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBhR290Rm9jdXMsICdhIHNob3VsZCBoYXZlIGJlZW4gZm9jdXNlZCcgKTtcclxuICBhc3NlcnQub2soICFhTG9zdEZvY3VzLCAnYSBzaG91bGQgbm90IGJsdXInICk7XHJcbiAgcmVzZXRGb2N1c1ZhcmlhYmxlcygpO1xyXG5cclxuICBiLmZvY3VzKCk7XHJcbiAgYXNzZXJ0Lm9rKCBiR290Rm9jdXMsICdiIHNob3VsZCBoYXZlIGJlZW4gZm9jdXNlZCcgKTtcclxuICBhc3NlcnQub2soIGFMb3N0Rm9jdXMsICdhIHNob3VsZCBoYXZlIGxvc3QgZm9jdXNlZCcgKTtcclxuICByZXNldEZvY3VzVmFyaWFibGVzKCk7XHJcblxyXG4gIGMuZm9jdXMoKTtcclxuICBhc3NlcnQub2soICFiR290Rm9jdXMsICdiIHNob3VsZCBub3QgcmVjZWl2ZSBmb2N1cyAoZG9lc250IGJ1YmJsZSknICk7XHJcbiAgYXNzZXJ0Lm9rKCBjR290Rm9jdXNJbiwgJ2Mgc2hvdWxkIHJlY2VpdmUgYSBmb2N1c2luJyApO1xyXG4gIGFzc2VydC5vayggYkdvdEZvY3VzSW4sICdiIHNob3VsZCByZWNlaXZlIGEgZm9jdXNpbiAoZnJvbSBidWJibGluZyknICk7XHJcbiAgcmVzZXRGb2N1c1ZhcmlhYmxlcygpO1xyXG5cclxuICBjLmJsdXIoKTtcclxuICBhc3NlcnQub2soICFiR290Qmx1ciwgJ2Igc2hvdWxkIG5vdCByZWNlaXZlIGEgYmx1ciBldmVudCAoZG9lc250IGJ1YmJsZSknICk7XHJcbiAgYXNzZXJ0Lm9rKCBjR290Rm9jdXNPdXQsICdjIHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgZm9jdXNvdXQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBiR290Rm9jdXNPdXQsICdjIHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgZm9jdXNvdXQgKGZyb20gYnViYmxpbmcpJyApO1xyXG5cclxuICBhZnRlclRlc3QoIGRpc3BsYXkgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3RhYiBmb2N1c2luL2ZvY3Vzb3V0JywgYXNzZXJ0ID0+IHtcclxuICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1NraXBwaW5nIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7XHJcbiAgYmVmb3JlVGVzdCggZGlzcGxheSApO1xyXG5cclxuICAvLyBpbm5lciBjb250ZW50IGZvciBpbXByb3ZlZCByZWFkYWJpbGl0eSBkdXJpbmcgZGVidWdnaW5nXHJcbiAgY29uc3QgYnV0dG9uQSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDUsIDUsIHsgdGFnTmFtZTogJ2J1dHRvbicsIGlubmVyQ29udGVudDogJ0JVVFRPTiBBJyB9ICk7XHJcbiAgY29uc3QgYnV0dG9uQiA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDUsIDUsIHsgdGFnTmFtZTogJ2J1dHRvbicsIGlubmVyQ29udGVudDogJ0JVVFRPTiBCJyB9ICk7XHJcbiAgY29uc3QgYnV0dG9uQyA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDUsIDUsIHsgdGFnTmFtZTogJ2J1dHRvbicsIGlubmVyQ29udGVudDogJ0JVVFRPTiBDJyB9ICk7XHJcbiAgcm9vdE5vZGUuY2hpbGRyZW4gPSBbIGJ1dHRvbkEsIGJ1dHRvbkIsIGJ1dHRvbkMgXTtcclxuXHJcbiAgY29uc3QgYVByaW1hcnlTaWJsaW5nID0gYnV0dG9uQS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZztcclxuICBjb25zdCBiUHJpbWFyeVNpYmxpbmcgPSBidXR0b25CLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nO1xyXG5cclxuICAvLyB0ZXN0IHRoYXQgYSBibHVyIGxpc3RlbmVyIG9uIGEgbm9kZSBvdmVyaWRlcyB0aGUgXCJ0YWJcIiBsaWtlIG5hdmlnYXRpb24gbW92aW5nIGZvY3VzIHRvIHRoZSBuZXh0IGVsZW1lbnRcclxuICBidXR0b25BLmZvY3VzKCk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25BLmZvY3VzZWQsICdidXRvbkEgaGFzIGZvY3VzIGluaXRpYWxseScgKTtcclxuXHJcbiAgY29uc3Qgb3ZlcnJpZGVGb2N1c0xpc3RlbmVyID0ge1xyXG4gICAgYmx1cjogZXZlbnQgPT4ge1xyXG4gICAgICBidXR0b25DLmZvY3VzKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICBidXR0b25BLmFkZElucHV0TGlzdGVuZXIoIG92ZXJyaWRlRm9jdXNMaXN0ZW5lciApO1xyXG5cclxuICAvLyBtaW1pYyBhIFwidGFiXCIgaW50ZXJhY3Rpb24sIGF0dGVtcHRpbmcgdG8gbW92ZSBmb2N1cyB0byB0aGUgbmV4dCBlbGVtZW50XHJcbiAgdHJpZ2dlckRPTUV2ZW50KCAnZm9jdXNvdXQnLCBhUHJpbWFyeVNpYmxpbmcsIEtleWJvYXJkVXRpbHMuS0VZX1RBQiwge1xyXG4gICAgcmVsYXRlZFRhcmdldDogYlByaW1hcnlTaWJsaW5nXHJcbiAgfSApO1xyXG5cclxuICAvLyB0aGUgYmx1ciBsaXN0ZW5lciBvbiBidXR0b25BIHNob3VsZCBvdmVycmlkZSB0aGUgbW92ZW1lbnQgb2YgZm9jdXMgb24gXCJ0YWJcIiBsaWtlIGludGVyYWN0aW9uXHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25DLmZvY3VzZWQsICdidXRvbkMgbm93IGhhcyBmb2N1cycgKTtcclxuXHJcbiAgLy8gdGVzdCB0aGF0IGEgYmx1ciBsaXN0ZW5lciBjYW4gcHJldmVudCBmb2N1cyBmcm9tIG1vdmluZyB0byBhbm90aGVyIGVsZW1lbnQgYWZ0ZXIgXCJ0YWJcIiBsaWtlIG5hdmlnYXRpb25cclxuICBidXR0b25BLnJlbW92ZUlucHV0TGlzdGVuZXIoIG92ZXJyaWRlRm9jdXNMaXN0ZW5lciApO1xyXG4gIGJ1dHRvbkEuZm9jdXMoKTtcclxuICBjb25zdCBtYWtlVW5mb2N1c2FibGVMaXN0ZW5lciA9IHtcclxuICAgIGJsdXI6IGV2ZW50ID0+IHtcclxuICAgICAgYnV0dG9uQi5mb2N1c2FibGUgPSBmYWxzZTtcclxuICAgIH1cclxuICB9O1xyXG4gIGJ1dHRvbkEuYWRkSW5wdXRMaXN0ZW5lciggbWFrZVVuZm9jdXNhYmxlTGlzdGVuZXIgKTtcclxuXHJcbiAgLy8gbWltaWMgYSB0YWIgcHJlc3MgYnkgbW92aW5nIGZvY3VzIHRvIGJ1dHRvbkIgLSB0aGlzIHdpbGwgYXV0b21hdGljYWxseSBoYXZlIHRoZSBjb3JyZWN0IGByZWxhdGVkVGFyZ2V0YCBmb3JcclxuICAvLyB0aGUgYGJsdXJgIGV2ZW50IG9uIGJ1dHRvbkEgYmVjYXVzZSBmb2N1cyBpcyBtb3ZpbmcgZnJvbSBidXR0b25BIHRvIGJ1dHRvbkIuXHJcbiAgYnV0dG9uQi5mb2N1cygpO1xyXG5cclxuICAvLyB0aGUgYmx1ciBsaXN0ZW5lciBvbiBidXR0b25BIHNob3VsZCBoYXZlIG1hZGUgdGhlIGRlZmF1bHQgZWxlbWVudCB1bmZvY3VzYWJsZVxyXG4gIGFzc2VydC5vayggIWJ1dHRvbkIuZm9jdXNlZCwgJ2J1dHRvbkIgY2Fubm90IHJlY2VpdmUgZm9jdXMgZHVlIHRvIGJsdXIgbGlzdGVuZXIgb24gYnV0dG9uQScgKTtcclxuICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGJQcmltYXJ5U2libGluZywgJ2VsZW1lbnQgYnV0dG9uQiBjYW5ub3QgcmVjZWl2ZSBmb2N1cyBkdWUgdG8gYmx1ciBsaXN0ZW5lciBvbiBidXR0b25BJyApO1xyXG4gIGFzc2VydC5vayggIWJ1dHRvbkEuZm9jdXNlZCwgJ2J1dHRvbkEgY2Fubm90IGtlZXAgZm9jdXMgd2hlbiB0YWJiaW5nIGF3YXksIGV2ZW4gaWYgYnV0dG9uQiBpcyBub3QgZm9jdXNhYmxlJyApO1xyXG5cclxuICAvLyBjbGVhbnVwIGZvciB0aGUgbmV4dCB0ZXN0XHJcbiAgYnV0dG9uQS5yZW1vdmVJbnB1dExpc3RlbmVyKCBtYWtlVW5mb2N1c2FibGVMaXN0ZW5lciApO1xyXG4gIGJ1dHRvbkIuZm9jdXNhYmxlID0gdHJ1ZTtcclxuXHJcbiAgYnV0dG9uQS5mb2N1cygpO1xyXG4gIGNvbnN0IGNhdXNlUmVkcmF3TGlzdGVuZXIgPSB7XHJcbiAgICBibHVyOiBldmVudCA9PiB7XHJcbiAgICAgIGJ1dHRvbkIuZm9jdXNhYmxlID0gdHJ1ZTtcclxuICAgICAgYnV0dG9uQi50YWdOYW1lID0gJ3AnO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgYnV0dG9uQS5hZGRJbnB1dExpc3RlbmVyKCBjYXVzZVJlZHJhd0xpc3RlbmVyICk7XHJcblxyXG4gIGJ1dHRvbkIuZm9jdXMoKTtcclxuXHJcbiAgLy8gdGhlIGJsdXIgbGlzdGVuZXIgb24gYnV0dG9uQSB3aWxsIGNhdXNlIGEgZnVsbCByZWRyYXcgb2YgYnV0dG9uQiBpbiB0aGUgUERPTSwgYnV0IGJ1dHRvbkIgc2hvdWxkIHJlY2VpdmUgZm9jdXNcclxuICBhc3NlcnQub2soIGJ1dHRvbkIuZm9jdXNlZCwgJ2J1dHRvbkIgc2hvdWxkIHN0aWxsIGhhdmUgZm9jdXMgYWZ0ZXIgYSBmdWxsIHJlZHJhdyBkdWUgdG8gYSBibHVyIGxpc3RlbmVyJyApO1xyXG5cclxuICAvLyBjbGVhbnVwXHJcbiAgYnV0dG9uQS5yZW1vdmVJbnB1dExpc3RlbmVyKCBjYXVzZVJlZHJhd0xpc3RlbmVyICk7XHJcbiAgYnV0dG9uQS5mb2N1c2FibGUgPSB0cnVlO1xyXG4gIGJ1dHRvbkIudGFnTmFtZSA9ICdidXR0b24nO1xyXG5cclxuICAvLyBzYW5pdHkgY2hlY2tzIG1hbmlwdWxhdGluZyBmb2N1cywgYW5kIGFkZGVkIGJlY2F1c2Ugd2Ugd2VyZSBzZWVpbmcgdmVyeSBzdHJhbmdlIHRoaW5ncyB3aGlsZSB3b3JraW5nIG9uXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEyOTYsIGJ1dCB0aGVzZSBzaG91bGQgZGVmaW5pdGVseSBwYXNzXHJcbiAgYnV0dG9uQS5mb2N1cygpO1xyXG4gIGFzc2VydC5vayggYnV0dG9uQS5mb2N1c2VkLCAnYnV0dG9uQSBkb2VzIG5vdCBoYXZlIGZvY3VzIGFmdGVyIGEgYmFzaWMgZm9jdXMgY2FsbD8nICk7XHJcbiAgYnV0dG9uQi5ibHVyKCk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25BLmZvY3VzZWQsICdCbHVycmluZyBhIG5vbi1mb2N1c3NlZCBlbGVtZW50IHNob3VsZCBub3QgcmVtb3ZlIGZvY3VzIGZyb20gYSBub24tZm9jdXNlZCBlbGVtZW50JyApO1xyXG5cclxuICBhZnRlclRlc3QoIGRpc3BsYXkgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2NsaWNrJywgYXNzZXJ0ID0+IHtcclxuICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1NraXBwaW5nIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGJlZm9yZVRlc3QoIGRpc3BsYXkgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcblxyXG4gIGxldCBnb3RGb2N1cyA9IGZhbHNlO1xyXG4gIGxldCBnb3RDbGljayA9IGZhbHNlO1xyXG4gIGxldCBhQ2xpY2tDb3VudGVyID0gMDtcclxuXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuXHJcbiAgYS5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBmb2N1cygpIHtcclxuICAgICAgZ290Rm9jdXMgPSB0cnVlO1xyXG4gICAgfSxcclxuICAgIGNsaWNrKCkge1xyXG4gICAgICBnb3RDbGljayA9IHRydWU7XHJcbiAgICAgIGFDbGlja0NvdW50ZXIrKztcclxuICAgIH0sXHJcbiAgICBibHVyKCkge1xyXG4gICAgICBnb3RGb2N1cyA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcblxyXG4gIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuZm9jdXMoKTtcclxuICBhc3NlcnQub2soIGdvdEZvY3VzICYmICFnb3RDbGljaywgJ2ZvY3VzIGZpcnN0JyApO1xyXG4gIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuY2xpY2soKTsgLy8gdGhpcyB3b3JrcyBiZWNhdXNlIGl0J3MgYSBidXR0b25cclxuICBhc3NlcnQub2soIGdvdENsaWNrICYmIGdvdEZvY3VzICYmIGFDbGlja0NvdW50ZXIgPT09IDEsICdhIHNob3VsZCBoYXZlIGJlZW4gY2xpY2tlZCcgKTtcclxuXHJcbiAgbGV0IGJDbGlja0NvdW50ZXIgPSAwO1xyXG5cclxuICBjb25zdCBiID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMjAsIDIwLCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuXHJcbiAgYi5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBjbGljaygpIHtcclxuICAgICAgYkNsaWNrQ291bnRlcisrO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgYS5hZGRDaGlsZCggYiApO1xyXG5cclxuICBiLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nLmZvY3VzKCk7XHJcbiAgYi5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5jbGljaygpO1xyXG4gIGFzc2VydC5vayggYkNsaWNrQ291bnRlciA9PT0gMSAmJiBhQ2xpY2tDb3VudGVyID09PSAyLCAnYSBzaG91bGQgaGF2ZSBiZWVuIGNsaWNrZWQgd2l0aCBiJyApO1xyXG4gIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuY2xpY2soKTtcclxuICBhc3NlcnQub2soIGJDbGlja0NvdW50ZXIgPT09IDEgJiYgYUNsaWNrQ291bnRlciA9PT0gMywgJ2Igc3RpbGwgc2hvdWxkIG5vdCBoYXZlIGJlZW4gY2xpY2tlZC4nICk7XHJcblxyXG5cclxuICAvLyBjcmVhdGUgYSBub2RlXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ2J1dHRvbidcclxuICB9ICk7XHJcbiAgYS5hZGRDaGlsZCggYTEgKTtcclxuICBhc3NlcnQub2soIGExLmlucHV0TGlzdGVuZXJzLmxlbmd0aCA9PT0gMCwgJ25vIGlucHV0IGFjY2Vzc2libGUgbGlzdGVuZXJzIG9uIGluc3RhbnRpYXRpb24nICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5sYWJlbENvbnRlbnQgPT09IG51bGwsICdubyBsYWJlbCBvbiBpbnN0YW50aWF0aW9uJyApO1xyXG5cclxuICAvLyBhZGQgYSBsaXN0ZW5lclxyXG4gIGNvbnN0IGxpc3RlbmVyID0geyBjbGljaygpIHsgYTEubGFiZWxDb250ZW50ID0gVEVTVF9MQUJFTDsgfSB9O1xyXG4gIGExLmFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5pbnB1dExpc3RlbmVycy5sZW5ndGggPT09IDEsICdhY2Nlc3NpYmxlIGxpc3RlbmVyIGFkZGVkJyApO1xyXG5cclxuICAvLyB2ZXJpZnkgYWRkZWQgd2l0aCBoYXNJbnB1dExpc3RlbmVyXHJcbiAgYXNzZXJ0Lm9rKCBhMS5oYXNJbnB1dExpc3RlbmVyKCBsaXN0ZW5lciApID09PSB0cnVlLCAnZm91bmQgd2l0aCBoYXNJbnB1dExpc3RlbmVyJyApO1xyXG5cclxuICAvLyBmaXJlIHRoZSBldmVudFxyXG4gIGExLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nLmNsaWNrKCk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5sYWJlbENvbnRlbnQgPT09IFRFU1RfTEFCRUwsICdjbGljayBmaXJlZCwgbGFiZWwgc2V0JyApO1xyXG5cclxuICBjb25zdCBjID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMjAsIDIwLCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuICBjb25zdCBkID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMjAsIDIwLCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuICBjb25zdCBlID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMjAsIDIwLCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuXHJcbiAgbGV0IGNDbGlja0NvdW50ID0gMDtcclxuICBsZXQgZENsaWNrQ291bnQgPSAwO1xyXG4gIGxldCBlQ2xpY2tDb3VudCA9IDA7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBjICk7XHJcbiAgYy5hZGRDaGlsZCggZCApO1xyXG4gIGQuYWRkQ2hpbGQoIGUgKTtcclxuXHJcbiAgYy5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBjbGljaygpIHtcclxuICAgICAgY0NsaWNrQ291bnQrKztcclxuICAgIH1cclxuICB9ICk7XHJcbiAgZC5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBjbGljaygpIHtcclxuICAgICAgZENsaWNrQ291bnQrKztcclxuICAgIH1cclxuICB9ICk7XHJcbiAgZS5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBjbGljaygpIHtcclxuICAgICAgZUNsaWNrQ291bnQrKztcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuY2xpY2soKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBjQ2xpY2tDb3VudCA9PT0gZENsaWNrQ291bnQgJiYgY0NsaWNrQ291bnQgPT09IGVDbGlja0NvdW50ICYmIGNDbGlja0NvdW50ID09PSAxLFxyXG4gICAgJ2NsaWNrIHNob3VsZCBoYXZlIGJ1YmJsZWQgdG8gYWxsIHBhcmVudHMnICk7XHJcblxyXG4gIGQucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuY2xpY2soKTtcclxuXHJcblxyXG4gIGFzc2VydC5vayggY0NsaWNrQ291bnQgPT09IDIgJiYgZENsaWNrQ291bnQgPT09IDIgJiYgZUNsaWNrQ291bnQgPT09IDEsXHJcbiAgICAnZCBzaG91bGQgbm90IHRyaWdnZXIgY2xpY2sgb24gZScgKTtcclxuICBjLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nLmNsaWNrKCk7XHJcblxyXG5cclxuICBhc3NlcnQub2soIGNDbGlja0NvdW50ID09PSAzICYmIGRDbGlja0NvdW50ID09PSAyICYmIGVDbGlja0NvdW50ID09PSAxLFxyXG4gICAgJ2Mgc2hvdWxkIG5vdCB0cmlnZ2VyIGNsaWNrIG9uIGQgb3IgZScgKTtcclxuXHJcbiAgLy8gcmVzZXQgY2xpY2sgY291bnRcclxuICBjQ2xpY2tDb3VudCA9IDA7XHJcbiAgZENsaWNrQ291bnQgPSAwO1xyXG4gIGVDbGlja0NvdW50ID0gMDtcclxuXHJcbiAgYy5wZG9tT3JkZXIgPSBbIGQsIGUgXTtcclxuXHJcbiAgZS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5jbGljaygpO1xyXG4gIGFzc2VydC5vayggY0NsaWNrQ291bnQgPT09IDEgJiYgZENsaWNrQ291bnQgPT09IDAgJiYgZUNsaWNrQ291bnQgPT09IDEsXHJcbiAgICAncGRvbU9yZGVyIG1lYW5zIGNsaWNrIHNob3VsZCBieXBhc3MgZCcgKTtcclxuXHJcbiAgYy5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5jbGljaygpO1xyXG4gIGFzc2VydC5vayggY0NsaWNrQ291bnQgPT09IDIgJiYgZENsaWNrQ291bnQgPT09IDAgJiYgZUNsaWNrQ291bnQgPT09IDEsXHJcbiAgICAnY2xpY2sgYyBzaG91bGQgbm90IGVmZmVjdCBlIG9yIGQuJyApO1xyXG5cclxuICBkLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nLmNsaWNrKCk7XHJcbiAgYXNzZXJ0Lm9rKCBjQ2xpY2tDb3VudCA9PT0gMyAmJiBkQ2xpY2tDb3VudCA9PT0gMSAmJiBlQ2xpY2tDb3VudCA9PT0gMSxcclxuICAgICdjbGljayBkIHNob3VsZCBub3QgZWZmZWN0IGUuJyApO1xyXG5cclxuICAvLyByZXNldCBjbGljayBjb3VudFxyXG4gIGNDbGlja0NvdW50ID0gMDtcclxuICBkQ2xpY2tDb3VudCA9IDA7XHJcbiAgZUNsaWNrQ291bnQgPSAwO1xyXG5cclxuICBjb25zdCBmID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMjAsIDIwLCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuXHJcbiAgbGV0IGZDbGlja0NvdW50ID0gMDtcclxuICBmLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgIGNsaWNrKCkge1xyXG4gICAgICBmQ2xpY2tDb3VudCsrO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBlLmFkZENoaWxkKCBmICk7XHJcblxyXG4gIC8vIHNvIGl0cyBhIGNoYWluIGluIHRoZSBzY2VuZSBncmFwaCBjLT5kLT5lLT5mXHJcblxyXG4gIGQucGRvbU9yZGVyID0gWyBmIF07XHJcblxyXG4gIC8qIGFjY2Vzc2libGUgaW5zdGFuY2UgdHJlZTpcclxuICAgICAgIGNcclxuICAgICAgLyBcXFxyXG4gICAgICBkICBlXHJcbiAgICAgIHxcclxuICAgICAgZlxyXG4gICovXHJcblxyXG4gIGYucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuY2xpY2soKTtcclxuICBhc3NlcnQub2soIGNDbGlja0NvdW50ID09PSAxICYmIGRDbGlja0NvdW50ID09PSAxICYmIGVDbGlja0NvdW50ID09PSAwICYmIGZDbGlja0NvdW50ID09PSAxLFxyXG4gICAgJ2NsaWNrIGQgc2hvdWxkIG5vdCBlZmZlY3QgZS4nICk7XHJcblxyXG4gIGFmdGVyVGVzdCggZGlzcGxheSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnY2xpY2sgZXh0cmEnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBjcmVhdGUgYSBub2RlXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ2J1dHRvbidcclxuICB9ICk7XHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3QgKTtcclxuICBiZWZvcmVUZXN0KCBkaXNwbGF5ICk7XHJcblxyXG4gIHJvb3QuYWRkQ2hpbGQoIGExICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5pbnB1dExpc3RlbmVycy5sZW5ndGggPT09IDAsICdubyBpbnB1dCBhY2Nlc3NpYmxlIGxpc3RlbmVycyBvbiBpbnN0YW50aWF0aW9uJyApO1xyXG4gIGFzc2VydC5vayggYTEubGFiZWxDb250ZW50ID09PSBudWxsLCAnbm8gbGFiZWwgb24gaW5zdGFudGlhdGlvbicgKTtcclxuXHJcbiAgLy8gYWRkIGEgbGlzdGVuZXJcclxuICBjb25zdCBsaXN0ZW5lciA9IHsgY2xpY2s6ICgpID0+IHsgYTEubGFiZWxDb250ZW50ID0gVEVTVF9MQUJFTDsgfSB9O1xyXG4gIGExLmFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5pbnB1dExpc3RlbmVycy5sZW5ndGggPT09IDEsICdhY2Nlc3NpYmxlIGxpc3RlbmVyIGFkZGVkJyApO1xyXG5cclxuICAvLyB2ZXJpZnkgYWRkZWQgd2l0aCBoYXNJbnB1dExpc3RlbmVyXHJcbiAgYXNzZXJ0Lm9rKCBhMS5oYXNJbnB1dExpc3RlbmVyKCBsaXN0ZW5lciApID09PSB0cnVlLCAnZm91bmQgd2l0aCBoYXNJbnB1dExpc3RlbmVyJyApO1xyXG5cclxuICAvLyBmaXJlIHRoZSBldmVudFxyXG4gIGExLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLnByaW1hcnlTaWJsaW5nLmNsaWNrKCk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5sYWJlbENvbnRlbnQgPT09IFRFU1RfTEFCRUwsICdjbGljayBmaXJlZCwgbGFiZWwgc2V0JyApO1xyXG5cclxuICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyXHJcbiAgYTEucmVtb3ZlSW5wdXRMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuICBhc3NlcnQub2soIGExLmlucHV0TGlzdGVuZXJzLmxlbmd0aCA9PT0gMCwgJ2FjY2Vzc2libGUgbGlzdGVuZXIgcmVtb3ZlZCcgKTtcclxuXHJcbiAgLy8gdmVyaWZ5IHJlbW92ZWQgd2l0aCBoYXNJbnB1dExpc3RlbmVyXHJcbiAgYXNzZXJ0Lm9rKCBhMS5oYXNJbnB1dExpc3RlbmVyKCBsaXN0ZW5lciApID09PSBmYWxzZSwgJ25vdCBmb3VuZCB3aXRoIGhhc0lucHV0TGlzdGVuZXInICk7XHJcblxyXG4gIC8vIG1ha2Ugc3VyZSBldmVudCBsaXN0ZW5lciB3YXMgYWxzbyByZW1vdmVkIGZyb20gRE9NIGVsZW1lbnRcclxuICAvLyBjbGljayBzaG91bGQgbm90IGNoYW5nZSB0aGUgbGFiZWxcclxuICBhMS5sYWJlbENvbnRlbnQgPSBURVNUX0xBQkVMXzI7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5sYWJlbENvbnRlbnQgPT09IFRFU1RfTEFCRUxfMiwgJ2JlZm9yZSBjbGljaycgKTtcclxuXHJcbiAgLy8gc2V0dGluZyB0aGUgbGFiZWwgcmVkcmV3IHRoZSBwZG9tLCBzbyBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIG5ldyBkb20gZWxlbWVudC5cclxuICBhMS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5jbGljaygpO1xyXG4gIGFzc2VydC5vayggYTEubGFiZWxDb250ZW50ID09PSBURVNUX0xBQkVMXzIsICdjbGljayBzaG91bGQgbm90IGNoYW5nZSBsYWJlbCcgKTtcclxuXHJcbiAgLy8gdmVyaWZ5IGRpc3Bvc2FsIHJlbW92ZXMgYWNjZXNzaWJsZSBpbnB1dCBsaXN0ZW5lcnNcclxuICBhMS5hZGRJbnB1dExpc3RlbmVyKCBsaXN0ZW5lciApO1xyXG4gIGExLmRpc3Bvc2UoKTtcclxuXHJcbiAgLy8gVE9ETzogU2luY2UgY29udmVydGluZyB0byB1c2UgTm9kZS5pbnB1dExpc3RlbmVycywgd2UgY2FuJ3QgYXNzdW1lIHRoaXMgYW55bW9yZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gIC8vIGFzc2VydC5vayggYTEuaGFzSW5wdXRMaXN0ZW5lciggbGlzdGVuZXIgKSA9PT0gZmFsc2UsICdkaXNwb3NhbCByZW1vdmVkIGFjY2Vzc2libGUgaW5wdXQgbGlzdGVuZXJzJyApO1xyXG5cclxuICBhZnRlclRlc3QoIGRpc3BsYXkgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2lucHV0JywgYXNzZXJ0ID0+IHtcclxuICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1NraXBwaW5nIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGJlZm9yZVRlc3QoIGRpc3BsYXkgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnaW5wdXQnLCBpbnB1dFR5cGU6ICd0ZXh0JyB9ICk7XHJcblxyXG4gIGxldCBnb3RGb2N1cyA9IGZhbHNlO1xyXG4gIGxldCBnb3RJbnB1dCA9IGZhbHNlO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICBhLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgIGZvY3VzKCkge1xyXG4gICAgICBnb3RGb2N1cyA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgaW5wdXQoKSB7XHJcbiAgICAgIGdvdElucHV0ID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBibHVyKCkge1xyXG4gICAgICBnb3RGb2N1cyA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5mb2N1cygpO1xyXG4gIGFzc2VydC5vayggZ290Rm9jdXMgJiYgIWdvdElucHV0LCAnZm9jdXMgZmlyc3QnICk7XHJcblxyXG4gIGRpc3BhdGNoRXZlbnQoIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcsICdpbnB1dCcgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBnb3RJbnB1dCAmJiBnb3RGb2N1cywgJ2Egc2hvdWxkIGhhdmUgYmVlbiBhbiBpbnB1dCcgKTtcclxuXHJcbiAgYWZ0ZXJUZXN0KCBkaXNwbGF5ICk7XHJcbn0gKTtcclxuXHJcblxyXG5RVW5pdC50ZXN0KCAnY2hhbmdlJywgYXNzZXJ0ID0+IHtcclxuICBpZiAoICFjYW5SdW5UZXN0cyApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1NraXBwaW5nIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGJlZm9yZVRlc3QoIGRpc3BsYXkgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwLCAyMCwgeyB0YWdOYW1lOiAnaW5wdXQnLCBpbnB1dFR5cGU6ICdyYW5nZScgfSApO1xyXG5cclxuICBsZXQgZ290Rm9jdXMgPSBmYWxzZTtcclxuICBsZXQgZ290Q2hhbmdlID0gZmFsc2U7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcblxyXG4gIGEuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgZm9jdXMoKSB7XHJcbiAgICAgIGdvdEZvY3VzID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBjaGFuZ2UoKSB7XHJcbiAgICAgIGdvdENoYW5nZSA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgYmx1cigpIHtcclxuICAgICAgZ290Rm9jdXMgPSBmYWxzZTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcuZm9jdXMoKTtcclxuICBhc3NlcnQub2soIGdvdEZvY3VzICYmICFnb3RDaGFuZ2UsICdmb2N1cyBmaXJzdCcgKTtcclxuXHJcbiAgZGlzcGF0Y2hFdmVudCggYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZywgJ2NoYW5nZScgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBnb3RDaGFuZ2UgJiYgZ290Rm9jdXMsICdhIHNob3VsZCBoYXZlIGJlZW4gYW4gaW5wdXQnICk7XHJcblxyXG4gIGFmdGVyVGVzdCggZGlzcGxheSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAna2V5ZG93bi9rZXl1cCcsIGFzc2VydCA9PiB7XHJcbiAgaWYgKCAhY2FuUnVuVGVzdHMgKSB7XHJcbiAgICBhc3NlcnQub2soIHRydWUsICdTa2lwcGluZyB0ZXN0IGJlY2F1c2UgZG9jdW1lbnQgZG9lcyBub3QgaGF2ZSBmb2N1cycgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBiZWZvcmVUZXN0KCBkaXNwbGF5ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCAyMCwgMjAsIHsgdGFnTmFtZTogJ2lucHV0JywgaW5wdXRUeXBlOiAndGV4dCcgfSApO1xyXG5cclxuICBsZXQgZ290Rm9jdXMgPSBmYWxzZTtcclxuICBsZXQgZ290S2V5ZG93biA9IGZhbHNlO1xyXG4gIGxldCBnb3RLZXl1cCA9IGZhbHNlO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICBhLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgIGZvY3VzKCkge1xyXG4gICAgICBnb3RGb2N1cyA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAga2V5ZG93bigpIHtcclxuICAgICAgZ290S2V5ZG93biA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAga2V5dXAoKSB7XHJcbiAgICAgIGdvdEtleXVwID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBibHVyKCkge1xyXG4gICAgICBnb3RGb2N1cyA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZy5mb2N1cygpO1xyXG4gIGFzc2VydC5vayggZ290Rm9jdXMgJiYgIWdvdEtleWRvd24sICdmb2N1cyBmaXJzdCcgKTtcclxuXHJcbiAgZGlzcGF0Y2hFdmVudCggYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZywgJ2tleWRvd24nICk7XHJcblxyXG4gIGFzc2VydC5vayggZ290S2V5ZG93biAmJiBnb3RGb2N1cywgJ2Egc2hvdWxkIGhhdmUgaGFkIGtleWRvd24nICk7XHJcblxyXG4gIGRpc3BhdGNoRXZlbnQoIGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIucHJpbWFyeVNpYmxpbmcsICdrZXl1cCcgKTtcclxuICBhc3NlcnQub2soIGdvdEtleWRvd24gJiYgZ290S2V5dXAgJiYgZ290Rm9jdXMsICdhIHNob3VsZCBoYXZlIGhhZCBrZXl1cCcgKTtcclxuXHJcbiAgYWZ0ZXJUZXN0KCBkaXNwbGF5ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdHbG9iYWwgS2V5U3RhdGVUcmFja2VyIHRlc3RzJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGJlZm9yZVRlc3QoIGRpc3BsYXkgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuICBjb25zdCBiID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicgfSApO1xyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcbiAgY29uc3QgZCA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuXHJcbiAgYS5hZGRDaGlsZCggYiApO1xyXG4gIGIuYWRkQ2hpbGQoIGMgKTtcclxuICBjLmFkZENoaWxkKCBkICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuXHJcbiAgY29uc3QgZFByaW1hcnlTaWJsaW5nID0gZC5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlci5wcmltYXJ5U2libGluZztcclxuICB0cmlnZ2VyRE9NRXZlbnQoICdrZXlkb3duJywgZFByaW1hcnlTaWJsaW5nLCBLZXlib2FyZFV0aWxzLktFWV9SSUdIVF9BUlJPVywge1xyXG4gICAgZXZlbnRDb25zdHJ1Y3Rvcjogd2luZG93LktleWJvYXJkRXZlbnRcclxuICB9ICk7XHJcblxyXG4gIGFzc2VydC5vayggZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmlzS2V5RG93biggS2V5Ym9hcmRVdGlscy5LRVlfUklHSFRfQVJST1cgKSwgJ2dsb2JhbCBrZXlTdGF0ZVRyYWNrZXIgc2hvdWxkIGJlIHVwZGF0ZWQgd2l0aCByaWdodCBhcnJvdyBrZXkgZG93bicgKTtcclxuXHJcbiAgYWZ0ZXJUZXN0KCBkaXNwbGF5ICk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLE9BQU8sTUFBTSwwQkFBMEI7QUFDOUMsT0FBT0MsSUFBSSxNQUFNLHFCQUFxQjtBQUN0QyxPQUFPQyxTQUFTLE1BQU0sMEJBQTBCO0FBQ2hELE9BQU9DLHFCQUFxQixNQUFNLDZCQUE2QjtBQUMvRCxPQUFPQyxhQUFhLE1BQU0scUJBQXFCOztBQUUvQztBQUNBLE1BQU1DLFVBQVUsR0FBRyxZQUFZO0FBQy9CLE1BQU1DLFlBQVksR0FBRyxjQUFjO0FBRW5DLElBQUlDLFdBQVcsR0FBRyxJQUFJO0FBRXRCQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxXQUFXLEVBQUU7RUFDekJDLFVBQVUsRUFBRUEsQ0FBQSxLQUFNO0lBRWhCO0lBQ0E7SUFDQUgsV0FBVyxHQUFHSSxRQUFRLENBQUNDLFFBQVEsQ0FBQyxDQUFDO0lBRWpDLElBQUssQ0FBQ0wsV0FBVyxFQUFHO01BQ2xCTSxPQUFPLENBQUNDLElBQUksQ0FBRSxvRUFBcUUsQ0FBQztJQUN0RjtFQUNGO0FBQ0YsQ0FBRSxDQUFDOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsVUFBVSxHQUFHQyxPQUFPLElBQUk7RUFDNUJBLE9BQU8sQ0FBQ0MsZ0JBQWdCLENBQUMsQ0FBQztFQUMxQk4sUUFBUSxDQUFDTyxJQUFJLENBQUNDLFdBQVcsQ0FBRUgsT0FBTyxDQUFDSSxVQUFXLENBQUM7QUFDakQsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsU0FBUyxHQUFHTCxPQUFPLElBQUk7RUFDM0JMLFFBQVEsQ0FBQ08sSUFBSSxDQUFDSSxX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