// Copyright 2015-2024, University of Colorado Boulder

/**
 * An accessible peer controls the appearance of an accessible Node's instance in the parallel DOM. A PDOMPeer can
 * have up to four window.Elements displayed in the PDOM, see ftructor for details.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Jesse Greenberg
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import arrayRemove from '../../../../phet-core/js/arrayRemove.js';
import merge from '../../../../phet-core/js/merge.js';
import platform from '../../../../phet-core/js/platform.js';
import Poolable from '../../../../phet-core/js/Poolable.js';
import stripEmbeddingMarks from '../../../../phet-core/js/stripEmbeddingMarks.js';
import { FocusManager, PDOMInstance, PDOMSiblingStyle, PDOMUtils, scenery } from '../../imports.js';

// constants
const PRIMARY_SIBLING = 'PRIMARY_SIBLING';
const LABEL_SIBLING = 'LABEL_SIBLING';
const DESCRIPTION_SIBLING = 'DESCRIPTION_SIBLING';
const CONTAINER_PARENT = 'CONTAINER_PARENT';
const LABEL_TAG = PDOMUtils.TAGS.LABEL;
const INPUT_TAG = PDOMUtils.TAGS.INPUT;
const DISABLED_ATTRIBUTE_NAME = 'disabled';

// DOM observers that apply new CSS transformations are triggered when children, or inner content change. Updating
// style/positioning of the element will change attributes so we can't observe those changes since it would trigger
// the MutationObserver infinitely.
const OBSERVER_CONFIG = {
  attributes: false,
  childList: true,
  characterData: true
};
let globalId = 1;

// mutables instances to avoid creating many in operations that occur frequently
const scratchGlobalBounds = new Bounds2(0, 0, 0, 0);
const scratchSiblingBounds = new Bounds2(0, 0, 0, 0);
const globalNodeTranslationMatrix = new Matrix3();
const globalToClientScaleMatrix = new Matrix3();
const nodeScaleMagnitudeMatrix = new Matrix3();
class PDOMPeer {
  /**
   * @param {PDOMInstance} pdomInstance
   * @param {Object} [options]
   * @mixes Poolable
   */
  constructor(pdomInstance, options) {
    this.initializePDOMPeer(pdomInstance, options);
  }

  /**
   * Initializes the object (either from a freshly-created state, or from a "disposed" state brought back from a
   * pool).
   *
   * NOTE: the PDOMPeer is not fully constructed until calling PDOMPeer.update() after creating from pool.
   * @private
   *
   * @param {PDOMInstance} pdomInstance
   * @param {Object} [options]
   * @returns {PDOMPeer} - Returns 'this' reference, for chaining
   */
  initializePDOMPeer(pdomInstance, options) {
    options = merge({
      primarySibling: null
    }, options);
    assert && assert(!this.id || this.isDisposed, 'If we previously existed, we need to have been disposed');

    // @public {number} - unique ID
    this.id = this.id || globalId++;

    // @public {PDOMInstance}
    this.pdomInstance = pdomInstance;

    // @public {Node|null} only null for the root pdomInstance
    this.node = this.pdomInstance.node;

    // @public {Display} - Each peer is associated with a specific Display.
    this.display = pdomInstance.display;

    // @public {Trail} - NOTE: May have "gaps" due to pdomOrder usage.
    this.trail = pdomInstance.trail;

    // @private {boolean|null} - whether or not this PDOMPeer is visible in the PDOM
    // Only initialized to null, should not be set to it. isVisible() will return true if this.visible is null
    // (because it hasn't been set yet).
    this.visible = null;

    // @private {boolean|null} - whether or not the primary sibling of this PDOMPeer can receive focus.
    this.focusable = null;

    // @private {HTMLElement|null} - Optional label/description elements
    this._labelSibling = null;
    this._descriptionSibling = null;

    // @private {HTMLElement|null} - A parent element that can contain this primarySibling and other siblings, usually
    // the label and description content.
    this._containerParent = null;

    // @public {HTMLElement[]} Rather than guarantee that a peer is a tree with a root DOMElement,
    // allow multiple window.Elements at the top level of the peer. This is used for sorting the instance.
    // See this.orderElements for more info.
    this.topLevelElements = [];

    // @private {boolean} - flag that indicates that this peer has accessible content that changed, and so
    // the siblings need to be repositioned in the next Display.updateDisplay()
    this.positionDirty = false;

    // @private {boolean} - Flag that indicates that PDOM elements require a forced reflow next animation frame.
    // This is needed to fix a Safari VoiceOver bug where the accessible name is read incorrectly after elements
    // are hidden/displayed. The usual workaround to force a reflow (set the style.display to none, query the offset,
    // set it back) only fixes the problem if the style.display attribute is set in the next animation frame.
    // See https://github.com/phetsims/a11y-research/issues/193.
    this.forceReflowWorkaround = false;

    // @private {boolean} - indicates that this peer's pdomInstance has a descendant that is dirty. Used to
    // quickly find peers with positionDirty when we traverse the tree of PDOMInstances
    this.childPositionDirty = false;

    // @private {boolean} - Indicates that this peer will position sibling elements so that
    // they are in the right location in the viewport, which is a requirement for touch based
    // screen readers. See setPositionInPDOM.
    this.positionInPDOM = false;

    // @private {MutationObserver} - An observer that will call back any time a property of the primary
    // sibling changes. Used to reposition the sibling elements if the bounding box resizes. No need to loop over
    // all of the mutations, any single mutation will require updating CSS positioning.
    //
    // NOTE: Ideally, a single MutationObserver could be used to observe changes to all elements in the PDOM. But
    // MutationObserver makes it impossible to detach observers from a single element. MutationObserver.detach()
    // will remove listeners on all observed elements, so individual observers must be used on each element.
    // One alternative could be to put the MutationObserver on the root element and use "subtree: true" in
    // OBSERVER_CONFIG. This could reduce the number of MutationObservers, but there is no easy way to get the
    // peer from the mutation target element. If MutationObserver takes a lot of memory, this could be an
    // optimization that may come with a performance cost.
    //
    // NOTE: ResizeObserver is a superior alternative to MutationObserver for this purpose because
    // it will only monitor changes we care about and prevent infinite callback loops if size is changed in
    // the callback function (we get around this now by not observing attribute changes). But it is not yet widely
    // supported, see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver.
    //
    // TODO: Should we be watching "model" changes from ParallelDOM.js instead of using MutationObserver? https://github.com/phetsims/scenery/issues/1581
    // See https://github.com/phetsims/scenery/issues/852. This would be less fragile, and also less
    // memory intensive because we don't need an instance of MutationObserver on every PDOMInstance.
    this.mutationObserver = this.mutationObserver || new MutationObserver(this.invalidateCSSPositioning.bind(this, false));

    // @private {function} - must be removed on disposal
    this.transformListener = this.transformListener || this.invalidateCSSPositioning.bind(this, false);
    this.pdomInstance.transformTracker.addListener(this.transformListener);

    // @private {*} - To support setting the Display.interactive=false (which sets disabled on all primarySiblings,
    // we need to set disabled on a separate channel from this.setAttributeToElement. That way we cover the case where
    // `disabled` was set through the ParallelDOM API when we need to toggle it specifically for Display.interactive.
    // This way we can conserve the previous `disabled` attribute/property value through toggling Display.interactive.
    this._preservedDisabledValue = null;

    // @private {boolean} - Whether we are currently in a "disposed" (in the pool) state, or are available to be
    // interacted with.
    this.isDisposed = false;

    // edge case for root accessibility
    if (this.pdomInstance.isRootInstance) {
      // @private {HTMLElement} - The main element associated with this peer. If focusable, this is the element that gets
      // the focus. It also will contain any children.
      this._primarySibling = options.primarySibling;
      this._primarySibling.classList.add(PDOMSiblingStyle.ROOT_CLASS_NAME);

      // Stop blocked events from bubbling past the root of the PDOM so that scenery does
      // not dispatch them in Input.js.
      PDOMUtils.BLOCKED_DOM_EVENTS.forEach(eventType => {
        this._primarySibling.addEventListener(eventType, event => {
          event.stopPropagation();
        });
      });
    }
    return this;
  }

  /**
   * Update the content of the peer. This must be called after the AccessibePeer is constructed from pool.
   * @param {boolean} updateIndicesStringAndElementIds - if this function should be called upon initial "construction" (in update), allows for the option to do this lazily, see https://github.com/phetsims/phet-io/issues/1847
   * @public (scenery-internal)
   */
  update(updateIndicesStringAndElementIds) {
    let options = this.node.getBaseOptions();
    const callbacksForOtherNodes = [];
    if (this.node.accessibleName !== null) {
      options = this.node.accessibleNameBehavior(this.node, options, this.node.accessibleName, callbacksForOtherNodes);
      assert && assert(typeof options === 'object', 'should return an object');
    }
    if (this.node.pdomHeading !== null) {
      options = this.node.pdomHeadingBehavior(this.node, options, this.node.pdomHeading, callbacksForOtherNodes);
      assert && assert(typeof options === 'object', 'should return an object');
    }
    if (this.node.helpText !== null) {
      options = this.node.helpTextBehavior(this.node, options, this.node.helpText, callbacksForOtherNodes);
      assert && assert(typeof options === 'object', 'should return an object');
    }

    // create the base DOM element representing this accessible instance
    // TODO: why not just options.focusable? https://github.com/phetsims/scenery/issues/1581
    this._primarySibling = createElement(options.tagName, this.node.focusable, {
      namespace: options.pdomNamespace
    });

    // create the container parent for the dom siblings
    if (options.containerTagName) {
      this._containerParent = createElement(options.containerTagName, false);
    }

    // create the label DOM element representing this instance
    if (options.labelTagName) {
      this._labelSibling = createElement(options.labelTagName, false, {
        excludeFromInput: this.node.excludeLabelSiblingFromInput
      });
    }

    // create the description DOM element representing this instance
    if (options.descriptionTagName) {
      this._descriptionSibling = createElement(options.descriptionTagName, false);
    }
    updateIndicesStringAndElementIds && this.updateIndicesStringAndElementIds();
    this.orderElements(options);

    // assign listeners (to be removed or disconnected during disposal)
    this.mutationObserver.disconnect(); // in case update() is called more than once on an instance of PDOMPeer
    this.mutationObserver.observe(this._primarySibling, OBSERVER_CONFIG);

    // set the accessible label now that the element has been recreated again, but not if the tagName
    // has been cleared out
    if (options.labelContent && options.labelTagName !== null) {
      this.setLabelSiblingContent(options.labelContent);
    }

    // restore the innerContent
    if (options.innerContent && options.tagName !== null) {
      this.setPrimarySiblingContent(options.innerContent);
    }

    // set the accessible description, but not if the tagName has been cleared out.
    if (options.descriptionContent && options.descriptionTagName !== null) {
      this.setDescriptionSiblingContent(options.descriptionContent);
    }

    // if element is an input element, set input type
    if (options.tagName.toUpperCase() === INPUT_TAG && options.inputType) {
      this.setAttributeToElement('type', options.inputType);
    }

    // if the label element happens to be a 'label', associate with 'for' attribute (must be done after updating IDs)
    if (options.labelTagName && options.labelTagName.toUpperCase() === LABEL_TAG) {
      this.setAttributeToElement('for', this._primarySibling.id, {
        elementName: PDOMPeer.LABEL_SIBLING
      });
    }
    this.setFocusable(this.node.focusable);

    // set the positionInPDOM field to our updated instance
    this.setPositionInPDOM(this.node.positionInPDOM);

    // recompute and assign the association attributes that link two elements (like aria-labelledby)
    this.onAriaLabelledbyAssociationChange();
    this.onAriaDescribedbyAssociationChange();
    this.onActiveDescendantAssociationChange();

    // update all attributes for the peer, should cover aria-label, role, and others
    this.onAttributeChange(options);

    // update all classes for the peer
    this.onClassChange();

    // update input value attribute for the peer
    this.onInputValueChange();
    this.node.updateOtherNodesAriaLabelledby();
    this.node.updateOtherNodesAriaDescribedby();
    this.node.updateOtherNodesActiveDescendant();
    callbacksForOtherNodes.forEach(callback => {
      assert && assert(typeof callback === 'function');
      callback();
    });
  }

  /**
   * Handle the internal ordering of the elements in the peer, this involves setting the proper value of
   * this.topLevelElements
   * @param {Object} config - the computed mixin options to be applied to the peer. (select ParallelDOM mutator keys)
   * @private
   */
  orderElements(config) {
    if (this._containerParent) {
      // The first child of the container parent element should be the peer dom element
      // if undefined, the insertBefore method will insert the this._primarySibling as the first child
      this._containerParent.insertBefore(this._primarySibling, this._containerParent.children[0] || null);
      this.topLevelElements = [this._containerParent];
    } else {
      // Wean out any null siblings
      this.topLevelElements = [this._labelSibling, this._descriptionSibling, this._primarySibling].filter(_.identity);
    }

    // insert the label and description elements in the correct location if they exist
    // NOTE: Important for arrangeContentElement to be called on the label sibling first for correct order
    this._labelSibling && this.arrangeContentElement(this._labelSibling, config.appendLabel);
    this._descriptionSibling && this.arrangeContentElement(this._descriptionSibling, config.appendDescription);
  }

  /**
   * Get the primary sibling element for the peer
   * @public
   * @returns {HTMLElement|null}
   */
  getPrimarySibling() {
    return this._primarySibling;
  }
  get primarySibling() {
    return this.getPrimarySibling();
  }

  /**
   * Get the primary sibling element for the peer
   * @public
   * @returns {HTMLElement|null}
   */
  getLabelSibling() {
    return this._labelSibling;
  }
  get labelSibling() {
    return this.getLabelSibling();
  }

  /**
   * Get the primary sibling element for the peer
   * @public
   * @returns {HTMLElement|null}
   */
  getDescriptionSibling() {
    return this._descriptionSibling;
  }
  get descriptionSibling() {
    return this.getDescriptionSibling();
  }

  /**
   * Get the primary sibling element for the peer
   * @public
   * @returns {HTMLElement|null}
   */
  getContainerParent() {
    return this._containerParent;
  }
  get containerParent() {
    return this.getContainerParent();
  }

  /**
   * Returns the top-level element that contains the primary sibling. If there is no container parent, then the primary
   * sibling is returned.
   * @public
   *
   * @returns {HTMLElement|null}
   */
  getTopLevelElementContainingPrimarySibling() {
    return this._containerParent || this._primarySibling;
  }

  /**
   * Recompute the aria-labelledby attributes for all of the peer's elements
   * @public
   */
  onAriaLabelledbyAssociationChange() {
    this.removeAttributeFromAllElements('aria-labelledby');
    for (let i = 0; i < this.node.ariaLabelledbyAssociations.length; i++) {
      const associationObject = this.node.ariaLabelledbyAssociations[i];

      // Assert out if the model list is different than the data held in the associationObject
      assert && assert(associationObject.otherNode.nodesThatAreAriaLabelledbyThisNode.indexOf(this.node) >= 0, 'unexpected otherNode');
      this.setAssociationAttribute('aria-labelledby', associationObject);
    }
  }

  /**
   * Recompute the aria-describedby attributes for all of the peer's elements
   * @public
   */
  onAriaDescribedbyAssociationChange() {
    this.removeAttributeFromAllElements('aria-describedby');
    for (let i = 0; i < this.node.ariaDescribedbyAssociations.length; i++) {
      const associationObject = this.node.ariaDescribedbyAssociations[i];

      // Assert out if the model list is different than the data held in the associationObject
      assert && assert(associationObject.otherNode.nodesThatAreAriaDescribedbyThisNode.indexOf(this.node) >= 0, 'unexpected otherNode');
      this.setAssociationAttribute('aria-describedby', associationObject);
    }
  }

  /**
   * Recompute the aria-activedescendant attributes for all of the peer's elements
   * @public
   */
  onActiveDescendantAssociationChange() {
    this.removeAttributeFromAllElements('aria-activedescendant');
    for (let i = 0; i < this.node.activeDescendantAssociations.length; i++) {
      const associationObject = this.node.activeDescendantAssociations[i];

      // Assert out if the model list is different than the data held in the associationObject
      assert && assert(associationObject.otherNode.nodesThatAreActiveDescendantToThisNode.indexOf(this.node) >= 0, 'unexpected otherNode');
      this.setAssociationAttribute('aria-activedescendant', associationObject);
    }
  }

  /**
   * Set the new attribute to the element if the value is a string. It will otherwise be null or undefined and should
   * then be removed from the element. This allows empty strings to be set as values.
   *
   * @param {string} key
   * @param {string|null|undefined} value
   * @private
   */
  handleAttributeWithPDOMOption(key, value) {
    if (typeof value === 'string') {
      this.setAttributeToElement(key, value);
    } else {
      this.removeAttributeFromElement(key);
    }
  }

  /**
   * Set all pdom attributes onto the peer elements from the model's stored data objects
   * @private
   *
   * @param {Object} [pdomOptions] - these can override the values of the node, see this.update()
   */
  onAttributeChange(pdomOptions) {
    for (let i = 0; i < this.node.pdomAttributes.length; i++) {
      const dataObject = this.node.pdomAttributes[i];
      this.setAttributeToElement(dataObject.attribute, dataObject.value, dataObject.options);
    }

    // Manually support options that map to attributes. This covers that case where behavior functions want to change
    // these, but they aren't in node.pdomAttributes. It will do double work in some cases, but it is pretty minor for
    // the complexity it saves. https://github.com/phetsims/scenery/issues/1436. Empty strings should be settable for
    // these attributes but null and undefined are ignored.
    this.handleAttributeWithPDOMOption('aria-label', pdomOptions.ariaLabel);
    this.handleAttributeWithPDOMOption('role', pdomOptions.ariaRole);
  }

  /**
   * Set all classes onto the peer elements from the model's stored data objects
   * @private
   */
  onClassChange() {
    for (let i = 0; i < this.node.pdomClasses.length; i++) {
      const dataObject = this.node.pdomClasses[i];
      this.setClassToElement(dataObject.className, dataObject.options);
    }
  }

  /**
   * Set the input value on the peer's primary sibling element. The value attribute must be set as a Property to be
   * registered correctly by an assistive device. If null, the attribute is removed so that we don't clutter the DOM
   * with value="null" attributes.
   *
   * @public (scenery-internal)
   */
  onInputValueChange() {
    assert && assert(this.node.inputValue !== undefined, 'use null to remove input value attribute');
    if (this.node.inputValue === null) {
      this.removeAttributeFromElement('value');
    } else {
      // type conversion for DOM spec
      const valueString = `${this.node.inputValue}`;
      this.setAttributeToElement('value', valueString, {
        asProperty: true
      });
    }
  }

  /**
   * Get an element on this node, looked up by the elementName flag passed in.
   * @public (scenery-internal)
   *
   * @param {string} elementName - see PDOMUtils for valid associations
   * @returns {HTMLElement}
   */
  getElementByName(elementName) {
    if (elementName === PDOMPeer.PRIMARY_SIBLING) {
      return this._primarySibling;
    } else if (elementName === PDOMPeer.LABEL_SIBLING) {
      return this._labelSibling;
    } else if (elementName === PDOMPeer.DESCRIPTION_SIBLING) {
      return this._descriptionSibling;
    } else if (elementName === PDOMPeer.CONTAINER_PARENT) {
      return this._containerParent;
    }
    throw new Error(`invalid elementName name: ${elementName}`);
  }

  /**
   * Sets a attribute on one of the peer's window.Elements.
   * @public (scenery-internal)
   * @param {string} attribute
   * @param {*} attributeValue
   * @param {Object} [options]
   */
  setAttributeToElement(attribute, attributeValue, options) {
    options = merge({
      // {string|null} - If non-null, will set the attribute with the specified namespace. This can be required
      // for setting certain attributes (e.g. MathML).
      namespace: null,
      // set as a javascript property instead of an attribute on the DOM Element.
      asProperty: false,
      elementName: PRIMARY_SIBLING,
      // see this.getElementName() for valid values, default to the primary sibling

      // {HTMLElement|null} - element that will directly receive the input rather than looking up by name, if
      // provided, elementName option will have no effect
      element: null
    }, options);
    const element = options.element || this.getElementByName(options.elementName);

    // For dynamic strings, we may need to retrieve the actual value.
    const rawAttributeValue = PDOMUtils.unwrapProperty(attributeValue);

    // remove directional formatting that may surround strings if they are translatable
    let attributeValueWithoutMarks = rawAttributeValue;
    if (typeof rawAttributeValue === 'string') {
      attributeValueWithoutMarks = stripEmbeddingMarks(rawAttributeValue);
    }
    if (attribute === DISABLED_ATTRIBUTE_NAME && !this.display.interactive) {
      // The presence of the `disabled` attribute means it is always disabled.
      this._preservedDisabledValue = options.asProperty ? attributeValueWithoutMarks : true;
    }
    if (options.namespace) {
      element.setAttributeNS(options.namespace, attribute, attributeValueWithoutMarks);
    } else if (options.asProperty) {
      element[attribute] = attributeValueWithoutMarks;
    } else {
      element.setAttribute(attribute, attributeValueWithoutMarks);
    }
  }

  /**
   * Remove attribute from one of the peer's window.Elements.
   * @public (scenery-internal)
   * @param {string} attribute
   * @param {Object} [options]
   */
  removeAttributeFromElement(attribute, options) {
    options = merge({
      // {string|null} - If non-null, will set the attribute with the specified namespace. This can be required
      // for setting certain attributes (e.g. MathML).
      namespace: null,
      elementName: PRIMARY_SIBLING,
      // see this.getElementName() for valid values, default to the primary sibling

      // {HTMLElement|null} - element that will directly receive the input rather than looking up by name, if
      // provided, elementName option will have no effect
      element: null
    }, options);
    const element = options.element || this.getElementByName(options.elementName);
    if (options.namespace) {
      element.removeAttributeNS(options.namespace, attribute);
    } else if (attribute === DISABLED_ATTRIBUTE_NAME && !this.display.interactive) {
      // maintain our interal disabled state in case the display toggles back to be interactive.
      this._preservedDisabledValue = false;
    } else {
      element.removeAttribute(attribute);
    }
  }

  /**
   * Remove the given attribute from all peer elements
   * @public (scenery-internal)
   * @param {string} attribute
   */
  removeAttributeFromAllElements(attribute) {
    assert && assert(attribute !== DISABLED_ATTRIBUTE_NAME, 'this method does not currently support disabled, to make Display.interactive toggling easier to implement');
    assert && assert(typeof attribute === 'string');
    this._primarySibling && this._primarySibling.removeAttribute(attribute);
    this._labelSibling && this._labelSibling.removeAttribute(attribute);
    this._descriptionSibling && this._descriptionSibling.removeAttribute(attribute);
    this._containerParent && this._containerParent.removeAttribute(attribute);
  }

  /**
   * Add the provided className to the element's classList.
   *
   * @public
   * @param {string} className
   * @param {Object} [options]
   */
  setClassToElement(className, options) {
    assert && assert(typeof className === 'string');
    options = merge({
      // Name of the element who we are adding the class to, see this.getElementName() for valid values
      elementName: PRIMARY_SIBLING
    }, options);
    this.getElementByName(options.elementName).classList.add(className);
  }

  /**
   * Remove the specified className from the element.
   * @public
   *
   * @param {string} className
   * @param {Object} [options]
   */
  removeClassFromElement(className, options) {
    assert && assert(typeof className === 'string');
    options = merge({
      // Name of the element who we are removing the class from, see this.getElementName() for valid values
      elementName: PRIMARY_SIBLING
    }, options);
    this.getElementByName(options.elementName).classList.remove(className);
  }

  /**
   * Set either association attribute (aria-labelledby/describedby) on one of this peer's Elements
   * @public (scenery-internal)
   * @param {string} attribute - either aria-labelledby or aria-describedby
   * @param {Object} associationObject - see addAriaLabelledbyAssociation() for schema
   */
  setAssociationAttribute(attribute, associationObject) {
    assert && assert(PDOMUtils.ASSOCIATION_ATTRIBUTES.indexOf(attribute) >= 0, `unsupported attribute for setting with association object: ${attribute}`);
    const otherNodePDOMInstances = associationObject.otherNode.getPDOMInstances();

    // If the other node hasn't been added to the scene graph yet, it won't have any accessible instances, so no op.
    // This will be recalculated when that node is added to the scene graph
    if (otherNodePDOMInstances.length > 0) {
      // We are just using the first PDOMInstance for simplicity, but it is OK because the accessible
      // content for all PDOMInstances will be the same, so the Accessible Names (in the browser's
      // accessibility tree) of elements that are referenced by the attribute value id will all have the same content
      const firstPDOMInstance = otherNodePDOMInstances[0];

      // Handle a case where you are associating to yourself, and the peer has not been constructed yet.
      if (firstPDOMInstance === this.pdomInstance) {
        firstPDOMInstance.peer = this;
      }
      assert && assert(firstPDOMInstance.peer, 'peer should exist');

      // we can use the same element's id to update all of this Node's peers
      const otherPeerElement = firstPDOMInstance.peer.getElementByName(associationObject.otherElementName);
      const element = this.getElementByName(associationObject.thisElementName);

      // to support any option order, no-op if the peer element has not been created yet.
      if (element && otherPeerElement) {
        // only update associations if the requested peer element has been created
        // NOTE: in the future, we would like to verify that the association exists but can't do that yet because
        // we have to support cases where we set label association prior to setting the sibling/parent tagName
        const previousAttributeValue = element.getAttribute(attribute) || '';
        assert && assert(typeof previousAttributeValue === 'string');
        const newAttributeValue = [previousAttributeValue.trim(), otherPeerElement.id].join(' ').trim();

        // add the id from the new association to the value of the HTMLElement's attribute.
        this.setAttributeToElement(attribute, newAttributeValue, {
          elementName: associationObject.thisElementName
        });
      }
    }
  }

  /**
   * The contentElement will either be a label or description element. The contentElement will be sorted relative to
   * the primarySibling. Its placement will also depend on whether or not this node wants to append this element,
   * see setAppendLabel() and setAppendDescription(). By default, the "content" element will be placed before the
   * primarySibling.
   *
   * NOTE: This function assumes it is called on label sibling before description sibling for inserting elements
   * into the correct order.
   *
   * @private
   *
   * @param {HTMLElement} contentElement
   * @param {boolean} appendElement
   */
  arrangeContentElement(contentElement, appendElement) {
    // if there is a containerParent
    if (this.topLevelElements[0] === this._containerParent) {
      assert && assert(this.topLevelElements.length === 1);
      if (appendElement) {
        this._containerParent.appendChild(contentElement);
      } else {
        this._containerParent.insertBefore(contentElement, this._primarySibling);
      }
    }

    // If there are multiple top level nodes
    else {
      // keep this.topLevelElements in sync
      arrayRemove(this.topLevelElements, contentElement);
      const indexOfPrimarySibling = this.topLevelElements.indexOf(this._primarySibling);

      // if appending, just insert at at end of the top level elements
      const insertIndex = appendElement ? this.topLevelElements.length : indexOfPrimarySibling;
      this.topLevelElements.splice(insertIndex, 0, contentElement);
    }
  }

  /**
   * Is this peer hidden in the PDOM
   * @public
   *
   * @returns {boolean}
   */
  isVisible() {
    if (assert) {
      let visibleElements = 0;
      this.topLevelElements.forEach(element => {
        // support property or attribute
        if (!element.hidden && !element.hasAttribute('hidden')) {
          visibleElements += 1;
        }
      });
      assert(this.visible ? visibleElements === this.topLevelElements.length : visibleElements === 0, 'some of the peer\'s elements are visible and some are not');
    }
    return this.visible === null ? true : this.visible; // default to true if visibility hasn't been set yet.
  }

  /**
   * Set whether or not the peer is visible in the PDOM
   * @public
   *
   * @param {boolean} visible
   */
  setVisible(visible) {
    assert && assert(typeof visible === 'boolean');
    if (this.visible !== visible) {
      this.visible = visible;
      for (let i = 0; i < this.topLevelElements.length; i++) {
        const element = this.topLevelElements[i];
        if (visible) {
          this.removeAttributeFromElement('hidden', {
            element: element
          });
        } else {
          this.setAttributeToElement('hidden', '', {
            element: element
          });
        }
      }

      // Invalidate CSS transforms because when 'hidden' the content will have no dimensions in the viewport. For
      // a Safari VoiceOver bug, also force a reflow in the next animation frame to ensure that the accessible name is
      // correct.
      // TODO: Remove this when the bug is fixed. See https://github.com/phetsims/a11y-research/issues/193
      this.invalidateCSSPositioning(platform.safari);
    }
  }

  /**
   * Returns if this peer is focused. A peer is focused if its primarySibling is focused.
   * @public (scenery-internal)
   * @returns {boolean}
   */
  isFocused() {
    const visualFocusTrail = PDOMInstance.guessVisualTrail(this.trail, this.display.rootNode);
    return FocusManager.pdomFocusProperty.value && FocusManager.pdomFocusProperty.value.trail.equals(visualFocusTrail);
  }

  /**
   * Focus the primary sibling of the peer.
   * @public (scenery-internal)
   */
  focus() {
    assert && assert(this._primarySibling, 'must have a primary sibling to focus');

    // We do not support manually calling focus on an invisible HTML element, see https://github.com/phetsims/scenery/issues/1290
    // TODO: support this in https://github.com/phetsims/scenery/issues/1290
    // assert && assert( this.isVisible(), 'cannot focus() an invisible element' );

    // We do not want to steal focus from any parent application. For example, if this element is in an iframe.
    // See https://github.com/phetsims/joist/issues/897.
    if (FocusManager.windowHasFocusProperty.value) {
      this._primarySibling.focus();
    }
  }

  /**
   * Blur the primary sibling of the peer.
   * @public (scenery-internal)
   */
  blur() {
    assert && assert(this._primarySibling, 'must have a primary sibling to blur');

    // no op by the browser if primary sibling does not have focus
    this._primarySibling.blur();
  }

  /**
   * Make the peer focusable. Only the primary sibling is ever considered focusable.
   * @public
   * @param {boolean} focusable
   */
  setFocusable(focusable) {
    assert && assert(typeof focusable === 'boolean');
    const peerHadFocus = this.isFocused();
    if (this.focusable !== focusable) {
      this.focusable = focusable;
      PDOMUtils.overrideFocusWithTabIndex(this.primarySibling, focusable);

      // in Chrome, if tabindex is removed and the element is not focusable by default the element is blurred.
      // This behavior is reasonable and we want to enforce it in other browsers for consistency. See
      // https://github.com/phetsims/scenery/issues/967
      if (peerHadFocus && !focusable) {
        this.blur();
      }

      // reposition the sibling in the DOM, since non-focusable nodes are not positioned
      this.invalidateCSSPositioning();
    }
  }

  /**
   * Responsible for setting the content for the label sibling
   * @public (scenery-internal)
   * @param {string|null} content - the content for the label sibling.
   */
  setLabelSiblingContent(content) {
    assert && assert(content === null || typeof content === 'string', 'incorrect label content type');

    // no-op to support any option order
    if (!this._labelSibling) {
      return;
    }
    PDOMUtils.setTextContent(this._labelSibling, content);
  }

  /**
   * Responsible for setting the content for the description sibling
   * @public (scenery-internal)
   * @param {string|null} content - the content for the description sibling.
   */
  setDescriptionSiblingContent(content) {
    assert && assert(content === null || typeof content === 'string', 'incorrect description content type');

    // no-op to support any option order
    if (!this._descriptionSibling) {
      return;
    }
    PDOMUtils.setTextContent(this._descriptionSibling, content);
  }

  /**
   * Responsible for setting the content for the primary sibling
   * @public (scenery-internal)
   * @param {string|null} content - the content for the primary sibling.
   */
  setPrimarySiblingContent(content) {
    assert && assert(content === null || typeof content === 'string', 'incorrect inner content type');
    assert && assert(this.pdomInstance.children.length === 0, 'descendants exist with accessible content, innerContent cannot be used');
    assert && assert(PDOMUtils.tagNameSupportsContent(this._primarySibling.tagName), `tagName: ${this.node.tagName} does not support inner content`);

    // no-op to support any option order
    if (!this._primarySibling) {
      return;
    }
    PDOMUtils.setTextContent(this._primarySibling, content);
  }

  /**
   * Sets the pdomTransformSourceNode so that the primary sibling will be transformed with changes to along the
   * unique trail to the source node. If null, repositioning happens with transform changes along this
   * pdomInstance's trail.
   * @public
   *
   * @param {../nodes/Node|null} node
   */
  setPDOMTransformSourceNode(node) {
    // remove previous listeners before creating a new TransformTracker
    this.pdomInstance.transformTracker.removeListener(this.transformListener);
    this.pdomInstance.updateTransformTracker(node);

    // add listeners back after update
    this.pdomInstance.transformTracker.addListener(this.transformListener);

    // new trail with transforms so positioning is probably dirty
    this.invalidateCSSPositioning();
  }

  /**
   * Enable or disable positioning of the sibling elements. Generally this is requiredfor accessibility to work on
   * touch screen based screen readers like phones. But repositioning DOM elements is expensive. This can be set to
   * false to optimize when positioning is not necessary.
   * @public (scenery-internal)
   *
   * @param {boolean} positionInPDOM
   */
  setPositionInPDOM(positionInPDOM) {
    this.positionInPDOM = positionInPDOM;

    // signify that it needs to be repositioned next frame, either off screen or to match
    // graphical rendering
    this.invalidateCSSPositioning();
  }

  // @private
  getElementId(siblingName, stringId) {
    return `display${this.display.id}-${siblingName}-${stringId}`;
  }

  // @public
  updateIndicesStringAndElementIds() {
    const indices = this.pdomInstance.getPDOMInstanceUniqueId();
    if (this._primarySibling) {
      // NOTE: dataset isn't supported by all namespaces (like MathML) so we need to use setAttribute
      this._primarySibling.setAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID, indices);
      this._primarySibling.id = this.getElementId('primary', indices);
    }
    if (this._labelSibling) {
      // NOTE: dataset isn't supported by all namespaces (like MathML) so we need to use setAttribute
      this._labelSibling.setAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID, indices);
      this._labelSibling.id = this.getElementId('label', indices);
    }
    if (this._descriptionSibling) {
      // NOTE: dataset isn't supported by all namespaces (like MathML) so we need to use setAttribute
      this._descriptionSibling.setAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID, indices);
      this._descriptionSibling.id = this.getElementId('description', indices);
    }
    if (this._containerParent) {
      // NOTE: dataset isn't supported by all namespaces (like MathML) so we need to use setAttribute
      this._containerParent.setAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID, indices);
      this._containerParent.id = this.getElementId('container', indices);
    }
  }

  /**
   * Mark that the siblings of this PDOMPeer need to be updated in the next Display update. Possibly from a
   * change of accessible content or node transformation. Does nothing if already marked dirty.
   *
   * @param [forceReflowWorkaround] - In addition to repositioning, force a reflow next animation frame? See
   *                                  this.forceReflowWorkaround for more information.
   * @private
   */
  invalidateCSSPositioning(forceReflowWorkaround = false) {
    if (!this.positionDirty) {
      this.positionDirty = true;
      if (forceReflowWorkaround) {
        this.forceReflowWorkaround = true;

        // `transform=scale(1)` forces a reflow so we can set this and revert it in the next animation frame.
        // Transform is used instead of `display='none'` because changing display impacts focus.
        for (let i = 0; i < this.topLevelElements.length; i++) {
          this.topLevelElements[i].style.transform = 'scale(1)';
        }
      }

      // mark all ancestors of this peer so that we can quickly find this dirty peer when we traverse
      // the PDOMInstance tree
      let parent = this.pdomInstance.parent;
      while (parent) {
        parent.peer.childPositionDirty = true;
        parent = parent.parent;
      }
    }
  }

  /**
   * Update the CSS positioning of the primary and label siblings. Required to support accessibility on mobile
   * devices. On activation of focusable elements, certain AT will send fake pointer events to the browser at
   * the center of the client bounding rectangle of the HTML element. By positioning elements over graphical display
   * objects we can capture those events. A transformation matrix is calculated that will transform the position
   * and dimension of the HTML element in pixels to the global coordinate frame. The matrix is used to transform
   * the bounds of the element prior to any other transformation so we can set the element's left, top, width, and
   * height with CSS attributes.
   *
   * For now we are only transforming the primary and label siblings if the primary sibling is focusable. If
   * focusable, the primary sibling needs to be transformed to receive user input. VoiceOver includes the label bounds
   * in its calculation for where to send the events, so it needs to be transformed as well. Descriptions are not
   * considered and do not need to be positioned.
   *
   * Initially, we tried to set the CSS transformations on elements directly through the transform attribute. While
   * this worked for basic input, it did not support other AT features like tapping the screen to focus elements.
   * With this strategy, the VoiceOver "touch area" was a small box around the top left corner of the element. It was
   * never clear why this was this case, but forced us to change our strategy to set the left, top, width, and height
   * attributes instead.
   *
   * This function assumes that elements have other style attributes so they can be positioned correctly and don't
   * interfere with scenery input, see SceneryStyle in PDOMUtils.
   *
   * Additional notes were taken in https://github.com/phetsims/scenery/issues/852, see that issue for more
   * information.
   *
   * Review: This function could be simplified by setting the element width/height a small arbitrary shape
   * at the center of the node's global bounds. There is a drawback in that the VO default highlight won't
   * surround the Node anymore. But it could be a performance enhancement and simplify this function.
   * Or maybe a big rectangle larger than the Display div still centered on the node so we never
   * see the VO highlight?
   *
   * @private
   */
  positionElements(positionInPDOM) {
    assert && assert(this._primarySibling, 'a primary sibling required to receive CSS positioning');
    assert && assert(this.positionDirty, 'elements should only be repositioned if dirty');

    // CSS transformation only needs to be applied if the node is focusable - otherwise the element will be found
    // by gesture navigation with the virtual cursor. Bounds for non-focusable elements in the ViewPort don't
    // need to be accurate because the AT doesn't need to send events to them.
    if (positionInPDOM) {
      const transformSourceNode = this.node.pdomTransformSourceNode || this.node;
      scratchGlobalBounds.set(transformSourceNode.localBounds);
      if (scratchGlobalBounds.isFinite()) {
        scratchGlobalBounds.transform(this.pdomInstance.transformTracker.getMatrix());

        // no need to position if the node is fully outside of the Display bounds (out of view)
        const displayBounds = this.display.bounds;
        if (displayBounds.intersectsBounds(scratchGlobalBounds)) {
          // Constrain the global bounds to Display bounds so that center of the sibling element
          // is always in the Display. We may miss input if the center of the Node is outside
          // the Display, where VoiceOver would otherwise send pointer events.
          scratchGlobalBounds.constrainBounds(displayBounds);
          let clientDimensions = getClientDimensions(this._primarySibling);
          let clientWidth = clientDimensions.width;
          let clientHeight = clientDimensions.height;
          if (clientWidth > 0 && clientHeight > 0) {
            scratchSiblingBounds.setMinMax(0, 0, clientWidth, clientHeight);
            scratchSiblingBounds.transform(getCSSMatrix(clientWidth, clientHeight, scratchGlobalBounds));
            setClientBounds(this._primarySibling, scratchSiblingBounds);
          }
          if (this.labelSibling) {
            clientDimensions = getClientDimensions(this._labelSibling);
            clientWidth = clientDimensions.width;
            clientHeight = clientDimensions.height;
            if (clientHeight > 0 && clientWidth > 0) {
              scratchSiblingBounds.setMinMax(0, 0, clientWidth, clientHeight);
              scratchSiblingBounds.transform(getCSSMatrix(clientWidth, clientHeight, scratchGlobalBounds));
              setClientBounds(this._labelSibling, scratchSiblingBounds);
            }
          }
        }
      }
    } else {
      // not positioning, just move off screen
      scratchSiblingBounds.set(PDOMPeer.OFFSCREEN_SIBLING_BOUNDS);
      setClientBounds(this._primarySibling, scratchSiblingBounds);
      if (this._labelSibling) {
        setClientBounds(this._labelSibling, scratchSiblingBounds);
      }
    }
    if (this.forceReflowWorkaround) {
      // Force a reflow (recalculation of DOM layout) to fix the accessible name.
      this.topLevelElements.forEach(element => {
        element.style.transform = ''; // force reflow request by removing the transform added in the previous frame
        element.style.offsetHeight; // query the offsetHeight after restoring display to force reflow
      });
    }
    this.positionDirty = false;
    this.forceReflowWorkaround = false;
  }

  /**
   * Update positioning of elements in the PDOM. Does a depth first search for all descendants of parentIntsance with
   * a peer that either has dirty positioning or as a descendant with dirty positioning.
   *
   * @public (scenery-internal)
   */
  updateSubtreePositioning(parentPositionInPDOM = false) {
    this.childPositionDirty = false;
    const positionInPDOM = this.positionInPDOM || parentPositionInPDOM;
    if (this.positionDirty) {
      this.positionElements(positionInPDOM);
    }
    for (let i = 0; i < this.pdomInstance.children.length; i++) {
      const childPeer = this.pdomInstance.children[i].peer;
      if (childPeer.positionDirty || childPeer.childPositionDirty) {
        this.pdomInstance.children[i].peer.updateSubtreePositioning(positionInPDOM);
      }
    }
  }

  /**
   * Recursively set this PDOMPeer and children to be disabled. This will overwrite any previous value of disabled
   * that may have been set, but will keep track of the old value, and restore its state upon re-enabling.
   * @param {boolean} disabled
   * @public
   */
  recursiveDisable(disabled) {
    if (disabled) {
      this._preservedDisabledValue = this._primarySibling.disabled;
      this._primarySibling.disabled = true;
    } else {
      this._primarySibling.disabled = this._preservedDisabledValue;
    }
    for (let i = 0; i < this.pdomInstance.children.length; i++) {
      this.pdomInstance.children[i].peer.recursiveDisable(disabled);
    }
  }

  /**
   * Removes external references from this peer, and places it in the pool.
   * @public (scenery-internal)
   */
  dispose() {
    this.isDisposed = true;

    // remove focus if the disposed peer is the active element
    this.blur();

    // remove listeners
    this._primarySibling.removeEventListener('blur', this.blurEventListener);
    this._primarySibling.removeEventListener('focus', this.focusEventListener);
    this.pdomInstance.transformTracker.removeListener(this.transformListener);
    this.mutationObserver.disconnect();

    // zero-out references
    this.pdomInstance = null;
    this.node = null;
    this.display = null;
    this.trail = null;
    this._primarySibling = null;
    this._labelSibling = null;
    this._descriptionSibling = null;
    this._containerParent = null;
    this.focusable = null;

    // for now
    this.freeToPool();
  }
}

// @public {string} - specifies valid associations between related PDOMPeers in the DOM
PDOMPeer.PRIMARY_SIBLING = PRIMARY_SIBLING; // associate with all accessible content related to this peer
PDOMPeer.LABEL_SIBLING = LABEL_SIBLING; // associate with just the label content of this peer
PDOMPeer.DESCRIPTION_SIBLING = DESCRIPTION_SIBLING; // associate with just the description content of this peer
PDOMPeer.CONTAINER_PARENT = CONTAINER_PARENT; // associate with everything under the container parent of this peer

// @public (scenery-internal) - bounds for a sibling that should be moved off-screen when not positioning, in
// global coordinates
PDOMPeer.OFFSCREEN_SIBLING_BOUNDS = new Bounds2(0, 0, 1, 1);
scenery.register('PDOMPeer', PDOMPeer);

// Set up pooling
Poolable.mixInto(PDOMPeer, {
  initialize: PDOMPeer.prototype.initializePDOMPeer
});

//--------------------------------------------------------------------------
// Helper functions
//--------------------------------------------------------------------------

/**
 * Create a sibling element for the PDOMPeer.
 * TODO: this should be inlined with the PDOMUtils method https://github.com/phetsims/scenery/issues/1581
 * @param {string} tagName
 * @param {boolean} focusable
 * @param {Object} [options] - passed along to PDOMUtils.createElement
 * @returns {HTMLElement}
 */
function createElement(tagName, focusable, options) {
  options = merge({
    // {string|null} - addition to the trailId, separated by a hyphen to identify the different siblings within
    // the document
    siblingName: null,
    // {boolean} - if true, DOM input events received on the element will not be dispatched as SceneryEvents in Input.js
    // see ParallelDOM.setExcludeLabelSiblingFromInput for more information
    excludeFromInput: false
  }, options);
  const newElement = PDOMUtils.createElement(tagName, focusable, options);
  if (options.excludeFromInput) {
    newElement.setAttribute(PDOMUtils.DATA_EXCLUDE_FROM_INPUT, true);
  }
  return newElement;
}

/**
 * Get a matrix that can be used as the CSS transform for elements in the DOM. This matrix will an HTML element
 * dimensions in pixels to the global coordinate frame.
 *
 * @param  {number} clientWidth - width of the element to transform in pixels
 * @param  {number} clientHeight - height of the element to transform in pixels
 * @param  {Bounds2} nodeGlobalBounds - Bounds of the PDOMPeer's node in the global coordinate frame.
 * @returns {Matrix3}
 */
function getCSSMatrix(clientWidth, clientHeight, nodeGlobalBounds) {
  // the translation matrix for the node's bounds in its local coordinate frame
  globalNodeTranslationMatrix.setToTranslation(nodeGlobalBounds.minX, nodeGlobalBounds.minY);

  // scale matrix for "client" HTML element, scale to make the HTML element's DOM bounds match the
  // local bounds of the node
  globalToClientScaleMatrix.setToScale(nodeGlobalBounds.width / clientWidth, nodeGlobalBounds.height / clientHeight);

  // combine these in a single transformation matrix
  return globalNodeTranslationMatrix.multiplyMatrix(globalToClientScaleMatrix).multiplyMatrix(nodeScaleMagnitudeMatrix);
}

/**
 * Gets an object with the width and height of an HTML element in pixels, prior to any scaling. clientWidth and
 * clientHeight are zero for elements with inline layout and elements without CSS. For those elements we fall back
 * to the boundingClientRect, which at that point will describe the dimensions of the element prior to scaling.
 *
 * @param  {HTMLElement} siblingElement
 * @returns {Object} - Returns an object with two entries, { width: {number}, height: {number} }
 */
function getClientDimensions(siblingElement) {
  let clientWidth = siblingElement.clientWidth;
  let clientHeight = siblingElement.clientHeight;
  if (clientWidth === 0 && clientHeight === 0) {
    const clientRect = siblingElement.getBoundingClientRect();
    clientWidth = clientRect.width;
    clientHeight = clientRect.height;
  }
  return {
    width: clientWidth,
    height: clientHeight
  };
}

/**
 * Set the bounds of the sibling element in the view port in pixels, using top, left, width, and height css.
 * The element must be styled with 'position: fixed', and an ancestor must have position: 'relative', so that
 * the dimensions of the sibling are relative to the parent.
 *
 * @param {HTMLElement} siblingElement - the element to position
 * @param {Bounds2} bounds - desired bounds, in pixels
 */
function setClientBounds(siblingElement, bounds) {
  siblingElement.style.top = `${bounds.top}px`;
  siblingElement.style.left = `${bounds.left}px`;
  siblingElement.style.width = `${bounds.width}px`;
  siblingElement.style.height = `${bounds.height}px`;
}
export default PDOMPeer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsImFycmF5UmVtb3ZlIiwibWVyZ2UiLCJwbGF0Zm9ybSIsIlBvb2xhYmxlIiwic3RyaXBFbWJlZGRpbmdNYXJrcyIsIkZvY3VzTWFuYWdlciIsIlBET01JbnN0YW5jZSIsIlBET01TaWJsaW5nU3R5bGUiLCJQRE9NVXRpbHMiLCJzY2VuZXJ5IiwiUFJJTUFSWV9TSUJMSU5HIiwiTEFCRUxfU0lCTElORyIsIkRFU0NSSVBUSU9OX1NJQkxJTkciLCJDT05UQUlORVJfUEFSRU5UIiwiTEFCRUxfVEFHIiwiVEFHUyIsIkxBQkVMIiwiSU5QVVRfVEFHIiwiSU5QVVQiLCJESVNBQkxFRF9BVFRSSUJVVEVfTkFNRSIsIk9CU0VSVkVSX0NPTkZJRyIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJjaGFyYWN0ZXJEYXRhIiwiZ2xvYmFsSWQiLCJzY3JhdGNoR2xvYmFsQm91bmRzIiwic2NyYXRjaFNpYmxpbmdCb3VuZHMiLCJnbG9iYWxOb2RlVHJhbnNsYXRpb25NYXRyaXgiLCJnbG9iYWxUb0NsaWVudFNjYWxlTWF0cml4Iiwibm9kZVNjYWxlTWFnbml0dWRlTWF0cml4IiwiUERPTVBlZXIiLCJjb25zdHJ1Y3RvciIsInBkb21JbnN0YW5jZSIsIm9wdGlvbnMiLCJpbml0aWFsaXplUERPTVBlZXIiLCJwcmltYXJ5U2libGluZyIsImFzc2VydCIsImlkIiwiaXNEaXNwb3NlZCIsIm5vZGUiLCJkaXNwbGF5IiwidHJhaWwiLCJ2aXNpYmxlIiwiZm9jdXNhYmxlIiwiX2xhYmVsU2libGluZyIsIl9kZXNjcmlwdGlvblNpYmxpbmciLCJfY29udGFpbmVyUGFyZW50IiwidG9wTGV2ZWxFbGVtZW50cyIsInBvc2l0aW9uRGlydHkiLCJmb3JjZVJlZmxvd1dvcmthcm91bmQiLCJjaGlsZFBvc2l0aW9uRGlydHkiLCJwb3NpdGlvbkluUERPTSIsIm11dGF0aW9uT2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiaW52YWxpZGF0ZUNTU1Bvc2l0aW9uaW5nIiwiYmluZCIsInRyYW5zZm9ybUxpc3RlbmVyIiwidHJhbnNmb3JtVHJhY2tlciIsImFkZExpc3RlbmVyIiwiX3ByZXNlcnZlZERpc2FibGVkVmFsdWUiLCJpc1Jvb3RJbnN0YW5jZSIsIl9wcmltYXJ5U2libGluZyIsImNsYXNzTGlzdCIsImFkZCIsIlJPT1RfQ0xBU1NfTkFNRSIsIkJMT0NLRURfRE9NX0VWRU5UUyIsImZvckVhY2giLCJldmVudFR5cGUiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJ1cGRhdGUiLCJ1cGRhdGVJbmRpY2VzU3RyaW5nQW5kRWxlbWVudElkcyIsImdldEJhc2VPcHRpb25zIiwiY2FsbGJhY2tzRm9yT3RoZXJOb2RlcyIsImFjY2Vzc2libGVOYW1lIiwiYWNjZXNzaWJsZU5hbWVCZWhhdmlvciIsInBkb21IZWFkaW5nIiwicGRvbUhlYWRpbmdCZWhhdmlvciIsImhlbHBUZXh0IiwiaGVscFRleHRCZWhhdmlvciIsImNyZWF0ZUVsZW1lbnQiLCJ0YWdOYW1lIiwibmFtZXNwYWNlIiwicGRvbU5hbWVzcGFjZSIsImNvbnRhaW5lclRhZ05hbWUiLCJsYWJlbFRhZ05hbWUiLCJleGNsdWRlRnJvbUlucHV0IiwiZXhjbHVkZUxhYmVsU2libGluZ0Zyb21JbnB1dCIsImRlc2NyaXB0aW9uVGFnTmFtZSIsIm9yZGVyRWxlbWVudHMiLCJkaXNjb25uZWN0Iiwib2JzZXJ2ZSIsImxhYmVsQ29udGVudCIsInNldExhYmVsU2libGluZ0NvbnRlbnQiLCJpbm5lckNvbnRlbnQiLCJzZXRQcmltYXJ5U2libGluZ0NvbnRlbnQiLCJkZXNjcmlwdGlvbkNvbnRlbnQiLCJzZXREZXNjcmlwdGlvblNpYmxpbmdDb250ZW50IiwidG9VcHBlckNhc2UiLCJpbnB1dFR5cGUiLCJzZXRBdHRyaWJ1dGVUb0VsZW1lbnQiLCJlbGVtZW50TmFtZSIsInNldEZvY3VzYWJsZSIsInNldFBvc2l0aW9uSW5QRE9NIiwib25BcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uQ2hhbmdlIiwib25BcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbkNoYW5nZSIsIm9uQWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uQ2hhbmdlIiwib25BdHRyaWJ1dGVDaGFuZ2UiLCJvbkNsYXNzQ2hhbmdlIiwib25JbnB1dFZhbHVlQ2hhbmdlIiwidXBkYXRlT3RoZXJOb2Rlc0FyaWFMYWJlbGxlZGJ5IiwidXBkYXRlT3RoZXJOb2Rlc0FyaWFEZXNjcmliZWRieSIsInVwZGF0ZU90aGVyTm9kZXNBY3RpdmVEZXNjZW5kYW50IiwiY2FsbGJhY2siLCJjb25maWciLCJpbnNlcnRCZWZvcmUiLCJjaGlsZHJlbiIsImZpbHRlciIsIl8iLCJpZGVudGl0eSIsImFycmFuZ2VDb250ZW50RWxlbWVudCIsImFwcGVuZExhYmVsIiwiYXBwZW5kRGVzY3JpcHRpb24iLCJnZXRQcmltYXJ5U2libGluZyIsImdldExhYmVsU2libGluZyIsImxhYmVsU2libGluZyIsImdldERlc2NyaXB0aW9uU2libGluZyIsImRlc2NyaXB0aW9uU2libGluZyIsImdldENvbnRhaW5lclBhcmVudCIsImNvbnRhaW5lclBhcmVudCIsImdldFRvcExldmVsRWxlbWVudENvbnRhaW5pbmdQcmltYXJ5U2libGluZyIsInJlbW92ZUF0dHJpYnV0ZUZyb21BbGxFbGVtZW50cyIsImkiLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsImxlbmd0aCIsImFzc29jaWF0aW9uT2JqZWN0Iiwib3RoZXJOb2RlIiwibm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZSIsImluZGV4T2YiLCJzZXRBc3NvY2lhdGlvbkF0dHJpYnV0ZSIsImFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucyIsIm5vZGVzVGhhdEFyZUFyaWFEZXNjcmliZWRieVRoaXNOb2RlIiwiYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucyIsIm5vZGVzVGhhdEFyZUFjdGl2ZURlc2NlbmRhbnRUb1RoaXNOb2RlIiwiaGFuZGxlQXR0cmlidXRlV2l0aFBET01PcHRpb24iLCJrZXkiLCJ2YWx1ZSIsInJlbW92ZUF0dHJpYnV0ZUZyb21FbGVtZW50IiwicGRvbU9wdGlvbnMiLCJwZG9tQXR0cmlidXRlcyIsImRhdGFPYmplY3QiLCJhdHRyaWJ1dGUiLCJhcmlhTGFiZWwiLCJhcmlhUm9sZSIsInBkb21DbGFzc2VzIiwic2V0Q2xhc3NUb0VsZW1lbnQiLCJjbGFzc05hbWUiLCJpbnB1dFZhbHVlIiwidW5kZWZpbmVkIiwidmFsdWVTdHJpbmciLCJhc1Byb3BlcnR5IiwiZ2V0RWxlbWVudEJ5TmFtZSIsIkVycm9yIiwiYXR0cmlidXRlVmFsdWUiLCJlbGVtZW50IiwicmF3QXR0cmlidXRlVmFsdWUiLCJ1bndyYXBQcm9wZXJ0eSIsImF0dHJpYnV0ZVZhbHVlV2l0aG91dE1hcmtzIiwiaW50ZXJhY3RpdmUiLCJzZXRBdHRyaWJ1dGVOUyIsInNldEF0dHJpYnV0ZSIsInJlbW92ZUF0dHJpYnV0ZU5TIiwicmVtb3ZlQXR0cmlidXRlIiwicmVtb3ZlQ2xhc3NGcm9tRWxlbWVudCIsInJlbW92ZSIsIkFTU09DSUFUSU9OX0FUVFJJQlVURVMiLCJvdGhlck5vZGVQRE9NSW5zdGFuY2VzIiwiZ2V0UERPTUluc3RhbmNlcyIsImZpcnN0UERPTUluc3RhbmNlIiwicGVlciIsIm90aGVyUGVlckVsZW1lbnQiLCJvdGhlckVsZW1lbnROYW1lIiwidGhpc0VsZW1lbnROYW1lIiwicHJldmlvdXNBdHRyaWJ1dGVWYWx1ZSIsImdldEF0dHJpYnV0ZSIsIm5ld0F0dHJpYnV0ZVZhbHVlIiwidHJpbSIsImpvaW4iLCJjb250ZW50RWxlbWVudCIsImFwcGVuZEVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsImluZGV4T2ZQcmltYXJ5U2libGluZyIsImluc2VydEluZGV4Iiwic3BsaWNlIiwiaXNWaXNpYmxlIiwidmlzaWJsZUVsZW1lbnRzIiwiaGlkZGVuIiwiaGFzQXR0cmlidXRlIiwic2V0VmlzaWJsZSIsInNhZmFyaSIsImlzRm9jdXNlZCIsInZpc3VhbEZvY3VzVHJhaWwiLCJndWVzc1Zpc3VhbFRyYWlsIiwicm9vdE5vZGUiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsImVxdWFscyIsImZvY3VzIiwid2luZG93SGFzRm9jdXNQcm9wZXJ0eSIsImJsdXIiLCJwZWVySGFkRm9jdXMiLCJvdmVycmlkZUZvY3VzV2l0aFRhYkluZGV4IiwiY29udGVudCIsInNldFRleHRDb250ZW50IiwidGFnTmFtZVN1cHBvcnRzQ29udGVudCIsInNldFBET01UcmFuc2Zvcm1Tb3VyY2VOb2RlIiwicmVtb3ZlTGlzdGVuZXIiLCJ1cGRhdGVUcmFuc2Zvcm1UcmFja2VyIiwiZ2V0RWxlbWVudElkIiwic2libGluZ05hbWUiLCJzdHJpbmdJZCIsImluZGljZXMiLCJnZXRQRE9NSW5zdGFuY2VVbmlxdWVJZCIsIkRBVEFfUERPTV9VTklRVUVfSUQiLCJzdHlsZSIsInRyYW5zZm9ybSIsInBhcmVudCIsInBvc2l0aW9uRWxlbWVudHMiLCJ0cmFuc2Zvcm1Tb3VyY2VOb2RlIiwicGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUiLCJzZXQiLCJsb2NhbEJvdW5kcyIsImlzRmluaXRlIiwiZ2V0TWF0cml4IiwiZGlzcGxheUJvdW5kcyIsImJvdW5kcyIsImludGVyc2VjdHNCb3VuZHMiLCJjb25zdHJhaW5Cb3VuZHMiLCJjbGllbnREaW1lbnNpb25zIiwiZ2V0Q2xpZW50RGltZW5zaW9ucyIsImNsaWVudFdpZHRoIiwid2lkdGgiLCJjbGllbnRIZWlnaHQiLCJoZWlnaHQiLCJzZXRNaW5NYXgiLCJnZXRDU1NNYXRyaXgiLCJzZXRDbGllbnRCb3VuZHMiLCJPRkZTQ1JFRU5fU0lCTElOR19CT1VORFMiLCJvZmZzZXRIZWlnaHQiLCJ1cGRhdGVTdWJ0cmVlUG9zaXRpb25pbmciLCJwYXJlbnRQb3NpdGlvbkluUERPTSIsImNoaWxkUGVlciIsInJlY3Vyc2l2ZURpc2FibGUiLCJkaXNhYmxlZCIsImRpc3Bvc2UiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiYmx1ckV2ZW50TGlzdGVuZXIiLCJmb2N1c0V2ZW50TGlzdGVuZXIiLCJmcmVlVG9Qb29sIiwicmVnaXN0ZXIiLCJtaXhJbnRvIiwiaW5pdGlhbGl6ZSIsInByb3RvdHlwZSIsIm5ld0VsZW1lbnQiLCJEQVRBX0VYQ0xVREVfRlJPTV9JTlBVVCIsIm5vZGVHbG9iYWxCb3VuZHMiLCJzZXRUb1RyYW5zbGF0aW9uIiwibWluWCIsIm1pblkiLCJzZXRUb1NjYWxlIiwibXVsdGlwbHlNYXRyaXgiLCJzaWJsaW5nRWxlbWVudCIsImNsaWVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0b3AiLCJsZWZ0Il0sInNvdXJjZXMiOlsiUERPTVBlZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQW4gYWNjZXNzaWJsZSBwZWVyIGNvbnRyb2xzIHRoZSBhcHBlYXJhbmNlIG9mIGFuIGFjY2Vzc2libGUgTm9kZSdzIGluc3RhbmNlIGluIHRoZSBwYXJhbGxlbCBET00uIEEgUERPTVBlZXIgY2FuXHJcbiAqIGhhdmUgdXAgdG8gZm91ciB3aW5kb3cuRWxlbWVudHMgZGlzcGxheWVkIGluIHRoZSBQRE9NLCBzZWUgZnRydWN0b3IgZm9yIGRldGFpbHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmdcclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IFBvb2xhYmxlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sYWJsZS5qcyc7XHJcbmltcG9ydCBzdHJpcEVtYmVkZGluZ01hcmtzIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9zdHJpcEVtYmVkZGluZ01hcmtzLmpzJztcclxuaW1wb3J0IHsgRm9jdXNNYW5hZ2VyLCBQRE9NSW5zdGFuY2UsIFBET01TaWJsaW5nU3R5bGUsIFBET01VdGlscywgc2NlbmVyeSB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFBSSU1BUllfU0lCTElORyA9ICdQUklNQVJZX1NJQkxJTkcnO1xyXG5jb25zdCBMQUJFTF9TSUJMSU5HID0gJ0xBQkVMX1NJQkxJTkcnO1xyXG5jb25zdCBERVNDUklQVElPTl9TSUJMSU5HID0gJ0RFU0NSSVBUSU9OX1NJQkxJTkcnO1xyXG5jb25zdCBDT05UQUlORVJfUEFSRU5UID0gJ0NPTlRBSU5FUl9QQVJFTlQnO1xyXG5jb25zdCBMQUJFTF9UQUcgPSBQRE9NVXRpbHMuVEFHUy5MQUJFTDtcclxuY29uc3QgSU5QVVRfVEFHID0gUERPTVV0aWxzLlRBR1MuSU5QVVQ7XHJcbmNvbnN0IERJU0FCTEVEX0FUVFJJQlVURV9OQU1FID0gJ2Rpc2FibGVkJztcclxuXHJcbi8vIERPTSBvYnNlcnZlcnMgdGhhdCBhcHBseSBuZXcgQ1NTIHRyYW5zZm9ybWF0aW9ucyBhcmUgdHJpZ2dlcmVkIHdoZW4gY2hpbGRyZW4sIG9yIGlubmVyIGNvbnRlbnQgY2hhbmdlLiBVcGRhdGluZ1xyXG4vLyBzdHlsZS9wb3NpdGlvbmluZyBvZiB0aGUgZWxlbWVudCB3aWxsIGNoYW5nZSBhdHRyaWJ1dGVzIHNvIHdlIGNhbid0IG9ic2VydmUgdGhvc2UgY2hhbmdlcyBzaW5jZSBpdCB3b3VsZCB0cmlnZ2VyXHJcbi8vIHRoZSBNdXRhdGlvbk9ic2VydmVyIGluZmluaXRlbHkuXHJcbmNvbnN0IE9CU0VSVkVSX0NPTkZJRyA9IHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9O1xyXG5cclxubGV0IGdsb2JhbElkID0gMTtcclxuXHJcbi8vIG11dGFibGVzIGluc3RhbmNlcyB0byBhdm9pZCBjcmVhdGluZyBtYW55IGluIG9wZXJhdGlvbnMgdGhhdCBvY2N1ciBmcmVxdWVudGx5XHJcbmNvbnN0IHNjcmF0Y2hHbG9iYWxCb3VuZHMgPSBuZXcgQm91bmRzMiggMCwgMCwgMCwgMCApO1xyXG5jb25zdCBzY3JhdGNoU2libGluZ0JvdW5kcyA9IG5ldyBCb3VuZHMyKCAwLCAwLCAwLCAwICk7XHJcbmNvbnN0IGdsb2JhbE5vZGVUcmFuc2xhdGlvbk1hdHJpeCA9IG5ldyBNYXRyaXgzKCk7XHJcbmNvbnN0IGdsb2JhbFRvQ2xpZW50U2NhbGVNYXRyaXggPSBuZXcgTWF0cml4MygpO1xyXG5jb25zdCBub2RlU2NhbGVNYWduaXR1ZGVNYXRyaXggPSBuZXcgTWF0cml4MygpO1xyXG5cclxuY2xhc3MgUERPTVBlZXIge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7UERPTUluc3RhbmNlfSBwZG9tSW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICogQG1peGVzIFBvb2xhYmxlXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIHBkb21JbnN0YW5jZSwgb3B0aW9ucyApIHtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZVBET01QZWVyKCBwZG9tSW5zdGFuY2UsIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBvYmplY3QgKGVpdGhlciBmcm9tIGEgZnJlc2hseS1jcmVhdGVkIHN0YXRlLCBvciBmcm9tIGEgXCJkaXNwb3NlZFwiIHN0YXRlIGJyb3VnaHQgYmFjayBmcm9tIGFcclxuICAgKiBwb29sKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IHRoZSBQRE9NUGVlciBpcyBub3QgZnVsbHkgY29uc3RydWN0ZWQgdW50aWwgY2FsbGluZyBQRE9NUGVlci51cGRhdGUoKSBhZnRlciBjcmVhdGluZyBmcm9tIHBvb2wuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7UERPTUluc3RhbmNlfSBwZG9tSW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICogQHJldHVybnMge1BET01QZWVyfSAtIFJldHVybnMgJ3RoaXMnIHJlZmVyZW5jZSwgZm9yIGNoYWluaW5nXHJcbiAgICovXHJcbiAgaW5pdGlhbGl6ZVBET01QZWVyKCBwZG9tSW5zdGFuY2UsIG9wdGlvbnMgKSB7XHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHtcclxuICAgICAgcHJpbWFyeVNpYmxpbmc6IG51bGxcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pZCB8fCB0aGlzLmlzRGlzcG9zZWQsICdJZiB3ZSBwcmV2aW91c2x5IGV4aXN0ZWQsIHdlIG5lZWQgdG8gaGF2ZSBiZWVuIGRpc3Bvc2VkJyApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge251bWJlcn0gLSB1bmlxdWUgSURcclxuICAgIHRoaXMuaWQgPSB0aGlzLmlkIHx8IGdsb2JhbElkKys7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7UERPTUluc3RhbmNlfVxyXG4gICAgdGhpcy5wZG9tSW5zdGFuY2UgPSBwZG9tSW5zdGFuY2U7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7Tm9kZXxudWxsfSBvbmx5IG51bGwgZm9yIHRoZSByb290IHBkb21JbnN0YW5jZVxyXG4gICAgdGhpcy5ub2RlID0gdGhpcy5wZG9tSW5zdGFuY2Uubm9kZTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtEaXNwbGF5fSAtIEVhY2ggcGVlciBpcyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBEaXNwbGF5LlxyXG4gICAgdGhpcy5kaXNwbGF5ID0gcGRvbUluc3RhbmNlLmRpc3BsYXk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7VHJhaWx9IC0gTk9URTogTWF5IGhhdmUgXCJnYXBzXCIgZHVlIHRvIHBkb21PcmRlciB1c2FnZS5cclxuICAgIHRoaXMudHJhaWwgPSBwZG9tSW5zdGFuY2UudHJhaWw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW58bnVsbH0gLSB3aGV0aGVyIG9yIG5vdCB0aGlzIFBET01QZWVyIGlzIHZpc2libGUgaW4gdGhlIFBET01cclxuICAgIC8vIE9ubHkgaW5pdGlhbGl6ZWQgdG8gbnVsbCwgc2hvdWxkIG5vdCBiZSBzZXQgdG8gaXQuIGlzVmlzaWJsZSgpIHdpbGwgcmV0dXJuIHRydWUgaWYgdGhpcy52aXNpYmxlIGlzIG51bGxcclxuICAgIC8vIChiZWNhdXNlIGl0IGhhc24ndCBiZWVuIHNldCB5ZXQpLlxyXG4gICAgdGhpcy52aXNpYmxlID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbnxudWxsfSAtIHdoZXRoZXIgb3Igbm90IHRoZSBwcmltYXJ5IHNpYmxpbmcgb2YgdGhpcyBQRE9NUGVlciBjYW4gcmVjZWl2ZSBmb2N1cy5cclxuICAgIHRoaXMuZm9jdXNhYmxlID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7SFRNTEVsZW1lbnR8bnVsbH0gLSBPcHRpb25hbCBsYWJlbC9kZXNjcmlwdGlvbiBlbGVtZW50c1xyXG4gICAgdGhpcy5fbGFiZWxTaWJsaW5nID0gbnVsbDtcclxuICAgIHRoaXMuX2Rlc2NyaXB0aW9uU2libGluZyA9IG51bGw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0hUTUxFbGVtZW50fG51bGx9IC0gQSBwYXJlbnQgZWxlbWVudCB0aGF0IGNhbiBjb250YWluIHRoaXMgcHJpbWFyeVNpYmxpbmcgYW5kIG90aGVyIHNpYmxpbmdzLCB1c3VhbGx5XHJcbiAgICAvLyB0aGUgbGFiZWwgYW5kIGRlc2NyaXB0aW9uIGNvbnRlbnQuXHJcbiAgICB0aGlzLl9jb250YWluZXJQYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0hUTUxFbGVtZW50W119IFJhdGhlciB0aGFuIGd1YXJhbnRlZSB0aGF0IGEgcGVlciBpcyBhIHRyZWUgd2l0aCBhIHJvb3QgRE9NRWxlbWVudCxcclxuICAgIC8vIGFsbG93IG11bHRpcGxlIHdpbmRvdy5FbGVtZW50cyBhdCB0aGUgdG9wIGxldmVsIG9mIHRoZSBwZWVyLiBUaGlzIGlzIHVzZWQgZm9yIHNvcnRpbmcgdGhlIGluc3RhbmNlLlxyXG4gICAgLy8gU2VlIHRoaXMub3JkZXJFbGVtZW50cyBmb3IgbW9yZSBpbmZvLlxyXG4gICAgdGhpcy50b3BMZXZlbEVsZW1lbnRzID0gW107XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gZmxhZyB0aGF0IGluZGljYXRlcyB0aGF0IHRoaXMgcGVlciBoYXMgYWNjZXNzaWJsZSBjb250ZW50IHRoYXQgY2hhbmdlZCwgYW5kIHNvXHJcbiAgICAvLyB0aGUgc2libGluZ3MgbmVlZCB0byBiZSByZXBvc2l0aW9uZWQgaW4gdGhlIG5leHQgRGlzcGxheS51cGRhdGVEaXNwbGF5KClcclxuICAgIHRoaXMucG9zaXRpb25EaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtib29sZWFufSAtIEZsYWcgdGhhdCBpbmRpY2F0ZXMgdGhhdCBQRE9NIGVsZW1lbnRzIHJlcXVpcmUgYSBmb3JjZWQgcmVmbG93IG5leHQgYW5pbWF0aW9uIGZyYW1lLlxyXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgdG8gZml4IGEgU2FmYXJpIFZvaWNlT3ZlciBidWcgd2hlcmUgdGhlIGFjY2Vzc2libGUgbmFtZSBpcyByZWFkIGluY29ycmVjdGx5IGFmdGVyIGVsZW1lbnRzXHJcbiAgICAvLyBhcmUgaGlkZGVuL2Rpc3BsYXllZC4gVGhlIHVzdWFsIHdvcmthcm91bmQgdG8gZm9yY2UgYSByZWZsb3cgKHNldCB0aGUgc3R5bGUuZGlzcGxheSB0byBub25lLCBxdWVyeSB0aGUgb2Zmc2V0LFxyXG4gICAgLy8gc2V0IGl0IGJhY2spIG9ubHkgZml4ZXMgdGhlIHByb2JsZW0gaWYgdGhlIHN0eWxlLmRpc3BsYXkgYXR0cmlidXRlIGlzIHNldCBpbiB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ExMXktcmVzZWFyY2gvaXNzdWVzLzE5My5cclxuICAgIHRoaXMuZm9yY2VSZWZsb3dXb3JrYXJvdW5kID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gaW5kaWNhdGVzIHRoYXQgdGhpcyBwZWVyJ3MgcGRvbUluc3RhbmNlIGhhcyBhIGRlc2NlbmRhbnQgdGhhdCBpcyBkaXJ0eS4gVXNlZCB0b1xyXG4gICAgLy8gcXVpY2tseSBmaW5kIHBlZXJzIHdpdGggcG9zaXRpb25EaXJ0eSB3aGVuIHdlIHRyYXZlcnNlIHRoZSB0cmVlIG9mIFBET01JbnN0YW5jZXNcclxuICAgIHRoaXMuY2hpbGRQb3NpdGlvbkRpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gSW5kaWNhdGVzIHRoYXQgdGhpcyBwZWVyIHdpbGwgcG9zaXRpb24gc2libGluZyBlbGVtZW50cyBzbyB0aGF0XHJcbiAgICAvLyB0aGV5IGFyZSBpbiB0aGUgcmlnaHQgbG9jYXRpb24gaW4gdGhlIHZpZXdwb3J0LCB3aGljaCBpcyBhIHJlcXVpcmVtZW50IGZvciB0b3VjaCBiYXNlZFxyXG4gICAgLy8gc2NyZWVuIHJlYWRlcnMuIFNlZSBzZXRQb3NpdGlvbkluUERPTS5cclxuICAgIHRoaXMucG9zaXRpb25JblBET00gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7TXV0YXRpb25PYnNlcnZlcn0gLSBBbiBvYnNlcnZlciB0aGF0IHdpbGwgY2FsbCBiYWNrIGFueSB0aW1lIGEgcHJvcGVydHkgb2YgdGhlIHByaW1hcnlcclxuICAgIC8vIHNpYmxpbmcgY2hhbmdlcy4gVXNlZCB0byByZXBvc2l0aW9uIHRoZSBzaWJsaW5nIGVsZW1lbnRzIGlmIHRoZSBib3VuZGluZyBib3ggcmVzaXplcy4gTm8gbmVlZCB0byBsb29wIG92ZXJcclxuICAgIC8vIGFsbCBvZiB0aGUgbXV0YXRpb25zLCBhbnkgc2luZ2xlIG11dGF0aW9uIHdpbGwgcmVxdWlyZSB1cGRhdGluZyBDU1MgcG9zaXRpb25pbmcuXHJcbiAgICAvL1xyXG4gICAgLy8gTk9URTogSWRlYWxseSwgYSBzaW5nbGUgTXV0YXRpb25PYnNlcnZlciBjb3VsZCBiZSB1c2VkIHRvIG9ic2VydmUgY2hhbmdlcyB0byBhbGwgZWxlbWVudHMgaW4gdGhlIFBET00uIEJ1dFxyXG4gICAgLy8gTXV0YXRpb25PYnNlcnZlciBtYWtlcyBpdCBpbXBvc3NpYmxlIHRvIGRldGFjaCBvYnNlcnZlcnMgZnJvbSBhIHNpbmdsZSBlbGVtZW50LiBNdXRhdGlvbk9ic2VydmVyLmRldGFjaCgpXHJcbiAgICAvLyB3aWxsIHJlbW92ZSBsaXN0ZW5lcnMgb24gYWxsIG9ic2VydmVkIGVsZW1lbnRzLCBzbyBpbmRpdmlkdWFsIG9ic2VydmVycyBtdXN0IGJlIHVzZWQgb24gZWFjaCBlbGVtZW50LlxyXG4gICAgLy8gT25lIGFsdGVybmF0aXZlIGNvdWxkIGJlIHRvIHB1dCB0aGUgTXV0YXRpb25PYnNlcnZlciBvbiB0aGUgcm9vdCBlbGVtZW50IGFuZCB1c2UgXCJzdWJ0cmVlOiB0cnVlXCIgaW5cclxuICAgIC8vIE9CU0VSVkVSX0NPTkZJRy4gVGhpcyBjb3VsZCByZWR1Y2UgdGhlIG51bWJlciBvZiBNdXRhdGlvbk9ic2VydmVycywgYnV0IHRoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGdldCB0aGVcclxuICAgIC8vIHBlZXIgZnJvbSB0aGUgbXV0YXRpb24gdGFyZ2V0IGVsZW1lbnQuIElmIE11dGF0aW9uT2JzZXJ2ZXIgdGFrZXMgYSBsb3Qgb2YgbWVtb3J5LCB0aGlzIGNvdWxkIGJlIGFuXHJcbiAgICAvLyBvcHRpbWl6YXRpb24gdGhhdCBtYXkgY29tZSB3aXRoIGEgcGVyZm9ybWFuY2UgY29zdC5cclxuICAgIC8vXHJcbiAgICAvLyBOT1RFOiBSZXNpemVPYnNlcnZlciBpcyBhIHN1cGVyaW9yIGFsdGVybmF0aXZlIHRvIE11dGF0aW9uT2JzZXJ2ZXIgZm9yIHRoaXMgcHVycG9zZSBiZWNhdXNlXHJcbiAgICAvLyBpdCB3aWxsIG9ubHkgbW9uaXRvciBjaGFuZ2VzIHdlIGNhcmUgYWJvdXQgYW5kIHByZXZlbnQgaW5maW5pdGUgY2FsbGJhY2sgbG9vcHMgaWYgc2l6ZSBpcyBjaGFuZ2VkIGluXHJcbiAgICAvLyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gKHdlIGdldCBhcm91bmQgdGhpcyBub3cgYnkgbm90IG9ic2VydmluZyBhdHRyaWJ1dGUgY2hhbmdlcykuIEJ1dCBpdCBpcyBub3QgeWV0IHdpZGVseVxyXG4gICAgLy8gc3VwcG9ydGVkLCBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1Jlc2l6ZU9ic2VydmVyLlxyXG4gICAgLy9cclxuICAgIC8vIFRPRE86IFNob3VsZCB3ZSBiZSB3YXRjaGluZyBcIm1vZGVsXCIgY2hhbmdlcyBmcm9tIFBhcmFsbGVsRE9NLmpzIGluc3RlYWQgb2YgdXNpbmcgTXV0YXRpb25PYnNlcnZlcj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODUyLiBUaGlzIHdvdWxkIGJlIGxlc3MgZnJhZ2lsZSwgYW5kIGFsc28gbGVzc1xyXG4gICAgLy8gbWVtb3J5IGludGVuc2l2ZSBiZWNhdXNlIHdlIGRvbid0IG5lZWQgYW4gaW5zdGFuY2Ugb2YgTXV0YXRpb25PYnNlcnZlciBvbiBldmVyeSBQRE9NSW5zdGFuY2UuXHJcbiAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIgPSB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIgfHwgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoIHRoaXMuaW52YWxpZGF0ZUNTU1Bvc2l0aW9uaW5nLmJpbmQoIHRoaXMsIGZhbHNlICkgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7ZnVuY3Rpb259IC0gbXVzdCBiZSByZW1vdmVkIG9uIGRpc3Bvc2FsXHJcbiAgICB0aGlzLnRyYW5zZm9ybUxpc3RlbmVyID0gdGhpcy50cmFuc2Zvcm1MaXN0ZW5lciB8fCB0aGlzLmludmFsaWRhdGVDU1NQb3NpdGlvbmluZy5iaW5kKCB0aGlzLCBmYWxzZSApO1xyXG4gICAgdGhpcy5wZG9tSW5zdGFuY2UudHJhbnNmb3JtVHJhY2tlci5hZGRMaXN0ZW5lciggdGhpcy50cmFuc2Zvcm1MaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHsqfSAtIFRvIHN1cHBvcnQgc2V0dGluZyB0aGUgRGlzcGxheS5pbnRlcmFjdGl2ZT1mYWxzZSAod2hpY2ggc2V0cyBkaXNhYmxlZCBvbiBhbGwgcHJpbWFyeVNpYmxpbmdzLFxyXG4gICAgLy8gd2UgbmVlZCB0byBzZXQgZGlzYWJsZWQgb24gYSBzZXBhcmF0ZSBjaGFubmVsIGZyb20gdGhpcy5zZXRBdHRyaWJ1dGVUb0VsZW1lbnQuIFRoYXQgd2F5IHdlIGNvdmVyIHRoZSBjYXNlIHdoZXJlXHJcbiAgICAvLyBgZGlzYWJsZWRgIHdhcyBzZXQgdGhyb3VnaCB0aGUgUGFyYWxsZWxET00gQVBJIHdoZW4gd2UgbmVlZCB0byB0b2dnbGUgaXQgc3BlY2lmaWNhbGx5IGZvciBEaXNwbGF5LmludGVyYWN0aXZlLlxyXG4gICAgLy8gVGhpcyB3YXkgd2UgY2FuIGNvbnNlcnZlIHRoZSBwcmV2aW91cyBgZGlzYWJsZWRgIGF0dHJpYnV0ZS9wcm9wZXJ0eSB2YWx1ZSB0aHJvdWdoIHRvZ2dsaW5nIERpc3BsYXkuaW50ZXJhY3RpdmUuXHJcbiAgICB0aGlzLl9wcmVzZXJ2ZWREaXNhYmxlZFZhbHVlID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdlIGFyZSBjdXJyZW50bHkgaW4gYSBcImRpc3Bvc2VkXCIgKGluIHRoZSBwb29sKSBzdGF0ZSwgb3IgYXJlIGF2YWlsYWJsZSB0byBiZVxyXG4gICAgLy8gaW50ZXJhY3RlZCB3aXRoLlxyXG4gICAgdGhpcy5pc0Rpc3Bvc2VkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gZWRnZSBjYXNlIGZvciByb290IGFjY2Vzc2liaWxpdHlcclxuICAgIGlmICggdGhpcy5wZG9tSW5zdGFuY2UuaXNSb290SW5zdGFuY2UgKSB7XHJcblxyXG4gICAgICAvLyBAcHJpdmF0ZSB7SFRNTEVsZW1lbnR9IC0gVGhlIG1haW4gZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBwZWVyLiBJZiBmb2N1c2FibGUsIHRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCBnZXRzXHJcbiAgICAgIC8vIHRoZSBmb2N1cy4gSXQgYWxzbyB3aWxsIGNvbnRhaW4gYW55IGNoaWxkcmVuLlxyXG4gICAgICB0aGlzLl9wcmltYXJ5U2libGluZyA9IG9wdGlvbnMucHJpbWFyeVNpYmxpbmc7XHJcbiAgICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nLmNsYXNzTGlzdC5hZGQoIFBET01TaWJsaW5nU3R5bGUuUk9PVF9DTEFTU19OQU1FICk7XHJcblxyXG4gICAgICAvLyBTdG9wIGJsb2NrZWQgZXZlbnRzIGZyb20gYnViYmxpbmcgcGFzdCB0aGUgcm9vdCBvZiB0aGUgUERPTSBzbyB0aGF0IHNjZW5lcnkgZG9lc1xyXG4gICAgICAvLyBub3QgZGlzcGF0Y2ggdGhlbSBpbiBJbnB1dC5qcy5cclxuICAgICAgUERPTVV0aWxzLkJMT0NLRURfRE9NX0VWRU5UUy5mb3JFYWNoKCBldmVudFR5cGUgPT4ge1xyXG4gICAgICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50VHlwZSwgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgdGhlIGNvbnRlbnQgb2YgdGhlIHBlZXIuIFRoaXMgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIEFjY2Vzc2liZVBlZXIgaXMgY29uc3RydWN0ZWQgZnJvbSBwb29sLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXBkYXRlSW5kaWNlc1N0cmluZ0FuZEVsZW1lbnRJZHMgLSBpZiB0aGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgdXBvbiBpbml0aWFsIFwiY29uc3RydWN0aW9uXCIgKGluIHVwZGF0ZSksIGFsbG93cyBmb3IgdGhlIG9wdGlvbiB0byBkbyB0aGlzIGxhemlseSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODQ3XHJcbiAgICogQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICB1cGRhdGUoIHVwZGF0ZUluZGljZXNTdHJpbmdBbmRFbGVtZW50SWRzICkge1xyXG4gICAgbGV0IG9wdGlvbnMgPSB0aGlzLm5vZGUuZ2V0QmFzZU9wdGlvbnMoKTtcclxuXHJcbiAgICBjb25zdCBjYWxsYmFja3NGb3JPdGhlck5vZGVzID0gW107XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGUuYWNjZXNzaWJsZU5hbWUgIT09IG51bGwgKSB7XHJcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm5vZGUuYWNjZXNzaWJsZU5hbWVCZWhhdmlvciggdGhpcy5ub2RlLCBvcHRpb25zLCB0aGlzLm5vZGUuYWNjZXNzaWJsZU5hbWUsIGNhbGxiYWNrc0Zvck90aGVyTm9kZXMgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnLCAnc2hvdWxkIHJldHVybiBhbiBvYmplY3QnICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGUucGRvbUhlYWRpbmcgIT09IG51bGwgKSB7XHJcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm5vZGUucGRvbUhlYWRpbmdCZWhhdmlvciggdGhpcy5ub2RlLCBvcHRpb25zLCB0aGlzLm5vZGUucGRvbUhlYWRpbmcsIGNhbGxiYWNrc0Zvck90aGVyTm9kZXMgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnLCAnc2hvdWxkIHJldHVybiBhbiBvYmplY3QnICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGUuaGVscFRleHQgIT09IG51bGwgKSB7XHJcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm5vZGUuaGVscFRleHRCZWhhdmlvciggdGhpcy5ub2RlLCBvcHRpb25zLCB0aGlzLm5vZGUuaGVscFRleHQsIGNhbGxiYWNrc0Zvck90aGVyTm9kZXMgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnLCAnc2hvdWxkIHJldHVybiBhbiBvYmplY3QnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBiYXNlIERPTSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGlzIGFjY2Vzc2libGUgaW5zdGFuY2VcclxuICAgIC8vIFRPRE86IHdoeSBub3QganVzdCBvcHRpb25zLmZvY3VzYWJsZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nID0gY3JlYXRlRWxlbWVudCggb3B0aW9ucy50YWdOYW1lLCB0aGlzLm5vZGUuZm9jdXNhYmxlLCB7XHJcbiAgICAgIG5hbWVzcGFjZTogb3B0aW9ucy5wZG9tTmFtZXNwYWNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBjb250YWluZXIgcGFyZW50IGZvciB0aGUgZG9tIHNpYmxpbmdzXHJcbiAgICBpZiAoIG9wdGlvbnMuY29udGFpbmVyVGFnTmFtZSApIHtcclxuICAgICAgdGhpcy5fY29udGFpbmVyUGFyZW50ID0gY3JlYXRlRWxlbWVudCggb3B0aW9ucy5jb250YWluZXJUYWdOYW1lLCBmYWxzZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNyZWF0ZSB0aGUgbGFiZWwgRE9NIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoaXMgaW5zdGFuY2VcclxuICAgIGlmICggb3B0aW9ucy5sYWJlbFRhZ05hbWUgKSB7XHJcbiAgICAgIHRoaXMuX2xhYmVsU2libGluZyA9IGNyZWF0ZUVsZW1lbnQoIG9wdGlvbnMubGFiZWxUYWdOYW1lLCBmYWxzZSwge1xyXG4gICAgICAgIGV4Y2x1ZGVGcm9tSW5wdXQ6IHRoaXMubm9kZS5leGNsdWRlTGFiZWxTaWJsaW5nRnJvbUlucHV0XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjcmVhdGUgdGhlIGRlc2NyaXB0aW9uIERPTSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGlzIGluc3RhbmNlXHJcbiAgICBpZiAoIG9wdGlvbnMuZGVzY3JpcHRpb25UYWdOYW1lICkge1xyXG4gICAgICB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcgPSBjcmVhdGVFbGVtZW50KCBvcHRpb25zLmRlc2NyaXB0aW9uVGFnTmFtZSwgZmFsc2UgKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVJbmRpY2VzU3RyaW5nQW5kRWxlbWVudElkcyAmJiB0aGlzLnVwZGF0ZUluZGljZXNTdHJpbmdBbmRFbGVtZW50SWRzKCk7XHJcblxyXG4gICAgdGhpcy5vcmRlckVsZW1lbnRzKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gYXNzaWduIGxpc3RlbmVycyAodG8gYmUgcmVtb3ZlZCBvciBkaXNjb25uZWN0ZWQgZHVyaW5nIGRpc3Bvc2FsKVxyXG4gICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTsgLy8gaW4gY2FzZSB1cGRhdGUoKSBpcyBjYWxsZWQgbW9yZSB0aGFuIG9uY2Ugb24gYW4gaW5zdGFuY2Ugb2YgUERPTVBlZXJcclxuICAgIHRoaXMubXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKCB0aGlzLl9wcmltYXJ5U2libGluZywgT0JTRVJWRVJfQ09ORklHICk7XHJcblxyXG4gICAgLy8gc2V0IHRoZSBhY2Nlc3NpYmxlIGxhYmVsIG5vdyB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIHJlY3JlYXRlZCBhZ2FpbiwgYnV0IG5vdCBpZiB0aGUgdGFnTmFtZVxyXG4gICAgLy8gaGFzIGJlZW4gY2xlYXJlZCBvdXRcclxuICAgIGlmICggb3B0aW9ucy5sYWJlbENvbnRlbnQgJiYgb3B0aW9ucy5sYWJlbFRhZ05hbWUgIT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuc2V0TGFiZWxTaWJsaW5nQ29udGVudCggb3B0aW9ucy5sYWJlbENvbnRlbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXN0b3JlIHRoZSBpbm5lckNvbnRlbnRcclxuICAgIGlmICggb3B0aW9ucy5pbm5lckNvbnRlbnQgJiYgb3B0aW9ucy50YWdOYW1lICE9PSBudWxsICkge1xyXG4gICAgICB0aGlzLnNldFByaW1hcnlTaWJsaW5nQ29udGVudCggb3B0aW9ucy5pbm5lckNvbnRlbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdGhlIGFjY2Vzc2libGUgZGVzY3JpcHRpb24sIGJ1dCBub3QgaWYgdGhlIHRhZ05hbWUgaGFzIGJlZW4gY2xlYXJlZCBvdXQuXHJcbiAgICBpZiAoIG9wdGlvbnMuZGVzY3JpcHRpb25Db250ZW50ICYmIG9wdGlvbnMuZGVzY3JpcHRpb25UYWdOYW1lICE9PSBudWxsICkge1xyXG4gICAgICB0aGlzLnNldERlc2NyaXB0aW9uU2libGluZ0NvbnRlbnQoIG9wdGlvbnMuZGVzY3JpcHRpb25Db250ZW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgZWxlbWVudCBpcyBhbiBpbnB1dCBlbGVtZW50LCBzZXQgaW5wdXQgdHlwZVxyXG4gICAgaWYgKCBvcHRpb25zLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gSU5QVVRfVEFHICYmIG9wdGlvbnMuaW5wdXRUeXBlICkge1xyXG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZVRvRWxlbWVudCggJ3R5cGUnLCBvcHRpb25zLmlucHV0VHlwZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBsYWJlbCBlbGVtZW50IGhhcHBlbnMgdG8gYmUgYSAnbGFiZWwnLCBhc3NvY2lhdGUgd2l0aCAnZm9yJyBhdHRyaWJ1dGUgKG11c3QgYmUgZG9uZSBhZnRlciB1cGRhdGluZyBJRHMpXHJcbiAgICBpZiAoIG9wdGlvbnMubGFiZWxUYWdOYW1lICYmIG9wdGlvbnMubGFiZWxUYWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09IExBQkVMX1RBRyApIHtcclxuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGVUb0VsZW1lbnQoICdmb3InLCB0aGlzLl9wcmltYXJ5U2libGluZy5pZCwge1xyXG4gICAgICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5MQUJFTF9TSUJMSU5HXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldEZvY3VzYWJsZSggdGhpcy5ub2RlLmZvY3VzYWJsZSApO1xyXG5cclxuICAgIC8vIHNldCB0aGUgcG9zaXRpb25JblBET00gZmllbGQgdG8gb3VyIHVwZGF0ZWQgaW5zdGFuY2VcclxuICAgIHRoaXMuc2V0UG9zaXRpb25JblBET00oIHRoaXMubm9kZS5wb3NpdGlvbkluUERPTSApO1xyXG5cclxuICAgIC8vIHJlY29tcHV0ZSBhbmQgYXNzaWduIHRoZSBhc3NvY2lhdGlvbiBhdHRyaWJ1dGVzIHRoYXQgbGluayB0d28gZWxlbWVudHMgKGxpa2UgYXJpYS1sYWJlbGxlZGJ5KVxyXG4gICAgdGhpcy5vbkFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25DaGFuZ2UoKTtcclxuICAgIHRoaXMub25BcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbkNoYW5nZSgpO1xyXG4gICAgdGhpcy5vbkFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbkNoYW5nZSgpO1xyXG5cclxuICAgIC8vIHVwZGF0ZSBhbGwgYXR0cmlidXRlcyBmb3IgdGhlIHBlZXIsIHNob3VsZCBjb3ZlciBhcmlhLWxhYmVsLCByb2xlLCBhbmQgb3RoZXJzXHJcbiAgICB0aGlzLm9uQXR0cmlidXRlQ2hhbmdlKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gdXBkYXRlIGFsbCBjbGFzc2VzIGZvciB0aGUgcGVlclxyXG4gICAgdGhpcy5vbkNsYXNzQ2hhbmdlKCk7XHJcblxyXG4gICAgLy8gdXBkYXRlIGlucHV0IHZhbHVlIGF0dHJpYnV0ZSBmb3IgdGhlIHBlZXJcclxuICAgIHRoaXMub25JbnB1dFZhbHVlQ2hhbmdlKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnVwZGF0ZU90aGVyTm9kZXNBcmlhTGFiZWxsZWRieSgpO1xyXG4gICAgdGhpcy5ub2RlLnVwZGF0ZU90aGVyTm9kZXNBcmlhRGVzY3JpYmVkYnkoKTtcclxuICAgIHRoaXMubm9kZS51cGRhdGVPdGhlck5vZGVzQWN0aXZlRGVzY2VuZGFudCgpO1xyXG5cclxuICAgIGNhbGxiYWNrc0Zvck90aGVyTm9kZXMuZm9yRWFjaCggY2FsbGJhY2sgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgKTtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSB0aGUgaW50ZXJuYWwgb3JkZXJpbmcgb2YgdGhlIGVsZW1lbnRzIGluIHRoZSBwZWVyLCB0aGlzIGludm9sdmVzIHNldHRpbmcgdGhlIHByb3BlciB2YWx1ZSBvZlxyXG4gICAqIHRoaXMudG9wTGV2ZWxFbGVtZW50c1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgLSB0aGUgY29tcHV0ZWQgbWl4aW4gb3B0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBwZWVyLiAoc2VsZWN0IFBhcmFsbGVsRE9NIG11dGF0b3Iga2V5cylcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIG9yZGVyRWxlbWVudHMoIGNvbmZpZyApIHtcclxuICAgIGlmICggdGhpcy5fY29udGFpbmVyUGFyZW50ICkge1xyXG4gICAgICAvLyBUaGUgZmlyc3QgY2hpbGQgb2YgdGhlIGNvbnRhaW5lciBwYXJlbnQgZWxlbWVudCBzaG91bGQgYmUgdGhlIHBlZXIgZG9tIGVsZW1lbnRcclxuICAgICAgLy8gaWYgdW5kZWZpbmVkLCB0aGUgaW5zZXJ0QmVmb3JlIG1ldGhvZCB3aWxsIGluc2VydCB0aGUgdGhpcy5fcHJpbWFyeVNpYmxpbmcgYXMgdGhlIGZpcnN0IGNoaWxkXHJcbiAgICAgIHRoaXMuX2NvbnRhaW5lclBhcmVudC5pbnNlcnRCZWZvcmUoIHRoaXMuX3ByaW1hcnlTaWJsaW5nLCB0aGlzLl9jb250YWluZXJQYXJlbnQuY2hpbGRyZW5bIDAgXSB8fCBudWxsICk7XHJcbiAgICAgIHRoaXMudG9wTGV2ZWxFbGVtZW50cyA9IFsgdGhpcy5fY29udGFpbmVyUGFyZW50IF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFdlYW4gb3V0IGFueSBudWxsIHNpYmxpbmdzXHJcbiAgICAgIHRoaXMudG9wTGV2ZWxFbGVtZW50cyA9IFsgdGhpcy5fbGFiZWxTaWJsaW5nLCB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcsIHRoaXMuX3ByaW1hcnlTaWJsaW5nIF0uZmlsdGVyKCBfLmlkZW50aXR5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaW5zZXJ0IHRoZSBsYWJlbCBhbmQgZGVzY3JpcHRpb24gZWxlbWVudHMgaW4gdGhlIGNvcnJlY3QgbG9jYXRpb24gaWYgdGhleSBleGlzdFxyXG4gICAgLy8gTk9URTogSW1wb3J0YW50IGZvciBhcnJhbmdlQ29udGVudEVsZW1lbnQgdG8gYmUgY2FsbGVkIG9uIHRoZSBsYWJlbCBzaWJsaW5nIGZpcnN0IGZvciBjb3JyZWN0IG9yZGVyXHJcbiAgICB0aGlzLl9sYWJlbFNpYmxpbmcgJiYgdGhpcy5hcnJhbmdlQ29udGVudEVsZW1lbnQoIHRoaXMuX2xhYmVsU2libGluZywgY29uZmlnLmFwcGVuZExhYmVsICk7XHJcbiAgICB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcgJiYgdGhpcy5hcnJhbmdlQ29udGVudEVsZW1lbnQoIHRoaXMuX2Rlc2NyaXB0aW9uU2libGluZywgY29uZmlnLmFwcGVuZERlc2NyaXB0aW9uICk7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwcmltYXJ5IHNpYmxpbmcgZWxlbWVudCBmb3IgdGhlIHBlZXJcclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fG51bGx9XHJcbiAgICovXHJcbiAgZ2V0UHJpbWFyeVNpYmxpbmcoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHJpbWFyeVNpYmxpbmc7XHJcbiAgfVxyXG5cclxuICBnZXQgcHJpbWFyeVNpYmxpbmcoKSB7IHJldHVybiB0aGlzLmdldFByaW1hcnlTaWJsaW5nKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwcmltYXJ5IHNpYmxpbmcgZWxlbWVudCBmb3IgdGhlIHBlZXJcclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fG51bGx9XHJcbiAgICovXHJcbiAgZ2V0TGFiZWxTaWJsaW5nKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xhYmVsU2libGluZztcclxuICB9XHJcblxyXG4gIGdldCBsYWJlbFNpYmxpbmcoKSB7IHJldHVybiB0aGlzLmdldExhYmVsU2libGluZygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgcHJpbWFyeSBzaWJsaW5nIGVsZW1lbnQgZm9yIHRoZSBwZWVyXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudHxudWxsfVxyXG4gICAqL1xyXG4gIGdldERlc2NyaXB0aW9uU2libGluZygpIHtcclxuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmc7XHJcbiAgfVxyXG5cclxuICBnZXQgZGVzY3JpcHRpb25TaWJsaW5nKCkgeyByZXR1cm4gdGhpcy5nZXREZXNjcmlwdGlvblNpYmxpbmcoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHByaW1hcnkgc2libGluZyBlbGVtZW50IGZvciB0aGUgcGVlclxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8bnVsbH1cclxuICAgKi9cclxuICBnZXRDb250YWluZXJQYXJlbnQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyUGFyZW50O1xyXG4gIH1cclxuXHJcbiAgZ2V0IGNvbnRhaW5lclBhcmVudCgpIHsgcmV0dXJuIHRoaXMuZ2V0Q29udGFpbmVyUGFyZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdG9wLWxldmVsIGVsZW1lbnQgdGhhdCBjb250YWlucyB0aGUgcHJpbWFyeSBzaWJsaW5nLiBJZiB0aGVyZSBpcyBubyBjb250YWluZXIgcGFyZW50LCB0aGVuIHRoZSBwcmltYXJ5XHJcbiAgICogc2libGluZyBpcyByZXR1cm5lZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8bnVsbH1cclxuICAgKi9cclxuICBnZXRUb3BMZXZlbEVsZW1lbnRDb250YWluaW5nUHJpbWFyeVNpYmxpbmcoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyUGFyZW50IHx8IHRoaXMuX3ByaW1hcnlTaWJsaW5nO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjb21wdXRlIHRoZSBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlcyBmb3IgYWxsIG9mIHRoZSBwZWVyJ3MgZWxlbWVudHNcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgb25BcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uQ2hhbmdlKCkge1xyXG4gICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGVGcm9tQWxsRWxlbWVudHMoICdhcmlhLWxhYmVsbGVkYnknICk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5ub2RlLmFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBhc3NvY2lhdGlvbk9iamVjdCA9IHRoaXMubm9kZS5hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uc1sgaSBdO1xyXG5cclxuICAgICAgLy8gQXNzZXJ0IG91dCBpZiB0aGUgbW9kZWwgbGlzdCBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgZGF0YSBoZWxkIGluIHRoZSBhc3NvY2lhdGlvbk9iamVjdFxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhc3NvY2lhdGlvbk9iamVjdC5vdGhlck5vZGUubm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZS5pbmRleE9mKCB0aGlzLm5vZGUgKSA+PSAwLFxyXG4gICAgICAgICd1bmV4cGVjdGVkIG90aGVyTm9kZScgKTtcclxuXHJcblxyXG4gICAgICB0aGlzLnNldEFzc29jaWF0aW9uQXR0cmlidXRlKCAnYXJpYS1sYWJlbGxlZGJ5JywgYXNzb2NpYXRpb25PYmplY3QgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY29tcHV0ZSB0aGUgYXJpYS1kZXNjcmliZWRieSBhdHRyaWJ1dGVzIGZvciBhbGwgb2YgdGhlIHBlZXIncyBlbGVtZW50c1xyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBvbkFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uQ2hhbmdlKCkge1xyXG4gICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGVGcm9tQWxsRWxlbWVudHMoICdhcmlhLWRlc2NyaWJlZGJ5JyApO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubm9kZS5hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGFzc29jaWF0aW9uT2JqZWN0ID0gdGhpcy5ub2RlLmFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uc1sgaSBdO1xyXG5cclxuICAgICAgLy8gQXNzZXJ0IG91dCBpZiB0aGUgbW9kZWwgbGlzdCBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgZGF0YSBoZWxkIGluIHRoZSBhc3NvY2lhdGlvbk9iamVjdFxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhc3NvY2lhdGlvbk9iamVjdC5vdGhlck5vZGUubm9kZXNUaGF0QXJlQXJpYURlc2NyaWJlZGJ5VGhpc05vZGUuaW5kZXhPZiggdGhpcy5ub2RlICkgPj0gMCxcclxuICAgICAgICAndW5leHBlY3RlZCBvdGhlck5vZGUnICk7XHJcblxyXG5cclxuICAgICAgdGhpcy5zZXRBc3NvY2lhdGlvbkF0dHJpYnV0ZSggJ2FyaWEtZGVzY3JpYmVkYnknLCBhc3NvY2lhdGlvbk9iamVjdCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjb21wdXRlIHRoZSBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQgYXR0cmlidXRlcyBmb3IgYWxsIG9mIHRoZSBwZWVyJ3MgZWxlbWVudHNcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgb25BY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25DaGFuZ2UoKSB7XHJcbiAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZUZyb21BbGxFbGVtZW50cyggJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLm5vZGUuYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYXNzb2NpYXRpb25PYmplY3QgPSB0aGlzLm5vZGUuYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uc1sgaSBdO1xyXG5cclxuICAgICAgLy8gQXNzZXJ0IG91dCBpZiB0aGUgbW9kZWwgbGlzdCBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgZGF0YSBoZWxkIGluIHRoZSBhc3NvY2lhdGlvbk9iamVjdFxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhc3NvY2lhdGlvbk9iamVjdC5vdGhlck5vZGUubm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGUuaW5kZXhPZiggdGhpcy5ub2RlICkgPj0gMCxcclxuICAgICAgICAndW5leHBlY3RlZCBvdGhlck5vZGUnICk7XHJcblxyXG5cclxuICAgICAgdGhpcy5zZXRBc3NvY2lhdGlvbkF0dHJpYnV0ZSggJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcsIGFzc29jaWF0aW9uT2JqZWN0ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIG5ldyBhdHRyaWJ1dGUgdG8gdGhlIGVsZW1lbnQgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nLiBJdCB3aWxsIG90aGVyd2lzZSBiZSBudWxsIG9yIHVuZGVmaW5lZCBhbmQgc2hvdWxkXHJcbiAgICogdGhlbiBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuIFRoaXMgYWxsb3dzIGVtcHR5IHN0cmluZ3MgdG8gYmUgc2V0IGFzIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfHVuZGVmaW5lZH0gdmFsdWVcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGhhbmRsZUF0dHJpYnV0ZVdpdGhQRE9NT3B0aW9uKCBrZXksIHZhbHVlICkge1xyXG4gICAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZVRvRWxlbWVudCgga2V5LCB2YWx1ZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlRnJvbUVsZW1lbnQoIGtleSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGFsbCBwZG9tIGF0dHJpYnV0ZXMgb250byB0aGUgcGVlciBlbGVtZW50cyBmcm9tIHRoZSBtb2RlbCdzIHN0b3JlZCBkYXRhIG9iamVjdHNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtwZG9tT3B0aW9uc10gLSB0aGVzZSBjYW4gb3ZlcnJpZGUgdGhlIHZhbHVlcyBvZiB0aGUgbm9kZSwgc2VlIHRoaXMudXBkYXRlKClcclxuICAgKi9cclxuICBvbkF0dHJpYnV0ZUNoYW5nZSggcGRvbU9wdGlvbnMgKSB7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5ub2RlLnBkb21BdHRyaWJ1dGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBkYXRhT2JqZWN0ID0gdGhpcy5ub2RlLnBkb21BdHRyaWJ1dGVzWyBpIF07XHJcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlVG9FbGVtZW50KCBkYXRhT2JqZWN0LmF0dHJpYnV0ZSwgZGF0YU9iamVjdC52YWx1ZSwgZGF0YU9iamVjdC5vcHRpb25zICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWFudWFsbHkgc3VwcG9ydCBvcHRpb25zIHRoYXQgbWFwIHRvIGF0dHJpYnV0ZXMuIFRoaXMgY292ZXJzIHRoYXQgY2FzZSB3aGVyZSBiZWhhdmlvciBmdW5jdGlvbnMgd2FudCB0byBjaGFuZ2VcclxuICAgIC8vIHRoZXNlLCBidXQgdGhleSBhcmVuJ3QgaW4gbm9kZS5wZG9tQXR0cmlidXRlcy4gSXQgd2lsbCBkbyBkb3VibGUgd29yayBpbiBzb21lIGNhc2VzLCBidXQgaXQgaXMgcHJldHR5IG1pbm9yIGZvclxyXG4gICAgLy8gdGhlIGNvbXBsZXhpdHkgaXQgc2F2ZXMuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNDM2LiBFbXB0eSBzdHJpbmdzIHNob3VsZCBiZSBzZXR0YWJsZSBmb3JcclxuICAgIC8vIHRoZXNlIGF0dHJpYnV0ZXMgYnV0IG51bGwgYW5kIHVuZGVmaW5lZCBhcmUgaWdub3JlZC5cclxuICAgIHRoaXMuaGFuZGxlQXR0cmlidXRlV2l0aFBET01PcHRpb24oICdhcmlhLWxhYmVsJywgcGRvbU9wdGlvbnMuYXJpYUxhYmVsICk7XHJcbiAgICB0aGlzLmhhbmRsZUF0dHJpYnV0ZVdpdGhQRE9NT3B0aW9uKCAncm9sZScsIHBkb21PcHRpb25zLmFyaWFSb2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgYWxsIGNsYXNzZXMgb250byB0aGUgcGVlciBlbGVtZW50cyBmcm9tIHRoZSBtb2RlbCdzIHN0b3JlZCBkYXRhIG9iamVjdHNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIG9uQ2xhc3NDaGFuZ2UoKSB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLm5vZGUucGRvbUNsYXNzZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGRhdGFPYmplY3QgPSB0aGlzLm5vZGUucGRvbUNsYXNzZXNbIGkgXTtcclxuICAgICAgdGhpcy5zZXRDbGFzc1RvRWxlbWVudCggZGF0YU9iamVjdC5jbGFzc05hbWUsIGRhdGFPYmplY3Qub3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBpbnB1dCB2YWx1ZSBvbiB0aGUgcGVlcidzIHByaW1hcnkgc2libGluZyBlbGVtZW50LiBUaGUgdmFsdWUgYXR0cmlidXRlIG11c3QgYmUgc2V0IGFzIGEgUHJvcGVydHkgdG8gYmVcclxuICAgKiByZWdpc3RlcmVkIGNvcnJlY3RseSBieSBhbiBhc3Npc3RpdmUgZGV2aWNlLiBJZiBudWxsLCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgc28gdGhhdCB3ZSBkb24ndCBjbHV0dGVyIHRoZSBET01cclxuICAgKiB3aXRoIHZhbHVlPVwibnVsbFwiIGF0dHJpYnV0ZXMuXHJcbiAgICpcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIG9uSW5wdXRWYWx1ZUNoYW5nZSgpIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZS5pbnB1dFZhbHVlICE9PSB1bmRlZmluZWQsICd1c2UgbnVsbCB0byByZW1vdmUgaW5wdXQgdmFsdWUgYXR0cmlidXRlJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5ub2RlLmlucHV0VmFsdWUgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlRnJvbUVsZW1lbnQoICd2YWx1ZScgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gdHlwZSBjb252ZXJzaW9uIGZvciBET00gc3BlY1xyXG4gICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IGAke3RoaXMubm9kZS5pbnB1dFZhbHVlfWA7XHJcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlVG9FbGVtZW50KCAndmFsdWUnLCB2YWx1ZVN0cmluZywgeyBhc1Byb3BlcnR5OiB0cnVlIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbiBlbGVtZW50IG9uIHRoaXMgbm9kZSwgbG9va2VkIHVwIGJ5IHRoZSBlbGVtZW50TmFtZSBmbGFnIHBhc3NlZCBpbi5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGVsZW1lbnROYW1lIC0gc2VlIFBET01VdGlscyBmb3IgdmFsaWQgYXNzb2NpYXRpb25zXHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fVxyXG4gICAqL1xyXG4gIGdldEVsZW1lbnRCeU5hbWUoIGVsZW1lbnROYW1lICkge1xyXG4gICAgaWYgKCBlbGVtZW50TmFtZSA9PT0gUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcHJpbWFyeVNpYmxpbmc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggZWxlbWVudE5hbWUgPT09IFBET01QZWVyLkxBQkVMX1NJQkxJTkcgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9sYWJlbFNpYmxpbmc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggZWxlbWVudE5hbWUgPT09IFBET01QZWVyLkRFU0NSSVBUSU9OX1NJQkxJTkcgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggZWxlbWVudE5hbWUgPT09IFBET01QZWVyLkNPTlRBSU5FUl9QQVJFTlQgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXJQYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKCBgaW52YWxpZCBlbGVtZW50TmFtZSBuYW1lOiAke2VsZW1lbnROYW1lfWAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYSBhdHRyaWJ1dGUgb24gb25lIG9mIHRoZSBwZWVyJ3Mgd2luZG93LkVsZW1lbnRzLlxyXG4gICAqIEBwdWJsaWMgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZVxyXG4gICAqIEBwYXJhbSB7Kn0gYXR0cmlidXRlVmFsdWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgc2V0QXR0cmlidXRlVG9FbGVtZW50KCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZVZhbHVlLCBvcHRpb25zICkge1xyXG5cclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge1xyXG4gICAgICAvLyB7c3RyaW5nfG51bGx9IC0gSWYgbm9uLW51bGwsIHdpbGwgc2V0IHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWVzcGFjZS4gVGhpcyBjYW4gYmUgcmVxdWlyZWRcclxuICAgICAgLy8gZm9yIHNldHRpbmcgY2VydGFpbiBhdHRyaWJ1dGVzIChlLmcuIE1hdGhNTCkuXHJcbiAgICAgIG5hbWVzcGFjZTogbnVsbCxcclxuXHJcbiAgICAgIC8vIHNldCBhcyBhIGphdmFzY3JpcHQgcHJvcGVydHkgaW5zdGVhZCBvZiBhbiBhdHRyaWJ1dGUgb24gdGhlIERPTSBFbGVtZW50LlxyXG4gICAgICBhc1Byb3BlcnR5OiBmYWxzZSxcclxuXHJcbiAgICAgIGVsZW1lbnROYW1lOiBQUklNQVJZX1NJQkxJTkcsIC8vIHNlZSB0aGlzLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlcywgZGVmYXVsdCB0byB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcblxyXG4gICAgICAvLyB7SFRNTEVsZW1lbnR8bnVsbH0gLSBlbGVtZW50IHRoYXQgd2lsbCBkaXJlY3RseSByZWNlaXZlIHRoZSBpbnB1dCByYXRoZXIgdGhhbiBsb29raW5nIHVwIGJ5IG5hbWUsIGlmXHJcbiAgICAgIC8vIHByb3ZpZGVkLCBlbGVtZW50TmFtZSBvcHRpb24gd2lsbCBoYXZlIG5vIGVmZmVjdFxyXG4gICAgICBlbGVtZW50OiBudWxsXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudCB8fCB0aGlzLmdldEVsZW1lbnRCeU5hbWUoIG9wdGlvbnMuZWxlbWVudE5hbWUgKTtcclxuXHJcbiAgICAvLyBGb3IgZHluYW1pYyBzdHJpbmdzLCB3ZSBtYXkgbmVlZCB0byByZXRyaWV2ZSB0aGUgYWN0dWFsIHZhbHVlLlxyXG4gICAgY29uc3QgcmF3QXR0cmlidXRlVmFsdWUgPSBQRE9NVXRpbHMudW53cmFwUHJvcGVydHkoIGF0dHJpYnV0ZVZhbHVlICk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIGRpcmVjdGlvbmFsIGZvcm1hdHRpbmcgdGhhdCBtYXkgc3Vycm91bmQgc3RyaW5ncyBpZiB0aGV5IGFyZSB0cmFuc2xhdGFibGVcclxuICAgIGxldCBhdHRyaWJ1dGVWYWx1ZVdpdGhvdXRNYXJrcyA9IHJhd0F0dHJpYnV0ZVZhbHVlO1xyXG4gICAgaWYgKCB0eXBlb2YgcmF3QXR0cmlidXRlVmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICBhdHRyaWJ1dGVWYWx1ZVdpdGhvdXRNYXJrcyA9IHN0cmlwRW1iZWRkaW5nTWFya3MoIHJhd0F0dHJpYnV0ZVZhbHVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhdHRyaWJ1dGUgPT09IERJU0FCTEVEX0FUVFJJQlVURV9OQU1FICYmICF0aGlzLmRpc3BsYXkuaW50ZXJhY3RpdmUgKSB7XHJcblxyXG4gICAgICAvLyBUaGUgcHJlc2VuY2Ugb2YgdGhlIGBkaXNhYmxlZGAgYXR0cmlidXRlIG1lYW5zIGl0IGlzIGFsd2F5cyBkaXNhYmxlZC5cclxuICAgICAgdGhpcy5fcHJlc2VydmVkRGlzYWJsZWRWYWx1ZSA9IG9wdGlvbnMuYXNQcm9wZXJ0eSA/IGF0dHJpYnV0ZVZhbHVlV2l0aG91dE1hcmtzIDogdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIG9wdGlvbnMubmFtZXNwYWNlICkge1xyXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKCBvcHRpb25zLm5hbWVzcGFjZSwgYXR0cmlidXRlLCBhdHRyaWJ1dGVWYWx1ZVdpdGhvdXRNYXJrcyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIG9wdGlvbnMuYXNQcm9wZXJ0eSApIHtcclxuICAgICAgZWxlbWVudFsgYXR0cmlidXRlIF0gPSBhdHRyaWJ1dGVWYWx1ZVdpdGhvdXRNYXJrcztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSggYXR0cmlidXRlLCBhdHRyaWJ1dGVWYWx1ZVdpdGhvdXRNYXJrcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGF0dHJpYnV0ZSBmcm9tIG9uZSBvZiB0aGUgcGVlcidzIHdpbmRvdy5FbGVtZW50cy5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgcmVtb3ZlQXR0cmlidXRlRnJvbUVsZW1lbnQoIGF0dHJpYnV0ZSwgb3B0aW9ucyApIHtcclxuXHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHtcclxuICAgICAgLy8ge3N0cmluZ3xudWxsfSAtIElmIG5vbi1udWxsLCB3aWxsIHNldCB0aGUgYXR0cmlidXRlIHdpdGggdGhlIHNwZWNpZmllZCBuYW1lc3BhY2UuIFRoaXMgY2FuIGJlIHJlcXVpcmVkXHJcbiAgICAgIC8vIGZvciBzZXR0aW5nIGNlcnRhaW4gYXR0cmlidXRlcyAoZS5nLiBNYXRoTUwpLlxyXG4gICAgICBuYW1lc3BhY2U6IG51bGwsXHJcblxyXG4gICAgICBlbGVtZW50TmFtZTogUFJJTUFSWV9TSUJMSU5HLCAvLyBzZWUgdGhpcy5nZXRFbGVtZW50TmFtZSgpIGZvciB2YWxpZCB2YWx1ZXMsIGRlZmF1bHQgdG8gdGhlIHByaW1hcnkgc2libGluZ1xyXG5cclxuICAgICAgLy8ge0hUTUxFbGVtZW50fG51bGx9IC0gZWxlbWVudCB0aGF0IHdpbGwgZGlyZWN0bHkgcmVjZWl2ZSB0aGUgaW5wdXQgcmF0aGVyIHRoYW4gbG9va2luZyB1cCBieSBuYW1lLCBpZlxyXG4gICAgICAvLyBwcm92aWRlZCwgZWxlbWVudE5hbWUgb3B0aW9uIHdpbGwgaGF2ZSBubyBlZmZlY3RcclxuICAgICAgZWxlbWVudDogbnVsbFxyXG4gICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQgfHwgdGhpcy5nZXRFbGVtZW50QnlOYW1lKCBvcHRpb25zLmVsZW1lbnROYW1lICk7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLm5hbWVzcGFjZSApIHtcclxuICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGVOUyggb3B0aW9ucy5uYW1lc3BhY2UsIGF0dHJpYnV0ZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGF0dHJpYnV0ZSA9PT0gRElTQUJMRURfQVRUUklCVVRFX05BTUUgJiYgIXRoaXMuZGlzcGxheS5pbnRlcmFjdGl2ZSApIHtcclxuICAgICAgLy8gbWFpbnRhaW4gb3VyIGludGVyYWwgZGlzYWJsZWQgc3RhdGUgaW4gY2FzZSB0aGUgZGlzcGxheSB0b2dnbGVzIGJhY2sgdG8gYmUgaW50ZXJhY3RpdmUuXHJcbiAgICAgIHRoaXMuX3ByZXNlcnZlZERpc2FibGVkVmFsdWUgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgdGhlIGdpdmVuIGF0dHJpYnV0ZSBmcm9tIGFsbCBwZWVyIGVsZW1lbnRzXHJcbiAgICogQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlXHJcbiAgICovXHJcbiAgcmVtb3ZlQXR0cmlidXRlRnJvbUFsbEVsZW1lbnRzKCBhdHRyaWJ1dGUgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhdHRyaWJ1dGUgIT09IERJU0FCTEVEX0FUVFJJQlVURV9OQU1FLCAndGhpcyBtZXRob2QgZG9lcyBub3QgY3VycmVudGx5IHN1cHBvcnQgZGlzYWJsZWQsIHRvIG1ha2UgRGlzcGxheS5pbnRlcmFjdGl2ZSB0b2dnbGluZyBlYXNpZXIgdG8gaW1wbGVtZW50JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycgKTtcclxuICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nICYmIHRoaXMuX3ByaW1hcnlTaWJsaW5nLnJlbW92ZUF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgICB0aGlzLl9sYWJlbFNpYmxpbmcgJiYgdGhpcy5fbGFiZWxTaWJsaW5nLnJlbW92ZUF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgICB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcgJiYgdGhpcy5fZGVzY3JpcHRpb25TaWJsaW5nLnJlbW92ZUF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgICB0aGlzLl9jb250YWluZXJQYXJlbnQgJiYgdGhpcy5fY29udGFpbmVyUGFyZW50LnJlbW92ZUF0dHJpYnV0ZSggYXR0cmlidXRlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB0byB0aGUgZWxlbWVudCdzIGNsYXNzTGlzdC5cclxuICAgKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAqL1xyXG4gIHNldENsYXNzVG9FbGVtZW50KCBjbGFzc05hbWUsIG9wdGlvbnMgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgY2xhc3NOYW1lID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge1xyXG5cclxuICAgICAgLy8gTmFtZSBvZiB0aGUgZWxlbWVudCB3aG8gd2UgYXJlIGFkZGluZyB0aGUgY2xhc3MgdG8sIHNlZSB0aGlzLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlc1xyXG4gICAgICBlbGVtZW50TmFtZTogUFJJTUFSWV9TSUJMSU5HXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5nZXRFbGVtZW50QnlOYW1lKCBvcHRpb25zLmVsZW1lbnROYW1lICkuY2xhc3NMaXN0LmFkZCggY2xhc3NOYW1lICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgdGhlIHNwZWNpZmllZCBjbGFzc05hbWUgZnJvbSB0aGUgZWxlbWVudC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAqL1xyXG4gIHJlbW92ZUNsYXNzRnJvbUVsZW1lbnQoIGNsYXNzTmFtZSwgb3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBjbGFzc05hbWUgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gICAgb3B0aW9ucyA9IG1lcmdlKCB7XHJcblxyXG4gICAgICAvLyBOYW1lIG9mIHRoZSBlbGVtZW50IHdobyB3ZSBhcmUgcmVtb3ZpbmcgdGhlIGNsYXNzIGZyb20sIHNlZSB0aGlzLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlc1xyXG4gICAgICBlbGVtZW50TmFtZTogUFJJTUFSWV9TSUJMSU5HXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5nZXRFbGVtZW50QnlOYW1lKCBvcHRpb25zLmVsZW1lbnROYW1lICkuY2xhc3NMaXN0LnJlbW92ZSggY2xhc3NOYW1lICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgZWl0aGVyIGFzc29jaWF0aW9uIGF0dHJpYnV0ZSAoYXJpYS1sYWJlbGxlZGJ5L2Rlc2NyaWJlZGJ5KSBvbiBvbmUgb2YgdGhpcyBwZWVyJ3MgRWxlbWVudHNcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGUgLSBlaXRoZXIgYXJpYS1sYWJlbGxlZGJ5IG9yIGFyaWEtZGVzY3JpYmVkYnlcclxuICAgKiBAcGFyYW0ge09iamVjdH0gYXNzb2NpYXRpb25PYmplY3QgLSBzZWUgYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbigpIGZvciBzY2hlbWFcclxuICAgKi9cclxuICBzZXRBc3NvY2lhdGlvbkF0dHJpYnV0ZSggYXR0cmlidXRlLCBhc3NvY2lhdGlvbk9iamVjdCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBET01VdGlscy5BU1NPQ0lBVElPTl9BVFRSSUJVVEVTLmluZGV4T2YoIGF0dHJpYnV0ZSApID49IDAsXHJcbiAgICAgIGB1bnN1cHBvcnRlZCBhdHRyaWJ1dGUgZm9yIHNldHRpbmcgd2l0aCBhc3NvY2lhdGlvbiBvYmplY3Q6ICR7YXR0cmlidXRlfWAgKTtcclxuXHJcbiAgICBjb25zdCBvdGhlck5vZGVQRE9NSW5zdGFuY2VzID0gYXNzb2NpYXRpb25PYmplY3Qub3RoZXJOb2RlLmdldFBET01JbnN0YW5jZXMoKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgb3RoZXIgbm9kZSBoYXNuJ3QgYmVlbiBhZGRlZCB0byB0aGUgc2NlbmUgZ3JhcGggeWV0LCBpdCB3b24ndCBoYXZlIGFueSBhY2Nlc3NpYmxlIGluc3RhbmNlcywgc28gbm8gb3AuXHJcbiAgICAvLyBUaGlzIHdpbGwgYmUgcmVjYWxjdWxhdGVkIHdoZW4gdGhhdCBub2RlIGlzIGFkZGVkIHRvIHRoZSBzY2VuZSBncmFwaFxyXG4gICAgaWYgKCBvdGhlck5vZGVQRE9NSW5zdGFuY2VzLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAvLyBXZSBhcmUganVzdCB1c2luZyB0aGUgZmlyc3QgUERPTUluc3RhbmNlIGZvciBzaW1wbGljaXR5LCBidXQgaXQgaXMgT0sgYmVjYXVzZSB0aGUgYWNjZXNzaWJsZVxyXG4gICAgICAvLyBjb250ZW50IGZvciBhbGwgUERPTUluc3RhbmNlcyB3aWxsIGJlIHRoZSBzYW1lLCBzbyB0aGUgQWNjZXNzaWJsZSBOYW1lcyAoaW4gdGhlIGJyb3dzZXInc1xyXG4gICAgICAvLyBhY2Nlc3NpYmlsaXR5IHRyZWUpIG9mIGVsZW1lbnRzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpZCB3aWxsIGFsbCBoYXZlIHRoZSBzYW1lIGNvbnRlbnRcclxuICAgICAgY29uc3QgZmlyc3RQRE9NSW5zdGFuY2UgPSBvdGhlck5vZGVQRE9NSW5zdGFuY2VzWyAwIF07XHJcblxyXG4gICAgICAvLyBIYW5kbGUgYSBjYXNlIHdoZXJlIHlvdSBhcmUgYXNzb2NpYXRpbmcgdG8geW91cnNlbGYsIGFuZCB0aGUgcGVlciBoYXMgbm90IGJlZW4gY29uc3RydWN0ZWQgeWV0LlxyXG4gICAgICBpZiAoIGZpcnN0UERPTUluc3RhbmNlID09PSB0aGlzLnBkb21JbnN0YW5jZSApIHtcclxuICAgICAgICBmaXJzdFBET01JbnN0YW5jZS5wZWVyID0gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZmlyc3RQRE9NSW5zdGFuY2UucGVlciwgJ3BlZXIgc2hvdWxkIGV4aXN0JyApO1xyXG5cclxuICAgICAgLy8gd2UgY2FuIHVzZSB0aGUgc2FtZSBlbGVtZW50J3MgaWQgdG8gdXBkYXRlIGFsbCBvZiB0aGlzIE5vZGUncyBwZWVyc1xyXG4gICAgICBjb25zdCBvdGhlclBlZXJFbGVtZW50ID0gZmlyc3RQRE9NSW5zdGFuY2UucGVlci5nZXRFbGVtZW50QnlOYW1lKCBhc3NvY2lhdGlvbk9iamVjdC5vdGhlckVsZW1lbnROYW1lICk7XHJcblxyXG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5nZXRFbGVtZW50QnlOYW1lKCBhc3NvY2lhdGlvbk9iamVjdC50aGlzRWxlbWVudE5hbWUgKTtcclxuXHJcbiAgICAgIC8vIHRvIHN1cHBvcnQgYW55IG9wdGlvbiBvcmRlciwgbm8tb3AgaWYgdGhlIHBlZXIgZWxlbWVudCBoYXMgbm90IGJlZW4gY3JlYXRlZCB5ZXQuXHJcbiAgICAgIGlmICggZWxlbWVudCAmJiBvdGhlclBlZXJFbGVtZW50ICkge1xyXG5cclxuICAgICAgICAvLyBvbmx5IHVwZGF0ZSBhc3NvY2lhdGlvbnMgaWYgdGhlIHJlcXVlc3RlZCBwZWVyIGVsZW1lbnQgaGFzIGJlZW4gY3JlYXRlZFxyXG4gICAgICAgIC8vIE5PVEU6IGluIHRoZSBmdXR1cmUsIHdlIHdvdWxkIGxpa2UgdG8gdmVyaWZ5IHRoYXQgdGhlIGFzc29jaWF0aW9uIGV4aXN0cyBidXQgY2FuJ3QgZG8gdGhhdCB5ZXQgYmVjYXVzZVxyXG4gICAgICAgIC8vIHdlIGhhdmUgdG8gc3VwcG9ydCBjYXNlcyB3aGVyZSB3ZSBzZXQgbGFiZWwgYXNzb2NpYXRpb24gcHJpb3IgdG8gc2V0dGluZyB0aGUgc2libGluZy9wYXJlbnQgdGFnTmFtZVxyXG4gICAgICAgIGNvbnN0IHByZXZpb3VzQXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgfHwgJyc7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHByZXZpb3VzQXR0cmlidXRlVmFsdWUgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG5ld0F0dHJpYnV0ZVZhbHVlID0gWyBwcmV2aW91c0F0dHJpYnV0ZVZhbHVlLnRyaW0oKSwgb3RoZXJQZWVyRWxlbWVudC5pZCBdLmpvaW4oICcgJyApLnRyaW0oKTtcclxuXHJcbiAgICAgICAgLy8gYWRkIHRoZSBpZCBmcm9tIHRoZSBuZXcgYXNzb2NpYXRpb24gdG8gdGhlIHZhbHVlIG9mIHRoZSBIVE1MRWxlbWVudCdzIGF0dHJpYnV0ZS5cclxuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZVRvRWxlbWVudCggYXR0cmlidXRlLCBuZXdBdHRyaWJ1dGVWYWx1ZSwge1xyXG4gICAgICAgICAgZWxlbWVudE5hbWU6IGFzc29jaWF0aW9uT2JqZWN0LnRoaXNFbGVtZW50TmFtZVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGNvbnRlbnRFbGVtZW50IHdpbGwgZWl0aGVyIGJlIGEgbGFiZWwgb3IgZGVzY3JpcHRpb24gZWxlbWVudC4gVGhlIGNvbnRlbnRFbGVtZW50IHdpbGwgYmUgc29ydGVkIHJlbGF0aXZlIHRvXHJcbiAgICogdGhlIHByaW1hcnlTaWJsaW5nLiBJdHMgcGxhY2VtZW50IHdpbGwgYWxzbyBkZXBlbmQgb24gd2hldGhlciBvciBub3QgdGhpcyBub2RlIHdhbnRzIHRvIGFwcGVuZCB0aGlzIGVsZW1lbnQsXHJcbiAgICogc2VlIHNldEFwcGVuZExhYmVsKCkgYW5kIHNldEFwcGVuZERlc2NyaXB0aW9uKCkuIEJ5IGRlZmF1bHQsIHRoZSBcImNvbnRlbnRcIiBlbGVtZW50IHdpbGwgYmUgcGxhY2VkIGJlZm9yZSB0aGVcclxuICAgKiBwcmltYXJ5U2libGluZy5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgZnVuY3Rpb24gYXNzdW1lcyBpdCBpcyBjYWxsZWQgb24gbGFiZWwgc2libGluZyBiZWZvcmUgZGVzY3JpcHRpb24gc2libGluZyBmb3IgaW5zZXJ0aW5nIGVsZW1lbnRzXHJcbiAgICogaW50byB0aGUgY29ycmVjdCBvcmRlci5cclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250ZW50RWxlbWVudFxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXBwZW5kRWxlbWVudFxyXG4gICAqL1xyXG4gIGFycmFuZ2VDb250ZW50RWxlbWVudCggY29udGVudEVsZW1lbnQsIGFwcGVuZEVsZW1lbnQgKSB7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBjb250YWluZXJQYXJlbnRcclxuICAgIGlmICggdGhpcy50b3BMZXZlbEVsZW1lbnRzWyAwIF0gPT09IHRoaXMuX2NvbnRhaW5lclBhcmVudCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy50b3BMZXZlbEVsZW1lbnRzLmxlbmd0aCA9PT0gMSApO1xyXG5cclxuICAgICAgaWYgKCBhcHBlbmRFbGVtZW50ICkge1xyXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lclBhcmVudC5hcHBlbmRDaGlsZCggY29udGVudEVsZW1lbnQgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9jb250YWluZXJQYXJlbnQuaW5zZXJ0QmVmb3JlKCBjb250ZW50RWxlbWVudCwgdGhpcy5fcHJpbWFyeVNpYmxpbmcgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZXJlIGFyZSBtdWx0aXBsZSB0b3AgbGV2ZWwgbm9kZXNcclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8ga2VlcCB0aGlzLnRvcExldmVsRWxlbWVudHMgaW4gc3luY1xyXG4gICAgICBhcnJheVJlbW92ZSggdGhpcy50b3BMZXZlbEVsZW1lbnRzLCBjb250ZW50RWxlbWVudCApO1xyXG4gICAgICBjb25zdCBpbmRleE9mUHJpbWFyeVNpYmxpbmcgPSB0aGlzLnRvcExldmVsRWxlbWVudHMuaW5kZXhPZiggdGhpcy5fcHJpbWFyeVNpYmxpbmcgKTtcclxuXHJcbiAgICAgIC8vIGlmIGFwcGVuZGluZywganVzdCBpbnNlcnQgYXQgYXQgZW5kIG9mIHRoZSB0b3AgbGV2ZWwgZWxlbWVudHNcclxuICAgICAgY29uc3QgaW5zZXJ0SW5kZXggPSBhcHBlbmRFbGVtZW50ID8gdGhpcy50b3BMZXZlbEVsZW1lbnRzLmxlbmd0aCA6IGluZGV4T2ZQcmltYXJ5U2libGluZztcclxuICAgICAgdGhpcy50b3BMZXZlbEVsZW1lbnRzLnNwbGljZSggaW5zZXJ0SW5kZXgsIDAsIGNvbnRlbnRFbGVtZW50ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJcyB0aGlzIHBlZXIgaGlkZGVuIGluIHRoZSBQRE9NXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgaXNWaXNpYmxlKCkge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcblxyXG4gICAgICBsZXQgdmlzaWJsZUVsZW1lbnRzID0gMDtcclxuICAgICAgdGhpcy50b3BMZXZlbEVsZW1lbnRzLmZvckVhY2goIGVsZW1lbnQgPT4ge1xyXG5cclxuICAgICAgICAvLyBzdXBwb3J0IHByb3BlcnR5IG9yIGF0dHJpYnV0ZVxyXG4gICAgICAgIGlmICggIWVsZW1lbnQuaGlkZGVuICYmICFlbGVtZW50Lmhhc0F0dHJpYnV0ZSggJ2hpZGRlbicgKSApIHtcclxuICAgICAgICAgIHZpc2libGVFbGVtZW50cyArPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICBhc3NlcnQoIHRoaXMudmlzaWJsZSA/IHZpc2libGVFbGVtZW50cyA9PT0gdGhpcy50b3BMZXZlbEVsZW1lbnRzLmxlbmd0aCA6IHZpc2libGVFbGVtZW50cyA9PT0gMCxcclxuICAgICAgICAnc29tZSBvZiB0aGUgcGVlclxcJ3MgZWxlbWVudHMgYXJlIHZpc2libGUgYW5kIHNvbWUgYXJlIG5vdCcgKTtcclxuXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy52aXNpYmxlID09PSBudWxsID8gdHJ1ZSA6IHRoaXMudmlzaWJsZTsgLy8gZGVmYXVsdCB0byB0cnVlIGlmIHZpc2liaWxpdHkgaGFzbid0IGJlZW4gc2V0IHlldC5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB3aGV0aGVyIG9yIG5vdCB0aGUgcGVlciBpcyB2aXNpYmxlIGluIHRoZSBQRE9NXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSB2aXNpYmxlXHJcbiAgICovXHJcbiAgc2V0VmlzaWJsZSggdmlzaWJsZSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB2aXNpYmxlID09PSAnYm9vbGVhbicgKTtcclxuICAgIGlmICggdGhpcy52aXNpYmxlICE9PSB2aXNpYmxlICkge1xyXG5cclxuICAgICAgdGhpcy52aXNpYmxlID0gdmlzaWJsZTtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy50b3BMZXZlbEVsZW1lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLnRvcExldmVsRWxlbWVudHNbIGkgXTtcclxuICAgICAgICBpZiAoIHZpc2libGUgKSB7XHJcbiAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZUZyb21FbGVtZW50KCAnaGlkZGVuJywgeyBlbGVtZW50OiBlbGVtZW50IH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZVRvRWxlbWVudCggJ2hpZGRlbicsICcnLCB7IGVsZW1lbnQ6IGVsZW1lbnQgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW52YWxpZGF0ZSBDU1MgdHJhbnNmb3JtcyBiZWNhdXNlIHdoZW4gJ2hpZGRlbicgdGhlIGNvbnRlbnQgd2lsbCBoYXZlIG5vIGRpbWVuc2lvbnMgaW4gdGhlIHZpZXdwb3J0LiBGb3JcclxuICAgICAgLy8gYSBTYWZhcmkgVm9pY2VPdmVyIGJ1ZywgYWxzbyBmb3JjZSBhIHJlZmxvdyBpbiB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUgdG8gZW5zdXJlIHRoYXQgdGhlIGFjY2Vzc2libGUgbmFtZSBpc1xyXG4gICAgICAvLyBjb3JyZWN0LlxyXG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyB3aGVuIHRoZSBidWcgaXMgZml4ZWQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYTExeS1yZXNlYXJjaC9pc3N1ZXMvMTkzXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUNTU1Bvc2l0aW9uaW5nKCBwbGF0Zm9ybS5zYWZhcmkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgaWYgdGhpcyBwZWVyIGlzIGZvY3VzZWQuIEEgcGVlciBpcyBmb2N1c2VkIGlmIGl0cyBwcmltYXJ5U2libGluZyBpcyBmb2N1c2VkLlxyXG4gICAqIEBwdWJsaWMgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgaXNGb2N1c2VkKCkge1xyXG4gICAgY29uc3QgdmlzdWFsRm9jdXNUcmFpbCA9IFBET01JbnN0YW5jZS5ndWVzc1Zpc3VhbFRyYWlsKCB0aGlzLnRyYWlsLCB0aGlzLmRpc3BsYXkucm9vdE5vZGUgKTtcclxuXHJcbiAgICByZXR1cm4gRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c1Byb3BlcnR5LnZhbHVlICYmIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS52YWx1ZS50cmFpbC5lcXVhbHMoIHZpc3VhbEZvY3VzVHJhaWwgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvY3VzIHRoZSBwcmltYXJ5IHNpYmxpbmcgb2YgdGhlIHBlZXIuXHJcbiAgICogQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBmb2N1cygpIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3ByaW1hcnlTaWJsaW5nLCAnbXVzdCBoYXZlIGEgcHJpbWFyeSBzaWJsaW5nIHRvIGZvY3VzJyApO1xyXG5cclxuICAgIC8vIFdlIGRvIG5vdCBzdXBwb3J0IG1hbnVhbGx5IGNhbGxpbmcgZm9jdXMgb24gYW4gaW52aXNpYmxlIEhUTUwgZWxlbWVudCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMjkwXHJcbiAgICAvLyBUT0RPOiBzdXBwb3J0IHRoaXMgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEyOTBcclxuICAgIC8vIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNWaXNpYmxlKCksICdjYW5ub3QgZm9jdXMoKSBhbiBpbnZpc2libGUgZWxlbWVudCcgKTtcclxuXHJcbiAgICAvLyBXZSBkbyBub3Qgd2FudCB0byBzdGVhbCBmb2N1cyBmcm9tIGFueSBwYXJlbnQgYXBwbGljYXRpb24uIEZvciBleGFtcGxlLCBpZiB0aGlzIGVsZW1lbnQgaXMgaW4gYW4gaWZyYW1lLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvODk3LlxyXG4gICAgaWYgKCBGb2N1c01hbmFnZXIud2luZG93SGFzRm9jdXNQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgdGhpcy5fcHJpbWFyeVNpYmxpbmcuZm9jdXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJsdXIgdGhlIHByaW1hcnkgc2libGluZyBvZiB0aGUgcGVlci5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIGJsdXIoKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9wcmltYXJ5U2libGluZywgJ211c3QgaGF2ZSBhIHByaW1hcnkgc2libGluZyB0byBibHVyJyApO1xyXG5cclxuICAgIC8vIG5vIG9wIGJ5IHRoZSBicm93c2VyIGlmIHByaW1hcnkgc2libGluZyBkb2VzIG5vdCBoYXZlIGZvY3VzXHJcbiAgICB0aGlzLl9wcmltYXJ5U2libGluZy5ibHVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlIHRoZSBwZWVyIGZvY3VzYWJsZS4gT25seSB0aGUgcHJpbWFyeSBzaWJsaW5nIGlzIGV2ZXIgY29uc2lkZXJlZCBmb2N1c2FibGUuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9jdXNhYmxlXHJcbiAgICovXHJcbiAgc2V0Rm9jdXNhYmxlKCBmb2N1c2FibGUgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgZm9jdXNhYmxlID09PSAnYm9vbGVhbicgKTtcclxuXHJcbiAgICBjb25zdCBwZWVySGFkRm9jdXMgPSB0aGlzLmlzRm9jdXNlZCgpO1xyXG4gICAgaWYgKCB0aGlzLmZvY3VzYWJsZSAhPT0gZm9jdXNhYmxlICkge1xyXG4gICAgICB0aGlzLmZvY3VzYWJsZSA9IGZvY3VzYWJsZTtcclxuICAgICAgUERPTVV0aWxzLm92ZXJyaWRlRm9jdXNXaXRoVGFiSW5kZXgoIHRoaXMucHJpbWFyeVNpYmxpbmcsIGZvY3VzYWJsZSApO1xyXG5cclxuICAgICAgLy8gaW4gQ2hyb21lLCBpZiB0YWJpbmRleCBpcyByZW1vdmVkIGFuZCB0aGUgZWxlbWVudCBpcyBub3QgZm9jdXNhYmxlIGJ5IGRlZmF1bHQgdGhlIGVsZW1lbnQgaXMgYmx1cnJlZC5cclxuICAgICAgLy8gVGhpcyBiZWhhdmlvciBpcyByZWFzb25hYmxlIGFuZCB3ZSB3YW50IHRvIGVuZm9yY2UgaXQgaW4gb3RoZXIgYnJvd3NlcnMgZm9yIGNvbnNpc3RlbmN5LiBTZWVcclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzk2N1xyXG4gICAgICBpZiAoIHBlZXJIYWRGb2N1cyAmJiAhZm9jdXNhYmxlICkge1xyXG4gICAgICAgIHRoaXMuYmx1cigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXBvc2l0aW9uIHRoZSBzaWJsaW5nIGluIHRoZSBET00sIHNpbmNlIG5vbi1mb2N1c2FibGUgbm9kZXMgYXJlIG5vdCBwb3NpdGlvbmVkXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUNTU1Bvc2l0aW9uaW5nKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXNwb25zaWJsZSBmb3Igc2V0dGluZyB0aGUgY29udGVudCBmb3IgdGhlIGxhYmVsIHNpYmxpbmdcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IGNvbnRlbnQgLSB0aGUgY29udGVudCBmb3IgdGhlIGxhYmVsIHNpYmxpbmcuXHJcbiAgICovXHJcbiAgc2V0TGFiZWxTaWJsaW5nQ29udGVudCggY29udGVudCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbnRlbnQgPT09IG51bGwgfHwgdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnLCAnaW5jb3JyZWN0IGxhYmVsIGNvbnRlbnQgdHlwZScgKTtcclxuXHJcbiAgICAvLyBuby1vcCB0byBzdXBwb3J0IGFueSBvcHRpb24gb3JkZXJcclxuICAgIGlmICggIXRoaXMuX2xhYmVsU2libGluZyApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIFBET01VdGlscy5zZXRUZXh0Q29udGVudCggdGhpcy5fbGFiZWxTaWJsaW5nLCBjb250ZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXNwb25zaWJsZSBmb3Igc2V0dGluZyB0aGUgY29udGVudCBmb3IgdGhlIGRlc2NyaXB0aW9uIHNpYmxpbmdcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IGNvbnRlbnQgLSB0aGUgY29udGVudCBmb3IgdGhlIGRlc2NyaXB0aW9uIHNpYmxpbmcuXHJcbiAgICovXHJcbiAgc2V0RGVzY3JpcHRpb25TaWJsaW5nQ29udGVudCggY29udGVudCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbnRlbnQgPT09IG51bGwgfHwgdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnLCAnaW5jb3JyZWN0IGRlc2NyaXB0aW9uIGNvbnRlbnQgdHlwZScgKTtcclxuXHJcbiAgICAvLyBuby1vcCB0byBzdXBwb3J0IGFueSBvcHRpb24gb3JkZXJcclxuICAgIGlmICggIXRoaXMuX2Rlc2NyaXB0aW9uU2libGluZyApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgUERPTVV0aWxzLnNldFRleHRDb250ZW50KCB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcsIGNvbnRlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3BvbnNpYmxlIGZvciBzZXR0aW5nIHRoZSBjb250ZW50IGZvciB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgICogQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBjb250ZW50IC0gdGhlIGNvbnRlbnQgZm9yIHRoZSBwcmltYXJ5IHNpYmxpbmcuXHJcbiAgICovXHJcbiAgc2V0UHJpbWFyeVNpYmxpbmdDb250ZW50KCBjb250ZW50ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY29udGVudCA9PT0gbnVsbCB8fCB0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycsICdpbmNvcnJlY3QgaW5uZXIgY29udGVudCB0eXBlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wZG9tSW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoID09PSAwLCAnZGVzY2VuZGFudHMgZXhpc3Qgd2l0aCBhY2Nlc3NpYmxlIGNvbnRlbnQsIGlubmVyQ29udGVudCBjYW5ub3QgYmUgdXNlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBET01VdGlscy50YWdOYW1lU3VwcG9ydHNDb250ZW50KCB0aGlzLl9wcmltYXJ5U2libGluZy50YWdOYW1lICksXHJcbiAgICAgIGB0YWdOYW1lOiAke3RoaXMubm9kZS50YWdOYW1lfSBkb2VzIG5vdCBzdXBwb3J0IGlubmVyIGNvbnRlbnRgICk7XHJcblxyXG4gICAgLy8gbm8tb3AgdG8gc3VwcG9ydCBhbnkgb3B0aW9uIG9yZGVyXHJcbiAgICBpZiAoICF0aGlzLl9wcmltYXJ5U2libGluZyApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgUERPTVV0aWxzLnNldFRleHRDb250ZW50KCB0aGlzLl9wcmltYXJ5U2libGluZywgY29udGVudCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUgc28gdGhhdCB0aGUgcHJpbWFyeSBzaWJsaW5nIHdpbGwgYmUgdHJhbnNmb3JtZWQgd2l0aCBjaGFuZ2VzIHRvIGFsb25nIHRoZVxyXG4gICAqIHVuaXF1ZSB0cmFpbCB0byB0aGUgc291cmNlIG5vZGUuIElmIG51bGwsIHJlcG9zaXRpb25pbmcgaGFwcGVucyB3aXRoIHRyYW5zZm9ybSBjaGFuZ2VzIGFsb25nIHRoaXNcclxuICAgKiBwZG9tSW5zdGFuY2UncyB0cmFpbC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0gey4uL25vZGVzL05vZGV8bnVsbH0gbm9kZVxyXG4gICAqL1xyXG4gIHNldFBET01UcmFuc2Zvcm1Tb3VyY2VOb2RlKCBub2RlICkge1xyXG5cclxuICAgIC8vIHJlbW92ZSBwcmV2aW91cyBsaXN0ZW5lcnMgYmVmb3JlIGNyZWF0aW5nIGEgbmV3IFRyYW5zZm9ybVRyYWNrZXJcclxuICAgIHRoaXMucGRvbUluc3RhbmNlLnRyYW5zZm9ybVRyYWNrZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgIHRoaXMucGRvbUluc3RhbmNlLnVwZGF0ZVRyYW5zZm9ybVRyYWNrZXIoIG5vZGUgKTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzIGJhY2sgYWZ0ZXIgdXBkYXRlXHJcbiAgICB0aGlzLnBkb21JbnN0YW5jZS50cmFuc2Zvcm1UcmFja2VyLmFkZExpc3RlbmVyKCB0aGlzLnRyYW5zZm9ybUxpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gbmV3IHRyYWlsIHdpdGggdHJhbnNmb3JtcyBzbyBwb3NpdGlvbmluZyBpcyBwcm9iYWJseSBkaXJ0eVxyXG4gICAgdGhpcy5pbnZhbGlkYXRlQ1NTUG9zaXRpb25pbmcoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIHBvc2l0aW9uaW5nIG9mIHRoZSBzaWJsaW5nIGVsZW1lbnRzLiBHZW5lcmFsbHkgdGhpcyBpcyByZXF1aXJlZGZvciBhY2Nlc3NpYmlsaXR5IHRvIHdvcmsgb25cclxuICAgKiB0b3VjaCBzY3JlZW4gYmFzZWQgc2NyZWVuIHJlYWRlcnMgbGlrZSBwaG9uZXMuIEJ1dCByZXBvc2l0aW9uaW5nIERPTSBlbGVtZW50cyBpcyBleHBlbnNpdmUuIFRoaXMgY2FuIGJlIHNldCB0b1xyXG4gICAqIGZhbHNlIHRvIG9wdGltaXplIHdoZW4gcG9zaXRpb25pbmcgaXMgbm90IG5lY2Vzc2FyeS5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBwb3NpdGlvbkluUERPTVxyXG4gICAqL1xyXG4gIHNldFBvc2l0aW9uSW5QRE9NKCBwb3NpdGlvbkluUERPTSApIHtcclxuICAgIHRoaXMucG9zaXRpb25JblBET00gPSBwb3NpdGlvbkluUERPTTtcclxuXHJcbiAgICAvLyBzaWduaWZ5IHRoYXQgaXQgbmVlZHMgdG8gYmUgcmVwb3NpdGlvbmVkIG5leHQgZnJhbWUsIGVpdGhlciBvZmYgc2NyZWVuIG9yIHRvIG1hdGNoXHJcbiAgICAvLyBncmFwaGljYWwgcmVuZGVyaW5nXHJcbiAgICB0aGlzLmludmFsaWRhdGVDU1NQb3NpdGlvbmluZygpO1xyXG4gIH1cclxuXHJcbiAgLy8gQHByaXZhdGVcclxuICBnZXRFbGVtZW50SWQoIHNpYmxpbmdOYW1lLCBzdHJpbmdJZCApIHtcclxuICAgIHJldHVybiBgZGlzcGxheSR7dGhpcy5kaXNwbGF5LmlkfS0ke3NpYmxpbmdOYW1lfS0ke3N0cmluZ0lkfWA7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgdXBkYXRlSW5kaWNlc1N0cmluZ0FuZEVsZW1lbnRJZHMoKSB7XHJcbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5wZG9tSW5zdGFuY2UuZ2V0UERPTUluc3RhbmNlVW5pcXVlSWQoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3ByaW1hcnlTaWJsaW5nICkge1xyXG5cclxuICAgICAgLy8gTk9URTogZGF0YXNldCBpc24ndCBzdXBwb3J0ZWQgYnkgYWxsIG5hbWVzcGFjZXMgKGxpa2UgTWF0aE1MKSBzbyB3ZSBuZWVkIHRvIHVzZSBzZXRBdHRyaWJ1dGVcclxuICAgICAgdGhpcy5fcHJpbWFyeVNpYmxpbmcuc2V0QXR0cmlidXRlKCBQRE9NVXRpbHMuREFUQV9QRE9NX1VOSVFVRV9JRCwgaW5kaWNlcyApO1xyXG4gICAgICB0aGlzLl9wcmltYXJ5U2libGluZy5pZCA9IHRoaXMuZ2V0RWxlbWVudElkKCAncHJpbWFyeScsIGluZGljZXMgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5fbGFiZWxTaWJsaW5nICkge1xyXG5cclxuICAgICAgLy8gTk9URTogZGF0YXNldCBpc24ndCBzdXBwb3J0ZWQgYnkgYWxsIG5hbWVzcGFjZXMgKGxpa2UgTWF0aE1MKSBzbyB3ZSBuZWVkIHRvIHVzZSBzZXRBdHRyaWJ1dGVcclxuICAgICAgdGhpcy5fbGFiZWxTaWJsaW5nLnNldEF0dHJpYnV0ZSggUERPTVV0aWxzLkRBVEFfUERPTV9VTklRVUVfSUQsIGluZGljZXMgKTtcclxuICAgICAgdGhpcy5fbGFiZWxTaWJsaW5nLmlkID0gdGhpcy5nZXRFbGVtZW50SWQoICdsYWJlbCcsIGluZGljZXMgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5fZGVzY3JpcHRpb25TaWJsaW5nICkge1xyXG5cclxuICAgICAgLy8gTk9URTogZGF0YXNldCBpc24ndCBzdXBwb3J0ZWQgYnkgYWxsIG5hbWVzcGFjZXMgKGxpa2UgTWF0aE1MKSBzbyB3ZSBuZWVkIHRvIHVzZSBzZXRBdHRyaWJ1dGVcclxuICAgICAgdGhpcy5fZGVzY3JpcHRpb25TaWJsaW5nLnNldEF0dHJpYnV0ZSggUERPTVV0aWxzLkRBVEFfUERPTV9VTklRVUVfSUQsIGluZGljZXMgKTtcclxuICAgICAgdGhpcy5fZGVzY3JpcHRpb25TaWJsaW5nLmlkID0gdGhpcy5nZXRFbGVtZW50SWQoICdkZXNjcmlwdGlvbicsIGluZGljZXMgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5fY29udGFpbmVyUGFyZW50ICkge1xyXG5cclxuICAgICAgLy8gTk9URTogZGF0YXNldCBpc24ndCBzdXBwb3J0ZWQgYnkgYWxsIG5hbWVzcGFjZXMgKGxpa2UgTWF0aE1MKSBzbyB3ZSBuZWVkIHRvIHVzZSBzZXRBdHRyaWJ1dGVcclxuICAgICAgdGhpcy5fY29udGFpbmVyUGFyZW50LnNldEF0dHJpYnV0ZSggUERPTVV0aWxzLkRBVEFfUERPTV9VTklRVUVfSUQsIGluZGljZXMgKTtcclxuICAgICAgdGhpcy5fY29udGFpbmVyUGFyZW50LmlkID0gdGhpcy5nZXRFbGVtZW50SWQoICdjb250YWluZXInLCBpbmRpY2VzICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXJrIHRoYXQgdGhlIHNpYmxpbmdzIG9mIHRoaXMgUERPTVBlZXIgbmVlZCB0byBiZSB1cGRhdGVkIGluIHRoZSBuZXh0IERpc3BsYXkgdXBkYXRlLiBQb3NzaWJseSBmcm9tIGFcclxuICAgKiBjaGFuZ2Ugb2YgYWNjZXNzaWJsZSBjb250ZW50IG9yIG5vZGUgdHJhbnNmb3JtYXRpb24uIERvZXMgbm90aGluZyBpZiBhbHJlYWR5IG1hcmtlZCBkaXJ0eS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbZm9yY2VSZWZsb3dXb3JrYXJvdW5kXSAtIEluIGFkZGl0aW9uIHRvIHJlcG9zaXRpb25pbmcsIGZvcmNlIGEgcmVmbG93IG5leHQgYW5pbWF0aW9uIGZyYW1lPyBTZWVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcmNlUmVmbG93V29ya2Fyb3VuZCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGludmFsaWRhdGVDU1NQb3NpdGlvbmluZyggZm9yY2VSZWZsb3dXb3JrYXJvdW5kID0gZmFsc2UgKSB7XHJcbiAgICBpZiAoICF0aGlzLnBvc2l0aW9uRGlydHkgKSB7XHJcbiAgICAgIHRoaXMucG9zaXRpb25EaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoIGZvcmNlUmVmbG93V29ya2Fyb3VuZCApIHtcclxuICAgICAgICB0aGlzLmZvcmNlUmVmbG93V29ya2Fyb3VuZCA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIGB0cmFuc2Zvcm09c2NhbGUoMSlgIGZvcmNlcyBhIHJlZmxvdyBzbyB3ZSBjYW4gc2V0IHRoaXMgYW5kIHJldmVydCBpdCBpbiB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuXHJcbiAgICAgICAgLy8gVHJhbnNmb3JtIGlzIHVzZWQgaW5zdGVhZCBvZiBgZGlzcGxheT0nbm9uZSdgIGJlY2F1c2UgY2hhbmdpbmcgZGlzcGxheSBpbXBhY3RzIGZvY3VzLlxyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMudG9wTGV2ZWxFbGVtZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIHRoaXMudG9wTGV2ZWxFbGVtZW50c1sgaSBdLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBtYXJrIGFsbCBhbmNlc3RvcnMgb2YgdGhpcyBwZWVyIHNvIHRoYXQgd2UgY2FuIHF1aWNrbHkgZmluZCB0aGlzIGRpcnR5IHBlZXIgd2hlbiB3ZSB0cmF2ZXJzZVxyXG4gICAgICAvLyB0aGUgUERPTUluc3RhbmNlIHRyZWVcclxuICAgICAgbGV0IHBhcmVudCA9IHRoaXMucGRvbUluc3RhbmNlLnBhcmVudDtcclxuICAgICAgd2hpbGUgKCBwYXJlbnQgKSB7XHJcbiAgICAgICAgcGFyZW50LnBlZXIuY2hpbGRQb3NpdGlvbkRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgdGhlIENTUyBwb3NpdGlvbmluZyBvZiB0aGUgcHJpbWFyeSBhbmQgbGFiZWwgc2libGluZ3MuIFJlcXVpcmVkIHRvIHN1cHBvcnQgYWNjZXNzaWJpbGl0eSBvbiBtb2JpbGVcclxuICAgKiBkZXZpY2VzLiBPbiBhY3RpdmF0aW9uIG9mIGZvY3VzYWJsZSBlbGVtZW50cywgY2VydGFpbiBBVCB3aWxsIHNlbmQgZmFrZSBwb2ludGVyIGV2ZW50cyB0byB0aGUgYnJvd3NlciBhdFxyXG4gICAqIHRoZSBjZW50ZXIgb2YgdGhlIGNsaWVudCBib3VuZGluZyByZWN0YW5nbGUgb2YgdGhlIEhUTUwgZWxlbWVudC4gQnkgcG9zaXRpb25pbmcgZWxlbWVudHMgb3ZlciBncmFwaGljYWwgZGlzcGxheVxyXG4gICAqIG9iamVjdHMgd2UgY2FuIGNhcHR1cmUgdGhvc2UgZXZlbnRzLiBBIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBpcyBjYWxjdWxhdGVkIHRoYXQgd2lsbCB0cmFuc2Zvcm0gdGhlIHBvc2l0aW9uXHJcbiAgICogYW5kIGRpbWVuc2lvbiBvZiB0aGUgSFRNTCBlbGVtZW50IGluIHBpeGVscyB0byB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuIFRoZSBtYXRyaXggaXMgdXNlZCB0byB0cmFuc2Zvcm1cclxuICAgKiB0aGUgYm91bmRzIG9mIHRoZSBlbGVtZW50IHByaW9yIHRvIGFueSBvdGhlciB0cmFuc2Zvcm1hdGlvbiBzbyB3ZSBjYW4gc2V0IHRoZSBlbGVtZW50J3MgbGVmdCwgdG9wLCB3aWR0aCwgYW5kXHJcbiAgICogaGVpZ2h0IHdpdGggQ1NTIGF0dHJpYnV0ZXMuXHJcbiAgICpcclxuICAgKiBGb3Igbm93IHdlIGFyZSBvbmx5IHRyYW5zZm9ybWluZyB0aGUgcHJpbWFyeSBhbmQgbGFiZWwgc2libGluZ3MgaWYgdGhlIHByaW1hcnkgc2libGluZyBpcyBmb2N1c2FibGUuIElmXHJcbiAgICogZm9jdXNhYmxlLCB0aGUgcHJpbWFyeSBzaWJsaW5nIG5lZWRzIHRvIGJlIHRyYW5zZm9ybWVkIHRvIHJlY2VpdmUgdXNlciBpbnB1dC4gVm9pY2VPdmVyIGluY2x1ZGVzIHRoZSBsYWJlbCBib3VuZHNcclxuICAgKiBpbiBpdHMgY2FsY3VsYXRpb24gZm9yIHdoZXJlIHRvIHNlbmQgdGhlIGV2ZW50cywgc28gaXQgbmVlZHMgdG8gYmUgdHJhbnNmb3JtZWQgYXMgd2VsbC4gRGVzY3JpcHRpb25zIGFyZSBub3RcclxuICAgKiBjb25zaWRlcmVkIGFuZCBkbyBub3QgbmVlZCB0byBiZSBwb3NpdGlvbmVkLlxyXG4gICAqXHJcbiAgICogSW5pdGlhbGx5LCB3ZSB0cmllZCB0byBzZXQgdGhlIENTUyB0cmFuc2Zvcm1hdGlvbnMgb24gZWxlbWVudHMgZGlyZWN0bHkgdGhyb3VnaCB0aGUgdHJhbnNmb3JtIGF0dHJpYnV0ZS4gV2hpbGVcclxuICAgKiB0aGlzIHdvcmtlZCBmb3IgYmFzaWMgaW5wdXQsIGl0IGRpZCBub3Qgc3VwcG9ydCBvdGhlciBBVCBmZWF0dXJlcyBsaWtlIHRhcHBpbmcgdGhlIHNjcmVlbiB0byBmb2N1cyBlbGVtZW50cy5cclxuICAgKiBXaXRoIHRoaXMgc3RyYXRlZ3ksIHRoZSBWb2ljZU92ZXIgXCJ0b3VjaCBhcmVhXCIgd2FzIGEgc21hbGwgYm94IGFyb3VuZCB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSBlbGVtZW50LiBJdCB3YXNcclxuICAgKiBuZXZlciBjbGVhciB3aHkgdGhpcyB3YXMgdGhpcyBjYXNlLCBidXQgZm9yY2VkIHVzIHRvIGNoYW5nZSBvdXIgc3RyYXRlZ3kgdG8gc2V0IHRoZSBsZWZ0LCB0b3AsIHdpZHRoLCBhbmQgaGVpZ2h0XHJcbiAgICogYXR0cmlidXRlcyBpbnN0ZWFkLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBhc3N1bWVzIHRoYXQgZWxlbWVudHMgaGF2ZSBvdGhlciBzdHlsZSBhdHRyaWJ1dGVzIHNvIHRoZXkgY2FuIGJlIHBvc2l0aW9uZWQgY29ycmVjdGx5IGFuZCBkb24ndFxyXG4gICAqIGludGVyZmVyZSB3aXRoIHNjZW5lcnkgaW5wdXQsIHNlZSBTY2VuZXJ5U3R5bGUgaW4gUERPTVV0aWxzLlxyXG4gICAqXHJcbiAgICogQWRkaXRpb25hbCBub3RlcyB3ZXJlIHRha2VuIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NTIsIHNlZSB0aGF0IGlzc3VlIGZvciBtb3JlXHJcbiAgICogaW5mb3JtYXRpb24uXHJcbiAgICpcclxuICAgKiBSZXZpZXc6IFRoaXMgZnVuY3Rpb24gY291bGQgYmUgc2ltcGxpZmllZCBieSBzZXR0aW5nIHRoZSBlbGVtZW50IHdpZHRoL2hlaWdodCBhIHNtYWxsIGFyYml0cmFyeSBzaGFwZVxyXG4gICAqIGF0IHRoZSBjZW50ZXIgb2YgdGhlIG5vZGUncyBnbG9iYWwgYm91bmRzLiBUaGVyZSBpcyBhIGRyYXdiYWNrIGluIHRoYXQgdGhlIFZPIGRlZmF1bHQgaGlnaGxpZ2h0IHdvbid0XHJcbiAgICogc3Vycm91bmQgdGhlIE5vZGUgYW55bW9yZS4gQnV0IGl0IGNvdWxkIGJlIGEgcGVyZm9ybWFuY2UgZW5oYW5jZW1lbnQgYW5kIHNpbXBsaWZ5IHRoaXMgZnVuY3Rpb24uXHJcbiAgICogT3IgbWF5YmUgYSBiaWcgcmVjdGFuZ2xlIGxhcmdlciB0aGFuIHRoZSBEaXNwbGF5IGRpdiBzdGlsbCBjZW50ZXJlZCBvbiB0aGUgbm9kZSBzbyB3ZSBuZXZlclxyXG4gICAqIHNlZSB0aGUgVk8gaGlnaGxpZ2h0P1xyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBwb3NpdGlvbkVsZW1lbnRzKCBwb3NpdGlvbkluUERPTSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3ByaW1hcnlTaWJsaW5nLCAnYSBwcmltYXJ5IHNpYmxpbmcgcmVxdWlyZWQgdG8gcmVjZWl2ZSBDU1MgcG9zaXRpb25pbmcnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBvc2l0aW9uRGlydHksICdlbGVtZW50cyBzaG91bGQgb25seSBiZSByZXBvc2l0aW9uZWQgaWYgZGlydHknICk7XHJcblxyXG4gICAgLy8gQ1NTIHRyYW5zZm9ybWF0aW9uIG9ubHkgbmVlZHMgdG8gYmUgYXBwbGllZCBpZiB0aGUgbm9kZSBpcyBmb2N1c2FibGUgLSBvdGhlcndpc2UgdGhlIGVsZW1lbnQgd2lsbCBiZSBmb3VuZFxyXG4gICAgLy8gYnkgZ2VzdHVyZSBuYXZpZ2F0aW9uIHdpdGggdGhlIHZpcnR1YWwgY3Vyc29yLiBCb3VuZHMgZm9yIG5vbi1mb2N1c2FibGUgZWxlbWVudHMgaW4gdGhlIFZpZXdQb3J0IGRvbid0XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFjY3VyYXRlIGJlY2F1c2UgdGhlIEFUIGRvZXNuJ3QgbmVlZCB0byBzZW5kIGV2ZW50cyB0byB0aGVtLlxyXG4gICAgaWYgKCBwb3NpdGlvbkluUERPTSApIHtcclxuICAgICAgY29uc3QgdHJhbnNmb3JtU291cmNlTm9kZSA9IHRoaXMubm9kZS5wZG9tVHJhbnNmb3JtU291cmNlTm9kZSB8fCB0aGlzLm5vZGU7XHJcblxyXG4gICAgICBzY3JhdGNoR2xvYmFsQm91bmRzLnNldCggdHJhbnNmb3JtU291cmNlTm9kZS5sb2NhbEJvdW5kcyApO1xyXG4gICAgICBpZiAoIHNjcmF0Y2hHbG9iYWxCb3VuZHMuaXNGaW5pdGUoKSApIHtcclxuICAgICAgICBzY3JhdGNoR2xvYmFsQm91bmRzLnRyYW5zZm9ybSggdGhpcy5wZG9tSW5zdGFuY2UudHJhbnNmb3JtVHJhY2tlci5nZXRNYXRyaXgoKSApO1xyXG5cclxuICAgICAgICAvLyBubyBuZWVkIHRvIHBvc2l0aW9uIGlmIHRoZSBub2RlIGlzIGZ1bGx5IG91dHNpZGUgb2YgdGhlIERpc3BsYXkgYm91bmRzIChvdXQgb2YgdmlldylcclxuICAgICAgICBjb25zdCBkaXNwbGF5Qm91bmRzID0gdGhpcy5kaXNwbGF5LmJvdW5kcztcclxuICAgICAgICBpZiAoIGRpc3BsYXlCb3VuZHMuaW50ZXJzZWN0c0JvdW5kcyggc2NyYXRjaEdsb2JhbEJvdW5kcyApICkge1xyXG5cclxuICAgICAgICAgIC8vIENvbnN0cmFpbiB0aGUgZ2xvYmFsIGJvdW5kcyB0byBEaXNwbGF5IGJvdW5kcyBzbyB0aGF0IGNlbnRlciBvZiB0aGUgc2libGluZyBlbGVtZW50XHJcbiAgICAgICAgICAvLyBpcyBhbHdheXMgaW4gdGhlIERpc3BsYXkuIFdlIG1heSBtaXNzIGlucHV0IGlmIHRoZSBjZW50ZXIgb2YgdGhlIE5vZGUgaXMgb3V0c2lkZVxyXG4gICAgICAgICAgLy8gdGhlIERpc3BsYXksIHdoZXJlIFZvaWNlT3ZlciB3b3VsZCBvdGhlcndpc2Ugc2VuZCBwb2ludGVyIGV2ZW50cy5cclxuICAgICAgICAgIHNjcmF0Y2hHbG9iYWxCb3VuZHMuY29uc3RyYWluQm91bmRzKCBkaXNwbGF5Qm91bmRzICk7XHJcblxyXG4gICAgICAgICAgbGV0IGNsaWVudERpbWVuc2lvbnMgPSBnZXRDbGllbnREaW1lbnNpb25zKCB0aGlzLl9wcmltYXJ5U2libGluZyApO1xyXG4gICAgICAgICAgbGV0IGNsaWVudFdpZHRoID0gY2xpZW50RGltZW5zaW9ucy53aWR0aDtcclxuICAgICAgICAgIGxldCBjbGllbnRIZWlnaHQgPSBjbGllbnREaW1lbnNpb25zLmhlaWdodDtcclxuXHJcbiAgICAgICAgICBpZiAoIGNsaWVudFdpZHRoID4gMCAmJiBjbGllbnRIZWlnaHQgPiAwICkge1xyXG4gICAgICAgICAgICBzY3JhdGNoU2libGluZ0JvdW5kcy5zZXRNaW5NYXgoIDAsIDAsIGNsaWVudFdpZHRoLCBjbGllbnRIZWlnaHQgKTtcclxuICAgICAgICAgICAgc2NyYXRjaFNpYmxpbmdCb3VuZHMudHJhbnNmb3JtKCBnZXRDU1NNYXRyaXgoIGNsaWVudFdpZHRoLCBjbGllbnRIZWlnaHQsIHNjcmF0Y2hHbG9iYWxCb3VuZHMgKSApO1xyXG4gICAgICAgICAgICBzZXRDbGllbnRCb3VuZHMoIHRoaXMuX3ByaW1hcnlTaWJsaW5nLCBzY3JhdGNoU2libGluZ0JvdW5kcyApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICggdGhpcy5sYWJlbFNpYmxpbmcgKSB7XHJcbiAgICAgICAgICAgIGNsaWVudERpbWVuc2lvbnMgPSBnZXRDbGllbnREaW1lbnNpb25zKCB0aGlzLl9sYWJlbFNpYmxpbmcgKTtcclxuICAgICAgICAgICAgY2xpZW50V2lkdGggPSBjbGllbnREaW1lbnNpb25zLndpZHRoO1xyXG4gICAgICAgICAgICBjbGllbnRIZWlnaHQgPSBjbGllbnREaW1lbnNpb25zLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIGlmICggY2xpZW50SGVpZ2h0ID4gMCAmJiBjbGllbnRXaWR0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgc2NyYXRjaFNpYmxpbmdCb3VuZHMuc2V0TWluTWF4KCAwLCAwLCBjbGllbnRXaWR0aCwgY2xpZW50SGVpZ2h0ICk7XHJcbiAgICAgICAgICAgICAgc2NyYXRjaFNpYmxpbmdCb3VuZHMudHJhbnNmb3JtKCBnZXRDU1NNYXRyaXgoIGNsaWVudFdpZHRoLCBjbGllbnRIZWlnaHQsIHNjcmF0Y2hHbG9iYWxCb3VuZHMgKSApO1xyXG4gICAgICAgICAgICAgIHNldENsaWVudEJvdW5kcyggdGhpcy5fbGFiZWxTaWJsaW5nLCBzY3JhdGNoU2libGluZ0JvdW5kcyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIG5vdCBwb3NpdGlvbmluZywganVzdCBtb3ZlIG9mZiBzY3JlZW5cclxuICAgICAgc2NyYXRjaFNpYmxpbmdCb3VuZHMuc2V0KCBQRE9NUGVlci5PRkZTQ1JFRU5fU0lCTElOR19CT1VORFMgKTtcclxuICAgICAgc2V0Q2xpZW50Qm91bmRzKCB0aGlzLl9wcmltYXJ5U2libGluZywgc2NyYXRjaFNpYmxpbmdCb3VuZHMgKTtcclxuICAgICAgaWYgKCB0aGlzLl9sYWJlbFNpYmxpbmcgKSB7XHJcbiAgICAgICAgc2V0Q2xpZW50Qm91bmRzKCB0aGlzLl9sYWJlbFNpYmxpbmcsIHNjcmF0Y2hTaWJsaW5nQm91bmRzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuZm9yY2VSZWZsb3dXb3JrYXJvdW5kICkge1xyXG5cclxuICAgICAgLy8gRm9yY2UgYSByZWZsb3cgKHJlY2FsY3VsYXRpb24gb2YgRE9NIGxheW91dCkgdG8gZml4IHRoZSBhY2Nlc3NpYmxlIG5hbWUuXHJcbiAgICAgIHRoaXMudG9wTGV2ZWxFbGVtZW50cy5mb3JFYWNoKCBlbGVtZW50ID0+IHtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICcnOyAvLyBmb3JjZSByZWZsb3cgcmVxdWVzdCBieSByZW1vdmluZyB0aGUgdHJhbnNmb3JtIGFkZGVkIGluIHRoZSBwcmV2aW91cyBmcmFtZVxyXG4gICAgICAgIGVsZW1lbnQuc3R5bGUub2Zmc2V0SGVpZ2h0OyAvLyBxdWVyeSB0aGUgb2Zmc2V0SGVpZ2h0IGFmdGVyIHJlc3RvcmluZyBkaXNwbGF5IHRvIGZvcmNlIHJlZmxvd1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wb3NpdGlvbkRpcnR5ID0gZmFsc2U7XHJcbiAgICB0aGlzLmZvcmNlUmVmbG93V29ya2Fyb3VuZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHBvc2l0aW9uaW5nIG9mIGVsZW1lbnRzIGluIHRoZSBQRE9NLiBEb2VzIGEgZGVwdGggZmlyc3Qgc2VhcmNoIGZvciBhbGwgZGVzY2VuZGFudHMgb2YgcGFyZW50SW50c2FuY2Ugd2l0aFxyXG4gICAqIGEgcGVlciB0aGF0IGVpdGhlciBoYXMgZGlydHkgcG9zaXRpb25pbmcgb3IgYXMgYSBkZXNjZW5kYW50IHdpdGggZGlydHkgcG9zaXRpb25pbmcuXHJcbiAgICpcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHVwZGF0ZVN1YnRyZWVQb3NpdGlvbmluZyggcGFyZW50UG9zaXRpb25JblBET00gPSBmYWxzZSApIHtcclxuICAgIHRoaXMuY2hpbGRQb3NpdGlvbkRpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgY29uc3QgcG9zaXRpb25JblBET00gPSB0aGlzLnBvc2l0aW9uSW5QRE9NIHx8IHBhcmVudFBvc2l0aW9uSW5QRE9NO1xyXG5cclxuICAgIGlmICggdGhpcy5wb3NpdGlvbkRpcnR5ICkge1xyXG4gICAgICB0aGlzLnBvc2l0aW9uRWxlbWVudHMoIHBvc2l0aW9uSW5QRE9NICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5wZG9tSW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkUGVlciA9IHRoaXMucGRvbUluc3RhbmNlLmNoaWxkcmVuWyBpIF0ucGVlcjtcclxuICAgICAgaWYgKCBjaGlsZFBlZXIucG9zaXRpb25EaXJ0eSB8fCBjaGlsZFBlZXIuY2hpbGRQb3NpdGlvbkRpcnR5ICkge1xyXG4gICAgICAgIHRoaXMucGRvbUluc3RhbmNlLmNoaWxkcmVuWyBpIF0ucGVlci51cGRhdGVTdWJ0cmVlUG9zaXRpb25pbmcoIHBvc2l0aW9uSW5QRE9NICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY3Vyc2l2ZWx5IHNldCB0aGlzIFBET01QZWVyIGFuZCBjaGlsZHJlbiB0byBiZSBkaXNhYmxlZC4gVGhpcyB3aWxsIG92ZXJ3cml0ZSBhbnkgcHJldmlvdXMgdmFsdWUgb2YgZGlzYWJsZWRcclxuICAgKiB0aGF0IG1heSBoYXZlIGJlZW4gc2V0LCBidXQgd2lsbCBrZWVwIHRyYWNrIG9mIHRoZSBvbGQgdmFsdWUsIGFuZCByZXN0b3JlIGl0cyBzdGF0ZSB1cG9uIHJlLWVuYWJsaW5nLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZGlzYWJsZWRcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgcmVjdXJzaXZlRGlzYWJsZSggZGlzYWJsZWQgKSB7XHJcblxyXG4gICAgaWYgKCBkaXNhYmxlZCApIHtcclxuICAgICAgdGhpcy5fcHJlc2VydmVkRGlzYWJsZWRWYWx1ZSA9IHRoaXMuX3ByaW1hcnlTaWJsaW5nLmRpc2FibGVkO1xyXG4gICAgICB0aGlzLl9wcmltYXJ5U2libGluZy5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5fcHJpbWFyeVNpYmxpbmcuZGlzYWJsZWQgPSB0aGlzLl9wcmVzZXJ2ZWREaXNhYmxlZFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMucGRvbUluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLnBkb21JbnN0YW5jZS5jaGlsZHJlblsgaSBdLnBlZXIucmVjdXJzaXZlRGlzYWJsZSggZGlzYWJsZWQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgZXh0ZXJuYWwgcmVmZXJlbmNlcyBmcm9tIHRoaXMgcGVlciwgYW5kIHBsYWNlcyBpdCBpbiB0aGUgcG9vbC5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICB0aGlzLmlzRGlzcG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIHJlbW92ZSBmb2N1cyBpZiB0aGUgZGlzcG9zZWQgcGVlciBpcyB0aGUgYWN0aXZlIGVsZW1lbnRcclxuICAgIHRoaXMuYmx1cigpO1xyXG5cclxuICAgIC8vIHJlbW92ZSBsaXN0ZW5lcnNcclxuICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdibHVyJywgdGhpcy5ibHVyRXZlbnRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5fcHJpbWFyeVNpYmxpbmcucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2ZvY3VzJywgdGhpcy5mb2N1c0V2ZW50TGlzdGVuZXIgKTtcclxuICAgIHRoaXMucGRvbUluc3RhbmNlLnRyYW5zZm9ybVRyYWNrZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgIHRoaXMubXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgLy8gemVyby1vdXQgcmVmZXJlbmNlc1xyXG4gICAgdGhpcy5wZG9tSW5zdGFuY2UgPSBudWxsO1xyXG4gICAgdGhpcy5ub2RlID0gbnVsbDtcclxuICAgIHRoaXMuZGlzcGxheSA9IG51bGw7XHJcbiAgICB0aGlzLnRyYWlsID0gbnVsbDtcclxuICAgIHRoaXMuX3ByaW1hcnlTaWJsaW5nID0gbnVsbDtcclxuICAgIHRoaXMuX2xhYmVsU2libGluZyA9IG51bGw7XHJcbiAgICB0aGlzLl9kZXNjcmlwdGlvblNpYmxpbmcgPSBudWxsO1xyXG4gICAgdGhpcy5fY29udGFpbmVyUGFyZW50ID0gbnVsbDtcclxuICAgIHRoaXMuZm9jdXNhYmxlID0gbnVsbDtcclxuXHJcbiAgICAvLyBmb3Igbm93XHJcbiAgICB0aGlzLmZyZWVUb1Bvb2woKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIEBwdWJsaWMge3N0cmluZ30gLSBzcGVjaWZpZXMgdmFsaWQgYXNzb2NpYXRpb25zIGJldHdlZW4gcmVsYXRlZCBQRE9NUGVlcnMgaW4gdGhlIERPTVxyXG5QRE9NUGVlci5QUklNQVJZX1NJQkxJTkcgPSBQUklNQVJZX1NJQkxJTkc7IC8vIGFzc29jaWF0ZSB3aXRoIGFsbCBhY2Nlc3NpYmxlIGNvbnRlbnQgcmVsYXRlZCB0byB0aGlzIHBlZXJcclxuUERPTVBlZXIuTEFCRUxfU0lCTElORyA9IExBQkVMX1NJQkxJTkc7IC8vIGFzc29jaWF0ZSB3aXRoIGp1c3QgdGhlIGxhYmVsIGNvbnRlbnQgb2YgdGhpcyBwZWVyXHJcblBET01QZWVyLkRFU0NSSVBUSU9OX1NJQkxJTkcgPSBERVNDUklQVElPTl9TSUJMSU5HOyAvLyBhc3NvY2lhdGUgd2l0aCBqdXN0IHRoZSBkZXNjcmlwdGlvbiBjb250ZW50IG9mIHRoaXMgcGVlclxyXG5QRE9NUGVlci5DT05UQUlORVJfUEFSRU5UID0gQ09OVEFJTkVSX1BBUkVOVDsgLy8gYXNzb2NpYXRlIHdpdGggZXZlcnl0aGluZyB1bmRlciB0aGUgY29udGFpbmVyIHBhcmVudCBvZiB0aGlzIHBlZXJcclxuXHJcbi8vIEBwdWJsaWMgKHNjZW5lcnktaW50ZXJuYWwpIC0gYm91bmRzIGZvciBhIHNpYmxpbmcgdGhhdCBzaG91bGQgYmUgbW92ZWQgb2ZmLXNjcmVlbiB3aGVuIG5vdCBwb3NpdGlvbmluZywgaW5cclxuLy8gZ2xvYmFsIGNvb3JkaW5hdGVzXHJcblBET01QZWVyLk9GRlNDUkVFTl9TSUJMSU5HX0JPVU5EUyA9IG5ldyBCb3VuZHMyKCAwLCAwLCAxLCAxICk7XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUERPTVBlZXInLCBQRE9NUGVlciApO1xyXG5cclxuLy8gU2V0IHVwIHBvb2xpbmdcclxuUG9vbGFibGUubWl4SW50byggUERPTVBlZXIsIHtcclxuICBpbml0aWFsaXplOiBQRE9NUGVlci5wcm90b3R5cGUuaW5pdGlhbGl6ZVBET01QZWVyXHJcbn0gKTtcclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gSGVscGVyIGZ1bmN0aW9uc1xyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgc2libGluZyBlbGVtZW50IGZvciB0aGUgUERPTVBlZXIuXHJcbiAqIFRPRE86IHRoaXMgc2hvdWxkIGJlIGlubGluZWQgd2l0aCB0aGUgUERPTVV0aWxzIG1ldGhvZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZvY3VzYWJsZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gcGFzc2VkIGFsb25nIHRvIFBET01VdGlscy5jcmVhdGVFbGVtZW50XHJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQoIHRhZ05hbWUsIGZvY3VzYWJsZSwgb3B0aW9ucyApIHtcclxuICBvcHRpb25zID0gbWVyZ2UoIHtcclxuXHJcbiAgICAvLyB7c3RyaW5nfG51bGx9IC0gYWRkaXRpb24gdG8gdGhlIHRyYWlsSWQsIHNlcGFyYXRlZCBieSBhIGh5cGhlbiB0byBpZGVudGlmeSB0aGUgZGlmZmVyZW50IHNpYmxpbmdzIHdpdGhpblxyXG4gICAgLy8gdGhlIGRvY3VtZW50XHJcbiAgICBzaWJsaW5nTmFtZTogbnVsbCxcclxuXHJcbiAgICAvLyB7Ym9vbGVhbn0gLSBpZiB0cnVlLCBET00gaW5wdXQgZXZlbnRzIHJlY2VpdmVkIG9uIHRoZSBlbGVtZW50IHdpbGwgbm90IGJlIGRpc3BhdGNoZWQgYXMgU2NlbmVyeUV2ZW50cyBpbiBJbnB1dC5qc1xyXG4gICAgLy8gc2VlIFBhcmFsbGVsRE9NLnNldEV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgIGV4Y2x1ZGVGcm9tSW5wdXQ6IGZhbHNlXHJcbiAgfSwgb3B0aW9ucyApO1xyXG5cclxuICBjb25zdCBuZXdFbGVtZW50ID0gUERPTVV0aWxzLmNyZWF0ZUVsZW1lbnQoIHRhZ05hbWUsIGZvY3VzYWJsZSwgb3B0aW9ucyApO1xyXG5cclxuICBpZiAoIG9wdGlvbnMuZXhjbHVkZUZyb21JbnB1dCApIHtcclxuICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKCBQRE9NVXRpbHMuREFUQV9FWENMVURFX0ZST01fSU5QVVQsIHRydWUgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXdFbGVtZW50O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGEgbWF0cml4IHRoYXQgY2FuIGJlIHVzZWQgYXMgdGhlIENTUyB0cmFuc2Zvcm0gZm9yIGVsZW1lbnRzIGluIHRoZSBET00uIFRoaXMgbWF0cml4IHdpbGwgYW4gSFRNTCBlbGVtZW50XHJcbiAqIGRpbWVuc2lvbnMgaW4gcGl4ZWxzIHRvIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICpcclxuICogQHBhcmFtICB7bnVtYmVyfSBjbGllbnRXaWR0aCAtIHdpZHRoIG9mIHRoZSBlbGVtZW50IHRvIHRyYW5zZm9ybSBpbiBwaXhlbHNcclxuICogQHBhcmFtICB7bnVtYmVyfSBjbGllbnRIZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGVsZW1lbnQgdG8gdHJhbnNmb3JtIGluIHBpeGVsc1xyXG4gKiBAcGFyYW0gIHtCb3VuZHMyfSBub2RlR2xvYmFsQm91bmRzIC0gQm91bmRzIG9mIHRoZSBQRE9NUGVlcidzIG5vZGUgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gKiBAcmV0dXJucyB7TWF0cml4M31cclxuICovXHJcbmZ1bmN0aW9uIGdldENTU01hdHJpeCggY2xpZW50V2lkdGgsIGNsaWVudEhlaWdodCwgbm9kZUdsb2JhbEJvdW5kcyApIHtcclxuXHJcbiAgLy8gdGhlIHRyYW5zbGF0aW9uIG1hdHJpeCBmb3IgdGhlIG5vZGUncyBib3VuZHMgaW4gaXRzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWVcclxuICBnbG9iYWxOb2RlVHJhbnNsYXRpb25NYXRyaXguc2V0VG9UcmFuc2xhdGlvbiggbm9kZUdsb2JhbEJvdW5kcy5taW5YLCBub2RlR2xvYmFsQm91bmRzLm1pblkgKTtcclxuXHJcbiAgLy8gc2NhbGUgbWF0cml4IGZvciBcImNsaWVudFwiIEhUTUwgZWxlbWVudCwgc2NhbGUgdG8gbWFrZSB0aGUgSFRNTCBlbGVtZW50J3MgRE9NIGJvdW5kcyBtYXRjaCB0aGVcclxuICAvLyBsb2NhbCBib3VuZHMgb2YgdGhlIG5vZGVcclxuICBnbG9iYWxUb0NsaWVudFNjYWxlTWF0cml4LnNldFRvU2NhbGUoIG5vZGVHbG9iYWxCb3VuZHMud2lkdGggLyBjbGllbnRXaWR0aCwgbm9kZUdsb2JhbEJvdW5kcy5oZWlnaHQgLyBjbGllbnRIZWlnaHQgKTtcclxuXHJcbiAgLy8gY29tYmluZSB0aGVzZSBpbiBhIHNpbmdsZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcclxuICByZXR1cm4gZ2xvYmFsTm9kZVRyYW5zbGF0aW9uTWF0cml4Lm11bHRpcGx5TWF0cml4KCBnbG9iYWxUb0NsaWVudFNjYWxlTWF0cml4ICkubXVsdGlwbHlNYXRyaXgoIG5vZGVTY2FsZU1hZ25pdHVkZU1hdHJpeCApO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhbiBvYmplY3Qgd2l0aCB0aGUgd2lkdGggYW5kIGhlaWdodCBvZiBhbiBIVE1MIGVsZW1lbnQgaW4gcGl4ZWxzLCBwcmlvciB0byBhbnkgc2NhbGluZy4gY2xpZW50V2lkdGggYW5kXHJcbiAqIGNsaWVudEhlaWdodCBhcmUgemVybyBmb3IgZWxlbWVudHMgd2l0aCBpbmxpbmUgbGF5b3V0IGFuZCBlbGVtZW50cyB3aXRob3V0IENTUy4gRm9yIHRob3NlIGVsZW1lbnRzIHdlIGZhbGwgYmFja1xyXG4gKiB0byB0aGUgYm91bmRpbmdDbGllbnRSZWN0LCB3aGljaCBhdCB0aGF0IHBvaW50IHdpbGwgZGVzY3JpYmUgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGVsZW1lbnQgcHJpb3IgdG8gc2NhbGluZy5cclxuICpcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHNpYmxpbmdFbGVtZW50XHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0d28gZW50cmllcywgeyB3aWR0aDoge251bWJlcn0sIGhlaWdodDoge251bWJlcn0gfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Q2xpZW50RGltZW5zaW9ucyggc2libGluZ0VsZW1lbnQgKSB7XHJcbiAgbGV0IGNsaWVudFdpZHRoID0gc2libGluZ0VsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgbGV0IGNsaWVudEhlaWdodCA9IHNpYmxpbmdFbGVtZW50LmNsaWVudEhlaWdodDtcclxuXHJcbiAgaWYgKCBjbGllbnRXaWR0aCA9PT0gMCAmJiBjbGllbnRIZWlnaHQgPT09IDAgKSB7XHJcbiAgICBjb25zdCBjbGllbnRSZWN0ID0gc2libGluZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBjbGllbnRXaWR0aCA9IGNsaWVudFJlY3Qud2lkdGg7XHJcbiAgICBjbGllbnRIZWlnaHQgPSBjbGllbnRSZWN0LmhlaWdodDtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IHdpZHRoOiBjbGllbnRXaWR0aCwgaGVpZ2h0OiBjbGllbnRIZWlnaHQgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgYm91bmRzIG9mIHRoZSBzaWJsaW5nIGVsZW1lbnQgaW4gdGhlIHZpZXcgcG9ydCBpbiBwaXhlbHMsIHVzaW5nIHRvcCwgbGVmdCwgd2lkdGgsIGFuZCBoZWlnaHQgY3NzLlxyXG4gKiBUaGUgZWxlbWVudCBtdXN0IGJlIHN0eWxlZCB3aXRoICdwb3NpdGlvbjogZml4ZWQnLCBhbmQgYW4gYW5jZXN0b3IgbXVzdCBoYXZlIHBvc2l0aW9uOiAncmVsYXRpdmUnLCBzbyB0aGF0XHJcbiAqIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBzaWJsaW5nIGFyZSByZWxhdGl2ZSB0byB0aGUgcGFyZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzaWJsaW5nRWxlbWVudCAtIHRoZSBlbGVtZW50IHRvIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSB7Qm91bmRzMn0gYm91bmRzIC0gZGVzaXJlZCBib3VuZHMsIGluIHBpeGVsc1xyXG4gKi9cclxuZnVuY3Rpb24gc2V0Q2xpZW50Qm91bmRzKCBzaWJsaW5nRWxlbWVudCwgYm91bmRzICkge1xyXG4gIHNpYmxpbmdFbGVtZW50LnN0eWxlLnRvcCA9IGAke2JvdW5kcy50b3B9cHhgO1xyXG4gIHNpYmxpbmdFbGVtZW50LnN0eWxlLmxlZnQgPSBgJHtib3VuZHMubGVmdH1weGA7XHJcbiAgc2libGluZ0VsZW1lbnQuc3R5bGUud2lkdGggPSBgJHtib3VuZHMud2lkdGh9cHhgO1xyXG4gIHNpYmxpbmdFbGVtZW50LnN0eWxlLmhlaWdodCA9IGAke2JvdW5kcy5oZWlnaHR9cHhgO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQRE9NUGVlcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsT0FBTyxNQUFNLCtCQUErQjtBQUNuRCxPQUFPQyxXQUFXLE1BQU0seUNBQXlD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