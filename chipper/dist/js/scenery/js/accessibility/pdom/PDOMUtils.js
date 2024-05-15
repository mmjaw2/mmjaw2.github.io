// Copyright 2017-2024, University of Colorado Boulder

/**
 * Utility functions for scenery that are specifically useful for ParallelDOM.
 * These generally pertain to DOM traversal and manipulation.
 *
 * For the most part this file's methods are public in a scenery-internal context. Some exceptions apply. Please
 * consult @jessegreenberg and/or @zepumph before using this outside of scenery.
 *
 * @author Jesse Greenberg
 */

import { isTReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import validate from '../../../../axon/js/validate.js';
import Validation from '../../../../axon/js/Validation.js';
import merge from '../../../../phet-core/js/merge.js';
import stripEmbeddingMarks from '../../../../phet-core/js/stripEmbeddingMarks.js';
import { PDOMSiblingStyle, scenery } from '../../imports.js';

// constants
const NEXT = 'NEXT';
const PREVIOUS = 'PREVIOUS';

// HTML tag names
const INPUT_TAG = 'INPUT';
const LABEL_TAG = 'LABEL';
const BUTTON_TAG = 'BUTTON';
const TEXTAREA_TAG = 'TEXTAREA';
const SELECT_TAG = 'SELECT';
const OPTGROUP_TAG = 'OPTGROUP';
const DATALIST_TAG = 'DATALIST';
const OUTPUT_TAG = 'OUTPUT';
const DIV_TAG = 'DIV';
const A_TAG = 'A';
const AREA_TAG = 'AREA';
const P_TAG = 'P';
const IFRAME_TAG = 'IFRAME';

// tag names with special behavior
const BOLD_TAG = 'B';
const STRONG_TAG = 'STRONG';
const I_TAG = 'I';
const EM_TAG = 'EM';
const MARK_TAG = 'MARK';
const SMALL_TAG = 'SMALL';
const DEL_TAG = 'DEL';
const INS_TAG = 'INS';
const SUB_TAG = 'SUB';
const SUP_TAG = 'SUP';
const BR_TAG = 'BR';

// These browser tags are a definition of default focusable elements, converted from Javascript types,
// see https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus
const DEFAULT_FOCUSABLE_TAGS = [A_TAG, AREA_TAG, INPUT_TAG, SELECT_TAG, TEXTAREA_TAG, BUTTON_TAG, IFRAME_TAG];

// collection of tags that are used for formatting text
const FORMATTING_TAGS = [BOLD_TAG, STRONG_TAG, I_TAG, EM_TAG, MARK_TAG, SMALL_TAG, DEL_TAG, INS_TAG, SUB_TAG, SUP_TAG, BR_TAG];

// these elements do not have a closing tag, so they won't support features like innerHTML. This is how PhET treats
// these elements, not necessary what is legal html.
const ELEMENTS_WITHOUT_CLOSING_TAG = [INPUT_TAG];

// valid DOM events that the display adds listeners to. For a list of scenery events that support pdom features
// see Input.PDOM_EVENT_TYPES
// NOTE: Update BrowserEvents if this is added to
const DOM_EVENTS = ['focusin', 'focusout', 'input', 'change', 'click', 'keydown', 'keyup'];

// DOM events that must have been triggered from user input of some kind, and will trigger the
// Display.userGestureEmitter. focus and blur events will trigger from scripting so they must be excluded.
const USER_GESTURE_EVENTS = ['input', 'change', 'click', 'keydown', 'keyup'];

// A collection of DOM events which should be blocked from reaching the scenery Display div
// if they are targeted at an ancestor of the PDOM. Some screen readers try to send fake
// mouse/touch/pointer events to elements but for the purposes of Accessibility we only
// want to respond to DOM_EVENTS.
const BLOCKED_DOM_EVENTS = [
// touch
'touchstart', 'touchend', 'touchmove', 'touchcancel',
// mouse
'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout',
// pointer
'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout', 'pointercancel', 'gotpointercapture', 'lostpointercapture'];
const ARIA_LABELLEDBY = 'aria-labelledby';
const ARIA_DESCRIBEDBY = 'aria-describedby';
const ARIA_ACTIVE_DESCENDANT = 'aria-activedescendant';

// data attribute to flag whether an element is focusable - cannot check tabindex because IE11 and Edge assign
// tabIndex=0 internally for all HTML elements, including those that should not receive focus
const DATA_FOCUSABLE = 'data-focusable';

// data attribute which contains the unique ID of a Trail that allows us to find the PDOMPeer associated
// with a particular DOM element. This is used in several places in scenery accessibility, mostly PDOMPeer and Input.
const DATA_PDOM_UNIQUE_ID = 'data-unique-id';

// {Array.<String>} attributes that put an ID of another attribute as the value, see https://github.com/phetsims/scenery/issues/819
const ASSOCIATION_ATTRIBUTES = [ARIA_LABELLEDBY, ARIA_DESCRIBEDBY, ARIA_ACTIVE_DESCENDANT];

/**
 * Get all 'element' nodes off the parent element, placing them in an array for easy traversal.  Note that this
 * includes all elements, even those that are 'hidden' or purely for structure.
 *
 * @param  {HTMLElement} domElement - parent whose children will be linearized
 * @returns {HTMLElement[]}
 */
function getLinearDOMElements(domElement) {
  // gets ALL descendant children for the element
  const children = domElement.getElementsByTagName('*');
  const linearDOM = [];
  for (let i = 0; i < children.length; i++) {
    // searching for the HTML element nodes (NOT Scenery nodes)
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      linearDOM[i] = children[i];
    }
  }
  return linearDOM;
}

/**
 * Determine if an element is hidden.  An element is considered 'hidden' if it (or any of its ancestors) has the
 * 'hidden' attribute.
 *
 * @param {HTMLElement} domElement
 * @returns {Boolean}
 */
function isElementHidden(domElement) {
  if (domElement.hidden) {
    return true;
  } else if (domElement === document.body) {
    return false;
  } else {
    return isElementHidden(domElement.parentElement);
  }
}

/**
 * Get the next or previous focusable element in the parallel DOM under the parent element and relative to the currently
 * focused element. Useful if you need to set focus dynamically or need to prevent default behavior
 * when focus changes. If no next or previous focusable is found, it returns the currently focused element.
 * This function should not be used directly, use getNextFocusable() or getPreviousFocusable() instead.
 *
 * @param {string} direction - direction of traversal, one of 'NEXT' | 'PREVIOUS'
 * @param {HTMLElement} [parentElement] - optional, search will be limited to children of this element
 * @returns {HTMLElement}
 */
function getNextPreviousFocusable(direction, parentElement) {
  // linearize the document [or the desired parent] for traversal
  const parent = parentElement || document.body;
  const linearDOM = getLinearDOMElements(parent);
  const activeElement = document.activeElement;
  const activeIndex = linearDOM.indexOf(activeElement);
  const delta = direction === NEXT ? +1 : -1;

  // find the next focusable element in the DOM
  let nextIndex = activeIndex + delta;
  while (nextIndex < linearDOM.length && nextIndex >= 0) {
    const nextElement = linearDOM[nextIndex];
    nextIndex += delta;
    if (PDOMUtils.isElementFocusable(nextElement)) {
      return nextElement;
    }
  }

  // if no next focusable is found, return the active DOM element
  return activeElement;
}

/**
 * Trims the white space from the left of the string.
 * Solution from https://stackoverflow.com/questions/1593859/left-trim-in-javascript
 * @param  {string} string
 * @returns {string}
 */
function trimLeft(string) {
  // ^ - from the beginning of the string
  // \s - whitespace character
  // + - greedy
  return string.replace(/^\s+/, '');
}

/**
 * Returns whether or not the tagName supports innerHTML or textContent in PhET.
 * @private
 * @param {string} tagName
 * @returns {boolean}
 */
function tagNameSupportsContent(tagName) {
  return !_.includes(ELEMENTS_WITHOUT_CLOSING_TAG, tagName.toUpperCase());
}
const PDOMUtils = {
  /**
   * Given a Property or string, return the Propergy value if it is a property. Otherwise just return the string.
   * Useful for forwarding the string to DOM content, but allowing the API to take a StringProperty. Eventually
   * PDOM may support dynamic strings.
   * @param valueOrProperty
   * @returns {string|Property}
   */
  unwrapStringProperty(valueOrProperty) {
    const result = valueOrProperty === null ? null : typeof valueOrProperty === 'string' ? valueOrProperty : valueOrProperty.value;
    assert && assert(result === null || typeof result === 'string');
    return result;
  },
  /**
   * Get the next focusable element relative to the currently focused element and under the parentElement.
   * Can be useful if you want to emulate the 'Tab' key behavior or just transition focus to the next element
   * in the document. If no next focusable can be found, it will return the currently focused element.
   * @public
   *
   * @param {HTMLElement} [parentElement] - optional, search will be limited to elements under this element
   * @returns {HTMLElement}
   */
  getNextFocusable(parentElement) {
    return getNextPreviousFocusable(NEXT, parentElement);
  },
  /**
   * Get the previous focusable element relative to the currently focused element under the parentElement. Can be
   * useful if you want to emulate 'Shift+Tab' behavior. If no next focusable can be found, it will return the
   * currently focused element.
   * @public
   *
   * @param {HTMLElement} [parentElement] - optional, search will be limited to elements under this parent
   * @returns {HTMLElement}
   */
  getPreviousFocusable(parentElement) {
    return getNextPreviousFocusable(PREVIOUS, parentElement);
  },
  /**
   * Get the first focusable element under the parentElement. If no element is available, the document.body is
   * returned.
   *
   * @param {HTMLElement} [parentElement] - optionally restrict the search to elements under this parent
   * @returns {HTMLElement}
   */
  getFirstFocusable(parentElement) {
    const parent = parentElement || document.body;
    const linearDOM = getLinearDOMElements(parent);

    // return the document.body if no element is found
    let firstFocusable = document.body;
    let nextIndex = 0;
    while (nextIndex < linearDOM.length) {
      const nextElement = linearDOM[nextIndex];
      nextIndex++;
      if (PDOMUtils.isElementFocusable(nextElement)) {
        firstFocusable = nextElement;
        break;
      }
    }
    return firstFocusable;
  },
  /**
   * Return a random focusable element in the document. Particularly useful for fuzz testing.
   * @public
   *
   * @parma {Random} random
   * @returns {HTMLElement}
   */
  getRandomFocusable(random) {
    assert && assert(random, 'Random expected');
    const linearDOM = getLinearDOMElements(document.body);
    const focusableElements = [];
    for (let i = 0; i < linearDOM.length; i++) {
      PDOMUtils.isElementFocusable(linearDOM[i]) && focusableElements.push(linearDOM[i]);
    }
    return focusableElements[random.nextInt(focusableElements.length)];
  },
  /**
   * ParallelDOM trait values may be in a Property to support dynamic locales. This function
   * returns the Property value in that case. The value may be a string, boolean, or number -
   * all of which are valid values for native HTML attributes.
   *
   * @param {string | boolean | number | TReadOnlyProperty<string|boolean|number>} valueOrProperty
   * @returns {string|boolean|number}
   */
  unwrapProperty(valueOrProperty) {
    return isTReadOnlyProperty(valueOrProperty) ? valueOrProperty.value : valueOrProperty;
  },
  /**
   * If the textContent has any tags that are not formatting tags, return false. Only checking for
   * tags that are not in the allowed FORMATTING_TAGS. If there are no tags at all, return false.
   * @public
   *
   * @param {string} textContent
   * @returns {boolean}
   */
  containsFormattingTags(textContent) {
    // no-op for null case
    if (textContent === null) {
      return false;
    }
    assert && assert(typeof textContent === 'string', 'unsupported type for textContent.');
    let i = 0;
    const openIndices = [];
    const closeIndices = [];

    // find open/close tag pairs in the text content
    while (i < textContent.length) {
      const openIndex = textContent.indexOf('<', i);
      const closeIndex = textContent.indexOf('>', i);
      if (openIndex > -1) {
        openIndices.push(openIndex);
        i = openIndex + 1;
      }
      if (closeIndex > -1) {
        closeIndices.push(closeIndex);
        i = closeIndex + 1;
      } else {
        i++;
      }
    }

    // malformed tags or no tags at all, return false immediately
    if (openIndices.length !== closeIndices.length || openIndices.length === 0) {
      return false;
    }

    // check the name in between the open and close brackets - if anything other than formatting tags, return false
    let onlyFormatting = true;
    const upperCaseContent = textContent.toUpperCase();
    for (let j = 0; j < openIndices.length; j++) {
      // get the name and remove the closing slash
      let subString = upperCaseContent.substring(openIndices[j] + 1, closeIndices[j]);
      subString = subString.replace('/', '');

      // if the left of the substring contains space, it is not a valid tag so allow
      const trimmed = trimLeft(subString);
      if (subString.length - trimmed.length > 0) {
        continue;
      }
      if (!_.includes(FORMATTING_TAGS, subString)) {
        onlyFormatting = false;
      }
    }
    return onlyFormatting;
  },
  /**
   * If the text content uses formatting tags, set the content as innerHTML. Otherwise, set as textContent.
   * In general, textContent is more secure and much faster because it doesn't trigger DOM styling and
   * element insertions.
   * @public
   *
   * @param {Element} domElement
   * @param {string|number|null} textContent - domElement is cleared of content if null, could have acceptable HTML
   *                                    "formatting" tags in it
   */
  setTextContent(domElement, textContent) {
    assert && assert(domElement instanceof Element); // parent to HTMLElement, to support other namespaces
    assert && assert(textContent === null || typeof textContent === 'string');
    if (textContent === null) {
      domElement.innerHTML = '';
    } else {
      // XHTML requires <br/> instead of <br>, but <br/> is still valid in HTML. See
      // https://github.com/phetsims/scenery/issues/1309
      const textWithoutBreaks = textContent.replaceAll('<br>', '<br/>');

      // TODO: this line must be removed to support i18n Interactive Description, see https://github.com/phetsims/chipper/issues/798
      const textWithoutEmbeddingMarks = stripEmbeddingMarks(textWithoutBreaks);

      // Disallow any unfilled template variables to be set in the PDOM.
      validate(textWithoutEmbeddingMarks, Validation.STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR);
      if (tagNameSupportsContent(domElement.tagName)) {
        // only returns true if content contains listed formatting tags
        if (PDOMUtils.containsFormattingTags(textWithoutEmbeddingMarks)) {
          domElement.innerHTML = textWithoutEmbeddingMarks;
        } else {
          domElement.textContent = textWithoutEmbeddingMarks;
        }
      }
    }
  },
  /**
   * Given a tagName, test if the element will be focuable by default by the browser.
   * Different from isElementFocusable, because this only looks at tags that the browser will automatically put
   * a >=0 tab index on.
   * @public
   *
   * NOTE: Uses a set of browser types as the definition of default focusable elements,
   * see https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus
   *
   * @param tagName
   * @returns {boolean}
   */
  tagIsDefaultFocusable(tagName) {
    return _.includes(DEFAULT_FOCUSABLE_TAGS, tagName.toUpperCase());
  },
  /**
   * Returns true if the element is focusable. Assumes that all focusable  elements have tabIndex >= 0, which
   * is only true for elements of the Parallel DOM.
   *
   * @param {HTMLElement} domElement
   * @returns {boolean}
   */
  isElementFocusable(domElement) {
    if (!document.body.contains(domElement)) {
      return false;
    }

    // continue to next element if this one is meant to be hidden
    if (isElementHidden(domElement)) {
      return false;
    }

    // if element is for formatting, skipe over it - required since IE gives these tabindex="0"
    if (_.includes(FORMATTING_TAGS, domElement.tagName)) {
      return false;
    }
    return domElement.getAttribute(DATA_FOCUSABLE) === 'true';
  },
  /**
   * @public
   *
   * @param {string} tagName
   * @returns {boolean} - true if the tag does support inner content
   */
  tagNameSupportsContent(tagName) {
    return tagNameSupportsContent(tagName);
  },
  /**
   * Helper function to remove multiple HTMLElements from another HTMLElement
   * @public
   *
   * @param {HTMLElement} element
   * @param {Array.<HTMLElement>} childrenToRemove
   */
  removeElements(element, childrenToRemove) {
    for (let i = 0; i < childrenToRemove.length; i++) {
      const childToRemove = childrenToRemove[i];
      assert && assert(element.contains(childToRemove), 'element does not contain child to be removed: ', childToRemove);
      element.removeChild(childToRemove);
    }
  },
  /**
   * Helper function to add multiple elements as children to a parent
   * @public
   *
   * @param {HTMLElement} element - to add children to
   * @param {Array.<HTMLElement>} childrenToAdd
   * @param {HTMLElement} [beforeThisElement] - if not supplied, the insertBefore call will just use 'null'
   */
  insertElements(element, childrenToAdd, beforeThisElement) {
    assert && assert(element instanceof window.Element);
    assert && assert(Array.isArray(childrenToAdd));
    for (let i = 0; i < childrenToAdd.length; i++) {
      const childToAdd = childrenToAdd[i];
      element.insertBefore(childToAdd, beforeThisElement || null);
    }
  },
  /**
   * Create an HTML element.  Unless this is a form element or explicitly marked as focusable, add a negative
   * tab index. IE gives all elements a tabIndex of 0 and handles tab navigation internally, so this marks
   * which elements should not be in the focus order.
   *
   * @public
   * @param  {string} tagName
   * @param {boolean} focusable - should the element be explicitly added to the focus order?
   * @param {Object} [options]
   * @returns {HTMLElement}
   */
  createElement(tagName, focusable, options) {
    options = merge({
      // {string|null} - If non-null, the element will be created with the specific namespace
      namespace: null,
      // {string|null} - A string id that uniquely represents this element in the DOM, must be completely
      // unique in the DOM.
      id: null
    }, options);
    const domElement = options.namespace ? document.createElementNS(options.namespace, tagName) : document.createElement(tagName);
    if (options.id) {
      domElement.id = options.id;
    }

    // set tab index if we are overriding default browser behavior
    PDOMUtils.overrideFocusWithTabIndex(domElement, focusable);

    // gives this element styling from SceneryStyle
    domElement.classList.add(PDOMSiblingStyle.SIBLING_CLASS_NAME);
    return domElement;
  },
  /**
   * Add a tab index to an element when overriding the default focus behavior for the element. Adding tabindex
   * to an element can only be done when overriding the default browser behavior because tabindex interferes with
   * the way JAWS reads through content on Chrome, see https://github.com/phetsims/scenery/issues/893
   *
   * If default behavior and focusable align, the tabindex attribute is removed so that can't interfere with a
   * screen reader.
   * @public (scenery-internal)
   *
   * @param {HTMLElement} element
   * @param {boolean} focusable
   */
  overrideFocusWithTabIndex(element, focusable) {
    const defaultFocusable = PDOMUtils.tagIsDefaultFocusable(element.tagName);

    // only add a tabindex when we are overriding the default focusable bahvior of the browser for the tag name
    if (defaultFocusable !== focusable) {
      element.tabIndex = focusable ? 0 : -1;
    } else {
      element.removeAttribute('tabindex');
    }
    element.setAttribute(DATA_FOCUSABLE, focusable);
  },
  TAGS: {
    INPUT: INPUT_TAG,
    LABEL: LABEL_TAG,
    BUTTON: BUTTON_TAG,
    TEXTAREA: TEXTAREA_TAG,
    SELECT: SELECT_TAG,
    OPTGROUP: OPTGROUP_TAG,
    DATALIST: DATALIST_TAG,
    OUTPUT: OUTPUT_TAG,
    DIV: DIV_TAG,
    A: A_TAG,
    P: P_TAG,
    B: BOLD_TAG,
    STRONG: STRONG_TAG,
    I: I_TAG,
    EM: EM_TAG,
    MARK: MARK_TAG,
    SMALL: SMALL_TAG,
    DEL: DEL_TAG,
    INS: INS_TAG,
    SUB: SUB_TAG,
    SUP: SUP_TAG
  },
  // these elements are typically associated with forms, and support certain attributes
  FORM_ELEMENTS: [INPUT_TAG, BUTTON_TAG, TEXTAREA_TAG, SELECT_TAG, OPTGROUP_TAG, DATALIST_TAG, OUTPUT_TAG, A_TAG],
  // default tags for html elements of the Node.
  DEFAULT_CONTAINER_TAG_NAME: DIV_TAG,
  DEFAULT_DESCRIPTION_TAG_NAME: P_TAG,
  DEFAULT_LABEL_TAG_NAME: P_TAG,
  ASSOCIATION_ATTRIBUTES: ASSOCIATION_ATTRIBUTES,
  // valid input types that support the "checked" property/attribute for input elements
  INPUT_TYPES_THAT_SUPPORT_CHECKED: ['RADIO', 'CHECKBOX'],
  DOM_EVENTS: DOM_EVENTS,
  USER_GESTURE_EVENTS: USER_GESTURE_EVENTS,
  BLOCKED_DOM_EVENTS: BLOCKED_DOM_EVENTS,
  DATA_PDOM_UNIQUE_ID: DATA_PDOM_UNIQUE_ID,
  PDOM_UNIQUE_ID_SEPARATOR: '-',
  // attribute used for elements which Scenery should not dispatch SceneryEvents when DOM event input is received on
  // them, see ParallelDOM.setExcludeLabelSiblingFromInput for more information
  DATA_EXCLUDE_FROM_INPUT: 'data-exclude-from-input'
};
scenery.register('PDOMUtils', PDOMUtils);
export default PDOMUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpc1RSZWFkT25seVByb3BlcnR5IiwidmFsaWRhdGUiLCJWYWxpZGF0aW9uIiwibWVyZ2UiLCJzdHJpcEVtYmVkZGluZ01hcmtzIiwiUERPTVNpYmxpbmdTdHlsZSIsInNjZW5lcnkiLCJORVhUIiwiUFJFVklPVVMiLCJJTlBVVF9UQUciLCJMQUJFTF9UQUciLCJCVVRUT05fVEFHIiwiVEVYVEFSRUFfVEFHIiwiU0VMRUNUX1RBRyIsIk9QVEdST1VQX1RBRyIsIkRBVEFMSVNUX1RBRyIsIk9VVFBVVF9UQUciLCJESVZfVEFHIiwiQV9UQUciLCJBUkVBX1RBRyIsIlBfVEFHIiwiSUZSQU1FX1RBRyIsIkJPTERfVEFHIiwiU1RST05HX1RBRyIsIklfVEFHIiwiRU1fVEFHIiwiTUFSS19UQUciLCJTTUFMTF9UQUciLCJERUxfVEFHIiwiSU5TX1RBRyIsIlNVQl9UQUciLCJTVVBfVEFHIiwiQlJfVEFHIiwiREVGQVVMVF9GT0NVU0FCTEVfVEFHUyIsIkZPUk1BVFRJTkdfVEFHUyIsIkVMRU1FTlRTX1dJVEhPVVRfQ0xPU0lOR19UQUciLCJET01fRVZFTlRTIiwiVVNFUl9HRVNUVVJFX0VWRU5UUyIsIkJMT0NLRURfRE9NX0VWRU5UUyIsIkFSSUFfTEFCRUxMRURCWSIsIkFSSUFfREVTQ1JJQkVEQlkiLCJBUklBX0FDVElWRV9ERVNDRU5EQU5UIiwiREFUQV9GT0NVU0FCTEUiLCJEQVRBX1BET01fVU5JUVVFX0lEIiwiQVNTT0NJQVRJT05fQVRUUklCVVRFUyIsImdldExpbmVhckRPTUVsZW1lbnRzIiwiZG9tRWxlbWVudCIsImNoaWxkcmVuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJsaW5lYXJET00iLCJpIiwibGVuZ3RoIiwibm9kZVR5cGUiLCJOb2RlIiwiRUxFTUVOVF9OT0RFIiwiaXNFbGVtZW50SGlkZGVuIiwiaGlkZGVuIiwiZG9jdW1lbnQiLCJib2R5IiwicGFyZW50RWxlbWVudCIsImdldE5leHRQcmV2aW91c0ZvY3VzYWJsZSIsImRpcmVjdGlvbiIsInBhcmVudCIsImFjdGl2ZUVsZW1lbnQiLCJhY3RpdmVJbmRleCIsImluZGV4T2YiLCJkZWx0YSIsIm5leHRJbmRleCIsIm5leHRFbGVtZW50IiwiUERPTVV0aWxzIiwiaXNFbGVtZW50Rm9jdXNhYmxlIiwidHJpbUxlZnQiLCJzdHJpbmciLCJyZXBsYWNlIiwidGFnTmFtZVN1cHBvcnRzQ29udGVudCIsInRhZ05hbWUiLCJfIiwiaW5jbHVkZXMiLCJ0b1VwcGVyQ2FzZSIsInVud3JhcFN0cmluZ1Byb3BlcnR5IiwidmFsdWVPclByb3BlcnR5IiwicmVzdWx0IiwidmFsdWUiLCJhc3NlcnQiLCJnZXROZXh0Rm9jdXNhYmxlIiwiZ2V0UHJldmlvdXNGb2N1c2FibGUiLCJnZXRGaXJzdEZvY3VzYWJsZSIsImZpcnN0Rm9jdXNhYmxlIiwiZ2V0UmFuZG9tRm9jdXNhYmxlIiwicmFuZG9tIiwiZm9jdXNhYmxlRWxlbWVudHMiLCJwdXNoIiwibmV4dEludCIsInVud3JhcFByb3BlcnR5IiwiY29udGFpbnNGb3JtYXR0aW5nVGFncyIsInRleHRDb250ZW50Iiwib3BlbkluZGljZXMiLCJjbG9zZUluZGljZXMiLCJvcGVuSW5kZXgiLCJjbG9zZUluZGV4Iiwib25seUZvcm1hdHRpbmciLCJ1cHBlckNhc2VDb250ZW50IiwiaiIsInN1YlN0cmluZyIsInN1YnN0cmluZyIsInRyaW1tZWQiLCJzZXRUZXh0Q29udGVudCIsIkVsZW1lbnQiLCJpbm5lckhUTUwiLCJ0ZXh0V2l0aG91dEJyZWFrcyIsInJlcGxhY2VBbGwiLCJ0ZXh0V2l0aG91dEVtYmVkZGluZ01hcmtzIiwiU1RSSU5HX1dJVEhPVVRfVEVNUExBVEVfVkFSU19WQUxJREFUT1IiLCJ0YWdJc0RlZmF1bHRGb2N1c2FibGUiLCJjb250YWlucyIsImdldEF0dHJpYnV0ZSIsInJlbW92ZUVsZW1lbnRzIiwiZWxlbWVudCIsImNoaWxkcmVuVG9SZW1vdmUiLCJjaGlsZFRvUmVtb3ZlIiwicmVtb3ZlQ2hpbGQiLCJpbnNlcnRFbGVtZW50cyIsImNoaWxkcmVuVG9BZGQiLCJiZWZvcmVUaGlzRWxlbWVudCIsIndpbmRvdyIsIkFycmF5IiwiaXNBcnJheSIsImNoaWxkVG9BZGQiLCJpbnNlcnRCZWZvcmUiLCJjcmVhdGVFbGVtZW50IiwiZm9jdXNhYmxlIiwib3B0aW9ucyIsIm5hbWVzcGFjZSIsImlkIiwiY3JlYXRlRWxlbWVudE5TIiwib3ZlcnJpZGVGb2N1c1dpdGhUYWJJbmRleCIsImNsYXNzTGlzdCIsImFkZCIsIlNJQkxJTkdfQ0xBU1NfTkFNRSIsImRlZmF1bHRGb2N1c2FibGUiLCJ0YWJJbmRleCIsInJlbW92ZUF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsIlRBR1MiLCJJTlBVVCIsIkxBQkVMIiwiQlVUVE9OIiwiVEVYVEFSRUEiLCJTRUxFQ1QiLCJPUFRHUk9VUCIsIkRBVEFMSVNUIiwiT1VUUFVUIiwiRElWIiwiQSIsIlAiLCJCIiwiU1RST05HIiwiSSIsIkVNIiwiTUFSSyIsIlNNQUxMIiwiREVMIiwiSU5TIiwiU1VCIiwiU1VQIiwiRk9STV9FTEVNRU5UUyIsIkRFRkFVTFRfQ09OVEFJTkVSX1RBR19OQU1FIiwiREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRSIsIkRFRkFVTFRfTEFCRUxfVEFHX05BTUUiLCJJTlBVVF9UWVBFU19USEFUX1NVUFBPUlRfQ0hFQ0tFRCIsIlBET01fVU5JUVVFX0lEX1NFUEFSQVRPUiIsIkRBVEFfRVhDTFVERV9GUk9NX0lOUFVUIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQRE9NVXRpbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHNjZW5lcnkgdGhhdCBhcmUgc3BlY2lmaWNhbGx5IHVzZWZ1bCBmb3IgUGFyYWxsZWxET00uXHJcbiAqIFRoZXNlIGdlbmVyYWxseSBwZXJ0YWluIHRvIERPTSB0cmF2ZXJzYWwgYW5kIG1hbmlwdWxhdGlvbi5cclxuICpcclxuICogRm9yIHRoZSBtb3N0IHBhcnQgdGhpcyBmaWxlJ3MgbWV0aG9kcyBhcmUgcHVibGljIGluIGEgc2NlbmVyeS1pbnRlcm5hbCBjb250ZXh0LiBTb21lIGV4Y2VwdGlvbnMgYXBwbHkuIFBsZWFzZVxyXG4gKiBjb25zdWx0IEBqZXNzZWdyZWVuYmVyZyBhbmQvb3IgQHplcHVtcGggYmVmb3JlIHVzaW5nIHRoaXMgb3V0c2lkZSBvZiBzY2VuZXJ5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZ1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IGlzVFJlYWRPbmx5UHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IHZhbGlkYXRlIGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvdmFsaWRhdGUuanMnO1xyXG5pbXBvcnQgVmFsaWRhdGlvbiBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1ZhbGlkYXRpb24uanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHN0cmlwRW1iZWRkaW5nTWFya3MgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3N0cmlwRW1iZWRkaW5nTWFya3MuanMnO1xyXG5pbXBvcnQgeyBQRE9NU2libGluZ1N0eWxlLCBzY2VuZXJ5IH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgTkVYVCA9ICdORVhUJztcclxuY29uc3QgUFJFVklPVVMgPSAnUFJFVklPVVMnO1xyXG5cclxuLy8gSFRNTCB0YWcgbmFtZXNcclxuY29uc3QgSU5QVVRfVEFHID0gJ0lOUFVUJztcclxuY29uc3QgTEFCRUxfVEFHID0gJ0xBQkVMJztcclxuY29uc3QgQlVUVE9OX1RBRyA9ICdCVVRUT04nO1xyXG5jb25zdCBURVhUQVJFQV9UQUcgPSAnVEVYVEFSRUEnO1xyXG5jb25zdCBTRUxFQ1RfVEFHID0gJ1NFTEVDVCc7XHJcbmNvbnN0IE9QVEdST1VQX1RBRyA9ICdPUFRHUk9VUCc7XHJcbmNvbnN0IERBVEFMSVNUX1RBRyA9ICdEQVRBTElTVCc7XHJcbmNvbnN0IE9VVFBVVF9UQUcgPSAnT1VUUFVUJztcclxuY29uc3QgRElWX1RBRyA9ICdESVYnO1xyXG5jb25zdCBBX1RBRyA9ICdBJztcclxuY29uc3QgQVJFQV9UQUcgPSAnQVJFQSc7XHJcbmNvbnN0IFBfVEFHID0gJ1AnO1xyXG5jb25zdCBJRlJBTUVfVEFHID0gJ0lGUkFNRSc7XHJcblxyXG4vLyB0YWcgbmFtZXMgd2l0aCBzcGVjaWFsIGJlaGF2aW9yXHJcbmNvbnN0IEJPTERfVEFHID0gJ0InO1xyXG5jb25zdCBTVFJPTkdfVEFHID0gJ1NUUk9ORyc7XHJcbmNvbnN0IElfVEFHID0gJ0knO1xyXG5jb25zdCBFTV9UQUcgPSAnRU0nO1xyXG5jb25zdCBNQVJLX1RBRyA9ICdNQVJLJztcclxuY29uc3QgU01BTExfVEFHID0gJ1NNQUxMJztcclxuY29uc3QgREVMX1RBRyA9ICdERUwnO1xyXG5jb25zdCBJTlNfVEFHID0gJ0lOUyc7XHJcbmNvbnN0IFNVQl9UQUcgPSAnU1VCJztcclxuY29uc3QgU1VQX1RBRyA9ICdTVVAnO1xyXG5jb25zdCBCUl9UQUcgPSAnQlInO1xyXG5cclxuLy8gVGhlc2UgYnJvd3NlciB0YWdzIGFyZSBhIGRlZmluaXRpb24gb2YgZGVmYXVsdCBmb2N1c2FibGUgZWxlbWVudHMsIGNvbnZlcnRlZCBmcm9tIEphdmFzY3JpcHQgdHlwZXMsXHJcbi8vIHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTk5NjYwL3doaWNoLWh0bWwtZWxlbWVudHMtY2FuLXJlY2VpdmUtZm9jdXNcclxuY29uc3QgREVGQVVMVF9GT0NVU0FCTEVfVEFHUyA9IFsgQV9UQUcsIEFSRUFfVEFHLCBJTlBVVF9UQUcsIFNFTEVDVF9UQUcsIFRFWFRBUkVBX1RBRywgQlVUVE9OX1RBRywgSUZSQU1FX1RBRyBdO1xyXG5cclxuLy8gY29sbGVjdGlvbiBvZiB0YWdzIHRoYXQgYXJlIHVzZWQgZm9yIGZvcm1hdHRpbmcgdGV4dFxyXG5jb25zdCBGT1JNQVRUSU5HX1RBR1MgPSBbIEJPTERfVEFHLCBTVFJPTkdfVEFHLCBJX1RBRywgRU1fVEFHLCBNQVJLX1RBRywgU01BTExfVEFHLCBERUxfVEFHLCBJTlNfVEFHLCBTVUJfVEFHLFxyXG4gIFNVUF9UQUcsIEJSX1RBRyBdO1xyXG5cclxuLy8gdGhlc2UgZWxlbWVudHMgZG8gbm90IGhhdmUgYSBjbG9zaW5nIHRhZywgc28gdGhleSB3b24ndCBzdXBwb3J0IGZlYXR1cmVzIGxpa2UgaW5uZXJIVE1MLiBUaGlzIGlzIGhvdyBQaEVUIHRyZWF0c1xyXG4vLyB0aGVzZSBlbGVtZW50cywgbm90IG5lY2Vzc2FyeSB3aGF0IGlzIGxlZ2FsIGh0bWwuXHJcbmNvbnN0IEVMRU1FTlRTX1dJVEhPVVRfQ0xPU0lOR19UQUcgPSBbIElOUFVUX1RBRyBdO1xyXG5cclxuLy8gdmFsaWQgRE9NIGV2ZW50cyB0aGF0IHRoZSBkaXNwbGF5IGFkZHMgbGlzdGVuZXJzIHRvLiBGb3IgYSBsaXN0IG9mIHNjZW5lcnkgZXZlbnRzIHRoYXQgc3VwcG9ydCBwZG9tIGZlYXR1cmVzXHJcbi8vIHNlZSBJbnB1dC5QRE9NX0VWRU5UX1RZUEVTXHJcbi8vIE5PVEU6IFVwZGF0ZSBCcm93c2VyRXZlbnRzIGlmIHRoaXMgaXMgYWRkZWQgdG9cclxuY29uc3QgRE9NX0VWRU5UUyA9IFsgJ2ZvY3VzaW4nLCAnZm9jdXNvdXQnLCAnaW5wdXQnLCAnY2hhbmdlJywgJ2NsaWNrJywgJ2tleWRvd24nLCAna2V5dXAnIF07XHJcblxyXG4vLyBET00gZXZlbnRzIHRoYXQgbXVzdCBoYXZlIGJlZW4gdHJpZ2dlcmVkIGZyb20gdXNlciBpbnB1dCBvZiBzb21lIGtpbmQsIGFuZCB3aWxsIHRyaWdnZXIgdGhlXHJcbi8vIERpc3BsYXkudXNlckdlc3R1cmVFbWl0dGVyLiBmb2N1cyBhbmQgYmx1ciBldmVudHMgd2lsbCB0cmlnZ2VyIGZyb20gc2NyaXB0aW5nIHNvIHRoZXkgbXVzdCBiZSBleGNsdWRlZC5cclxuY29uc3QgVVNFUl9HRVNUVVJFX0VWRU5UUyA9IFsgJ2lucHV0JywgJ2NoYW5nZScsICdjbGljaycsICdrZXlkb3duJywgJ2tleXVwJyBdO1xyXG5cclxuLy8gQSBjb2xsZWN0aW9uIG9mIERPTSBldmVudHMgd2hpY2ggc2hvdWxkIGJlIGJsb2NrZWQgZnJvbSByZWFjaGluZyB0aGUgc2NlbmVyeSBEaXNwbGF5IGRpdlxyXG4vLyBpZiB0aGV5IGFyZSB0YXJnZXRlZCBhdCBhbiBhbmNlc3RvciBvZiB0aGUgUERPTS4gU29tZSBzY3JlZW4gcmVhZGVycyB0cnkgdG8gc2VuZCBmYWtlXHJcbi8vIG1vdXNlL3RvdWNoL3BvaW50ZXIgZXZlbnRzIHRvIGVsZW1lbnRzIGJ1dCBmb3IgdGhlIHB1cnBvc2VzIG9mIEFjY2Vzc2liaWxpdHkgd2Ugb25seVxyXG4vLyB3YW50IHRvIHJlc3BvbmQgdG8gRE9NX0VWRU5UUy5cclxuY29uc3QgQkxPQ0tFRF9ET01fRVZFTlRTID0gW1xyXG5cclxuICAvLyB0b3VjaFxyXG4gICd0b3VjaHN0YXJ0JyxcclxuICAndG91Y2hlbmQnLFxyXG4gICd0b3VjaG1vdmUnLFxyXG4gICd0b3VjaGNhbmNlbCcsXHJcblxyXG4gIC8vIG1vdXNlXHJcbiAgJ21vdXNlZG93bicsXHJcbiAgJ21vdXNldXAnLFxyXG4gICdtb3VzZW1vdmUnLFxyXG4gICdtb3VzZW92ZXInLFxyXG4gICdtb3VzZW91dCcsXHJcblxyXG4gIC8vIHBvaW50ZXJcclxuICAncG9pbnRlcmRvd24nLFxyXG4gICdwb2ludGVydXAnLFxyXG4gICdwb2ludGVybW92ZScsXHJcbiAgJ3BvaW50ZXJvdmVyJyxcclxuICAncG9pbnRlcm91dCcsXHJcbiAgJ3BvaW50ZXJjYW5jZWwnLFxyXG4gICdnb3Rwb2ludGVyY2FwdHVyZScsXHJcbiAgJ2xvc3Rwb2ludGVyY2FwdHVyZSdcclxuXTtcclxuXHJcbmNvbnN0IEFSSUFfTEFCRUxMRURCWSA9ICdhcmlhLWxhYmVsbGVkYnknO1xyXG5jb25zdCBBUklBX0RFU0NSSUJFREJZID0gJ2FyaWEtZGVzY3JpYmVkYnknO1xyXG5jb25zdCBBUklBX0FDVElWRV9ERVNDRU5EQU5UID0gJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCc7XHJcblxyXG4vLyBkYXRhIGF0dHJpYnV0ZSB0byBmbGFnIHdoZXRoZXIgYW4gZWxlbWVudCBpcyBmb2N1c2FibGUgLSBjYW5ub3QgY2hlY2sgdGFiaW5kZXggYmVjYXVzZSBJRTExIGFuZCBFZGdlIGFzc2lnblxyXG4vLyB0YWJJbmRleD0wIGludGVybmFsbHkgZm9yIGFsbCBIVE1MIGVsZW1lbnRzLCBpbmNsdWRpbmcgdGhvc2UgdGhhdCBzaG91bGQgbm90IHJlY2VpdmUgZm9jdXNcclxuY29uc3QgREFUQV9GT0NVU0FCTEUgPSAnZGF0YS1mb2N1c2FibGUnO1xyXG5cclxuLy8gZGF0YSBhdHRyaWJ1dGUgd2hpY2ggY29udGFpbnMgdGhlIHVuaXF1ZSBJRCBvZiBhIFRyYWlsIHRoYXQgYWxsb3dzIHVzIHRvIGZpbmQgdGhlIFBET01QZWVyIGFzc29jaWF0ZWRcclxuLy8gd2l0aCBhIHBhcnRpY3VsYXIgRE9NIGVsZW1lbnQuIFRoaXMgaXMgdXNlZCBpbiBzZXZlcmFsIHBsYWNlcyBpbiBzY2VuZXJ5IGFjY2Vzc2liaWxpdHksIG1vc3RseSBQRE9NUGVlciBhbmQgSW5wdXQuXHJcbmNvbnN0IERBVEFfUERPTV9VTklRVUVfSUQgPSAnZGF0YS11bmlxdWUtaWQnO1xyXG5cclxuLy8ge0FycmF5LjxTdHJpbmc+fSBhdHRyaWJ1dGVzIHRoYXQgcHV0IGFuIElEIG9mIGFub3RoZXIgYXR0cmlidXRlIGFzIHRoZSB2YWx1ZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84MTlcclxuY29uc3QgQVNTT0NJQVRJT05fQVRUUklCVVRFUyA9IFsgQVJJQV9MQUJFTExFREJZLCBBUklBX0RFU0NSSUJFREJZLCBBUklBX0FDVElWRV9ERVNDRU5EQU5UIF07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCAnZWxlbWVudCcgbm9kZXMgb2ZmIHRoZSBwYXJlbnQgZWxlbWVudCwgcGxhY2luZyB0aGVtIGluIGFuIGFycmF5IGZvciBlYXN5IHRyYXZlcnNhbC4gIE5vdGUgdGhhdCB0aGlzXHJcbiAqIGluY2x1ZGVzIGFsbCBlbGVtZW50cywgZXZlbiB0aG9zZSB0aGF0IGFyZSAnaGlkZGVuJyBvciBwdXJlbHkgZm9yIHN0cnVjdHVyZS5cclxuICpcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGRvbUVsZW1lbnQgLSBwYXJlbnQgd2hvc2UgY2hpbGRyZW4gd2lsbCBiZSBsaW5lYXJpemVkXHJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudFtdfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGluZWFyRE9NRWxlbWVudHMoIGRvbUVsZW1lbnQgKSB7XHJcblxyXG4gIC8vIGdldHMgQUxMIGRlc2NlbmRhbnQgY2hpbGRyZW4gZm9yIHRoZSBlbGVtZW50XHJcbiAgY29uc3QgY2hpbGRyZW4gPSBkb21FbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnKicgKTtcclxuXHJcbiAgY29uc3QgbGluZWFyRE9NID0gW107XHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcblxyXG4gICAgLy8gc2VhcmNoaW5nIGZvciB0aGUgSFRNTCBlbGVtZW50IG5vZGVzIChOT1QgU2NlbmVyeSBub2RlcylcclxuICAgIGlmICggY2hpbGRyZW5bIGkgXS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgKSB7XHJcbiAgICAgIGxpbmVhckRPTVsgaSBdID0gKCBjaGlsZHJlblsgaSBdICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBsaW5lYXJET007XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmUgaWYgYW4gZWxlbWVudCBpcyBoaWRkZW4uICBBbiBlbGVtZW50IGlzIGNvbnNpZGVyZWQgJ2hpZGRlbicgaWYgaXQgKG9yIGFueSBvZiBpdHMgYW5jZXN0b3JzKSBoYXMgdGhlXHJcbiAqICdoaWRkZW4nIGF0dHJpYnV0ZS5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZG9tRWxlbWVudFxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cclxuICovXHJcbmZ1bmN0aW9uIGlzRWxlbWVudEhpZGRlbiggZG9tRWxlbWVudCApIHtcclxuICBpZiAoIGRvbUVsZW1lbnQuaGlkZGVuICkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBkb21FbGVtZW50ID09PSBkb2N1bWVudC5ib2R5ICkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiBpc0VsZW1lbnRIaWRkZW4oIGRvbUVsZW1lbnQucGFyZW50RWxlbWVudCApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgbmV4dCBvciBwcmV2aW91cyBmb2N1c2FibGUgZWxlbWVudCBpbiB0aGUgcGFyYWxsZWwgRE9NIHVuZGVyIHRoZSBwYXJlbnQgZWxlbWVudCBhbmQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnRseVxyXG4gKiBmb2N1c2VkIGVsZW1lbnQuIFVzZWZ1bCBpZiB5b3UgbmVlZCB0byBzZXQgZm9jdXMgZHluYW1pY2FsbHkgb3IgbmVlZCB0byBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3JcclxuICogd2hlbiBmb2N1cyBjaGFuZ2VzLiBJZiBubyBuZXh0IG9yIHByZXZpb3VzIGZvY3VzYWJsZSBpcyBmb3VuZCwgaXQgcmV0dXJucyB0aGUgY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudC5cclxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHksIHVzZSBnZXROZXh0Rm9jdXNhYmxlKCkgb3IgZ2V0UHJldmlvdXNGb2N1c2FibGUoKSBpbnN0ZWFkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uIC0gZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCwgb25lIG9mICdORVhUJyB8ICdQUkVWSU9VUydcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3BhcmVudEVsZW1lbnRdIC0gb3B0aW9uYWwsIHNlYXJjaCB3aWxsIGJlIGxpbWl0ZWQgdG8gY2hpbGRyZW4gb2YgdGhpcyBlbGVtZW50XHJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cclxuICovXHJcbmZ1bmN0aW9uIGdldE5leHRQcmV2aW91c0ZvY3VzYWJsZSggZGlyZWN0aW9uLCBwYXJlbnRFbGVtZW50ICkge1xyXG5cclxuICAvLyBsaW5lYXJpemUgdGhlIGRvY3VtZW50IFtvciB0aGUgZGVzaXJlZCBwYXJlbnRdIGZvciB0cmF2ZXJzYWxcclxuICBjb25zdCBwYXJlbnQgPSBwYXJlbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgY29uc3QgbGluZWFyRE9NID0gZ2V0TGluZWFyRE9NRWxlbWVudHMoIHBhcmVudCApO1xyXG5cclxuICBjb25zdCBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICBjb25zdCBhY3RpdmVJbmRleCA9IGxpbmVhckRPTS5pbmRleE9mKCBhY3RpdmVFbGVtZW50ICk7XHJcbiAgY29uc3QgZGVsdGEgPSBkaXJlY3Rpb24gPT09IE5FWFQgPyArMSA6IC0xO1xyXG5cclxuICAvLyBmaW5kIHRoZSBuZXh0IGZvY3VzYWJsZSBlbGVtZW50IGluIHRoZSBET01cclxuICBsZXQgbmV4dEluZGV4ID0gYWN0aXZlSW5kZXggKyBkZWx0YTtcclxuICB3aGlsZSAoIG5leHRJbmRleCA8IGxpbmVhckRPTS5sZW5ndGggJiYgbmV4dEluZGV4ID49IDAgKSB7XHJcbiAgICBjb25zdCBuZXh0RWxlbWVudCA9IGxpbmVhckRPTVsgbmV4dEluZGV4IF07XHJcbiAgICBuZXh0SW5kZXggKz0gZGVsdGE7XHJcblxyXG4gICAgaWYgKCBQRE9NVXRpbHMuaXNFbGVtZW50Rm9jdXNhYmxlKCBuZXh0RWxlbWVudCApICkge1xyXG4gICAgICByZXR1cm4gbmV4dEVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBpZiBubyBuZXh0IGZvY3VzYWJsZSBpcyBmb3VuZCwgcmV0dXJuIHRoZSBhY3RpdmUgRE9NIGVsZW1lbnRcclxuICByZXR1cm4gYWN0aXZlRWxlbWVudDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyaW1zIHRoZSB3aGl0ZSBzcGFjZSBmcm9tIHRoZSBsZWZ0IG9mIHRoZSBzdHJpbmcuXHJcbiAqIFNvbHV0aW9uIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTU5Mzg1OS9sZWZ0LXRyaW0taW4tamF2YXNjcmlwdFxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpbUxlZnQoIHN0cmluZyApIHtcclxuXHJcbiAgLy8gXiAtIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXHJcbiAgLy8gXFxzIC0gd2hpdGVzcGFjZSBjaGFyYWN0ZXJcclxuICAvLyArIC0gZ3JlZWR5XHJcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXlxccysvLCAnJyApO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRhZ05hbWUgc3VwcG9ydHMgaW5uZXJIVE1MIG9yIHRleHRDb250ZW50IGluIFBoRVQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuZnVuY3Rpb24gdGFnTmFtZVN1cHBvcnRzQ29udGVudCggdGFnTmFtZSApIHtcclxuICByZXR1cm4gIV8uaW5jbHVkZXMoIEVMRU1FTlRTX1dJVEhPVVRfQ0xPU0lOR19UQUcsIHRhZ05hbWUudG9VcHBlckNhc2UoKSApO1xyXG59XHJcblxyXG5jb25zdCBQRE9NVXRpbHMgPSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgUHJvcGVydHkgb3Igc3RyaW5nLCByZXR1cm4gdGhlIFByb3Blcmd5IHZhbHVlIGlmIGl0IGlzIGEgcHJvcGVydHkuIE90aGVyd2lzZSBqdXN0IHJldHVybiB0aGUgc3RyaW5nLlxyXG4gICAqIFVzZWZ1bCBmb3IgZm9yd2FyZGluZyB0aGUgc3RyaW5nIHRvIERPTSBjb250ZW50LCBidXQgYWxsb3dpbmcgdGhlIEFQSSB0byB0YWtlIGEgU3RyaW5nUHJvcGVydHkuIEV2ZW50dWFsbHlcclxuICAgKiBQRE9NIG1heSBzdXBwb3J0IGR5bmFtaWMgc3RyaW5ncy5cclxuICAgKiBAcGFyYW0gdmFsdWVPclByb3BlcnR5XHJcbiAgICogQHJldHVybnMge3N0cmluZ3xQcm9wZXJ0eX1cclxuICAgKi9cclxuICB1bndyYXBTdHJpbmdQcm9wZXJ0eSggdmFsdWVPclByb3BlcnR5ICkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gdmFsdWVPclByb3BlcnR5ID09PSBudWxsID8gbnVsbCA6ICggdHlwZW9mIHZhbHVlT3JQcm9wZXJ0eSA9PT0gJ3N0cmluZycgPyB2YWx1ZU9yUHJvcGVydHkgOiB2YWx1ZU9yUHJvcGVydHkudmFsdWUgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXN1bHQgPT09IG51bGwgfHwgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycgKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgbmV4dCBmb2N1c2FibGUgZWxlbWVudCByZWxhdGl2ZSB0byB0aGUgY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudCBhbmQgdW5kZXIgdGhlIHBhcmVudEVsZW1lbnQuXHJcbiAgICogQ2FuIGJlIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBlbXVsYXRlIHRoZSAnVGFiJyBrZXkgYmVoYXZpb3Igb3IganVzdCB0cmFuc2l0aW9uIGZvY3VzIHRvIHRoZSBuZXh0IGVsZW1lbnRcclxuICAgKiBpbiB0aGUgZG9jdW1lbnQuIElmIG5vIG5leHQgZm9jdXNhYmxlIGNhbiBiZSBmb3VuZCwgaXQgd2lsbCByZXR1cm4gdGhlIGN1cnJlbnRseSBmb2N1c2VkIGVsZW1lbnQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3BhcmVudEVsZW1lbnRdIC0gb3B0aW9uYWwsIHNlYXJjaCB3aWxsIGJlIGxpbWl0ZWQgdG8gZWxlbWVudHMgdW5kZXIgdGhpcyBlbGVtZW50XHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fVxyXG4gICAqL1xyXG4gIGdldE5leHRGb2N1c2FibGUoIHBhcmVudEVsZW1lbnQgKSB7XHJcbiAgICByZXR1cm4gZ2V0TmV4dFByZXZpb3VzRm9jdXNhYmxlKCBORVhULCBwYXJlbnRFbGVtZW50ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwcmV2aW91cyBmb2N1c2FibGUgZWxlbWVudCByZWxhdGl2ZSB0byB0aGUgY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudCB1bmRlciB0aGUgcGFyZW50RWxlbWVudC4gQ2FuIGJlXHJcbiAgICogdXNlZnVsIGlmIHlvdSB3YW50IHRvIGVtdWxhdGUgJ1NoaWZ0K1RhYicgYmVoYXZpb3IuIElmIG5vIG5leHQgZm9jdXNhYmxlIGNhbiBiZSBmb3VuZCwgaXQgd2lsbCByZXR1cm4gdGhlXHJcbiAgICogY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbcGFyZW50RWxlbWVudF0gLSBvcHRpb25hbCwgc2VhcmNoIHdpbGwgYmUgbGltaXRlZCB0byBlbGVtZW50cyB1bmRlciB0aGlzIHBhcmVudFxyXG4gICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cclxuICAgKi9cclxuICBnZXRQcmV2aW91c0ZvY3VzYWJsZSggcGFyZW50RWxlbWVudCApIHtcclxuICAgIHJldHVybiBnZXROZXh0UHJldmlvdXNGb2N1c2FibGUoIFBSRVZJT1VTLCBwYXJlbnRFbGVtZW50ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudCB1bmRlciB0aGUgcGFyZW50RWxlbWVudC4gSWYgbm8gZWxlbWVudCBpcyBhdmFpbGFibGUsIHRoZSBkb2N1bWVudC5ib2R5IGlzXHJcbiAgICogcmV0dXJuZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbcGFyZW50RWxlbWVudF0gLSBvcHRpb25hbGx5IHJlc3RyaWN0IHRoZSBzZWFyY2ggdG8gZWxlbWVudHMgdW5kZXIgdGhpcyBwYXJlbnRcclxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XHJcbiAgICovXHJcbiAgZ2V0Rmlyc3RGb2N1c2FibGUoIHBhcmVudEVsZW1lbnQgKSB7XHJcbiAgICBjb25zdCBwYXJlbnQgPSBwYXJlbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgICBjb25zdCBsaW5lYXJET00gPSBnZXRMaW5lYXJET01FbGVtZW50cyggcGFyZW50ICk7XHJcblxyXG4gICAgLy8gcmV0dXJuIHRoZSBkb2N1bWVudC5ib2R5IGlmIG5vIGVsZW1lbnQgaXMgZm91bmRcclxuICAgIGxldCBmaXJzdEZvY3VzYWJsZSA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgbGV0IG5leHRJbmRleCA9IDA7XHJcbiAgICB3aGlsZSAoIG5leHRJbmRleCA8IGxpbmVhckRPTS5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IG5leHRFbGVtZW50ID0gbGluZWFyRE9NWyBuZXh0SW5kZXggXTtcclxuICAgICAgbmV4dEluZGV4Kys7XHJcblxyXG4gICAgICBpZiAoIFBET01VdGlscy5pc0VsZW1lbnRGb2N1c2FibGUoIG5leHRFbGVtZW50ICkgKSB7XHJcbiAgICAgICAgZmlyc3RGb2N1c2FibGUgPSBuZXh0RWxlbWVudDtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmaXJzdEZvY3VzYWJsZTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gYSByYW5kb20gZm9jdXNhYmxlIGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50LiBQYXJ0aWN1bGFybHkgdXNlZnVsIGZvciBmdXp6IHRlc3RpbmcuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcm1hIHtSYW5kb219IHJhbmRvbVxyXG4gICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cclxuICAgKi9cclxuICBnZXRSYW5kb21Gb2N1c2FibGUoIHJhbmRvbSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJhbmRvbSwgJ1JhbmRvbSBleHBlY3RlZCcgKTtcclxuXHJcbiAgICBjb25zdCBsaW5lYXJET00gPSBnZXRMaW5lYXJET01FbGVtZW50cyggZG9jdW1lbnQuYm9keSApO1xyXG4gICAgY29uc3QgZm9jdXNhYmxlRWxlbWVudHMgPSBbXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpbmVhckRPTS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgUERPTVV0aWxzLmlzRWxlbWVudEZvY3VzYWJsZSggbGluZWFyRE9NWyBpIF0gKSAmJiBmb2N1c2FibGVFbGVtZW50cy5wdXNoKCBsaW5lYXJET01bIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmb2N1c2FibGVFbGVtZW50c1sgcmFuZG9tLm5leHRJbnQoIGZvY3VzYWJsZUVsZW1lbnRzLmxlbmd0aCApIF07XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUGFyYWxsZWxET00gdHJhaXQgdmFsdWVzIG1heSBiZSBpbiBhIFByb3BlcnR5IHRvIHN1cHBvcnQgZHluYW1pYyBsb2NhbGVzLiBUaGlzIGZ1bmN0aW9uXHJcbiAgICogcmV0dXJucyB0aGUgUHJvcGVydHkgdmFsdWUgaW4gdGhhdCBjYXNlLiBUaGUgdmFsdWUgbWF5IGJlIGEgc3RyaW5nLCBib29sZWFuLCBvciBudW1iZXIgLVxyXG4gICAqIGFsbCBvZiB3aGljaCBhcmUgdmFsaWQgdmFsdWVzIGZvciBuYXRpdmUgSFRNTCBhdHRyaWJ1dGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nfGJvb2xlYW58bnVtYmVyPn0gdmFsdWVPclByb3BlcnR5XHJcbiAgICogQHJldHVybnMge3N0cmluZ3xib29sZWFufG51bWJlcn1cclxuICAgKi9cclxuICB1bndyYXBQcm9wZXJ0eSggdmFsdWVPclByb3BlcnR5ICkge1xyXG4gICAgcmV0dXJuIGlzVFJlYWRPbmx5UHJvcGVydHkoIHZhbHVlT3JQcm9wZXJ0eSApID8gdmFsdWVPclByb3BlcnR5LnZhbHVlIDogdmFsdWVPclByb3BlcnR5O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSB0ZXh0Q29udGVudCBoYXMgYW55IHRhZ3MgdGhhdCBhcmUgbm90IGZvcm1hdHRpbmcgdGFncywgcmV0dXJuIGZhbHNlLiBPbmx5IGNoZWNraW5nIGZvclxyXG4gICAqIHRhZ3MgdGhhdCBhcmUgbm90IGluIHRoZSBhbGxvd2VkIEZPUk1BVFRJTkdfVEFHUy4gSWYgdGhlcmUgYXJlIG5vIHRhZ3MgYXQgYWxsLCByZXR1cm4gZmFsc2UuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRDb250ZW50XHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgY29udGFpbnNGb3JtYXR0aW5nVGFncyggdGV4dENvbnRlbnQgKSB7XHJcblxyXG4gICAgLy8gbm8tb3AgZm9yIG51bGwgY2FzZVxyXG4gICAgaWYgKCB0ZXh0Q29udGVudCA9PT0gbnVsbCApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRleHRDb250ZW50ID09PSAnc3RyaW5nJywgJ3Vuc3VwcG9ydGVkIHR5cGUgZm9yIHRleHRDb250ZW50LicgKTtcclxuXHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBjb25zdCBvcGVuSW5kaWNlcyA9IFtdO1xyXG4gICAgY29uc3QgY2xvc2VJbmRpY2VzID0gW107XHJcblxyXG4gICAgLy8gZmluZCBvcGVuL2Nsb3NlIHRhZyBwYWlycyBpbiB0aGUgdGV4dCBjb250ZW50XHJcbiAgICB3aGlsZSAoIGkgPCB0ZXh0Q29udGVudC5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IG9wZW5JbmRleCA9IHRleHRDb250ZW50LmluZGV4T2YoICc8JywgaSApO1xyXG4gICAgICBjb25zdCBjbG9zZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZiggJz4nLCBpICk7XHJcblxyXG4gICAgICBpZiAoIG9wZW5JbmRleCA+IC0xICkge1xyXG4gICAgICAgIG9wZW5JbmRpY2VzLnB1c2goIG9wZW5JbmRleCApO1xyXG4gICAgICAgIGkgPSBvcGVuSW5kZXggKyAxO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggY2xvc2VJbmRleCA+IC0xICkge1xyXG4gICAgICAgIGNsb3NlSW5kaWNlcy5wdXNoKCBjbG9zZUluZGV4ICk7XHJcbiAgICAgICAgaSA9IGNsb3NlSW5kZXggKyAxO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGkrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG1hbGZvcm1lZCB0YWdzIG9yIG5vIHRhZ3MgYXQgYWxsLCByZXR1cm4gZmFsc2UgaW1tZWRpYXRlbHlcclxuICAgIGlmICggb3BlbkluZGljZXMubGVuZ3RoICE9PSBjbG9zZUluZGljZXMubGVuZ3RoIHx8IG9wZW5JbmRpY2VzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNoZWNrIHRoZSBuYW1lIGluIGJldHdlZW4gdGhlIG9wZW4gYW5kIGNsb3NlIGJyYWNrZXRzIC0gaWYgYW55dGhpbmcgb3RoZXIgdGhhbiBmb3JtYXR0aW5nIHRhZ3MsIHJldHVybiBmYWxzZVxyXG4gICAgbGV0IG9ubHlGb3JtYXR0aW5nID0gdHJ1ZTtcclxuICAgIGNvbnN0IHVwcGVyQ2FzZUNvbnRlbnQgPSB0ZXh0Q29udGVudC50b1VwcGVyQ2FzZSgpO1xyXG4gICAgZm9yICggbGV0IGogPSAwOyBqIDwgb3BlbkluZGljZXMubGVuZ3RoOyBqKysgKSB7XHJcblxyXG4gICAgICAvLyBnZXQgdGhlIG5hbWUgYW5kIHJlbW92ZSB0aGUgY2xvc2luZyBzbGFzaFxyXG4gICAgICBsZXQgc3ViU3RyaW5nID0gdXBwZXJDYXNlQ29udGVudC5zdWJzdHJpbmcoIG9wZW5JbmRpY2VzWyBqIF0gKyAxLCBjbG9zZUluZGljZXNbIGogXSApO1xyXG4gICAgICBzdWJTdHJpbmcgPSBzdWJTdHJpbmcucmVwbGFjZSggJy8nLCAnJyApO1xyXG5cclxuICAgICAgLy8gaWYgdGhlIGxlZnQgb2YgdGhlIHN1YnN0cmluZyBjb250YWlucyBzcGFjZSwgaXQgaXMgbm90IGEgdmFsaWQgdGFnIHNvIGFsbG93XHJcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSB0cmltTGVmdCggc3ViU3RyaW5nICk7XHJcbiAgICAgIGlmICggc3ViU3RyaW5nLmxlbmd0aCAtIHRyaW1tZWQubGVuZ3RoID4gMCApIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCAhXy5pbmNsdWRlcyggRk9STUFUVElOR19UQUdTLCBzdWJTdHJpbmcgKSApIHtcclxuICAgICAgICBvbmx5Rm9ybWF0dGluZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9ubHlGb3JtYXR0aW5nO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSB0ZXh0IGNvbnRlbnQgdXNlcyBmb3JtYXR0aW5nIHRhZ3MsIHNldCB0aGUgY29udGVudCBhcyBpbm5lckhUTUwuIE90aGVyd2lzZSwgc2V0IGFzIHRleHRDb250ZW50LlxyXG4gICAqIEluIGdlbmVyYWwsIHRleHRDb250ZW50IGlzIG1vcmUgc2VjdXJlIGFuZCBtdWNoIGZhc3RlciBiZWNhdXNlIGl0IGRvZXNuJ3QgdHJpZ2dlciBET00gc3R5bGluZyBhbmRcclxuICAgKiBlbGVtZW50IGluc2VydGlvbnMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtFbGVtZW50fSBkb21FbGVtZW50XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfG51bGx9IHRleHRDb250ZW50IC0gZG9tRWxlbWVudCBpcyBjbGVhcmVkIG9mIGNvbnRlbnQgaWYgbnVsbCwgY291bGQgaGF2ZSBhY2NlcHRhYmxlIEhUTUxcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZm9ybWF0dGluZ1wiIHRhZ3MgaW4gaXRcclxuICAgKi9cclxuICBzZXRUZXh0Q29udGVudCggZG9tRWxlbWVudCwgdGV4dENvbnRlbnQgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FbGVtZW50IGluc3RhbmNlb2YgRWxlbWVudCApOyAvLyBwYXJlbnQgdG8gSFRNTEVsZW1lbnQsIHRvIHN1cHBvcnQgb3RoZXIgbmFtZXNwYWNlc1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGV4dENvbnRlbnQgPT09IG51bGwgfHwgdHlwZW9mIHRleHRDb250ZW50ID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgIGlmICggdGV4dENvbnRlbnQgPT09IG51bGwgKSB7XHJcbiAgICAgIGRvbUVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFhIVE1MIHJlcXVpcmVzIDxici8+IGluc3RlYWQgb2YgPGJyPiwgYnV0IDxici8+IGlzIHN0aWxsIHZhbGlkIGluIEhUTUwuIFNlZVxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTMwOVxyXG4gICAgICBjb25zdCB0ZXh0V2l0aG91dEJyZWFrcyA9IHRleHRDb250ZW50LnJlcGxhY2VBbGwoICc8YnI+JywgJzxici8+JyApO1xyXG5cclxuICAgICAgLy8gVE9ETzogdGhpcyBsaW5lIG11c3QgYmUgcmVtb3ZlZCB0byBzdXBwb3J0IGkxOG4gSW50ZXJhY3RpdmUgRGVzY3JpcHRpb24sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNzk4XHJcbiAgICAgIGNvbnN0IHRleHRXaXRob3V0RW1iZWRkaW5nTWFya3MgPSBzdHJpcEVtYmVkZGluZ01hcmtzKCB0ZXh0V2l0aG91dEJyZWFrcyApO1xyXG5cclxuICAgICAgLy8gRGlzYWxsb3cgYW55IHVuZmlsbGVkIHRlbXBsYXRlIHZhcmlhYmxlcyB0byBiZSBzZXQgaW4gdGhlIFBET00uXHJcbiAgICAgIHZhbGlkYXRlKCB0ZXh0V2l0aG91dEVtYmVkZGluZ01hcmtzLCBWYWxpZGF0aW9uLlNUUklOR19XSVRIT1VUX1RFTVBMQVRFX1ZBUlNfVkFMSURBVE9SICk7XHJcblxyXG4gICAgICBpZiAoIHRhZ05hbWVTdXBwb3J0c0NvbnRlbnQoIGRvbUVsZW1lbnQudGFnTmFtZSApICkge1xyXG5cclxuICAgICAgICAvLyBvbmx5IHJldHVybnMgdHJ1ZSBpZiBjb250ZW50IGNvbnRhaW5zIGxpc3RlZCBmb3JtYXR0aW5nIHRhZ3NcclxuICAgICAgICBpZiAoIFBET01VdGlscy5jb250YWluc0Zvcm1hdHRpbmdUYWdzKCB0ZXh0V2l0aG91dEVtYmVkZGluZ01hcmtzICkgKSB7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmlubmVySFRNTCA9IHRleHRXaXRob3V0RW1iZWRkaW5nTWFya3M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgZG9tRWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRXaXRob3V0RW1iZWRkaW5nTWFya3M7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSB0YWdOYW1lLCB0ZXN0IGlmIHRoZSBlbGVtZW50IHdpbGwgYmUgZm9jdWFibGUgYnkgZGVmYXVsdCBieSB0aGUgYnJvd3Nlci5cclxuICAgKiBEaWZmZXJlbnQgZnJvbSBpc0VsZW1lbnRGb2N1c2FibGUsIGJlY2F1c2UgdGhpcyBvbmx5IGxvb2tzIGF0IHRhZ3MgdGhhdCB0aGUgYnJvd3NlciB3aWxsIGF1dG9tYXRpY2FsbHkgcHV0XHJcbiAgICogYSA+PTAgdGFiIGluZGV4IG9uLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIE5PVEU6IFVzZXMgYSBzZXQgb2YgYnJvd3NlciB0eXBlcyBhcyB0aGUgZGVmaW5pdGlvbiBvZiBkZWZhdWx0IGZvY3VzYWJsZSBlbGVtZW50cyxcclxuICAgKiBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTU5OTY2MC93aGljaC1odG1sLWVsZW1lbnRzLWNhbi1yZWNlaXZlLWZvY3VzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdGFnTmFtZVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIHRhZ0lzRGVmYXVsdEZvY3VzYWJsZSggdGFnTmFtZSApIHtcclxuICAgIHJldHVybiBfLmluY2x1ZGVzKCBERUZBVUxUX0ZPQ1VTQUJMRV9UQUdTLCB0YWdOYW1lLnRvVXBwZXJDYXNlKCkgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgaXMgZm9jdXNhYmxlLiBBc3N1bWVzIHRoYXQgYWxsIGZvY3VzYWJsZSAgZWxlbWVudHMgaGF2ZSB0YWJJbmRleCA+PSAwLCB3aGljaFxyXG4gICAqIGlzIG9ubHkgdHJ1ZSBmb3IgZWxlbWVudHMgb2YgdGhlIFBhcmFsbGVsIERPTS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGRvbUVsZW1lbnRcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBpc0VsZW1lbnRGb2N1c2FibGUoIGRvbUVsZW1lbnQgKSB7XHJcblxyXG4gICAgaWYgKCAhZG9jdW1lbnQuYm9keS5jb250YWlucyggZG9tRWxlbWVudCApICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29udGludWUgdG8gbmV4dCBlbGVtZW50IGlmIHRoaXMgb25lIGlzIG1lYW50IHRvIGJlIGhpZGRlblxyXG4gICAgaWYgKCBpc0VsZW1lbnRIaWRkZW4oIGRvbUVsZW1lbnQgKSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIGVsZW1lbnQgaXMgZm9yIGZvcm1hdHRpbmcsIHNraXBlIG92ZXIgaXQgLSByZXF1aXJlZCBzaW5jZSBJRSBnaXZlcyB0aGVzZSB0YWJpbmRleD1cIjBcIlxyXG4gICAgaWYgKCBfLmluY2x1ZGVzKCBGT1JNQVRUSU5HX1RBR1MsIGRvbUVsZW1lbnQudGFnTmFtZSApICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRvbUVsZW1lbnQuZ2V0QXR0cmlidXRlKCBEQVRBX0ZPQ1VTQUJMRSApID09PSAndHJ1ZSc7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWVcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSB0cnVlIGlmIHRoZSB0YWcgZG9lcyBzdXBwb3J0IGlubmVyIGNvbnRlbnRcclxuICAgKi9cclxuICB0YWdOYW1lU3VwcG9ydHNDb250ZW50KCB0YWdOYW1lICkge1xyXG4gICAgcmV0dXJuIHRhZ05hbWVTdXBwb3J0c0NvbnRlbnQoIHRhZ05hbWUgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmVtb3ZlIG11bHRpcGxlIEhUTUxFbGVtZW50cyBmcm9tIGFub3RoZXIgSFRNTEVsZW1lbnRcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XHJcbiAgICogQHBhcmFtIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBjaGlsZHJlblRvUmVtb3ZlXHJcbiAgICovXHJcbiAgcmVtb3ZlRWxlbWVudHMoIGVsZW1lbnQsIGNoaWxkcmVuVG9SZW1vdmUgKSB7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5Ub1JlbW92ZS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGRUb1JlbW92ZSA9IGNoaWxkcmVuVG9SZW1vdmVbIGkgXTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGVsZW1lbnQuY29udGFpbnMoIGNoaWxkVG9SZW1vdmUgKSwgJ2VsZW1lbnQgZG9lcyBub3QgY29udGFpbiBjaGlsZCB0byBiZSByZW1vdmVkOiAnLCBjaGlsZFRvUmVtb3ZlICk7XHJcblxyXG4gICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKCBjaGlsZFRvUmVtb3ZlICk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBhZGQgbXVsdGlwbGUgZWxlbWVudHMgYXMgY2hpbGRyZW4gdG8gYSBwYXJlbnRcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdG8gYWRkIGNoaWxkcmVuIHRvXHJcbiAgICogQHBhcmFtIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBjaGlsZHJlblRvQWRkXHJcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW2JlZm9yZVRoaXNFbGVtZW50XSAtIGlmIG5vdCBzdXBwbGllZCwgdGhlIGluc2VydEJlZm9yZSBjYWxsIHdpbGwganVzdCB1c2UgJ251bGwnXHJcbiAgICovXHJcbiAgaW5zZXJ0RWxlbWVudHMoIGVsZW1lbnQsIGNoaWxkcmVuVG9BZGQsIGJlZm9yZVRoaXNFbGVtZW50ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZWxlbWVudCBpbnN0YW5jZW9mIHdpbmRvdy5FbGVtZW50ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBjaGlsZHJlblRvQWRkICkgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9BZGQubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkVG9BZGQgPSBjaGlsZHJlblRvQWRkWyBpIF07XHJcbiAgICAgIGVsZW1lbnQuaW5zZXJ0QmVmb3JlKCBjaGlsZFRvQWRkLCBiZWZvcmVUaGlzRWxlbWVudCB8fCBudWxsICk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGFuIEhUTUwgZWxlbWVudC4gIFVubGVzcyB0aGlzIGlzIGEgZm9ybSBlbGVtZW50IG9yIGV4cGxpY2l0bHkgbWFya2VkIGFzIGZvY3VzYWJsZSwgYWRkIGEgbmVnYXRpdmVcclxuICAgKiB0YWIgaW5kZXguIElFIGdpdmVzIGFsbCBlbGVtZW50cyBhIHRhYkluZGV4IG9mIDAgYW5kIGhhbmRsZXMgdGFiIG5hdmlnYXRpb24gaW50ZXJuYWxseSwgc28gdGhpcyBtYXJrc1xyXG4gICAqIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBub3QgYmUgaW4gdGhlIGZvY3VzIG9yZGVyLlxyXG4gICAqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdGFnTmFtZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9jdXNhYmxlIC0gc2hvdWxkIHRoZSBlbGVtZW50IGJlIGV4cGxpY2l0bHkgYWRkZWQgdG8gdGhlIGZvY3VzIG9yZGVyP1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XHJcbiAgICovXHJcbiAgY3JlYXRlRWxlbWVudCggdGFnTmFtZSwgZm9jdXNhYmxlLCBvcHRpb25zICkge1xyXG4gICAgb3B0aW9ucyA9IG1lcmdlKCB7XHJcbiAgICAgIC8vIHtzdHJpbmd8bnVsbH0gLSBJZiBub24tbnVsbCwgdGhlIGVsZW1lbnQgd2lsbCBiZSBjcmVhdGVkIHdpdGggdGhlIHNwZWNpZmljIG5hbWVzcGFjZVxyXG4gICAgICBuYW1lc3BhY2U6IG51bGwsXHJcblxyXG4gICAgICAvLyB7c3RyaW5nfG51bGx9IC0gQSBzdHJpbmcgaWQgdGhhdCB1bmlxdWVseSByZXByZXNlbnRzIHRoaXMgZWxlbWVudCBpbiB0aGUgRE9NLCBtdXN0IGJlIGNvbXBsZXRlbHlcclxuICAgICAgLy8gdW5pcXVlIGluIHRoZSBET00uXHJcbiAgICAgIGlkOiBudWxsXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgZG9tRWxlbWVudCA9IG9wdGlvbnMubmFtZXNwYWNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoIG9wdGlvbnMubmFtZXNwYWNlLCB0YWdOYW1lIClcclxuICAgICAgICAgICAgICAgICAgICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIHRhZ05hbWUgKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuaWQgKSB7XHJcbiAgICAgIGRvbUVsZW1lbnQuaWQgPSBvcHRpb25zLmlkO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB0YWIgaW5kZXggaWYgd2UgYXJlIG92ZXJyaWRpbmcgZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yXHJcbiAgICBQRE9NVXRpbHMub3ZlcnJpZGVGb2N1c1dpdGhUYWJJbmRleCggZG9tRWxlbWVudCwgZm9jdXNhYmxlICk7XHJcblxyXG4gICAgLy8gZ2l2ZXMgdGhpcyBlbGVtZW50IHN0eWxpbmcgZnJvbSBTY2VuZXJ5U3R5bGVcclxuICAgIGRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCggUERPTVNpYmxpbmdTdHlsZS5TSUJMSU5HX0NMQVNTX05BTUUgKTtcclxuXHJcbiAgICByZXR1cm4gZG9tRWxlbWVudDtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSB0YWIgaW5kZXggdG8gYW4gZWxlbWVudCB3aGVuIG92ZXJyaWRpbmcgdGhlIGRlZmF1bHQgZm9jdXMgYmVoYXZpb3IgZm9yIHRoZSBlbGVtZW50LiBBZGRpbmcgdGFiaW5kZXhcclxuICAgKiB0byBhbiBlbGVtZW50IGNhbiBvbmx5IGJlIGRvbmUgd2hlbiBvdmVycmlkaW5nIHRoZSBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3IgYmVjYXVzZSB0YWJpbmRleCBpbnRlcmZlcmVzIHdpdGhcclxuICAgKiB0aGUgd2F5IEpBV1MgcmVhZHMgdGhyb3VnaCBjb250ZW50IG9uIENocm9tZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84OTNcclxuICAgKlxyXG4gICAqIElmIGRlZmF1bHQgYmVoYXZpb3IgYW5kIGZvY3VzYWJsZSBhbGlnbiwgdGhlIHRhYmluZGV4IGF0dHJpYnV0ZSBpcyByZW1vdmVkIHNvIHRoYXQgY2FuJ3QgaW50ZXJmZXJlIHdpdGggYVxyXG4gICAqIHNjcmVlbiByZWFkZXIuXHJcbiAgICogQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvY3VzYWJsZVxyXG4gICAqL1xyXG4gIG92ZXJyaWRlRm9jdXNXaXRoVGFiSW5kZXgoIGVsZW1lbnQsIGZvY3VzYWJsZSApIHtcclxuICAgIGNvbnN0IGRlZmF1bHRGb2N1c2FibGUgPSBQRE9NVXRpbHMudGFnSXNEZWZhdWx0Rm9jdXNhYmxlKCBlbGVtZW50LnRhZ05hbWUgKTtcclxuXHJcbiAgICAvLyBvbmx5IGFkZCBhIHRhYmluZGV4IHdoZW4gd2UgYXJlIG92ZXJyaWRpbmcgdGhlIGRlZmF1bHQgZm9jdXNhYmxlIGJhaHZpb3Igb2YgdGhlIGJyb3dzZXIgZm9yIHRoZSB0YWcgbmFtZVxyXG4gICAgaWYgKCBkZWZhdWx0Rm9jdXNhYmxlICE9PSBmb2N1c2FibGUgKSB7XHJcbiAgICAgIGVsZW1lbnQudGFiSW5kZXggPSBmb2N1c2FibGUgPyAwIDogLTE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoICd0YWJpbmRleCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSggREFUQV9GT0NVU0FCTEUsIGZvY3VzYWJsZSApO1xyXG4gIH0sXHJcblxyXG4gIFRBR1M6IHtcclxuICAgIElOUFVUOiBJTlBVVF9UQUcsXHJcbiAgICBMQUJFTDogTEFCRUxfVEFHLFxyXG4gICAgQlVUVE9OOiBCVVRUT05fVEFHLFxyXG4gICAgVEVYVEFSRUE6IFRFWFRBUkVBX1RBRyxcclxuICAgIFNFTEVDVDogU0VMRUNUX1RBRyxcclxuICAgIE9QVEdST1VQOiBPUFRHUk9VUF9UQUcsXHJcbiAgICBEQVRBTElTVDogREFUQUxJU1RfVEFHLFxyXG4gICAgT1VUUFVUOiBPVVRQVVRfVEFHLFxyXG4gICAgRElWOiBESVZfVEFHLFxyXG4gICAgQTogQV9UQUcsXHJcbiAgICBQOiBQX1RBRyxcclxuICAgIEI6IEJPTERfVEFHLFxyXG4gICAgU1RST05HOiBTVFJPTkdfVEFHLFxyXG4gICAgSTogSV9UQUcsXHJcbiAgICBFTTogRU1fVEFHLFxyXG4gICAgTUFSSzogTUFSS19UQUcsXHJcbiAgICBTTUFMTDogU01BTExfVEFHLFxyXG4gICAgREVMOiBERUxfVEFHLFxyXG4gICAgSU5TOiBJTlNfVEFHLFxyXG4gICAgU1VCOiBTVUJfVEFHLFxyXG4gICAgU1VQOiBTVVBfVEFHXHJcbiAgfSxcclxuXHJcbiAgLy8gdGhlc2UgZWxlbWVudHMgYXJlIHR5cGljYWxseSBhc3NvY2lhdGVkIHdpdGggZm9ybXMsIGFuZCBzdXBwb3J0IGNlcnRhaW4gYXR0cmlidXRlc1xyXG4gIEZPUk1fRUxFTUVOVFM6IFsgSU5QVVRfVEFHLCBCVVRUT05fVEFHLCBURVhUQVJFQV9UQUcsIFNFTEVDVF9UQUcsIE9QVEdST1VQX1RBRywgREFUQUxJU1RfVEFHLCBPVVRQVVRfVEFHLCBBX1RBRyBdLFxyXG5cclxuICAvLyBkZWZhdWx0IHRhZ3MgZm9yIGh0bWwgZWxlbWVudHMgb2YgdGhlIE5vZGUuXHJcbiAgREVGQVVMVF9DT05UQUlORVJfVEFHX05BTUU6IERJVl9UQUcsXHJcbiAgREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRTogUF9UQUcsXHJcbiAgREVGQVVMVF9MQUJFTF9UQUdfTkFNRTogUF9UQUcsXHJcblxyXG4gIEFTU09DSUFUSU9OX0FUVFJJQlVURVM6IEFTU09DSUFUSU9OX0FUVFJJQlVURVMsXHJcblxyXG4gIC8vIHZhbGlkIGlucHV0IHR5cGVzIHRoYXQgc3VwcG9ydCB0aGUgXCJjaGVja2VkXCIgcHJvcGVydHkvYXR0cmlidXRlIGZvciBpbnB1dCBlbGVtZW50c1xyXG4gIElOUFVUX1RZUEVTX1RIQVRfU1VQUE9SVF9DSEVDS0VEOiBbICdSQURJTycsICdDSEVDS0JPWCcgXSxcclxuXHJcbiAgRE9NX0VWRU5UUzogRE9NX0VWRU5UUyxcclxuICBVU0VSX0dFU1RVUkVfRVZFTlRTOiBVU0VSX0dFU1RVUkVfRVZFTlRTLFxyXG4gIEJMT0NLRURfRE9NX0VWRU5UUzogQkxPQ0tFRF9ET01fRVZFTlRTLFxyXG5cclxuICBEQVRBX1BET01fVU5JUVVFX0lEOiBEQVRBX1BET01fVU5JUVVFX0lELFxyXG4gIFBET01fVU5JUVVFX0lEX1NFUEFSQVRPUjogJy0nLFxyXG5cclxuICAvLyBhdHRyaWJ1dGUgdXNlZCBmb3IgZWxlbWVudHMgd2hpY2ggU2NlbmVyeSBzaG91bGQgbm90IGRpc3BhdGNoIFNjZW5lcnlFdmVudHMgd2hlbiBET00gZXZlbnQgaW5wdXQgaXMgcmVjZWl2ZWQgb25cclxuICAvLyB0aGVtLCBzZWUgUGFyYWxsZWxET00uc2V0RXhjbHVkZUxhYmVsU2libGluZ0Zyb21JbnB1dCBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gIERBVEFfRVhDTFVERV9GUk9NX0lOUFVUOiAnZGF0YS1leGNsdWRlLWZyb20taW5wdXQnXHJcbn07XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUERPTVV0aWxzJywgUERPTVV0aWxzICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQRE9NVXRpbHM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsbUJBQW1CLFFBQVEsMENBQTBDO0FBQzlFLE9BQU9DLFFBQVEsTUFBTSxpQ0FBaUM7QUFDdEQsT0FBT0MsVUFBVSxNQUFNLG1DQUFtQztBQUMxRCxPQUFPQyxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLG1CQUFtQixNQUFNLGlEQUFpRDtBQUNqRixTQUFTQyxnQkFBZ0IsRUFBRUMsT0FBTyxRQUFRLGtCQUFrQjs7QUFFNUQ7QUFDQSxNQUFNQyxJQUFJLEdBQUcsTUFBTTtBQUNuQixNQUFNQyxRQUFRLEdBQUcsVUFBVTs7QUFFM0I7QUFDQSxNQUFNQyxTQUFTLEdBQUcsT0FBTztBQUN6QixNQUFNQyxTQUFTLEdBQUcsT0FBTztBQUN6QixNQUFNQyxVQUFVLEdBQUcsUUFBUTtBQUMzQixNQUFNQyxZQUFZLEdBQUcsVUFBVTtBQUMvQixNQUFNQyxVQUFVLEdBQUcsUUFBUTtBQUMzQixNQUFNQyxZQUFZLEdBQUcsVUFBVTtBQUMvQixNQUFNQyxZQUFZLEdBQUcsVUFBVTtBQUMvQixNQUFNQyxVQUFVLEdBQUcsUUFBUTtBQUMzQixNQUFNQyxPQUFPLEdBQUcsS0FBSztBQUNyQixNQUFNQyxLQUFLLEdBQUcsR0FBRztBQUNqQixNQUFNQyxRQUFRLEdBQUcsTUFBTTtBQUN2QixNQUFNQyxLQUFLLEdBQUcsR0FBRztBQUNqQixNQUFNQyxVQUFVLEdBQUcsUUFBUTs7QUFFM0I7QUFDQSxNQUFNQyxRQUFRLEdBQUcsR0FBRztBQUNwQixNQUFNQyxVQUFVLEdB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