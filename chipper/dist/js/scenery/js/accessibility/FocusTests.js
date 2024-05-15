// Copyright 2017-2023, University of Colorado Boulder

/**
 * Focus tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { Display, FocusManager, Node, Trail } from '../imports.js';
QUnit.module('Focus');
// Arrays of items of the type { trail: {Trail}, children: {Array.<Item>} }
function nestedEquality(assert, a, b) {
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    const aItem = a[i];
    const bItem = b[i];
    if (aItem.trail && bItem.trail) {
      assert.ok(aItem.trail.equals(bItem.trail));
    }
    nestedEquality(assert, aItem.children, bItem.children);
  }
}
QUnit.test('Simple Test', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2]
  });
  const b = new Node({
    children: [b1, b2]
  });
  const root = new Node({
    children: [a, b]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }, {
    trail: new Trail([root, b, b1]),
    children: []
  }, {
    trail: new Trail([root, b, b2]),
    children: []
  }]);
});
QUnit.test('pdomOrder Simple Test', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2]
  });
  const b = new Node({
    children: [b1, b2]
  });
  const root = new Node({
    children: [a, b],
    pdomOrder: [b, a]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, b, b1]),
    children: []
  }, {
    trail: new Trail([root, b, b2]),
    children: []
  }, {
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }]);
});
QUnit.test('pdomOrder Descendant Test', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2]
  });
  const b = new Node({
    children: [b1, b2]
  });
  const root = new Node({
    children: [a, b],
    pdomOrder: [a1, b1, a2, b2]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, b, b1]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }, {
    trail: new Trail([root, b, b2]),
    children: []
  }]);
});
QUnit.test('pdomOrder Descendant Pruning Test', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const c1 = new Node({
    tagName: 'div'
  });
  const c2 = new Node({
    tagName: 'div'
  });
  const c = new Node({
    children: [c1, c2]
  });
  const a = new Node({
    children: [a1, a2, c]
  });
  const b = new Node({
    children: [b1, b2]
  });
  const root = new Node({
    children: [a, b],
    pdomOrder: [c1, a, a2, b2]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, a, c, c1]),
    children: []
  }, {
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, a, c, c2]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }, {
    trail: new Trail([root, b, b2]),
    children: []
  }, {
    trail: new Trail([root, b, b1]),
    children: []
  }]);
});
QUnit.test('pdomOrder Descendant Override', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2]
  });
  const b = new Node({
    children: [b1, b2],
    pdomOrder: [b1, b2]
  });
  const root = new Node({
    children: [a, b],
    pdomOrder: [b, b1, a]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, b, b2]),
    children: []
  }, {
    trail: new Trail([root, b, b1]),
    children: []
  }, {
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }]);
});
QUnit.test('pdomOrder Hierarchy', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div'
  });
  const b2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2],
    pdomOrder: [a2]
  });
  const b = new Node({
    children: [b1, b2],
    pdomOrder: [b2, b1]
  });
  const root = new Node({
    children: [a, b],
    pdomOrder: [b, a]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, b, b2]),
    children: []
  }, {
    trail: new Trail([root, b, b1]),
    children: []
  }, {
    trail: new Trail([root, a, a2]),
    children: []
  }, {
    trail: new Trail([root, a, a1]),
    children: []
  }]);
});
QUnit.test('pdomOrder DAG test', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  const a2 = new Node({
    tagName: 'div'
  });
  const a = new Node({
    children: [a1, a2],
    pdomOrder: [a2, a1]
  });
  const b = new Node({
    children: [a1, a2],
    pdomOrder: [a1, a2]
  });
  const root = new Node({
    children: [a, b]
  });
  const nestedOrder = root.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [{
    trail: new Trail([root, a, a2]),
    children: []
  }, {
    trail: new Trail([root, a, a1]),
    children: []
  }, {
    trail: new Trail([root, b, a1]),
    children: []
  }, {
    trail: new Trail([root, b, a2]),
    children: []
  }]);
});
QUnit.test('pdomOrder DAG test', assert => {
  const x = new Node();
  const a = new Node();
  const b = new Node();
  const c = new Node();
  const d = new Node({
    tagName: 'div'
  });
  const e = new Node();
  const f = new Node({
    tagName: 'div'
  });
  const g = new Node({
    tagName: 'div'
  });
  const h = new Node({
    tagName: 'div'
  });
  const i = new Node({
    tagName: 'div'
  });
  const j = new Node({
    tagName: 'div'
  });
  const k = new Node({
    tagName: 'div'
  });
  const l = new Node();
  x.children = [a];
  a.children = [k, b, c];
  b.children = [d, e];
  c.children = [e];
  e.children = [j, f, g];
  f.children = [h, i];
  x.pdomOrder = [f, c, d, l];
  a.pdomOrder = [c, b];
  e.pdomOrder = [g, f, j];
  const nestedOrder = x.getNestedPDOMOrder();
  nestedEquality(assert, nestedOrder, [
  // x order's F
  {
    trail: new Trail([x, a, b, e, f]),
    children: [{
      trail: new Trail([x, a, b, e, f, h]),
      children: []
    }, {
      trail: new Trail([x, a, b, e, f, i]),
      children: []
    }]
  }, {
    trail: new Trail([x, a, c, e, f]),
    children: [{
      trail: new Trail([x, a, c, e, f, h]),
      children: []
    }, {
      trail: new Trail([x, a, c, e, f, i]),
      children: []
    }]
  },
  // X order's C
  {
    trail: new Trail([x, a, c, e, g]),
    children: []
  }, {
    trail: new Trail([x, a, c, e, j]),
    children: []
  },
  // X order's D
  {
    trail: new Trail([x, a, b, d]),
    children: []
  },
  // X everything else
  {
    trail: new Trail([x, a, b, e, g]),
    children: []
  }, {
    trail: new Trail([x, a, b, e, j]),
    children: []
  }, {
    trail: new Trail([x, a, k]),
    children: []
  }]);
});
QUnit.test('setting pdomOrder', assert => {
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div'
  });
  const b = new Node({
    tagName: 'div'
  });
  const c = new Node({
    tagName: 'div'
  });
  const d = new Node({
    tagName: 'div'
  });
  rootNode.children = [a, b, c, d];

  // reverse accessible order
  rootNode.pdomOrder = [d, c, b, a];
  assert.ok(display._rootPDOMInstance, 'should exist');
  const divRoot = display._rootPDOMInstance.peer.primarySibling;
  const divA = a.pdomInstances[0].peer.primarySibling;
  const divB = b.pdomInstances[0].peer.primarySibling;
  const divC = c.pdomInstances[0].peer.primarySibling;
  const divD = d.pdomInstances[0].peer.primarySibling;
  assert.ok(divRoot.children[0] === divD, 'divD should be first child');
  assert.ok(divRoot.children[1] === divC, 'divC should be second child');
  assert.ok(divRoot.children[2] === divB, 'divB should be third child');
  assert.ok(divRoot.children[3] === divA, 'divA should be fourth child');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('setting pdomOrder before setting accessible content', assert => {
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const a = new Node();
  const b = new Node();
  const c = new Node();
  const d = new Node();
  rootNode.children = [a, b, c, d];

  // reverse accessible order
  rootNode.pdomOrder = [d, c, b, a];
  a.tagName = 'div';
  b.tagName = 'div';
  c.tagName = 'div';
  d.tagName = 'div';
  const divRoot = display._rootPDOMInstance.peer.primarySibling;
  const divA = a.pdomInstances[0].peer.primarySibling;
  const divB = b.pdomInstances[0].peer.primarySibling;
  const divC = c.pdomInstances[0].peer.primarySibling;
  const divD = d.pdomInstances[0].peer.primarySibling;
  assert.ok(divRoot.children[0] === divD, 'divD should be first child');
  assert.ok(divRoot.children[1] === divC, 'divC should be second child');
  assert.ok(divRoot.children[2] === divB, 'divB should be third child');
  assert.ok(divRoot.children[3] === divA, 'divA should be fourth child');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('setting accessible order on nodes with no accessible content', assert => {
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // root
  //    a
  //      b
  //     c   e
  //        d  f

  const a = new Node({
    tagName: 'div'
  });
  const b = new Node({
    tagName: 'div'
  });
  const c = new Node({
    tagName: 'div'
  });
  const d = new Node({
    tagName: 'div'
  });
  const e = new Node({
    tagName: 'div'
  });
  const f = new Node({
    tagName: 'div'
  });
  rootNode.addChild(a);
  a.addChild(b);
  b.addChild(c);
  b.addChild(e);
  c.addChild(d);
  c.addChild(f);
  b.pdomOrder = [e, c];
  const divB = b.pdomInstances[0].peer.primarySibling;
  const divC = c.pdomInstances[0].peer.primarySibling;
  const divE = e.pdomInstances[0].peer.primarySibling;
  assert.ok(divB.children[0] === divE, 'div E should be first child of div B');
  assert.ok(divB.children[1] === divC, 'div C should be second child of div B');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('setting accessible order on nodes with no accessible content', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div'
  });
  const b = new Node();
  const c = new Node({
    tagName: 'div'
  });
  const d = new Node({
    tagName: 'div'
  });
  const e = new Node({
    tagName: 'div'
  });
  const f = new Node({
    tagName: 'div'
  });
  rootNode.addChild(a);
  a.addChild(b);
  b.addChild(c);
  b.addChild(e);
  c.addChild(d);
  c.addChild(f);
  a.pdomOrder = [e, c];
  const divA = a.pdomInstances[0].peer.primarySibling;
  const divC = c.pdomInstances[0].peer.primarySibling;
  const divE = e.pdomInstances[0].peer.primarySibling;
  assert.ok(divA.children[0] === divE, 'div E should be first child of div B');
  assert.ok(divA.children[1] === divC, 'div C should be second child of div B');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('setting accessible order on a Node with focus', assert => {
  if (!document.hasFocus()) {
    assert.ok(true, 'Opting out of test because document does not have focus');
    return;
  }
  const rootNode = new Node();
  const display = new Display(rootNode);
  display.initializeEvents();
  document.body.appendChild(display.domElement);
  const a1 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'div',
    focusable: true
  });
  const c1 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d1 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d2 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d3 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d4 = new Node({
    tagName: 'div',
    focusable: true
  });

  // a scene graph where d nodes are children of b, but will be moved under c in the pdomOrder
  rootNode.addChild(a1);
  a1.children = [b1, c1];
  b1.children = [d1, d2, d3, d4];
  d1.focus();
  assert.ok(d1.focused, 'd1 should be focused');
  b1.pdomOrder = [d3, d4];
  assert.ok(d1.focused, 'd1 should still have focus after order change');
  b1.pdomOrder = null;
  c1.pdomOrder = [d4, d3, d2, d1];
  assert.ok(d1.focused, 'd1 should still have focus after order change');
  c1.pdomOrder = null;
  a1.pdomOrder = [d1, d2, d3];
  assert.ok(d1.focused, 'd1 should still have focus after order change');
  display.detachEvents();
});
QUnit.test('pdomOrder with reentrant events', assert => {
  if (!document.hasFocus()) {
    assert.ok(true, 'Opting out of test because document does not have focus');
    return;
  }
  const rootNode = new Node();
  const display = new Display(rootNode);
  display.initializeEvents();
  document.body.appendChild(display.domElement);
  const a1 = new Node({
    tagName: 'div'
  });
  const b1 = new Node({
    tagName: 'button',
    focusable: true
  });
  const c1 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d1 = new Node({
    tagName: 'div',
    focusable: true
  });
  const d2 = new Node({
    tagName: 'div',
    focusable: true
  });
  const getDOMElement = node => node.pdomInstances[0].peer.primarySibling;
  rootNode.addChild(a1);
  a1.children = [b1, c1];
  b1.children = [d1];
  b1.addInputListener({
    click: event => {
      // focus another thing, inside of the click listener - generates reentrant events
      d1.focus();
      assert.ok(d1.focused, 'd1 should have focus even though focus was set in a reentrant event');
      assert.ok(FocusManager.pdomFocusedNode === d1, 'pdomFocusedNode should be correct during reentrant events');
      assert.ok(document.activeElement === getDOMElement(d1), 'activeElement should be correct during reentrant events');

      // change the trail to the Node
      a1.pdomOrder = [d1, d2, null];

      // verify that focus is still correct after PDOM rearrangement
      assert.ok(d1.focused, 'd1 should still trail change operations in reentrant events');
    }
  });

  // Focus the button and trigger a click
  b1.focus();
  getDOMElement(b1).click();
  assert.ok(true, 'dummy test that should run after click events');
  b1.blur();
  display.detachEvents();
});
QUnit.test('Testing FocusManager.windowHasFocusProperty', assert => {
  // detach the FocusManager first just in case it was attached by a previous test
  FocusManager.detachFromWindow();
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const focusableNode = new Node({
    tagName: 'button'
  });
  rootNode.addChild(focusableNode);
  assert.ok(!FocusManager.windowHasFocusProperty.value, 'should not have focus at start');

  // First, test detachFromWindow, once focus is in the window it is impossible to remove it from
  // the window with JavaScript.
  FocusManager.attachToWindow();
  FocusManager.detachFromWindow();
  assert.ok(!FocusManager.windowHasFocusProperty.value, 'should not have focus after detaching');
  focusableNode.focus();
  assert.ok(!FocusManager.windowHasFocusProperty.value, 'Should not be watching window focus changes after detaching');

  // now test changes to windowHasFocusProperty - window focus listeners will only work if tests are being run
  // in the foreground (dev cannot be using dev tools, running in puppeteer, minimized, etc...)
  if (document.hasFocus()) {
    FocusManager.attachToWindow();
    assert.ok(FocusManager.windowHasFocusProperty.value, 'Focus was moved into window from previous tests, this attach should reflect window already has focus.');
    focusableNode.focus();
    assert.ok(FocusManager.windowHasFocusProperty.value, 'Window has focus, is now in the foreground');
    focusableNode.blur();
    assert.ok(FocusManager.windowHasFocusProperty.value, 'window still has focus after a blur (focus on body)');

    // NOTE - don't detach the FocusManager here, it is globally attached and it needs to beused
    // for other tests
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaXNwbGF5IiwiRm9jdXNNYW5hZ2VyIiwiTm9kZSIsIlRyYWlsIiwiUVVuaXQiLCJtb2R1bGUiLCJuZXN0ZWRFcXVhbGl0eSIsImFzc2VydCIsImEiLCJiIiwiZXF1YWwiLCJsZW5ndGgiLCJpIiwiYUl0ZW0iLCJiSXRlbSIsInRyYWlsIiwib2siLCJlcXVhbHMiLCJjaGlsZHJlbiIsInRlc3QiLCJhMSIsInRhZ05hbWUiLCJhMiIsImIxIiwiYjIiLCJyb290IiwibmVzdGVkT3JkZXIiLCJnZXROZXN0ZWRQRE9NT3JkZXIiLCJwZG9tT3JkZXIiLCJjMSIsImMyIiwiYyIsIngiLCJkIiwiZSIsImYiLCJnIiwiaCIsImoiLCJrIiwibCIsInJvb3ROb2RlIiwiZGlzcGxheSIsImRvY3VtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwiZG9tRWxlbWVudCIsIl9yb290UERPTUluc3RhbmNlIiwiZGl2Um9vdCIsInBlZXIiLCJwcmltYXJ5U2libGluZyIsImRpdkEiLCJwZG9tSW5zdGFuY2VzIiwiZGl2QiIsImRpdkMiLCJkaXZEIiwiZGlzcG9zZSIsInBhcmVudEVsZW1lbnQiLCJyZW1vdmVDaGlsZCIsImFkZENoaWxkIiwiZGl2RSIsImhhc0ZvY3VzIiwiaW5pdGlhbGl6ZUV2ZW50cyIsImZvY3VzYWJsZSIsImQxIiwiZDIiLCJkMyIsImQ0IiwiZm9jdXMiLCJmb2N1c2VkIiwiZGV0YWNoRXZlbnRzIiwiZ2V0RE9NRWxlbWVudCIsIm5vZGUiLCJhZGRJbnB1dExpc3RlbmVyIiwiY2xpY2siLCJldmVudCIsInBkb21Gb2N1c2VkTm9kZSIsImFjdGl2ZUVsZW1lbnQiLCJibHVyIiwiZGV0YWNoRnJvbVdpbmRvdyIsImZvY3VzYWJsZU5vZGUiLCJ3aW5kb3dIYXNGb2N1c1Byb3BlcnR5IiwidmFsdWUiLCJhdHRhY2hUb1dpbmRvdyJdLCJzb3VyY2VzIjpbIkZvY3VzVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRm9jdXMgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBEaXNwbGF5LCBGb2N1c01hbmFnZXIsIE5vZGUsIFRyYWlsIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdGb2N1cycgKTtcclxuXHJcbnR5cGUgRXF1YWxpdHlJdGVtID0ge1xyXG4gIHRyYWlsPzogVHJhaWw7XHJcbiAgY2hpbGRyZW46IE5vZGVbXTtcclxufTtcclxuXHJcbnR5cGUgTmVzdGVkRXF1YWxpdHlJdGVtID0ge1xyXG4gIHRyYWlsPzogVHJhaWw7XHJcbiAgY2hpbGRyZW46IE5lc3RlZEVxdWFsaXR5SXRlbVtdO1xyXG59O1xyXG5cclxuLy8gQXJyYXlzIG9mIGl0ZW1zIG9mIHRoZSB0eXBlIHsgdHJhaWw6IHtUcmFpbH0sIGNoaWxkcmVuOiB7QXJyYXkuPEl0ZW0+fSB9XHJcbmZ1bmN0aW9uIG5lc3RlZEVxdWFsaXR5KCBhc3NlcnQ6IEFzc2VydCwgYTogRXF1YWxpdHlJdGVtW10sIGI6IE5lc3RlZEVxdWFsaXR5SXRlbVtdICk6IHZvaWQge1xyXG4gIGFzc2VydC5lcXVhbCggYS5sZW5ndGgsIGIubGVuZ3RoICk7XHJcblxyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBjb25zdCBhSXRlbSA9IGFbIGkgXTtcclxuICAgIGNvbnN0IGJJdGVtID0gYlsgaSBdO1xyXG5cclxuICAgIGlmICggYUl0ZW0udHJhaWwgJiYgYkl0ZW0udHJhaWwgKSB7XHJcbiAgICAgIGFzc2VydC5vayggYUl0ZW0udHJhaWwuZXF1YWxzKCBiSXRlbS50cmFpbCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgbmVzdGVkRXF1YWxpdHkoIGFzc2VydCwgYUl0ZW0uY2hpbGRyZW4sIGJJdGVtLmNoaWxkcmVuICk7XHJcbiAgfVxyXG59XHJcblxyXG5RVW5pdC50ZXN0KCAnU2ltcGxlIFRlc3QnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBhMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBhMiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuXHJcbiAgY29uc3QgYjEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYjIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhMSwgYTIgXSB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGIxLCBiMiBdIH0gKTtcclxuXHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEsIGIgXSB9ICk7XHJcblxyXG4gIGNvbnN0IG5lc3RlZE9yZGVyID0gcm9vdC5nZXROZXN0ZWRQRE9NT3JkZXIoKTtcclxuXHJcbiAgbmVzdGVkRXF1YWxpdHkoIGFzc2VydCwgbmVzdGVkT3JkZXIsIFtcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBhLCBhMSBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGEsIGEyIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYjEgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBiLCBiMiBdICksIGNoaWxkcmVuOiBbXSB9XHJcbiAgXSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAncGRvbU9yZGVyIFNpbXBsZSBUZXN0JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYTIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGIxID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGIyID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgYTEsIGEyIF0gfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBiMSwgYjIgXSB9ICk7XHJcblxyXG4gIGNvbnN0IHJvb3QgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhLCBiIF0sIHBkb21PcmRlcjogWyBiLCBhIF0gfSApO1xyXG5cclxuICBjb25zdCBuZXN0ZWRPcmRlciA9IHJvb3QuZ2V0TmVzdGVkUERPTU9yZGVyKCk7XHJcblxyXG4gIG5lc3RlZEVxdWFsaXR5KCBhc3NlcnQsIG5lc3RlZE9yZGVyLCBbXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYjEgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBiLCBiMiBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGEsIGExIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYTIgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciBEZXNjZW5kYW50IFRlc3QnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBhMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBhMiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuXHJcbiAgY29uc3QgYjEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYjIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhMSwgYTIgXSB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGIxLCBiMiBdIH0gKTtcclxuXHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEsIGIgXSwgcGRvbU9yZGVyOiBbIGExLCBiMSwgYTIsIGIyIF0gfSApO1xyXG5cclxuICBjb25zdCBuZXN0ZWRPcmRlciA9IHJvb3QuZ2V0TmVzdGVkUERPTU9yZGVyKCk7XHJcblxyXG4gIG5lc3RlZEVxdWFsaXR5KCBhc3NlcnQsIG5lc3RlZE9yZGVyLCBbXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYTEgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBiLCBiMSBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGEsIGEyIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYjIgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciBEZXNjZW5kYW50IFBydW5pbmcgVGVzdCcsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IGExID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGEyID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG5cclxuICBjb25zdCBiMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBiMiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuXHJcbiAgY29uc3QgYzEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYzIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBjMSwgYzIgXSB9ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhMSwgYTIsIGMgXSB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGIxLCBiMiBdIH0gKTtcclxuXHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEsIGIgXSwgcGRvbU9yZGVyOiBbIGMxLCBhLCBhMiwgYjIgXSB9ICk7XHJcblxyXG4gIGNvbnN0IG5lc3RlZE9yZGVyID0gcm9vdC5nZXROZXN0ZWRQRE9NT3JkZXIoKTtcclxuXHJcbiAgbmVzdGVkRXF1YWxpdHkoIGFzc2VydCwgbmVzdGVkT3JkZXIsIFtcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBhLCBjLCBjMSBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGEsIGExIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYywgYzIgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBhLCBhMiBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGIsIGIyIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYjEgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciBEZXNjZW5kYW50IE92ZXJyaWRlJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYTIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGIxID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGIyID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgYTEsIGEyIF0gfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBiMSwgYjIgXSwgcGRvbU9yZGVyOiBbIGIxLCBiMiBdIH0gKTtcclxuXHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEsIGIgXSwgcGRvbU9yZGVyOiBbIGIsIGIxLCBhIF0gfSApO1xyXG5cclxuICBjb25zdCBuZXN0ZWRPcmRlciA9IHJvb3QuZ2V0TmVzdGVkUERPTU9yZGVyKCk7XHJcblxyXG4gIG5lc3RlZEVxdWFsaXR5KCBhc3NlcnQsIG5lc3RlZE9yZGVyLCBbXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYjIgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBiLCBiMSBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGEsIGExIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYTIgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciBIaWVyYXJjaHknLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBhMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBhMiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuXHJcbiAgY29uc3QgYjEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYjIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhMSwgYTIgXSwgcGRvbU9yZGVyOiBbIGEyIF0gfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBiMSwgYjIgXSwgcGRvbU9yZGVyOiBbIGIyLCBiMSBdIH0gKTtcclxuXHJcbiAgY29uc3Qgcm9vdCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEsIGIgXSwgcGRvbU9yZGVyOiBbIGIsIGEgXSB9ICk7XHJcblxyXG4gIGNvbnN0IG5lc3RlZE9yZGVyID0gcm9vdC5nZXROZXN0ZWRQRE9NT3JkZXIoKTtcclxuXHJcbiAgbmVzdGVkRXF1YWxpdHkoIGFzc2VydCwgbmVzdGVkT3JkZXIsIFtcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBiLCBiMiBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGIsIGIxIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYTIgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBhLCBhMSBdICksIGNoaWxkcmVuOiBbXSB9XHJcbiAgXSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAncGRvbU9yZGVyIERBRyB0ZXN0JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYTIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhMSwgYTIgXSwgcGRvbU9yZGVyOiBbIGEyLCBhMSBdIH0gKTtcclxuICBjb25zdCBiID0gbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgYTEsIGEyIF0sIHBkb21PcmRlcjogWyBhMSwgYTIgXSB9ICk7XHJcblxyXG4gIGNvbnN0IHJvb3QgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhLCBiIF0gfSApO1xyXG5cclxuICBjb25zdCBuZXN0ZWRPcmRlciA9IHJvb3QuZ2V0TmVzdGVkUERPTU9yZGVyKCk7XHJcblxyXG4gIG5lc3RlZEVxdWFsaXR5KCBhc3NlcnQsIG5lc3RlZE9yZGVyLCBbXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYSwgYTIgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyByb290LCBhLCBhMSBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHJvb3QsIGIsIGExIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgcm9vdCwgYiwgYTIgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciBEQUcgdGVzdCcsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IHggPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBnID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGggPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgaSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBqID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGsgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgbCA9IG5ldyBOb2RlKCk7XHJcblxyXG4gIHguY2hpbGRyZW4gPSBbIGEgXTtcclxuICBhLmNoaWxkcmVuID0gWyBrLCBiLCBjIF07XHJcbiAgYi5jaGlsZHJlbiA9IFsgZCwgZSBdO1xyXG4gIGMuY2hpbGRyZW4gPSBbIGUgXTtcclxuICBlLmNoaWxkcmVuID0gWyBqLCBmLCBnIF07XHJcbiAgZi5jaGlsZHJlbiA9IFsgaCwgaSBdO1xyXG5cclxuICB4LnBkb21PcmRlciA9IFsgZiwgYywgZCwgbCBdO1xyXG4gIGEucGRvbU9yZGVyID0gWyBjLCBiIF07XHJcbiAgZS5wZG9tT3JkZXIgPSBbIGcsIGYsIGogXTtcclxuXHJcbiAgY29uc3QgbmVzdGVkT3JkZXIgPSB4LmdldE5lc3RlZFBET01PcmRlcigpO1xyXG5cclxuICBuZXN0ZWRFcXVhbGl0eSggYXNzZXJ0LCBuZXN0ZWRPcmRlciwgW1xyXG4gICAgLy8geCBvcmRlcidzIEZcclxuICAgIHtcclxuICAgICAgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBiLCBlLCBmIF0gKSwgY2hpbGRyZW46IFtcclxuICAgICAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgeCwgYSwgYiwgZSwgZiwgaCBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBiLCBlLCBmLCBpIF0gKSwgY2hpbGRyZW46IFtdIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBjLCBlLCBmIF0gKSwgY2hpbGRyZW46IFtcclxuICAgICAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgeCwgYSwgYywgZSwgZiwgaCBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBjLCBlLCBmLCBpIF0gKSwgY2hpbGRyZW46IFtdIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBYIG9yZGVyJ3MgQ1xyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHgsIGEsIGMsIGUsIGcgXSApLCBjaGlsZHJlbjogW10gfSxcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBjLCBlLCBqIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcblxyXG4gICAgLy8gWCBvcmRlcidzIERcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBiLCBkIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcblxyXG4gICAgLy8gWCBldmVyeXRoaW5nIGVsc2VcclxuICAgIHsgdHJhaWw6IG5ldyBUcmFpbCggWyB4LCBhLCBiLCBlLCBnIF0gKSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICB7IHRyYWlsOiBuZXcgVHJhaWwoIFsgeCwgYSwgYiwgZSwgaiBdICksIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgeyB0cmFpbDogbmV3IFRyYWlsKCBbIHgsIGEsIGsgXSApLCBjaGlsZHJlbjogW10gfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3NldHRpbmcgcGRvbU9yZGVyJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBjID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgcm9vdE5vZGUuY2hpbGRyZW4gPSBbIGEsIGIsIGMsIGQgXTtcclxuXHJcbiAgLy8gcmV2ZXJzZSBhY2Nlc3NpYmxlIG9yZGVyXHJcbiAgcm9vdE5vZGUucGRvbU9yZGVyID0gWyBkLCBjLCBiLCBhIF07XHJcblxyXG4gIGFzc2VydC5vayggZGlzcGxheS5fcm9vdFBET01JbnN0YW5jZSwgJ3Nob3VsZCBleGlzdCcgKTtcclxuXHJcbiAgY29uc3QgZGl2Um9vdCA9IGRpc3BsYXkuX3Jvb3RQRE9NSW5zdGFuY2UhLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICBjb25zdCBkaXZBID0gYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmc7XHJcbiAgY29uc3QgZGl2QiA9IGIucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nO1xyXG4gIGNvbnN0IGRpdkMgPSBjLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZztcclxuICBjb25zdCBkaXZEID0gZC5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmc7XHJcblxyXG4gIGFzc2VydC5vayggZGl2Um9vdC5jaGlsZHJlblsgMCBdID09PSBkaXZELCAnZGl2RCBzaG91bGQgYmUgZmlyc3QgY2hpbGQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBkaXZSb290LmNoaWxkcmVuWyAxIF0gPT09IGRpdkMsICdkaXZDIHNob3VsZCBiZSBzZWNvbmQgY2hpbGQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBkaXZSb290LmNoaWxkcmVuWyAyIF0gPT09IGRpdkIsICdkaXZCIHNob3VsZCBiZSB0aGlyZCBjaGlsZCcgKTtcclxuICBhc3NlcnQub2soIGRpdlJvb3QuY2hpbGRyZW5bIDMgXSA9PT0gZGl2QSwgJ2RpdkEgc2hvdWxkIGJlIGZvdXJ0aCBjaGlsZCcgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnc2V0dGluZyBwZG9tT3JkZXIgYmVmb3JlIHNldHRpbmcgYWNjZXNzaWJsZSBjb250ZW50JywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgYyA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZCA9IG5ldyBOb2RlKCk7XHJcbiAgcm9vdE5vZGUuY2hpbGRyZW4gPSBbIGEsIGIsIGMsIGQgXTtcclxuXHJcbiAgLy8gcmV2ZXJzZSBhY2Nlc3NpYmxlIG9yZGVyXHJcbiAgcm9vdE5vZGUucGRvbU9yZGVyID0gWyBkLCBjLCBiLCBhIF07XHJcblxyXG4gIGEudGFnTmFtZSA9ICdkaXYnO1xyXG4gIGIudGFnTmFtZSA9ICdkaXYnO1xyXG4gIGMudGFnTmFtZSA9ICdkaXYnO1xyXG4gIGQudGFnTmFtZSA9ICdkaXYnO1xyXG5cclxuICBjb25zdCBkaXZSb290ID0gZGlzcGxheS5fcm9vdFBET01JbnN0YW5jZSEucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGNvbnN0IGRpdkEgPSBhLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZztcclxuICBjb25zdCBkaXZCID0gYi5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmc7XHJcbiAgY29uc3QgZGl2QyA9IGMucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nO1xyXG4gIGNvbnN0IGRpdkQgPSBkLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZztcclxuXHJcbiAgYXNzZXJ0Lm9rKCBkaXZSb290LmNoaWxkcmVuWyAwIF0gPT09IGRpdkQsICdkaXZEIHNob3VsZCBiZSBmaXJzdCBjaGlsZCcgKTtcclxuICBhc3NlcnQub2soIGRpdlJvb3QuY2hpbGRyZW5bIDEgXSA9PT0gZGl2QywgJ2RpdkMgc2hvdWxkIGJlIHNlY29uZCBjaGlsZCcgKTtcclxuICBhc3NlcnQub2soIGRpdlJvb3QuY2hpbGRyZW5bIDIgXSA9PT0gZGl2QiwgJ2RpdkIgc2hvdWxkIGJlIHRoaXJkIGNoaWxkJyApO1xyXG4gIGFzc2VydC5vayggZGl2Um9vdC5jaGlsZHJlblsgMyBdID09PSBkaXZBLCAnZGl2QSBzaG91bGQgYmUgZm91cnRoIGNoaWxkJyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnc2V0dGluZyBhY2Nlc3NpYmxlIG9yZGVyIG9uIG5vZGVzIHdpdGggbm8gYWNjZXNzaWJsZSBjb250ZW50JywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8gcm9vdFxyXG4gIC8vICAgIGFcclxuICAvLyAgICAgIGJcclxuICAvLyAgICAgYyAgIGVcclxuICAvLyAgICAgICAgZCAgZlxyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYyA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBkID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG4gIGEuYWRkQ2hpbGQoIGIgKTtcclxuICBiLmFkZENoaWxkKCBjICk7XHJcbiAgYi5hZGRDaGlsZCggZSApO1xyXG4gIGMuYWRkQ2hpbGQoIGQgKTtcclxuICBjLmFkZENoaWxkKCBmICk7XHJcbiAgYi5wZG9tT3JkZXIgPSBbIGUsIGMgXTtcclxuXHJcbiAgY29uc3QgZGl2QiA9IGIucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICBjb25zdCBkaXZDID0gYy5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGNvbnN0IGRpdkUgPSBlLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcblxyXG4gIGFzc2VydC5vayggZGl2Qi5jaGlsZHJlblsgMCBdID09PSBkaXZFLCAnZGl2IEUgc2hvdWxkIGJlIGZpcnN0IGNoaWxkIG9mIGRpdiBCJyApO1xyXG4gIGFzc2VydC5vayggZGl2Qi5jaGlsZHJlblsgMSBdID09PSBkaXZDLCAnZGl2IEMgc2hvdWxkIGJlIHNlY29uZCBjaGlsZCBvZiBkaXYgQicgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3NldHRpbmcgYWNjZXNzaWJsZSBvcmRlciBvbiBub2RlcyB3aXRoIG5vIGFjY2Vzc2libGUgY29udGVudCcsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBiID0gbmV3IE5vZGUoKTtcclxuICBjb25zdCBjID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBmID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgYS5hZGRDaGlsZCggYiApO1xyXG4gIGIuYWRkQ2hpbGQoIGMgKTtcclxuICBiLmFkZENoaWxkKCBlICk7XHJcbiAgYy5hZGRDaGlsZCggZCApO1xyXG4gIGMuYWRkQ2hpbGQoIGYgKTtcclxuICBhLnBkb21PcmRlciA9IFsgZSwgYyBdO1xyXG5cclxuICBjb25zdCBkaXZBID0gYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGNvbnN0IGRpdkMgPSBjLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcbiAgY29uc3QgZGl2RSA9IGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBkaXZBLmNoaWxkcmVuWyAwIF0gPT09IGRpdkUsICdkaXYgRSBzaG91bGQgYmUgZmlyc3QgY2hpbGQgb2YgZGl2IEInICk7XHJcbiAgYXNzZXJ0Lm9rKCBkaXZBLmNoaWxkcmVuWyAxIF0gPT09IGRpdkMsICdkaXYgQyBzaG91bGQgYmUgc2Vjb25kIGNoaWxkIG9mIGRpdiBCJyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdzZXR0aW5nIGFjY2Vzc2libGUgb3JkZXIgb24gYSBOb2RlIHdpdGggZm9jdXMnLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggIWRvY3VtZW50Lmhhc0ZvY3VzKCkgKSB7XHJcbiAgICBhc3NlcnQub2soIHRydWUsICdPcHRpbmcgb3V0IG9mIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkaXNwbGF5LmluaXRpYWxpemVFdmVudHMoKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYjEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlIH0gKTtcclxuICBjb25zdCBjMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gIGNvbnN0IGQxID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcbiAgY29uc3QgZDIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlIH0gKTtcclxuICBjb25zdCBkMyA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gIGNvbnN0IGQ0ID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcblxyXG4gIC8vIGEgc2NlbmUgZ3JhcGggd2hlcmUgZCBub2RlcyBhcmUgY2hpbGRyZW4gb2YgYiwgYnV0IHdpbGwgYmUgbW92ZWQgdW5kZXIgYyBpbiB0aGUgcGRvbU9yZGVyXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGExICk7XHJcbiAgYTEuY2hpbGRyZW4gPSBbIGIxLCBjMSBdO1xyXG4gIGIxLmNoaWxkcmVuID0gWyBkMSwgZDIsIGQzLCBkNCBdO1xyXG5cclxuICBkMS5mb2N1cygpO1xyXG4gIGFzc2VydC5vayggZDEuZm9jdXNlZCwgJ2QxIHNob3VsZCBiZSBmb2N1c2VkJyApO1xyXG5cclxuICBiMS5wZG9tT3JkZXIgPSBbIGQzLCBkNCBdO1xyXG4gIGFzc2VydC5vayggZDEuZm9jdXNlZCwgJ2QxIHNob3VsZCBzdGlsbCBoYXZlIGZvY3VzIGFmdGVyIG9yZGVyIGNoYW5nZScgKTtcclxuICBiMS5wZG9tT3JkZXIgPSBudWxsO1xyXG5cclxuICBjMS5wZG9tT3JkZXIgPSBbIGQ0LCBkMywgZDIsIGQxIF07XHJcbiAgYXNzZXJ0Lm9rKCBkMS5mb2N1c2VkLCAnZDEgc2hvdWxkIHN0aWxsIGhhdmUgZm9jdXMgYWZ0ZXIgb3JkZXIgY2hhbmdlJyApO1xyXG4gIGMxLnBkb21PcmRlciA9IG51bGw7XHJcblxyXG4gIGExLnBkb21PcmRlciA9IFsgZDEsIGQyLCBkMyBdO1xyXG4gIGFzc2VydC5vayggZDEuZm9jdXNlZCwgJ2QxIHNob3VsZCBzdGlsbCBoYXZlIGZvY3VzIGFmdGVyIG9yZGVyIGNoYW5nZScgKTtcclxuXHJcbiAgZGlzcGxheS5kZXRhY2hFdmVudHMoKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Bkb21PcmRlciB3aXRoIHJlZW50cmFudCBldmVudHMnLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggIWRvY3VtZW50Lmhhc0ZvY3VzKCkgKSB7XHJcbiAgICBhc3NlcnQub2soIHRydWUsICdPcHRpbmcgb3V0IG9mIHRlc3QgYmVjYXVzZSBkb2N1bWVudCBkb2VzIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkaXNwbGF5LmluaXRpYWxpemVFdmVudHMoKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYjEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJywgZm9jdXNhYmxlOiB0cnVlIH0gKTtcclxuICBjb25zdCBjMSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gIGNvbnN0IGQxID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcbiAgY29uc3QgZDIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlIH0gKTtcclxuXHJcbiAgY29uc3QgZ2V0RE9NRWxlbWVudCA9ICggbm9kZTogTm9kZSApID0+IG5vZGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGExICk7XHJcbiAgYTEuY2hpbGRyZW4gPSBbIGIxLCBjMSBdO1xyXG4gIGIxLmNoaWxkcmVuID0gWyBkMSBdO1xyXG5cclxuICBiMS5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICBjbGljazogZXZlbnQgPT4ge1xyXG5cclxuICAgICAgLy8gZm9jdXMgYW5vdGhlciB0aGluZywgaW5zaWRlIG9mIHRoZSBjbGljayBsaXN0ZW5lciAtIGdlbmVyYXRlcyByZWVudHJhbnQgZXZlbnRzXHJcbiAgICAgIGQxLmZvY3VzKCk7XHJcblxyXG4gICAgICBhc3NlcnQub2soIGQxLmZvY3VzZWQsICdkMSBzaG91bGQgaGF2ZSBmb2N1cyBldmVuIHRob3VnaCBmb2N1cyB3YXMgc2V0IGluIGEgcmVlbnRyYW50IGV2ZW50JyApO1xyXG4gICAgICBhc3NlcnQub2soIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNlZE5vZGUgPT09IGQxLCAncGRvbUZvY3VzZWROb2RlIHNob3VsZCBiZSBjb3JyZWN0IGR1cmluZyByZWVudHJhbnQgZXZlbnRzJyApO1xyXG4gICAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGdldERPTUVsZW1lbnQoIGQxICksICdhY3RpdmVFbGVtZW50IHNob3VsZCBiZSBjb3JyZWN0IGR1cmluZyByZWVudHJhbnQgZXZlbnRzJyApO1xyXG5cclxuICAgICAgLy8gY2hhbmdlIHRoZSB0cmFpbCB0byB0aGUgTm9kZVxyXG4gICAgICBhMS5wZG9tT3JkZXIgPSBbIGQxLCBkMiwgbnVsbCBdO1xyXG5cclxuICAgICAgLy8gdmVyaWZ5IHRoYXQgZm9jdXMgaXMgc3RpbGwgY29ycmVjdCBhZnRlciBQRE9NIHJlYXJyYW5nZW1lbnRcclxuICAgICAgYXNzZXJ0Lm9rKCBkMS5mb2N1c2VkLCAnZDEgc2hvdWxkIHN0aWxsIHRyYWlsIGNoYW5nZSBvcGVyYXRpb25zIGluIHJlZW50cmFudCBldmVudHMnICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBGb2N1cyB0aGUgYnV0dG9uIGFuZCB0cmlnZ2VyIGEgY2xpY2tcclxuICBiMS5mb2N1cygpO1xyXG4gIGdldERPTUVsZW1lbnQoIGIxICkuY2xpY2soKTtcclxuICBhc3NlcnQub2soIHRydWUsICdkdW1teSB0ZXN0IHRoYXQgc2hvdWxkIHJ1biBhZnRlciBjbGljayBldmVudHMnICk7XHJcblxyXG4gIGIxLmJsdXIoKTtcclxuXHJcbiAgZGlzcGxheS5kZXRhY2hFdmVudHMoKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3RpbmcgRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHknLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBkZXRhY2ggdGhlIEZvY3VzTWFuYWdlciBmaXJzdCBqdXN0IGluIGNhc2UgaXQgd2FzIGF0dGFjaGVkIGJ5IGEgcHJldmlvdXMgdGVzdFxyXG4gIEZvY3VzTWFuYWdlci5kZXRhY2hGcm9tV2luZG93KCk7XHJcblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoKTtcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGZvY3VzYWJsZU5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGZvY3VzYWJsZU5vZGUgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUsICdzaG91bGQgbm90IGhhdmUgZm9jdXMgYXQgc3RhcnQnICk7XHJcblxyXG4gIC8vIEZpcnN0LCB0ZXN0IGRldGFjaEZyb21XaW5kb3csIG9uY2UgZm9jdXMgaXMgaW4gdGhlIHdpbmRvdyBpdCBpcyBpbXBvc3NpYmxlIHRvIHJlbW92ZSBpdCBmcm9tXHJcbiAgLy8gdGhlIHdpbmRvdyB3aXRoIEphdmFTY3JpcHQuXHJcbiAgRm9jdXNNYW5hZ2VyLmF0dGFjaFRvV2luZG93KCk7XHJcbiAgRm9jdXNNYW5hZ2VyLmRldGFjaEZyb21XaW5kb3coKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUsICdzaG91bGQgbm90IGhhdmUgZm9jdXMgYWZ0ZXIgZGV0YWNoaW5nJyApO1xyXG4gIGZvY3VzYWJsZU5vZGUuZm9jdXMoKTtcclxuICBhc3NlcnQub2soICFGb2N1c01hbmFnZXIud2luZG93SGFzRm9jdXNQcm9wZXJ0eS52YWx1ZSwgJ1Nob3VsZCBub3QgYmUgd2F0Y2hpbmcgd2luZG93IGZvY3VzIGNoYW5nZXMgYWZ0ZXIgZGV0YWNoaW5nJyApO1xyXG5cclxuICAvLyBub3cgdGVzdCBjaGFuZ2VzIHRvIHdpbmRvd0hhc0ZvY3VzUHJvcGVydHkgLSB3aW5kb3cgZm9jdXMgbGlzdGVuZXJzIHdpbGwgb25seSB3b3JrIGlmIHRlc3RzIGFyZSBiZWluZyBydW5cclxuICAvLyBpbiB0aGUgZm9yZWdyb3VuZCAoZGV2IGNhbm5vdCBiZSB1c2luZyBkZXYgdG9vbHMsIHJ1bm5pbmcgaW4gcHVwcGV0ZWVyLCBtaW5pbWl6ZWQsIGV0Yy4uLilcclxuICBpZiAoIGRvY3VtZW50Lmhhc0ZvY3VzKCkgKSB7XHJcbiAgICBGb2N1c01hbmFnZXIuYXR0YWNoVG9XaW5kb3coKTtcclxuICAgIGFzc2VydC5vayggRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUsICdGb2N1cyB3YXMgbW92ZWQgaW50byB3aW5kb3cgZnJvbSBwcmV2aW91cyB0ZXN0cywgdGhpcyBhdHRhY2ggc2hvdWxkIHJlZmxlY3Qgd2luZG93IGFscmVhZHkgaGFzIGZvY3VzLicgKTtcclxuICAgIGZvY3VzYWJsZU5vZGUuZm9jdXMoKTtcclxuICAgIGFzc2VydC5vayggRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUsICdXaW5kb3cgaGFzIGZvY3VzLCBpcyBub3cgaW4gdGhlIGZvcmVncm91bmQnICk7XHJcbiAgICBmb2N1c2FibGVOb2RlLmJsdXIoKTtcclxuICAgIGFzc2VydC5vayggRm9jdXNNYW5hZ2VyLndpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUsICd3aW5kb3cgc3RpbGwgaGFzIGZvY3VzIGFmdGVyIGEgYmx1ciAoZm9jdXMgb24gYm9keSknICk7XHJcblxyXG4gICAgLy8gTk9URSAtIGRvbid0IGRldGFjaCB0aGUgRm9jdXNNYW5hZ2VyIGhlcmUsIGl0IGlzIGdsb2JhbGx5IGF0dGFjaGVkIGFuZCBpdCBuZWVkcyB0byBiZXVzZWRcclxuICAgIC8vIGZvciBvdGhlciB0ZXN0c1xyXG4gIH1cclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxPQUFPLEVBQUVDLFlBQVksRUFBRUMsSUFBSSxFQUFFQyxLQUFLLFFBQVEsZUFBZTtBQUVsRUMsS0FBSyxDQUFDQyxNQUFNLENBQUUsT0FBUSxDQUFDO0FBWXZCO0FBQ0EsU0FBU0MsY0FBY0EsQ0FBRUMsTUFBYyxFQUFFQyxDQUFpQixFQUFFQyxDQUF1QixFQUFTO0VBQzFGRixNQUFNLENBQUNHLEtBQUssQ0FBRUYsQ0FBQyxDQUFDRyxNQUFNLEVBQUVGLENBQUMsQ0FBQ0UsTUFBTyxDQUFDO0VBRWxDLEtBQU0sSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixDQUFDLENBQUNHLE1BQU0sRUFBRUMsQ0FBQyxFQUFFLEVBQUc7SUFDbkMsTUFBTUMsS0FBSyxHQUFHTCxDQUFDLENBQUVJLENBQUMsQ0FBRTtJQUNwQixNQUFNRSxLQUFLLEdBQUdMLENBQUMsQ0FBRUcsQ0FBQyxDQUFFO0lBRXBCLElBQUtDLEtBQUssQ0FBQ0UsS0FBSyxJQUFJRCxLQUFLLENBQUNDLEtBQUssRUFBRztN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