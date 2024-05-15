// Copyright 2017-2024, University of Colorado Boulder

/**
 * ParallelDOM tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Display from '../../display/Display.js';
import Circle from '../../nodes/Circle.js';
import Node from '../../nodes/Node.js';
import Rectangle from '../../nodes/Rectangle.js';
import PDOMFuzzer from './PDOMFuzzer.js';
import PDOMPeer from './PDOMPeer.js';
import PDOMUtils from './PDOMUtils.js';
// constants
const TEST_INNER_CONTENT = 'Test Inner Content Here please^&*. Thanks you so very mucho.';
const TEST_LABEL = 'Test label';
const TEST_LABEL_2 = 'Test label 2';
const TEST_DESCRIPTION = 'Test description';
const TEST_LABEL_HTML = '<strong>I ROCK as a LABEL</strong>';
const TEST_LABEL_HTML_2 = '<strong>I ROCK as a LABEL 2</strong>';
const TEST_DESCRIPTION_HTML = '<strong>I ROCK as a DESCRIPTION</strong>';
const TEST_DESCRIPTION_HTML_2 = '<strong>I ROCK as a DESCRIPTION 2</strong>';
const TEST_CLASS_ONE = 'test-class-one';
const TEST_CLASS_TWO = 'test-class-two';

// These should manually match the defaults in the ParallelDOM.js trait
const DEFAULT_LABEL_TAG_NAME = PDOMUtils.DEFAULT_LABEL_TAG_NAME;
const DEFAULT_DESCRIPTION_TAG_NAME = PDOMUtils.DEFAULT_DESCRIPTION_TAG_NAME;

// given the parent container element for a node, this value is the index of the label sibling in the
// parent's array of children HTMLElements.
const DEFAULT_LABEL_SIBLING_INDEX = 0;
const DEFAULT_DESCRIPTION_SIBLING_INDEX = 1;
const APPENDED_DESCRIPTION_SIBLING_INDEX = 2;

// a focus highlight for testing, since dummy nodes tend to have no bounds
const TEST_HIGHLIGHT = new Circle(5);

// a custom focus highlight (since dummy node's have no bounds)
const focusHighlight = new Rectangle(0, 0, 10, 10);
let canRunTests = true;
QUnit.module('ParallelDOM', {
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
 * Get a unique PDOMPeer from a node with accessible content. Will error if the node has multiple instances
 * or if the node hasn't been attached to a display (and therefore has no accessible content).
 */
function getPDOMPeerByNode(node) {
  if (node.pdomInstances.length === 0) {
    throw new Error('No pdomInstances. Was your node added to the scene graph?');
  } else if (node.pdomInstances.length > 1) {
    throw new Error('There should one and only one accessible instance for the node');
  } else if (!node.pdomInstances[0].peer) {
    throw new Error('pdomInstance\'s peer should exist.');
  }
  return node.pdomInstances[0].peer;
}

/**
 * Get the id of a dom element representing a node in the DOM.  The accessible content must exist and be unique,
 * there should only be one accessible instance and one dom element for the node.
 *
 * NOTE: Be careful about getting references to dom Elements, the reference will be stale each time
 * the view (PDOMPeer) is redrawn, which is quite often when setting options.
 */
function getPrimarySiblingElementByNode(node) {
  const uniquePeer = getPDOMPeerByNode(node);
  return document.getElementById(uniquePeer.primarySibling.id);
}

/**
 * Audit the root node for accessible content within a test, to make sure that content is accessible as we expect,
 * and so that our pdomAudit function may catch things that have gone wrong.
 * @param rootNode - the root Node attached to the Display being tested
 */
function pdomAuditRootNode(rootNode) {
  rootNode.pdomAudit();
}
QUnit.test('tagName/innerContent options', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button',
    innerContent: TEST_LABEL
  });
  rootNode.addChild(a);
  const aElement = getPrimarySiblingElementByNode(a);
  assert.ok(a.pdomInstances.length === 1, 'only 1 instance');
  assert.ok(aElement.parentElement.childNodes.length === 1, 'parent contains one primary siblings');
  assert.ok(aElement.tagName === 'BUTTON', 'default label tagName');
  assert.ok(aElement.textContent === TEST_LABEL, 'no html should use textContent');
  a.innerContent = TEST_LABEL_HTML;
  assert.ok(aElement.innerHTML === TEST_LABEL_HTML, 'html label should use innerHTML');
  a.innerContent = TEST_LABEL_HTML_2;
  assert.ok(aElement.innerHTML === TEST_LABEL_HTML_2, 'html label should use innerHTML, overwrite from html');
  a.innerContent = null;
  assert.ok(aElement.innerHTML === '', 'innerHTML should be empty after clearing innerContent');
  a.tagName = null;
  assert.ok(a.pdomInstances.length === 0, 'set to null should clear accessible instances');

  // make sure that no errors when setting innerContent with tagName null.
  a.innerContent = 'hello';
  a.tagName = 'button';
  a.innerContent = TEST_LABEL_HTML_2;
  assert.ok(getPrimarySiblingElementByNode(a).innerHTML === TEST_LABEL_HTML_2, 'innerContent not cleared when tagName set to null.');

  // verify that setting inner content on an input is not allowed
  const b = new Node({
    tagName: 'input',
    inputType: 'range'
  });
  rootNode.addChild(b);
  window.assert && assert.throws(() => {
    b.innerContent = 'this should fail';
  }, /.*/, 'cannot set inner content on input');

  // now that it is a div, innerContent is allowed
  b.tagName = 'div';
  assert.ok(b.tagName === 'div', 'expect tagName setter to work.');
  b.innerContent = TEST_LABEL;
  assert.ok(b.innerContent === TEST_LABEL, 'inner content allowed');

  // revert tag name to input, should throw an error
  window.assert && assert.throws(() => {
    b.tagName = 'input';
  }, /.*/, 'error thrown after setting tagName to input on Node with innerContent.');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('containerTagName option', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button'
  });
  rootNode.addChild(a);
  assert.ok(a.pdomInstances.length === 1, 'only 1 instance');
  assert.ok(a.pdomInstances[0].peer.containerParent === null, 'no container parent for just button');
  assert.ok(rootNode['_pdomInstances'][0].peer.primarySibling.children[0] === a['_pdomInstances'][0].peer.primarySibling, 'rootNode peer should hold node a\'s peer in the PDOM');
  a.containerTagName = 'div';
  assert.ok(a.pdomInstances[0].peer.containerParent.id.includes('container'), 'container parent is div if specified');
  assert.ok(rootNode['_pdomInstances'][0].peer.primarySibling.children[0] === a['_pdomInstances'][0].peer.containerParent, 'container parent is div if specified');
  a.containerTagName = null;
  assert.ok(!a.pdomInstances[0].peer.containerParent, 'container parent is cleared if specified');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('labelTagName/labelContent option', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button',
    labelContent: TEST_LABEL
  });
  rootNode.addChild(a);
  const aElement = getPrimarySiblingElementByNode(a);
  const labelSibling = aElement.parentElement.childNodes[0];
  assert.ok(a.pdomInstances.length === 1, 'only 1 instance');
  assert.ok(aElement.parentElement.childNodes.length === 2, 'parent contains two siblings');
  assert.ok(labelSibling.tagName === DEFAULT_LABEL_TAG_NAME, 'default label tagName');
  assert.ok(labelSibling.textContent === TEST_LABEL, 'no html should use textContent');
  a.labelContent = TEST_LABEL_HTML;
  assert.ok(labelSibling.innerHTML === TEST_LABEL_HTML, 'html label should use innerHTML');
  a.labelContent = null;
  assert.ok(labelSibling.innerHTML === '', 'label content should be empty after setting to null');
  a.labelContent = TEST_LABEL_HTML_2;
  assert.ok(labelSibling.innerHTML === TEST_LABEL_HTML_2, 'html label should use innerHTML, overwrite from html');
  a.tagName = 'div';
  const newAElement = getPrimarySiblingElementByNode(a);
  const newLabelSibling = newAElement.parentElement.childNodes[0];
  assert.ok(newLabelSibling.innerHTML === TEST_LABEL_HTML_2, 'tagName independent of: html label should use innerHTML, overwrite from html');
  a.labelTagName = null;

  // make sure label was cleared from PDOM
  assert.ok(getPrimarySiblingElementByNode(a).parentElement.childNodes.length === 1, 'Only one element after clearing label');
  assert.ok(a.labelContent === TEST_LABEL_HTML_2, 'clearing labelTagName should not change content, even  though it is not displayed');
  a.labelTagName = 'p';
  assert.ok(a.labelTagName === 'p', 'expect labelTagName setter to work.');
  const b = new Node({
    tagName: 'p',
    labelContent: 'I am groot'
  });
  rootNode.addChild(b);
  let bLabelElement = document.getElementById(b.pdomInstances[0].peer.labelSibling.id);
  assert.ok(!bLabelElement.getAttribute('for'), 'for attribute should not be on non label label sibling.');
  b.labelTagName = 'label';
  bLabelElement = document.getElementById(b.pdomInstances[0].peer.labelSibling.id);
  assert.ok(bLabelElement.getAttribute('for') !== null, 'for attribute should be on "label" tag for label sibling.');
  const c = new Node({
    tagName: 'p'
  });
  rootNode.addChild(c);
  c.labelTagName = 'label';
  c.labelContent = TEST_LABEL;
  const cLabelElement = document.getElementById(c.pdomInstances[0].peer.labelSibling.id);
  assert.ok(cLabelElement.getAttribute('for') !== null, 'order should not matter');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('container element not needed for multiple siblings', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // test containerTag is not needed
  const b = new Node({
    tagName: 'div',
    labelContent: 'hello'
  });
  const c = new Node({
    tagName: 'section',
    labelContent: 'hi'
  });
  const d = new Node({
    tagName: 'p',
    innerContent: 'PPPP',
    containerTagName: 'div'
  });
  rootNode.addChild(b);
  b.addChild(c);
  b.addChild(d);
  let bElement = getPrimarySiblingElementByNode(b);
  let cPeer = c.pdomInstances[0].peer;
  let dPeer = d.pdomInstances[0].peer;
  assert.ok(bElement.children.length === 3, 'c.p, c.section, d.div should all be on the same level');
  const confirmOriginalOrder = () => {
    assert.ok(bElement.children[0].tagName === 'P', 'p first');
    assert.ok(bElement.children[1].tagName === 'SECTION', 'section 2nd');
    assert.ok(bElement.children[2].tagName === 'DIV', 'div 3rd');
    assert.ok(bElement.children[0] === cPeer.labelSibling, 'c label first');
    assert.ok(bElement.children[1] === cPeer.primarySibling, 'c primary 2nd');
    assert.ok(bElement.children[2] === dPeer.containerParent, 'd container 3rd');
  };
  confirmOriginalOrder();

  // add a few more
  const e = new Node({
    tagName: 'span',
    descriptionContent: '<br>sweet and cool things</br>'
  });
  b.addChild(e);
  bElement = getPrimarySiblingElementByNode(b); // refresh the DOM Elements
  cPeer = c.pdomInstances[0].peer; // refresh the DOM Elements
  dPeer = d.pdomInstances[0].peer; // refresh the DOM Elements
  let ePeer = e.pdomInstances[0].peer;
  assert.ok(bElement.children.length === 5, 'e children should be added to the same PDOM level.');
  confirmOriginalOrder();
  const confirmOriginalWithE = () => {
    assert.ok(bElement.children[3].tagName === 'P', 'P 4rd');
    assert.ok(bElement.children[4].tagName === 'SPAN', 'SPAN 3rd');
    assert.ok(bElement.children[3] === ePeer.descriptionSibling, 'e description 4th');
    assert.ok(bElement.children[4] === ePeer.primarySibling, 'e primary 5th');
  };

  // dynamically adding parent
  e.containerTagName = 'article';
  bElement = getPrimarySiblingElementByNode(b); // refresh the DOM Elements
  cPeer = c.pdomInstances[0].peer; // refresh the DOM Elements
  dPeer = d.pdomInstances[0].peer; // refresh the DOM Elements
  ePeer = e.pdomInstances[0].peer;
  assert.ok(bElement.children.length === 4, 'e children should now be under e\'s container.');
  confirmOriginalOrder();
  assert.ok(bElement.children[3].tagName === 'ARTICLE', 'SPAN 3rd');
  assert.ok(bElement.children[3] === ePeer.containerParent, 'e parent 3rd');

  // clear container
  e.containerTagName = null;
  bElement = getPrimarySiblingElementByNode(b); // refresh the DOM Elements
  cPeer = c.pdomInstances[0].peer; // refresh the DOM Elements
  dPeer = d.pdomInstances[0].peer; // refresh the DOM Elements
  ePeer = e.pdomInstances[0].peer;
  assert.ok(bElement.children.length === 5, 'e children should be added to the same PDOM level again.');
  confirmOriginalOrder();
  confirmOriginalWithE();

  // proper disposal
  e.dispose();
  bElement = getPrimarySiblingElementByNode(b);
  assert.ok(bElement.children.length === 3, 'e children should have been removed');
  assert.ok(e.pdomInstances.length === 0, 'e is disposed');
  confirmOriginalOrder();

  // reorder d correctly when c removed
  b.removeChild(c);
  assert.ok(bElement.children.length === 1, 'c children should have been removed, only d container');
  bElement = getPrimarySiblingElementByNode(b);
  dPeer = d.pdomInstances[0].peer;
  assert.ok(bElement.children[0].tagName === 'DIV', 'DIV first');
  assert.ok(bElement.children[0] === dPeer.containerParent, 'd container first');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('descriptionTagName/descriptionContent option', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button',
    descriptionContent: TEST_DESCRIPTION
  });
  rootNode.addChild(a);
  const aElement = getPrimarySiblingElementByNode(a);
  const descriptionSibling = aElement.parentElement.childNodes[0];
  assert.ok(a.pdomInstances.length === 1, 'only 1 instance');
  assert.ok(aElement.parentElement.childNodes.length === 2, 'parent contains two siblings');
  assert.ok(descriptionSibling.tagName === DEFAULT_DESCRIPTION_TAG_NAME, 'default label tagName');
  assert.ok(descriptionSibling.textContent === TEST_DESCRIPTION, 'no html should use textContent');
  a.descriptionContent = TEST_DESCRIPTION_HTML;
  assert.ok(descriptionSibling.innerHTML === TEST_DESCRIPTION_HTML, 'html label should use innerHTML');
  a.descriptionContent = null;
  assert.ok(descriptionSibling.innerHTML === '', 'description content should be cleared');
  a.descriptionContent = TEST_DESCRIPTION_HTML_2;
  assert.ok(descriptionSibling.innerHTML === TEST_DESCRIPTION_HTML_2, 'html label should use innerHTML, overwrite from html');
  a.descriptionTagName = null;

  // make sure description was cleared from PDOM
  assert.ok(getPrimarySiblingElementByNode(a).parentElement.childNodes.length === 1, 'Only one element after clearing description');
  assert.ok(a.descriptionContent === TEST_DESCRIPTION_HTML_2, 'clearing descriptionTagName should not change content, even  though it is not displayed');
  assert.ok(a.descriptionTagName === null, 'expect descriptionTagName setter to work.');
  a.descriptionTagName = 'p';
  assert.ok(a.descriptionTagName === 'p', 'expect descriptionTagName setter to work.');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('ParallelDOM options', assert => {
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // test setting of accessible content through options
  const buttonNode = new Node({
    focusHighlight: new Circle(5),
    containerTagName: 'div',
    // contained in parent element 'div'
    tagName: 'input',
    // dom element with tag name 'input'
    inputType: 'button',
    // input type 'button'
    labelTagName: 'label',
    // label with tagname 'label'
    labelContent: TEST_LABEL,
    // label text content
    descriptionContent: TEST_DESCRIPTION,
    // description text content
    focusable: false,
    // remove from focus order
    ariaRole: 'button' // uses the ARIA button role
  });
  rootNode.addChild(buttonNode);
  const divNode = new Node({
    tagName: 'div',
    ariaLabel: TEST_LABEL,
    // use ARIA label attribute
    pdomVisible: false,
    // hidden from screen readers (and browser)
    descriptionContent: TEST_DESCRIPTION,
    // default to a <p> tag
    containerTagName: 'div'
  });
  rootNode.addChild(divNode);

  // verify that setters and getters worked correctly
  assert.ok(buttonNode.labelTagName === 'label', 'Label tag name');
  assert.ok(buttonNode.containerTagName === 'div', 'container tag name');
  assert.ok(buttonNode.labelContent === TEST_LABEL, 'Accessible label');
  assert.ok(buttonNode.descriptionTagName.toUpperCase() === DEFAULT_DESCRIPTION_TAG_NAME, 'Description tag name');
  assert.equal(buttonNode.focusable, false, 'Focusable');
  assert.ok(buttonNode.ariaRole === 'button', 'Aria role');
  assert.ok(buttonNode.descriptionContent === TEST_DESCRIPTION, 'Accessible Description');
  assert.ok(buttonNode.focusHighlight instanceof Circle, 'Focus highlight');
  assert.ok(buttonNode.tagName === 'input', 'Tag name');
  assert.ok(buttonNode.inputType === 'button', 'Input type');
  assert.ok(divNode.tagName === 'div', 'Tag name');
  assert.ok(divNode.ariaLabel === TEST_LABEL, 'Use aria label');
  assert.equal(divNode.pdomVisible, false, 'pdom visible');
  assert.ok(divNode.labelTagName === null, 'Label tag name with aria label is independent');
  assert.ok(divNode.descriptionTagName.toUpperCase() === DEFAULT_DESCRIPTION_TAG_NAME, 'Description tag name');

  // verify DOM structure - options above should create something like:
  // <div id="display-root">
  //  <div id="parent-container-id">
  //    <label for="id">Test Label</label>
  //    <p>Description>Test Description</p>
  //    <input type='button' role='button' tabindex="-1" id=id>
  //  </div>
  //
  //  <div aria-label="Test Label" hidden aria-labelledBy="button-node-id" aria-describedby='button-node-id'>
  //    <p>Test Description</p>
  //  </div>
  // </div>
  pdomAuditRootNode(rootNode);
  let buttonElement = getPrimarySiblingElementByNode(buttonNode);
  const buttonParent = buttonElement.parentNode;
  const buttonPeers = buttonParent.childNodes;
  const buttonLabel = buttonPeers[0];
  const buttonDescription = buttonPeers[1];
  const divElement = getPrimarySiblingElementByNode(divNode);
  const pDescription = divElement.parentElement.childNodes[0]; // description before primary div

  assert.ok(buttonParent.tagName === 'DIV', 'parent container');
  assert.ok(buttonLabel.tagName === 'LABEL', 'Label first');
  assert.ok(buttonLabel.getAttribute('for') === buttonElement.id, 'label for attribute');
  assert.ok(buttonLabel.textContent === TEST_LABEL, 'label content');
  assert.ok(buttonDescription.tagName === DEFAULT_DESCRIPTION_TAG_NAME, 'description second');
  assert.equal(buttonDescription.textContent, TEST_DESCRIPTION, 'description content');
  assert.ok(buttonPeers[2] === buttonElement, 'Button third');
  assert.ok(buttonElement.getAttribute('type') === 'button', 'input type set');
  assert.ok(buttonElement.getAttribute('role') === 'button', 'button role set');
  assert.ok(buttonElement.tabIndex === -1, 'not focusable');
  assert.ok(divElement.getAttribute('aria-label') === TEST_LABEL, 'aria label set');
  assert.ok(divElement.parentElement.hidden, 'hidden set should act on parent');
  assert.ok(pDescription.textContent === TEST_DESCRIPTION, 'description content');
  assert.ok(pDescription.parentElement === divElement.parentElement, 'description is sibling to primary');
  assert.ok(divElement.parentElement.childNodes.length === 2, 'no label element for aria-label, just description and primary siblings');

  // clear values
  buttonNode.inputType = null;
  buttonElement = getPrimarySiblingElementByNode(buttonNode);
  assert.ok(buttonElement.getAttribute('type') === null, 'input type cleared');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});

// tests for aria-labelledby and aria-describedby should be the same, since both support the same feature set
function testAssociationAttribute(assert, attribute) {
  // use a different setter depending on if testing labelledby or describedby
  const addAssociationFunction = attribute === 'aria-labelledby' ? 'addAriaLabelledbyAssociation' : attribute === 'aria-describedby' ? 'addAriaDescribedbyAssociation' : attribute === 'aria-activedescendant' ? 'addActiveDescendantAssociation' : null;
  if (!addAssociationFunction) {
    throw new Error('incorrect attribute name while in testAssociationAttribute');
  }
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // two new nodes that will be related with the aria-labelledby and aria-describedby associations
  const a = new Node({
    tagName: 'button',
    labelTagName: 'p',
    descriptionTagName: 'p'
  });
  const b = new Node({
    tagName: 'p',
    innerContent: TEST_LABEL_2
  });
  rootNode.children = [a, b];
  window.assert && assert.throws(() => {
    a.setPDOMAttribute(attribute, 'hello');
  }, /.*/, 'cannot set association attributes with setPDOMAttribute');
  a[addAssociationFunction]({
    otherNode: b,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.PRIMARY_SIBLING
  });
  let aElement = getPrimarySiblingElementByNode(a);
  let bElement = getPrimarySiblingElementByNode(b);
  assert.ok(aElement.getAttribute(attribute).includes(bElement.id), `${attribute} for one node.`);
  const c = new Node({
    tagName: 'div',
    innerContent: TEST_LABEL
  });
  rootNode.addChild(c);
  a[addAssociationFunction]({
    otherNode: c,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.PRIMARY_SIBLING
  });
  aElement = getPrimarySiblingElementByNode(a);
  bElement = getPrimarySiblingElementByNode(b);
  let cElement = getPrimarySiblingElementByNode(c);
  const expectedValue = [bElement.id, cElement.id].join(' ');
  assert.ok(aElement.getAttribute(attribute) === expectedValue, `${attribute} two nodes`);

  // Make c invalidate
  rootNode.removeChild(c);
  rootNode.addChild(new Node({
    children: [c]
  }));
  const oldValue = expectedValue;
  aElement = getPrimarySiblingElementByNode(a);
  cElement = getPrimarySiblingElementByNode(c);
  assert.ok(aElement.getAttribute(attribute) !== oldValue, 'should have invalidated on tree change');
  assert.ok(aElement.getAttribute(attribute) === [bElement.id, cElement.id].join(' '), 'should have invalidated on tree change');
  const d = new Node({
    tagName: 'div',
    descriptionTagName: 'p',
    innerContent: TEST_LABEL,
    containerTagName: 'div'
  });
  rootNode.addChild(d);
  b[addAssociationFunction]({
    otherNode: d,
    thisElementName: PDOMPeer.CONTAINER_PARENT,
    otherElementName: PDOMPeer.DESCRIPTION_SIBLING
  });
  b.containerTagName = 'div';
  const bParentContainer = getPrimarySiblingElementByNode(b).parentElement;
  const dDescriptionElement = getPrimarySiblingElementByNode(d).parentElement.childNodes[0];
  assert.ok(bParentContainer.getAttribute(attribute) !== oldValue, 'should have invalidated on tree change');
  assert.ok(bParentContainer.getAttribute(attribute) === dDescriptionElement.id, `b parent container element is ${attribute} d description sibling`);

  // say we have a scene graph that looks like:
  //    e
  //     \
  //      f
  //       \
  //        g
  //         \
  //          h
  // we want to make sure
  const e = new Node({
    tagName: 'div'
  });
  const f = new Node({
    tagName: 'div'
  });
  const g = new Node({
    tagName: 'div'
  });
  const h = new Node({
    tagName: 'div'
  });
  e.addChild(f);
  f.addChild(g);
  g.addChild(h);
  rootNode.addChild(e);
  e[addAssociationFunction]({
    otherNode: f,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.PRIMARY_SIBLING
  });
  f[addAssociationFunction]({
    otherNode: g,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.PRIMARY_SIBLING
  });
  g[addAssociationFunction]({
    otherNode: h,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.PRIMARY_SIBLING
  });
  let eElement = getPrimarySiblingElementByNode(e);
  let fElement = getPrimarySiblingElementByNode(f);
  let gElement = getPrimarySiblingElementByNode(g);
  let hElement = getPrimarySiblingElementByNode(h);
  assert.ok(eElement.getAttribute(attribute) === fElement.id, `eElement should be ${attribute} fElement`);
  assert.ok(fElement.getAttribute(attribute) === gElement.id, `fElement should be ${attribute} gElement`);
  assert.ok(gElement.getAttribute(attribute) === hElement.id, `gElement should be ${attribute} hElement`);

  // re-arrange the scene graph and make sure that the attribute ids remain up to date
  //    e
  //     \
  //      h
  //       \
  //        g
  //         \
  //          f
  e.removeChild(f);
  f.removeChild(g);
  g.removeChild(h);
  e.addChild(h);
  h.addChild(g);
  g.addChild(f);
  eElement = getPrimarySiblingElementByNode(e);
  fElement = getPrimarySiblingElementByNode(f);
  gElement = getPrimarySiblingElementByNode(g);
  hElement = getPrimarySiblingElementByNode(h);
  assert.ok(eElement.getAttribute(attribute) === fElement.id, `eElement should still be ${attribute} fElement`);
  assert.ok(fElement.getAttribute(attribute) === gElement.id, `fElement should still be ${attribute} gElement`);
  assert.ok(gElement.getAttribute(attribute) === hElement.id, `gElement should still be ${attribute} hElement`);

  // test aria labelled by your self, but a different peer Element, multiple attribute ids included in the test.
  const containerTagName = 'div';
  const j = new Node({
    tagName: 'button',
    labelTagName: 'label',
    descriptionTagName: 'p',
    containerTagName: containerTagName
  });
  rootNode.children = [j];
  j[addAssociationFunction]({
    otherNode: j,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.LABEL_SIBLING
  });
  j[addAssociationFunction]({
    otherNode: j,
    thisElementName: PDOMPeer.CONTAINER_PARENT,
    otherElementName: PDOMPeer.DESCRIPTION_SIBLING
  });
  j[addAssociationFunction]({
    otherNode: j,
    thisElementName: PDOMPeer.CONTAINER_PARENT,
    otherElementName: PDOMPeer.LABEL_SIBLING
  });
  const checkOnYourOwnAssociations = node => {
    const instance = node['_pdomInstances'][0];
    const nodePrimaryElement = instance.peer.primarySibling;
    const nodeParent = nodePrimaryElement.parentElement;
    const getUniqueIdStringForSibling = siblingString => {
      return instance.peer.getElementId(siblingString, instance.getPDOMInstanceUniqueId());
    };
    assert.ok(nodePrimaryElement.getAttribute(attribute).includes(getUniqueIdStringForSibling('label')), `${attribute} your own label element.`);
    assert.ok(nodeParent.getAttribute(attribute).includes(getUniqueIdStringForSibling('description')), `parent ${attribute} your own description element.`);
    assert.ok(nodeParent.getAttribute(attribute).includes(getUniqueIdStringForSibling('label')), `parent ${attribute} your own label element.`);
  };

  // add k into the mix
  const k = new Node({
    tagName: 'div'
  });
  k[addAssociationFunction]({
    otherNode: j,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.LABEL_SIBLING
  });
  rootNode.addChild(k);
  const testK = () => {
    const kValue = k['_pdomInstances'][0].peer.primarySibling.getAttribute(attribute);
    const jID = j['_pdomInstances'][0].peer.labelSibling.getAttribute('id');
    assert.ok(jID === kValue, 'k pointing to j');
  };

  // audit the content we have created
  pdomAuditRootNode(rootNode);

  // Check basic associations within single node
  checkOnYourOwnAssociations(j);
  testK();

  // Moving this node around the scene graph should not change it's aria labelled by associations.
  rootNode.addChild(new Node({
    children: [j]
  }));
  checkOnYourOwnAssociations(j);
  testK();

  // check remove child
  rootNode.removeChild(j);
  checkOnYourOwnAssociations(j);
  testK();

  // check dispose
  const jParent = new Node({
    children: [j]
  });
  rootNode.children = [];
  rootNode.addChild(jParent);
  checkOnYourOwnAssociations(j);
  rootNode.addChild(j);
  checkOnYourOwnAssociations(j);
  rootNode.addChild(k);
  checkOnYourOwnAssociations(j);
  testK();
  jParent.dispose();
  checkOnYourOwnAssociations(j);
  testK();

  // check removeChild with dag
  const jParent2 = new Node({
    children: [j]
  });
  rootNode.insertChild(0, jParent2);
  checkOnYourOwnAssociations(j);
  testK();
  rootNode.removeChild(jParent2);
  checkOnYourOwnAssociations(j);
  testK();
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
}
function testAssociationAttributeBySetters(assert, attribute) {
  const rootNode = new Node();
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  // use a different setter depending on if testing labelledby or describedby
  const associationsArrayName = attribute === 'aria-labelledby' ? 'ariaLabelledbyAssociations' : attribute === 'aria-describedby' ? 'ariaDescribedbyAssociations' : 'activeDescendantAssociations';
  // use a different setter depending on if testing labelledby or describedby
  const associationRemovalFunction = attribute === 'aria-labelledby' ? 'removeAriaLabelledbyAssociation' : attribute === 'aria-describedby' ? 'removeAriaDescribedbyAssociation' : 'removeActiveDescendantAssociation';
  const options = {
    tagName: 'p',
    labelContent: 'hi',
    descriptionContent: 'hello',
    containerTagName: 'div'
  };
  const n = new Node(options);
  rootNode.addChild(n);
  options[associationsArrayName] = [{
    otherNode: n,
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.LABEL_SIBLING
  }];
  const o = new Node(options);
  rootNode.addChild(o);
  const nPeer = getPDOMPeerByNode(n);
  const oElement = getPrimarySiblingElementByNode(o);
  assert.ok(oElement.getAttribute(attribute).includes(nPeer.getElementId('label', nPeer.pdomInstance.getPDOMInstanceUniqueId())), `${attribute} for two nodes with setter (label).`);

  // make a list of associations to test as a setter
  const randomAssociationObject = {
    otherNode: new Node(),
    thisElementName: PDOMPeer.CONTAINER_PARENT,
    otherElementName: PDOMPeer.LABEL_SIBLING
  };
  options[associationsArrayName] = [{
    otherNode: new Node(),
    thisElementName: PDOMPeer.CONTAINER_PARENT,
    otherElementName: PDOMPeer.DESCRIPTION_SIBLING
  }, randomAssociationObject, {
    otherNode: new Node(),
    thisElementName: PDOMPeer.PRIMARY_SIBLING,
    otherElementName: PDOMPeer.LABEL_SIBLING
  }];

  // test getters and setters
  const m = new Node(options);
  rootNode.addChild(m);
  assert.ok(_.isEqual(m[associationsArrayName], options[associationsArrayName]), 'test association object getter');
  m[associationRemovalFunction](randomAssociationObject);
  options[associationsArrayName].splice(options[associationsArrayName].indexOf(randomAssociationObject), 1);
  assert.ok(_.isEqual(m[associationsArrayName], options[associationsArrayName]), 'test association object getter after removal');
  m[associationsArrayName] = [];
  assert.ok(getPrimarySiblingElementByNode(m).getAttribute(attribute) === null, 'clear with setter');
  m[associationsArrayName] = options[associationsArrayName];
  m.dispose();
  assert.ok(m[associationsArrayName].length === 0, 'cleared when disposed');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
}
QUnit.test('aria-labelledby', assert => {
  testAssociationAttribute(assert, 'aria-labelledby');
  testAssociationAttributeBySetters(assert, 'aria-labelledby');
});
QUnit.test('aria-describedby', assert => {
  testAssociationAttribute(assert, 'aria-describedby');
  testAssociationAttributeBySetters(assert, 'aria-describedby');
});
QUnit.test('aria-activedescendant', assert => {
  testAssociationAttribute(assert, 'aria-activedescendant');
  testAssociationAttributeBySetters(assert, 'aria-activedescendant');
});
QUnit.test('ParallelDOM invalidation', assert => {
  // test invalidation of accessibility (changing content which requires )
  const a1 = new Node();
  const rootNode = new Node();
  a1.tagName = 'button';

  // accessible instances are not sorted until added to a display
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  rootNode.addChild(a1);

  // verify that elements are in the DOM
  const a1Element = getPrimarySiblingElementByNode(a1);
  assert.ok(a1Element, 'button in DOM');
  assert.ok(a1Element.tagName === 'BUTTON', 'button tag name set');

  // give the button a container parent and some empty siblings
  a1.labelTagName = 'div';
  a1.descriptionTagName = 'p';
  a1.containerTagName = 'div';
  let buttonElement = a1.pdomInstances[0].peer.primarySibling;
  let parentElement = buttonElement.parentElement;
  const buttonPeers = parentElement.childNodes;

  // now html should look like
  // <div id='parent'>
  //  <div id='label'></div>
  //  <p id='description'></p>
  //  <button></button>
  // </div>
  assert.ok(document.getElementById(parentElement.id), 'container parent in DOM');
  assert.ok(buttonPeers[0].tagName === 'DIV', 'label first');
  assert.ok(buttonPeers[1].tagName === 'P', 'description second');
  assert.ok(buttonPeers[2].tagName === 'BUTTON', 'primarySibling third');

  // make the button a div and use an inline label, and place the description below
  a1.tagName = 'div';
  a1.appendLabel = true;
  a1.appendDescription = true;
  a1.labelTagName = null; // use aria label attribute instead
  a1.ariaLabel = TEST_LABEL;

  // now the html should look like
  // <div id='parent-id'>
  //  <div></div>
  //  <p id='description'></p>
  // </div>

  // redefine the HTML elements (references will point to old elements before mutation)
  buttonElement = a1.pdomInstances[0].peer.primarySibling;
  parentElement = buttonElement.parentElement;
  const newButtonPeers = parentElement.childNodes;
  assert.ok(newButtonPeers[0] === getPrimarySiblingElementByNode(a1), 'div first');
  assert.ok(newButtonPeers[1].id.includes('description'), 'description after div when appending both elements');
  assert.ok(newButtonPeers.length === 2, 'no label peer when using just aria-label attribute');
  const elementInDom = document.getElementById(a1.pdomInstances[0].peer.primarySibling.id);
  assert.ok(elementInDom.getAttribute('aria-label') === TEST_LABEL, 'aria-label set');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('ParallelDOM setters/getters', assert => {
  const a1 = new Node({
    tagName: 'div'
  });
  var display = new Display(a1); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // set/get attributes
  let a1Element = getPrimarySiblingElementByNode(a1);
  const initialLength = a1.getPDOMAttributes().length;
  a1.setPDOMAttribute('role', 'switch');
  assert.ok(a1.getPDOMAttributes().length === initialLength + 1, 'attribute set should only add 1');
  assert.ok(a1.getPDOMAttributes()[a1.getPDOMAttributes().length - 1].attribute === 'role', 'attribute set');
  assert.ok(a1Element.getAttribute('role') === 'switch', 'HTML attribute set');
  assert.ok(a1.hasPDOMAttribute('role'), 'should have pdom attribute');
  a1.removePDOMAttribute('role');
  assert.ok(!a1.hasPDOMAttribute('role'), 'should not have pdom attribute');
  assert.ok(!a1Element.getAttribute('role'), 'attribute removed');
  const b = new Node({
    focusable: true
  });
  a1.addChild(b);
  b.tagName = 'div';
  assert.ok(getPrimarySiblingElementByNode(b).tabIndex >= 0, 'set tagName after focusable');

  // test setting attribute as DOM property, should NOT have attribute value pair (DOM uses empty string for empty)
  a1.setPDOMAttribute('hidden', true, {
    asProperty: true
  });
  a1Element = getPrimarySiblingElementByNode(a1);
  assert.equal(a1Element.hidden, true, 'hidden set as Property');
  assert.ok(a1Element.getAttribute('hidden') === '', 'hidden should not be set as attribute');

  // test setting and removing PDOM classes
  a1.setPDOMClass(TEST_CLASS_ONE);
  assert.ok(getPrimarySiblingElementByNode(a1).classList.contains(TEST_CLASS_ONE), 'TEST_CLASS_ONE missing from classList');

  // two classes
  a1.setPDOMClass(TEST_CLASS_TWO);
  a1Element = getPrimarySiblingElementByNode(a1);
  assert.ok(a1Element.classList.contains(TEST_CLASS_ONE) && a1Element.classList.contains(TEST_CLASS_ONE), 'One of the classes missing from classList');

  // modify the Node in a way that would cause a full redraw, make sure classes still exist
  a1.tagName = 'button';
  a1Element = getPrimarySiblingElementByNode(a1);
  assert.ok(a1Element.classList.contains(TEST_CLASS_ONE) && a1Element.classList.contains(TEST_CLASS_ONE), 'One of the classes missing from classList after changing tagName');

  // remove them one at a time
  a1.removePDOMClass(TEST_CLASS_ONE);
  a1Element = getPrimarySiblingElementByNode(a1);
  assert.ok(!a1Element.classList.contains(TEST_CLASS_ONE), 'TEST_CLASS_ONE should be removed from classList');
  assert.ok(a1Element.classList.contains(TEST_CLASS_TWO), 'TEST_CLASS_TWO should still be in classList');
  a1.removePDOMClass(TEST_CLASS_TWO);
  a1Element = getPrimarySiblingElementByNode(a1);
  assert.ok(!a1Element.classList.contains(TEST_CLASS_ONE) && !a1Element.classList.contains(TEST_CLASS_ONE), 'classList should not contain any added classes');
  pdomAuditRootNode(a1);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('Next/Previous focusable', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }

  // Especially important for puppeteer which doesn't support focus/blur events
  // see https://github.com/phetsims/aqua/issues/134
  if (!document.hasFocus()) {
    assert.ok(true, 'Unable to run focus tests if document does not have focus.');
  } else {
    const util = PDOMUtils;
    const rootNode = new Node({
      tagName: 'div',
      focusable: true
    });
    var display = new Display(rootNode); // eslint-disable-line no-var
    display.initializeEvents();
    document.body.appendChild(display.domElement);

    // invisible is deprecated don't use in future, this is a workaround for Nodes without bounds
    const a = new Node({
      tagName: 'div',
      focusable: true,
      focusHighlight: 'invisible'
    });
    const b = new Node({
      tagName: 'div',
      focusable: true,
      focusHighlight: 'invisible'
    });
    const c = new Node({
      tagName: 'div',
      focusable: true,
      focusHighlight: 'invisible'
    });
    const d = new Node({
      tagName: 'div',
      focusable: true,
      focusHighlight: 'invisible'
    });
    const e = new Node({
      tagName: 'div',
      focusable: true,
      focusHighlight: 'invisible'
    });
    rootNode.children = [a, b, c, d];
    assert.ok(a.focusable, 'should be focusable');

    // get dom elements from the body
    const rootElement = getPrimarySiblingElementByNode(rootNode);
    const aElement = getPrimarySiblingElementByNode(a);
    const bElement = getPrimarySiblingElementByNode(b);
    const cElement = getPrimarySiblingElementByNode(c);
    const dElement = getPrimarySiblingElementByNode(d);
    a.focus();
    assert.ok(document.activeElement.id === aElement.id, 'a in focus (next)');
    util.getNextFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === bElement.id, 'b in focus (next)');
    util.getNextFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === cElement.id, 'c in focus (next)');
    util.getNextFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === dElement.id, 'd in focus (next)');
    util.getNextFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === dElement.id, 'd still in focus (next)');
    util.getPreviousFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === cElement.id, 'c in focus (previous)');
    util.getPreviousFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === bElement.id, 'b in focus (previous)');
    util.getPreviousFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === aElement.id, 'a in focus (previous)');
    util.getPreviousFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === aElement.id, 'a still in focus (previous)');
    rootNode.removeAllChildren();
    rootNode.addChild(a);
    a.children = [b, c];
    c.addChild(d);
    d.addChild(e);

    // this should hide everything except a
    b.focusable = false;
    c.pdomVisible = false;
    a.focus();
    util.getNextFocusable(rootElement).focus();
    assert.ok(document.activeElement.id === aElement.id, 'a only element focusable');
    pdomAuditRootNode(rootNode);
    display.dispose();
    display.domElement.parentElement.removeChild(display.domElement);

    // NOTE: The FocusManager should not be detached here, it is used globally and is needed for other tests.
  }
});
QUnit.test('Remove accessibility subtree', assert => {
  const rootNode = new Node({
    tagName: 'div',
    focusable: true
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  const b = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  const c = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  const d = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  const e = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  const f = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: 'invisible'
  });
  rootNode.children = [a, b, c, d, e];
  d.addChild(f);
  let rootDOMElement = getPrimarySiblingElementByNode(rootNode);
  let dDOMElement = getPrimarySiblingElementByNode(d);

  // verify the dom
  assert.ok(rootDOMElement.children.length === 5, 'children added');

  // redefine because the dom element references above have become stale
  rootDOMElement = getPrimarySiblingElementByNode(rootNode);
  dDOMElement = getPrimarySiblingElementByNode(d);
  assert.ok(rootDOMElement.children.length === 5, 'children added back');
  assert.ok(dDOMElement.children.length === 1, 'descendant child added back');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('accessible-dag', assert => {
  // test accessibility for multiple instances of a node
  const rootNode = new Node({
    tagName: 'div',
    focusable: true
  });
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
  const e = new Node({
    tagName: 'div'
  });
  rootNode.addChild(a);
  a.children = [b, c, d];

  // e has three parents (DAG)
  b.addChild(e);
  c.addChild(e);
  d.addChild(e);

  // each instance should have its own accessible content, HTML should look like
  // <div id="root">
  //   <div id="a">
  //     <div id="b">
  //       <div id="e-instance1">
  //     <div id="c">
  //       <div id="e-instance2">
  //     <div id="d">
  //       <div id="e-instance2">
  const instances = e.pdomInstances;
  assert.ok(e.pdomInstances.length === 3, 'node e should have 3 accessible instances');
  assert.ok(instances[0].peer.primarySibling.id !== instances[1].peer.primarySibling.id && instances[1].peer.primarySibling.id !== instances[2].peer.primarySibling.id && instances[0].peer.primarySibling.id !== instances[2].peer.primarySibling.id, 'each dom element should be unique');
  assert.ok(document.getElementById(instances[0].peer.primarySibling.id), 'peer primarySibling 0 should be in the DOM');
  assert.ok(document.getElementById(instances[1].peer.primarySibling.id), 'peer primarySibling 1 should be in the DOM');
  assert.ok(document.getElementById(instances[2].peer.primarySibling.id), 'peer primarySibling 2 should be in the DOM');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('replaceChild', assert => {
  // this suite involves focus tests which do not work on headless puppeteer
  if (!document.hasFocus()) {
    assert.ok(true, 'Unable to run focus tests if document does not have focus.');
  } else {
    // test the behavior of replaceChild function
    const rootNode = new Node({
      tagName: 'div'
    });
    var display = new Display(rootNode); // eslint-disable-line no-var
    document.body.appendChild(display.domElement);
    display.initializeEvents();

    // create some nodes for testing
    const a = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });
    const b = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });
    const c = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });
    const d = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });
    const e = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });
    const f = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });

    // a child that will be added through replaceChild()
    const testNode = new Node({
      tagName: 'button',
      focusHighlight: focusHighlight
    });

    // make sure replaceChild puts the child in the right spot
    a.children = [b, c, d, e, f];
    const initIndex = a.indexOfChild(e);
    a.replaceChild(e, testNode);
    const afterIndex = a.indexOfChild(testNode);
    assert.ok(a.hasChild(testNode), 'a should have child testNode after it replaced node e');
    assert.ok(!a.hasChild(e), 'a should no longer have child node e after it was replaced by testNode');
    assert.ok(initIndex === afterIndex, 'testNode should be at the same place as e was after replaceChild');

    // create a scene graph to test how scenery manages focus
    //    a
    //   / \
    //  f   b
    //     / \
    //    c   d
    //     \ /
    //      e
    a.removeAllChildren();
    rootNode.addChild(a);
    a.children = [f, b];
    b.children = [c, d];
    c.addChild(e);
    d.addChild(e);
    f.focus();
    assert.ok(f.focused, 'f has focus before being replaced');

    // replace f with testNode, ensure that testNode receives focus after replacing
    a.replaceChild(f, testNode);
    assert.ok(!a.hasChild(f), 'a should no longer have child f');
    assert.ok(a.hasChild(testNode), 'a should now have child testNode');
    assert.ok(!f.focused, 'f no longer has focus after being replaced');
    assert.ok(testNode.focused, 'testNode has focus after replacing focused node f');
    assert.ok(testNode.pdomInstances[0].peer.primarySibling === document.activeElement, 'browser is focusing testNode');
    testNode.blur();
    assert.ok(!!testNode, 'testNode blurred before being replaced');

    // replace testNode with f after bluring testNode, neither should have focus after the replacement
    a.replaceChild(testNode, f);
    assert.ok(a.hasChild(f), 'node f should replace node testNode');
    assert.ok(!a.hasChild(testNode), 'testNode should no longer be a child of node a');
    assert.ok(!testNode.focused, 'testNode should not have focus after being replaced');
    assert.ok(!f.focused, 'f should not have focus after replacing testNode, testNode did not have focus');
    assert.ok(f.pdomInstances[0].peer.primarySibling !== document.activeElement, 'browser should not be focusing node f');

    // focus node d and replace with non-focusable testNode, neither should have focus since testNode is not focusable
    d.focus();
    testNode.focusable = false;
    assert.ok(d.focused, 'd has focus before being replaced');
    assert.ok(!testNode.focusable, 'testNode is not focusable before replacing node d');
    b.replaceChild(d, testNode);
    assert.ok(b.hasChild(testNode), 'testNode should be a child of node b after replacing with replaceChild');
    assert.ok(!b.hasChild(d), 'd should not be a child of b after it was replaced with replaceChild');
    assert.ok(!d.focused, 'd does not have focus after being replaced by testNode');
    assert.ok(!testNode.focused, 'testNode does not have focus after replacing node d (testNode is not focusable)');
    display.dispose();
    display.domElement.parentElement.removeChild(display.domElement);
  }
});
QUnit.test('pdomVisible', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);

  // test with a scene graph
  //       a
  //      / \
  //     b    c
  //        / | \
  //       d  e  f
  //           \ /
  //            g
  const a = new Node();
  const b = new Node();
  const c = new Node();
  const d = new Node();
  const e = new Node();
  const f = new Node();
  const g = new Node();
  rootNode.addChild(a);
  a.children = [b, c];
  c.children = [d, e, f];
  e.children = [g];
  f.children = [g];

  // give some accessible content
  a.tagName = 'div';
  b.tagName = 'button';
  e.tagName = 'div';
  g.tagName = 'button';

  // scenery should produce this accessible DOM tree
  // <div id="a">
  //   <button id="b">
  //   <div id="e">
  //      <button id="g1">
  //   <button id="g2">

  // get the accessible primary siblings - looking into pdomInstances for testing, there is no getter for primarySibling
  const divA = a.pdomInstances[0].peer.primarySibling;
  const buttonB = b.pdomInstances[0].peer.primarySibling;
  const divE = e.pdomInstances[0].peer.primarySibling;
  const buttonG1 = g.pdomInstances[0].peer.primarySibling;
  const buttonG2 = g.pdomInstances[1].peer.primarySibling;
  const divAChildren = divA.childNodes;
  const divEChildren = divE.childNodes;
  assert.ok(_.includes(divAChildren, buttonB), 'button B should be an immediate child of div A');
  assert.ok(_.includes(divAChildren, divE), 'div E should be an immediate child of div A');
  assert.ok(_.includes(divAChildren, buttonG2), 'button G2 should be an immediate child of div A');
  assert.ok(_.includes(divEChildren, buttonG1), 'button G1 should be an immediate child of div E');

  // make node B invisible for accessibility - it should should visible, but hidden from screen readers
  b.pdomVisible = false;
  assert.equal(b.visible, true, 'b should be visible after becoming hidden for screen readers');
  assert.equal(b.pdomVisible, false, 'b state should reflect it is hidden for screen readers');
  assert.equal(buttonB.hidden, true, 'buttonB should be hidden for screen readers');
  assert.equal(b.pdomDisplayed, false, 'pdomVisible=false, b should have no representation in the PDOM');
  b.pdomVisible = true;

  // make node B invisible - it should not be visible, and it should be hidden for screen readers
  b.visible = false;
  assert.equal(b.visible, false, 'state of node b is visible');
  assert.equal(buttonB.hidden, true, 'buttonB is hidden from screen readers after becoming invisible');
  assert.equal(b.pdomVisible, true, 'state of node b still reflects pdom visibility when invisible');
  assert.equal(b.pdomDisplayed, false, 'b invisible and should have no representation in the PDOM');
  b.visible = true;

  // make node f invisible - g's trail that goes through f should be invisible to AT, tcomhe child of c should remain pdomVisible
  f.visible = false;
  assert.equal(g.isPDOMVisible(), true, 'state of pdomVisible should remain true on node g');
  assert.ok(!buttonG1.hidden, 'buttonG1 (child of e) should not be hidden after parent node f made invisible (no accessible content on node f)');
  assert.equal(buttonG2.hidden, true, 'buttonG2 should be hidden after parent node f made invisible (no accessible content on node f)');
  assert.equal(g.pdomDisplayed, true, 'one parent still visible, g still has one PDOMInstance displayed in PDOM');
  f.visible = true;

  // make node c (no accessible content) invisible to screen, e should be hidden and g2 should be hidden
  c.pdomVisible = false;
  assert.equal(c.visible, true, 'c should still be visible after becoming invisible to screen readers');
  assert.equal(divE.hidden, true, 'div E should be hidden after parent node c (no accessible content) is made invisible to screen readers');
  assert.equal(buttonG2.hidden, true, 'buttonG2 should be hidden after ancestor node c (no accessible content) is made invisible to screen readers');
  assert.ok(!divA.hidden, 'div A should not have been hidden by making descendant c invisible to screen readers');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('inputValue', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'input',
    inputType: 'radio',
    inputValue: 'i am value'
  });
  rootNode.addChild(a);
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('value') === 'i am value', 'should have correct value');
  const differentValue = 'i am different value';
  a.inputValue = differentValue;
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('value') === differentValue, 'should have different value');
  rootNode.addChild(new Node({
    children: [a]
  }));
  aElement = a.pdomInstances[1].peer.primarySibling;
  assert.ok(aElement.getAttribute('value') === differentValue, 'should have the same different value');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('ariaValueText', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const ariaValueText = 'this is my value text';
  const a = new Node({
    tagName: 'input',
    ariaValueText: ariaValueText,
    inputType: 'range'
  });
  rootNode.addChild(a);
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('aria-valuetext') === ariaValueText, 'should have correct value text.');
  assert.ok(a.ariaValueText === ariaValueText, 'should have correct value text, getter');
  const differentValue = 'i am different value text';
  a.ariaValueText = differentValue;
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('aria-valuetext') === differentValue, 'should have different value text');
  assert.ok(a.ariaValueText === differentValue, 'should have different value text, getter');
  rootNode.addChild(new Node({
    children: [a]
  }));
  aElement = a.pdomInstances[1].peer.primarySibling;
  assert.ok(aElement.getAttribute('aria-valuetext') === differentValue, 'should have the same different value text after children moving');
  assert.ok(a.ariaValueText === differentValue, 'should have the same different value text after children moving, getter');
  a.tagName = 'div';
  aElement = a.pdomInstances[1].peer.primarySibling;
  assert.ok(aElement.getAttribute('aria-valuetext') === differentValue, 'value text as div');
  assert.ok(a.ariaValueText === differentValue, 'value text as div, getter');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('setPDOMAttribute', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    labelContent: 'hello'
  });
  rootNode.addChild(a);
  a.setPDOMAttribute('test', 'test1');
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('test') === 'test1', 'setPDOMAttribute for primary sibling');
  a.removePDOMAttribute('test');
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('test') === null, 'removePDOMAttribute for primary sibling');
  a.setPDOMAttribute('test', 'testValue');
  a.setPDOMAttribute('test', 'testValueLabel', {
    elementName: PDOMPeer.LABEL_SIBLING
  });
  const testBothAttributes = () => {
    aElement = getPrimarySiblingElementByNode(a);
    const aLabelElement = aElement.parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
    assert.ok(aElement.getAttribute('test') === 'testValue', 'setPDOMAttribute for primary sibling 2');
    assert.ok(aLabelElement.getAttribute('test') === 'testValueLabel', 'setPDOMAttribute for label sibling');
  };
  testBothAttributes();
  rootNode.removeChild(a);
  rootNode.addChild(new Node({
    children: [a]
  }));
  testBothAttributes();
  a.removePDOMAttribute('test', {
    elementName: PDOMPeer.LABEL_SIBLING
  });
  aElement = getPrimarySiblingElementByNode(a);
  const aLabelElement = aElement.parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(aElement.getAttribute('test') === 'testValue', 'removePDOMAttribute for label should not effect primary sibling ');
  assert.ok(aLabelElement.getAttribute('test') === null, 'removePDOMAttribute for label sibling');
  a.removePDOMAttributes();
  const attributeName = 'multiTest';
  a.setPDOMAttribute(attributeName, 'true', {
    asProperty: false
  });
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute(attributeName) === 'true', 'asProperty:false should set attribute');
  a.setPDOMAttribute(attributeName, false, {
    asProperty: true
  });
  assert.ok(!aElement.getAttribute(attributeName), 'asProperty:true should remove attribute');

  // @ts-expect-error for testing
  assert.equal(aElement[attributeName], false, 'asProperty:true should set property');
  const testAttributes = a.getPDOMAttributes().filter(a => a.attribute === attributeName);
  assert.ok(testAttributes.length === 1, 'asProperty change should alter the attribute, not add a new one.');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('pdomChecked', assert => {
  const rootNode = new Node();
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'input',
    inputType: 'radio',
    pdomChecked: true
  });
  rootNode.addChild(a);
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.checked, 'should be checked');
  a.pdomChecked = false;
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(!aElement.checked, 'should not be checked');
  a.inputType = 'range';
  window.assert && assert.throws(() => {
    a.pdomChecked = true;
  }, /.*/, 'should fail if inputType range');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('swapVisibility', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }

  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  display.initializeEvents();

  // a custom focus highlight (since dummy node's have no bounds)
  const focusHighlight = new Rectangle(0, 0, 10, 10);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button',
    focusHighlight: focusHighlight
  });
  const b = new Node({
    tagName: 'button',
    focusHighlight: focusHighlight
  });
  const c = new Node({
    tagName: 'button',
    focusHighlight: focusHighlight
  });
  rootNode.addChild(a);
  a.children = [b, c];

  // swap visibility between two nodes, visibility should be swapped and neither should have keyboard focus
  b.visible = true;
  c.visible = false;
  b.swapVisibility(c);
  assert.equal(b.visible, false, 'b should now be invisible');
  assert.equal(c.visible, true, 'c should now be visible');
  assert.equal(b.focused, false, 'b should not have focus after being made invisible');
  assert.equal(c.focused, false, 'c should not have  focus since b did not have focus');

  // swap visibility between two nodes where the one that is initially visible has keyboard focus, the newly visible
  // node then receive focus
  b.visible = true;
  c.visible = false;
  b.focus();
  b.swapVisibility(c);
  assert.equal(b.visible, false, 'b should be invisible after swapVisibility');
  assert.equal(c.visible, true, 'c should be visible after  swapVisibility');
  assert.equal(b.focused, false, 'b should no longer have focus  after swapVisibility');
  assert.equal(c.focused, true, 'c should now have focus after swapVisibility');

  // swap visibility between two nodes where the one that is initially visible has keyboard focus, the newly visible
  // node then receive focus - like the previous test but c.swapVisibility( b ) is the same as b.swapVisibility( c )
  b.visible = true;
  c.visible = false;
  b.focus();
  b.swapVisibility(c);
  assert.equal(b.visible, false, 'b should be invisible after swapVisibility');
  assert.equal(c.visible, true, 'c should be visible after  swapVisibility');
  assert.equal(b.focused, false, 'b should no longer have focus  after swapVisibility');
  assert.equal(c.focused, true, 'c should now have focus after swapVisibility');

  // swap visibility between two nodes where the first node has focus, but the second node is not focusable. After
  // swapping, neither should have focus
  b.visible = true;
  c.visible = false;
  b.focus();
  c.focusable = false;
  b.swapVisibility(c);
  assert.equal(b.visible, false, 'b should be invisible after visibility is swapped');
  assert.equal(c.visible, true, 'c should be visible after visibility is swapped');
  assert.equal(b.focused, false, 'b should no longer have focus after visibility is swapped');
  assert.equal(c.focused, false, 'c should not have focus after visibility is swapped because it is not focusable');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('Aria Label Setter', assert => {
  // test the behavior of swapVisibility function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // create some nodes for testing
  const a = new Node({
    tagName: 'button',
    ariaLabel: TEST_LABEL_2
  });
  assert.ok(a.ariaLabel === TEST_LABEL_2, 'aria-label getter/setter');
  assert.ok(a.labelContent === null, 'no other label set with aria-label');
  assert.ok(a.innerContent === null, 'no inner content set with aria-label');
  rootNode.addChild(a);
  let buttonA = a.pdomInstances[0].peer.primarySibling;
  assert.ok(buttonA.getAttribute('aria-label') === TEST_LABEL_2, 'setter on dom element');
  assert.ok(buttonA.innerHTML === '', 'no inner html with aria-label setter');
  a.ariaLabel = null;
  buttonA = a.pdomInstances[0].peer.primarySibling;
  assert.ok(!buttonA.hasAttribute('aria-label'), 'setter can clear on dom element');
  assert.ok(buttonA.innerHTML === '', 'no inner html with aria-label setter when clearing');
  assert.ok(a.ariaLabel === null, 'cleared in Node model.');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('focusable option', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }

  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  display.initializeEvents();
  const a = new Node({
    tagName: 'div',
    focusable: true
  });
  rootNode.addChild(a);
  assert.equal(a.focusable, true, 'focusable option setter');
  assert.ok(getPrimarySiblingElementByNode(a).tabIndex === 0, 'tab index on primary sibling with setter');

  // change the tag name, but focusable should stay the same
  a.tagName = 'p';
  assert.equal(a.focusable, true, 'tagName option should not change focusable value');
  assert.ok(getPrimarySiblingElementByNode(a).tabIndex === 0, 'tagName option should not change tab index on primary sibling');
  a.focusable = false;
  assert.ok(getPrimarySiblingElementByNode(a).tabIndex === -1, 'set focusable false');
  const b = new Node({
    tagName: 'p'
  });
  rootNode.addChild(b);
  b.focusable = true;
  assert.ok(b.focusable, 'set focusable as setter');
  assert.ok(getPrimarySiblingElementByNode(b).tabIndex === 0, 'set focusable as setter');

  // HTML elements that are natively focusable are focusable by default
  const c = new Node({
    tagName: 'button'
  });
  assert.ok(c.focusable, 'button is focusable by default');

  // change tagName to something that is not focusable, focusable should be false
  c.tagName = 'p';
  assert.ok(!c.focusable, 'button changed to paragraph, should no longer be focusable');

  // When focusable is set to null on an element that is not focusable by default, it should lose focus
  const d = new Node({
    tagName: 'div',
    focusable: true,
    focusHighlight: focusHighlight
  });
  rootNode.addChild(d);
  d.focus();
  assert.ok(d.focused, 'focusable div should be focused after calling focus()');
  d.focusable = null;
  assert.ok(!d.focused, 'default div should lose focus after node restored to null focusable');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('append siblings/appendLabel/appendDescription setters', assert => {
  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'li',
    innerContent: TEST_INNER_CONTENT,
    labelTagName: 'h3',
    labelContent: TEST_LABEL,
    descriptionContent: TEST_DESCRIPTION,
    containerTagName: 'section',
    appendLabel: true
  });
  rootNode.addChild(a);
  const aElement = getPrimarySiblingElementByNode(a);
  let containerElement = aElement.parentElement;
  assert.ok(containerElement.tagName.toUpperCase() === 'SECTION', 'container parent is set to right tag');
  let peerElements = containerElement.childNodes;
  assert.ok(peerElements.length === 3, 'expected three siblings');
  assert.ok(peerElements[0].tagName.toUpperCase() === DEFAULT_DESCRIPTION_TAG_NAME, 'description first sibling');
  assert.ok(peerElements[1].tagName.toUpperCase() === 'LI', 'primary sibling second sibling');
  assert.ok(peerElements[2].tagName.toUpperCase() === 'H3', 'label sibling last');
  a.appendDescription = true;
  containerElement = getPrimarySiblingElementByNode(a).parentElement;
  peerElements = containerElement.childNodes;
  assert.ok(containerElement.childNodes.length === 3, 'expected three siblings');
  assert.ok(peerElements[0].tagName.toUpperCase() === 'LI', 'primary sibling first sibling');
  assert.ok(peerElements[1].tagName.toUpperCase() === 'H3', 'label sibling second');
  assert.ok(peerElements[2].tagName.toUpperCase() === DEFAULT_DESCRIPTION_TAG_NAME, 'description last sibling');

  // clear it out back to defaults should work with setters
  a.appendDescription = false;
  a.appendLabel = false;
  containerElement = getPrimarySiblingElementByNode(a).parentElement;
  peerElements = containerElement.childNodes;
  assert.ok(containerElement.childNodes.length === 3, 'expected three siblings');
  assert.ok(peerElements[0].tagName.toUpperCase() === 'H3', 'label sibling first');
  assert.ok(peerElements[1].tagName.toUpperCase() === DEFAULT_DESCRIPTION_TAG_NAME, 'description sibling second');
  assert.ok(peerElements[2].tagName.toUpperCase() === 'LI', 'primary sibling last');

  // test order when using appendLabel/appendDescription without a parent container - order should be primary sibling,
  // label sibling, description sibling
  const b = new Node({
    tagName: 'input',
    inputType: 'checkbox',
    labelTagName: 'label',
    labelContent: TEST_LABEL,
    descriptionContent: TEST_DESCRIPTION,
    appendLabel: true,
    appendDescription: true
  });
  rootNode.addChild(b);
  let bPeer = getPDOMPeerByNode(b);
  let bElement = getPrimarySiblingElementByNode(b);
  let bElementParent = bElement.parentElement;
  let indexOfPrimaryElement = Array.prototype.indexOf.call(bElementParent.childNodes, bElement);
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement] === bElement, 'b primary sibling first with no container, both appended');
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement + 1] === bPeer.labelSibling, 'b label sibling second with no container, both appended');
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement + 2] === bPeer.descriptionSibling, 'b description sibling third with no container, both appended');

  // test order when only description appended and no parent container - order should be label, primary, then
  // description
  b.appendLabel = false;

  // refresh since operation may have created new Objects
  bPeer = getPDOMPeerByNode(b);
  bElement = getPrimarySiblingElementByNode(b);
  bElementParent = bElement.parentElement;
  indexOfPrimaryElement = Array.prototype.indexOf.call(bElementParent.childNodes, bElement);
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement - 1] === bPeer.labelSibling, 'b label sibling first with no container, description appended');
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement] === bElement, 'b primary sibling second with no container, description appended');
  assert.ok(bElementParent.childNodes[indexOfPrimaryElement + 1] === bPeer.descriptionSibling, 'b description sibling third with no container, description appended');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('containerAriaRole option', assert => {
  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    containerTagName: 'div',
    containerAriaRole: 'application'
  });
  rootNode.addChild(a);
  assert.ok(a.containerAriaRole === 'application', 'role attribute should be on node property');
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.parentElement.getAttribute('role') === 'application', 'role attribute should be on parent element');
  a.containerAriaRole = null;
  assert.ok(a.containerAriaRole === null, 'role attribute should be cleared on node');
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.parentElement.getAttribute('role') === null, 'role attribute should be cleared on parent element');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('ariaRole option', assert => {
  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    innerContent: 'Draggable',
    ariaRole: 'application'
  });
  rootNode.addChild(a);
  assert.ok(a.ariaRole === 'application', 'role attribute should be on node property');
  let aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('role') === 'application', 'role attribute should be on element');
  a.ariaRole = null;
  assert.ok(a.ariaRole === null, 'role attribute should be cleared on node');
  aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.getAttribute('role') === null, 'role attribute should be cleared on element');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});

// Higher level setter/getter options
QUnit.test('accessibleName option', assert => {
  assert.ok(true);

  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    accessibleName: TEST_LABEL
  });
  rootNode.addChild(a);
  assert.ok(a.accessibleName === TEST_LABEL, 'accessibleName getter');
  const aElement = getPrimarySiblingElementByNode(a);
  assert.ok(aElement.textContent === TEST_LABEL, 'accessibleName setter on div');
  const b = new Node({
    tagName: 'input',
    accessibleName: TEST_LABEL,
    inputType: 'range'
  });
  a.addChild(b);
  const bElement = getPrimarySiblingElementByNode(b);
  const bParent = getPrimarySiblingElementByNode(b).parentElement;
  const bLabelSibling = bParent.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(bLabelSibling.textContent === TEST_LABEL, 'accessibleName sets label sibling');
  assert.ok(bLabelSibling.getAttribute('for').includes(bElement.id), 'accessibleName sets label\'s "for" attribute');
  const c = new Node({
    containerTagName: 'div',
    tagName: 'div',
    ariaLabel: 'overrideThis'
  });
  rootNode.addChild(c);
  const cAccessibleNameBehavior = (node, options, accessibleName) => {
    options.ariaLabel = accessibleName;
    return options;
  };
  c.accessibleNameBehavior = cAccessibleNameBehavior;
  assert.ok(c.accessibleNameBehavior === cAccessibleNameBehavior, 'getter works');
  let cLabelElement = getPrimarySiblingElementByNode(c).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(cLabelElement.getAttribute('aria-label') === 'overrideThis', 'accessibleNameBehavior should not work until there is accessible name');
  c.accessibleName = 'accessible name description';
  cLabelElement = getPrimarySiblingElementByNode(c).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(cLabelElement.getAttribute('aria-label') === 'accessible name description', 'accessible name setter');
  c.accessibleName = '';
  cLabelElement = getPrimarySiblingElementByNode(c).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(cLabelElement.getAttribute('aria-label') === '', 'accessibleNameBehavior should work for empty string');
  c.accessibleName = null;
  cLabelElement = getPrimarySiblingElementByNode(c).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(cLabelElement.getAttribute('aria-label') === 'overrideThis', 'accessibleNameBehavior should not work until there is accessible name');
  const d = new Node({
    containerTagName: 'div',
    tagName: 'div'
  });
  rootNode.addChild(d);
  const dAccessibleNameBehavior = (node, options, accessibleName) => {
    options.ariaLabel = accessibleName;
    return options;
  };
  d.accessibleNameBehavior = dAccessibleNameBehavior;
  assert.ok(d.accessibleNameBehavior === dAccessibleNameBehavior, 'getter works');
  let dLabelElement = getPrimarySiblingElementByNode(d).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(dLabelElement.getAttribute('aria-label') === null, 'accessibleNameBehavior should not work until there is accessible name');
  const accessibleNameDescription = 'accessible name description';
  d.accessibleName = accessibleNameDescription;
  dLabelElement = getPrimarySiblingElementByNode(d).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(dLabelElement.getAttribute('aria-label') === accessibleNameDescription, 'accessible name setter');
  d.accessibleName = '';
  dLabelElement = getPrimarySiblingElementByNode(d).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(dLabelElement.getAttribute('aria-label') === '', 'accessibleNameBehavior should work for empty string');
  d.accessibleName = null;
  dLabelElement = getPrimarySiblingElementByNode(d).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(dLabelElement.getAttribute('aria-label') === null, 'accessibleNameBehavior should not work until there is accessible name');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('pdomHeading option', assert => {
  assert.ok(true);

  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const a = new Node({
    tagName: 'div',
    pdomHeading: TEST_LABEL,
    containerTagName: 'div'
  });
  rootNode.addChild(a);
  assert.ok(a.pdomHeading === TEST_LABEL, 'accessibleName getter');
  const aLabelSibling = getPrimarySiblingElementByNode(a).parentElement.children[DEFAULT_LABEL_SIBLING_INDEX];
  assert.ok(aLabelSibling.textContent === TEST_LABEL, 'pdomHeading setter on div');
  assert.ok(aLabelSibling.tagName === 'H1', 'pdomHeading setter should be h1');
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('helpText option', assert => {
  assert.ok(true);

  // test the behavior of focusable function
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);

  // label tag needed for default sibling indices to work
  const a = new Node({
    containerTagName: 'div',
    tagName: 'div',
    labelTagName: 'div',
    helpText: TEST_DESCRIPTION
  });
  rootNode.addChild(a);
  rootNode.addChild(new Node({
    tagName: 'input',
    inputType: 'range'
  }));
  assert.ok(a.helpText === TEST_DESCRIPTION, 'helpText getter');

  // default for help text is to append description after the primary sibling
  const aDescriptionElement = getPrimarySiblingElementByNode(a).parentElement.children[APPENDED_DESCRIPTION_SIBLING_INDEX];
  assert.ok(aDescriptionElement.textContent === TEST_DESCRIPTION, 'helpText setter on div');
  const b = new Node({
    containerTagName: 'div',
    tagName: 'button',
    descriptionContent: 'overrideThis',
    labelTagName: 'div'
  });
  rootNode.addChild(b);
  b.helpTextBehavior = (node, options, helpText) => {
    options.descriptionTagName = 'p';
    options.descriptionContent = helpText;
    return options;
  };
  let bDescriptionElement = getPrimarySiblingElementByNode(b).parentElement.children[DEFAULT_DESCRIPTION_SIBLING_INDEX];
  assert.ok(bDescriptionElement.textContent === 'overrideThis', 'helpTextBehavior should not work until there is help text');
  b.helpText = 'help text description';
  bDescriptionElement = getPrimarySiblingElementByNode(b).parentElement.children[DEFAULT_DESCRIPTION_SIBLING_INDEX];
  assert.ok(bDescriptionElement.textContent === 'help text description', 'help text setter');
  b.helpText = '';
  bDescriptionElement = getPrimarySiblingElementByNode(b).parentElement.children[DEFAULT_DESCRIPTION_SIBLING_INDEX];
  assert.ok(bDescriptionElement.textContent === '', 'helpTextBehavior should work for empty string');
  b.helpText = null;
  bDescriptionElement = getPrimarySiblingElementByNode(b).parentElement.children[DEFAULT_DESCRIPTION_SIBLING_INDEX];
  assert.ok(bDescriptionElement.textContent === 'overrideThis', 'helpTextBehavior should not work until there is help text');
  pdomAuditRootNode(rootNode);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('move to front/move to back', assert => {
  if (!canRunTests) {
    assert.ok(true, 'Skipping test because document does not have focus');
    return;
  }

  // make sure state is restored after moving children to front and back
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  document.body.appendChild(display.domElement);
  display.initializeEvents();
  const a = new Node({
    tagName: 'button',
    focusHighlight: TEST_HIGHLIGHT
  });
  const b = new Node({
    tagName: 'button',
    focusHighlight: TEST_HIGHLIGHT
  });
  rootNode.children = [a, b];
  b.focus();

  // after moving a to front, b should still have focus
  a.moveToFront();
  assert.ok(b.focused, 'b should have focus after a moved to front');

  // after moving a to back, b should still have focus
  a.moveToBack();

  // add a guard where we don't check this if focus has been moved somewhere else. This happens sometimes with
  // dev tools or other windows opened, see https://github.com/phetsims/scenery/issues/827
  if (document.body.contains(document.activeElement) && document.body !== document.activeElement) {
    assert.ok(b.focused, 'b should have focus after a moved to back');
  }
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});
QUnit.test('Node.enabledProperty with PDOM', assert => {
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  document.body.appendChild(display.domElement);
  const pdomNode = new Node({
    tagName: 'p'
  });
  rootNode.addChild(pdomNode);
  assert.ok(pdomNode.pdomInstances.length === 1, 'should have an instance when attached to display');
  assert.ok(!!pdomNode.pdomInstances[0].peer, 'should have a peer');
  assert.ok(pdomNode.pdomInstances[0].peer.primarySibling.getAttribute('aria-disabled') !== 'true', 'should be enabled to start');
  pdomNode.enabled = false;
  assert.ok(pdomNode.pdomInstances[0].peer.primarySibling.getAttribute('aria-disabled') === 'true', 'should be aria-disabled when disabled');
  pdomNode.enabled = true;
  assert.ok(pdomNode.pdomInstances[0].peer.primarySibling.getAttribute('aria-disabled') === 'false', 'Actually set to false since it was previously disabled.');
  pdomNode.dispose;
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});

// these fuzzers take time, so it is nice when they are last
QUnit.test('Display.interactive toggling in the PDOM', assert => {
  const rootNode = new Node({
    tagName: 'div'
  });
  var display = new Display(rootNode); // eslint-disable-line no-var
  display.initializeEvents();
  document.body.appendChild(display.domElement);
  const pdomRangeChild = new Node({
    tagName: 'input',
    inputType: 'range'
  });
  const pdomParagraphChild = new Node({
    tagName: 'p'
  });
  const pdomButtonChild = new Node({
    tagName: 'button'
  });
  const pdomParent = new Node({
    tagName: 'button',
    children: [pdomRangeChild, pdomParagraphChild, pdomButtonChild]
  });
  const DISABLED_TRUE = true;

  // For of list of html elements that support disabled, see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
  const DEFAULT_DISABLED_WHEN_SUPPORTED = false;
  const DEFAULT_DISABLED_WHEN_NOT_SUPPORTED = undefined;
  rootNode.addChild(pdomParent);
  assert.ok(true, 'initial case');
  const testDisabled = (node, disabled, message, pdomInstance = 0) => {
    // @ts-expect-error "disabled" is only supported by certain attributes, see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
    assert.ok(node.pdomInstances[pdomInstance].peer.primarySibling.disabled === disabled, message);
  };
  testDisabled(pdomParent, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParent initial no disabled');
  testDisabled(pdomRangeChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomRangeChild initial no disabled');
  testDisabled(pdomParagraphChild, DEFAULT_DISABLED_WHEN_NOT_SUPPORTED, 'pdomParagraphChild initial no disabled');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild initial no disabled');
  display.interactive = false;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent toggled not interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild toggled not interactive');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild toggled not interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild toggled not interactive');
  display.interactive = true;
  testDisabled(pdomParent, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParent toggled back to interactive');
  testDisabled(pdomRangeChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomRangeChild toggled back to interactive');
  testDisabled(pdomParagraphChild, DEFAULT_DISABLED_WHEN_NOT_SUPPORTED, 'pdomParagraphChild toggled back to interactive');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild toggled back to interactive');
  display.interactive = false;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent second toggled not interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild second toggled not interactive');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild second toggled not interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild second toggled not interactive');
  pdomParent.setPDOMAttribute('disabled', true, {
    asProperty: true
  });
  pdomRangeChild.setPDOMAttribute('disabled', true, {
    asProperty: true
  });
  pdomParagraphChild.setPDOMAttribute('disabled', true, {
    asProperty: true
  });
  pdomButtonChild.setPDOMAttribute('disabled', true, {
    asProperty: true
  });
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent not interactive after setting disabled manually as property, display not interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild not interactive after setting disabled manually as property, display not interactive');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild not interactive after setting disabled manually as property, display not interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild not interactive after setting disabled manually as property, display not interactive');
  display.interactive = true;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent not interactive after setting disabled manually as property display interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild not interactive after setting disabled manually as property display interactive');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild not interactive after setting disabled manually as property display interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild not interactive after setting disabled manually as property display interactive');
  display.interactive = false;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent still disabled when display is not interactive again.');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild still disabled when display is not interactive again.');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild still disabled when display is not interactive again.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild still disabled when display is not interactive again.');
  pdomParent.removePDOMAttribute('disabled');
  pdomRangeChild.removePDOMAttribute('disabled');
  pdomParagraphChild.removePDOMAttribute('disabled');
  pdomButtonChild.removePDOMAttribute('disabled');
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent still disabled from display not interactive after local property removed.');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild still disabled from display not interactive after local property removed.');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild still disabled from display not interactive after local property removed.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild still disabled from display not interactive after local property removed.');
  display.interactive = true;
  testDisabled(pdomParent, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParent interactive now without local property.');
  testDisabled(pdomRangeChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomRangeChild interactive now without local property.');
  testDisabled(pdomParagraphChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParagraphChild interactive now without local property.');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild interactive now without local property.');
  pdomParent.setPDOMAttribute('disabled', '');
  pdomRangeChild.setPDOMAttribute('disabled', '');
  pdomParagraphChild.setPDOMAttribute('disabled', '');
  pdomButtonChild.setPDOMAttribute('disabled', '');
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent not interactive after setting disabled manually as attribute, display not interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild not interactive after setting disabled manually as attribute, display not interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild not interactive after setting disabled manually as attribute, display not interactive');
  display.interactive = true;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent not interactive after setting disabled manually as attribute display interactive');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild not interactive after setting disabled manually as attribute display interactive');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild not interactive after setting disabled manually as attribute display interactive');

  // This test doesn't work, because paragraphs don't support disabled, so the attribute "disabled" won't
  // automatically transfer over to the property value like for the others. For a list of Elements that support "disabled", see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
  // testDisabled( pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild not interactive after setting disabled manually as attribute, display  interactive' );

  display.interactive = false;
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent still disabled when display is not interactive again.');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild still disabled when display is not interactive again.');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild still disabled when display is not interactive again.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild still disabled when display is not interactive again.');
  pdomParent.removePDOMAttribute('disabled');
  pdomRangeChild.removePDOMAttribute('disabled');
  pdomParagraphChild.removePDOMAttribute('disabled');
  pdomButtonChild.removePDOMAttribute('disabled');
  testDisabled(pdomParent, DISABLED_TRUE, 'pdomParent still disabled from display not interactive after local attribute removed.');
  testDisabled(pdomRangeChild, DISABLED_TRUE, 'pdomRangeChild still disabled from display not interactive after local attribute removed.');
  testDisabled(pdomParagraphChild, DISABLED_TRUE, 'pdomParagraphChild still disabled from display not interactive after local attribute removed.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild still disabled from display not interactive after local attribute removed.');
  display.interactive = true;
  testDisabled(pdomParent, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParent interactive now without local attribute.');
  testDisabled(pdomRangeChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomRangeChild interactive now without local attribute.');
  testDisabled(pdomParagraphChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomParagraphChild interactive now without local attribute.');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild interactive now without local attribute.');
  const containerOfDAGButton = new Node({
    children: [pdomButtonChild]
  });
  pdomParent.addChild(containerOfDAGButton);
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild default not disabled.');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild default not disabled with dag.', 1);
  display.interactive = false;
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled with dag.', 1);
  pdomButtonChild.setPDOMAttribute('disabled', true, {
    asProperty: true
  });
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled set property too.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled set property too, with dag.', 1);
  display.interactive = true;
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned not disabled set property too.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned not disabled set property too, with dag.', 1);
  display.interactive = false;
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled again.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild turned disabled again, with dag.', 1);
  pdomButtonChild.removePDOMAttribute('disabled');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild remove disabled while not interactive.');
  testDisabled(pdomButtonChild, DISABLED_TRUE, 'pdomButtonChild remove disabled while not interactive, with dag.', 1);
  display.interactive = true;
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild default not disabled after interactive again.');
  testDisabled(pdomButtonChild, DEFAULT_DISABLED_WHEN_SUPPORTED, 'pdomButtonChild default not disabled after interactive again with dag.', 1);
  display.dispose();
  display.domElement.parentElement.removeChild(display.domElement);
});

// these fuzzers take time, so it is nice when they are last
QUnit.test('PDOMFuzzer with 3 nodes', assert => {
  const fuzzer = new PDOMFuzzer(3, false);
  for (let i = 0; i < 5000; i++) {
    fuzzer.step();
  }
  assert.expect(0);
  fuzzer.dispose();
});
QUnit.test('PDOMFuzzer with 4 nodes', assert => {
  const fuzzer = new PDOMFuzzer(4, false);
  for (let i = 0; i < 1000; i++) {
    fuzzer.step();
  }
  assert.expect(0);
  fuzzer.dispose();
});
QUnit.test('PDOMFuzzer with 5 nodes', assert => {
  const fuzzer = new PDOMFuzzer(5, false);
  for (let i = 0; i < 300; i++) {
    fuzzer.step();
  }
  assert.expect(0);
  fuzzer.dispose();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaXNwbGF5IiwiQ2lyY2xlIiwiTm9kZSIsIlJlY3RhbmdsZSIsIlBET01GdXp6ZXIiLCJQRE9NUGVlciIsIlBET01VdGlscyIsIlRFU1RfSU5ORVJfQ09OVEVOVCIsIlRFU1RfTEFCRUwiLCJURVNUX0xBQkVMXzIiLCJURVNUX0RFU0NSSVBUSU9OIiwiVEVTVF9MQUJFTF9IVE1MIiwiVEVTVF9MQUJFTF9IVE1MXzIiLCJURVNUX0RFU0NSSVBUSU9OX0hUTUwiLCJURVNUX0RFU0NSSVBUSU9OX0hUTUxfMiIsIlRFU1RfQ0xBU1NfT05FIiwiVEVTVF9DTEFTU19UV08iLCJERUZBVUxUX0xBQkVMX1RBR19OQU1FIiwiREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRSIsIkRFRkFVTFRfTEFCRUxfU0lCTElOR19JTkRFWCIsIkRFRkFVTFRfREVTQ1JJUFRJT05fU0lCTElOR19JTkRFWCIsIkFQUEVOREVEX0RFU0NSSVBUSU9OX1NJQkxJTkdfSU5ERVgiLCJURVNUX0hJR0hMSUdIVCIsImZvY3VzSGlnaGxpZ2h0IiwiY2FuUnVuVGVzdHMiLCJRVW5pdCIsIm1vZHVsZSIsImJlZm9yZUVhY2giLCJkb2N1bWVudCIsImhhc0ZvY3VzIiwiY29uc29sZSIsIndhcm4iLCJnZXRQRE9NUGVlckJ5Tm9kZSIsIm5vZGUiLCJwZG9tSW5zdGFuY2VzIiwibGVuZ3RoIiwiRXJyb3IiLCJwZWVyIiwiZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlIiwidW5pcXVlUGVlciIsImdldEVsZW1lbnRCeUlkIiwicHJpbWFyeVNpYmxpbmciLCJpZCIsInBkb21BdWRpdFJvb3ROb2RlIiwicm9vdE5vZGUiLCJwZG9tQXVkaXQiLCJ0ZXN0IiwiYXNzZXJ0IiwidGFnTmFtZSIsImRpc3BsYXkiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJkb21FbGVtZW50IiwiYSIsImlubmVyQ29udGVudCIsImFkZENoaWxkIiwiYUVsZW1lbnQiLCJvayIsInBhcmVudEVsZW1lbnQiLCJjaGlsZE5vZGVzIiwidGV4dENvbnRlbnQiLCJpbm5lckhUTUwiLCJiIiwiaW5wdXRUeXBlIiwid2luZG93IiwidGhyb3dzIiwiZGlzcG9zZSIsInJlbW92ZUNoaWxkIiwiY29udGFpbmVyUGFyZW50IiwiY2hpbGRyZW4iLCJjb250YWluZXJUYWdOYW1lIiwiaW5jbHVkZXMiLCJsYWJlbENvbnRlbnQiLCJsYWJlbFNpYmxpbmciLCJuZXdBRWxlbWVudCIsIm5ld0xhYmVsU2libGluZyIsImxhYmVsVGFnTmFtZSIsImJMYWJlbEVsZW1lbnQiLCJnZXRBdHRyaWJ1dGUiLCJjIiwiY0xhYmVsRWxlbWVudCIsImQiLCJiRWxlbWVudCIsImNQZWVyIiwiZFBlZXIiLCJjb25maXJtT3JpZ2luYWxPcmRlciIsImUiLCJkZXNjcmlwdGlvbkNvbnRlbnQiLCJlUGVlciIsImNvbmZpcm1PcmlnaW5hbFdpdGhFIiwiZGVzY3JpcHRpb25TaWJsaW5nIiwiZGVzY3JpcHRpb25UYWdOYW1lIiwiYnV0dG9uTm9kZSIsImZvY3VzYWJsZSIsImFyaWFSb2xlIiwiZGl2Tm9kZSIsImFyaWFMYWJlbCIsInBkb21WaXNpYmxlIiwidG9VcHBlckNhc2UiLCJlcXVhbCIsImJ1dHRvbkVsZW1lbnQiLCJidXR0b25QYXJlbnQiLCJwYXJlbnROb2RlIiwiYnV0dG9uUGVlcnMiLCJidXR0b25MYWJlbCIsImJ1dHRvbkRlc2NyaXB0aW9uIiwiZGl2RWxlbWVudCIsInBEZXNjcmlwdGlvbiIsInRhYkluZGV4IiwiaGlkZGVuIiwidGVzdEFzc29jaWF0aW9uQXR0cmlidXRlIiwiYXR0cmlidXRlIiwiYWRkQXNzb2NpYXRpb25GdW5jdGlvbiIsInNldFBET01BdHRyaWJ1dGUiLCJvdGhlck5vZGUiLCJ0aGlzRWxlbWVudE5hbWUiLCJQUklNQVJZX1NJQkxJTkciLCJvdGhlckVsZW1lbnROYW1lIiwiY0VsZW1lbnQiLCJleHBlY3RlZFZhbHVlIiwiam9pbiIsIm9sZFZhbHVlIiwiQ09OVEFJTkVSX1BBUkVOVCIsIkRFU0NSSVBUSU9OX1NJQkxJTkciLCJiUGFyZW50Q29udGFpbmVyIiwiZERlc2NyaXB0aW9uRWxlbWVudCIsImYiLCJnIiwiaCIsImVFbGVtZW50IiwiZkVsZW1lbnQiLCJnRWxlbWVudCIsImhFbGVtZW50IiwiaiIsIkxBQkVMX1NJQkxJTkciLCJjaGVja09uWW91ck93bkFzc29jaWF0aW9ucyIsImluc3RhbmNlIiwibm9kZVByaW1hcnlFbGVtZW50Iiwibm9kZVBhcmVudCIsImdldFVuaXF1ZUlkU3RyaW5nRm9yU2libGluZyIsInNpYmxpbmdTdHJpbmciLCJnZXRFbGVtZW50SWQiLCJnZXRQRE9NSW5zdGFuY2VVbmlxdWVJZCIsImsiLCJ0ZXN0SyIsImtWYWx1ZSIsImpJRCIsImpQYXJlbnQiLCJqUGFyZW50MiIsImluc2VydENoaWxkIiwidGVzdEFzc29jaWF0aW9uQXR0cmlidXRlQnlTZXR0ZXJzIiwiYXNzb2NpYXRpb25zQXJyYXlOYW1lIiwiYXNzb2NpYXRpb25SZW1vdmFsRnVuY3Rpb24iLCJvcHRpb25zIiwibiIsIm8iLCJuUGVlciIsIm9FbGVtZW50IiwicGRvbUluc3RhbmNlIiwicmFuZG9tQXNzb2NpYXRpb25PYmplY3QiLCJtIiwiXyIsImlzRXF1YWwiLCJzcGxpY2UiLCJpbmRleE9mIiwiYTEiLCJhMUVsZW1lbnQiLCJhcHBlbmRMYWJlbCIsImFwcGVuZERlc2NyaXB0aW9uIiwibmV3QnV0dG9uUGVlcnMiLCJlbGVtZW50SW5Eb20iLCJpbml0aWFsTGVuZ3RoIiwiZ2V0UERPTUF0dHJpYnV0ZXMiLCJoYXNQRE9NQXR0cmlidXRlIiwicmVtb3ZlUERPTUF0dHJpYnV0ZSIsImFzUHJvcGVydHkiLCJzZXRQRE9NQ2xhc3MiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInJlbW92ZVBET01DbGFzcyIsInV0aWwiLCJpbml0aWFsaXplRXZlbnRzIiwicm9vdEVsZW1lbnQiLCJkRWxlbWVudCIsImZvY3VzIiwiYWN0aXZlRWxlbWVudCIsImdldE5leHRGb2N1c2FibGUiLCJnZXRQcmV2aW91c0ZvY3VzYWJsZSIsInJlbW92ZUFsbENoaWxkcmVuIiwicm9vdERPTUVsZW1lbnQiLCJkRE9NRWxlbWVudCIsImluc3RhbmNlcyIsInRlc3ROb2RlIiwiaW5pdEluZGV4IiwiaW5kZXhPZkNoaWxkIiwicmVwbGFjZUNoaWxkIiwiYWZ0ZXJJbmRleCIsImhhc0NoaWxkIiwiZm9jdXNlZCIsImJsdXIiLCJkaXZBIiwiYnV0dG9uQiIsImRpdkUiLCJidXR0b25HMSIsImJ1dHRvbkcyIiwiZGl2QUNoaWxkcmVuIiwiZGl2RUNoaWxkcmVuIiwidmlzaWJsZSIsInBkb21EaXNwbGF5ZWQiLCJpc1BET01WaXNpYmxlIiwiaW5wdXRWYWx1ZSIsImRpZmZlcmVudFZhbHVlIiwiYXJpYVZhbHVlVGV4dCIsImVsZW1lbnROYW1lIiwidGVzdEJvdGhBdHRyaWJ1dGVzIiwiYUxhYmVsRWxlbWVudCIsInJlbW92ZVBET01BdHRyaWJ1dGVzIiwiYXR0cmlidXRlTmFtZSIsInRlc3RBdHRyaWJ1dGVzIiwiZmlsdGVyIiwicGRvbUNoZWNrZWQiLCJjaGVja2VkIiwic3dhcFZpc2liaWxpdHkiLCJidXR0b25BIiwiaGFzQXR0cmlidXRlIiwiY29udGFpbmVyRWxlbWVudCIsInBlZXJFbGVtZW50cyIsImJQZWVyIiwiYkVsZW1lbnRQYXJlbnQiLCJpbmRleE9mUHJpbWFyeUVsZW1lbnQiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJjb250YWluZXJBcmlhUm9sZSIsImFjY2Vzc2libGVOYW1lIiwiYlBhcmVudCIsImJMYWJlbFNpYmxpbmciLCJjQWNjZXNzaWJsZU5hbWVCZWhhdmlvciIsImFjY2Vzc2libGVOYW1lQmVoYXZpb3IiLCJkQWNjZXNzaWJsZU5hbWVCZWhhdmlvciIsImRMYWJlbEVsZW1lbnQiLCJhY2Nlc3NpYmxlTmFtZURlc2NyaXB0aW9uIiwicGRvbUhlYWRpbmciLCJhTGFiZWxTaWJsaW5nIiwiaGVscFRleHQiLCJhRGVzY3JpcHRpb25FbGVtZW50IiwiaGVscFRleHRCZWhhdmlvciIsImJEZXNjcmlwdGlvbkVsZW1lbnQiLCJtb3ZlVG9Gcm9udCIsIm1vdmVUb0JhY2siLCJwZG9tTm9kZSIsImVuYWJsZWQiLCJwZG9tUmFuZ2VDaGlsZCIsInBkb21QYXJhZ3JhcGhDaGlsZCIsInBkb21CdXR0b25DaGlsZCIsInBkb21QYXJlbnQiLCJESVNBQkxFRF9UUlVFIiwiREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCIsIkRFRkFVTFRfRElTQUJMRURfV0hFTl9OT1RfU1VQUE9SVEVEIiwidW5kZWZpbmVkIiwidGVzdERpc2FibGVkIiwiZGlzYWJsZWQiLCJtZXNzYWdlIiwiaW50ZXJhY3RpdmUiLCJjb250YWluZXJPZkRBR0J1dHRvbiIsImZ1enplciIsImkiLCJzdGVwIiwiZXhwZWN0Il0sInNvdXJjZXMiOlsiUGFyYWxsZWxET01UZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQYXJhbGxlbERPTSB0ZXN0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEaXNwbGF5IGZyb20gJy4uLy4uL2Rpc3BsYXkvRGlzcGxheS5qcyc7XHJcbmltcG9ydCBDaXJjbGUgZnJvbSAnLi4vLi4vbm9kZXMvQ2lyY2xlLmpzJztcclxuaW1wb3J0IE5vZGUgZnJvbSAnLi4vLi4vbm9kZXMvTm9kZS5qcyc7XHJcbmltcG9ydCBSZWN0YW5nbGUgZnJvbSAnLi4vLi4vbm9kZXMvUmVjdGFuZ2xlLmpzJztcclxuaW1wb3J0IFBET01GdXp6ZXIgZnJvbSAnLi9QRE9NRnV6emVyLmpzJztcclxuaW1wb3J0IFBET01QZWVyIGZyb20gJy4vUERPTVBlZXIuanMnO1xyXG5pbXBvcnQgUERPTVV0aWxzIGZyb20gJy4vUERPTVV0aWxzLmpzJztcclxuaW1wb3J0IHsgUGFyYWxsZWxET01PcHRpb25zLCBQRE9NQmVoYXZpb3JGdW5jdGlvbiB9IGZyb20gJy4vUGFyYWxsZWxET00uanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFRFU1RfSU5ORVJfQ09OVEVOVCA9ICdUZXN0IElubmVyIENvbnRlbnQgSGVyZSBwbGVhc2VeJiouIFRoYW5rcyB5b3Ugc28gdmVyeSBtdWNoby4nO1xyXG5jb25zdCBURVNUX0xBQkVMID0gJ1Rlc3QgbGFiZWwnO1xyXG5jb25zdCBURVNUX0xBQkVMXzIgPSAnVGVzdCBsYWJlbCAyJztcclxuY29uc3QgVEVTVF9ERVNDUklQVElPTiA9ICdUZXN0IGRlc2NyaXB0aW9uJztcclxuY29uc3QgVEVTVF9MQUJFTF9IVE1MID0gJzxzdHJvbmc+SSBST0NLIGFzIGEgTEFCRUw8L3N0cm9uZz4nO1xyXG5jb25zdCBURVNUX0xBQkVMX0hUTUxfMiA9ICc8c3Ryb25nPkkgUk9DSyBhcyBhIExBQkVMIDI8L3N0cm9uZz4nO1xyXG5jb25zdCBURVNUX0RFU0NSSVBUSU9OX0hUTUwgPSAnPHN0cm9uZz5JIFJPQ0sgYXMgYSBERVNDUklQVElPTjwvc3Ryb25nPic7XHJcbmNvbnN0IFRFU1RfREVTQ1JJUFRJT05fSFRNTF8yID0gJzxzdHJvbmc+SSBST0NLIGFzIGEgREVTQ1JJUFRJT04gMjwvc3Ryb25nPic7XHJcbmNvbnN0IFRFU1RfQ0xBU1NfT05FID0gJ3Rlc3QtY2xhc3Mtb25lJztcclxuY29uc3QgVEVTVF9DTEFTU19UV08gPSAndGVzdC1jbGFzcy10d28nO1xyXG5cclxuLy8gVGhlc2Ugc2hvdWxkIG1hbnVhbGx5IG1hdGNoIHRoZSBkZWZhdWx0cyBpbiB0aGUgUGFyYWxsZWxET00uanMgdHJhaXRcclxuY29uc3QgREVGQVVMVF9MQUJFTF9UQUdfTkFNRSA9IFBET01VdGlscy5ERUZBVUxUX0xBQkVMX1RBR19OQU1FO1xyXG5jb25zdCBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FID0gUERPTVV0aWxzLkRFRkFVTFRfREVTQ1JJUFRJT05fVEFHX05BTUU7XHJcblxyXG4vLyBnaXZlbiB0aGUgcGFyZW50IGNvbnRhaW5lciBlbGVtZW50IGZvciBhIG5vZGUsIHRoaXMgdmFsdWUgaXMgdGhlIGluZGV4IG9mIHRoZSBsYWJlbCBzaWJsaW5nIGluIHRoZVxyXG4vLyBwYXJlbnQncyBhcnJheSBvZiBjaGlsZHJlbiBIVE1MRWxlbWVudHMuXHJcbmNvbnN0IERFRkFVTFRfTEFCRUxfU0lCTElOR19JTkRFWCA9IDA7XHJcbmNvbnN0IERFRkFVTFRfREVTQ1JJUFRJT05fU0lCTElOR19JTkRFWCA9IDE7XHJcbmNvbnN0IEFQUEVOREVEX0RFU0NSSVBUSU9OX1NJQkxJTkdfSU5ERVggPSAyO1xyXG5cclxuLy8gYSBmb2N1cyBoaWdobGlnaHQgZm9yIHRlc3RpbmcsIHNpbmNlIGR1bW15IG5vZGVzIHRlbmQgdG8gaGF2ZSBubyBib3VuZHNcclxuY29uc3QgVEVTVF9ISUdITElHSFQgPSBuZXcgQ2lyY2xlKCA1ICk7XHJcblxyXG4vLyBhIGN1c3RvbSBmb2N1cyBoaWdobGlnaHQgKHNpbmNlIGR1bW15IG5vZGUncyBoYXZlIG5vIGJvdW5kcylcclxuY29uc3QgZm9jdXNIaWdobGlnaHQgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCAxMCwgMTAgKTtcclxuXHJcbmxldCBjYW5SdW5UZXN0cyA9IHRydWU7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdQYXJhbGxlbERPTScsIHtcclxuICBiZWZvcmVFYWNoOiAoKSA9PiB7XHJcblxyXG4gICAgLy8gQSB0ZXN0IGNhbiBvbmx5IGJlIHJ1biB3aGVuIHRoZSBkb2N1bWVudCBoYXMgZm9jdXMgYmVjYXVzZSB0ZXN0cyByZXF1aXJlIGZvY3VzL2JsdXIgZXZlbnRzLiBCcm93c2Vyc1xyXG4gICAgLy8gZG8gbm90IGVtaXQgdGhlc2UgZXZlbnRzIHdoZW4gdGhlIHdpbmRvdyBpcyBub3QgYWN0aXZlIChlc3BlY2lhbGx5IHRydWUgZm9yIHB1cGV0dGVlclxyXG4gICAgY2FuUnVuVGVzdHMgPSBkb2N1bWVudC5oYXNGb2N1cygpO1xyXG5cclxuICAgIGlmICggIWNhblJ1blRlc3RzICkge1xyXG4gICAgICBjb25zb2xlLndhcm4oICdVbmFibGUgdG8gcnVuIGZvY3VzIHRlc3RzIGJlY2F1c2UgdGhlIGRvY3VtZW50IGRvZXMgbm90IGhhdmUgZm9jdXMnICk7XHJcbiAgICB9XHJcbiAgfVxyXG59ICk7XHJcblxyXG4vKipcclxuICogR2V0IGEgdW5pcXVlIFBET01QZWVyIGZyb20gYSBub2RlIHdpdGggYWNjZXNzaWJsZSBjb250ZW50LiBXaWxsIGVycm9yIGlmIHRoZSBub2RlIGhhcyBtdWx0aXBsZSBpbnN0YW5jZXNcclxuICogb3IgaWYgdGhlIG5vZGUgaGFzbid0IGJlZW4gYXR0YWNoZWQgdG8gYSBkaXNwbGF5IChhbmQgdGhlcmVmb3JlIGhhcyBubyBhY2Nlc3NpYmxlIGNvbnRlbnQpLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0UERPTVBlZXJCeU5vZGUoIG5vZGU6IE5vZGUgKTogUERPTVBlZXIge1xyXG4gIGlmICggbm9kZS5wZG9tSW5zdGFuY2VzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ05vIHBkb21JbnN0YW5jZXMuIFdhcyB5b3VyIG5vZGUgYWRkZWQgdG8gdGhlIHNjZW5lIGdyYXBoPycgKTtcclxuICB9XHJcblxyXG4gIGVsc2UgaWYgKCBub2RlLnBkb21JbnN0YW5jZXMubGVuZ3RoID4gMSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ1RoZXJlIHNob3VsZCBvbmUgYW5kIG9ubHkgb25lIGFjY2Vzc2libGUgaW5zdGFuY2UgZm9yIHRoZSBub2RlJyApO1xyXG4gIH1cclxuICBlbHNlIGlmICggIW5vZGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdwZG9tSW5zdGFuY2VcXCdzIHBlZXIgc2hvdWxkIGV4aXN0LicgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBub2RlLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBpZCBvZiBhIGRvbSBlbGVtZW50IHJlcHJlc2VudGluZyBhIG5vZGUgaW4gdGhlIERPTS4gIFRoZSBhY2Nlc3NpYmxlIGNvbnRlbnQgbXVzdCBleGlzdCBhbmQgYmUgdW5pcXVlLFxyXG4gKiB0aGVyZSBzaG91bGQgb25seSBiZSBvbmUgYWNjZXNzaWJsZSBpbnN0YW5jZSBhbmQgb25lIGRvbSBlbGVtZW50IGZvciB0aGUgbm9kZS5cclxuICpcclxuICogTk9URTogQmUgY2FyZWZ1bCBhYm91dCBnZXR0aW5nIHJlZmVyZW5jZXMgdG8gZG9tIEVsZW1lbnRzLCB0aGUgcmVmZXJlbmNlIHdpbGwgYmUgc3RhbGUgZWFjaCB0aW1lXHJcbiAqIHRoZSB2aWV3IChQRE9NUGVlcikgaXMgcmVkcmF3biwgd2hpY2ggaXMgcXVpdGUgb2Z0ZW4gd2hlbiBzZXR0aW5nIG9wdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIG5vZGU6IE5vZGUgKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHVuaXF1ZVBlZXIgPSBnZXRQRE9NUGVlckJ5Tm9kZSggbm9kZSApO1xyXG4gIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggdW5pcXVlUGVlci5wcmltYXJ5U2libGluZyEuaWQgKSE7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBdWRpdCB0aGUgcm9vdCBub2RlIGZvciBhY2Nlc3NpYmxlIGNvbnRlbnQgd2l0aGluIGEgdGVzdCwgdG8gbWFrZSBzdXJlIHRoYXQgY29udGVudCBpcyBhY2Nlc3NpYmxlIGFzIHdlIGV4cGVjdCxcclxuICogYW5kIHNvIHRoYXQgb3VyIHBkb21BdWRpdCBmdW5jdGlvbiBtYXkgY2F0Y2ggdGhpbmdzIHRoYXQgaGF2ZSBnb25lIHdyb25nLlxyXG4gKiBAcGFyYW0gcm9vdE5vZGUgLSB0aGUgcm9vdCBOb2RlIGF0dGFjaGVkIHRvIHRoZSBEaXNwbGF5IGJlaW5nIHRlc3RlZFxyXG4gKi9cclxuZnVuY3Rpb24gcGRvbUF1ZGl0Um9vdE5vZGUoIHJvb3ROb2RlOiBOb2RlICk6IHZvaWQge1xyXG4gIHJvb3ROb2RlLnBkb21BdWRpdCgpO1xyXG59XHJcblxyXG5RVW5pdC50ZXN0KCAndGFnTmFtZS9pbm5lckNvbnRlbnQgb3B0aW9ucycsIGFzc2VydCA9PiB7XHJcblxyXG4gIC8vIHRlc3QgdGhlIGJlaGF2aW9yIG9mIHN3YXBWaXNpYmlsaXR5IGZ1bmN0aW9uXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8gY3JlYXRlIHNvbWUgbm9kZXMgZm9yIHRlc3RpbmdcclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGlubmVyQ29udGVudDogVEVTVF9MQUJFTCB9ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcblxyXG4gIGNvbnN0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLnBkb21JbnN0YW5jZXMubGVuZ3RoID09PSAxLCAnb25seSAxIGluc3RhbmNlJyApO1xyXG4gIGFzc2VydC5vayggYUVsZW1lbnQucGFyZW50RWxlbWVudCEuY2hpbGROb2Rlcy5sZW5ndGggPT09IDEsICdwYXJlbnQgY29udGFpbnMgb25lIHByaW1hcnkgc2libGluZ3MnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC50YWdOYW1lID09PSAnQlVUVE9OJywgJ2RlZmF1bHQgbGFiZWwgdGFnTmFtZScgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LnRleHRDb250ZW50ID09PSBURVNUX0xBQkVMLCAnbm8gaHRtbCBzaG91bGQgdXNlIHRleHRDb250ZW50JyApO1xyXG5cclxuICBhLmlubmVyQ29udGVudCA9IFRFU1RfTEFCRUxfSFRNTDtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmlubmVySFRNTCA9PT0gVEVTVF9MQUJFTF9IVE1MLCAnaHRtbCBsYWJlbCBzaG91bGQgdXNlIGlubmVySFRNTCcgKTtcclxuXHJcbiAgYS5pbm5lckNvbnRlbnQgPSBURVNUX0xBQkVMX0hUTUxfMjtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmlubmVySFRNTCA9PT0gVEVTVF9MQUJFTF9IVE1MXzIsICdodG1sIGxhYmVsIHNob3VsZCB1c2UgaW5uZXJIVE1MLCBvdmVyd3JpdGUgZnJvbSBodG1sJyApO1xyXG5cclxuICBhLmlubmVyQ29udGVudCA9IG51bGw7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5pbm5lckhUTUwgPT09ICcnLCAnaW5uZXJIVE1MIHNob3VsZCBiZSBlbXB0eSBhZnRlciBjbGVhcmluZyBpbm5lckNvbnRlbnQnICk7XHJcblxyXG4gIGEudGFnTmFtZSA9IG51bGw7XHJcbiAgYXNzZXJ0Lm9rKCBhLnBkb21JbnN0YW5jZXMubGVuZ3RoID09PSAwLCAnc2V0IHRvIG51bGwgc2hvdWxkIGNsZWFyIGFjY2Vzc2libGUgaW5zdGFuY2VzJyApO1xyXG5cclxuICAvLyBtYWtlIHN1cmUgdGhhdCBubyBlcnJvcnMgd2hlbiBzZXR0aW5nIGlubmVyQ29udGVudCB3aXRoIHRhZ05hbWUgbnVsbC5cclxuICBhLmlubmVyQ29udGVudCA9ICdoZWxsbyc7XHJcblxyXG4gIGEudGFnTmFtZSA9ICdidXR0b24nO1xyXG4gIGEuaW5uZXJDb250ZW50ID0gVEVTVF9MQUJFTF9IVE1MXzI7XHJcbiAgYXNzZXJ0Lm9rKCBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKS5pbm5lckhUTUwgPT09IFRFU1RfTEFCRUxfSFRNTF8yLCAnaW5uZXJDb250ZW50IG5vdCBjbGVhcmVkIHdoZW4gdGFnTmFtZSBzZXQgdG8gbnVsbC4nICk7XHJcblxyXG4gIC8vIHZlcmlmeSB0aGF0IHNldHRpbmcgaW5uZXIgY29udGVudCBvbiBhbiBpbnB1dCBpcyBub3QgYWxsb3dlZFxyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnaW5wdXQnLCBpbnB1dFR5cGU6ICdyYW5nZScgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBiICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBiLmlubmVyQ29udGVudCA9ICd0aGlzIHNob3VsZCBmYWlsJztcclxuICB9LCAvLiovLCAnY2Fubm90IHNldCBpbm5lciBjb250ZW50IG9uIGlucHV0JyApO1xyXG5cclxuICAvLyBub3cgdGhhdCBpdCBpcyBhIGRpdiwgaW5uZXJDb250ZW50IGlzIGFsbG93ZWRcclxuICBiLnRhZ05hbWUgPSAnZGl2JztcclxuICBhc3NlcnQub2soIGIudGFnTmFtZSA9PT0gJ2RpdicsICdleHBlY3QgdGFnTmFtZSBzZXR0ZXIgdG8gd29yay4nICk7XHJcbiAgYi5pbm5lckNvbnRlbnQgPSBURVNUX0xBQkVMO1xyXG4gIGFzc2VydC5vayggYi5pbm5lckNvbnRlbnQgPT09IFRFU1RfTEFCRUwsICdpbm5lciBjb250ZW50IGFsbG93ZWQnICk7XHJcblxyXG4gIC8vIHJldmVydCB0YWcgbmFtZSB0byBpbnB1dCwgc2hvdWxkIHRocm93IGFuIGVycm9yXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBiLnRhZ05hbWUgPSAnaW5wdXQnO1xyXG4gIH0sIC8uKi8sICdlcnJvciB0aHJvd24gYWZ0ZXIgc2V0dGluZyB0YWdOYW1lIHRvIGlucHV0IG9uIE5vZGUgd2l0aCBpbm5lckNvbnRlbnQuJyApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5cclxuUVVuaXQudGVzdCggJ2NvbnRhaW5lclRhZ05hbWUgb3B0aW9uJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgLy8gdGVzdCB0aGUgYmVoYXZpb3Igb2Ygc3dhcFZpc2liaWxpdHkgZnVuY3Rpb25cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICB2YXIgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXZhclxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICAvLyBjcmVhdGUgc29tZSBub2RlcyBmb3IgdGVzdGluZ1xyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJyB9ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLnBkb21JbnN0YW5jZXMubGVuZ3RoID09PSAxLCAnb25seSAxIGluc3RhbmNlJyApO1xyXG4gIGFzc2VydC5vayggYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEuY29udGFpbmVyUGFyZW50ID09PSBudWxsLCAnbm8gY29udGFpbmVyIHBhcmVudCBmb3IganVzdCBidXR0b24nICk7XHJcbiAgYXNzZXJ0Lm9rKCByb290Tm9kZVsgJ19wZG9tSW5zdGFuY2VzJyBdWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchLmNoaWxkcmVuWyAwIF0gPT09IGFbICdfcGRvbUluc3RhbmNlcycgXVsgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nISxcclxuICAgICdyb290Tm9kZSBwZWVyIHNob3VsZCBob2xkIG5vZGUgYVxcJ3MgcGVlciBpbiB0aGUgUERPTScgKTtcclxuXHJcbiAgYS5jb250YWluZXJUYWdOYW1lID0gJ2Rpdic7XHJcblxyXG4gIGFzc2VydC5vayggYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEuY29udGFpbmVyUGFyZW50IS5pZC5pbmNsdWRlcyggJ2NvbnRhaW5lcicgKSwgJ2NvbnRhaW5lciBwYXJlbnQgaXMgZGl2IGlmIHNwZWNpZmllZCcgKTtcclxuICBhc3NlcnQub2soIHJvb3ROb2RlWyAnX3Bkb21JbnN0YW5jZXMnIF1bIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuY2hpbGRyZW5bIDAgXSA9PT0gYVsgJ19wZG9tSW5zdGFuY2VzJyBdWyAwIF0ucGVlciEuY29udGFpbmVyUGFyZW50ISxcclxuICAgICdjb250YWluZXIgcGFyZW50IGlzIGRpdiBpZiBzcGVjaWZpZWQnICk7XHJcblxyXG4gIGEuY29udGFpbmVyVGFnTmFtZSA9IG51bGw7XHJcblxyXG4gIGFzc2VydC5vayggIWEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLmNvbnRhaW5lclBhcmVudCEsICdjb250YWluZXIgcGFyZW50IGlzIGNsZWFyZWQgaWYgc3BlY2lmaWVkJyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdsYWJlbFRhZ05hbWUvbGFiZWxDb250ZW50IG9wdGlvbicsIGFzc2VydCA9PiB7XHJcblxyXG4gIC8vIHRlc3QgdGhlIGJlaGF2aW9yIG9mIHN3YXBWaXNpYmlsaXR5IGZ1bmN0aW9uXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8gY3JlYXRlIHNvbWUgbm9kZXMgZm9yIHRlc3RpbmdcclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGxhYmVsQ29udGVudDogVEVTVF9MQUJFTCB9ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcblxyXG4gIGNvbnN0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgY29uc3QgbGFiZWxTaWJsaW5nID0gYUVsZW1lbnQucGFyZW50RWxlbWVudCEuY2hpbGROb2Rlc1sgMCBdIGFzIEhUTUxFbGVtZW50O1xyXG4gIGFzc2VydC5vayggYS5wZG9tSW5zdGFuY2VzLmxlbmd0aCA9PT0gMSwgJ29ubHkgMSBpbnN0YW5jZScgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LnBhcmVudEVsZW1lbnQhLmNoaWxkTm9kZXMubGVuZ3RoID09PSAyLCAncGFyZW50IGNvbnRhaW5zIHR3byBzaWJsaW5ncycgKTtcclxuICBhc3NlcnQub2soIGxhYmVsU2libGluZy50YWdOYW1lID09PSBERUZBVUxUX0xBQkVMX1RBR19OQU1FLCAnZGVmYXVsdCBsYWJlbCB0YWdOYW1lJyApO1xyXG4gIGFzc2VydC5vayggbGFiZWxTaWJsaW5nLnRleHRDb250ZW50ID09PSBURVNUX0xBQkVMLCAnbm8gaHRtbCBzaG91bGQgdXNlIHRleHRDb250ZW50JyApO1xyXG5cclxuICBhLmxhYmVsQ29udGVudCA9IFRFU1RfTEFCRUxfSFRNTDtcclxuICBhc3NlcnQub2soIGxhYmVsU2libGluZy5pbm5lckhUTUwgPT09IFRFU1RfTEFCRUxfSFRNTCwgJ2h0bWwgbGFiZWwgc2hvdWxkIHVzZSBpbm5lckhUTUwnICk7XHJcblxyXG4gIGEubGFiZWxDb250ZW50ID0gbnVsbDtcclxuICBhc3NlcnQub2soIGxhYmVsU2libGluZy5pbm5lckhUTUwgPT09ICcnLCAnbGFiZWwgY29udGVudCBzaG91bGQgYmUgZW1wdHkgYWZ0ZXIgc2V0dGluZyB0byBudWxsJyApO1xyXG5cclxuICBhLmxhYmVsQ29udGVudCA9IFRFU1RfTEFCRUxfSFRNTF8yO1xyXG4gIGFzc2VydC5vayggbGFiZWxTaWJsaW5nLmlubmVySFRNTCA9PT0gVEVTVF9MQUJFTF9IVE1MXzIsICdodG1sIGxhYmVsIHNob3VsZCB1c2UgaW5uZXJIVE1MLCBvdmVyd3JpdGUgZnJvbSBodG1sJyApO1xyXG5cclxuICBhLnRhZ05hbWUgPSAnZGl2JztcclxuXHJcbiAgY29uc3QgbmV3QUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICBjb25zdCBuZXdMYWJlbFNpYmxpbmcgPSBuZXdBRWxlbWVudC5wYXJlbnRFbGVtZW50IS5jaGlsZE5vZGVzWyAwIF0gYXMgSFRNTEVsZW1lbnQ7XHJcblxyXG4gIGFzc2VydC5vayggbmV3TGFiZWxTaWJsaW5nLmlubmVySFRNTCA9PT0gVEVTVF9MQUJFTF9IVE1MXzIsICd0YWdOYW1lIGluZGVwZW5kZW50IG9mOiBodG1sIGxhYmVsIHNob3VsZCB1c2UgaW5uZXJIVE1MLCBvdmVyd3JpdGUgZnJvbSBodG1sJyApO1xyXG5cclxuICBhLmxhYmVsVGFnTmFtZSA9IG51bGw7XHJcblxyXG4gIC8vIG1ha2Ugc3VyZSBsYWJlbCB3YXMgY2xlYXJlZCBmcm9tIFBET01cclxuICBhc3NlcnQub2soIGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApLnBhcmVudEVsZW1lbnQhLmNoaWxkTm9kZXMubGVuZ3RoID09PSAxLFxyXG4gICAgJ09ubHkgb25lIGVsZW1lbnQgYWZ0ZXIgY2xlYXJpbmcgbGFiZWwnICk7XHJcblxyXG4gIGFzc2VydC5vayggYS5sYWJlbENvbnRlbnQgPT09IFRFU1RfTEFCRUxfSFRNTF8yLCAnY2xlYXJpbmcgbGFiZWxUYWdOYW1lIHNob3VsZCBub3QgY2hhbmdlIGNvbnRlbnQsIGV2ZW4gIHRob3VnaCBpdCBpcyBub3QgZGlzcGxheWVkJyApO1xyXG5cclxuICBhLmxhYmVsVGFnTmFtZSA9ICdwJztcclxuICBhc3NlcnQub2soIGEubGFiZWxUYWdOYW1lID09PSAncCcsICdleHBlY3QgbGFiZWxUYWdOYW1lIHNldHRlciB0byB3b3JrLicgKTtcclxuXHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdwJywgbGFiZWxDb250ZW50OiAnSSBhbSBncm9vdCcgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBiICk7XHJcbiAgbGV0IGJMYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYi5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEubGFiZWxTaWJsaW5nIS5pZCApITtcclxuICBhc3NlcnQub2soICFiTGFiZWxFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2ZvcicgKSwgJ2ZvciBhdHRyaWJ1dGUgc2hvdWxkIG5vdCBiZSBvbiBub24gbGFiZWwgbGFiZWwgc2libGluZy4nICk7XHJcbiAgYi5sYWJlbFRhZ05hbWUgPSAnbGFiZWwnO1xyXG4gIGJMYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYi5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEubGFiZWxTaWJsaW5nIS5pZCApITtcclxuICBhc3NlcnQub2soIGJMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnZm9yJyApICE9PSBudWxsLCAnZm9yIGF0dHJpYnV0ZSBzaG91bGQgYmUgb24gXCJsYWJlbFwiIHRhZyBmb3IgbGFiZWwgc2libGluZy4nICk7XHJcblxyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAncCcgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBjICk7XHJcbiAgYy5sYWJlbFRhZ05hbWUgPSAnbGFiZWwnO1xyXG4gIGMubGFiZWxDb250ZW50ID0gVEVTVF9MQUJFTDtcclxuICBjb25zdCBjTGFiZWxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIGMucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLmxhYmVsU2libGluZyEuaWQgKSE7XHJcbiAgYXNzZXJ0Lm9rKCBjTGFiZWxFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2ZvcicgKSAhPT0gbnVsbCwgJ29yZGVyIHNob3VsZCBub3QgbWF0dGVyJyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnY29udGFpbmVyIGVsZW1lbnQgbm90IG5lZWRlZCBmb3IgbXVsdGlwbGUgc2libGluZ3MnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBzd2FwVmlzaWJpbGl0eSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIC8vIHRlc3QgY29udGFpbmVyVGFnIGlzIG5vdCBuZWVkZWRcclxuICBjb25zdCBiID0gbmV3IE5vZGUoIHtcclxuICAgIHRhZ05hbWU6ICdkaXYnLFxyXG4gICAgbGFiZWxDb250ZW50OiAnaGVsbG8nXHJcbiAgfSApO1xyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ3NlY3Rpb24nLFxyXG4gICAgbGFiZWxDb250ZW50OiAnaGknXHJcbiAgfSApO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ3AnLFxyXG4gICAgaW5uZXJDb250ZW50OiAnUFBQUCcsXHJcbiAgICBjb250YWluZXJUYWdOYW1lOiAnZGl2J1xyXG4gIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYiApO1xyXG4gIGIuYWRkQ2hpbGQoIGMgKTtcclxuICBiLmFkZENoaWxkKCBkICk7XHJcbiAgbGV0IGJFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICk7XHJcbiAgbGV0IGNQZWVyID0gYy5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7XHJcbiAgbGV0IGRQZWVyID0gZC5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7XHJcbiAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDMsICdjLnAsIGMuc2VjdGlvbiwgZC5kaXYgc2hvdWxkIGFsbCBiZSBvbiB0aGUgc2FtZSBsZXZlbCcgKTtcclxuICBjb25zdCBjb25maXJtT3JpZ2luYWxPcmRlciA9ICgpID0+IHtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDAgXS50YWdOYW1lID09PSAnUCcsICdwIGZpcnN0JyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlblsgMSBdLnRhZ05hbWUgPT09ICdTRUNUSU9OJywgJ3NlY3Rpb24gMm5kJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlblsgMiBdLnRhZ05hbWUgPT09ICdESVYnLCAnZGl2IDNyZCcgKTtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDAgXSA9PT0gY1BlZXIubGFiZWxTaWJsaW5nLCAnYyBsYWJlbCBmaXJzdCcgKTtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDEgXSA9PT0gY1BlZXIucHJpbWFyeVNpYmxpbmcsICdjIHByaW1hcnkgMm5kJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlblsgMiBdID09PSBkUGVlci5jb250YWluZXJQYXJlbnQsICdkIGNvbnRhaW5lciAzcmQnICk7XHJcbiAgfTtcclxuICBjb25maXJtT3JpZ2luYWxPcmRlcigpO1xyXG5cclxuICAvLyBhZGQgYSBmZXcgbW9yZVxyXG4gIGNvbnN0IGUgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ3NwYW4nLFxyXG4gICAgZGVzY3JpcHRpb25Db250ZW50OiAnPGJyPnN3ZWV0IGFuZCBjb29sIHRoaW5nczwvYnI+J1xyXG4gIH0gKTtcclxuICBiLmFkZENoaWxkKCBlICk7XHJcbiAgYkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKTsgLy8gcmVmcmVzaCB0aGUgRE9NIEVsZW1lbnRzXHJcbiAgY1BlZXIgPSBjLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyITsgLy8gcmVmcmVzaCB0aGUgRE9NIEVsZW1lbnRzXHJcbiAgZFBlZXIgPSBkLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyITsgLy8gcmVmcmVzaCB0aGUgRE9NIEVsZW1lbnRzXHJcbiAgbGV0IGVQZWVyID0gZS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7XHJcbiAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDUsICdlIGNoaWxkcmVuIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgc2FtZSBQRE9NIGxldmVsLicgKTtcclxuICBjb25maXJtT3JpZ2luYWxPcmRlcigpO1xyXG5cclxuICBjb25zdCBjb25maXJtT3JpZ2luYWxXaXRoRSA9ICgpID0+IHtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDMgXS50YWdOYW1lID09PSAnUCcsICdQIDRyZCcgKTtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDQgXS50YWdOYW1lID09PSAnU1BBTicsICdTUEFOIDNyZCcgKTtcclxuICAgIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDMgXSA9PT0gZVBlZXIuZGVzY3JpcHRpb25TaWJsaW5nLCAnZSBkZXNjcmlwdGlvbiA0dGgnICk7XHJcbiAgICBhc3NlcnQub2soIGJFbGVtZW50LmNoaWxkcmVuWyA0IF0gPT09IGVQZWVyLnByaW1hcnlTaWJsaW5nLCAnZSBwcmltYXJ5IDV0aCcgKTtcclxuICB9O1xyXG5cclxuICAvLyBkeW5hbWljYWxseSBhZGRpbmcgcGFyZW50XHJcbiAgZS5jb250YWluZXJUYWdOYW1lID0gJ2FydGljbGUnO1xyXG4gIGJFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICk7IC8vIHJlZnJlc2ggdGhlIERPTSBFbGVtZW50c1xyXG4gIGNQZWVyID0gYy5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7IC8vIHJlZnJlc2ggdGhlIERPTSBFbGVtZW50c1xyXG4gIGRQZWVyID0gZC5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7IC8vIHJlZnJlc2ggdGhlIERPTSBFbGVtZW50c1xyXG4gIGVQZWVyID0gZS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciE7XHJcbiAgYXNzZXJ0Lm9rKCBiRWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDQsICdlIGNoaWxkcmVuIHNob3VsZCBub3cgYmUgdW5kZXIgZVxcJ3MgY29udGFpbmVyLicgKTtcclxuICBjb25maXJtT3JpZ2luYWxPcmRlcigpO1xyXG4gIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDMgXS50YWdOYW1lID09PSAnQVJUSUNMRScsICdTUEFOIDNyZCcgKTtcclxuICBhc3NlcnQub2soIGJFbGVtZW50LmNoaWxkcmVuWyAzIF0gPT09IGVQZWVyLmNvbnRhaW5lclBhcmVudCwgJ2UgcGFyZW50IDNyZCcgKTtcclxuXHJcbiAgLy8gY2xlYXIgY29udGFpbmVyXHJcbiAgZS5jb250YWluZXJUYWdOYW1lID0gbnVsbDtcclxuICBiRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApOyAvLyByZWZyZXNoIHRoZSBET00gRWxlbWVudHNcclxuICBjUGVlciA9IGMucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhOyAvLyByZWZyZXNoIHRoZSBET00gRWxlbWVudHNcclxuICBkUGVlciA9IGQucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhOyAvLyByZWZyZXNoIHRoZSBET00gRWxlbWVudHNcclxuICBlUGVlciA9IGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhO1xyXG4gIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSA1LCAnZSBjaGlsZHJlbiBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHNhbWUgUERPTSBsZXZlbCBhZ2Fpbi4nICk7XHJcbiAgY29uZmlybU9yaWdpbmFsT3JkZXIoKTtcclxuICBjb25maXJtT3JpZ2luYWxXaXRoRSgpO1xyXG5cclxuICAvLyBwcm9wZXIgZGlzcG9zYWxcclxuICBlLmRpc3Bvc2UoKTtcclxuICBiRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApO1xyXG4gIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAzLCAnZSBjaGlsZHJlbiBzaG91bGQgaGF2ZSBiZWVuIHJlbW92ZWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBlLnBkb21JbnN0YW5jZXMubGVuZ3RoID09PSAwLCAnZSBpcyBkaXNwb3NlZCcgKTtcclxuICBjb25maXJtT3JpZ2luYWxPcmRlcigpO1xyXG5cclxuICAvLyByZW9yZGVyIGQgY29ycmVjdGx5IHdoZW4gYyByZW1vdmVkXHJcbiAgYi5yZW1vdmVDaGlsZCggYyApO1xyXG4gIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxLCAnYyBjaGlsZHJlbiBzaG91bGQgaGF2ZSBiZWVuIHJlbW92ZWQsIG9ubHkgZCBjb250YWluZXInICk7XHJcbiAgYkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKTtcclxuICBkUGVlciA9IGQucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhO1xyXG4gIGFzc2VydC5vayggYkVsZW1lbnQuY2hpbGRyZW5bIDAgXS50YWdOYW1lID09PSAnRElWJywgJ0RJViBmaXJzdCcgKTtcclxuICBhc3NlcnQub2soIGJFbGVtZW50LmNoaWxkcmVuWyAwIF0gPT09IGRQZWVyLmNvbnRhaW5lclBhcmVudCwgJ2QgY29udGFpbmVyIGZpcnN0JyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnZGVzY3JpcHRpb25UYWdOYW1lL2Rlc2NyaXB0aW9uQ29udGVudCBvcHRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBzd2FwVmlzaWJpbGl0eSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIC8vIGNyZWF0ZSBzb21lIG5vZGVzIGZvciB0ZXN0aW5nXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nLCBkZXNjcmlwdGlvbkNvbnRlbnQ6IFRFU1RfREVTQ1JJUFRJT04gfSApO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICBjb25zdCBhRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApO1xyXG4gIGNvbnN0IGRlc2NyaXB0aW9uU2libGluZyA9IGFFbGVtZW50LnBhcmVudEVsZW1lbnQhLmNoaWxkTm9kZXNbIDAgXSBhcyBIVE1MRWxlbWVudDtcclxuICBhc3NlcnQub2soIGEucGRvbUluc3RhbmNlcy5sZW5ndGggPT09IDEsICdvbmx5IDEgaW5zdGFuY2UnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5wYXJlbnRFbGVtZW50IS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMiwgJ3BhcmVudCBjb250YWlucyB0d28gc2libGluZ3MnICk7XHJcbiAgYXNzZXJ0Lm9rKCBkZXNjcmlwdGlvblNpYmxpbmcudGFnTmFtZSA9PT0gREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRSwgJ2RlZmF1bHQgbGFiZWwgdGFnTmFtZScgKTtcclxuICBhc3NlcnQub2soIGRlc2NyaXB0aW9uU2libGluZy50ZXh0Q29udGVudCA9PT0gVEVTVF9ERVNDUklQVElPTiwgJ25vIGh0bWwgc2hvdWxkIHVzZSB0ZXh0Q29udGVudCcgKTtcclxuXHJcbiAgYS5kZXNjcmlwdGlvbkNvbnRlbnQgPSBURVNUX0RFU0NSSVBUSU9OX0hUTUw7XHJcbiAgYXNzZXJ0Lm9rKCBkZXNjcmlwdGlvblNpYmxpbmcuaW5uZXJIVE1MID09PSBURVNUX0RFU0NSSVBUSU9OX0hUTUwsICdodG1sIGxhYmVsIHNob3VsZCB1c2UgaW5uZXJIVE1MJyApO1xyXG5cclxuICBhLmRlc2NyaXB0aW9uQ29udGVudCA9IG51bGw7XHJcbiAgYXNzZXJ0Lm9rKCBkZXNjcmlwdGlvblNpYmxpbmcuaW5uZXJIVE1MID09PSAnJywgJ2Rlc2NyaXB0aW9uIGNvbnRlbnQgc2hvdWxkIGJlIGNsZWFyZWQnICk7XHJcblxyXG4gIGEuZGVzY3JpcHRpb25Db250ZW50ID0gVEVTVF9ERVNDUklQVElPTl9IVE1MXzI7XHJcbiAgYXNzZXJ0Lm9rKCBkZXNjcmlwdGlvblNpYmxpbmcuaW5uZXJIVE1MID09PSBURVNUX0RFU0NSSVBUSU9OX0hUTUxfMiwgJ2h0bWwgbGFiZWwgc2hvdWxkIHVzZSBpbm5lckhUTUwsIG92ZXJ3cml0ZSBmcm9tIGh0bWwnICk7XHJcblxyXG4gIGEuZGVzY3JpcHRpb25UYWdOYW1lID0gbnVsbDtcclxuXHJcbiAgLy8gbWFrZSBzdXJlIGRlc2NyaXB0aW9uIHdhcyBjbGVhcmVkIGZyb20gUERPTVxyXG4gIGFzc2VydC5vayggZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICkucGFyZW50RWxlbWVudCEuY2hpbGROb2Rlcy5sZW5ndGggPT09IDEsXHJcbiAgICAnT25seSBvbmUgZWxlbWVudCBhZnRlciBjbGVhcmluZyBkZXNjcmlwdGlvbicgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBhLmRlc2NyaXB0aW9uQ29udGVudCA9PT0gVEVTVF9ERVNDUklQVElPTl9IVE1MXzIsICdjbGVhcmluZyBkZXNjcmlwdGlvblRhZ05hbWUgc2hvdWxkIG5vdCBjaGFuZ2UgY29udGVudCwgZXZlbiAgdGhvdWdoIGl0IGlzIG5vdCBkaXNwbGF5ZWQnICk7XHJcblxyXG4gIGFzc2VydC5vayggYS5kZXNjcmlwdGlvblRhZ05hbWUgPT09IG51bGwsICdleHBlY3QgZGVzY3JpcHRpb25UYWdOYW1lIHNldHRlciB0byB3b3JrLicgKTtcclxuXHJcbiAgYS5kZXNjcmlwdGlvblRhZ05hbWUgPSAncCc7XHJcbiAgYXNzZXJ0Lm9rKCBhLmRlc2NyaXB0aW9uVGFnTmFtZSA9PT0gJ3AnLCAnZXhwZWN0IGRlc2NyaXB0aW9uVGFnTmFtZSBzZXR0ZXIgdG8gd29yay4nICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdQYXJhbGxlbERPTSBvcHRpb25zJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIC8vIHRlc3Qgc2V0dGluZyBvZiBhY2Nlc3NpYmxlIGNvbnRlbnQgdGhyb3VnaCBvcHRpb25zXHJcbiAgY29uc3QgYnV0dG9uTm9kZSA9IG5ldyBOb2RlKCB7XHJcbiAgICBmb2N1c0hpZ2hsaWdodDogbmV3IENpcmNsZSggNSApLFxyXG4gICAgY29udGFpbmVyVGFnTmFtZTogJ2RpdicsIC8vIGNvbnRhaW5lZCBpbiBwYXJlbnQgZWxlbWVudCAnZGl2J1xyXG4gICAgdGFnTmFtZTogJ2lucHV0JywgLy8gZG9tIGVsZW1lbnQgd2l0aCB0YWcgbmFtZSAnaW5wdXQnXHJcbiAgICBpbnB1dFR5cGU6ICdidXR0b24nLCAvLyBpbnB1dCB0eXBlICdidXR0b24nXHJcbiAgICBsYWJlbFRhZ05hbWU6ICdsYWJlbCcsIC8vIGxhYmVsIHdpdGggdGFnbmFtZSAnbGFiZWwnXHJcbiAgICBsYWJlbENvbnRlbnQ6IFRFU1RfTEFCRUwsIC8vIGxhYmVsIHRleHQgY29udGVudFxyXG4gICAgZGVzY3JpcHRpb25Db250ZW50OiBURVNUX0RFU0NSSVBUSU9OLCAvLyBkZXNjcmlwdGlvbiB0ZXh0IGNvbnRlbnRcclxuICAgIGZvY3VzYWJsZTogZmFsc2UsIC8vIHJlbW92ZSBmcm9tIGZvY3VzIG9yZGVyXHJcbiAgICBhcmlhUm9sZTogJ2J1dHRvbicgLy8gdXNlcyB0aGUgQVJJQSBidXR0b24gcm9sZVxyXG4gIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYnV0dG9uTm9kZSApO1xyXG5cclxuICBjb25zdCBkaXZOb2RlID0gbmV3IE5vZGUoIHtcclxuICAgIHRhZ05hbWU6ICdkaXYnLFxyXG4gICAgYXJpYUxhYmVsOiBURVNUX0xBQkVMLCAvLyB1c2UgQVJJQSBsYWJlbCBhdHRyaWJ1dGVcclxuICAgIHBkb21WaXNpYmxlOiBmYWxzZSwgLy8gaGlkZGVuIGZyb20gc2NyZWVuIHJlYWRlcnMgKGFuZCBicm93c2VyKVxyXG4gICAgZGVzY3JpcHRpb25Db250ZW50OiBURVNUX0RFU0NSSVBUSU9OLCAvLyBkZWZhdWx0IHRvIGEgPHA+IHRhZ1xyXG4gICAgY29udGFpbmVyVGFnTmFtZTogJ2RpdidcclxuICB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGRpdk5vZGUgKTtcclxuXHJcbiAgLy8gdmVyaWZ5IHRoYXQgc2V0dGVycyBhbmQgZ2V0dGVycyB3b3JrZWQgY29ycmVjdGx5XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25Ob2RlLmxhYmVsVGFnTmFtZSA9PT0gJ2xhYmVsJywgJ0xhYmVsIHRhZyBuYW1lJyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uTm9kZS5jb250YWluZXJUYWdOYW1lID09PSAnZGl2JywgJ2NvbnRhaW5lciB0YWcgbmFtZScgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbk5vZGUubGFiZWxDb250ZW50ID09PSBURVNUX0xBQkVMLCAnQWNjZXNzaWJsZSBsYWJlbCcgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbk5vZGUuZGVzY3JpcHRpb25UYWdOYW1lIS50b1VwcGVyQ2FzZSgpID09PSBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FLCAnRGVzY3JpcHRpb24gdGFnIG5hbWUnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25Ob2RlLmZvY3VzYWJsZSwgZmFsc2UsICdGb2N1c2FibGUnICk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25Ob2RlLmFyaWFSb2xlID09PSAnYnV0dG9uJywgJ0FyaWEgcm9sZScgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbk5vZGUuZGVzY3JpcHRpb25Db250ZW50ID09PSBURVNUX0RFU0NSSVBUSU9OLCAnQWNjZXNzaWJsZSBEZXNjcmlwdGlvbicgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbk5vZGUuZm9jdXNIaWdobGlnaHQgaW5zdGFuY2VvZiBDaXJjbGUsICdGb2N1cyBoaWdobGlnaHQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25Ob2RlLnRhZ05hbWUgPT09ICdpbnB1dCcsICdUYWcgbmFtZScgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbk5vZGUuaW5wdXRUeXBlID09PSAnYnV0dG9uJywgJ0lucHV0IHR5cGUnICk7XHJcblxyXG4gIGFzc2VydC5vayggZGl2Tm9kZS50YWdOYW1lID09PSAnZGl2JywgJ1RhZyBuYW1lJyApO1xyXG4gIGFzc2VydC5vayggZGl2Tm9kZS5hcmlhTGFiZWwgPT09IFRFU1RfTEFCRUwsICdVc2UgYXJpYSBsYWJlbCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIGRpdk5vZGUucGRvbVZpc2libGUsIGZhbHNlLCAncGRvbSB2aXNpYmxlJyApO1xyXG4gIGFzc2VydC5vayggZGl2Tm9kZS5sYWJlbFRhZ05hbWUgPT09IG51bGwsICdMYWJlbCB0YWcgbmFtZSB3aXRoIGFyaWEgbGFiZWwgaXMgaW5kZXBlbmRlbnQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBkaXZOb2RlLmRlc2NyaXB0aW9uVGFnTmFtZSEudG9VcHBlckNhc2UoKSA9PT0gREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRSwgJ0Rlc2NyaXB0aW9uIHRhZyBuYW1lJyApO1xyXG5cclxuICAvLyB2ZXJpZnkgRE9NIHN0cnVjdHVyZSAtIG9wdGlvbnMgYWJvdmUgc2hvdWxkIGNyZWF0ZSBzb21ldGhpbmcgbGlrZTpcclxuICAvLyA8ZGl2IGlkPVwiZGlzcGxheS1yb290XCI+XHJcbiAgLy8gIDxkaXYgaWQ9XCJwYXJlbnQtY29udGFpbmVyLWlkXCI+XHJcbiAgLy8gICAgPGxhYmVsIGZvcj1cImlkXCI+VGVzdCBMYWJlbDwvbGFiZWw+XHJcbiAgLy8gICAgPHA+RGVzY3JpcHRpb24+VGVzdCBEZXNjcmlwdGlvbjwvcD5cclxuICAvLyAgICA8aW5wdXQgdHlwZT0nYnV0dG9uJyByb2xlPSdidXR0b24nIHRhYmluZGV4PVwiLTFcIiBpZD1pZD5cclxuICAvLyAgPC9kaXY+XHJcbiAgLy9cclxuICAvLyAgPGRpdiBhcmlhLWxhYmVsPVwiVGVzdCBMYWJlbFwiIGhpZGRlbiBhcmlhLWxhYmVsbGVkQnk9XCJidXR0b24tbm9kZS1pZFwiIGFyaWEtZGVzY3JpYmVkYnk9J2J1dHRvbi1ub2RlLWlkJz5cclxuICAvLyAgICA8cD5UZXN0IERlc2NyaXB0aW9uPC9wPlxyXG4gIC8vICA8L2Rpdj5cclxuICAvLyA8L2Rpdj5cclxuICBwZG9tQXVkaXRSb290Tm9kZSggcm9vdE5vZGUgKTtcclxuICBsZXQgYnV0dG9uRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYnV0dG9uTm9kZSApO1xyXG5cclxuICBjb25zdCBidXR0b25QYXJlbnQgPSBidXR0b25FbGVtZW50LnBhcmVudE5vZGUhIGFzIEhUTUxFbGVtZW50O1xyXG4gIGNvbnN0IGJ1dHRvblBlZXJzID0gYnV0dG9uUGFyZW50LmNoaWxkTm9kZXMgYXMgdW5rbm93biBhcyBIVE1MRWxlbWVudFtdO1xyXG4gIGNvbnN0IGJ1dHRvbkxhYmVsID0gYnV0dG9uUGVlcnNbIDAgXTtcclxuICBjb25zdCBidXR0b25EZXNjcmlwdGlvbiA9IGJ1dHRvblBlZXJzWyAxIF07XHJcbiAgY29uc3QgZGl2RWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggZGl2Tm9kZSApO1xyXG4gIGNvbnN0IHBEZXNjcmlwdGlvbiA9IGRpdkVsZW1lbnQucGFyZW50RWxlbWVudCEuY2hpbGROb2Rlc1sgMCBdOyAvLyBkZXNjcmlwdGlvbiBiZWZvcmUgcHJpbWFyeSBkaXZcclxuXHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25QYXJlbnQudGFnTmFtZSA9PT0gJ0RJVicsICdwYXJlbnQgY29udGFpbmVyJyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uTGFiZWwudGFnTmFtZSA9PT0gJ0xBQkVMJywgJ0xhYmVsIGZpcnN0JyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uTGFiZWwuZ2V0QXR0cmlidXRlKCAnZm9yJyApID09PSBidXR0b25FbGVtZW50LmlkLCAnbGFiZWwgZm9yIGF0dHJpYnV0ZScgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbkxhYmVsLnRleHRDb250ZW50ID09PSBURVNUX0xBQkVMLCAnbGFiZWwgY29udGVudCcgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbkRlc2NyaXB0aW9uLnRhZ05hbWUgPT09IERFRkFVTFRfREVTQ1JJUFRJT05fVEFHX05BTUUsICdkZXNjcmlwdGlvbiBzZWNvbmQnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25EZXNjcmlwdGlvbi50ZXh0Q29udGVudCwgVEVTVF9ERVNDUklQVElPTiwgJ2Rlc2NyaXB0aW9uIGNvbnRlbnQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25QZWVyc1sgMiBdID09PSBidXR0b25FbGVtZW50LCAnQnV0dG9uIHRoaXJkJyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd0eXBlJyApID09PSAnYnV0dG9uJywgJ2lucHV0IHR5cGUgc2V0JyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uRWxlbWVudC5nZXRBdHRyaWJ1dGUoICdyb2xlJyApID09PSAnYnV0dG9uJywgJ2J1dHRvbiByb2xlIHNldCcgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvbkVsZW1lbnQudGFiSW5kZXggPT09IC0xLCAnbm90IGZvY3VzYWJsZScgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBkaXZFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2FyaWEtbGFiZWwnICkgPT09IFRFU1RfTEFCRUwsICdhcmlhIGxhYmVsIHNldCcgKTtcclxuICBhc3NlcnQub2soIGRpdkVsZW1lbnQucGFyZW50RWxlbWVudCEuaGlkZGVuLCAnaGlkZGVuIHNldCBzaG91bGQgYWN0IG9uIHBhcmVudCcgKTtcclxuICBhc3NlcnQub2soIHBEZXNjcmlwdGlvbi50ZXh0Q29udGVudCA9PT0gVEVTVF9ERVNDUklQVElPTiwgJ2Rlc2NyaXB0aW9uIGNvbnRlbnQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBwRGVzY3JpcHRpb24ucGFyZW50RWxlbWVudCA9PT0gZGl2RWxlbWVudC5wYXJlbnRFbGVtZW50LCAnZGVzY3JpcHRpb24gaXMgc2libGluZyB0byBwcmltYXJ5JyApO1xyXG4gIGFzc2VydC5vayggZGl2RWxlbWVudC5wYXJlbnRFbGVtZW50IS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMiwgJ25vIGxhYmVsIGVsZW1lbnQgZm9yIGFyaWEtbGFiZWwsIGp1c3QgZGVzY3JpcHRpb24gYW5kIHByaW1hcnkgc2libGluZ3MnICk7XHJcblxyXG4gIC8vIGNsZWFyIHZhbHVlc1xyXG4gIGJ1dHRvbk5vZGUuaW5wdXRUeXBlID0gbnVsbDtcclxuICBidXR0b25FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBidXR0b25Ob2RlICk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25FbGVtZW50LmdldEF0dHJpYnV0ZSggJ3R5cGUnICkgPT09IG51bGwsICdpbnB1dCB0eXBlIGNsZWFyZWQnICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcbi8vIHRlc3RzIGZvciBhcmlhLWxhYmVsbGVkYnkgYW5kIGFyaWEtZGVzY3JpYmVkYnkgc2hvdWxkIGJlIHRoZSBzYW1lLCBzaW5jZSBib3RoIHN1cHBvcnQgdGhlIHNhbWUgZmVhdHVyZSBzZXRcclxuZnVuY3Rpb24gdGVzdEFzc29jaWF0aW9uQXR0cmlidXRlKCBhc3NlcnQ6IEFzc2VydCwgYXR0cmlidXRlOiBzdHJpbmcgKTogdm9pZCB7XHJcblxyXG4gIC8vIHVzZSBhIGRpZmZlcmVudCBzZXR0ZXIgZGVwZW5kaW5nIG9uIGlmIHRlc3RpbmcgbGFiZWxsZWRieSBvciBkZXNjcmliZWRieVxyXG4gIGNvbnN0IGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gPSBhdHRyaWJ1dGUgPT09ICdhcmlhLWxhYmVsbGVkYnknID8gJ2FkZEFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24nIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlID09PSAnYXJpYS1kZXNjcmliZWRieScgPyAnYWRkQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24nIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlID09PSAnYXJpYS1hY3RpdmVkZXNjZW5kYW50JyA/ICdhZGRBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24nIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuXHJcbiAgaWYgKCAhYWRkQXNzb2NpYXRpb25GdW5jdGlvbiApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ2luY29ycmVjdCBhdHRyaWJ1dGUgbmFtZSB3aGlsZSBpbiB0ZXN0QXNzb2NpYXRpb25BdHRyaWJ1dGUnICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8gdHdvIG5ldyBub2RlcyB0aGF0IHdpbGwgYmUgcmVsYXRlZCB3aXRoIHRoZSBhcmlhLWxhYmVsbGVkYnkgYW5kIGFyaWEtZGVzY3JpYmVkYnkgYXNzb2NpYXRpb25zXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nLCBsYWJlbFRhZ05hbWU6ICdwJywgZGVzY3JpcHRpb25UYWdOYW1lOiAncCcgfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAncCcsIGlubmVyQ29udGVudDogVEVTVF9MQUJFTF8yIH0gKTtcclxuICByb290Tm9kZS5jaGlsZHJlbiA9IFsgYSwgYiBdO1xyXG5cclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIGEuc2V0UERPTUF0dHJpYnV0ZSggYXR0cmlidXRlLCAnaGVsbG8nICk7XHJcbiAgfSwgLy4qLywgJ2Nhbm5vdCBzZXQgYXNzb2NpYXRpb24gYXR0cmlidXRlcyB3aXRoIHNldFBET01BdHRyaWJ1dGUnICk7XHJcblxyXG4gIGFbIGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gXSgge1xyXG4gICAgb3RoZXJOb2RlOiBiLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcsXHJcbiAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkdcclxuICB9ICk7XHJcblxyXG4gIGxldCBhRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApO1xyXG4gIGxldCBiRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApO1xyXG4gIGFzc2VydC5vayggYUVsZW1lbnQuZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSEuaW5jbHVkZXMoIGJFbGVtZW50LmlkICksIGAke2F0dHJpYnV0ZX0gZm9yIG9uZSBub2RlLmAgKTtcclxuXHJcbiAgY29uc3QgYyA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBpbm5lckNvbnRlbnQ6IFRFU1RfTEFCRUwgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBjICk7XHJcblxyXG4gIGFbIGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gXSgge1xyXG4gICAgb3RoZXJOb2RlOiBjLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcsXHJcbiAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkdcclxuICB9ICk7XHJcblxyXG4gIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKTtcclxuICBsZXQgY0VsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGMgKTtcclxuICBjb25zdCBleHBlY3RlZFZhbHVlID0gWyBiRWxlbWVudC5pZCwgY0VsZW1lbnQuaWQgXS5qb2luKCAnICcgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IGV4cGVjdGVkVmFsdWUsIGAke2F0dHJpYnV0ZX0gdHdvIG5vZGVzYCApO1xyXG5cclxuICAvLyBNYWtlIGMgaW52YWxpZGF0ZVxyXG4gIHJvb3ROb2RlLnJlbW92ZUNoaWxkKCBjICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGMgXSB9ICkgKTtcclxuXHJcbiAgY29uc3Qgb2xkVmFsdWUgPSBleHBlY3RlZFZhbHVlO1xyXG5cclxuICBhRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApO1xyXG4gIGNFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBjICk7XHJcblxyXG4gIGFzc2VydC5vayggYUVsZW1lbnQuZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSAhPT0gb2xkVmFsdWUsICdzaG91bGQgaGF2ZSBpbnZhbGlkYXRlZCBvbiB0cmVlIGNoYW5nZScgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IFsgYkVsZW1lbnQuaWQsIGNFbGVtZW50LmlkIF0uam9pbiggJyAnICksXHJcbiAgICAnc2hvdWxkIGhhdmUgaW52YWxpZGF0ZWQgb24gdHJlZSBjaGFuZ2UnICk7XHJcblxyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZGVzY3JpcHRpb25UYWdOYW1lOiAncCcsIGlubmVyQ29udGVudDogVEVTVF9MQUJFTCwgY29udGFpbmVyVGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBkICk7XHJcblxyXG4gIGJbIGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gXSgge1xyXG4gICAgb3RoZXJOb2RlOiBkLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5DT05UQUlORVJfUEFSRU5ULFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuREVTQ1JJUFRJT05fU0lCTElOR1xyXG4gIH0gKTtcclxuICBiLmNvbnRhaW5lclRhZ05hbWUgPSAnZGl2JztcclxuXHJcbiAgY29uc3QgYlBhcmVudENvbnRhaW5lciA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApLnBhcmVudEVsZW1lbnQhO1xyXG4gIGNvbnN0IGREZXNjcmlwdGlvbkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGQgKS5wYXJlbnRFbGVtZW50IS5jaGlsZE5vZGVzWyAwIF0gYXMgSFRNTEVsZW1lbnQ7XHJcbiAgYXNzZXJ0Lm9rKCBiUGFyZW50Q29udGFpbmVyLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgIT09IG9sZFZhbHVlLCAnc2hvdWxkIGhhdmUgaW52YWxpZGF0ZWQgb24gdHJlZSBjaGFuZ2UnICk7XHJcbiAgYXNzZXJ0Lm9rKCBiUGFyZW50Q29udGFpbmVyLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IGREZXNjcmlwdGlvbkVsZW1lbnQuaWQsXHJcbiAgICBgYiBwYXJlbnQgY29udGFpbmVyIGVsZW1lbnQgaXMgJHthdHRyaWJ1dGV9IGQgZGVzY3JpcHRpb24gc2libGluZ2AgKTtcclxuXHJcbiAgLy8gc2F5IHdlIGhhdmUgYSBzY2VuZSBncmFwaCB0aGF0IGxvb2tzIGxpa2U6XHJcbiAgLy8gICAgZVxyXG4gIC8vICAgICBcXFxyXG4gIC8vICAgICAgZlxyXG4gIC8vICAgICAgIFxcXHJcbiAgLy8gICAgICAgIGdcclxuICAvLyAgICAgICAgIFxcXHJcbiAgLy8gICAgICAgICAgaFxyXG4gIC8vIHdlIHdhbnQgdG8gbWFrZSBzdXJlXHJcbiAgY29uc3QgZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBmID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGcgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgaCA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBlLmFkZENoaWxkKCBmICk7XHJcbiAgZi5hZGRDaGlsZCggZyApO1xyXG4gIGcuYWRkQ2hpbGQoIGggKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggZSApO1xyXG5cclxuICBlWyBhZGRBc3NvY2lhdGlvbkZ1bmN0aW9uIF0oIHtcclxuICAgIG90aGVyTm9kZTogZixcclxuICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgfSApO1xyXG5cclxuICBmWyBhZGRBc3NvY2lhdGlvbkZ1bmN0aW9uIF0oIHtcclxuICAgIG90aGVyTm9kZTogZyxcclxuICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgfSApO1xyXG5cclxuICBnWyBhZGRBc3NvY2lhdGlvbkZ1bmN0aW9uIF0oIHtcclxuICAgIG90aGVyTm9kZTogaCxcclxuICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgfSApO1xyXG5cclxuICBsZXQgZUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGUgKTtcclxuICBsZXQgZkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGYgKTtcclxuICBsZXQgZ0VsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGcgKTtcclxuICBsZXQgaEVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGggKTtcclxuICBhc3NlcnQub2soIGVFbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IGZFbGVtZW50LmlkLCBgZUVsZW1lbnQgc2hvdWxkIGJlICR7YXR0cmlidXRlfSBmRWxlbWVudGAgKTtcclxuICBhc3NlcnQub2soIGZFbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IGdFbGVtZW50LmlkLCBgZkVsZW1lbnQgc2hvdWxkIGJlICR7YXR0cmlidXRlfSBnRWxlbWVudGAgKTtcclxuICBhc3NlcnQub2soIGdFbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgPT09IGhFbGVtZW50LmlkLCBgZ0VsZW1lbnQgc2hvdWxkIGJlICR7YXR0cmlidXRlfSBoRWxlbWVudGAgKTtcclxuXHJcbiAgLy8gcmUtYXJyYW5nZSB0aGUgc2NlbmUgZ3JhcGggYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZSBhdHRyaWJ1dGUgaWRzIHJlbWFpbiB1cCB0byBkYXRlXHJcbiAgLy8gICAgZVxyXG4gIC8vICAgICBcXFxyXG4gIC8vICAgICAgaFxyXG4gIC8vICAgICAgIFxcXHJcbiAgLy8gICAgICAgIGdcclxuICAvLyAgICAgICAgIFxcXHJcbiAgLy8gICAgICAgICAgZlxyXG4gIGUucmVtb3ZlQ2hpbGQoIGYgKTtcclxuICBmLnJlbW92ZUNoaWxkKCBnICk7XHJcbiAgZy5yZW1vdmVDaGlsZCggaCApO1xyXG5cclxuICBlLmFkZENoaWxkKCBoICk7XHJcbiAgaC5hZGRDaGlsZCggZyApO1xyXG4gIGcuYWRkQ2hpbGQoIGYgKTtcclxuICBlRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggZSApO1xyXG4gIGZFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBmICk7XHJcbiAgZ0VsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGcgKTtcclxuICBoRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggaCApO1xyXG4gIGFzc2VydC5vayggZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSA9PT0gZkVsZW1lbnQuaWQsIGBlRWxlbWVudCBzaG91bGQgc3RpbGwgYmUgJHthdHRyaWJ1dGV9IGZFbGVtZW50YCApO1xyXG4gIGFzc2VydC5vayggZkVsZW1lbnQuZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSA9PT0gZ0VsZW1lbnQuaWQsIGBmRWxlbWVudCBzaG91bGQgc3RpbGwgYmUgJHthdHRyaWJ1dGV9IGdFbGVtZW50YCApO1xyXG4gIGFzc2VydC5vayggZ0VsZW1lbnQuZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSA9PT0gaEVsZW1lbnQuaWQsIGBnRWxlbWVudCBzaG91bGQgc3RpbGwgYmUgJHthdHRyaWJ1dGV9IGhFbGVtZW50YCApO1xyXG5cclxuICAvLyB0ZXN0IGFyaWEgbGFiZWxsZWQgYnkgeW91ciBzZWxmLCBidXQgYSBkaWZmZXJlbnQgcGVlciBFbGVtZW50LCBtdWx0aXBsZSBhdHRyaWJ1dGUgaWRzIGluY2x1ZGVkIGluIHRoZSB0ZXN0LlxyXG4gIGNvbnN0IGNvbnRhaW5lclRhZ05hbWUgPSAnZGl2JztcclxuICBjb25zdCBqID0gbmV3IE5vZGUoIHtcclxuICAgIHRhZ05hbWU6ICdidXR0b24nLFxyXG4gICAgbGFiZWxUYWdOYW1lOiAnbGFiZWwnLFxyXG4gICAgZGVzY3JpcHRpb25UYWdOYW1lOiAncCcsXHJcbiAgICBjb250YWluZXJUYWdOYW1lOiBjb250YWluZXJUYWdOYW1lXHJcbiAgfSApO1xyXG4gIHJvb3ROb2RlLmNoaWxkcmVuID0gWyBqIF07XHJcblxyXG4gIGpbIGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gXSgge1xyXG4gICAgb3RoZXJOb2RlOiBqLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcsXHJcbiAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5MQUJFTF9TSUJMSU5HXHJcbiAgfSApO1xyXG5cclxuICBqWyBhZGRBc3NvY2lhdGlvbkZ1bmN0aW9uIF0oIHtcclxuICAgIG90aGVyTm9kZTogaixcclxuICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuQ09OVEFJTkVSX1BBUkVOVCxcclxuICAgIG90aGVyRWxlbWVudE5hbWU6IFBET01QZWVyLkRFU0NSSVBUSU9OX1NJQkxJTkdcclxuICB9ICk7XHJcblxyXG4gIGpbIGFkZEFzc29jaWF0aW9uRnVuY3Rpb24gXSgge1xyXG4gICAgb3RoZXJOb2RlOiBqLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5DT05UQUlORVJfUEFSRU5ULFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElOR1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgY2hlY2tPbllvdXJPd25Bc3NvY2lhdGlvbnMgPSAoIG5vZGU6IE5vZGUgKSA9PiB7XHJcblxyXG4gICAgY29uc3QgaW5zdGFuY2UgPSBub2RlWyAnX3Bkb21JbnN0YW5jZXMnIF1bIDAgXTtcclxuICAgIGNvbnN0IG5vZGVQcmltYXJ5RWxlbWVudCA9IGluc3RhbmNlLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICAgIGNvbnN0IG5vZGVQYXJlbnQgPSBub2RlUHJpbWFyeUVsZW1lbnQucGFyZW50RWxlbWVudCE7XHJcblxyXG4gICAgY29uc3QgZ2V0VW5pcXVlSWRTdHJpbmdGb3JTaWJsaW5nID0gKCBzaWJsaW5nU3RyaW5nOiBzdHJpbmcgKTogc3RyaW5nID0+IHtcclxuICAgICAgcmV0dXJuIGluc3RhbmNlLnBlZXIhLmdldEVsZW1lbnRJZCggc2libGluZ1N0cmluZywgaW5zdGFuY2UuZ2V0UERPTUluc3RhbmNlVW5pcXVlSWQoKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBhc3NlcnQub2soIG5vZGVQcmltYXJ5RWxlbWVudC5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZSApIS5pbmNsdWRlcyggZ2V0VW5pcXVlSWRTdHJpbmdGb3JTaWJsaW5nKCAnbGFiZWwnICkgKSwgYCR7YXR0cmlidXRlfSB5b3VyIG93biBsYWJlbCBlbGVtZW50LmAgKTtcclxuICAgIGFzc2VydC5vayggbm9kZVBhcmVudC5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZSApIS5pbmNsdWRlcyggZ2V0VW5pcXVlSWRTdHJpbmdGb3JTaWJsaW5nKCAnZGVzY3JpcHRpb24nICkgKSwgYHBhcmVudCAke2F0dHJpYnV0ZX0geW91ciBvd24gZGVzY3JpcHRpb24gZWxlbWVudC5gICk7XHJcblxyXG4gICAgYXNzZXJ0Lm9rKCBub2RlUGFyZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkhLmluY2x1ZGVzKCBnZXRVbmlxdWVJZFN0cmluZ0ZvclNpYmxpbmcoICdsYWJlbCcgKSApLCBgcGFyZW50ICR7YXR0cmlidXRlfSB5b3VyIG93biBsYWJlbCBlbGVtZW50LmAgKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gYWRkIGsgaW50byB0aGUgbWl4XHJcbiAgY29uc3QgayA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBrWyBhZGRBc3NvY2lhdGlvbkZ1bmN0aW9uIF0oIHtcclxuICAgIG90aGVyTm9kZTogaixcclxuICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElOR1xyXG4gIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggayApO1xyXG4gIGNvbnN0IHRlc3RLID0gKCkgPT4ge1xyXG4gICAgY29uc3Qga1ZhbHVlID0ga1sgJ19wZG9tSW5zdGFuY2VzJyBdWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgICBjb25zdCBqSUQgPSBqWyAnX3Bkb21JbnN0YW5jZXMnIF1bIDAgXS5wZWVyIS5sYWJlbFNpYmxpbmchLmdldEF0dHJpYnV0ZSggJ2lkJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBqSUQgPT09IGtWYWx1ZSwgJ2sgcG9pbnRpbmcgdG8gaicgKTtcclxuICB9O1xyXG5cclxuICAvLyBhdWRpdCB0aGUgY29udGVudCB3ZSBoYXZlIGNyZWF0ZWRcclxuICBwZG9tQXVkaXRSb290Tm9kZSggcm9vdE5vZGUgKTtcclxuXHJcbiAgLy8gQ2hlY2sgYmFzaWMgYXNzb2NpYXRpb25zIHdpdGhpbiBzaW5nbGUgbm9kZVxyXG4gIGNoZWNrT25Zb3VyT3duQXNzb2NpYXRpb25zKCBqICk7XHJcbiAgdGVzdEsoKTtcclxuXHJcbiAgLy8gTW92aW5nIHRoaXMgbm9kZSBhcm91bmQgdGhlIHNjZW5lIGdyYXBoIHNob3VsZCBub3QgY2hhbmdlIGl0J3MgYXJpYSBsYWJlbGxlZCBieSBhc3NvY2lhdGlvbnMuXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGogXSB9ICkgKTtcclxuICBjaGVja09uWW91ck93bkFzc29jaWF0aW9ucyggaiApO1xyXG4gIHRlc3RLKCk7XHJcblxyXG4gIC8vIGNoZWNrIHJlbW92ZSBjaGlsZFxyXG4gIHJvb3ROb2RlLnJlbW92ZUNoaWxkKCBqICk7XHJcbiAgY2hlY2tPbllvdXJPd25Bc3NvY2lhdGlvbnMoIGogKTtcclxuICB0ZXN0SygpO1xyXG5cclxuICAvLyBjaGVjayBkaXNwb3NlXHJcbiAgY29uc3QgalBhcmVudCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGogXSB9ICk7XHJcbiAgcm9vdE5vZGUuY2hpbGRyZW4gPSBbXTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggalBhcmVudCApO1xyXG4gIGNoZWNrT25Zb3VyT3duQXNzb2NpYXRpb25zKCBqICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGogKTtcclxuICBjaGVja09uWW91ck93bkFzc29jaWF0aW9ucyggaiApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBrICk7XHJcbiAgY2hlY2tPbllvdXJPd25Bc3NvY2lhdGlvbnMoIGogKTtcclxuICB0ZXN0SygpO1xyXG4gIGpQYXJlbnQuZGlzcG9zZSgpO1xyXG4gIGNoZWNrT25Zb3VyT3duQXNzb2NpYXRpb25zKCBqICk7XHJcbiAgdGVzdEsoKTtcclxuXHJcbiAgLy8gY2hlY2sgcmVtb3ZlQ2hpbGQgd2l0aCBkYWdcclxuICBjb25zdCBqUGFyZW50MiA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGogXSB9ICk7XHJcbiAgcm9vdE5vZGUuaW5zZXJ0Q2hpbGQoIDAsIGpQYXJlbnQyICk7XHJcbiAgY2hlY2tPbllvdXJPd25Bc3NvY2lhdGlvbnMoIGogKTtcclxuICB0ZXN0SygpO1xyXG4gIHJvb3ROb2RlLnJlbW92ZUNoaWxkKCBqUGFyZW50MiApO1xyXG4gIGNoZWNrT25Zb3VyT3duQXNzb2NpYXRpb25zKCBqICk7XHJcbiAgdGVzdEsoKTtcclxuXHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxufVxyXG5cclxudHlwZSBBc3NvY2lhdGlvbkF0dHJpYnV0ZSA9ICdhcmlhLWxhYmVsbGVkYnknIHwgJ2FyaWEtZGVzY3JpYmVkYnknIHwgJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCc7XHJcblxyXG5mdW5jdGlvbiB0ZXN0QXNzb2NpYXRpb25BdHRyaWJ1dGVCeVNldHRlcnMoIGFzc2VydDogQXNzZXJ0LCBhdHRyaWJ1dGU6IEFzc29jaWF0aW9uQXR0cmlidXRlICk6IHZvaWQge1xyXG5cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgdHlwZSBPcHRpb25OYW1lcyA9ICdhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucycgfCAnYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zJyB8ICdhY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zJztcclxuICAvLyB1c2UgYSBkaWZmZXJlbnQgc2V0dGVyIGRlcGVuZGluZyBvbiBpZiB0ZXN0aW5nIGxhYmVsbGVkYnkgb3IgZGVzY3JpYmVkYnlcclxuICBjb25zdCBhc3NvY2lhdGlvbnNBcnJheU5hbWU6IE9wdGlvbk5hbWVzID0gYXR0cmlidXRlID09PSAnYXJpYS1sYWJlbGxlZGJ5JyA/ICdhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucycgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgPT09ICdhcmlhLWRlc2NyaWJlZGJ5JyA/ICdhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMnIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMnO1xyXG5cclxuICB0eXBlIFJlbW92YWxGdW5jdGlvbk5hbWVzID0gJ3JlbW92ZUFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24nIHwgJ3JlbW92ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uJyB8ICdyZW1vdmVBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24nO1xyXG5cclxuICAvLyB1c2UgYSBkaWZmZXJlbnQgc2V0dGVyIGRlcGVuZGluZyBvbiBpZiB0ZXN0aW5nIGxhYmVsbGVkYnkgb3IgZGVzY3JpYmVkYnlcclxuICBjb25zdCBhc3NvY2lhdGlvblJlbW92YWxGdW5jdGlvbjogUmVtb3ZhbEZ1bmN0aW9uTmFtZXMgPSBhdHRyaWJ1dGUgPT09ICdhcmlhLWxhYmVsbGVkYnknID8gJ3JlbW92ZUFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24nIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgPT09ICdhcmlhLWRlc2NyaWJlZGJ5JyA/ICdyZW1vdmVBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbicgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZW1vdmVBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24nO1xyXG5cclxuICBjb25zdCBvcHRpb25zOiBQYXJhbGxlbERPTU9wdGlvbnMgPSB7XHJcbiAgICB0YWdOYW1lOiAncCcsXHJcbiAgICBsYWJlbENvbnRlbnQ6ICdoaScsXHJcbiAgICBkZXNjcmlwdGlvbkNvbnRlbnQ6ICdoZWxsbycsXHJcbiAgICBjb250YWluZXJUYWdOYW1lOiAnZGl2J1xyXG4gIH07XHJcbiAgY29uc3QgbiA9IG5ldyBOb2RlKCBvcHRpb25zICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIG4gKTtcclxuICBvcHRpb25zWyBhc3NvY2lhdGlvbnNBcnJheU5hbWUgXSA9IFtcclxuICAgIHtcclxuICAgICAgb3RoZXJOb2RlOiBuLFxyXG4gICAgICB0aGlzRWxlbWVudE5hbWU6IFBET01QZWVyLlBSSU1BUllfU0lCTElORyxcclxuICAgICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElOR1xyXG4gICAgfVxyXG4gIF07XHJcbiAgY29uc3QgbyA9IG5ldyBOb2RlKCBvcHRpb25zICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIG8gKTtcclxuXHJcbiAgY29uc3QgblBlZXIgPSBnZXRQRE9NUGVlckJ5Tm9kZSggbiApO1xyXG4gIGNvbnN0IG9FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBvICk7XHJcbiAgYXNzZXJ0Lm9rKCBvRWxlbWVudC5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZSApIS5pbmNsdWRlcyhcclxuICAgICAgblBlZXIuZ2V0RWxlbWVudElkKCAnbGFiZWwnLCBuUGVlci5wZG9tSW5zdGFuY2UhLmdldFBET01JbnN0YW5jZVVuaXF1ZUlkKCkgKSApLFxyXG4gICAgYCR7YXR0cmlidXRlfSBmb3IgdHdvIG5vZGVzIHdpdGggc2V0dGVyIChsYWJlbCkuYCApO1xyXG5cclxuICAvLyBtYWtlIGEgbGlzdCBvZiBhc3NvY2lhdGlvbnMgdG8gdGVzdCBhcyBhIHNldHRlclxyXG4gIGNvbnN0IHJhbmRvbUFzc29jaWF0aW9uT2JqZWN0ID0ge1xyXG4gICAgb3RoZXJOb2RlOiBuZXcgTm9kZSgpLFxyXG4gICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5DT05UQUlORVJfUEFSRU5ULFxyXG4gICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElOR1xyXG4gIH07XHJcbiAgb3B0aW9uc1sgYXNzb2NpYXRpb25zQXJyYXlOYW1lIF0gPSBbXHJcbiAgICB7XHJcbiAgICAgIG90aGVyTm9kZTogbmV3IE5vZGUoKSxcclxuICAgICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5DT05UQUlORVJfUEFSRU5ULFxyXG4gICAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5ERVNDUklQVElPTl9TSUJMSU5HXHJcbiAgICB9LFxyXG4gICAgcmFuZG9tQXNzb2NpYXRpb25PYmplY3QsXHJcbiAgICB7XHJcbiAgICAgIG90aGVyTm9kZTogbmV3IE5vZGUoKSxcclxuICAgICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcsXHJcbiAgICAgIG90aGVyRWxlbWVudE5hbWU6IFBET01QZWVyLkxBQkVMX1NJQkxJTkdcclxuICAgIH1cclxuICBdO1xyXG5cclxuICAvLyB0ZXN0IGdldHRlcnMgYW5kIHNldHRlcnNcclxuICBjb25zdCBtID0gbmV3IE5vZGUoIG9wdGlvbnMgKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggbSApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCBtWyBhc3NvY2lhdGlvbnNBcnJheU5hbWUgXSwgb3B0aW9uc1sgYXNzb2NpYXRpb25zQXJyYXlOYW1lIF0gKSwgJ3Rlc3QgYXNzb2NpYXRpb24gb2JqZWN0IGdldHRlcicgKTtcclxuICBtWyBhc3NvY2lhdGlvblJlbW92YWxGdW5jdGlvbiBdKCByYW5kb21Bc3NvY2lhdGlvbk9iamVjdCApO1xyXG4gIG9wdGlvbnNbIGFzc29jaWF0aW9uc0FycmF5TmFtZSBdIS5zcGxpY2UoIG9wdGlvbnNbIGFzc29jaWF0aW9uc0FycmF5TmFtZSBdIS5pbmRleE9mKCByYW5kb21Bc3NvY2lhdGlvbk9iamVjdCApLCAxICk7XHJcbiAgYXNzZXJ0Lm9rKCBfLmlzRXF1YWwoIG1bIGFzc29jaWF0aW9uc0FycmF5TmFtZSBdLCBvcHRpb25zWyBhc3NvY2lhdGlvbnNBcnJheU5hbWUgXSApLCAndGVzdCBhc3NvY2lhdGlvbiBvYmplY3QgZ2V0dGVyIGFmdGVyIHJlbW92YWwnICk7XHJcblxyXG4gIG1bIGFzc29jaWF0aW9uc0FycmF5TmFtZSBdID0gW107XHJcbiAgYXNzZXJ0Lm9rKCBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIG0gKS5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZSApID09PSBudWxsLCAnY2xlYXIgd2l0aCBzZXR0ZXInICk7XHJcblxyXG4gIG1bIGFzc29jaWF0aW9uc0FycmF5TmFtZSBdID0gb3B0aW9uc1sgYXNzb2NpYXRpb25zQXJyYXlOYW1lIF0hO1xyXG4gIG0uZGlzcG9zZSgpO1xyXG4gIGFzc2VydC5vayggbVsgYXNzb2NpYXRpb25zQXJyYXlOYW1lIF0ubGVuZ3RoID09PSAwLCAnY2xlYXJlZCB3aGVuIGRpc3Bvc2VkJyApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59XHJcblxyXG5RVW5pdC50ZXN0KCAnYXJpYS1sYWJlbGxlZGJ5JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgdGVzdEFzc29jaWF0aW9uQXR0cmlidXRlKCBhc3NlcnQsICdhcmlhLWxhYmVsbGVkYnknICk7XHJcbiAgdGVzdEFzc29jaWF0aW9uQXR0cmlidXRlQnlTZXR0ZXJzKCBhc3NlcnQsICdhcmlhLWxhYmVsbGVkYnknICk7XHJcblxyXG59ICk7XHJcblFVbml0LnRlc3QoICdhcmlhLWRlc2NyaWJlZGJ5JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgdGVzdEFzc29jaWF0aW9uQXR0cmlidXRlKCBhc3NlcnQsICdhcmlhLWRlc2NyaWJlZGJ5JyApO1xyXG4gIHRlc3RBc3NvY2lhdGlvbkF0dHJpYnV0ZUJ5U2V0dGVycyggYXNzZXJ0LCAnYXJpYS1kZXNjcmliZWRieScgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnLCBhc3NlcnQgPT4ge1xyXG5cclxuICB0ZXN0QXNzb2NpYXRpb25BdHRyaWJ1dGUoIGFzc2VydCwgJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcgKTtcclxuICB0ZXN0QXNzb2NpYXRpb25BdHRyaWJ1dGVCeVNldHRlcnMoIGFzc2VydCwgJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdQYXJhbGxlbERPTSBpbnZhbGlkYXRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IGludmFsaWRhdGlvbiBvZiBhY2Nlc3NpYmlsaXR5IChjaGFuZ2luZyBjb250ZW50IHdoaWNoIHJlcXVpcmVzIClcclxuICBjb25zdCBhMSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG5cclxuICBhMS50YWdOYW1lID0gJ2J1dHRvbic7XHJcblxyXG4gIC8vIGFjY2Vzc2libGUgaW5zdGFuY2VzIGFyZSBub3Qgc29ydGVkIHVudGlsIGFkZGVkIHRvIGEgZGlzcGxheVxyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhMSApO1xyXG5cclxuICAvLyB2ZXJpZnkgdGhhdCBlbGVtZW50cyBhcmUgaW4gdGhlIERPTVxyXG4gIGNvbnN0IGExRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYTEgKTtcclxuICBhc3NlcnQub2soIGExRWxlbWVudCwgJ2J1dHRvbiBpbiBET00nICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMUVsZW1lbnQudGFnTmFtZSA9PT0gJ0JVVFRPTicsICdidXR0b24gdGFnIG5hbWUgc2V0JyApO1xyXG5cclxuICAvLyBnaXZlIHRoZSBidXR0b24gYSBjb250YWluZXIgcGFyZW50IGFuZCBzb21lIGVtcHR5IHNpYmxpbmdzXHJcbiAgYTEubGFiZWxUYWdOYW1lID0gJ2Rpdic7XHJcbiAgYTEuZGVzY3JpcHRpb25UYWdOYW1lID0gJ3AnO1xyXG4gIGExLmNvbnRhaW5lclRhZ05hbWUgPSAnZGl2JztcclxuXHJcbiAgbGV0IGJ1dHRvbkVsZW1lbnQgPSBhMS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGxldCBwYXJlbnRFbGVtZW50ID0gYnV0dG9uRWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG4gIGNvbnN0IGJ1dHRvblBlZXJzID0gcGFyZW50RWxlbWVudCEuY2hpbGROb2RlcyBhcyB1bmtub3duIGFzIEhUTUxFbGVtZW50W107XHJcblxyXG4gIC8vIG5vdyBodG1sIHNob3VsZCBsb29rIGxpa2VcclxuICAvLyA8ZGl2IGlkPSdwYXJlbnQnPlxyXG4gIC8vICA8ZGl2IGlkPSdsYWJlbCc+PC9kaXY+XHJcbiAgLy8gIDxwIGlkPSdkZXNjcmlwdGlvbic+PC9wPlxyXG4gIC8vICA8YnV0dG9uPjwvYnV0dG9uPlxyXG4gIC8vIDwvZGl2PlxyXG4gIGFzc2VydC5vayggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIHBhcmVudEVsZW1lbnQhLmlkICksICdjb250YWluZXIgcGFyZW50IGluIERPTScgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvblBlZXJzWyAwIF0udGFnTmFtZSA9PT0gJ0RJVicsICdsYWJlbCBmaXJzdCcgKTtcclxuICBhc3NlcnQub2soIGJ1dHRvblBlZXJzWyAxIF0udGFnTmFtZSA9PT0gJ1AnLCAnZGVzY3JpcHRpb24gc2Vjb25kJyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uUGVlcnNbIDIgXS50YWdOYW1lID09PSAnQlVUVE9OJywgJ3ByaW1hcnlTaWJsaW5nIHRoaXJkJyApO1xyXG5cclxuICAvLyBtYWtlIHRoZSBidXR0b24gYSBkaXYgYW5kIHVzZSBhbiBpbmxpbmUgbGFiZWwsIGFuZCBwbGFjZSB0aGUgZGVzY3JpcHRpb24gYmVsb3dcclxuICBhMS50YWdOYW1lID0gJ2Rpdic7XHJcbiAgYTEuYXBwZW5kTGFiZWwgPSB0cnVlO1xyXG4gIGExLmFwcGVuZERlc2NyaXB0aW9uID0gdHJ1ZTtcclxuICBhMS5sYWJlbFRhZ05hbWUgPSBudWxsOyAvLyB1c2UgYXJpYSBsYWJlbCBhdHRyaWJ1dGUgaW5zdGVhZFxyXG4gIGExLmFyaWFMYWJlbCA9IFRFU1RfTEFCRUw7XHJcblxyXG4gIC8vIG5vdyB0aGUgaHRtbCBzaG91bGQgbG9vayBsaWtlXHJcbiAgLy8gPGRpdiBpZD0ncGFyZW50LWlkJz5cclxuICAvLyAgPGRpdj48L2Rpdj5cclxuICAvLyAgPHAgaWQ9J2Rlc2NyaXB0aW9uJz48L3A+XHJcbiAgLy8gPC9kaXY+XHJcblxyXG4gIC8vIHJlZGVmaW5lIHRoZSBIVE1MIGVsZW1lbnRzIChyZWZlcmVuY2VzIHdpbGwgcG9pbnQgdG8gb2xkIGVsZW1lbnRzIGJlZm9yZSBtdXRhdGlvbilcclxuICBidXR0b25FbGVtZW50ID0gYTEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICBwYXJlbnRFbGVtZW50ID0gYnV0dG9uRWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG4gIGNvbnN0IG5ld0J1dHRvblBlZXJzID0gcGFyZW50RWxlbWVudCEuY2hpbGROb2RlcyBhcyB1bmtub3duIGFzIEhUTUxFbGVtZW50W107XHJcbiAgYXNzZXJ0Lm9rKCBuZXdCdXR0b25QZWVyc1sgMCBdID09PSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGExICksICdkaXYgZmlyc3QnICk7XHJcbiAgYXNzZXJ0Lm9rKCBuZXdCdXR0b25QZWVyc1sgMSBdLmlkLmluY2x1ZGVzKCAnZGVzY3JpcHRpb24nICksICdkZXNjcmlwdGlvbiBhZnRlciBkaXYgd2hlbiBhcHBlbmRpbmcgYm90aCBlbGVtZW50cycgKTtcclxuICBhc3NlcnQub2soIG5ld0J1dHRvblBlZXJzLmxlbmd0aCA9PT0gMiwgJ25vIGxhYmVsIHBlZXIgd2hlbiB1c2luZyBqdXN0IGFyaWEtbGFiZWwgYXR0cmlidXRlJyApO1xyXG5cclxuICBjb25zdCBlbGVtZW50SW5Eb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYTEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5pZCApITtcclxuICBhc3NlcnQub2soIGVsZW1lbnRJbkRvbS5nZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsJyApID09PSBURVNUX0xBQkVMLCAnYXJpYS1sYWJlbCBzZXQnICk7XHJcblxyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdQYXJhbGxlbERPTSBzZXR0ZXJzL2dldHRlcnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBhMSA9IG5ldyBOb2RlKCB7XHJcbiAgICB0YWdOYW1lOiAnZGl2J1xyXG4gIH0gKTtcclxuICB2YXIgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCBhMSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXZhclxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICAvLyBzZXQvZ2V0IGF0dHJpYnV0ZXNcclxuICBsZXQgYTFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhMSApO1xyXG4gIGNvbnN0IGluaXRpYWxMZW5ndGggPSBhMS5nZXRQRE9NQXR0cmlidXRlcygpLmxlbmd0aDtcclxuICBhMS5zZXRQRE9NQXR0cmlidXRlKCAncm9sZScsICdzd2l0Y2gnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMS5nZXRQRE9NQXR0cmlidXRlcygpLmxlbmd0aCA9PT0gaW5pdGlhbExlbmd0aCArIDEsICdhdHRyaWJ1dGUgc2V0IHNob3VsZCBvbmx5IGFkZCAxJyApO1xyXG4gIGFzc2VydC5vayggYTEuZ2V0UERPTUF0dHJpYnV0ZXMoKVsgYTEuZ2V0UERPTUF0dHJpYnV0ZXMoKS5sZW5ndGggLSAxIF0uYXR0cmlidXRlID09PSAncm9sZScsICdhdHRyaWJ1dGUgc2V0JyApO1xyXG4gIGFzc2VydC5vayggYTFFbGVtZW50LmdldEF0dHJpYnV0ZSggJ3JvbGUnICkgPT09ICdzd2l0Y2gnLCAnSFRNTCBhdHRyaWJ1dGUgc2V0JyApO1xyXG4gIGFzc2VydC5vayggYTEuaGFzUERPTUF0dHJpYnV0ZSggJ3JvbGUnICksICdzaG91bGQgaGF2ZSBwZG9tIGF0dHJpYnV0ZScgKTtcclxuXHJcbiAgYTEucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ3JvbGUnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhYTEuaGFzUERPTUF0dHJpYnV0ZSggJ3JvbGUnICksICdzaG91bGQgbm90IGhhdmUgcGRvbSBhdHRyaWJ1dGUnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhYTFFbGVtZW50LmdldEF0dHJpYnV0ZSggJ3JvbGUnICksICdhdHRyaWJ1dGUgcmVtb3ZlZCcgKTtcclxuXHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcbiAgYTEuYWRkQ2hpbGQoIGIgKTtcclxuICBiLnRhZ05hbWUgPSAnZGl2JztcclxuICBhc3NlcnQub2soIGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApLnRhYkluZGV4ID49IDAsICdzZXQgdGFnTmFtZSBhZnRlciBmb2N1c2FibGUnICk7XHJcblxyXG4gIC8vIHRlc3Qgc2V0dGluZyBhdHRyaWJ1dGUgYXMgRE9NIHByb3BlcnR5LCBzaG91bGQgTk9UIGhhdmUgYXR0cmlidXRlIHZhbHVlIHBhaXIgKERPTSB1c2VzIGVtcHR5IHN0cmluZyBmb3IgZW1wdHkpXHJcbiAgYTEuc2V0UERPTUF0dHJpYnV0ZSggJ2hpZGRlbicsIHRydWUsIHsgYXNQcm9wZXJ0eTogdHJ1ZSB9ICk7XHJcbiAgYTFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhMSApO1xyXG4gIGFzc2VydC5lcXVhbCggYTFFbGVtZW50LmhpZGRlbiwgdHJ1ZSwgJ2hpZGRlbiBzZXQgYXMgUHJvcGVydHknICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMUVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnaGlkZGVuJyApID09PSAnJywgJ2hpZGRlbiBzaG91bGQgbm90IGJlIHNldCBhcyBhdHRyaWJ1dGUnICk7XHJcblxyXG5cclxuICAvLyB0ZXN0IHNldHRpbmcgYW5kIHJlbW92aW5nIFBET00gY2xhc3Nlc1xyXG4gIGExLnNldFBET01DbGFzcyggVEVTVF9DTEFTU19PTkUgKTtcclxuICBhc3NlcnQub2soIGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYTEgKS5jbGFzc0xpc3QuY29udGFpbnMoIFRFU1RfQ0xBU1NfT05FICksICdURVNUX0NMQVNTX09ORSBtaXNzaW5nIGZyb20gY2xhc3NMaXN0JyApO1xyXG5cclxuICAvLyB0d28gY2xhc3Nlc1xyXG4gIGExLnNldFBET01DbGFzcyggVEVTVF9DTEFTU19UV08gKTtcclxuICBhMUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGExICk7XHJcbiAgYXNzZXJ0Lm9rKCBhMUVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCBURVNUX0NMQVNTX09ORSApICYmIGExRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoIFRFU1RfQ0xBU1NfT05FICksICdPbmUgb2YgdGhlIGNsYXNzZXMgbWlzc2luZyBmcm9tIGNsYXNzTGlzdCcgKTtcclxuXHJcbiAgLy8gbW9kaWZ5IHRoZSBOb2RlIGluIGEgd2F5IHRoYXQgd291bGQgY2F1c2UgYSBmdWxsIHJlZHJhdywgbWFrZSBzdXJlIGNsYXNzZXMgc3RpbGwgZXhpc3RcclxuICBhMS50YWdOYW1lID0gJ2J1dHRvbic7XHJcbiAgYTFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhMSApO1xyXG4gIGFzc2VydC5vayggYTFFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggVEVTVF9DTEFTU19PTkUgKSAmJiBhMUVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCBURVNUX0NMQVNTX09ORSApLCAnT25lIG9mIHRoZSBjbGFzc2VzIG1pc3NpbmcgZnJvbSBjbGFzc0xpc3QgYWZ0ZXIgY2hhbmdpbmcgdGFnTmFtZScgKTtcclxuXHJcbiAgLy8gcmVtb3ZlIHRoZW0gb25lIGF0IGEgdGltZVxyXG4gIGExLnJlbW92ZVBET01DbGFzcyggVEVTVF9DTEFTU19PTkUgKTtcclxuICBhMUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGExICk7XHJcbiAgYXNzZXJ0Lm9rKCAhYTFFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggVEVTVF9DTEFTU19PTkUgKSwgJ1RFU1RfQ0xBU1NfT05FIHNob3VsZCBiZSByZW1vdmVkIGZyb20gY2xhc3NMaXN0JyApO1xyXG4gIGFzc2VydC5vayggYTFFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggVEVTVF9DTEFTU19UV08gKSwgJ1RFU1RfQ0xBU1NfVFdPIHNob3VsZCBzdGlsbCBiZSBpbiBjbGFzc0xpc3QnICk7XHJcblxyXG4gIGExLnJlbW92ZVBET01DbGFzcyggVEVTVF9DTEFTU19UV08gKTtcclxuICBhMUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGExICk7XHJcbiAgYXNzZXJ0Lm9rKCAhYTFFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggVEVTVF9DTEFTU19PTkUgKSAmJiAhYTFFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggVEVTVF9DTEFTU19PTkUgKSwgJ2NsYXNzTGlzdCBzaG91bGQgbm90IGNvbnRhaW4gYW55IGFkZGVkIGNsYXNzZXMnICk7XHJcblxyXG4gIHBkb21BdWRpdFJvb3ROb2RlKCBhMSApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnTmV4dC9QcmV2aW91cyBmb2N1c2FibGUnLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggIWNhblJ1blRlc3RzICkge1xyXG4gICAgYXNzZXJ0Lm9rKCB0cnVlLCAnU2tpcHBpbmcgdGVzdCBiZWNhdXNlIGRvY3VtZW50IGRvZXMgbm90IGhhdmUgZm9jdXMnICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBFc3BlY2lhbGx5IGltcG9ydGFudCBmb3IgcHVwcGV0ZWVyIHdoaWNoIGRvZXNuJ3Qgc3VwcG9ydCBmb2N1cy9ibHVyIGV2ZW50c1xyXG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXF1YS9pc3N1ZXMvMTM0XHJcbiAgaWYgKCAhZG9jdW1lbnQuaGFzRm9jdXMoKSApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1VuYWJsZSB0byBydW4gZm9jdXMgdGVzdHMgaWYgZG9jdW1lbnQgZG9lcyBub3QgaGF2ZSBmb2N1cy4nICk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc3QgdXRpbCA9IFBET01VdGlscztcclxuXHJcbiAgICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gICAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICAgIGRpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gICAgLy8gaW52aXNpYmxlIGlzIGRlcHJlY2F0ZWQgZG9uJ3QgdXNlIGluIGZ1dHVyZSwgdGhpcyBpcyBhIHdvcmthcm91bmQgZm9yIE5vZGVzIHdpdGhvdXQgYm91bmRzXHJcbiAgICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSwgZm9jdXNIaWdobGlnaHQ6ICdpbnZpc2libGUnIH0gKTtcclxuICAgIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gICAgY29uc3QgYyA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUsIGZvY3VzSGlnaGxpZ2h0OiAnaW52aXNpYmxlJyB9ICk7XHJcbiAgICBjb25zdCBkID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSwgZm9jdXNIaWdobGlnaHQ6ICdpbnZpc2libGUnIH0gKTtcclxuICAgIGNvbnN0IGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gICAgcm9vdE5vZGUuY2hpbGRyZW4gPSBbIGEsIGIsIGMsIGQgXTtcclxuXHJcbiAgICBhc3NlcnQub2soIGEuZm9jdXNhYmxlLCAnc2hvdWxkIGJlIGZvY3VzYWJsZScgKTtcclxuXHJcbiAgICAvLyBnZXQgZG9tIGVsZW1lbnRzIGZyb20gdGhlIGJvZHlcclxuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCByb290Tm9kZSApO1xyXG4gICAgY29uc3QgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICAgIGNvbnN0IGJFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICk7XHJcbiAgICBjb25zdCBjRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYyApO1xyXG4gICAgY29uc3QgZEVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGQgKTtcclxuXHJcbiAgICBhLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBhRWxlbWVudC5pZCwgJ2EgaW4gZm9jdXMgKG5leHQpJyApO1xyXG5cclxuICAgIHV0aWwuZ2V0TmV4dEZvY3VzYWJsZSggcm9vdEVsZW1lbnQgKS5mb2N1cygpO1xyXG4gICAgYXNzZXJ0Lm9rKCBkb2N1bWVudC5hY3RpdmVFbGVtZW50IS5pZCA9PT0gYkVsZW1lbnQuaWQsICdiIGluIGZvY3VzIChuZXh0KScgKTtcclxuXHJcbiAgICB1dGlsLmdldE5leHRGb2N1c2FibGUoIHJvb3RFbGVtZW50ICkuZm9jdXMoKTtcclxuICAgIGFzc2VydC5vayggZG9jdW1lbnQuYWN0aXZlRWxlbWVudCEuaWQgPT09IGNFbGVtZW50LmlkLCAnYyBpbiBmb2N1cyAobmV4dCknICk7XHJcblxyXG4gICAgdXRpbC5nZXROZXh0Rm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBkRWxlbWVudC5pZCwgJ2QgaW4gZm9jdXMgKG5leHQpJyApO1xyXG5cclxuICAgIHV0aWwuZ2V0TmV4dEZvY3VzYWJsZSggcm9vdEVsZW1lbnQgKS5mb2N1cygpO1xyXG4gICAgYXNzZXJ0Lm9rKCBkb2N1bWVudC5hY3RpdmVFbGVtZW50IS5pZCA9PT0gZEVsZW1lbnQuaWQsICdkIHN0aWxsIGluIGZvY3VzIChuZXh0KScgKTtcclxuXHJcbiAgICB1dGlsLmdldFByZXZpb3VzRm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBjRWxlbWVudC5pZCwgJ2MgaW4gZm9jdXMgKHByZXZpb3VzKScgKTtcclxuXHJcbiAgICB1dGlsLmdldFByZXZpb3VzRm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBiRWxlbWVudC5pZCwgJ2IgaW4gZm9jdXMgKHByZXZpb3VzKScgKTtcclxuXHJcbiAgICB1dGlsLmdldFByZXZpb3VzRm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBhRWxlbWVudC5pZCwgJ2EgaW4gZm9jdXMgKHByZXZpb3VzKScgKTtcclxuXHJcbiAgICB1dGlsLmdldFByZXZpb3VzRm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBhRWxlbWVudC5pZCwgJ2Egc3RpbGwgaW4gZm9jdXMgKHByZXZpb3VzKScgKTtcclxuXHJcbiAgICByb290Tm9kZS5yZW1vdmVBbGxDaGlsZHJlbigpO1xyXG4gICAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICAgIGEuY2hpbGRyZW4gPSBbIGIsIGMgXTtcclxuICAgIGMuYWRkQ2hpbGQoIGQgKTtcclxuICAgIGQuYWRkQ2hpbGQoIGUgKTtcclxuXHJcbiAgICAvLyB0aGlzIHNob3VsZCBoaWRlIGV2ZXJ5dGhpbmcgZXhjZXB0IGFcclxuICAgIGIuZm9jdXNhYmxlID0gZmFsc2U7XHJcbiAgICBjLnBkb21WaXNpYmxlID0gZmFsc2U7XHJcblxyXG4gICAgYS5mb2N1cygpO1xyXG4gICAgdXRpbC5nZXROZXh0Rm9jdXNhYmxlKCByb290RWxlbWVudCApLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQhLmlkID09PSBhRWxlbWVudC5pZCwgJ2Egb25seSBlbGVtZW50IGZvY3VzYWJsZScgKTtcclxuXHJcbiAgICBwZG9tQXVkaXRSb290Tm9kZSggcm9vdE5vZGUgKTtcclxuICAgIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gICAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgICAvLyBOT1RFOiBUaGUgRm9jdXNNYW5hZ2VyIHNob3VsZCBub3QgYmUgZGV0YWNoZWQgaGVyZSwgaXQgaXMgdXNlZCBnbG9iYWxseSBhbmQgaXMgbmVlZGVkIGZvciBvdGhlciB0ZXN0cy5cclxuICB9XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdSZW1vdmUgYWNjZXNzaWJpbGl0eSBzdWJ0cmVlJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIGNvbnN0IGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIGNvbnN0IGYgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogJ2ludmlzaWJsZScgfSApO1xyXG4gIHJvb3ROb2RlLmNoaWxkcmVuID0gWyBhLCBiLCBjLCBkLCBlIF07XHJcbiAgZC5hZGRDaGlsZCggZiApO1xyXG5cclxuICBsZXQgcm9vdERPTUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIHJvb3ROb2RlICk7XHJcbiAgbGV0IGRET01FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBkICk7XHJcblxyXG4gIC8vIHZlcmlmeSB0aGUgZG9tXHJcbiAgYXNzZXJ0Lm9rKCByb290RE9NRWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDUsICdjaGlsZHJlbiBhZGRlZCcgKTtcclxuXHJcbiAgLy8gcmVkZWZpbmUgYmVjYXVzZSB0aGUgZG9tIGVsZW1lbnQgcmVmZXJlbmNlcyBhYm92ZSBoYXZlIGJlY29tZSBzdGFsZVxyXG4gIHJvb3RET01FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCByb290Tm9kZSApO1xyXG4gIGRET01FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBkICk7XHJcbiAgYXNzZXJ0Lm9rKCByb290RE9NRWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDUsICdjaGlsZHJlbiBhZGRlZCBiYWNrJyApO1xyXG4gIGFzc2VydC5vayggZERPTUVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxLCAnZGVzY2VuZGFudCBjaGlsZCBhZGRlZCBiYWNrJyApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnYWNjZXNzaWJsZS1kYWcnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IGFjY2Vzc2liaWxpdHkgZm9yIG11bHRpcGxlIGluc3RhbmNlcyBvZiBhIG5vZGVcclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBmb2N1c2FibGU6IHRydWUgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBjID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICBhLmNoaWxkcmVuID0gWyBiLCBjLCBkIF07XHJcblxyXG4gIC8vIGUgaGFzIHRocmVlIHBhcmVudHMgKERBRylcclxuICBiLmFkZENoaWxkKCBlICk7XHJcbiAgYy5hZGRDaGlsZCggZSApO1xyXG4gIGQuYWRkQ2hpbGQoIGUgKTtcclxuXHJcbiAgLy8gZWFjaCBpbnN0YW5jZSBzaG91bGQgaGF2ZSBpdHMgb3duIGFjY2Vzc2libGUgY29udGVudCwgSFRNTCBzaG91bGQgbG9vayBsaWtlXHJcbiAgLy8gPGRpdiBpZD1cInJvb3RcIj5cclxuICAvLyAgIDxkaXYgaWQ9XCJhXCI+XHJcbiAgLy8gICAgIDxkaXYgaWQ9XCJiXCI+XHJcbiAgLy8gICAgICAgPGRpdiBpZD1cImUtaW5zdGFuY2UxXCI+XHJcbiAgLy8gICAgIDxkaXYgaWQ9XCJjXCI+XHJcbiAgLy8gICAgICAgPGRpdiBpZD1cImUtaW5zdGFuY2UyXCI+XHJcbiAgLy8gICAgIDxkaXYgaWQ9XCJkXCI+XHJcbiAgLy8gICAgICAgPGRpdiBpZD1cImUtaW5zdGFuY2UyXCI+XHJcbiAgY29uc3QgaW5zdGFuY2VzID0gZS5wZG9tSW5zdGFuY2VzO1xyXG4gIGFzc2VydC5vayggZS5wZG9tSW5zdGFuY2VzLmxlbmd0aCA9PT0gMywgJ25vZGUgZSBzaG91bGQgaGF2ZSAzIGFjY2Vzc2libGUgaW5zdGFuY2VzJyApO1xyXG4gIGFzc2VydC5vayggKCBpbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuaWQgIT09IGluc3RhbmNlc1sgMSBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5pZCApICYmXHJcbiAgICAgICAgICAgICAoIGluc3RhbmNlc1sgMSBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5pZCAhPT0gaW5zdGFuY2VzWyAyIF0ucGVlciEucHJpbWFyeVNpYmxpbmchLmlkICkgJiZcclxuICAgICAgICAgICAgICggaW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchLmlkICE9PSBpbnN0YW5jZXNbIDIgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuaWQgKSwgJ2VhY2ggZG9tIGVsZW1lbnQgc2hvdWxkIGJlIHVuaXF1ZScgKTtcclxuICBhc3NlcnQub2soIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBpbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuaWQgKSwgJ3BlZXIgcHJpbWFyeVNpYmxpbmcgMCBzaG91bGQgYmUgaW4gdGhlIERPTScgKTtcclxuICBhc3NlcnQub2soIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBpbnN0YW5jZXNbIDEgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuaWQgKSwgJ3BlZXIgcHJpbWFyeVNpYmxpbmcgMSBzaG91bGQgYmUgaW4gdGhlIERPTScgKTtcclxuICBhc3NlcnQub2soIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBpbnN0YW5jZXNbIDIgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuaWQgKSwgJ3BlZXIgcHJpbWFyeVNpYmxpbmcgMiBzaG91bGQgYmUgaW4gdGhlIERPTScgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3JlcGxhY2VDaGlsZCcsIGFzc2VydCA9PiB7XHJcblxyXG4gIC8vIHRoaXMgc3VpdGUgaW52b2x2ZXMgZm9jdXMgdGVzdHMgd2hpY2ggZG8gbm90IHdvcmsgb24gaGVhZGxlc3MgcHVwcGV0ZWVyXHJcbiAgaWYgKCAhZG9jdW1lbnQuaGFzRm9jdXMoKSApIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ1VuYWJsZSB0byBydW4gZm9jdXMgdGVzdHMgaWYgZG9jdW1lbnQgZG9lcyBub3QgaGF2ZSBmb2N1cy4nICk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG5cclxuXHJcbiAgICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiByZXBsYWNlQ2hpbGQgZnVuY3Rpb25cclxuICAgIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gICAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICAgIGRpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBzb21lIG5vZGVzIGZvciB0ZXN0aW5nXHJcbiAgICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgICBjb25zdCBiID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgICBjb25zdCBjID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgICBjb25zdCBkID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgICBjb25zdCBlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgICBjb25zdCBmID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcblxyXG4gICAgLy8gYSBjaGlsZCB0aGF0IHdpbGwgYmUgYWRkZWQgdGhyb3VnaCByZXBsYWNlQ2hpbGQoKVxyXG4gICAgY29uc3QgdGVzdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJywgZm9jdXNIaWdobGlnaHQ6IGZvY3VzSGlnaGxpZ2h0IH0gKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgcmVwbGFjZUNoaWxkIHB1dHMgdGhlIGNoaWxkIGluIHRoZSByaWdodCBzcG90XHJcbiAgICBhLmNoaWxkcmVuID0gWyBiLCBjLCBkLCBlLCBmIF07XHJcbiAgICBjb25zdCBpbml0SW5kZXggPSBhLmluZGV4T2ZDaGlsZCggZSApO1xyXG4gICAgYS5yZXBsYWNlQ2hpbGQoIGUsIHRlc3ROb2RlICk7XHJcbiAgICBjb25zdCBhZnRlckluZGV4ID0gYS5pbmRleE9mQ2hpbGQoIHRlc3ROb2RlICk7XHJcblxyXG4gICAgYXNzZXJ0Lm9rKCBhLmhhc0NoaWxkKCB0ZXN0Tm9kZSApLCAnYSBzaG91bGQgaGF2ZSBjaGlsZCB0ZXN0Tm9kZSBhZnRlciBpdCByZXBsYWNlZCBub2RlIGUnICk7XHJcbiAgICBhc3NlcnQub2soICFhLmhhc0NoaWxkKCBlICksICdhIHNob3VsZCBubyBsb25nZXIgaGF2ZSBjaGlsZCBub2RlIGUgYWZ0ZXIgaXQgd2FzIHJlcGxhY2VkIGJ5IHRlc3ROb2RlJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBpbml0SW5kZXggPT09IGFmdGVySW5kZXgsICd0ZXN0Tm9kZSBzaG91bGQgYmUgYXQgdGhlIHNhbWUgcGxhY2UgYXMgZSB3YXMgYWZ0ZXIgcmVwbGFjZUNoaWxkJyApO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBhIHNjZW5lIGdyYXBoIHRvIHRlc3QgaG93IHNjZW5lcnkgbWFuYWdlcyBmb2N1c1xyXG4gICAgLy8gICAgYVxyXG4gICAgLy8gICAvIFxcXHJcbiAgICAvLyAgZiAgIGJcclxuICAgIC8vICAgICAvIFxcXHJcbiAgICAvLyAgICBjICAgZFxyXG4gICAgLy8gICAgIFxcIC9cclxuICAgIC8vICAgICAgZVxyXG4gICAgYS5yZW1vdmVBbGxDaGlsZHJlbigpO1xyXG4gICAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICAgIGEuY2hpbGRyZW4gPSBbIGYsIGIgXTtcclxuICAgIGIuY2hpbGRyZW4gPSBbIGMsIGQgXTtcclxuICAgIGMuYWRkQ2hpbGQoIGUgKTtcclxuICAgIGQuYWRkQ2hpbGQoIGUgKTtcclxuXHJcbiAgICBmLmZvY3VzKCk7XHJcbiAgICBhc3NlcnQub2soIGYuZm9jdXNlZCwgJ2YgaGFzIGZvY3VzIGJlZm9yZSBiZWluZyByZXBsYWNlZCcgKTtcclxuXHJcbiAgICAvLyByZXBsYWNlIGYgd2l0aCB0ZXN0Tm9kZSwgZW5zdXJlIHRoYXQgdGVzdE5vZGUgcmVjZWl2ZXMgZm9jdXMgYWZ0ZXIgcmVwbGFjaW5nXHJcbiAgICBhLnJlcGxhY2VDaGlsZCggZiwgdGVzdE5vZGUgKTtcclxuICAgIGFzc2VydC5vayggIWEuaGFzQ2hpbGQoIGYgKSwgJ2Egc2hvdWxkIG5vIGxvbmdlciBoYXZlIGNoaWxkIGYnICk7XHJcbiAgICBhc3NlcnQub2soIGEuaGFzQ2hpbGQoIHRlc3ROb2RlICksICdhIHNob3VsZCBub3cgaGF2ZSBjaGlsZCB0ZXN0Tm9kZScgKTtcclxuICAgIGFzc2VydC5vayggIWYuZm9jdXNlZCwgJ2Ygbm8gbG9uZ2VyIGhhcyBmb2N1cyBhZnRlciBiZWluZyByZXBsYWNlZCcgKTtcclxuICAgIGFzc2VydC5vayggdGVzdE5vZGUuZm9jdXNlZCwgJ3Rlc3ROb2RlIGhhcyBmb2N1cyBhZnRlciByZXBsYWNpbmcgZm9jdXNlZCBub2RlIGYnICk7XHJcbiAgICBhc3NlcnQub2soIHRlc3ROb2RlLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCwgJ2Jyb3dzZXIgaXMgZm9jdXNpbmcgdGVzdE5vZGUnICk7XHJcblxyXG4gICAgdGVzdE5vZGUuYmx1cigpO1xyXG4gICAgYXNzZXJ0Lm9rKCAhIXRlc3ROb2RlLCAndGVzdE5vZGUgYmx1cnJlZCBiZWZvcmUgYmVpbmcgcmVwbGFjZWQnICk7XHJcblxyXG4gICAgLy8gcmVwbGFjZSB0ZXN0Tm9kZSB3aXRoIGYgYWZ0ZXIgYmx1cmluZyB0ZXN0Tm9kZSwgbmVpdGhlciBzaG91bGQgaGF2ZSBmb2N1cyBhZnRlciB0aGUgcmVwbGFjZW1lbnRcclxuICAgIGEucmVwbGFjZUNoaWxkKCB0ZXN0Tm9kZSwgZiApO1xyXG4gICAgYXNzZXJ0Lm9rKCBhLmhhc0NoaWxkKCBmICksICdub2RlIGYgc2hvdWxkIHJlcGxhY2Ugbm9kZSB0ZXN0Tm9kZScgKTtcclxuICAgIGFzc2VydC5vayggIWEuaGFzQ2hpbGQoIHRlc3ROb2RlICksICd0ZXN0Tm9kZSBzaG91bGQgbm8gbG9uZ2VyIGJlIGEgY2hpbGQgb2Ygbm9kZSBhJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCAhdGVzdE5vZGUuZm9jdXNlZCwgJ3Rlc3ROb2RlIHNob3VsZCBub3QgaGF2ZSBmb2N1cyBhZnRlciBiZWluZyByZXBsYWNlZCcgKTtcclxuICAgIGFzc2VydC5vayggIWYuZm9jdXNlZCwgJ2Ygc2hvdWxkIG5vdCBoYXZlIGZvY3VzIGFmdGVyIHJlcGxhY2luZyB0ZXN0Tm9kZSwgdGVzdE5vZGUgZGlkIG5vdCBoYXZlIGZvY3VzJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBmLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCwgJ2Jyb3dzZXIgc2hvdWxkIG5vdCBiZSBmb2N1c2luZyBub2RlIGYnICk7XHJcblxyXG4gICAgLy8gZm9jdXMgbm9kZSBkIGFuZCByZXBsYWNlIHdpdGggbm9uLWZvY3VzYWJsZSB0ZXN0Tm9kZSwgbmVpdGhlciBzaG91bGQgaGF2ZSBmb2N1cyBzaW5jZSB0ZXN0Tm9kZSBpcyBub3QgZm9jdXNhYmxlXHJcbiAgICBkLmZvY3VzKCk7XHJcbiAgICB0ZXN0Tm9kZS5mb2N1c2FibGUgPSBmYWxzZTtcclxuICAgIGFzc2VydC5vayggZC5mb2N1c2VkLCAnZCBoYXMgZm9jdXMgYmVmb3JlIGJlaW5nIHJlcGxhY2VkJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCAhdGVzdE5vZGUuZm9jdXNhYmxlLCAndGVzdE5vZGUgaXMgbm90IGZvY3VzYWJsZSBiZWZvcmUgcmVwbGFjaW5nIG5vZGUgZCcgKTtcclxuXHJcbiAgICBiLnJlcGxhY2VDaGlsZCggZCwgdGVzdE5vZGUgKTtcclxuICAgIGFzc2VydC5vayggYi5oYXNDaGlsZCggdGVzdE5vZGUgKSwgJ3Rlc3ROb2RlIHNob3VsZCBiZSBhIGNoaWxkIG9mIG5vZGUgYiBhZnRlciByZXBsYWNpbmcgd2l0aCByZXBsYWNlQ2hpbGQnICk7XHJcbiAgICBhc3NlcnQub2soICFiLmhhc0NoaWxkKCBkICksICdkIHNob3VsZCBub3QgYmUgYSBjaGlsZCBvZiBiIGFmdGVyIGl0IHdhcyByZXBsYWNlZCB3aXRoIHJlcGxhY2VDaGlsZCcgKTtcclxuICAgIGFzc2VydC5vayggIWQuZm9jdXNlZCwgJ2QgZG9lcyBub3QgaGF2ZSBmb2N1cyBhZnRlciBiZWluZyByZXBsYWNlZCBieSB0ZXN0Tm9kZScgKTtcclxuICAgIGFzc2VydC5vayggIXRlc3ROb2RlLmZvY3VzZWQsICd0ZXN0Tm9kZSBkb2VzIG5vdCBoYXZlIGZvY3VzIGFmdGVyIHJlcGxhY2luZyBub2RlIGQgKHRlc3ROb2RlIGlzIG5vdCBmb2N1c2FibGUpJyApO1xyXG5cclxuICAgIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gICAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuICB9XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdwZG9tVmlzaWJsZScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoKTtcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIC8vIHRlc3Qgd2l0aCBhIHNjZW5lIGdyYXBoXHJcbiAgLy8gICAgICAgYVxyXG4gIC8vICAgICAgLyBcXFxyXG4gIC8vICAgICBiICAgIGNcclxuICAvLyAgICAgICAgLyB8IFxcXHJcbiAgLy8gICAgICAgZCAgZSAgZlxyXG4gIC8vICAgICAgICAgICBcXCAvXHJcbiAgLy8gICAgICAgICAgICBnXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgYyA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZCA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZiA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZyA9IG5ldyBOb2RlKCk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgYS5jaGlsZHJlbiA9IFsgYiwgYyBdO1xyXG4gIGMuY2hpbGRyZW4gPSBbIGQsIGUsIGYgXTtcclxuICBlLmNoaWxkcmVuID0gWyBnIF07XHJcbiAgZi5jaGlsZHJlbiA9IFsgZyBdO1xyXG5cclxuICAvLyBnaXZlIHNvbWUgYWNjZXNzaWJsZSBjb250ZW50XHJcbiAgYS50YWdOYW1lID0gJ2Rpdic7XHJcbiAgYi50YWdOYW1lID0gJ2J1dHRvbic7XHJcbiAgZS50YWdOYW1lID0gJ2Rpdic7XHJcbiAgZy50YWdOYW1lID0gJ2J1dHRvbic7XHJcblxyXG4gIC8vIHNjZW5lcnkgc2hvdWxkIHByb2R1Y2UgdGhpcyBhY2Nlc3NpYmxlIERPTSB0cmVlXHJcbiAgLy8gPGRpdiBpZD1cImFcIj5cclxuICAvLyAgIDxidXR0b24gaWQ9XCJiXCI+XHJcbiAgLy8gICA8ZGl2IGlkPVwiZVwiPlxyXG4gIC8vICAgICAgPGJ1dHRvbiBpZD1cImcxXCI+XHJcbiAgLy8gICA8YnV0dG9uIGlkPVwiZzJcIj5cclxuXHJcbiAgLy8gZ2V0IHRoZSBhY2Nlc3NpYmxlIHByaW1hcnkgc2libGluZ3MgLSBsb29raW5nIGludG8gcGRvbUluc3RhbmNlcyBmb3IgdGVzdGluZywgdGhlcmUgaXMgbm8gZ2V0dGVyIGZvciBwcmltYXJ5U2libGluZ1xyXG4gIGNvbnN0IGRpdkEgPSBhLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcbiAgY29uc3QgYnV0dG9uQiA9IGIucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICBjb25zdCBkaXZFID0gZS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGNvbnN0IGJ1dHRvbkcxID0gZy5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGNvbnN0IGJ1dHRvbkcyID0gZy5wZG9tSW5zdGFuY2VzWyAxIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG5cclxuICBjb25zdCBkaXZBQ2hpbGRyZW4gPSBkaXZBLmNoaWxkTm9kZXM7XHJcbiAgY29uc3QgZGl2RUNoaWxkcmVuID0gZGl2RS5jaGlsZE5vZGVzO1xyXG5cclxuICBhc3NlcnQub2soIF8uaW5jbHVkZXMoIGRpdkFDaGlsZHJlbiwgYnV0dG9uQiApLCAnYnV0dG9uIEIgc2hvdWxkIGJlIGFuIGltbWVkaWF0ZSBjaGlsZCBvZiBkaXYgQScgKTtcclxuICBhc3NlcnQub2soIF8uaW5jbHVkZXMoIGRpdkFDaGlsZHJlbiwgZGl2RSApLCAnZGl2IEUgc2hvdWxkIGJlIGFuIGltbWVkaWF0ZSBjaGlsZCBvZiBkaXYgQScgKTtcclxuICBhc3NlcnQub2soIF8uaW5jbHVkZXMoIGRpdkFDaGlsZHJlbiwgYnV0dG9uRzIgKSwgJ2J1dHRvbiBHMiBzaG91bGQgYmUgYW4gaW1tZWRpYXRlIGNoaWxkIG9mIGRpdiBBJyApO1xyXG4gIGFzc2VydC5vayggXy5pbmNsdWRlcyggZGl2RUNoaWxkcmVuLCBidXR0b25HMSApLCAnYnV0dG9uIEcxIHNob3VsZCBiZSBhbiBpbW1lZGlhdGUgY2hpbGQgb2YgZGl2IEUnICk7XHJcblxyXG4gIC8vIG1ha2Ugbm9kZSBCIGludmlzaWJsZSBmb3IgYWNjZXNzaWJpbGl0eSAtIGl0IHNob3VsZCBzaG91bGQgdmlzaWJsZSwgYnV0IGhpZGRlbiBmcm9tIHNjcmVlbiByZWFkZXJzXHJcbiAgYi5wZG9tVmlzaWJsZSA9IGZhbHNlO1xyXG4gIGFzc2VydC5lcXVhbCggYi52aXNpYmxlLCB0cnVlLCAnYiBzaG91bGQgYmUgdmlzaWJsZSBhZnRlciBiZWNvbWluZyBoaWRkZW4gZm9yIHNjcmVlbiByZWFkZXJzJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYi5wZG9tVmlzaWJsZSwgZmFsc2UsICdiIHN0YXRlIHNob3VsZCByZWZsZWN0IGl0IGlzIGhpZGRlbiBmb3Igc2NyZWVuIHJlYWRlcnMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25CLmhpZGRlbiwgdHJ1ZSwgJ2J1dHRvbkIgc2hvdWxkIGJlIGhpZGRlbiBmb3Igc2NyZWVuIHJlYWRlcnMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnBkb21EaXNwbGF5ZWQsIGZhbHNlLCAncGRvbVZpc2libGU9ZmFsc2UsIGIgc2hvdWxkIGhhdmUgbm8gcmVwcmVzZW50YXRpb24gaW4gdGhlIFBET00nICk7XHJcbiAgYi5wZG9tVmlzaWJsZSA9IHRydWU7XHJcblxyXG4gIC8vIG1ha2Ugbm9kZSBCIGludmlzaWJsZSAtIGl0IHNob3VsZCBub3QgYmUgdmlzaWJsZSwgYW5kIGl0IHNob3VsZCBiZSBoaWRkZW4gZm9yIHNjcmVlbiByZWFkZXJzXHJcbiAgYi52aXNpYmxlID0gZmFsc2U7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnZpc2libGUsIGZhbHNlLCAnc3RhdGUgb2Ygbm9kZSBiIGlzIHZpc2libGUnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25CLmhpZGRlbiwgdHJ1ZSwgJ2J1dHRvbkIgaXMgaGlkZGVuIGZyb20gc2NyZWVuIHJlYWRlcnMgYWZ0ZXIgYmVjb21pbmcgaW52aXNpYmxlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYi5wZG9tVmlzaWJsZSwgdHJ1ZSwgJ3N0YXRlIG9mIG5vZGUgYiBzdGlsbCByZWZsZWN0cyBwZG9tIHZpc2liaWxpdHkgd2hlbiBpbnZpc2libGUnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnBkb21EaXNwbGF5ZWQsIGZhbHNlLCAnYiBpbnZpc2libGUgYW5kIHNob3VsZCBoYXZlIG5vIHJlcHJlc2VudGF0aW9uIGluIHRoZSBQRE9NJyApO1xyXG4gIGIudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gIC8vIG1ha2Ugbm9kZSBmIGludmlzaWJsZSAtIGcncyB0cmFpbCB0aGF0IGdvZXMgdGhyb3VnaCBmIHNob3VsZCBiZSBpbnZpc2libGUgdG8gQVQsIHRjb21oZSBjaGlsZCBvZiBjIHNob3VsZCByZW1haW4gcGRvbVZpc2libGVcclxuICBmLnZpc2libGUgPSBmYWxzZTtcclxuICBhc3NlcnQuZXF1YWwoIGcuaXNQRE9NVmlzaWJsZSgpLCB0cnVlLCAnc3RhdGUgb2YgcGRvbVZpc2libGUgc2hvdWxkIHJlbWFpbiB0cnVlIG9uIG5vZGUgZycgKTtcclxuICBhc3NlcnQub2soICFidXR0b25HMS5oaWRkZW4sICdidXR0b25HMSAoY2hpbGQgb2YgZSkgc2hvdWxkIG5vdCBiZSBoaWRkZW4gYWZ0ZXIgcGFyZW50IG5vZGUgZiBtYWRlIGludmlzaWJsZSAobm8gYWNjZXNzaWJsZSBjb250ZW50IG9uIG5vZGUgZiknICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25HMi5oaWRkZW4sIHRydWUsICdidXR0b25HMiBzaG91bGQgYmUgaGlkZGVuIGFmdGVyIHBhcmVudCBub2RlIGYgbWFkZSBpbnZpc2libGUgKG5vIGFjY2Vzc2libGUgY29udGVudCBvbiBub2RlIGYpJyApO1xyXG4gIGFzc2VydC5lcXVhbCggZy5wZG9tRGlzcGxheWVkLCB0cnVlLCAnb25lIHBhcmVudCBzdGlsbCB2aXNpYmxlLCBnIHN0aWxsIGhhcyBvbmUgUERPTUluc3RhbmNlIGRpc3BsYXllZCBpbiBQRE9NJyApO1xyXG4gIGYudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gIC8vIG1ha2Ugbm9kZSBjIChubyBhY2Nlc3NpYmxlIGNvbnRlbnQpIGludmlzaWJsZSB0byBzY3JlZW4sIGUgc2hvdWxkIGJlIGhpZGRlbiBhbmQgZzIgc2hvdWxkIGJlIGhpZGRlblxyXG4gIGMucGRvbVZpc2libGUgPSBmYWxzZTtcclxuICBhc3NlcnQuZXF1YWwoIGMudmlzaWJsZSwgdHJ1ZSwgJ2Mgc2hvdWxkIHN0aWxsIGJlIHZpc2libGUgYWZ0ZXIgYmVjb21pbmcgaW52aXNpYmxlIHRvIHNjcmVlbiByZWFkZXJzJyApO1xyXG4gIGFzc2VydC5lcXVhbCggZGl2RS5oaWRkZW4sIHRydWUsICdkaXYgRSBzaG91bGQgYmUgaGlkZGVuIGFmdGVyIHBhcmVudCBub2RlIGMgKG5vIGFjY2Vzc2libGUgY29udGVudCkgaXMgbWFkZSBpbnZpc2libGUgdG8gc2NyZWVuIHJlYWRlcnMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBidXR0b25HMi5oaWRkZW4sIHRydWUsICdidXR0b25HMiBzaG91bGQgYmUgaGlkZGVuIGFmdGVyIGFuY2VzdG9yIG5vZGUgYyAobm8gYWNjZXNzaWJsZSBjb250ZW50KSBpcyBtYWRlIGludmlzaWJsZSB0byBzY3JlZW4gcmVhZGVycycgKTtcclxuICBhc3NlcnQub2soICFkaXZBLmhpZGRlbiwgJ2RpdiBBIHNob3VsZCBub3QgaGF2ZSBiZWVuIGhpZGRlbiBieSBtYWtpbmcgZGVzY2VuZGFudCBjIGludmlzaWJsZSB0byBzY3JlZW4gcmVhZGVycycgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2lucHV0VmFsdWUnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2lucHV0JywgaW5wdXRUeXBlOiAncmFkaW8nLCBpbnB1dFZhbHVlOiAnaSBhbSB2YWx1ZScgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgbGV0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd2YWx1ZScgKSA9PT0gJ2kgYW0gdmFsdWUnLCAnc2hvdWxkIGhhdmUgY29ycmVjdCB2YWx1ZScgKTtcclxuXHJcbiAgY29uc3QgZGlmZmVyZW50VmFsdWUgPSAnaSBhbSBkaWZmZXJlbnQgdmFsdWUnO1xyXG4gIGEuaW5wdXRWYWx1ZSA9IGRpZmZlcmVudFZhbHVlO1xyXG4gIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd2YWx1ZScgKSA9PT0gZGlmZmVyZW50VmFsdWUsICdzaG91bGQgaGF2ZSBkaWZmZXJlbnQgdmFsdWUnICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhIF0gfSApICk7XHJcbiAgYUVsZW1lbnQgPSBhLnBkb21JbnN0YW5jZXNbIDEgXS5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd2YWx1ZScgKSA9PT0gZGlmZmVyZW50VmFsdWUsICdzaG91bGQgaGF2ZSB0aGUgc2FtZSBkaWZmZXJlbnQgdmFsdWUnICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdhcmlhVmFsdWVUZXh0JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYXJpYVZhbHVlVGV4dCA9ICd0aGlzIGlzIG15IHZhbHVlIHRleHQnO1xyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnaW5wdXQnLCBhcmlhVmFsdWVUZXh0OiBhcmlhVmFsdWVUZXh0LCBpbnB1dFR5cGU6ICdyYW5nZScgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgbGV0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICdhcmlhLXZhbHVldGV4dCcgKSA9PT0gYXJpYVZhbHVlVGV4dCwgJ3Nob3VsZCBoYXZlIGNvcnJlY3QgdmFsdWUgdGV4dC4nICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLmFyaWFWYWx1ZVRleHQgPT09IGFyaWFWYWx1ZVRleHQsICdzaG91bGQgaGF2ZSBjb3JyZWN0IHZhbHVlIHRleHQsIGdldHRlcicgKTtcclxuXHJcbiAgY29uc3QgZGlmZmVyZW50VmFsdWUgPSAnaSBhbSBkaWZmZXJlbnQgdmFsdWUgdGV4dCc7XHJcbiAgYS5hcmlhVmFsdWVUZXh0ID0gZGlmZmVyZW50VmFsdWU7XHJcbiAgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2FyaWEtdmFsdWV0ZXh0JyApID09PSBkaWZmZXJlbnRWYWx1ZSwgJ3Nob3VsZCBoYXZlIGRpZmZlcmVudCB2YWx1ZSB0ZXh0JyApO1xyXG4gIGFzc2VydC5vayggYS5hcmlhVmFsdWVUZXh0ID09PSBkaWZmZXJlbnRWYWx1ZSwgJ3Nob3VsZCBoYXZlIGRpZmZlcmVudCB2YWx1ZSB0ZXh0LCBnZXR0ZXInICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBhIF0gfSApICk7XHJcbiAgYUVsZW1lbnQgPSBhLnBkb21JbnN0YW5jZXNbIDEgXS5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICdhcmlhLXZhbHVldGV4dCcgKSA9PT0gZGlmZmVyZW50VmFsdWUsICdzaG91bGQgaGF2ZSB0aGUgc2FtZSBkaWZmZXJlbnQgdmFsdWUgdGV4dCBhZnRlciBjaGlsZHJlbiBtb3ZpbmcnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLmFyaWFWYWx1ZVRleHQgPT09IGRpZmZlcmVudFZhbHVlLCAnc2hvdWxkIGhhdmUgdGhlIHNhbWUgZGlmZmVyZW50IHZhbHVlIHRleHQgYWZ0ZXIgY2hpbGRyZW4gbW92aW5nLCBnZXR0ZXInICk7XHJcblxyXG4gIGEudGFnTmFtZSA9ICdkaXYnO1xyXG4gIGFFbGVtZW50ID0gYS5wZG9tSW5zdGFuY2VzWyAxIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGFzc2VydC5vayggYUVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS12YWx1ZXRleHQnICkgPT09IGRpZmZlcmVudFZhbHVlLCAndmFsdWUgdGV4dCBhcyBkaXYnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLmFyaWFWYWx1ZVRleHQgPT09IGRpZmZlcmVudFZhbHVlLCAndmFsdWUgdGV4dCBhcyBkaXYsIGdldHRlcicgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuXHJcblFVbml0LnRlc3QoICdzZXRQRE9NQXR0cmlidXRlJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnLCBsYWJlbENvbnRlbnQ6ICdoZWxsbycgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcblxyXG4gIGEuc2V0UERPTUF0dHJpYnV0ZSggJ3Rlc3QnLCAndGVzdDEnICk7XHJcbiAgbGV0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd0ZXN0JyApID09PSAndGVzdDEnLCAnc2V0UERPTUF0dHJpYnV0ZSBmb3IgcHJpbWFyeSBzaWJsaW5nJyApO1xyXG5cclxuICBhLnJlbW92ZVBET01BdHRyaWJ1dGUoICd0ZXN0JyApO1xyXG4gIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd0ZXN0JyApID09PSBudWxsLCAncmVtb3ZlUERPTUF0dHJpYnV0ZSBmb3IgcHJpbWFyeSBzaWJsaW5nJyApO1xyXG5cclxuICBhLnNldFBET01BdHRyaWJ1dGUoICd0ZXN0JywgJ3Rlc3RWYWx1ZScgKTtcclxuICBhLnNldFBET01BdHRyaWJ1dGUoICd0ZXN0JywgJ3Rlc3RWYWx1ZUxhYmVsJywge1xyXG4gICAgZWxlbWVudE5hbWU6IFBET01QZWVyLkxBQkVMX1NJQkxJTkdcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHRlc3RCb3RoQXR0cmlidXRlcyA9ICgpID0+IHtcclxuICAgIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgICBjb25zdCBhTGFiZWxFbGVtZW50ID0gYUVsZW1lbnQucGFyZW50RWxlbWVudCEuY2hpbGRyZW5bIERFRkFVTFRfTEFCRUxfU0lCTElOR19JTkRFWCBdO1xyXG4gICAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICd0ZXN0JyApID09PSAndGVzdFZhbHVlJywgJ3NldFBET01BdHRyaWJ1dGUgZm9yIHByaW1hcnkgc2libGluZyAyJyApO1xyXG4gICAgYXNzZXJ0Lm9rKCBhTGFiZWxFbGVtZW50LmdldEF0dHJpYnV0ZSggJ3Rlc3QnICkgPT09ICd0ZXN0VmFsdWVMYWJlbCcsICdzZXRQRE9NQXR0cmlidXRlIGZvciBsYWJlbCBzaWJsaW5nJyApO1xyXG4gIH07XHJcbiAgdGVzdEJvdGhBdHRyaWJ1dGVzKCk7XHJcblxyXG4gIHJvb3ROb2RlLnJlbW92ZUNoaWxkKCBhICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGEgXSB9ICkgKTtcclxuICB0ZXN0Qm90aEF0dHJpYnV0ZXMoKTtcclxuXHJcbiAgYS5yZW1vdmVQRE9NQXR0cmlidXRlKCAndGVzdCcsIHtcclxuICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5MQUJFTF9TSUJMSU5HXHJcbiAgfSApO1xyXG4gIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgY29uc3QgYUxhYmVsRWxlbWVudCA9IGFFbGVtZW50LnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmdldEF0dHJpYnV0ZSggJ3Rlc3QnICkgPT09ICd0ZXN0VmFsdWUnLCAncmVtb3ZlUERPTUF0dHJpYnV0ZSBmb3IgbGFiZWwgc2hvdWxkIG5vdCBlZmZlY3QgcHJpbWFyeSBzaWJsaW5nICcgKTtcclxuICBhc3NlcnQub2soIGFMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAndGVzdCcgKSA9PT0gbnVsbCwgJ3JlbW92ZVBET01BdHRyaWJ1dGUgZm9yIGxhYmVsIHNpYmxpbmcnICk7XHJcblxyXG4gIGEucmVtb3ZlUERPTUF0dHJpYnV0ZXMoKTtcclxuICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gJ211bHRpVGVzdCc7XHJcbiAgYS5zZXRQRE9NQXR0cmlidXRlKCBhdHRyaWJ1dGVOYW1lLCAndHJ1ZScsIHtcclxuICAgIGFzUHJvcGVydHk6IGZhbHNlXHJcbiAgfSApO1xyXG4gIGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZU5hbWUgKSA9PT0gJ3RydWUnLCAnYXNQcm9wZXJ0eTpmYWxzZSBzaG91bGQgc2V0IGF0dHJpYnV0ZScgKTtcclxuXHJcbiAgYS5zZXRQRE9NQXR0cmlidXRlKCBhdHRyaWJ1dGVOYW1lLCBmYWxzZSwge1xyXG4gICAgYXNQcm9wZXJ0eTogdHJ1ZVxyXG4gIH0gKTtcclxuICBhc3NlcnQub2soICFhRWxlbWVudC5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZU5hbWUgKSwgJ2FzUHJvcGVydHk6dHJ1ZSBzaG91bGQgcmVtb3ZlIGF0dHJpYnV0ZScgKTtcclxuXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBmb3IgdGVzdGluZ1xyXG4gIGFzc2VydC5lcXVhbCggYUVsZW1lbnRbIGF0dHJpYnV0ZU5hbWUgXSwgZmFsc2UsICdhc1Byb3BlcnR5OnRydWUgc2hvdWxkIHNldCBwcm9wZXJ0eScgKTtcclxuXHJcbiAgY29uc3QgdGVzdEF0dHJpYnV0ZXMgPSBhLmdldFBET01BdHRyaWJ1dGVzKCkuZmlsdGVyKCBhID0+IGEuYXR0cmlidXRlID09PSBhdHRyaWJ1dGVOYW1lICk7XHJcbiAgYXNzZXJ0Lm9rKCB0ZXN0QXR0cmlidXRlcy5sZW5ndGggPT09IDEsICdhc1Byb3BlcnR5IGNoYW5nZSBzaG91bGQgYWx0ZXIgdGhlIGF0dHJpYnV0ZSwgbm90IGFkZCBhIG5ldyBvbmUuJyApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAncGRvbUNoZWNrZWQnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2lucHV0JywgaW5wdXRUeXBlOiAncmFkaW8nLCBwZG9tQ2hlY2tlZDogdHJ1ZSB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICBsZXQgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIGFzc2VydC5vayggYUVsZW1lbnQuY2hlY2tlZCwgJ3Nob3VsZCBiZSBjaGVja2VkJyApO1xyXG5cclxuICBhLnBkb21DaGVja2VkID0gZmFsc2U7XHJcbiAgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIGFzc2VydC5vayggIWFFbGVtZW50LmNoZWNrZWQsICdzaG91bGQgbm90IGJlIGNoZWNrZWQnICk7XHJcblxyXG4gIGEuaW5wdXRUeXBlID0gJ3JhbmdlJztcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIGEucGRvbUNoZWNrZWQgPSB0cnVlO1xyXG4gIH0sIC8uKi8sICdzaG91bGQgZmFpbCBpZiBpbnB1dFR5cGUgcmFuZ2UnICk7XHJcblxyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnc3dhcFZpc2liaWxpdHknLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggIWNhblJ1blRlc3RzICkge1xyXG4gICAgYXNzZXJ0Lm9rKCB0cnVlLCAnU2tpcHBpbmcgdGVzdCBiZWNhdXNlIGRvY3VtZW50IGRvZXMgbm90IGhhdmUgZm9jdXMnICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBzd2FwVmlzaWJpbGl0eSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGRpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpO1xyXG5cclxuICAvLyBhIGN1c3RvbSBmb2N1cyBoaWdobGlnaHQgKHNpbmNlIGR1bW15IG5vZGUncyBoYXZlIG5vIGJvdW5kcylcclxuICBjb25zdCBmb2N1c0hpZ2hsaWdodCA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDEwLCAxMCApO1xyXG5cclxuICAvLyBjcmVhdGUgc29tZSBub2RlcyBmb3IgdGVzdGluZ1xyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJywgZm9jdXNIaWdobGlnaHQ6IGZvY3VzSGlnaGxpZ2h0IH0gKTtcclxuICBjb25zdCBiID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicsIGZvY3VzSGlnaGxpZ2h0OiBmb2N1c0hpZ2hsaWdodCB9ICk7XHJcbiAgY29uc3QgYyA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nLCBmb2N1c0hpZ2hsaWdodDogZm9jdXNIaWdobGlnaHQgfSApO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG4gIGEuY2hpbGRyZW4gPSBbIGIsIGMgXTtcclxuXHJcbiAgLy8gc3dhcCB2aXNpYmlsaXR5IGJldHdlZW4gdHdvIG5vZGVzLCB2aXNpYmlsaXR5IHNob3VsZCBiZSBzd2FwcGVkIGFuZCBuZWl0aGVyIHNob3VsZCBoYXZlIGtleWJvYXJkIGZvY3VzXHJcbiAgYi52aXNpYmxlID0gdHJ1ZTtcclxuICBjLnZpc2libGUgPSBmYWxzZTtcclxuICBiLnN3YXBWaXNpYmlsaXR5KCBjICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnZpc2libGUsIGZhbHNlLCAnYiBzaG91bGQgbm93IGJlIGludmlzaWJsZScgKTtcclxuICBhc3NlcnQuZXF1YWwoIGMudmlzaWJsZSwgdHJ1ZSwgJ2Mgc2hvdWxkIG5vdyBiZSB2aXNpYmxlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYi5mb2N1c2VkLCBmYWxzZSwgJ2Igc2hvdWxkIG5vdCBoYXZlIGZvY3VzIGFmdGVyIGJlaW5nIG1hZGUgaW52aXNpYmxlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYy5mb2N1c2VkLCBmYWxzZSwgJ2Mgc2hvdWxkIG5vdCBoYXZlICBmb2N1cyBzaW5jZSBiIGRpZCBub3QgaGF2ZSBmb2N1cycgKTtcclxuXHJcbiAgLy8gc3dhcCB2aXNpYmlsaXR5IGJldHdlZW4gdHdvIG5vZGVzIHdoZXJlIHRoZSBvbmUgdGhhdCBpcyBpbml0aWFsbHkgdmlzaWJsZSBoYXMga2V5Ym9hcmQgZm9jdXMsIHRoZSBuZXdseSB2aXNpYmxlXHJcbiAgLy8gbm9kZSB0aGVuIHJlY2VpdmUgZm9jdXNcclxuICBiLnZpc2libGUgPSB0cnVlO1xyXG4gIGMudmlzaWJsZSA9IGZhbHNlO1xyXG4gIGIuZm9jdXMoKTtcclxuICBiLnN3YXBWaXNpYmlsaXR5KCBjICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnZpc2libGUsIGZhbHNlLCAnYiBzaG91bGQgYmUgaW52aXNpYmxlIGFmdGVyIHN3YXBWaXNpYmlsaXR5JyApO1xyXG4gIGFzc2VydC5lcXVhbCggYy52aXNpYmxlLCB0cnVlLCAnYyBzaG91bGQgYmUgdmlzaWJsZSBhZnRlciAgc3dhcFZpc2liaWxpdHknICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLmZvY3VzZWQsIGZhbHNlLCAnYiBzaG91bGQgbm8gbG9uZ2VyIGhhdmUgZm9jdXMgIGFmdGVyIHN3YXBWaXNpYmlsaXR5JyApO1xyXG4gIGFzc2VydC5lcXVhbCggYy5mb2N1c2VkLCB0cnVlLCAnYyBzaG91bGQgbm93IGhhdmUgZm9jdXMgYWZ0ZXIgc3dhcFZpc2liaWxpdHknICk7XHJcblxyXG4gIC8vIHN3YXAgdmlzaWJpbGl0eSBiZXR3ZWVuIHR3byBub2RlcyB3aGVyZSB0aGUgb25lIHRoYXQgaXMgaW5pdGlhbGx5IHZpc2libGUgaGFzIGtleWJvYXJkIGZvY3VzLCB0aGUgbmV3bHkgdmlzaWJsZVxyXG4gIC8vIG5vZGUgdGhlbiByZWNlaXZlIGZvY3VzIC0gbGlrZSB0aGUgcHJldmlvdXMgdGVzdCBidXQgYy5zd2FwVmlzaWJpbGl0eSggYiApIGlzIHRoZSBzYW1lIGFzIGIuc3dhcFZpc2liaWxpdHkoIGMgKVxyXG4gIGIudmlzaWJsZSA9IHRydWU7XHJcbiAgYy52aXNpYmxlID0gZmFsc2U7XHJcbiAgYi5mb2N1cygpO1xyXG4gIGIuc3dhcFZpc2liaWxpdHkoIGMgKTtcclxuICBhc3NlcnQuZXF1YWwoIGIudmlzaWJsZSwgZmFsc2UsICdiIHNob3VsZCBiZSBpbnZpc2libGUgYWZ0ZXIgc3dhcFZpc2liaWxpdHknICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjLnZpc2libGUsIHRydWUsICdjIHNob3VsZCBiZSB2aXNpYmxlIGFmdGVyICBzd2FwVmlzaWJpbGl0eScgKTtcclxuICBhc3NlcnQuZXF1YWwoIGIuZm9jdXNlZCwgZmFsc2UsICdiIHNob3VsZCBubyBsb25nZXIgaGF2ZSBmb2N1cyAgYWZ0ZXIgc3dhcFZpc2liaWxpdHknICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjLmZvY3VzZWQsIHRydWUsICdjIHNob3VsZCBub3cgaGF2ZSBmb2N1cyBhZnRlciBzd2FwVmlzaWJpbGl0eScgKTtcclxuXHJcbiAgLy8gc3dhcCB2aXNpYmlsaXR5IGJldHdlZW4gdHdvIG5vZGVzIHdoZXJlIHRoZSBmaXJzdCBub2RlIGhhcyBmb2N1cywgYnV0IHRoZSBzZWNvbmQgbm9kZSBpcyBub3QgZm9jdXNhYmxlLiBBZnRlclxyXG4gIC8vIHN3YXBwaW5nLCBuZWl0aGVyIHNob3VsZCBoYXZlIGZvY3VzXHJcbiAgYi52aXNpYmxlID0gdHJ1ZTtcclxuICBjLnZpc2libGUgPSBmYWxzZTtcclxuICBiLmZvY3VzKCk7XHJcbiAgYy5mb2N1c2FibGUgPSBmYWxzZTtcclxuICBiLnN3YXBWaXNpYmlsaXR5KCBjICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBiLnZpc2libGUsIGZhbHNlLCAnYiBzaG91bGQgYmUgaW52aXNpYmxlIGFmdGVyIHZpc2liaWxpdHkgaXMgc3dhcHBlZCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIGMudmlzaWJsZSwgdHJ1ZSwgJ2Mgc2hvdWxkIGJlIHZpc2libGUgYWZ0ZXIgdmlzaWJpbGl0eSBpcyBzd2FwcGVkJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYi5mb2N1c2VkLCBmYWxzZSwgJ2Igc2hvdWxkIG5vIGxvbmdlciBoYXZlIGZvY3VzIGFmdGVyIHZpc2liaWxpdHkgaXMgc3dhcHBlZCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIGMuZm9jdXNlZCwgZmFsc2UsICdjIHNob3VsZCBub3QgaGF2ZSBmb2N1cyBhZnRlciB2aXNpYmlsaXR5IGlzIHN3YXBwZWQgYmVjYXVzZSBpdCBpcyBub3QgZm9jdXNhYmxlJyApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnQXJpYSBMYWJlbCBTZXR0ZXInLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBzd2FwVmlzaWJpbGl0eSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIC8vIGNyZWF0ZSBzb21lIG5vZGVzIGZvciB0ZXN0aW5nXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nLCBhcmlhTGFiZWw6IFRFU1RfTEFCRUxfMiB9ICk7XHJcblxyXG4gIGFzc2VydC5vayggYS5hcmlhTGFiZWwgPT09IFRFU1RfTEFCRUxfMiwgJ2FyaWEtbGFiZWwgZ2V0dGVyL3NldHRlcicgKTtcclxuICBhc3NlcnQub2soIGEubGFiZWxDb250ZW50ID09PSBudWxsLCAnbm8gb3RoZXIgbGFiZWwgc2V0IHdpdGggYXJpYS1sYWJlbCcgKTtcclxuICBhc3NlcnQub2soIGEuaW5uZXJDb250ZW50ID09PSBudWxsLCAnbm8gaW5uZXIgY29udGVudCBzZXQgd2l0aCBhcmlhLWxhYmVsJyApO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG4gIGxldCBidXR0b25BID0gYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGFzc2VydC5vayggYnV0dG9uQS5nZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsJyApID09PSBURVNUX0xBQkVMXzIsICdzZXR0ZXIgb24gZG9tIGVsZW1lbnQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBidXR0b25BLmlubmVySFRNTCA9PT0gJycsICdubyBpbm5lciBodG1sIHdpdGggYXJpYS1sYWJlbCBzZXR0ZXInICk7XHJcblxyXG4gIGEuYXJpYUxhYmVsID0gbnVsbDtcclxuXHJcbiAgYnV0dG9uQSA9IGEucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nITtcclxuICBhc3NlcnQub2soICFidXR0b25BLmhhc0F0dHJpYnV0ZSggJ2FyaWEtbGFiZWwnICksICdzZXR0ZXIgY2FuIGNsZWFyIG9uIGRvbSBlbGVtZW50JyApO1xyXG4gIGFzc2VydC5vayggYnV0dG9uQS5pbm5lckhUTUwgPT09ICcnLCAnbm8gaW5uZXIgaHRtbCB3aXRoIGFyaWEtbGFiZWwgc2V0dGVyIHdoZW4gY2xlYXJpbmcnICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLmFyaWFMYWJlbCA9PT0gbnVsbCwgJ2NsZWFyZWQgaW4gTm9kZSBtb2RlbC4nICk7XHJcblxyXG4gIHBkb21BdWRpdFJvb3ROb2RlKCByb290Tm9kZSApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnZm9jdXNhYmxlIG9wdGlvbicsIGFzc2VydCA9PiB7XHJcbiAgaWYgKCAhY2FuUnVuVGVzdHMgKSB7XHJcbiAgICBhc3NlcnQub2soIHRydWUsICdTa2lwcGluZyB0ZXN0IGJlY2F1c2UgZG9jdW1lbnQgZG9lcyBub3QgaGF2ZSBmb2N1cycgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIHRlc3QgdGhlIGJlaGF2aW9yIG9mIGZvY3VzYWJsZSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGRpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBhLmZvY3VzYWJsZSwgdHJ1ZSwgJ2ZvY3VzYWJsZSBvcHRpb24gc2V0dGVyJyApO1xyXG4gIGFzc2VydC5vayggZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICkudGFiSW5kZXggPT09IDAsICd0YWIgaW5kZXggb24gcHJpbWFyeSBzaWJsaW5nIHdpdGggc2V0dGVyJyApO1xyXG5cclxuICAvLyBjaGFuZ2UgdGhlIHRhZyBuYW1lLCBidXQgZm9jdXNhYmxlIHNob3VsZCBzdGF5IHRoZSBzYW1lXHJcbiAgYS50YWdOYW1lID0gJ3AnO1xyXG5cclxuICBhc3NlcnQuZXF1YWwoIGEuZm9jdXNhYmxlLCB0cnVlLCAndGFnTmFtZSBvcHRpb24gc2hvdWxkIG5vdCBjaGFuZ2UgZm9jdXNhYmxlIHZhbHVlJyApO1xyXG4gIGFzc2VydC5vayggZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICkudGFiSW5kZXggPT09IDAsICd0YWdOYW1lIG9wdGlvbiBzaG91bGQgbm90IGNoYW5nZSB0YWIgaW5kZXggb24gcHJpbWFyeSBzaWJsaW5nJyApO1xyXG5cclxuICBhLmZvY3VzYWJsZSA9IGZhbHNlO1xyXG4gIGFzc2VydC5vayggZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICkudGFiSW5kZXggPT09IC0xLCAnc2V0IGZvY3VzYWJsZSBmYWxzZScgKTtcclxuXHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdwJyB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGIgKTtcclxuXHJcbiAgYi5mb2N1c2FibGUgPSB0cnVlO1xyXG5cclxuICBhc3NlcnQub2soIGIuZm9jdXNhYmxlLCAnc2V0IGZvY3VzYWJsZSBhcyBzZXR0ZXInICk7XHJcbiAgYXNzZXJ0Lm9rKCBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKS50YWJJbmRleCA9PT0gMCwgJ3NldCBmb2N1c2FibGUgYXMgc2V0dGVyJyApO1xyXG5cclxuICAvLyBIVE1MIGVsZW1lbnRzIHRoYXQgYXJlIG5hdGl2ZWx5IGZvY3VzYWJsZSBhcmUgZm9jdXNhYmxlIGJ5IGRlZmF1bHRcclxuICBjb25zdCBjID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2J1dHRvbicgfSApO1xyXG4gIGFzc2VydC5vayggYy5mb2N1c2FibGUsICdidXR0b24gaXMgZm9jdXNhYmxlIGJ5IGRlZmF1bHQnICk7XHJcblxyXG4gIC8vIGNoYW5nZSB0YWdOYW1lIHRvIHNvbWV0aGluZyB0aGF0IGlzIG5vdCBmb2N1c2FibGUsIGZvY3VzYWJsZSBzaG91bGQgYmUgZmFsc2VcclxuICBjLnRhZ05hbWUgPSAncCc7XHJcbiAgYXNzZXJ0Lm9rKCAhYy5mb2N1c2FibGUsICdidXR0b24gY2hhbmdlZCB0byBwYXJhZ3JhcGgsIHNob3VsZCBubyBsb25nZXIgYmUgZm9jdXNhYmxlJyApO1xyXG5cclxuICAvLyBXaGVuIGZvY3VzYWJsZSBpcyBzZXQgdG8gbnVsbCBvbiBhbiBlbGVtZW50IHRoYXQgaXMgbm90IGZvY3VzYWJsZSBieSBkZWZhdWx0LCBpdCBzaG91bGQgbG9zZSBmb2N1c1xyXG4gIGNvbnN0IGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgZm9jdXNhYmxlOiB0cnVlLCBmb2N1c0hpZ2hsaWdodDogZm9jdXNIaWdobGlnaHQgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBkICk7XHJcbiAgZC5mb2N1cygpO1xyXG4gIGFzc2VydC5vayggZC5mb2N1c2VkLCAnZm9jdXNhYmxlIGRpdiBzaG91bGQgYmUgZm9jdXNlZCBhZnRlciBjYWxsaW5nIGZvY3VzKCknICk7XHJcblxyXG4gIGQuZm9jdXNhYmxlID0gbnVsbDtcclxuICBhc3NlcnQub2soICFkLmZvY3VzZWQsICdkZWZhdWx0IGRpdiBzaG91bGQgbG9zZSBmb2N1cyBhZnRlciBub2RlIHJlc3RvcmVkIHRvIG51bGwgZm9jdXNhYmxlJyApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2FwcGVuZCBzaWJsaW5ncy9hcHBlbmRMYWJlbC9hcHBlbmREZXNjcmlwdGlvbiBzZXR0ZXJzJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgLy8gdGVzdCB0aGUgYmVoYXZpb3Igb2YgZm9jdXNhYmxlIGZ1bmN0aW9uXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHtcclxuICAgIHRhZ05hbWU6ICdsaScsXHJcbiAgICBpbm5lckNvbnRlbnQ6IFRFU1RfSU5ORVJfQ09OVEVOVCxcclxuICAgIGxhYmVsVGFnTmFtZTogJ2gzJyxcclxuICAgIGxhYmVsQ29udGVudDogVEVTVF9MQUJFTCxcclxuICAgIGRlc2NyaXB0aW9uQ29udGVudDogVEVTVF9ERVNDUklQVElPTixcclxuICAgIGNvbnRhaW5lclRhZ05hbWU6ICdzZWN0aW9uJyxcclxuICAgIGFwcGVuZExhYmVsOiB0cnVlXHJcbiAgfSApO1xyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcblxyXG4gIGNvbnN0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgbGV0IGNvbnRhaW5lckVsZW1lbnQgPSBhRWxlbWVudC5wYXJlbnRFbGVtZW50ITtcclxuICBhc3NlcnQub2soIGNvbnRhaW5lckVsZW1lbnQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0VDVElPTicsICdjb250YWluZXIgcGFyZW50IGlzIHNldCB0byByaWdodCB0YWcnICk7XHJcblxyXG4gIGxldCBwZWVyRWxlbWVudHMgPSBjb250YWluZXJFbGVtZW50LmNoaWxkTm9kZXMgYXMgdW5rbm93biBhcyBIVE1MRWxlbWVudFtdO1xyXG4gIGFzc2VydC5vayggcGVlckVsZW1lbnRzLmxlbmd0aCA9PT0gMywgJ2V4cGVjdGVkIHRocmVlIHNpYmxpbmdzJyApO1xyXG4gIGFzc2VydC5vayggcGVlckVsZW1lbnRzWyAwIF0udGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FLCAnZGVzY3JpcHRpb24gZmlyc3Qgc2libGluZycgKTtcclxuICBhc3NlcnQub2soIHBlZXJFbGVtZW50c1sgMSBdLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0xJJywgJ3ByaW1hcnkgc2libGluZyBzZWNvbmQgc2libGluZycgKTtcclxuICBhc3NlcnQub2soIHBlZXJFbGVtZW50c1sgMiBdLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0gzJywgJ2xhYmVsIHNpYmxpbmcgbGFzdCcgKTtcclxuXHJcbiAgYS5hcHBlbmREZXNjcmlwdGlvbiA9IHRydWU7XHJcbiAgY29udGFpbmVyRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApLnBhcmVudEVsZW1lbnQhO1xyXG4gIHBlZXJFbGVtZW50cyA9IGNvbnRhaW5lckVsZW1lbnQuY2hpbGROb2RlcyBhcyB1bmtub3duIGFzIEhUTUxFbGVtZW50W107XHJcbiAgYXNzZXJ0Lm9rKCBjb250YWluZXJFbGVtZW50LmNoaWxkTm9kZXMubGVuZ3RoID09PSAzLCAnZXhwZWN0ZWQgdGhyZWUgc2libGluZ3MnICk7XHJcbiAgYXNzZXJ0Lm9rKCBwZWVyRWxlbWVudHNbIDAgXS50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdMSScsICdwcmltYXJ5IHNpYmxpbmcgZmlyc3Qgc2libGluZycgKTtcclxuICBhc3NlcnQub2soIHBlZXJFbGVtZW50c1sgMSBdLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0gzJywgJ2xhYmVsIHNpYmxpbmcgc2Vjb25kJyApO1xyXG4gIGFzc2VydC5vayggcGVlckVsZW1lbnRzWyAyIF0udGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FLCAnZGVzY3JpcHRpb24gbGFzdCBzaWJsaW5nJyApO1xyXG5cclxuICAvLyBjbGVhciBpdCBvdXQgYmFjayB0byBkZWZhdWx0cyBzaG91bGQgd29yayB3aXRoIHNldHRlcnNcclxuICBhLmFwcGVuZERlc2NyaXB0aW9uID0gZmFsc2U7XHJcbiAgYS5hcHBlbmRMYWJlbCA9IGZhbHNlO1xyXG4gIGNvbnRhaW5lckVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKS5wYXJlbnRFbGVtZW50ITtcclxuICBwZWVyRWxlbWVudHMgPSBjb250YWluZXJFbGVtZW50LmNoaWxkTm9kZXMgYXMgdW5rbm93biBhcyBIVE1MRWxlbWVudFtdO1xyXG4gIGFzc2VydC5vayggY29udGFpbmVyRWxlbWVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMywgJ2V4cGVjdGVkIHRocmVlIHNpYmxpbmdzJyApO1xyXG4gIGFzc2VydC5vayggcGVlckVsZW1lbnRzWyAwIF0udGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnSDMnLCAnbGFiZWwgc2libGluZyBmaXJzdCcgKTtcclxuICBhc3NlcnQub2soIHBlZXJFbGVtZW50c1sgMSBdLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRSwgJ2Rlc2NyaXB0aW9uIHNpYmxpbmcgc2Vjb25kJyApO1xyXG4gIGFzc2VydC5vayggcGVlckVsZW1lbnRzWyAyIF0udGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnTEknLCAncHJpbWFyeSBzaWJsaW5nIGxhc3QnICk7XHJcblxyXG4gIC8vIHRlc3Qgb3JkZXIgd2hlbiB1c2luZyBhcHBlbmRMYWJlbC9hcHBlbmREZXNjcmlwdGlvbiB3aXRob3V0IGEgcGFyZW50IGNvbnRhaW5lciAtIG9yZGVyIHNob3VsZCBiZSBwcmltYXJ5IHNpYmxpbmcsXHJcbiAgLy8gbGFiZWwgc2libGluZywgZGVzY3JpcHRpb24gc2libGluZ1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ2lucHV0JyxcclxuICAgIGlucHV0VHlwZTogJ2NoZWNrYm94JyxcclxuICAgIGxhYmVsVGFnTmFtZTogJ2xhYmVsJyxcclxuICAgIGxhYmVsQ29udGVudDogVEVTVF9MQUJFTCxcclxuICAgIGRlc2NyaXB0aW9uQ29udGVudDogVEVTVF9ERVNDUklQVElPTixcclxuICAgIGFwcGVuZExhYmVsOiB0cnVlLFxyXG4gICAgYXBwZW5kRGVzY3JpcHRpb246IHRydWVcclxuICB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGIgKTtcclxuXHJcbiAgbGV0IGJQZWVyID0gZ2V0UERPTVBlZXJCeU5vZGUoIGIgKTtcclxuICBsZXQgYkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKTtcclxuICBsZXQgYkVsZW1lbnRQYXJlbnQgPSBiRWxlbWVudC5wYXJlbnRFbGVtZW50ITtcclxuICBsZXQgaW5kZXhPZlByaW1hcnlFbGVtZW50ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCggYkVsZW1lbnRQYXJlbnQuY2hpbGROb2RlcywgYkVsZW1lbnQgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBiRWxlbWVudFBhcmVudC5jaGlsZE5vZGVzWyBpbmRleE9mUHJpbWFyeUVsZW1lbnQgXSA9PT0gYkVsZW1lbnQsICdiIHByaW1hcnkgc2libGluZyBmaXJzdCB3aXRoIG5vIGNvbnRhaW5lciwgYm90aCBhcHBlbmRlZCcgKTtcclxuICBhc3NlcnQub2soIGJFbGVtZW50UGFyZW50LmNoaWxkTm9kZXNbIGluZGV4T2ZQcmltYXJ5RWxlbWVudCArIDEgXSA9PT0gYlBlZXIubGFiZWxTaWJsaW5nLCAnYiBsYWJlbCBzaWJsaW5nIHNlY29uZCB3aXRoIG5vIGNvbnRhaW5lciwgYm90aCBhcHBlbmRlZCcgKTtcclxuICBhc3NlcnQub2soIGJFbGVtZW50UGFyZW50LmNoaWxkTm9kZXNbIGluZGV4T2ZQcmltYXJ5RWxlbWVudCArIDIgXSA9PT0gYlBlZXIuZGVzY3JpcHRpb25TaWJsaW5nLCAnYiBkZXNjcmlwdGlvbiBzaWJsaW5nIHRoaXJkIHdpdGggbm8gY29udGFpbmVyLCBib3RoIGFwcGVuZGVkJyApO1xyXG5cclxuICAvLyB0ZXN0IG9yZGVyIHdoZW4gb25seSBkZXNjcmlwdGlvbiBhcHBlbmRlZCBhbmQgbm8gcGFyZW50IGNvbnRhaW5lciAtIG9yZGVyIHNob3VsZCBiZSBsYWJlbCwgcHJpbWFyeSwgdGhlblxyXG4gIC8vIGRlc2NyaXB0aW9uXHJcbiAgYi5hcHBlbmRMYWJlbCA9IGZhbHNlO1xyXG5cclxuICAvLyByZWZyZXNoIHNpbmNlIG9wZXJhdGlvbiBtYXkgaGF2ZSBjcmVhdGVkIG5ldyBPYmplY3RzXHJcbiAgYlBlZXIgPSBnZXRQRE9NUGVlckJ5Tm9kZSggYiApO1xyXG4gIGJFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICk7XHJcbiAgYkVsZW1lbnRQYXJlbnQgPSBiRWxlbWVudC5wYXJlbnRFbGVtZW50ITtcclxuICBpbmRleE9mUHJpbWFyeUVsZW1lbnQgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKCBiRWxlbWVudFBhcmVudC5jaGlsZE5vZGVzLCBiRWxlbWVudCApO1xyXG5cclxuICBhc3NlcnQub2soIGJFbGVtZW50UGFyZW50LmNoaWxkTm9kZXNbIGluZGV4T2ZQcmltYXJ5RWxlbWVudCAtIDEgXSA9PT0gYlBlZXIubGFiZWxTaWJsaW5nLCAnYiBsYWJlbCBzaWJsaW5nIGZpcnN0IHdpdGggbm8gY29udGFpbmVyLCBkZXNjcmlwdGlvbiBhcHBlbmRlZCcgKTtcclxuICBhc3NlcnQub2soIGJFbGVtZW50UGFyZW50LmNoaWxkTm9kZXNbIGluZGV4T2ZQcmltYXJ5RWxlbWVudCBdID09PSBiRWxlbWVudCwgJ2IgcHJpbWFyeSBzaWJsaW5nIHNlY29uZCB3aXRoIG5vIGNvbnRhaW5lciwgZGVzY3JpcHRpb24gYXBwZW5kZWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBiRWxlbWVudFBhcmVudC5jaGlsZE5vZGVzWyBpbmRleE9mUHJpbWFyeUVsZW1lbnQgKyAxIF0gPT09IGJQZWVyLmRlc2NyaXB0aW9uU2libGluZywgJ2IgZGVzY3JpcHRpb24gc2libGluZyB0aGlyZCB3aXRoIG5vIGNvbnRhaW5lciwgZGVzY3JpcHRpb24gYXBwZW5kZWQnICk7XHJcblxyXG4gIHBkb21BdWRpdFJvb3ROb2RlKCByb290Tm9kZSApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnY29udGFpbmVyQXJpYVJvbGUgb3B0aW9uJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgLy8gdGVzdCB0aGUgYmVoYXZpb3Igb2YgZm9jdXNhYmxlIGZ1bmN0aW9uXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHtcclxuICAgIHRhZ05hbWU6ICdkaXYnLFxyXG4gICAgY29udGFpbmVyVGFnTmFtZTogJ2RpdicsXHJcbiAgICBjb250YWluZXJBcmlhUm9sZTogJ2FwcGxpY2F0aW9uJ1xyXG4gIH0gKTtcclxuXHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICBhc3NlcnQub2soIGEuY29udGFpbmVyQXJpYVJvbGUgPT09ICdhcHBsaWNhdGlvbicsICdyb2xlIGF0dHJpYnV0ZSBzaG91bGQgYmUgb24gbm9kZSBwcm9wZXJ0eScgKTtcclxuICBsZXQgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LnBhcmVudEVsZW1lbnQhLmdldEF0dHJpYnV0ZSggJ3JvbGUnICkgPT09ICdhcHBsaWNhdGlvbicsICdyb2xlIGF0dHJpYnV0ZSBzaG91bGQgYmUgb24gcGFyZW50IGVsZW1lbnQnICk7XHJcblxyXG4gIGEuY29udGFpbmVyQXJpYVJvbGUgPSBudWxsO1xyXG4gIGFzc2VydC5vayggYS5jb250YWluZXJBcmlhUm9sZSA9PT0gbnVsbCwgJ3JvbGUgYXR0cmlidXRlIHNob3VsZCBiZSBjbGVhcmVkIG9uIG5vZGUnICk7XHJcbiAgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LnBhcmVudEVsZW1lbnQhLmdldEF0dHJpYnV0ZSggJ3JvbGUnICkgPT09IG51bGwsICdyb2xlIGF0dHJpYnV0ZSBzaG91bGQgYmUgY2xlYXJlZCBvbiBwYXJlbnQgZWxlbWVudCcgKTtcclxuXHJcbiAgcGRvbUF1ZGl0Um9vdE5vZGUoIHJvb3ROb2RlICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdhcmlhUm9sZSBvcHRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBmb2N1c2FibGUgZnVuY3Rpb25cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSgge1xyXG4gICAgdGFnTmFtZTogJ2RpdicsXHJcbiAgICBpbm5lckNvbnRlbnQ6ICdEcmFnZ2FibGUnLFxyXG4gICAgYXJpYVJvbGU6ICdhcHBsaWNhdGlvbidcclxuICB9ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhLmFyaWFSb2xlID09PSAnYXBwbGljYXRpb24nLCAncm9sZSBhdHRyaWJ1dGUgc2hvdWxkIGJlIG9uIG5vZGUgcHJvcGVydHknICk7XHJcbiAgbGV0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC5nZXRBdHRyaWJ1dGUoICdyb2xlJyApID09PSAnYXBwbGljYXRpb24nLCAncm9sZSBhdHRyaWJ1dGUgc2hvdWxkIGJlIG9uIGVsZW1lbnQnICk7XHJcblxyXG4gIGEuYXJpYVJvbGUgPSBudWxsO1xyXG4gIGFzc2VydC5vayggYS5hcmlhUm9sZSA9PT0gbnVsbCwgJ3JvbGUgYXR0cmlidXRlIHNob3VsZCBiZSBjbGVhcmVkIG9uIG5vZGUnICk7XHJcbiAgYUVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKTtcclxuICBhc3NlcnQub2soIGFFbGVtZW50LmdldEF0dHJpYnV0ZSggJ3JvbGUnICkgPT09IG51bGwsICdyb2xlIGF0dHJpYnV0ZSBzaG91bGQgYmUgY2xlYXJlZCBvbiBlbGVtZW50JyApO1xyXG5cclxuICBwZG9tQXVkaXRSb290Tm9kZSggcm9vdE5vZGUgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxufSApO1xyXG5cclxuXHJcbi8vIEhpZ2hlciBsZXZlbCBzZXR0ZXIvZ2V0dGVyIG9wdGlvbnNcclxuUVVuaXQudGVzdCggJ2FjY2Vzc2libGVOYW1lIG9wdGlvbicsIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSApO1xyXG5cclxuICAvLyB0ZXN0IHRoZSBiZWhhdmlvciBvZiBmb2N1c2FibGUgZnVuY3Rpb25cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICB2YXIgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXZhclxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGFjY2Vzc2libGVOYW1lOiBURVNUX0xBQkVMIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICBhc3NlcnQub2soIGEuYWNjZXNzaWJsZU5hbWUgPT09IFRFU1RfTEFCRUwsICdhY2Nlc3NpYmxlTmFtZSBnZXR0ZXInICk7XHJcblxyXG4gIGNvbnN0IGFFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBhICk7XHJcbiAgYXNzZXJ0Lm9rKCBhRWxlbWVudC50ZXh0Q29udGVudCA9PT0gVEVTVF9MQUJFTCwgJ2FjY2Vzc2libGVOYW1lIHNldHRlciBvbiBkaXYnICk7XHJcblxyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnaW5wdXQnLCBhY2Nlc3NpYmxlTmFtZTogVEVTVF9MQUJFTCwgaW5wdXRUeXBlOiAncmFuZ2UnIH0gKTtcclxuICBhLmFkZENoaWxkKCBiICk7XHJcbiAgY29uc3QgYkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKTtcclxuICBjb25zdCBiUGFyZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICkucGFyZW50RWxlbWVudCE7XHJcbiAgY29uc3QgYkxhYmVsU2libGluZyA9IGJQYXJlbnQuY2hpbGRyZW5bIERFRkFVTFRfTEFCRUxfU0lCTElOR19JTkRFWCBdO1xyXG4gIGFzc2VydC5vayggYkxhYmVsU2libGluZy50ZXh0Q29udGVudCA9PT0gVEVTVF9MQUJFTCwgJ2FjY2Vzc2libGVOYW1lIHNldHMgbGFiZWwgc2libGluZycgKTtcclxuICBhc3NlcnQub2soIGJMYWJlbFNpYmxpbmcuZ2V0QXR0cmlidXRlKCAnZm9yJyApIS5pbmNsdWRlcyggYkVsZW1lbnQuaWQgKSwgJ2FjY2Vzc2libGVOYW1lIHNldHMgbGFiZWxcXCdzIFwiZm9yXCIgYXR0cmlidXRlJyApO1xyXG5cclxuICBjb25zdCBjID0gbmV3IE5vZGUoIHsgY29udGFpbmVyVGFnTmFtZTogJ2RpdicsIHRhZ05hbWU6ICdkaXYnLCBhcmlhTGFiZWw6ICdvdmVycmlkZVRoaXMnIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYyApO1xyXG4gIGNvbnN0IGNBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yOiBQRE9NQmVoYXZpb3JGdW5jdGlvbiA9ICggbm9kZSwgb3B0aW9ucywgYWNjZXNzaWJsZU5hbWUgKSA9PiB7XHJcbiAgICBvcHRpb25zLmFyaWFMYWJlbCA9IGFjY2Vzc2libGVOYW1lO1xyXG4gICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgfTtcclxuICBjLmFjY2Vzc2libGVOYW1lQmVoYXZpb3IgPSBjQWNjZXNzaWJsZU5hbWVCZWhhdmlvcjtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBjLmFjY2Vzc2libGVOYW1lQmVoYXZpb3IgPT09IGNBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yLCAnZ2V0dGVyIHdvcmtzJyApO1xyXG5cclxuICBsZXQgY0xhYmVsRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYyApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGNMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbCcgKSA9PT0gJ292ZXJyaWRlVGhpcycsICdhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIHNob3VsZCBub3Qgd29yayB1bnRpbCB0aGVyZSBpcyBhY2Nlc3NpYmxlIG5hbWUnICk7XHJcbiAgYy5hY2Nlc3NpYmxlTmFtZSA9ICdhY2Nlc3NpYmxlIG5hbWUgZGVzY3JpcHRpb24nO1xyXG4gIGNMYWJlbEVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGMgKS5wYXJlbnRFbGVtZW50IS5jaGlsZHJlblsgREVGQVVMVF9MQUJFTF9TSUJMSU5HX0lOREVYIF07XHJcbiAgYXNzZXJ0Lm9rKCBjTGFiZWxFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2FyaWEtbGFiZWwnICkgPT09ICdhY2Nlc3NpYmxlIG5hbWUgZGVzY3JpcHRpb24nLCAnYWNjZXNzaWJsZSBuYW1lIHNldHRlcicgKTtcclxuXHJcbiAgYy5hY2Nlc3NpYmxlTmFtZSA9ICcnO1xyXG5cclxuICBjTGFiZWxFbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBjICkucGFyZW50RWxlbWVudCEuY2hpbGRyZW5bIERFRkFVTFRfTEFCRUxfU0lCTElOR19JTkRFWCBdO1xyXG4gIGFzc2VydC5vayggY0xhYmVsRWxlbWVudC5nZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsJyApID09PSAnJywgJ2FjY2Vzc2libGVOYW1lQmVoYXZpb3Igc2hvdWxkIHdvcmsgZm9yIGVtcHR5IHN0cmluZycgKTtcclxuXHJcbiAgYy5hY2Nlc3NpYmxlTmFtZSA9IG51bGw7XHJcbiAgY0xhYmVsRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYyApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGNMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbCcgKSA9PT0gJ292ZXJyaWRlVGhpcycsICdhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIHNob3VsZCBub3Qgd29yayB1bnRpbCB0aGVyZSBpcyBhY2Nlc3NpYmxlIG5hbWUnICk7XHJcblxyXG5cclxuICBjb25zdCBkID0gbmV3IE5vZGUoIHsgY29udGFpbmVyVGFnTmFtZTogJ2RpdicsIHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggZCApO1xyXG4gIGNvbnN0IGRBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yOiBQRE9NQmVoYXZpb3JGdW5jdGlvbiA9ICggbm9kZSwgb3B0aW9ucywgYWNjZXNzaWJsZU5hbWUgKSA9PiB7XHJcblxyXG4gICAgb3B0aW9ucy5hcmlhTGFiZWwgPSBhY2Nlc3NpYmxlTmFtZTtcclxuICAgIHJldHVybiBvcHRpb25zO1xyXG4gIH07XHJcbiAgZC5hY2Nlc3NpYmxlTmFtZUJlaGF2aW9yID0gZEFjY2Vzc2libGVOYW1lQmVoYXZpb3I7XHJcblxyXG4gIGFzc2VydC5vayggZC5hY2Nlc3NpYmxlTmFtZUJlaGF2aW9yID09PSBkQWNjZXNzaWJsZU5hbWVCZWhhdmlvciwgJ2dldHRlciB3b3JrcycgKTtcclxuICBsZXQgZExhYmVsRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggZCApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGRMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbCcgKSA9PT0gbnVsbCwgJ2FjY2Vzc2libGVOYW1lQmVoYXZpb3Igc2hvdWxkIG5vdCB3b3JrIHVudGlsIHRoZXJlIGlzIGFjY2Vzc2libGUgbmFtZScgKTtcclxuICBjb25zdCBhY2Nlc3NpYmxlTmFtZURlc2NyaXB0aW9uID0gJ2FjY2Vzc2libGUgbmFtZSBkZXNjcmlwdGlvbic7XHJcbiAgZC5hY2Nlc3NpYmxlTmFtZSA9IGFjY2Vzc2libGVOYW1lRGVzY3JpcHRpb247XHJcbiAgZExhYmVsRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggZCApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGRMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbCcgKSA9PT0gYWNjZXNzaWJsZU5hbWVEZXNjcmlwdGlvbiwgJ2FjY2Vzc2libGUgbmFtZSBzZXR0ZXInICk7XHJcblxyXG4gIGQuYWNjZXNzaWJsZU5hbWUgPSAnJztcclxuXHJcbiAgZExhYmVsRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggZCApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0xBQkVMX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGRMYWJlbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbCcgKSA9PT0gJycsICdhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIHNob3VsZCB3b3JrIGZvciBlbXB0eSBzdHJpbmcnICk7XHJcblxyXG4gIGQuYWNjZXNzaWJsZU5hbWUgPSBudWxsO1xyXG4gIGRMYWJlbEVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGQgKS5wYXJlbnRFbGVtZW50IS5jaGlsZHJlblsgREVGQVVMVF9MQUJFTF9TSUJMSU5HX0lOREVYIF07XHJcbiAgYXNzZXJ0Lm9rKCBkTGFiZWxFbGVtZW50LmdldEF0dHJpYnV0ZSggJ2FyaWEtbGFiZWwnICkgPT09IG51bGwsICdhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIHNob3VsZCBub3Qgd29yayB1bnRpbCB0aGVyZSBpcyBhY2Nlc3NpYmxlIG5hbWUnICk7XHJcblxyXG4gIHBkb21BdWRpdFJvb3ROb2RlKCByb290Tm9kZSApO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn0gKTtcclxuXHJcblxyXG5RVW5pdC50ZXN0KCAncGRvbUhlYWRpbmcgb3B0aW9uJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgYXNzZXJ0Lm9rKCB0cnVlICk7XHJcblxyXG4gIC8vIHRlc3QgdGhlIGJlaGF2aW9yIG9mIGZvY3VzYWJsZSBmdW5jdGlvblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JywgcGRvbUhlYWRpbmc6IFRFU1RfTEFCRUwsIGNvbnRhaW5lclRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICBhc3NlcnQub2soIGEucGRvbUhlYWRpbmcgPT09IFRFU1RfTEFCRUwsICdhY2Nlc3NpYmxlTmFtZSBnZXR0ZXInICk7XHJcblxyXG4gIGNvbnN0IGFMYWJlbFNpYmxpbmcgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGEgKS5wYXJlbnRFbGVtZW50IS5jaGlsZHJlblsgREVGQVVMVF9MQUJFTF9TSUJMSU5HX0lOREVYIF07XHJcbiAgYXNzZXJ0Lm9rKCBhTGFiZWxTaWJsaW5nLnRleHRDb250ZW50ID09PSBURVNUX0xBQkVMLCAncGRvbUhlYWRpbmcgc2V0dGVyIG9uIGRpdicgKTtcclxuICBhc3NlcnQub2soIGFMYWJlbFNpYmxpbmcudGFnTmFtZSA9PT0gJ0gxJywgJ3Bkb21IZWFkaW5nIHNldHRlciBzaG91bGQgYmUgaDEnICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdoZWxwVGV4dCBvcHRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICBhc3NlcnQub2soIHRydWUgKTtcclxuXHJcbiAgLy8gdGVzdCB0aGUgYmVoYXZpb3Igb2YgZm9jdXNhYmxlIGZ1bmN0aW9uXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgdmFyIGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby12YXJcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8gbGFiZWwgdGFnIG5lZWRlZCBmb3IgZGVmYXVsdCBzaWJsaW5nIGluZGljZXMgdG8gd29ya1xyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSgge1xyXG4gICAgY29udGFpbmVyVGFnTmFtZTogJ2RpdicsXHJcbiAgICB0YWdOYW1lOiAnZGl2JyxcclxuICAgIGxhYmVsVGFnTmFtZTogJ2RpdicsXHJcbiAgICBoZWxwVGV4dDogVEVTVF9ERVNDUklQVElPTlxyXG4gIH0gKTtcclxuICByb290Tm9kZS5hZGRDaGlsZCggYSApO1xyXG5cclxuICByb290Tm9kZS5hZGRDaGlsZCggbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2lucHV0JywgaW5wdXRUeXBlOiAncmFuZ2UnIH0gKSApO1xyXG4gIGFzc2VydC5vayggYS5oZWxwVGV4dCA9PT0gVEVTVF9ERVNDUklQVElPTiwgJ2hlbHBUZXh0IGdldHRlcicgKTtcclxuXHJcbiAgLy8gZGVmYXVsdCBmb3IgaGVscCB0ZXh0IGlzIHRvIGFwcGVuZCBkZXNjcmlwdGlvbiBhZnRlciB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgY29uc3QgYURlc2NyaXB0aW9uRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYSApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBBUFBFTkRFRF9ERVNDUklQVElPTl9TSUJMSU5HX0lOREVYIF07XHJcbiAgYXNzZXJ0Lm9rKCBhRGVzY3JpcHRpb25FbGVtZW50LnRleHRDb250ZW50ID09PSBURVNUX0RFU0NSSVBUSU9OLCAnaGVscFRleHQgc2V0dGVyIG9uIGRpdicgKTtcclxuXHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCB7XHJcbiAgICBjb250YWluZXJUYWdOYW1lOiAnZGl2JyxcclxuICAgIHRhZ05hbWU6ICdidXR0b24nLFxyXG4gICAgZGVzY3JpcHRpb25Db250ZW50OiAnb3ZlcnJpZGVUaGlzJyxcclxuICAgIGxhYmVsVGFnTmFtZTogJ2RpdidcclxuICB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGIgKTtcclxuXHJcbiAgYi5oZWxwVGV4dEJlaGF2aW9yID0gKCBub2RlLCBvcHRpb25zLCBoZWxwVGV4dCApID0+IHtcclxuXHJcbiAgICBvcHRpb25zLmRlc2NyaXB0aW9uVGFnTmFtZSA9ICdwJztcclxuICAgIG9wdGlvbnMuZGVzY3JpcHRpb25Db250ZW50ID0gaGVscFRleHQ7XHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxuICB9O1xyXG5cclxuICBsZXQgYkRlc2NyaXB0aW9uRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0RFU0NSSVBUSU9OX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGJEZXNjcmlwdGlvbkVsZW1lbnQudGV4dENvbnRlbnQgPT09ICdvdmVycmlkZVRoaXMnLCAnaGVscFRleHRCZWhhdmlvciBzaG91bGQgbm90IHdvcmsgdW50aWwgdGhlcmUgaXMgaGVscCB0ZXh0JyApO1xyXG4gIGIuaGVscFRleHQgPSAnaGVscCB0ZXh0IGRlc2NyaXB0aW9uJztcclxuICBiRGVzY3JpcHRpb25FbGVtZW50ID0gZ2V0UHJpbWFyeVNpYmxpbmdFbGVtZW50QnlOb2RlKCBiICkucGFyZW50RWxlbWVudCEuY2hpbGRyZW5bIERFRkFVTFRfREVTQ1JJUFRJT05fU0lCTElOR19JTkRFWCBdO1xyXG4gIGFzc2VydC5vayggYkRlc2NyaXB0aW9uRWxlbWVudC50ZXh0Q29udGVudCA9PT0gJ2hlbHAgdGV4dCBkZXNjcmlwdGlvbicsICdoZWxwIHRleHQgc2V0dGVyJyApO1xyXG5cclxuICBiLmhlbHBUZXh0ID0gJyc7XHJcblxyXG4gIGJEZXNjcmlwdGlvbkVsZW1lbnQgPSBnZXRQcmltYXJ5U2libGluZ0VsZW1lbnRCeU5vZGUoIGIgKS5wYXJlbnRFbGVtZW50IS5jaGlsZHJlblsgREVGQVVMVF9ERVNDUklQVElPTl9TSUJMSU5HX0lOREVYIF07XHJcbiAgYXNzZXJ0Lm9rKCBiRGVzY3JpcHRpb25FbGVtZW50LnRleHRDb250ZW50ID09PSAnJywgJ2hlbHBUZXh0QmVoYXZpb3Igc2hvdWxkIHdvcmsgZm9yIGVtcHR5IHN0cmluZycgKTtcclxuXHJcbiAgYi5oZWxwVGV4dCA9IG51bGw7XHJcbiAgYkRlc2NyaXB0aW9uRWxlbWVudCA9IGdldFByaW1hcnlTaWJsaW5nRWxlbWVudEJ5Tm9kZSggYiApLnBhcmVudEVsZW1lbnQhLmNoaWxkcmVuWyBERUZBVUxUX0RFU0NSSVBUSU9OX1NJQkxJTkdfSU5ERVggXTtcclxuICBhc3NlcnQub2soIGJEZXNjcmlwdGlvbkVsZW1lbnQudGV4dENvbnRlbnQgPT09ICdvdmVycmlkZVRoaXMnLCAnaGVscFRleHRCZWhhdmlvciBzaG91bGQgbm90IHdvcmsgdW50aWwgdGhlcmUgaXMgaGVscCB0ZXh0JyApO1xyXG5cclxuICBwZG9tQXVkaXRSb290Tm9kZSggcm9vdE5vZGUgKTtcclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnbW92ZSB0byBmcm9udC9tb3ZlIHRvIGJhY2snLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggIWNhblJ1blRlc3RzICkge1xyXG4gICAgYXNzZXJ0Lm9rKCB0cnVlLCAnU2tpcHBpbmcgdGVzdCBiZWNhdXNlIGRvY3VtZW50IGRvZXMgbm90IGhhdmUgZm9jdXMnICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBtYWtlIHN1cmUgc3RhdGUgaXMgcmVzdG9yZWQgYWZ0ZXIgbW92aW5nIGNoaWxkcmVuIHRvIGZyb250IGFuZCBiYWNrXHJcbiAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbiAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBkaXNwbGF5LmluaXRpYWxpemVFdmVudHMoKTtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nLCBmb2N1c0hpZ2hsaWdodDogVEVTVF9ISUdITElHSFQgfSApO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnYnV0dG9uJywgZm9jdXNIaWdobGlnaHQ6IFRFU1RfSElHSExJR0hUIH0gKTtcclxuICByb290Tm9kZS5jaGlsZHJlbiA9IFsgYSwgYiBdO1xyXG4gIGIuZm9jdXMoKTtcclxuXHJcbiAgLy8gYWZ0ZXIgbW92aW5nIGEgdG8gZnJvbnQsIGIgc2hvdWxkIHN0aWxsIGhhdmUgZm9jdXNcclxuICBhLm1vdmVUb0Zyb250KCk7XHJcbiAgYXNzZXJ0Lm9rKCBiLmZvY3VzZWQsICdiIHNob3VsZCBoYXZlIGZvY3VzIGFmdGVyIGEgbW92ZWQgdG8gZnJvbnQnICk7XHJcblxyXG4gIC8vIGFmdGVyIG1vdmluZyBhIHRvIGJhY2ssIGIgc2hvdWxkIHN0aWxsIGhhdmUgZm9jdXNcclxuICBhLm1vdmVUb0JhY2soKTtcclxuXHJcbiAgLy8gYWRkIGEgZ3VhcmQgd2hlcmUgd2UgZG9uJ3QgY2hlY2sgdGhpcyBpZiBmb2N1cyBoYXMgYmVlbiBtb3ZlZCBzb21ld2hlcmUgZWxzZS4gVGhpcyBoYXBwZW5zIHNvbWV0aW1lcyB3aXRoXHJcbiAgLy8gZGV2IHRvb2xzIG9yIG90aGVyIHdpbmRvd3Mgb3BlbmVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzgyN1xyXG4gIGlmICggZG9jdW1lbnQuYm9keS5jb250YWlucyggZG9jdW1lbnQuYWN0aXZlRWxlbWVudCApICYmIGRvY3VtZW50LmJvZHkgIT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgKSB7XHJcbiAgICBhc3NlcnQub2soIGIuZm9jdXNlZCwgJ2Igc2hvdWxkIGhhdmUgZm9jdXMgYWZ0ZXIgYSBtb3ZlZCB0byBiYWNrJyApO1xyXG4gIH1cclxuXHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgZGlzcGxheS5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQhLnJlbW92ZUNoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdOb2RlLmVuYWJsZWRQcm9wZXJ0eSB3aXRoIFBET00nLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdkaXYnIH0gKTtcclxuICB2YXIgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXZhclxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICBjb25zdCBwZG9tTm9kZSA9IG5ldyBOb2RlKCB7XHJcbiAgICB0YWdOYW1lOiAncCdcclxuICB9ICk7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBwZG9tTm9kZSApO1xyXG4gIGFzc2VydC5vayggcGRvbU5vZGUucGRvbUluc3RhbmNlcy5sZW5ndGggPT09IDEsICdzaG91bGQgaGF2ZSBhbiBpbnN0YW5jZSB3aGVuIGF0dGFjaGVkIHRvIGRpc3BsYXknICk7XHJcbiAgYXNzZXJ0Lm9rKCAhIXBkb21Ob2RlLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyLCAnc2hvdWxkIGhhdmUgYSBwZWVyJyApO1xyXG5cclxuICBhc3NlcnQub2soIHBkb21Ob2RlLnBkb21JbnN0YW5jZXNbIDAgXS5wZWVyIS5wcmltYXJ5U2libGluZyEuZ2V0QXR0cmlidXRlKCAnYXJpYS1kaXNhYmxlZCcgKSAhPT0gJ3RydWUnLCAnc2hvdWxkIGJlIGVuYWJsZWQgdG8gc3RhcnQnICk7XHJcbiAgcGRvbU5vZGUuZW5hYmxlZCA9IGZhbHNlO1xyXG4gIGFzc2VydC5vayggcGRvbU5vZGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5nZXRBdHRyaWJ1dGUoICdhcmlhLWRpc2FibGVkJyApID09PSAndHJ1ZScsICdzaG91bGQgYmUgYXJpYS1kaXNhYmxlZCB3aGVuIGRpc2FibGVkJyApO1xyXG4gIHBkb21Ob2RlLmVuYWJsZWQgPSB0cnVlO1xyXG4gIGFzc2VydC5vayggcGRvbU5vZGUucGRvbUluc3RhbmNlc1sgMCBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5nZXRBdHRyaWJ1dGUoICdhcmlhLWRpc2FibGVkJyApID09PSAnZmFsc2UnLCAnQWN0dWFsbHkgc2V0IHRvIGZhbHNlIHNpbmNlIGl0IHdhcyBwcmV2aW91c2x5IGRpc2FibGVkLicgKTtcclxuICBwZG9tTm9kZS5kaXNwb3NlO1xyXG4gIGRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIGRpc3BsYXkuZG9tRWxlbWVudC5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbn0gKTtcclxuXHJcbi8vIHRoZXNlIGZ1enplcnMgdGFrZSB0aW1lLCBzbyBpdCBpcyBuaWNlIHdoZW4gdGhleSBhcmUgbGFzdFxyXG5RVW5pdC50ZXN0KCAnRGlzcGxheS5pbnRlcmFjdGl2ZSB0b2dnbGluZyBpbiB0aGUgUERPTScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIHZhciBkaXNwbGF5ID0gbmV3IERpc3BsYXkoIHJvb3ROb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdmFyXHJcbiAgZGlzcGxheS5pbml0aWFsaXplRXZlbnRzKCk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gIGNvbnN0IHBkb21SYW5nZUNoaWxkID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2lucHV0JywgaW5wdXRUeXBlOiAncmFuZ2UnIH0gKTtcclxuICBjb25zdCBwZG9tUGFyYWdyYXBoQ2hpbGQgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAncCcgfSApO1xyXG4gIGNvbnN0IHBkb21CdXR0b25DaGlsZCA9IG5ldyBOb2RlKCB7IHRhZ05hbWU6ICdidXR0b24nIH0gKTtcclxuXHJcbiAgY29uc3QgcGRvbVBhcmVudCA9IG5ldyBOb2RlKCB7XHJcbiAgICB0YWdOYW1lOiAnYnV0dG9uJyxcclxuICAgIGNoaWxkcmVuOiBbIHBkb21SYW5nZUNoaWxkLCBwZG9tUGFyYWdyYXBoQ2hpbGQsIHBkb21CdXR0b25DaGlsZCBdXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBESVNBQkxFRF9UUlVFID0gdHJ1ZTtcclxuXHJcbiAgLy8gRm9yIG9mIGxpc3Qgb2YgaHRtbCBlbGVtZW50cyB0aGF0IHN1cHBvcnQgZGlzYWJsZWQsIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0F0dHJpYnV0ZXMvZGlzYWJsZWRcclxuICBjb25zdCBERUZBVUxUX0RJU0FCTEVEX1dIRU5fU1VQUE9SVEVEID0gZmFsc2U7XHJcbiAgY29uc3QgREVGQVVMVF9ESVNBQkxFRF9XSEVOX05PVF9TVVBQT1JURUQgPSB1bmRlZmluZWQ7XHJcblxyXG4gIHJvb3ROb2RlLmFkZENoaWxkKCBwZG9tUGFyZW50ICk7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSwgJ2luaXRpYWwgY2FzZScgKTtcclxuXHJcbiAgY29uc3QgdGVzdERpc2FibGVkID0gKCBub2RlOiBOb2RlLCBkaXNhYmxlZDogYm9vbGVhbiB8IHVuZGVmaW5lZCwgbWVzc2FnZTogc3RyaW5nLCBwZG9tSW5zdGFuY2UgPSAwICk6IHZvaWQgPT4ge1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgXCJkaXNhYmxlZFwiIGlzIG9ubHkgc3VwcG9ydGVkIGJ5IGNlcnRhaW4gYXR0cmlidXRlcywgc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvQXR0cmlidXRlcy9kaXNhYmxlZFxyXG4gICAgYXNzZXJ0Lm9rKCBub2RlLnBkb21JbnN0YW5jZXNbIHBkb21JbnN0YW5jZSBdLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5kaXNhYmxlZCA9PT0gZGlzYWJsZWQsIG1lc3NhZ2UgKTtcclxuICB9O1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJlbnQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUGFyZW50IGluaXRpYWwgbm8gZGlzYWJsZWQnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUmFuZ2VDaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21SYW5nZUNoaWxkIGluaXRpYWwgbm8gZGlzYWJsZWQnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9OT1RfU1VQUE9SVEVELCAncGRvbVBhcmFncmFwaENoaWxkIGluaXRpYWwgbm8gZGlzYWJsZWQnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tQnV0dG9uQ2hpbGQgaW5pdGlhbCBubyBkaXNhYmxlZCcgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJlbnQsIERJU0FCTEVEX1RSVUUsICdwZG9tUGFyZW50IHRvZ2dsZWQgbm90IGludGVyYWN0aXZlJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUmFuZ2VDaGlsZCB0b2dnbGVkIG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJhZ3JhcGhDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJhZ3JhcGhDaGlsZCB0b2dnbGVkIG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCB0b2dnbGVkIG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gIHRlc3REaXNhYmxlZCggcGRvbVBhcmVudCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21QYXJlbnQgdG9nZ2xlZCBiYWNrIHRvIGludGVyYWN0aXZlJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUmFuZ2VDaGlsZCB0b2dnbGVkIGJhY2sgdG8gaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9OT1RfU1VQUE9SVEVELCAncGRvbVBhcmFncmFwaENoaWxkIHRvZ2dsZWQgYmFjayB0byBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21CdXR0b25DaGlsZCB0b2dnbGVkIGJhY2sgdG8gaW50ZXJhY3RpdmUnICk7XHJcblxyXG4gIGRpc3BsYXkuaW50ZXJhY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBzZWNvbmQgdG9nZ2xlZCBub3QgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUmFuZ2VDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21SYW5nZUNoaWxkIHNlY29uZCB0b2dnbGVkIG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJhZ3JhcGhDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJhZ3JhcGhDaGlsZCBzZWNvbmQgdG9nZ2xlZCBub3QgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgc2Vjb25kIHRvZ2dsZWQgbm90IGludGVyYWN0aXZlJyApO1xyXG5cclxuICBwZG9tUGFyZW50LnNldFBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcsIHRydWUsIHsgYXNQcm9wZXJ0eTogdHJ1ZSB9ICk7XHJcbiAgcGRvbVJhbmdlQ2hpbGQuc2V0UERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJywgdHJ1ZSwgeyBhc1Byb3BlcnR5OiB0cnVlIH0gKTtcclxuICBwZG9tUGFyYWdyYXBoQ2hpbGQuc2V0UERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJywgdHJ1ZSwgeyBhc1Byb3BlcnR5OiB0cnVlIH0gKTtcclxuICBwZG9tQnV0dG9uQ2hpbGQuc2V0UERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJywgdHJ1ZSwgeyBhc1Byb3BlcnR5OiB0cnVlIH0gKTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBwcm9wZXJ0eSwgZGlzcGxheSBub3QgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUmFuZ2VDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21SYW5nZUNoaWxkIG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBzZXR0aW5nIGRpc2FibGVkIG1hbnVhbGx5IGFzIHByb3BlcnR5LCBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJhZ3JhcGhDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJhZ3JhcGhDaGlsZCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBwcm9wZXJ0eSwgZGlzcGxheSBub3QgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgcHJvcGVydHksIGRpc3BsYXkgbm90IGludGVyYWN0aXZlJyApO1xyXG5cclxuICBkaXNwbGF5LmludGVyYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBwcm9wZXJ0eSBkaXNwbGF5IGludGVyYWN0aXZlJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUmFuZ2VDaGlsZCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBwcm9wZXJ0eSBkaXNwbGF5IGludGVyYWN0aXZlJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVBhcmFncmFwaENoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmFncmFwaENoaWxkIG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBzZXR0aW5nIGRpc2FibGVkIG1hbnVhbGx5IGFzIHByb3BlcnR5IGRpc3BsYXkgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgcHJvcGVydHkgZGlzcGxheSBpbnRlcmFjdGl2ZScgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJlbnQsIERJU0FCTEVEX1RSVUUsICdwZG9tUGFyZW50IHN0aWxsIGRpc2FibGVkIHdoZW4gZGlzcGxheSBpcyBub3QgaW50ZXJhY3RpdmUgYWdhaW4uJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUmFuZ2VDaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJhZ3JhcGhDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJhZ3JhcGhDaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuXHJcbiAgcGRvbVBhcmVudC5yZW1vdmVQRE9NQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7XHJcbiAgcGRvbVJhbmdlQ2hpbGQucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApO1xyXG4gIHBkb21QYXJhZ3JhcGhDaGlsZC5yZW1vdmVQRE9NQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7XHJcbiAgcGRvbUJ1dHRvbkNoaWxkLnJlbW92ZVBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBzdGlsbCBkaXNhYmxlZCBmcm9tIGRpc3BsYXkgbm90IGludGVyYWN0aXZlIGFmdGVyIGxvY2FsIHByb3BlcnR5IHJlbW92ZWQuJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUmFuZ2VDaGlsZCBzdGlsbCBkaXNhYmxlZCBmcm9tIGRpc3BsYXkgbm90IGludGVyYWN0aXZlIGFmdGVyIGxvY2FsIHByb3BlcnR5IHJlbW92ZWQuJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVBhcmFncmFwaENoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmFncmFwaENoaWxkIHN0aWxsIGRpc2FibGVkIGZyb20gZGlzcGxheSBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgbG9jYWwgcHJvcGVydHkgcmVtb3ZlZC4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgc3RpbGwgZGlzYWJsZWQgZnJvbSBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBsb2NhbCBwcm9wZXJ0eSByZW1vdmVkLicgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gIHRlc3REaXNhYmxlZCggcGRvbVBhcmVudCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21QYXJlbnQgaW50ZXJhY3RpdmUgbm93IHdpdGhvdXQgbG9jYWwgcHJvcGVydHkuJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUmFuZ2VDaGlsZCBpbnRlcmFjdGl2ZSBub3cgd2l0aG91dCBsb2NhbCBwcm9wZXJ0eS4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUGFyYWdyYXBoQ2hpbGQgaW50ZXJhY3RpdmUgbm93IHdpdGhvdXQgbG9jYWwgcHJvcGVydHkuJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbUJ1dHRvbkNoaWxkLCBERUZBVUxUX0RJU0FCTEVEX1dIRU5fU1VQUE9SVEVELCAncGRvbUJ1dHRvbkNoaWxkIGludGVyYWN0aXZlIG5vdyB3aXRob3V0IGxvY2FsIHByb3BlcnR5LicgKTtcclxuXHJcbiAgcGRvbVBhcmVudC5zZXRQRE9NQXR0cmlidXRlKCAnZGlzYWJsZWQnLCAnJyApO1xyXG4gIHBkb21SYW5nZUNoaWxkLnNldFBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcsICcnICk7XHJcbiAgcGRvbVBhcmFncmFwaENoaWxkLnNldFBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcsICcnICk7XHJcbiAgcGRvbUJ1dHRvbkNoaWxkLnNldFBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcsICcnICk7XHJcblxyXG4gIHRlc3REaXNhYmxlZCggcGRvbVBhcmVudCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJlbnQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgYXR0cmlidXRlLCBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21SYW5nZUNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbVJhbmdlQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgYXR0cmlidXRlLCBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBhdHRyaWJ1dGUsIGRpc3BsYXkgbm90IGludGVyYWN0aXZlJyApO1xyXG5cclxuICBkaXNwbGF5LmludGVyYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBub3QgaW50ZXJhY3RpdmUgYWZ0ZXIgc2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSBhcyBhdHRyaWJ1dGUgZGlzcGxheSBpbnRlcmFjdGl2ZScgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21SYW5nZUNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbVJhbmdlQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgYXR0cmlidXRlIGRpc3BsYXkgaW50ZXJhY3RpdmUnICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgYXR0cmlidXRlIGRpc3BsYXkgaW50ZXJhY3RpdmUnICk7XHJcblxyXG4gIC8vIFRoaXMgdGVzdCBkb2Vzbid0IHdvcmssIGJlY2F1c2UgcGFyYWdyYXBocyBkb24ndCBzdXBwb3J0IGRpc2FibGVkLCBzbyB0aGUgYXR0cmlidXRlIFwiZGlzYWJsZWRcIiB3b24ndFxyXG4gIC8vIGF1dG9tYXRpY2FsbHkgdHJhbnNmZXIgb3ZlciB0byB0aGUgcHJvcGVydHkgdmFsdWUgbGlrZSBmb3IgdGhlIG90aGVycy4gRm9yIGEgbGlzdCBvZiBFbGVtZW50cyB0aGF0IHN1cHBvcnQgXCJkaXNhYmxlZFwiLCBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9BdHRyaWJ1dGVzL2Rpc2FibGVkXHJcbiAgLy8gdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUGFyYWdyYXBoQ2hpbGQgbm90IGludGVyYWN0aXZlIGFmdGVyIHNldHRpbmcgZGlzYWJsZWQgbWFudWFsbHkgYXMgYXR0cmlidXRlLCBkaXNwbGF5ICBpbnRlcmFjdGl2ZScgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJlbnQsIERJU0FCTEVEX1RSVUUsICdwZG9tUGFyZW50IHN0aWxsIGRpc2FibGVkIHdoZW4gZGlzcGxheSBpcyBub3QgaW50ZXJhY3RpdmUgYWdhaW4uJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbVJhbmdlQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUmFuZ2VDaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJhZ3JhcGhDaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21QYXJhZ3JhcGhDaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCBzdGlsbCBkaXNhYmxlZCB3aGVuIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlIGFnYWluLicgKTtcclxuXHJcbiAgcGRvbVBhcmVudC5yZW1vdmVQRE9NQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7XHJcbiAgcGRvbVJhbmdlQ2hpbGQucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApO1xyXG4gIHBkb21QYXJhZ3JhcGhDaGlsZC5yZW1vdmVQRE9NQXR0cmlidXRlKCAnZGlzYWJsZWQnICk7XHJcbiAgcGRvbUJ1dHRvbkNoaWxkLnJlbW92ZVBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcgKTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyZW50LCBESVNBQkxFRF9UUlVFLCAncGRvbVBhcmVudCBzdGlsbCBkaXNhYmxlZCBmcm9tIGRpc3BsYXkgbm90IGludGVyYWN0aXZlIGFmdGVyIGxvY2FsIGF0dHJpYnV0ZSByZW1vdmVkLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21SYW5nZUNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbVJhbmdlQ2hpbGQgc3RpbGwgZGlzYWJsZWQgZnJvbSBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBsb2NhbCBhdHRyaWJ1dGUgcmVtb3ZlZC4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tUGFyYWdyYXBoQ2hpbGQgc3RpbGwgZGlzYWJsZWQgZnJvbSBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBsb2NhbCBhdHRyaWJ1dGUgcmVtb3ZlZC4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgc3RpbGwgZGlzYWJsZWQgZnJvbSBkaXNwbGF5IG5vdCBpbnRlcmFjdGl2ZSBhZnRlciBsb2NhbCBhdHRyaWJ1dGUgcmVtb3ZlZC4nICk7XHJcblxyXG4gIGRpc3BsYXkuaW50ZXJhY3RpdmUgPSB0cnVlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21QYXJlbnQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUGFyZW50IGludGVyYWN0aXZlIG5vdyB3aXRob3V0IGxvY2FsIGF0dHJpYnV0ZS4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUmFuZ2VDaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21SYW5nZUNoaWxkIGludGVyYWN0aXZlIG5vdyB3aXRob3V0IGxvY2FsIGF0dHJpYnV0ZS4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tUGFyYWdyYXBoQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tUGFyYWdyYXBoQ2hpbGQgaW50ZXJhY3RpdmUgbm93IHdpdGhvdXQgbG9jYWwgYXR0cmlidXRlLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21CdXR0b25DaGlsZCBpbnRlcmFjdGl2ZSBub3cgd2l0aG91dCBsb2NhbCBhdHRyaWJ1dGUuJyApO1xyXG5cclxuICBjb25zdCBjb250YWluZXJPZkRBR0J1dHRvbiA9IG5ldyBOb2RlKCB7XHJcbiAgICBjaGlsZHJlbjogWyBwZG9tQnV0dG9uQ2hpbGQgXVxyXG4gIH0gKTtcclxuICBwZG9tUGFyZW50LmFkZENoaWxkKCBjb250YWluZXJPZkRBR0J1dHRvbiApO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21CdXR0b25DaGlsZCBkZWZhdWx0IG5vdCBkaXNhYmxlZC4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tQnV0dG9uQ2hpbGQgZGVmYXVsdCBub3QgZGlzYWJsZWQgd2l0aCBkYWcuJywgMSApO1xyXG5cclxuICBkaXNwbGF5LmludGVyYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gIHRlc3REaXNhYmxlZCggcGRvbUJ1dHRvbkNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbUJ1dHRvbkNoaWxkIHR1cm5lZCBkaXNhYmxlZC4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgdHVybmVkIGRpc2FibGVkIHdpdGggZGFnLicsIDEgKTtcclxuXHJcbiAgcGRvbUJ1dHRvbkNoaWxkLnNldFBET01BdHRyaWJ1dGUoICdkaXNhYmxlZCcsIHRydWUsIHsgYXNQcm9wZXJ0eTogdHJ1ZSB9ICk7XHJcblxyXG4gIHRlc3REaXNhYmxlZCggcGRvbUJ1dHRvbkNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbUJ1dHRvbkNoaWxkIHR1cm5lZCBkaXNhYmxlZCBzZXQgcHJvcGVydHkgdG9vLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCB0dXJuZWQgZGlzYWJsZWQgc2V0IHByb3BlcnR5IHRvbywgd2l0aCBkYWcuJywgMSApO1xyXG5cclxuICBkaXNwbGF5LmludGVyYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERJU0FCTEVEX1RSVUUsICdwZG9tQnV0dG9uQ2hpbGQgdHVybmVkIG5vdCBkaXNhYmxlZCBzZXQgcHJvcGVydHkgdG9vLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCB0dXJuZWQgbm90IGRpc2FibGVkIHNldCBwcm9wZXJ0eSB0b28sIHdpdGggZGFnLicsIDEgKTtcclxuXHJcbiAgZGlzcGxheS5pbnRlcmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCB0dXJuZWQgZGlzYWJsZWQgYWdhaW4uJyApO1xyXG4gIHRlc3REaXNhYmxlZCggcGRvbUJ1dHRvbkNoaWxkLCBESVNBQkxFRF9UUlVFLCAncGRvbUJ1dHRvbkNoaWxkIHR1cm5lZCBkaXNhYmxlZCBhZ2Fpbiwgd2l0aCBkYWcuJywgMSApO1xyXG5cclxuICBwZG9tQnV0dG9uQ2hpbGQucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ2Rpc2FibGVkJyApO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCByZW1vdmUgZGlzYWJsZWQgd2hpbGUgbm90IGludGVyYWN0aXZlLicgKTtcclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgRElTQUJMRURfVFJVRSwgJ3Bkb21CdXR0b25DaGlsZCByZW1vdmUgZGlzYWJsZWQgd2hpbGUgbm90IGludGVyYWN0aXZlLCB3aXRoIGRhZy4nLCAxICk7XHJcblxyXG4gIGRpc3BsYXkuaW50ZXJhY3RpdmUgPSB0cnVlO1xyXG5cclxuICB0ZXN0RGlzYWJsZWQoIHBkb21CdXR0b25DaGlsZCwgREVGQVVMVF9ESVNBQkxFRF9XSEVOX1NVUFBPUlRFRCwgJ3Bkb21CdXR0b25DaGlsZCBkZWZhdWx0IG5vdCBkaXNhYmxlZCBhZnRlciBpbnRlcmFjdGl2ZSBhZ2Fpbi4nICk7XHJcbiAgdGVzdERpc2FibGVkKCBwZG9tQnV0dG9uQ2hpbGQsIERFRkFVTFRfRElTQUJMRURfV0hFTl9TVVBQT1JURUQsICdwZG9tQnV0dG9uQ2hpbGQgZGVmYXVsdCBub3QgZGlzYWJsZWQgYWZ0ZXIgaW50ZXJhY3RpdmUgYWdhaW4gd2l0aCBkYWcuJywgMSApO1xyXG5cclxuICBkaXNwbGF5LmRpc3Bvc2UoKTtcclxuICBkaXNwbGF5LmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG59ICk7XHJcblxyXG4vLyB0aGVzZSBmdXp6ZXJzIHRha2UgdGltZSwgc28gaXQgaXMgbmljZSB3aGVuIHRoZXkgYXJlIGxhc3RcclxuUVVuaXQudGVzdCggJ1BET01GdXp6ZXIgd2l0aCAzIG5vZGVzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBmdXp6ZXIgPSBuZXcgUERPTUZ1enplciggMywgZmFsc2UgKTtcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCA1MDAwOyBpKysgKSB7XHJcbiAgICBmdXp6ZXIuc3RlcCgpO1xyXG4gIH1cclxuICBhc3NlcnQuZXhwZWN0KCAwICk7XHJcbiAgZnV6emVyLmRpc3Bvc2UoKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1BET01GdXp6ZXIgd2l0aCA0IG5vZGVzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBmdXp6ZXIgPSBuZXcgUERPTUZ1enplciggNCwgZmFsc2UgKTtcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAxMDAwOyBpKysgKSB7XHJcbiAgICBmdXp6ZXIuc3RlcCgpO1xyXG4gIH1cclxuICBhc3NlcnQuZXhwZWN0KCAwICk7XHJcbiAgZnV6emVyLmRpc3Bvc2UoKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1BET01GdXp6ZXIgd2l0aCA1IG5vZGVzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBmdXp6ZXIgPSBuZXcgUERPTUZ1enplciggNSwgZmFsc2UgKTtcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAzMDA7IGkrKyApIHtcclxuICAgIGZ1enplci5zdGVwKCk7XHJcbiAgfVxy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