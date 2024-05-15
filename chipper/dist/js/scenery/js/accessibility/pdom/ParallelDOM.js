// Copyright 2021-2024, University of Colorado Boulder

/**
 * A superclass for Node, adding accessibility by defining content for the Parallel DOM. Please note that Node and
 * ParallelDOM are closely intertwined, though they are separated into separate files in the type hierarchy.
 *
 * The Parallel DOM is an HTML structure that provides semantics for assistive technologies. For web content to be
 * accessible, assistive technologies require HTML markup, which is something that pure graphical content does not
 * include. This adds the accessible HTML content for any Node in the scene graph.
 *
 * Any Node can have pdom content, but they have to opt into it. The structure of the pdom content will
 * match the structure of the scene graph.
 *
 * Say we have the following scene graph:
 *
 *   A
 *  / \
 * B   C
 *    / \
 *   D   E
 *        \
 *         F
 *
 * And say that nodes A, B, C, D, and F specify pdom content for the DOM.  Scenery will render the pdom
 * content like so:
 *
 * <div id="node-A">
 *   <div id="node-B"></div>
 *   <div id="node-C">
 *     <div id="node-D"></div>
 *     <div id="node-F"></div>
 *   </div>
 * </div>
 *
 * In this example, each element is represented by a div, but any HTML element could be used. Note that in this example,
 * node E did not specify pdom content, so node F was added as a child under node C.  If node E had specified
 * pdom content, content for node F would have been added as a child under the content for node E.
 *
 * --------------------------------------------------------------------------------------------------------------------
 * #BASIC EXAMPLE
 *
 * In a basic example let's say that we want to make a Node an unordered list. To do this, add the `tagName` option to
 * the Node, and assign it to the string "ul". Here is what the code could look like:
 *
 * var myUnorderedList = new Node( { tagName: 'ul' } );
 *
 * To get the desired list html, we can assign the `li` `tagName` to children Nodes, like:
 *
 * var listItem1 = new Node( { tagName: 'li' } );
 * myUnorderedList.addChild( listItem1 );
 *
 * Now we have a single list element in the unordered list. To assign content to this <li>, use the `innerContent`
 * option (all of these Node options have getters and setters, just like any other Node option):
 *
 * listItem1.innerContent = 'I am list item number 1';
 *
 * The above operations will create the following PDOM structure (note that actual ids will be different):
 *
 * <ul id='myUnorderedList'>
 *   <li>I am a list item number 1</li>
 * </ul
 *
 * --------------------------------------------------------------------------------------------------------------------
 * #DOM SIBLINGS
 *
 * The API in this class allows you to add additional structure to the accessible DOM content if necessary. Each node
 * can have multiple DOM Elements associated with it. A Node can have a label DOM element, and a description DOM element.
 * These are called siblings. The Node's direct DOM element (the DOM element you create with the `tagName` option)
 * is called the "primary sibling." You can also have a container parent DOM element that surrounds all of these
 * siblings. With three siblings and a container parent, each Node can have up to 4 DOM Elements representing it in the
 * PDOM. Here is an example of how a Node may use these features:
 *
 * <div>
 *   <label for="myInput">This great label for input</label
 *   <input id="myInput"/>
 *   <p>This is a description for the input</p>
 * </div>
 *
 * Although you can create this structure with four nodes (`input` A, `label B, and `p` C children to `div` D),
 * this structure can be created with one single Node. It is often preferable to do this to limit the number of new
 * Nodes that have to be created just for accessibility purposes. To accomplish this we have the following Node code.
 *
 * new Node( {
 *  tagName: 'input'
 *  labelTagName: 'label',
 *  labelContent: 'This great label for input'
 *  descriptionTagName: 'p',
 *  descriptionContent: 'This is a description for the input',
 *  containerTagName: 'div'
 * });
 *
 * A few notes:
 * 1. Only the primary sibling (specified by tagName) is focusable. Using a focusable element through another element
 *    (like labelTagName) will result in buggy behavior.
 * 2. Notice the names of the content setters for siblings parallel the `innerContent` option for setting the primary
 *    sibling.
 * 3. To make this example actually work, you would need the `inputType` option to set the "type" attribute on the `input`.
 * 4. When you specify the  <label> tag for the label sibling, the "for" attribute is automatically added to the sibling.
 * 5. Finally, the example above doesn't utilize the default tags that we have in place for the parent and siblings.
 *      default labelTagName: 'p'
 *      default descriptionTagName: 'p'
 *      default containerTagName: 'div'
 *    so the following will yield the same PDOM structure:
 *
 *    new Node( {
 *     tagName: 'input',
 *     labelTagName: 'label',
 *     labelContent: 'This great label for input'
 *     descriptionContent: 'This is a description for the input',
 *    });
 *
 * The ParallelDOM class is smart enough to know when there needs to be a container parent to wrap multiple siblings,
 * it is not necessary to use that option unless the desired tag name is  something other than 'div'.
 *
 * --------------------------------------------------------------------------------------------------------------------
 *
 * For additional accessibility options, please see the options listed in ACCESSIBILITY_OPTION_KEYS. To understand the
 * PDOM more, see PDOMPeer, which manages the DOM Elements for a node. For more documentation on Scenery, Nodes,
 * and the scene graph, please see http://phetsims.github.io/scenery/
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import TinyEmitter from '../../../../axon/js/TinyEmitter.js';
import validate from '../../../../axon/js/validate.js';
import Validation from '../../../../axon/js/Validation.js';
import arrayDifference from '../../../../phet-core/js/arrayDifference.js';
import PhetioObject from '../../../../tandem/js/PhetioObject.js';
import { Node, PDOMDisplaysInfo, PDOMPeer, PDOMTree, PDOMUtils, scenery, Trail } from '../../imports.js';
import optionize from '../../../../phet-core/js/optionize.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import { isTReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import isSettingPhetioStateProperty from '../../../../tandem/js/isSettingPhetioStateProperty.js';
import TinyForwardingProperty from '../../../../axon/js/TinyForwardingProperty.js';
const INPUT_TAG = PDOMUtils.TAGS.INPUT;
const P_TAG = PDOMUtils.TAGS.P;

// default tag names for siblings
const DEFAULT_DESCRIPTION_TAG_NAME = P_TAG;
const DEFAULT_LABEL_TAG_NAME = P_TAG;
// see setPDOMHeadingBehavior for more details
const DEFAULT_PDOM_HEADING_BEHAVIOR = (node, options, heading) => {
  options.labelTagName = `h${node.headingLevel}`; // TODO: make sure heading level change fires a full peer rebuild, see https://github.com/phetsims/scenery/issues/867
  options.labelContent = heading;
  return options;
};
const unwrapProperty = valueOrProperty => {
  const result = valueOrProperty === null ? null : typeof valueOrProperty === 'string' ? valueOrProperty : valueOrProperty.value;
  assert && assert(result === null || typeof result === 'string');
  return result;
};

// these elements are typically associated with forms, and support certain attributes
const FORM_ELEMENTS = PDOMUtils.FORM_ELEMENTS;

// list of input "type" attribute values that support the "checked" attribute
const INPUT_TYPES_THAT_SUPPORT_CHECKED = PDOMUtils.INPUT_TYPES_THAT_SUPPORT_CHECKED;

// HTMLElement attributes whose value is an ID of another element
const ASSOCIATION_ATTRIBUTES = PDOMUtils.ASSOCIATION_ATTRIBUTES;

// The options for the ParallelDOM API. In general, most default to null; to clear, set back to null. Each one of
// these has an associated setter, see setter functions for more information about each.
const ACCESSIBILITY_OPTION_KEYS = [
// Order matters. Having focus before tagName covers the case where you change the tagName and focusability of a
// currently focused node. We want the focusability to update correctly.
'focusable', 'tagName',
/*
 * Higher Level API Functions
 */
'accessibleName', 'accessibleNameBehavior', 'helpText', 'helpTextBehavior', 'pdomHeading', 'pdomHeadingBehavior',
/*
 * Lower Level API Functions
 */
'containerTagName', 'containerAriaRole', 'innerContent', 'inputType', 'inputValue', 'pdomChecked', 'pdomNamespace', 'ariaLabel', 'ariaRole', 'ariaValueText', 'labelTagName', 'labelContent', 'appendLabel', 'descriptionTagName', 'descriptionContent', 'appendDescription', 'focusHighlight', 'focusHighlightLayerable', 'groupFocusHighlight', 'pdomVisibleProperty', 'pdomVisible', 'pdomOrder', 'ariaLabelledbyAssociations', 'ariaDescribedbyAssociations', 'activeDescendantAssociations', 'focusPanTargetBoundsProperty', 'limitPanDirection', 'positionInPDOM', 'pdomTransformSourceNode'];

// Most options use null for their default behavior, see the setters for each option for a description of how null
// behaves as a default.

/**
 *
 * @param node - the node that the pdom behavior is being applied to
 * @param options - options to mutate within the function
 * @param value - the value that you are setting the behavior of, like the accessibleName
 * @param callbacksForOtherNodes - behavior function also support taking state from a Node and using it to
 * set the accessible content for another Node. If this is the case, that logic should be set in a closure and added to
 * this list for execution after this Node is fully created. See discussion in https://github.com/phetsims/sun/issues/503#issuecomment-676541373
 * @returns the options that have been mutated by the behavior function.
 */

export default class ParallelDOM extends PhetioObject {
  // The HTML tag name of the element representing this node in the DOM

  // The HTML tag name for a container parent element for this node in the DOM. This
  // container parent will contain the node's DOM element, as well as peer elements for any label or description
  // content. See setContainerTagName() for more documentation. If this option is needed (like to
  // contain multiple siblings with the primary sibling), it will default to the value of DEFAULT_CONTAINER_TAG_NAME.

  // The HTML tag name for the label element that will contain the label content for
  // this dom element. There are ways in which you can have a label without specifying a label tag name,
  // see setLabelContent() for the list of ways.

  // The HTML tag name for the description element that will contain descsription content
  // for this dom element. If a description is set before a tag name is defined, a paragraph element
  // will be created for the description.

  // The type for an element with tag name of INPUT.  This should only be used
  // if the element has a tag name INPUT.

  // The value of the input, only relevant if the tag name is of type "INPUT". Is a
  // string because the `value` attribute is a DOMString. null value indicates no value.
  _inputValue = null;

  // Whether the pdom input is considered 'checked', only useful for inputs of
  // type 'radio' and 'checkbox'

  // By default the label will be prepended before the primary sibling in the PDOM. This
  // option allows you to instead have the label added after the primary sibling. Note: The label will always
  // be in front of the description sibling. If this flag is set with `appendDescription: true`, the order will be
  // (1) primary sibling, (2) label sibling, (3) description sibling. All siblings will be placed within the
  // containerParent.

  // By default the description will be prepended before the primary sibling in the PDOM. This
  // option allows you to instead have the description added after the primary sibling. Note: The description
  // will always be after the label sibling. If this flag is set with `appendLabel: true`, the order will be
  // (1) primary sibling, (2) label sibling, (3) description sibling. All siblings will be placed within the
  // containerParent.

  // Array of attributes that are on the node's DOM element.  Objects will have the
  // form { attribute:{string}, value:{*}, namespace:{string|null} }

  // Collection of class attributes that are applied to the node's DOM element.
  // Objects have the form { className:{string}, options:{*} }

  // The label content for this node's DOM element.  There are multiple ways that a label
  // can be associated with a node's dom element, see setLabelContent() for more documentation
  _labelContent = null;

  // The inner label content for this node's primary sibling. Set as inner HTML
  // or text content of the actual DOM element. If this is used, the node should not have children.
  _innerContent = null;

  // The description content for this node's DOM element.
  _descriptionContent = null;

  // If provided, it will create the primary DOM element with the specified namespace.
  // This may be needed, for example, with MathML/SVG/etc.

  // If provided, "aria-label" will be added as an inline attribute on the node's DOM
  // element and set to this value. This will determine how the Accessible Name is provided for the DOM element.
  _ariaLabel = null;
  _hasAppliedAriaLabel = false;

  // The ARIA role for this Node's primary sibling, added as an HTML attribute.  For a complete
  // list of ARIA roles, see https://www.w3.org/TR/wai-aria/roles.  Beware that many roles are not supported
  // by browsers or assistive technologies, so use vanilla HTML for accessibility semantics where possible.

  // The ARIA role for the container parent element, added as an HTML attribute. For a
  // complete list of ARIA roles, see https://www.w3.org/TR/wai-aria/roles. Beware that many roles are not
  // supported by browsers or assistive technologies, so use vanilla HTML for accessibility semantics where
  // possible.

  // If provided, "aria-valuetext" will be added as an inline attribute on the Node's
  // primary sibling and set to this value. Setting back to null will clear this attribute in the view.
  _ariaValueText = null;
  _hasAppliedAriaValueText = false;

  // Keep track of what this Node is aria-labelledby via "associationObjects"
  // see addAriaLabelledbyAssociation for why we support more than one association.

  // Keep a reference to all nodes that are aria-labelledby this node, i.e. that have store one of this Node's
  // peer HTMLElement's id in their peer HTMLElement's aria-labelledby attribute. This way we can tell other
  // nodes to update their aria-labelledby associations when this Node rebuilds its pdom content.

  // Keep track of what this Node is aria-describedby via "associationObjects"
  // see addAriaDescribedbyAssociation for why we support more than one association.

  // Keep a reference to all nodes that are aria-describedby this node, i.e. that have store one of this Node's
  // peer HTMLElement's id in their peer HTMLElement's aria-describedby attribute. This way we can tell other
  // nodes to update their aria-describedby associations when this Node rebuilds its pdom content.

  // Keep track of what this Node is aria-activedescendant via "associationObjects"
  // see addActiveDescendantAssociation for why we support more than one association.

  // Keep a reference to all nodes that are aria-activedescendant this node, i.e. that have store one of this Node's
  // peer HTMLElement's id in their peer HTMLElement's aria-activedescendant attribute. This way we can tell other
  // nodes to update their aria-activedescendant associations when this Node rebuilds its pdom content.

  // Whether this Node's primary sibling has been explicitly set to receive focus from
  // tab navigation. Sets the tabIndex attribute on the Node's primary sibling. Setting to false will not remove the
  // node's DOM from the document, but will ensure that it cannot receive focus by pressing 'tab'.  Several
  // HTMLElements (such as HTML form elements) can be focusable by default, without setting this property. The
  // native HTML function from these form elements can be overridden with this property.

  // The focus highlight that will surround this node when it
  // is focused.  By default, the focus highlight will be a pink rectangle that surrounds the Node's local
  // bounds. When providing a custom highlight, draw around the Node's local coordinate frame.

  // A flag that allows prevents focus highlight from being displayed in the HighlightOverlay.
  // If true, the focus highlight for this node will be layerable in the scene graph.  PhetioClient is responsible
  // for placement of the focus highlight in the scene graph.

  // Adds a group focus highlight that surrounds this node when a descendant has
  // focus. Typically useful to indicate focus if focus enters a group of elements. If 'true', group
  // highlight will go around local bounds of this node. Otherwise the custom node will be used as the highlight/

  // Whether the pdom content will be visible from the browser and assistive
  // technologies.  When pdomVisible is false, the Node's primary sibling will not be focusable, and it cannot
  // be found by the assistive technology virtual cursor. For more information on how assistive technologies
  // read with the virtual cursor see
  // http://www.ssbbartgroup.com/blog/how-windows-screen-readers-work-on-the-web/

  // If provided, it will override the focus order between children
  // (and optionally arbitrary subtrees). If not provided, the focus order will default to the rendering order
  // (first children first, last children last) determined by the children array.
  // See setPDOMOrder() for more documentation.

  // If this node is specified in another node's pdomOrder, then this will have the value of that other (PDOM parent)
  // Node. Otherwise it's null.
  // (scenery-internal)

  // If this is specified, the primary sibling will be positioned
  // to align with this source node and observe the transforms along this node's trail. At this time the
  // pdomTransformSourceNode cannot use DAG.

  // If this is provided, the AnimatedPanZoomListener will attempt to keep this Node in view as long as it has
  // focus

  // If provided, the AnimatedPanZoomListener will ONLY pan in the specified direction

  // Contains information about what pdom displays
  // this node is "visible" for, see PDOMDisplaysInfo.js for more information.
  // (scenery-internal)

  // Empty unless the Node contains some pdom content (PDOMInstance).

  // Determines if DOM siblings are positioned in the viewport. This
  // is required for Nodes that require unique input gestures with iOS VoiceOver like "Drag and Drop".
  // See setPositionInPDOM for more information.

  // If true, any DOM events received on the label sibling
  // will not dispatch SceneryEvents through the scene graph, see setExcludeLabelSiblingFromInput() - scenery internal

  // HIGHER LEVEL API INITIALIZATION

  // Sets the "Accessible Name" of the Node, as defined by the Browser's ParallelDOM Tree
  _accessibleName = null;

  // Function that returns the options needed to set the appropriate accessible name for the Node

  // Sets the help text of the Node, this most often corresponds to description text.
  _helpText = null;

  // Sets the help text of the Node, this most often corresponds to description text.

  // Sets the help text of the Node, this most often corresponds to label sibling text.
  _pdomHeading = null;

  // TODO: implement headingLevel override, see https://github.com/phetsims/scenery/issues/855
  // The number that corresponds to the heading tag the node will get if using the pdomHeading API,.

  // Sets the help text of the Node, this most often corresponds to description text.

  // Emits an event when the focus highlight is changed.
  focusHighlightChangedEmitter = new TinyEmitter();

  // Emits an event when the pdom parent of this Node has changed
  pdomParentChangedEmitter = new TinyEmitter();

  // Fired when the PDOM Displays for this Node have changed (see PDOMInstance)
  pdomDisplaysEmitter = new TinyEmitter();

  // PDOM specific enabled listener

  constructor(options) {
    super(options);
    this._onPDOMContentChangeListener = this.onPDOMContentChange.bind(this);
    this._onInputValueChangeListener = this.invalidatePeerInputValue.bind(this);
    this._onAriaLabelChangeListener = this.onAriaLabelChange.bind(this);
    this._onAriaValueTextChangeListener = this.onAriaValueTextChange.bind(this);
    this._onLabelContentChangeListener = this.invalidatePeerLabelSiblingContent.bind(this);
    this._onDescriptionContentChangeListener = this.invalidatePeerDescriptionSiblingContent.bind(this);
    this._onInnerContentChangeListener = this.onInnerContentPropertyChange.bind(this);
    this._tagName = null;
    this._containerTagName = null;
    this._labelTagName = null;
    this._descriptionTagName = null;
    this._inputType = null;
    this._pdomChecked = false;
    this._appendLabel = false;
    this._appendDescription = false;
    this._pdomAttributes = [];
    this._pdomClasses = [];
    this._pdomNamespace = null;
    this._ariaRole = null;
    this._containerAriaRole = null;
    this._ariaLabelledbyAssociations = [];
    this._nodesThatAreAriaLabelledbyThisNode = [];
    this._ariaDescribedbyAssociations = [];
    this._nodesThatAreAriaDescribedbyThisNode = [];
    this._activeDescendantAssociations = [];
    this._nodesThatAreActiveDescendantToThisNode = [];
    this._focusableOverride = null;
    this._focusHighlight = null;
    this._focusHighlightLayerable = false;
    this._groupFocusHighlight = false;
    this._pdomOrder = null;
    this._pdomParent = null;
    this._pdomTransformSourceNode = null;
    this._focusPanTargetBoundsProperty = null;
    this._limitPanDirection = null;
    this._pdomDisplaysInfo = new PDOMDisplaysInfo(this);
    this._pdomInstances = [];
    this._positionInPDOM = false;
    this.excludeLabelSiblingFromInput = false;
    this._pdomVisibleProperty = new TinyForwardingProperty(true, false, this.onPdomVisiblePropertyChange.bind(this));

    // HIGHER LEVEL API INITIALIZATION

    this._accessibleNameBehavior = ParallelDOM.BASIC_ACCESSIBLE_NAME_BEHAVIOR;
    this._helpTextBehavior = ParallelDOM.HELP_TEXT_AFTER_CONTENT;
    this._headingLevel = null;
    this._pdomHeadingBehavior = DEFAULT_PDOM_HEADING_BEHAVIOR;
    this.pdomBoundInputEnabledListener = this.pdomInputEnabledListener.bind(this);
  }

  /***********************************************************************************************************/
  // PUBLIC METHODS
  /***********************************************************************************************************/

  /**
   * Dispose accessibility by removing all listeners on this node for accessible input. ParallelDOM is disposed
   * by calling Node.dispose(), so this function is scenery-internal.
   * (scenery-internal)
   */
  disposeParallelDOM() {
    if (isTReadOnlyProperty(this._accessibleName) && !this._accessibleName.isDisposed) {
      this._accessibleName.unlink(this._onPDOMContentChangeListener);
      this._accessibleName = null;
    }
    if (isTReadOnlyProperty(this._helpText) && !this._helpText.isDisposed) {
      this._helpText.unlink(this._onPDOMContentChangeListener);
      this._helpText = null;
    }
    if (isTReadOnlyProperty(this._pdomHeading) && !this._pdomHeading.isDisposed) {
      this._pdomHeading.unlink(this._onPDOMContentChangeListener);
      this._pdomHeading = null;
    }
    if (isTReadOnlyProperty(this._inputValue) && !this._inputValue.isDisposed) {
      this._inputValue.unlink(this._onPDOMContentChangeListener);
      this._inputValue = null;
    }
    if (isTReadOnlyProperty(this._ariaLabel) && !this._ariaLabel.isDisposed) {
      this._ariaLabel.unlink(this._onAriaLabelChangeListener);
    }
    if (isTReadOnlyProperty(this._ariaValueText) && !this._ariaValueText.isDisposed) {
      this._ariaValueText.unlink(this._onAriaValueTextChangeListener);
    }
    if (isTReadOnlyProperty(this._innerContent) && !this._innerContent.isDisposed) {
      this._innerContent.unlink(this._onInnerContentChangeListener);
    }
    if (isTReadOnlyProperty(this._labelContent) && !this._labelContent.isDisposed) {
      this._labelContent.unlink(this._onLabelContentChangeListener);
    }
    if (isTReadOnlyProperty(this._descriptionContent) && !this._descriptionContent.isDisposed) {
      this._descriptionContent.unlink(this._onDescriptionContentChangeListener);
    }
    this.inputEnabledProperty.unlink(this.pdomBoundInputEnabledListener);

    // To prevent memory leaks, we want to clear our order (since otherwise nodes in our order will reference
    // this node).
    this.pdomOrder = null;

    // clear references to the pdomTransformSourceNode
    this.setPDOMTransformSourceNode(null);

    // Clear out aria association attributes, which hold references to other nodes.
    this.setAriaLabelledbyAssociations([]);
    this.setAriaDescribedbyAssociations([]);
    this.setActiveDescendantAssociations([]);

    // PDOM attributes can potentially have listeners, so we will clear those out.
    this.removePDOMAttributes();
    this._pdomVisibleProperty.dispose();
  }
  pdomInputEnabledListener(enabled) {
    // Mark this Node as disabled in the ParallelDOM
    this.setPDOMAttribute('aria-disabled', !enabled);

    // By returning false, we prevent the component from toggling native HTML element attributes that convey state.
    // For example,this will prevent a checkbox from changing `checked` property while it is disabled. This way
    // we can keep the component in traversal order and don't need to add the `disabled` attribute. See
    // https://github.com/phetsims/sun/issues/519 and https://github.com/phetsims/sun/issues/640
    // This solution was found at https://stackoverflow.com/a/12267350/3408502
    this.setPDOMAttribute('onclick', enabled ? '' : 'return false');
  }

  /**
   * Get whether this Node's primary DOM element currently has focus.
   */
  isFocused() {
    for (let i = 0; i < this._pdomInstances.length; i++) {
      const peer = this._pdomInstances[i].peer;
      if (peer.isFocused()) {
        return true;
      }
    }
    return false;
  }
  get focused() {
    return this.isFocused();
  }

  /**
   * Focus this node's primary dom element. The element must not be hidden, and it must be focusable. If the node
   * has more than one instance, this will fail because the DOM element is not uniquely defined. If accessibility
   * is not enabled, this will be a no op. When ParallelDOM is more widely used, the no op can be replaced
   * with an assertion that checks for pdom content.
   */
  focus() {
    // if a sim is running without accessibility enabled, there will be no accessible instances, but focus() might
    // still be called without accessibility enabled
    if (this._pdomInstances.length > 0) {
      // when accessibility is widely used, this assertion can be added back in
      // assert && assert( this._pdomInstances.length > 0, 'there must be pdom content for the node to receive focus' );
      assert && assert(this.focusable, 'trying to set focus on a node that is not focusable');
      assert && assert(this.pdomVisible, 'trying to set focus on a node with invisible pdom content');
      assert && assert(this._pdomInstances.length === 1, 'focus() unsupported for Nodes using DAG, pdom content is not unique');
      const peer = this._pdomInstances[0].peer;
      assert && assert(peer, 'must have a peer to focus');
      peer.focus();
    }
  }

  /**
   * Remove focus from this node's primary DOM element.  The focus highlight will disappear, and the element will not receive
   * keyboard events when it doesn't have focus.
   */
  blur() {
    if (this._pdomInstances.length > 0) {
      assert && assert(this._pdomInstances.length === 1, 'blur() unsupported for Nodes using DAG, pdom content is not unique');
      const peer = this._pdomInstances[0].peer;
      assert && assert(peer, 'must have a peer to blur');
      peer.blur();
    }
  }

  /**
   * Called when assertions are enabled and once the Node has been completely constructed. This is the time to
   * make sure that options are set up the way they are expected to be. For example. you don't want accessibleName
   * and labelContent declared.
   * (only called by Screen.js)
   */
  pdomAudit() {
    if (this.hasPDOMContent && assert) {
      this._inputType && assert(this._tagName.toUpperCase() === INPUT_TAG, 'tagName must be INPUT to support inputType');
      this._pdomChecked && assert(this._tagName.toUpperCase() === INPUT_TAG, 'tagName must be INPUT to support pdomChecked.');
      this._inputValue && assert(this._tagName.toUpperCase() === INPUT_TAG, 'tagName must be INPUT to support inputValue');
      this._pdomChecked && assert(INPUT_TYPES_THAT_SUPPORT_CHECKED.includes(this._inputType.toUpperCase()), `inputType does not support checked attribute: ${this._inputType}`);
      this._focusHighlightLayerable && assert(this.focusHighlight instanceof Node, 'focusHighlight must be Node if highlight is layerable');
      this._tagName.toUpperCase() === INPUT_TAG && assert(typeof this._inputType === 'string', ' inputType expected for input');

      // note that most things that are not focusable by default need innerContent to be focusable on VoiceOver,
      // but this will catch most cases since often things that get added to the focus order have the application
      // role for custom input. Note that accessibleName will not be checked that it specifically changes innerContent, it is up to the dev to do this.
      this.ariaRole === 'application' && assert(this.innerContent || this.accessibleName, 'must have some innerContent or element will never be focusable in VoiceOver');
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].pdomAudit();
    }
  }

  /***********************************************************************************************************/
  // HIGHER LEVEL API: GETTERS AND SETTERS FOR PDOM API OPTIONS
  //
  // These functions utilize the lower level API to achieve a consistence, and convenient API for adding
  // pdom content to the PDOM. See https://github.com/phetsims/scenery/issues/795
  /***********************************************************************************************************/

  /**
   * Set the Node's pdom content in a way that will define the Accessible Name for the browser. Different
   * HTML components and code situations require different methods of setting the Accessible Name. See
   * setAccessibleNameBehavior for details on how this string is rendered in the PDOM. Setting to null will clear
   * this Node's accessibleName
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely). Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setAccessibleName(accessibleName) {
    if (accessibleName !== this._accessibleName) {
      if (isTReadOnlyProperty(this._accessibleName) && !this._accessibleName.isDisposed) {
        this._accessibleName.unlink(this._onPDOMContentChangeListener);
      }
      this._accessibleName = accessibleName;
      if (isTReadOnlyProperty(accessibleName)) {
        accessibleName.lazyLink(this._onPDOMContentChangeListener);
      }
      this.onPDOMContentChange();
    }
  }
  set accessibleName(accessibleName) {
    this.setAccessibleName(accessibleName);
  }
  get accessibleName() {
    return this.getAccessibleName();
  }

  /**
   * Get the tag name of the DOM element representing this node for accessibility.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely). Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getAccessibleName() {
    if (isTReadOnlyProperty(this._accessibleName)) {
      return this._accessibleName.value;
    } else {
      return this._accessibleName;
    }
  }

  /**
   * Remove this Node from the PDOM by clearing its pdom content. This can be useful when creating icons from
   * pdom content.
   */
  removeFromPDOM() {
    assert && assert(this._tagName !== null, 'There is no pdom content to clear from the PDOM');
    this.tagName = null;
  }

  /**
   * accessibleNameBehavior is a function that will set the appropriate options on this node to get the desired
   * "Accessible Name"
   *
   * This accessibleNameBehavior's default does the best it can to create a general method to set the Accessible
   * Name for a variety of different Node types and configurations, but if a Node is more complicated, then this
   * method will not properly set the Accessible Name for the Node's HTML content. In this situation this function
   * needs to be overridden by the subtype to meet its specific constraints. When doing this make it is up to the
   * usage site to make sure that the Accessible Name is properly being set and conveyed to AT, as it is very hard
   * to validate this function.
   *
   * NOTE: By Accessible Name (capitalized), we mean the proper title of the HTML element that will be set in
   * the browser ParallelDOM Tree and then interpreted by AT. This is necessily different from scenery internal
   * names of HTML elements like "label sibling" (even though, in certain circumstances, an Accessible Name could
   * be set by using the "label sibling" with tag name "label" and a "for" attribute).
   *
   * For more information about setting an Accessible Name on HTML see the scenery docs for accessibility,
   * and see https://developer.paciellogroup.com/blog/2017/04/what-is-an-accessible-name/
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setAccessibleNameBehavior(accessibleNameBehavior) {
    if (this._accessibleNameBehavior !== accessibleNameBehavior) {
      this._accessibleNameBehavior = accessibleNameBehavior;
      this.onPDOMContentChange();
    }
  }
  set accessibleNameBehavior(accessibleNameBehavior) {
    this.setAccessibleNameBehavior(accessibleNameBehavior);
  }
  get accessibleNameBehavior() {
    return this.getAccessibleNameBehavior();
  }

  /**
   * Get the help text of the interactive element.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getAccessibleNameBehavior() {
    return this._accessibleNameBehavior;
  }

  /**
   * Set the Node heading content. This by default will be a heading tag whose level is dependent on how many parents
   * Nodes are heading nodes. See computeHeadingLevel() for more info
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setPDOMHeading(pdomHeading) {
    if (pdomHeading !== this._pdomHeading) {
      if (isTReadOnlyProperty(this._pdomHeading) && !this._pdomHeading.isDisposed) {
        this._pdomHeading.unlink(this._onPDOMContentChangeListener);
      }
      this._pdomHeading = pdomHeading;
      if (isTReadOnlyProperty(pdomHeading)) {
        pdomHeading.lazyLink(this._onPDOMContentChangeListener);
      }
      this.onPDOMContentChange();
    }
  }
  set pdomHeading(pdomHeading) {
    this.setPDOMHeading(pdomHeading);
  }
  get pdomHeading() {
    return this.getPDOMHeading();
  }

  /**
   * Get the value of this Node's heading. Use null to clear the heading
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getPDOMHeading() {
    if (isTReadOnlyProperty(this._pdomHeading)) {
      return this._pdomHeading.value;
    } else {
      return this._pdomHeading;
    }
  }

  /**
   * Set the behavior of how `this.pdomHeading` is set in the PDOM. See default behavior function for more
   * information.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setPDOMHeadingBehavior(pdomHeadingBehavior) {
    if (this._pdomHeadingBehavior !== pdomHeadingBehavior) {
      this._pdomHeadingBehavior = pdomHeadingBehavior;
      this.onPDOMContentChange();
    }
  }
  set pdomHeadingBehavior(pdomHeadingBehavior) {
    this.setPDOMHeadingBehavior(pdomHeadingBehavior);
  }
  get pdomHeadingBehavior() {
    return this.getPDOMHeadingBehavior();
  }

  /**
   * Get the help text of the interactive element.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getPDOMHeadingBehavior() {
    return this._pdomHeadingBehavior;
  }

  /**
   * Get the tag name of the DOM element representing this node for accessibility.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getHeadingLevel() {
    return this._headingLevel;
  }
  get headingLevel() {
    return this.getHeadingLevel();
  }

  /**
   // TODO: what if ancestor changes, see https://github.com/phetsims/scenery/issues/855
   * Sets this Node's heading level, by recursing up the accessibility tree to find headings this Node
   * is nested under.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  computeHeadingLevel() {
    // TODO: assert??? assert( this.headingLevel || this._pdomParent); see https://github.com/phetsims/scenery/issues/855
    // Either ^ which may break during construction, or V (below)
    //  base case to heading level 1
    if (!this._pdomParent) {
      if (this.pdomHeading) {
        this._headingLevel = 1;
        return 1;
      }
      return 0; // so that the first node with a heading is headingLevel 1
    }
    if (this.pdomHeading) {
      const level = this._pdomParent.computeHeadingLevel() + 1;
      this._headingLevel = level;
      return level;
    } else {
      return this._pdomParent.computeHeadingLevel();
    }
  }

  /**
   * Set the help text for a Node. See setAccessibleNameBehavior for details on how this string is
   * rendered in the PDOM. Null will clear the help text for this Node.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setHelpText(helpText) {
    if (helpText !== this._helpText) {
      if (isTReadOnlyProperty(this._helpText) && !this._helpText.isDisposed) {
        this._helpText.unlink(this._onPDOMContentChangeListener);
      }
      this._helpText = helpText;
      if (isTReadOnlyProperty(helpText)) {
        helpText.lazyLink(this._onPDOMContentChangeListener);
      }
      this.onPDOMContentChange();
    }
  }
  set helpText(helpText) {
    this.setHelpText(helpText);
  }
  get helpText() {
    return this.getHelpText();
  }

  /**
   * Get the help text of the interactive element.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getHelpText() {
    if (isTReadOnlyProperty(this._helpText)) {
      return this._helpText.value;
    } else {
      return this._helpText;
    }
  }

  /**
   * helpTextBehavior is a function that will set the appropriate options on this node to get the desired
   * "Help Text".
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  setHelpTextBehavior(helpTextBehavior) {
    if (this._helpTextBehavior !== helpTextBehavior) {
      this._helpTextBehavior = helpTextBehavior;
      this.onPDOMContentChange();
    }
  }
  set helpTextBehavior(helpTextBehavior) {
    this.setHelpTextBehavior(helpTextBehavior);
  }
  get helpTextBehavior() {
    return this.getHelpTextBehavior();
  }

  /**
   * Get the help text of the interactive element.
   *
   * @experimental - NOTE: use with caution, a11y team reserves the right to change API (though unlikely).
   *                 Not yet fully implemented, see https://github.com/phetsims/scenery/issues/867
   */
  getHelpTextBehavior() {
    return this._helpTextBehavior;
  }

  /***********************************************************************************************************/
  // LOWER LEVEL GETTERS AND SETTERS FOR PDOM API OPTIONS
  /***********************************************************************************************************/

  /**
   * Set the tag name for the primary sibling in the PDOM. DOM element tag names are read-only, so this
   * function will create a new DOM element each time it is called for the Node's PDOMPeer and
   * reset the pdom content.
   *
   * This is the "entry point" for Parallel DOM content. When a Node has a tagName it will appear in the Parallel DOM
   * and other attributes can be set. Without it, nothing will appear in the Parallel DOM.
   */
  setTagName(tagName) {
    assert && assert(tagName === null || typeof tagName === 'string');
    if (tagName !== this._tagName) {
      this._tagName = tagName;

      // TODO: this could be setting PDOM content twice https://github.com/phetsims/scenery/issues/1581
      this.onPDOMContentChange();
    }
  }
  set tagName(tagName) {
    this.setTagName(tagName);
  }
  get tagName() {
    return this.getTagName();
  }

  /**
   * Get the tag name of the DOM element representing this node for accessibility.
   */
  getTagName() {
    return this._tagName;
  }

  /**
   * Set the tag name for the accessible label sibling for this Node. DOM element tag names are read-only,
   * so this will require creating a new PDOMPeer for this Node (reconstructing all DOM Elements). If
   * labelContent is specified without calling this method, then the DEFAULT_LABEL_TAG_NAME will be used as the
   * tag name for the label sibling. Use null to clear the label sibling element from the PDOM.
   */
  setLabelTagName(tagName) {
    assert && assert(tagName === null || typeof tagName === 'string');
    if (tagName !== this._labelTagName) {
      this._labelTagName = tagName;
      this.onPDOMContentChange();
    }
  }
  set labelTagName(tagName) {
    this.setLabelTagName(tagName);
  }
  get labelTagName() {
    return this.getLabelTagName();
  }

  /**
   * Get the label sibling HTML tag name.
   */
  getLabelTagName() {
    return this._labelTagName;
  }

  /**
   * Set the tag name for the description sibling. HTML element tag names are read-only, so this will require creating
   * a new HTML element, and inserting it into the DOM. The tag name provided must support
   * innerHTML and textContent. If descriptionContent is specified without this option,
   * then descriptionTagName will be set to DEFAULT_DESCRIPTION_TAG_NAME.
   *
   * Passing 'null' will clear away the description sibling.
   */
  setDescriptionTagName(tagName) {
    assert && assert(tagName === null || typeof tagName === 'string');
    if (tagName !== this._descriptionTagName) {
      this._descriptionTagName = tagName;
      this.onPDOMContentChange();
    }
  }
  set descriptionTagName(tagName) {
    this.setDescriptionTagName(tagName);
  }
  get descriptionTagName() {
    return this.getDescriptionTagName();
  }

  /**
   * Get the HTML tag name for the description sibling.
   */
  getDescriptionTagName() {
    return this._descriptionTagName;
  }

  /**
   * Sets the type for an input element.  Element must have the INPUT tag name. The input attribute is not
   * specified as readonly, so invalidating pdom content is not necessary.
   */
  setInputType(inputType) {
    assert && assert(inputType === null || typeof inputType === 'string');
    assert && this.tagName && assert(this._tagName.toUpperCase() === INPUT_TAG, 'tag name must be INPUT to support inputType');
    if (inputType !== this._inputType) {
      this._inputType = inputType;
      for (let i = 0; i < this._pdomInstances.length; i++) {
        const peer = this._pdomInstances[i].peer;

        // remove the attribute if cleared by setting to 'null'
        if (inputType === null) {
          peer.removeAttributeFromElement('type');
        } else {
          peer.setAttributeToElement('type', inputType);
        }
      }
    }
  }
  set inputType(inputType) {
    this.setInputType(inputType);
  }
  get inputType() {
    return this.getInputType();
  }

  /**
   * Get the input type. Input type is only relevant if this Node's primary sibling has tag name "INPUT".
   */
  getInputType() {
    return this._inputType;
  }

  /**
   * By default the label will be prepended before the primary sibling in the PDOM. This
   * option allows you to instead have the label added after the primary sibling. Note: The label will always
   * be in front of the description sibling. If this flag is set with `appendDescription`, the order will be
   *
   * <container>
   *   <primary sibling/>
   *   <label sibling/>
   *   <description sibling/>
   * </container>
   */
  setAppendLabel(appendLabel) {
    if (this._appendLabel !== appendLabel) {
      this._appendLabel = appendLabel;
      this.onPDOMContentChange();
    }
  }
  set appendLabel(appendLabel) {
    this.setAppendLabel(appendLabel);
  }
  get appendLabel() {
    return this.getAppendLabel();
  }

  /**
   * Get whether the label sibling should be appended after the primary sibling.
   */
  getAppendLabel() {
    return this._appendLabel;
  }

  /**
   * By default the label will be prepended before the primary sibling in the PDOM. This
   * option allows you to instead have the label added after the primary sibling. Note: The label will always
   * be in front of the description sibling. If this flag is set with `appendLabel`, the order will be
   *
   * <container>
   *   <primary sibling/>
   *   <label sibling/>
   *   <description sibling/>
   * </container>
   */
  setAppendDescription(appendDescription) {
    if (this._appendDescription !== appendDescription) {
      this._appendDescription = appendDescription;
      this.onPDOMContentChange();
    }
  }
  set appendDescription(appendDescription) {
    this.setAppendDescription(appendDescription);
  }
  get appendDescription() {
    return this.getAppendDescription();
  }

  /**
   * Get whether the description sibling should be appended after the primary sibling.
   */
  getAppendDescription() {
    return this._appendDescription;
  }

  /**
   * Set the container parent tag name. By specifying this container parent, an element will be created that
   * acts as a container for this Node's primary sibling DOM Element and its label and description siblings.
   * This containerTagName will default to DEFAULT_LABEL_TAG_NAME, and be added to the PDOM automatically if
   * more than just the primary sibling is created.
   *
   * For instance, a button element with a label and description will be contained like the following
   * if the containerTagName is specified as 'section'.
   *
   * <section id='parent-container-trail-id'>
   *   <button>Press me!</button>
   *   <p>Button label</p>
   *   <p>Button description</p>
   * </section>
   */
  setContainerTagName(tagName) {
    assert && assert(tagName === null || typeof tagName === 'string', `invalid tagName argument: ${tagName}`);
    if (this._containerTagName !== tagName) {
      this._containerTagName = tagName;
      this.onPDOMContentChange();
    }
  }
  set containerTagName(tagName) {
    this.setContainerTagName(tagName);
  }
  get containerTagName() {
    return this.getContainerTagName();
  }

  /**
   * Get the tag name for the container parent element.
   */
  getContainerTagName() {
    return this._containerTagName;
  }
  invalidatePeerLabelSiblingContent() {
    const labelContent = this.labelContent;

    // if trying to set labelContent, make sure that there is a labelTagName default
    if (!this._labelTagName) {
      this.setLabelTagName(DEFAULT_LABEL_TAG_NAME);
    }
    for (let i = 0; i < this._pdomInstances.length; i++) {
      const peer = this._pdomInstances[i].peer;
      peer.setLabelSiblingContent(labelContent);
    }
  }

  /**
   * Set the content of the label sibling for the this node.  The label sibling will default to the value of
   * DEFAULT_LABEL_TAG_NAME if no `labelTagName` is provided. If the label sibling is a `LABEL` html element,
   * then the `for` attribute will automatically be added, pointing to the Node's primary sibling.
   *
   * This method supports adding content in two ways, with HTMLElement.textContent and HTMLElement.innerHTML.
   * The DOM setter is chosen based on if the label passes the `containsFormattingTags`.
   *
   * Passing a null label value will not clear the whole label sibling, just the inner content of the DOM Element.
   */
  setLabelContent(labelContent) {
    if (labelContent !== this._labelContent) {
      if (isTReadOnlyProperty(this._labelContent) && !this._labelContent.isDisposed) {
        this._labelContent.unlink(this._onLabelContentChangeListener);
      }
      this._labelContent = labelContent;
      if (isTReadOnlyProperty(labelContent)) {
        labelContent.lazyLink(this._onLabelContentChangeListener);
      }
      this.invalidatePeerLabelSiblingContent();
    }
  }
  set labelContent(label) {
    this.setLabelContent(label);
  }
  get labelContent() {
    return this.getLabelContent();
  }

  /**
   * Get the content for this Node's label sibling DOM element.
   */
  getLabelContent() {
    return unwrapProperty(this._labelContent);
  }
  onInnerContentPropertyChange() {
    const value = this.innerContent;
    for (let i = 0; i < this._pdomInstances.length; i++) {
      const peer = this._pdomInstances[i].peer;
      peer.setPrimarySiblingContent(value);
    }
  }

  /**
   * Set the inner content for the primary sibling of the PDOMPeers of this Node. Will be set as textContent
   * unless content is html which uses exclusively formatting tags. A node with inner content cannot
   * have accessible descendants because this content will override the HTML of descendants of this node.
   */
  setInnerContent(innerContent) {
    if (innerContent !== this._innerContent) {
      if (isTReadOnlyProperty(this._innerContent) && !this._innerContent.isDisposed) {
        this._innerContent.unlink(this._onInnerContentChangeListener);
      }
      this._innerContent = innerContent;
      if (isTReadOnlyProperty(innerContent)) {
        innerContent.lazyLink(this._onInnerContentChangeListener);
      }
      this.onInnerContentPropertyChange();
    }
  }
  set innerContent(content) {
    this.setInnerContent(content);
  }
  get innerContent() {
    return this.getInnerContent();
  }

  /**
   * Get the inner content, the string that is the innerHTML or innerText for the Node's primary sibling.
   */
  getInnerContent() {
    return unwrapProperty(this._innerContent);
  }
  invalidatePeerDescriptionSiblingContent() {
    const descriptionContent = this.descriptionContent;

    // if there is no description element, assume that a paragraph element should be used
    if (!this._descriptionTagName) {
      this.setDescriptionTagName(DEFAULT_DESCRIPTION_TAG_NAME);
    }
    for (let i = 0; i < this._pdomInstances.length; i++) {
      const peer = this._pdomInstances[i].peer;
      peer.setDescriptionSiblingContent(descriptionContent);
    }
  }

  /**
   * Set the description content for this Node's primary sibling. The description sibling tag name must support
   * innerHTML and textContent. If a description element does not exist yet, a default
   * DEFAULT_LABEL_TAG_NAME will be assigned to the descriptionTagName.
   */
  setDescriptionContent(descriptionContent) {
    if (descriptionContent !== this._descriptionContent) {
      if (isTReadOnlyProperty(this._descriptionContent) && !this._descriptionContent.isDisposed) {
        this._descriptionContent.unlink(this._onDescriptionContentChangeListener);
      }
      this._descriptionContent = descriptionContent;
      if (isTReadOnlyProperty(descriptionContent)) {
        descriptionContent.lazyLink(this._onDescriptionContentChangeListener);
      }
      this.invalidatePeerDescriptionSiblingContent();
    }
  }
  set descriptionContent(textContent) {
    this.setDescriptionContent(textContent);
  }
  get descriptionContent() {
    return this.getDescriptionContent();
  }

  /**
   * Get the content for this Node's description sibling DOM Element.
   */
  getDescriptionContent() {
    return unwrapProperty(this._descriptionContent);
  }

  /**
   * Set the ARIA role for this Node's primary sibling. According to the W3C, the ARIA role is read-only for a DOM
   * element.  So this will create a new DOM element for this Node with the desired role, and replace the old
   * element in the DOM. Note that the aria role can completely change the events that fire from an element,
   * especially when using a screen reader. For example, a role of `application` will largely bypass the default
   * behavior and logic of the screen reader, triggering keydown/keyup events even for buttons that would usually
   * only receive a "click" event.
   *
   * @param ariaRole - role for the element, see
   *                            https://www.w3.org/TR/html-aria/#allowed-aria-roles-states-and-properties
   *                            for a list of roles, states, and properties.
   */
  setAriaRole(ariaRole) {
    assert && assert(ariaRole === null || typeof ariaRole === 'string');
    if (this._ariaRole !== ariaRole) {
      this._ariaRole = ariaRole;
      if (ariaRole !== null) {
        this.setPDOMAttribute('role', ariaRole);
      } else {
        this.removePDOMAttribute('role');
      }
    }
  }
  set ariaRole(ariaRole) {
    this.setAriaRole(ariaRole);
  }
  get ariaRole() {
    return this.getAriaRole();
  }

  /**
   * Get the ARIA role representing this node.
   */
  getAriaRole() {
    return this._ariaRole;
  }

  /**
   * Set the ARIA role for this node's container parent element.  According to the W3C, the ARIA role is read-only
   * for a DOM element. This will create a new DOM element for the container parent with the desired role, and
   * replace it in the DOM.
   *
   * @param ariaRole - role for the element, see
   *                            https://www.w3.org/TR/html-aria/#allowed-aria-roles-states-and-properties
   *                            for a list of roles, states, and properties.
   */
  setContainerAriaRole(ariaRole) {
    assert && assert(ariaRole === null || typeof ariaRole === 'string');
    if (this._containerAriaRole !== ariaRole) {
      this._containerAriaRole = ariaRole;

      // clear out the attribute
      if (ariaRole === null) {
        this.removePDOMAttribute('role', {
          elementName: PDOMPeer.CONTAINER_PARENT
        });
      }

      // add the attribute
      else {
        this.setPDOMAttribute('role', ariaRole, {
          elementName: PDOMPeer.CONTAINER_PARENT
        });
      }
    }
  }
  set containerAriaRole(ariaRole) {
    this.setContainerAriaRole(ariaRole);
  }
  get containerAriaRole() {
    return this.getContainerAriaRole();
  }

  /**
   * Get the ARIA role assigned to the container parent element.
   */
  getContainerAriaRole() {
    return this._containerAriaRole;
  }
  onAriaValueTextChange() {
    const ariaValueText = this.ariaValueText;
    if (ariaValueText === null) {
      if (this._hasAppliedAriaLabel) {
        this.removePDOMAttribute('aria-valuetext');
        this._hasAppliedAriaLabel = false;
      }
    } else {
      this.setPDOMAttribute('aria-valuetext', ariaValueText);
      this._hasAppliedAriaLabel = true;
    }
  }

  /**
   * Set the aria-valuetext of this Node independently from the changing value, if necessary. Setting to null will
   * clear this attribute.
   */
  setAriaValueText(ariaValueText) {
    if (this._ariaValueText !== ariaValueText) {
      if (isTReadOnlyProperty(this._ariaValueText) && !this._ariaValueText.isDisposed) {
        this._ariaValueText.unlink(this._onAriaValueTextChangeListener);
      }
      this._ariaValueText = ariaValueText;
      if (isTReadOnlyProperty(ariaValueText)) {
        ariaValueText.lazyLink(this._onAriaValueTextChangeListener);
      }
      this.onAriaValueTextChange();
    }
  }
  set ariaValueText(ariaValueText) {
    this.setAriaValueText(ariaValueText);
  }
  get ariaValueText() {
    return this.getAriaValueText();
  }

  /**
   * Get the value of the aria-valuetext attribute for this Node's primary sibling. If null, then the attribute
   * has not been set on the primary sibling.
   */
  getAriaValueText() {
    return unwrapProperty(this._ariaValueText);
  }

  /**
   * Sets the namespace for the primary element (relevant for MathML/SVG/etc.)
   *
   * For example, to create a MathML element:
   * { tagName: 'math', pdomNamespace: 'http://www.w3.org/1998/Math/MathML' }
   *
   * or for SVG:
   * { tagName: 'svg', pdomNamespace: 'http://www.w3.org/2000/svg' }
   *
   * @param pdomNamespace - Null indicates no namespace.
   */
  setPDOMNamespace(pdomNamespace) {
    assert && assert(pdomNamespace === null || typeof pdomNamespace === 'string');
    if (this._pdomNamespace !== pdomNamespace) {
      this._pdomNamespace = pdomNamespace;

      // If the namespace changes, tear down the view and redraw the whole thing, there is no easy mutable solution here.
      this.onPDOMContentChange();
    }
    return this;
  }
  set pdomNamespace(value) {
    this.setPDOMNamespace(value);
  }
  get pdomNamespace() {
    return this.getPDOMNamespace();
  }

  /**
   * Returns the accessible namespace (see setPDOMNamespace for more information).
   */
  getPDOMNamespace() {
    return this._pdomNamespace;
  }
  onAriaLabelChange() {
    const ariaLabel = this.ariaLabel;
    if (ariaLabel === null) {
      if (this._hasAppliedAriaLabel) {
        this.removePDOMAttribute('aria-label');
        this._hasAppliedAriaLabel = false;
      }
    } else {
      this.setPDOMAttribute('aria-label', ariaLabel);
      this._hasAppliedAriaLabel = true;
    }
  }

  /**
   * Sets the 'aria-label' attribute for labelling the Node's primary sibling. By using the
   * 'aria-label' attribute, the label will be read on focus, but can not be found with the
   * virtual cursor. This is one way to set a DOM Element's Accessible Name.
   *
   * @param ariaLabel - the text for the aria label attribute
   */
  setAriaLabel(ariaLabel) {
    if (this._ariaLabel !== ariaLabel) {
      if (isTReadOnlyProperty(this._ariaLabel) && !this._ariaLabel.isDisposed) {
        this._ariaLabel.unlink(this._onAriaLabelChangeListener);
      }
      this._ariaLabel = ariaLabel;
      if (isTReadOnlyProperty(ariaLabel)) {
        ariaLabel.lazyLink(this._onAriaLabelChangeListener);
      }
      this.onAriaLabelChange();
    }
  }
  set ariaLabel(ariaLabel) {
    this.setAriaLabel(ariaLabel);
  }
  get ariaLabel() {
    return this.getAriaLabel();
  }

  /**
   * Get the value of the aria-label attribute for this Node's primary sibling.
   */
  getAriaLabel() {
    return unwrapProperty(this._ariaLabel);
  }

  /**
   * Set the focus highlight for this node. By default, the focus highlight will be a pink rectangle that
   * surrounds the node's local bounds.  If focus highlight is set to 'invisible', the node will not have
   * any highlighting when it receives focus.
   *
   * Use the local coordinate frame when drawing a custom highlight for this Node.
   */
  setFocusHighlight(focusHighlight) {
    if (this._focusHighlight !== focusHighlight) {
      this._focusHighlight = focusHighlight;

      // if the focus highlight is layerable in the scene graph, update visibility so that it is only
      // visible when associated node has focus
      if (this._focusHighlightLayerable) {
        // if focus highlight is layerable, it must be a node in the scene graph
        assert && assert(focusHighlight instanceof Node); // eslint-disable-line no-simple-type-checking-assertions

        // the highlight starts off invisible, HighlightOverlay will make it visible when this Node has DOM focus
        focusHighlight.visible = false;
      }
      this.focusHighlightChangedEmitter.emit();
    }
  }
  set focusHighlight(focusHighlight) {
    this.setFocusHighlight(focusHighlight);
  }
  get focusHighlight() {
    return this.getFocusHighlight();
  }

  /**
   * Get the focus highlight for this node.
   */
  getFocusHighlight() {
    return this._focusHighlight;
  }

  /**
   * Setting a flag to break default and allow the focus highlight to be (z) layered into the scene graph.
   * This will set the visibility of the layered focus highlight, it will always be invisible until this node has
   * focus.
   */
  setFocusHighlightLayerable(focusHighlightLayerable) {
    if (this._focusHighlightLayerable !== focusHighlightLayerable) {
      this._focusHighlightLayerable = focusHighlightLayerable;

      // if a focus highlight is defined (it must be a node), update its visibility so it is linked to focus
      // of the associated node
      if (this._focusHighlight) {
        assert && assert(this._focusHighlight instanceof Node);
        this._focusHighlight.visible = false;

        // emit that the highlight has changed and we may need to update its visual representation
        this.focusHighlightChangedEmitter.emit();
      }
    }
  }
  set focusHighlightLayerable(focusHighlightLayerable) {
    this.setFocusHighlightLayerable(focusHighlightLayerable);
  }
  get focusHighlightLayerable() {
    return this.getFocusHighlightLayerable();
  }

  /**
   * Get the flag for if this node is layerable in the scene graph (or if it is always on top, like the default).
   */
  getFocusHighlightLayerable() {
    return this._focusHighlightLayerable;
  }

  /**
   * Set whether or not this node has a group focus highlight. If this node has a group focus highlight, an extra
   * focus highlight will surround this node whenever a descendant node has focus. Generally
   * useful to indicate nested keyboard navigation. If true, the group focus highlight will surround
   * this node's local bounds. Otherwise, the Node will be used.
   *
   * TODO: Support more than one group focus highlight (multiple ancestors could have groupFocusHighlight), see https://github.com/phetsims/scenery/issues/1608
   */
  setGroupFocusHighlight(groupHighlight) {
    this._groupFocusHighlight = groupHighlight;
  }
  set groupFocusHighlight(groupHighlight) {
    this.setGroupFocusHighlight(groupHighlight);
  }
  get groupFocusHighlight() {
    return this.getGroupFocusHighlight();
  }

  /**
   * Get whether or not this node has a 'group' focus highlight, see setter for more information.
   */
  getGroupFocusHighlight() {
    return this._groupFocusHighlight;
  }

  /**
   * Very similar algorithm to setChildren in Node.js
   * @param ariaLabelledbyAssociations - list of associationObjects, see this._ariaLabelledbyAssociations.
   */
  setAriaLabelledbyAssociations(ariaLabelledbyAssociations) {
    let associationObject;
    let i;

    // validation if assert is enabled
    if (assert) {
      assert(Array.isArray(ariaLabelledbyAssociations));
      for (i = 0; i < ariaLabelledbyAssociations.length; i++) {
        associationObject = ariaLabelledbyAssociations[i];
      }
    }

    // no work to be done if both are empty, return early
    if (ariaLabelledbyAssociations.length === 0 && this._ariaLabelledbyAssociations.length === 0) {
      return;
    }
    const beforeOnly = []; // Will hold all nodes that will be removed.
    const afterOnly = []; // Will hold all nodes that will be "new" children (added)
    const inBoth = []; // Child nodes that "stay". Will be ordered for the "after" case.

    // get a difference of the desired new list, and the old
    arrayDifference(ariaLabelledbyAssociations, this._ariaLabelledbyAssociations, afterOnly, beforeOnly, inBoth);

    // remove each current associationObject that isn't in the new list
    for (i = 0; i < beforeOnly.length; i++) {
      associationObject = beforeOnly[i];
      this.removeAriaLabelledbyAssociation(associationObject);
    }
    assert && assert(this._ariaLabelledbyAssociations.length === inBoth.length, 'Removing associations should not have triggered other association changes');

    // add each association from the new list that hasn't been added yet
    for (i = 0; i < afterOnly.length; i++) {
      const ariaLabelledbyAssociation = ariaLabelledbyAssociations[i];
      this.addAriaLabelledbyAssociation(ariaLabelledbyAssociation);
    }
  }
  set ariaLabelledbyAssociations(ariaLabelledbyAssociations) {
    this.setAriaLabelledbyAssociations(ariaLabelledbyAssociations);
  }
  get ariaLabelledbyAssociations() {
    return this.getAriaLabelledbyAssociations();
  }
  getAriaLabelledbyAssociations() {
    return this._ariaLabelledbyAssociations;
  }

  /**
   * Add an aria-labelledby association to this node. The data in the associationObject will be implemented like
   * "a peer's HTMLElement of this Node (specified with the string constant stored in `thisElementName`) will have an
   * aria-labelledby attribute with a value that includes the `otherNode`'s peer HTMLElement's id (specified with
   * `otherElementName`)."
   *
   * There can be more than one association because an aria-labelledby attribute's value can be a space separated
   * list of HTML ids, and not just a single id, see https://www.w3.org/WAI/GL/wiki/Using_aria-labelledby_to_concatenate_a_label_from_several_text_nodes
   */
  addAriaLabelledbyAssociation(associationObject) {
    // TODO: assert if this associationObject is already in the association objects list! https://github.com/phetsims/scenery/issues/832

    this._ariaLabelledbyAssociations.push(associationObject); // Keep track of this association.

    // Flag that this node is is being labelled by the other node, so that if the other node changes it can tell
    // this node to restore the association appropriately.
    associationObject.otherNode._nodesThatAreAriaLabelledbyThisNode.push(this);
    this.updateAriaLabelledbyAssociationsInPeers();
  }

  /**
   * Remove an aria-labelledby association object, see addAriaLabelledbyAssociation for more details
   */
  removeAriaLabelledbyAssociation(associationObject) {
    assert && assert(_.includes(this._ariaLabelledbyAssociations, associationObject));

    // remove the
    const removedObject = this._ariaLabelledbyAssociations.splice(_.indexOf(this._ariaLabelledbyAssociations, associationObject), 1);

    // remove the reference from the other node back to this node because we don't need it anymore
    removedObject[0].otherNode.removeNodeThatIsAriaLabelledByThisNode(this);
    this.updateAriaLabelledbyAssociationsInPeers();
  }

  /**
   * Remove the reference to the node that is using this Node's ID as an aria-labelledby value (scenery-internal)
   */
  removeNodeThatIsAriaLabelledByThisNode(node) {
    const indexOfNode = _.indexOf(this._nodesThatAreAriaLabelledbyThisNode, node);
    assert && assert(indexOfNode >= 0);
    this._nodesThatAreAriaLabelledbyThisNode.splice(indexOfNode, 1);
  }

  /**
   * Trigger the view update for each PDOMPeer
   */
  updateAriaLabelledbyAssociationsInPeers() {
    for (let i = 0; i < this.pdomInstances.length; i++) {
      const peer = this.pdomInstances[i].peer;
      peer.onAriaLabelledbyAssociationChange();
    }
  }

  /**
   * Update the associations for aria-labelledby (scenery-internal)
   */
  updateOtherNodesAriaLabelledby() {
    // if any other nodes are aria-labelledby this Node, update those associations too. Since this node's
    // pdom content needs to be recreated, they need to update their aria-labelledby associations accordingly.
    for (let i = 0; i < this._nodesThatAreAriaLabelledbyThisNode.length; i++) {
      const otherNode = this._nodesThatAreAriaLabelledbyThisNode[i];
      otherNode.updateAriaLabelledbyAssociationsInPeers();
    }
  }

  /**
   * The list of Nodes that are aria-labelledby this node (other node's peer element will have this Node's Peer element's
   * id in the aria-labelledby attribute
   */
  getNodesThatAreAriaLabelledbyThisNode() {
    return this._nodesThatAreAriaLabelledbyThisNode;
  }
  get nodesThatAreAriaLabelledbyThisNode() {
    return this.getNodesThatAreAriaLabelledbyThisNode();
  }
  setAriaDescribedbyAssociations(ariaDescribedbyAssociations) {
    let associationObject;
    if (assert) {
      assert(Array.isArray(ariaDescribedbyAssociations));
      for (let j = 0; j < ariaDescribedbyAssociations.length; j++) {
        associationObject = ariaDescribedbyAssociations[j];
      }
    }

    // no work to be done if both are empty
    if (ariaDescribedbyAssociations.length === 0 && this._ariaDescribedbyAssociations.length === 0) {
      return;
    }
    const beforeOnly = []; // Will hold all nodes that will be removed.
    const afterOnly = []; // Will hold all nodes that will be "new" children (added)
    const inBoth = []; // Child nodes that "stay". Will be ordered for the "after" case.
    let i;

    // get a difference of the desired new list, and the old
    arrayDifference(ariaDescribedbyAssociations, this._ariaDescribedbyAssociations, afterOnly, beforeOnly, inBoth);

    // remove each current associationObject that isn't in the new list
    for (i = 0; i < beforeOnly.length; i++) {
      associationObject = beforeOnly[i];
      this.removeAriaDescribedbyAssociation(associationObject);
    }
    assert && assert(this._ariaDescribedbyAssociations.length === inBoth.length, 'Removing associations should not have triggered other association changes');

    // add each association from the new list that hasn't been added yet
    for (i = 0; i < afterOnly.length; i++) {
      const ariaDescribedbyAssociation = ariaDescribedbyAssociations[i];
      this.addAriaDescribedbyAssociation(ariaDescribedbyAssociation);
    }
  }
  set ariaDescribedbyAssociations(ariaDescribedbyAssociations) {
    this.setAriaDescribedbyAssociations(ariaDescribedbyAssociations);
  }
  get ariaDescribedbyAssociations() {
    return this.getAriaDescribedbyAssociations();
  }
  getAriaDescribedbyAssociations() {
    return this._ariaDescribedbyAssociations;
  }

  /**
   * Add an aria-describedby association to this node. The data in the associationObject will be implemented like
   * "a peer's HTMLElement of this Node (specified with the string constant stored in `thisElementName`) will have an
   * aria-describedby attribute with a value that includes the `otherNode`'s peer HTMLElement's id (specified with
   * `otherElementName`)."
   *
   * There can be more than one association because an aria-describedby attribute's value can be a space separated
   * list of HTML ids, and not just a single id, see https://www.w3.org/WAI/GL/wiki/Using_aria-labelledby_to_concatenate_a_label_from_several_text_nodes
   */
  addAriaDescribedbyAssociation(associationObject) {
    assert && assert(!_.includes(this._ariaDescribedbyAssociations, associationObject), 'describedby association already registed');
    this._ariaDescribedbyAssociations.push(associationObject); // Keep track of this association.

    // Flag that this node is is being described by the other node, so that if the other node changes it can tell
    // this node to restore the association appropriately.
    associationObject.otherNode._nodesThatAreAriaDescribedbyThisNode.push(this);

    // update the PDOMPeers with this aria-describedby association
    this.updateAriaDescribedbyAssociationsInPeers();
  }

  /**
   * Is this object already in the describedby association list
   */
  hasAriaDescribedbyAssociation(associationObject) {
    return _.includes(this._ariaDescribedbyAssociations, associationObject);
  }

  /**
   * Remove an aria-describedby association object, see addAriaDescribedbyAssociation for more details
   */
  removeAriaDescribedbyAssociation(associationObject) {
    assert && assert(_.includes(this._ariaDescribedbyAssociations, associationObject));

    // remove the
    const removedObject = this._ariaDescribedbyAssociations.splice(_.indexOf(this._ariaDescribedbyAssociations, associationObject), 1);

    // remove the reference from the other node back to this node because we don't need it anymore
    removedObject[0].otherNode.removeNodeThatIsAriaDescribedByThisNode(this);
    this.updateAriaDescribedbyAssociationsInPeers();
  }

  /**
   * Remove the reference to the node that is using this Node's ID as an aria-describedby value (scenery-internal)
   */
  removeNodeThatIsAriaDescribedByThisNode(node) {
    const indexOfNode = _.indexOf(this._nodesThatAreAriaDescribedbyThisNode, node);
    assert && assert(indexOfNode >= 0);
    this._nodesThatAreAriaDescribedbyThisNode.splice(indexOfNode, 1);
  }

  /**
   * Trigger the view update for each PDOMPeer
   */
  updateAriaDescribedbyAssociationsInPeers() {
    for (let i = 0; i < this.pdomInstances.length; i++) {
      const peer = this.pdomInstances[i].peer;
      peer.onAriaDescribedbyAssociationChange();
    }
  }

  /**
   * Update the associations for aria-describedby (scenery-internal)
   */
  updateOtherNodesAriaDescribedby() {
    // if any other nodes are aria-describedby this Node, update those associations too. Since this node's
    // pdom content needs to be recreated, they need to update their aria-describedby associations accordingly.
    // TODO: only use unique elements of the array (_.unique) https://github.com/phetsims/scenery/issues/1581
    for (let i = 0; i < this._nodesThatAreAriaDescribedbyThisNode.length; i++) {
      const otherNode = this._nodesThatAreAriaDescribedbyThisNode[i];
      otherNode.updateAriaDescribedbyAssociationsInPeers();
    }
  }

  /**
   * The list of Nodes that are aria-describedby this node (other node's peer element will have this Node's Peer element's
   * id in the aria-describedby attribute
   */
  getNodesThatAreAriaDescribedbyThisNode() {
    return this._nodesThatAreAriaDescribedbyThisNode;
  }
  get nodesThatAreAriaDescribedbyThisNode() {
    return this.getNodesThatAreAriaDescribedbyThisNode();
  }
  setActiveDescendantAssociations(activeDescendantAssociations) {
    let associationObject;
    if (assert) {
      assert(Array.isArray(activeDescendantAssociations));
      for (let j = 0; j < activeDescendantAssociations.length; j++) {
        associationObject = activeDescendantAssociations[j];
      }
    }

    // no work to be done if both are empty, safe to return early
    if (activeDescendantAssociations.length === 0 && this._activeDescendantAssociations.length === 0) {
      return;
    }
    const beforeOnly = []; // Will hold all nodes that will be removed.
    const afterOnly = []; // Will hold all nodes that will be "new" children (added)
    const inBoth = []; // Child nodes that "stay". Will be ordered for the "after" case.
    let i;

    // get a difference of the desired new list, and the old
    arrayDifference(activeDescendantAssociations, this._activeDescendantAssociations, afterOnly, beforeOnly, inBoth);

    // remove each current associationObject that isn't in the new list
    for (i = 0; i < beforeOnly.length; i++) {
      associationObject = beforeOnly[i];
      this.removeActiveDescendantAssociation(associationObject);
    }
    assert && assert(this._activeDescendantAssociations.length === inBoth.length, 'Removing associations should not have triggered other association changes');

    // add each association from the new list that hasn't been added yet
    for (i = 0; i < afterOnly.length; i++) {
      const activeDescendantAssociation = activeDescendantAssociations[i];
      this.addActiveDescendantAssociation(activeDescendantAssociation);
    }
  }
  set activeDescendantAssociations(activeDescendantAssociations) {
    this.setActiveDescendantAssociations(activeDescendantAssociations);
  }
  get activeDescendantAssociations() {
    return this.getActiveDescendantAssociations();
  }
  getActiveDescendantAssociations() {
    return this._activeDescendantAssociations;
  }

  /**
   * Add an aria-activeDescendant association to this node. The data in the associationObject will be implemented like
   * "a peer's HTMLElement of this Node (specified with the string constant stored in `thisElementName`) will have an
   * aria-activeDescendant attribute with a value that includes the `otherNode`'s peer HTMLElement's id (specified with
   * `otherElementName`)."
   */
  addActiveDescendantAssociation(associationObject) {
    // TODO: assert if this associationObject is already in the association objects list! https://github.com/phetsims/scenery/issues/832
    this._activeDescendantAssociations.push(associationObject); // Keep track of this association.

    // Flag that this node is is being described by the other node, so that if the other node changes it can tell
    // this node to restore the association appropriately.
    associationObject.otherNode._nodesThatAreActiveDescendantToThisNode.push(this);

    // update the pdomPeers with this aria-activeDescendant association
    this.updateActiveDescendantAssociationsInPeers();
  }

  /**
   * Remove an aria-activeDescendant association object, see addActiveDescendantAssociation for more details
   */
  removeActiveDescendantAssociation(associationObject) {
    assert && assert(_.includes(this._activeDescendantAssociations, associationObject));

    // remove the
    const removedObject = this._activeDescendantAssociations.splice(_.indexOf(this._activeDescendantAssociations, associationObject), 1);

    // remove the reference from the other node back to this node because we don't need it anymore
    removedObject[0].otherNode.removeNodeThatIsActiveDescendantThisNode(this);
    this.updateActiveDescendantAssociationsInPeers();
  }

  /**
   * Remove the reference to the node that is using this Node's ID as an aria-activeDescendant value (scenery-internal)
   */
  removeNodeThatIsActiveDescendantThisNode(node) {
    const indexOfNode = _.indexOf(this._nodesThatAreActiveDescendantToThisNode, node);
    assert && assert(indexOfNode >= 0);
    this._nodesThatAreActiveDescendantToThisNode.splice(indexOfNode, 1);
  }

  /**
   * Trigger the view update for each PDOMPeer
   */
  updateActiveDescendantAssociationsInPeers() {
    for (let i = 0; i < this.pdomInstances.length; i++) {
      const peer = this.pdomInstances[i].peer;
      peer.onActiveDescendantAssociationChange();
    }
  }

  /**
   * Update the associations for aria-activeDescendant (scenery-internal)
   */
  updateOtherNodesActiveDescendant() {
    // if any other nodes are aria-activeDescendant this Node, update those associations too. Since this node's
    // pdom content needs to be recreated, they need to update their aria-activeDescendant associations accordingly.
    // TODO: only use unique elements of the array (_.unique) https://github.com/phetsims/scenery/issues/1581
    for (let i = 0; i < this._nodesThatAreActiveDescendantToThisNode.length; i++) {
      const otherNode = this._nodesThatAreActiveDescendantToThisNode[i];
      otherNode.updateActiveDescendantAssociationsInPeers();
    }
  }

  /**
   * The list of Nodes that are aria-activeDescendant this node (other node's peer element will have this Node's Peer element's
   * id in the aria-activeDescendant attribute
   */
  getNodesThatAreActiveDescendantToThisNode() {
    return this._nodesThatAreActiveDescendantToThisNode;
  }
  get nodesThatAreActiveDescendantToThisNode() {
    return this.getNodesThatAreActiveDescendantToThisNode();
  }

  /**
   * Sets the PDOM/DOM order for this Node. This includes not only focused items, but elements that can be
   * placed in the Parallel DOM. If provided, it will override the focus order between children (and
   * optionally arbitrary subtrees). If not provided, the focus order will default to the rendering order
   * (first children first, last children last), determined by the children array. A Node must be connected to a scene
   * graph (via children) in order for pdomOrder to apply. Thus, `setPDOMOrder` cannot be used in exchange for
   * setting a Node as a child.
   *
   * In the general case, when pdomOrder is specified, it's an array of Nodes, with optionally one
   * element being a placeholder for "the rest of the children", signified by null. This means that, for
   * accessibility, it will act as if the children for this Node WERE the pdomOrder (potentially
   * supplemented with other children via the placeholder).
   *
   * For example, if you have the tree:
   *   a
   *     b
   *       d
   *       e
   *     c
   *       g
   *       f
   *         h
   *
   * and we specify b.pdomOrder = [ e, f, d, c ], then the pdom structure will act as if the tree is:
   *  a
   *    b
   *      e
   *      f <--- the entire subtree of `f` gets placed here under `b`, pulling it out from where it was before.
   *        h
   *      d
   *      c <--- note that `g` is NOT under `c` anymore, because it got pulled out under b directly
   *        g
   *
   * The placeholder (`null`) will get filled in with all direct children that are NOT in any pdomOrder.
   * If there is no placeholder specified, it will act as if the placeholder is at the end of the order.
   * The value `null` (the default) and the empty array (`[]`) both act as if the only order is the placeholder,
   * i.e. `[null]`.
   *
   * Some general constraints for the orders are:
   * - Nodes must be attached to a Display (in a scene graph) to be shown in a pdom order.
   * - You can't specify a node in more than one pdomOrder, and you can't specify duplicates of a value
   *   in a pdomOrder.
   * - You can't specify an ancestor of a node in that node's pdomOrder
   *   (e.g. this.pdomOrder = this.parents ).
   *
   * Note that specifying something in a pdomOrder will effectively remove it from all of its parents for
   * the pdom tree (so if you create `tmpNode.pdomOrder = [ a ]` then toss the tmpNode without
   * disposing it, `a` won't show up in the parallel DOM). If there is a need for that, disposing a Node
   * effectively removes its pdomOrder.
   *
   * See https://github.com/phetsims/scenery-phet/issues/365#issuecomment-381302583 for more information on the
   * decisions and design for this feature.
   */
  setPDOMOrder(pdomOrder) {
    assert && assert(Array.isArray(pdomOrder) || pdomOrder === null, `Array or null expected, received: ${pdomOrder}`);
    assert && pdomOrder && pdomOrder.forEach((node, index) => {
      assert && assert(node === null || node instanceof Node, `Elements of pdomOrder should be either a Node or null. Element at index ${index} is: ${node}`);
    });
    assert && pdomOrder && assert(this.getTrails(node => _.includes(pdomOrder, node)).length === 0, 'pdomOrder should not include any ancestors or the node itself');

    // Only update if it has changed
    if (this._pdomOrder !== pdomOrder) {
      const oldPDOMOrder = this._pdomOrder;

      // Store our own reference to this, so client modifications to the input array won't silently break things.
      // See https://github.com/phetsims/scenery/issues/786
      this._pdomOrder = pdomOrder === null ? null : pdomOrder.slice();
      PDOMTree.pdomOrderChange(this, oldPDOMOrder, pdomOrder);
      this.rendererSummaryRefreshEmitter.emit();
    }
  }
  set pdomOrder(value) {
    this.setPDOMOrder(value);
  }
  get pdomOrder() {
    return this.getPDOMOrder();
  }

  /**
   * Returns the pdom (focus) order for this node.
   * If there is an existing array, this returns a copy of that array. This is important because clients may then
   * modify the array, and call setPDOMOrder - which is a no-op unless the array reference is different.
   */
  getPDOMOrder() {
    if (this._pdomOrder) {
      return this._pdomOrder.slice(0); // create a defensive copy
    }
    return this._pdomOrder;
  }

  /**
   * Returns whether this node has a pdomOrder that is effectively different than the default.
   *
   * NOTE: `null`, `[]` and `[null]` are all effectively the same thing, so this will return true for any of
   * those. Usage of `null` is recommended, as it doesn't create the extra object reference (but some code
   * that generates arrays may be more convenient).
   */
  hasPDOMOrder() {
    return this._pdomOrder !== null && this._pdomOrder.length !== 0 && (this._pdomOrder.length > 1 || this._pdomOrder[0] !== null);
  }

  /**
   * Returns our "PDOM parent" if available: the node that specifies this node in its pdomOrder.
   */
  getPDOMParent() {
    return this._pdomParent;
  }
  get pdomParent() {
    return this.getPDOMParent();
  }

  /**
   * Returns the "effective" pdom children for the node (which may be different based on the order or other
   * excluded subtrees).
   *
   * If there is no pdomOrder specified, this is basically "all children that don't have pdom parents"
   * (a Node has a "PDOM parent" if it is specified in a pdomOrder).
   *
   * Otherwise (if it has a pdomOrder), it is the pdomOrder, with the above list of nodes placed
   * in at the location of the placeholder. If there is no placeholder, it acts like a placeholder was the last
   * element of the pdomOrder (see setPDOMOrder for more documentation information).
   *
   * NOTE: If you specify a child in the pdomOrder, it will NOT be double-included (since it will have an
   * PDOM parent).
   *
   * (scenery-internal)
   */
  getEffectiveChildren() {
    // Find all children without PDOM parents.
    const nonOrderedChildren = [];
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      if (!child._pdomParent) {
        nonOrderedChildren.push(child);
      }
    }

    // Override the order, and replace the placeholder if it exists.
    if (this.hasPDOMOrder()) {
      const effectiveChildren = this.pdomOrder.slice();
      const placeholderIndex = effectiveChildren.indexOf(null);

      // If we have a placeholder, replace its content with the children
      if (placeholderIndex >= 0) {
        // for efficiency
        nonOrderedChildren.unshift(placeholderIndex, 1);

        // @ts-expect-error - TODO: best way to type? https://github.com/phetsims/scenery/issues/1581
        Array.prototype.splice.apply(effectiveChildren, nonOrderedChildren);
      }
      // Otherwise, just add the normal things at the end
      else {
        Array.prototype.push.apply(effectiveChildren, nonOrderedChildren);
      }
      return effectiveChildren;
    } else {
      return nonOrderedChildren;
    }
  }

  /**
   * Called when our pdomVisible Property changes values.
   */
  onPdomVisiblePropertyChange(visible) {
    this._pdomDisplaysInfo.onPDOMVisibilityChange(visible);
  }

  /**
   * Sets what Property our pdomVisibleProperty is backed by, so that changes to this provided Property will change this
   * Node's pdom visibility, and vice versa. This does not change this._pdomVisibleProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   */
  setPdomVisibleProperty(newTarget) {
    this._pdomVisibleProperty.setTargetProperty(newTarget);
    return this;
  }

  /**
   * See setPdomVisibleProperty() for more information
   */
  set pdomVisibleProperty(property) {
    this.setPdomVisibleProperty(property);
  }

  /**
   * See getPdomVisibleProperty() for more information
   */
  get pdomVisibleProperty() {
    return this.getPdomVisibleProperty();
  }

  /**
   * Get this Node's pdomVisibleProperty. See Node.getVisibleProperty for more information
   */
  getPdomVisibleProperty() {
    return this._pdomVisibleProperty;
  }

  /**
   * Hide completely from a screen reader and the browser by setting the hidden attribute on the node's
   * representative DOM element. If the sibling DOM Elements have a container parent, the container
   * should be hidden so that all PDOM elements are hidden as well.  Hiding the element will remove it from the focus
   * order.
   */
  setPDOMVisible(visible) {
    this.pdomVisibleProperty.value = visible;
  }
  set pdomVisible(visible) {
    this.setPDOMVisible(visible);
  }
  get pdomVisible() {
    return this.isPDOMVisible();
  }

  /**
   * Get whether or not this node's representative DOM element is visible.
   */
  isPDOMVisible() {
    return this.pdomVisibleProperty.value;
  }

  /**
   * Returns true if any of the PDOMInstances for the Node are globally visible and displayed in the PDOM. A
   * PDOMInstance is globally visible if Node and all ancestors are pdomVisible. PDOMInstance visibility is
   * updated synchronously, so this returns the most up-to-date information without requiring Display.updateDisplay
   */
  isPDOMDisplayed() {
    for (let i = 0; i < this._pdomInstances.length; i++) {
      if (this._pdomInstances[i].isGloballyVisible()) {
        return true;
      }
    }
    return false;
  }
  get pdomDisplayed() {
    return this.isPDOMDisplayed();
  }
  invalidatePeerInputValue() {
    for (let i = 0; i < this.pdomInstances.length; i++) {
      const peer = this.pdomInstances[i].peer;
      peer.onInputValueChange();
    }
  }

  /**
   * Set the value of an input element.  Element must be a form element to support the value attribute. The input
   * value is converted to string since input values are generally string for HTML.
   */
  setInputValue(inputValue) {
    assert && this._tagName && assert(_.includes(FORM_ELEMENTS, this._tagName.toUpperCase()), 'dom element must be a form element to support value');
    if (inputValue !== this._inputValue) {
      if (isTReadOnlyProperty(this._inputValue) && !this._inputValue.isDisposed) {
        this._inputValue.unlink(this._onPDOMContentChangeListener);
      }
      this._inputValue = inputValue;
      if (isTReadOnlyProperty(inputValue)) {
        inputValue.lazyLink(this._onPDOMContentChangeListener);
      }
      this.invalidatePeerInputValue();
    }
  }
  set inputValue(value) {
    this.setInputValue(value);
  }
  get inputValue() {
    return this.getInputValue();
  }

  /**
   * Get the value of the element. Element must be a form element to support the value attribute.
   */
  getInputValue() {
    let value;
    if (isTReadOnlyProperty(this._inputValue)) {
      value = this._inputValue.value;
    } else {
      value = this._inputValue;
    }
    return value === null ? null : '' + value;
  }

  /**
   * Set whether or not the checked attribute appears on the dom elements associated with this Node's
   * pdom content.  This is only useful for inputs of type 'radio' and 'checkbox'. A 'checked' input
   * is considered selected to the browser and assistive technology.
   */
  setPDOMChecked(checked) {
    if (this._tagName) {
      assert && assert(this._tagName.toUpperCase() === INPUT_TAG, 'Cannot set checked on a non input tag.');
    }
    if (this._inputType) {
      assert && assert(INPUT_TYPES_THAT_SUPPORT_CHECKED.includes(this._inputType.toUpperCase()), `inputType does not support checked: ${this._inputType}`);
    }
    if (this._pdomChecked !== checked) {
      this._pdomChecked = checked;
      this.setPDOMAttribute('checked', checked, {
        asProperty: true
      });
    }
  }
  set pdomChecked(checked) {
    this.setPDOMChecked(checked);
  }
  get pdomChecked() {
    return this.getPDOMChecked();
  }

  /**
   * Get whether or not the pdom input is 'checked'.
   */
  getPDOMChecked() {
    return this._pdomChecked;
  }

  /**
   * Get an array containing all pdom attributes that have been added to this Node's primary sibling.
   */
  getPDOMAttributes() {
    return this._pdomAttributes.slice(0); // defensive copy
  }
  get pdomAttributes() {
    return this.getPDOMAttributes();
  }

  /**
   * Set a particular attribute or property for this Node's primary sibling, generally to provide extra semantic information for
   * a screen reader.
   *
   * @param attribute - string naming the attribute
   * @param value - the value for the attribute, if boolean, then it will be set as a javascript property on the HTMLElement rather than an attribute
   * @param [providedOptions]
   */
  setPDOMAttribute(attribute, value, providedOptions) {
    assert && providedOptions && assert(Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on pdomAttribute options object is a code smell');
    const options = optionize()({
      // {string|null} - If non-null, will set the attribute with the specified namespace. This can be required
      // for setting certain attributes (e.g. MathML).
      namespace: null,
      // set the "attribute" as a javascript property on the DOMElement instead
      asProperty: false,
      elementName: PDOMPeer.PRIMARY_SIBLING // see PDOMPeer.getElementName() for valid values, default to the primary sibling
    }, providedOptions);
    assert && assert(!ASSOCIATION_ATTRIBUTES.includes(attribute), 'setPDOMAttribute does not support association attributes');

    // if the pdom attribute already exists in the list, remove it - no need
    // to remove from the peers, existing attributes will simply be replaced in the DOM
    for (let i = 0; i < this._pdomAttributes.length; i++) {
      const currentAttribute = this._pdomAttributes[i];
      if (currentAttribute.attribute === attribute && currentAttribute.options.namespace === options.namespace && currentAttribute.options.elementName === options.elementName) {
        if (currentAttribute.options.asProperty === options.asProperty) {
          this._pdomAttributes.splice(i, 1);
        } else {
          // Swapping asProperty setting strategies should remove the attribute so it can be set as a property.
          this.removePDOMAttribute(currentAttribute.attribute, currentAttribute.options);
        }
      }
    }
    let listener = rawValue => {
      assert && typeof rawValue === 'string' && validate(rawValue, Validation.STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR);
      for (let j = 0; j < this._pdomInstances.length; j++) {
        const peer = this._pdomInstances[j].peer;
        peer.setAttributeToElement(attribute, rawValue, options);
      }
    };
    if (isTReadOnlyProperty(value)) {
      // should run it once initially
      value.link(listener);
    } else {
      // run it once and toss it, so we don't need to store the reference or unlink it later
      listener(value);
      listener = null;
    }
    this._pdomAttributes.push({
      attribute: attribute,
      value: value,
      listener: listener,
      options: options
    });
  }

  /**
   * Remove a particular attribute, removing the associated semantic information from the DOM element.
   *
   * It is HIGHLY recommended that you never call this function from an attribute set with `asProperty:true`, see
   * setPDOMAttribute for the option details.
   *
   * @param attribute - name of the attribute to remove
   * @param [providedOptions]
   */
  removePDOMAttribute(attribute, providedOptions) {
    assert && providedOptions && assert(Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on pdomAttribute options object is a code smell');
    const options = optionize()({
      // {string|null} - If non-null, will remove the attribute with the specified namespace. This can be required
      // for removing certain attributes (e.g. MathML).
      namespace: null,
      elementName: PDOMPeer.PRIMARY_SIBLING // see PDOMPeer.getElementName() for valid values, default to the primary sibling
    }, providedOptions);
    let attributeRemoved = false;
    for (let i = 0; i < this._pdomAttributes.length; i++) {
      if (this._pdomAttributes[i].attribute === attribute && this._pdomAttributes[i].options.namespace === options.namespace && this._pdomAttributes[i].options.elementName === options.elementName) {
        const oldAttribute = this._pdomAttributes[i];
        if (oldAttribute.listener && isTReadOnlyProperty(oldAttribute.value) && !oldAttribute.value.isDisposed) {
          oldAttribute.value.unlink(oldAttribute.listener);
        }
        this._pdomAttributes.splice(i, 1);
        attributeRemoved = true;
      }
    }
    assert && assert(attributeRemoved, `Node does not have pdom attribute ${attribute}`);
    for (let j = 0; j < this._pdomInstances.length; j++) {
      const peer = this._pdomInstances[j].peer;
      peer.removeAttributeFromElement(attribute, options);
    }
  }

  /**
   * Remove all attributes from this node's dom element.
   */
  removePDOMAttributes() {
    // all attributes currently on this Node's primary sibling
    const attributes = this.getPDOMAttributes();
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i].attribute;
      this.removePDOMAttribute(attribute);
    }
  }

  /**
   * Remove a particular attribute, removing the associated semantic information from the DOM element.
   *
   * @param attribute - name of the attribute to remove
   * @param [providedOptions]
   */
  hasPDOMAttribute(attribute, providedOptions) {
    assert && providedOptions && assert(Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on pdomAttribute options object is a code smell');
    const options = optionize()({
      // {string|null} - If non-null, will remove the attribute with the specified namespace. This can be required
      // for removing certain attributes (e.g. MathML).
      namespace: null,
      elementName: PDOMPeer.PRIMARY_SIBLING // see PDOMPeer.getElementName() for valid values, default to the primary sibling
    }, providedOptions);
    let attributeFound = false;
    for (let i = 0; i < this._pdomAttributes.length; i++) {
      if (this._pdomAttributes[i].attribute === attribute && this._pdomAttributes[i].options.namespace === options.namespace && this._pdomAttributes[i].options.elementName === options.elementName) {
        attributeFound = true;
      }
    }
    return attributeFound;
  }

  /**
   * Add the class to the PDOM element's classList. The PDOM is generally invisible,
   * but some styling occasionally has an impact on semantics so it is necessary to set styles.
   * Add a class with this function and define the style in stylesheets (likely SceneryStyle).
   */
  setPDOMClass(className, providedOptions) {
    const options = optionize()({
      elementName: PDOMPeer.PRIMARY_SIBLING
    }, providedOptions);

    // if we already have the provided className set to the sibling, do nothing
    for (let i = 0; i < this._pdomClasses.length; i++) {
      const currentClass = this._pdomClasses[i];
      if (currentClass.className === className && currentClass.options.elementName === options.elementName) {
        return;
      }
    }
    this._pdomClasses.push({
      className: className,
      options: options
    });
    for (let j = 0; j < this._pdomInstances.length; j++) {
      const peer = this._pdomInstances[j].peer;
      peer.setClassToElement(className, options);
    }
  }

  /**
   * Remove a class from the classList of one of the elements for this Node.
   */
  removePDOMClass(className, providedOptions) {
    const options = optionize()({
      elementName: PDOMPeer.PRIMARY_SIBLING // see PDOMPeer.getElementName() for valid values, default to the primary sibling
    }, providedOptions);
    let classRemoved = false;
    for (let i = 0; i < this._pdomClasses.length; i++) {
      if (this._pdomClasses[i].className === className && this._pdomClasses[i].options.elementName === options.elementName) {
        this._pdomClasses.splice(i, 1);
        classRemoved = true;
      }
    }
    assert && assert(classRemoved, `Node does not have pdom attribute ${className}`);
    for (let j = 0; j < this._pdomClasses.length; j++) {
      const peer = this.pdomInstances[j].peer;
      peer.removeClassFromElement(className, options);
    }
  }

  /**
   * Get the list of classes assigned to PDOM elements for this Node.
   */
  getPDOMClasses() {
    return this._pdomClasses.slice(0); // defensive copy
  }
  get pdomClasses() {
    return this.getPDOMClasses();
  }

  /**
   * Make the DOM element explicitly focusable with a tab index. Native HTML form elements will generally be in
   * the navigation order without explicitly setting focusable.  If these need to be removed from the navigation
   * order, call setFocusable( false ).  Removing an element from the focus order does not hide the element from
   * assistive technology.
   *
   * @param focusable - null to use the default browser focus for the primary element
   */
  setFocusable(focusable) {
    assert && assert(focusable === null || typeof focusable === 'boolean');
    if (this._focusableOverride !== focusable) {
      this._focusableOverride = focusable;
      for (let i = 0; i < this._pdomInstances.length; i++) {
        // after the override is set, update the focusability of the peer based on this node's value for focusable
        // which may be true or false (but not null)
        // assert && assert( typeof this.focusable === 'boolean' );
        assert && assert(this._pdomInstances[i].peer, 'Peer required to set focusable.');
        this._pdomInstances[i].peer.setFocusable(this.focusable);
      }
    }
  }
  set focusable(isFocusable) {
    this.setFocusable(isFocusable);
  }
  get focusable() {
    return this.isFocusable();
  }

  /**
   * Get whether or not the node is focusable. Use the focusOverride, and then default to browser defined
   * focusable elements.
   */
  isFocusable() {
    if (this._focusableOverride !== null) {
      return this._focusableOverride;
    }

    // if there isn't a tagName yet, then there isn't an element, so we aren't focusable. To support option order.
    else if (this._tagName === null) {
      return false;
    } else {
      return PDOMUtils.tagIsDefaultFocusable(this._tagName);
    }
  }

  /**
   * Sets the source Node that controls positioning of the primary sibling. Transforms along the trail to this
   * node are observed so that the primary sibling is positioned correctly in the global coordinate frame.
   *
   * The transformSourceNode cannot use DAG for now because we need a unique trail to observe transforms.
   *
   * By default, transforms along trails to all of this Node's PDOMInstances are observed. But this
   * function can be used if you have a visual Node represented in the PDOM by a different Node in the scene
   * graph but still need the other Node's PDOM content positioned over the visual node. For example, this could
   * be required to catch all fake pointer events that may come from certain types of screen readers.
   */
  setPDOMTransformSourceNode(node) {
    this._pdomTransformSourceNode = node;
    for (let i = 0; i < this._pdomInstances.length; i++) {
      this._pdomInstances[i].peer.setPDOMTransformSourceNode(this._pdomTransformSourceNode);
    }
  }
  set pdomTransformSourceNode(node) {
    this.setPDOMTransformSourceNode(node);
  }
  get pdomTransformSourceNode() {
    return this.getPDOMTransformSourceNode();
  }

  /**
   * Get the source Node that controls positioning of the primary sibling in the global coordinate frame. See
   * setPDOMTransformSourceNode for more in depth information.
   */
  getPDOMTransformSourceNode() {
    return this._pdomTransformSourceNode;
  }

  /**
   * Used by the animatedPanZoomSingleton. It will try to keep these bounds visible in the viewport when this Node
   * (or any ancestor) has a transform change while focused. This is useful if the bounds of your focusable
   * Node do not accurately surround the conceptual interactive component. If null, this Node's local bounds
   * are used.
   *
   * At this time, the Property cannot be changed after it is set.
   */
  setFocusPanTargetBoundsProperty(boundsProperty) {
    // We may call this more than once with mutate
    if (boundsProperty !== this._focusPanTargetBoundsProperty) {
      assert && assert(!this._focusPanTargetBoundsProperty, 'Cannot change focusPanTargetBoundsProperty after it is set.');
      this._focusPanTargetBoundsProperty = boundsProperty;
    }
  }

  /**
   * Returns the function for creating global bounds to keep in the viewport while the component has focus, see the
   * setFocusPanTargetBoundsProperty function for more information.
   */
  getFocusPanTargetBoundsProperty() {
    return this._focusPanTargetBoundsProperty;
  }

  /**
   * See setFocusPanTargetBoundsProperty for more information.
   */
  set focusPanTargetBoundsProperty(boundsProperty) {
    this.setFocusPanTargetBoundsProperty(boundsProperty);
  }

  /**
   * See getFocusPanTargetBoundsProperty for more information.
   */
  get focusPanTargetBoundsProperty() {
    return this.getFocusPanTargetBoundsProperty();
  }

  /**
   * Sets the direction that the global AnimatedPanZoomListener will pan while interacting with this Node. Pan will ONLY
   * occur in this dimension. This is especially useful for panning to large Nodes where panning to the center of the
   * Node would move other Nodes out of the viewport.
   *
   * Set to null for default behavior (panning in all directions).
   */
  setLimitPanDirection(limitPanDirection) {
    this._limitPanDirection = limitPanDirection;
  }

  /**
   * See setLimitPanDirection for more information.
   */
  getLimitPanDirection() {
    return this._limitPanDirection;
  }

  /**
   * See setLimitPanDirection for more information.
   * @param limitPanDirection
   */
  set limitPanDirection(limitPanDirection) {
    this.setLimitPanDirection(limitPanDirection);
  }

  /**
   * See getLimitPanDirection for more information.
   */
  get limitPanDirection() {
    return this.getLimitPanDirection();
  }

  /**
   * Sets whether the PDOM sibling elements are positioned in the correct place in the viewport. Doing so is a
   * requirement for custom gestures on touch based screen readers. However, doing this DOM layout is expensive so
   * only do this when necessary. Generally only needed for elements that utilize a "double tap and hold" gesture
   * to drag and drop.
   *
   * Positioning the PDOM element will caused some screen readers to send both click and pointer events to the
   * location of the Node in global coordinates. Do not position elements that use click listeners since activation
   * will fire twice (once for the pointer event listeners and once for the click event listeners).
   */
  setPositionInPDOM(positionInPDOM) {
    this._positionInPDOM = positionInPDOM;
    for (let i = 0; i < this._pdomInstances.length; i++) {
      this._pdomInstances[i].peer.setPositionInPDOM(positionInPDOM);
    }
  }
  set positionInPDOM(positionInPDOM) {
    this.setPositionInPDOM(positionInPDOM);
  }
  get positionInPDOM() {
    return this.getPositionInPDOM();
  }

  /**
   * Gets whether or not we are positioning the PDOM sibling elements. See setPositionInPDOM().
   */
  getPositionInPDOM() {
    return this._positionInPDOM;
  }

  /**
   * This function should be used sparingly as a workaround. If used, any DOM input events received from the label
   * sibling will not be dispatched as SceneryEvents in Input.js. The label sibling may receive input by screen
   * readers if the virtual cursor is over it. That is usually fine, but there is a bug with NVDA and Firefox where
   * both the label sibling AND primary sibling receive events in this case, and both bubble up to the root of the
   * PDOM, and so we would otherwise dispatch two SceneryEvents instead of one.
   *
   * See https://github.com/phetsims/a11y-research/issues/156 for more information.
   */
  setExcludeLabelSiblingFromInput() {
    this.excludeLabelSiblingFromInput = true;
    this.onPDOMContentChange();
  }

  /**
   * Return true if this Node is a PhET-iO archetype or it is a Node descendant of a PhET-iO archetype.
   * See https://github.com/phetsims/joist/issues/817
   */
  isInsidePhetioArchetype(node = this) {
    if (node.isPhetioInstrumented()) {
      return node.phetioIsArchetype;
    }
    for (let i = 0; i < node.parents.length; i++) {
      if (this.isInsidePhetioArchetype(node.parents[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Alert on all interactive description utteranceQueues located on each connected Display. See
   * Node.getConnectedDisplays. Note that if your Node is not connected to a Display, this function will have
   * no effect.
   */
  alertDescriptionUtterance(utterance) {
    // No description should be alerted if setting PhET-iO state, see https://github.com/phetsims/scenery/issues/1397
    if (isSettingPhetioStateProperty.value) {
      return;
    }

    // No description should be alerted if an archetype of a PhET-iO dynamic element, see https://github.com/phetsims/joist/issues/817
    if (Tandem.PHET_IO_ENABLED && this.isInsidePhetioArchetype()) {
      return;
    }
    const connectedDisplays = this.getConnectedDisplays();
    for (let i = 0; i < connectedDisplays.length; i++) {
      const display = connectedDisplays[i];
      if (display.isAccessible()) {
        // Don't use `forEachUtterance` to prevent creating a closure for each usage of this function
        display.descriptionUtteranceQueue.addToBack(utterance);
      }
    }
  }

  /**
   * Apply a callback on each utteranceQueue that this Node has a connection to (via Display). Note that only
   * accessible Displays have utteranceQueues that this function will interface with.
   */
  forEachUtteranceQueue(callback) {
    const connectedDisplays = this.getConnectedDisplays();

    // If you run into this assertion, talk to @jessegreenberg and @zepumph, because it is quite possible we would
    // remove this assertion for your case.
    assert && assert(connectedDisplays.length > 0, 'must be connected to a display to use UtteranceQueue features');
    for (let i = 0; i < connectedDisplays.length; i++) {
      const display = connectedDisplays[i];
      if (display.isAccessible()) {
        callback(display.descriptionUtteranceQueue);
      }
    }
  }

  /***********************************************************************************************************/
  // SCENERY-INTERNAL AND PRIVATE METHODS
  /***********************************************************************************************************/

  /**
   * Used to get a list of all settable options and their current values. (scenery-internal)
   *
   * @returns - keys are all accessibility option keys, and the values are the values of those properties
   * on this node.
   */
  getBaseOptions() {
    const currentOptions = {};
    for (let i = 0; i < ACCESSIBILITY_OPTION_KEYS.length; i++) {
      const optionName = ACCESSIBILITY_OPTION_KEYS[i];

      // @ts-expect-error - Not sure of a great way to do this
      currentOptions[optionName] = this[optionName];
    }
    return currentOptions;
  }

  /**
   * Returns a recursive data structure that represents the nested ordering of pdom content for this Node's
   * subtree. Each "Item" will have the type { trail: {Trail}, children: {Array.<Item>} }, forming a tree-like
   * structure. (scenery-internal)
   */
  getNestedPDOMOrder() {
    const currentTrail = new Trail(this);
    let pruneStack = []; // A list of nodes to prune

    // {Array.<Item>} - The main result we will be returning. It is the top-level array where child items will be
    // inserted.
    const result = [];

    // {Array.<Array.<Item>>} A stack of children arrays, where we should be inserting items into the top array.
    // We will start out with the result, and as nested levels are added, the children arrays of those items will be
    // pushed and poppped, so that the top array on this stack is where we should insert our next child item.
    const nestedChildStack = [result];
    function addTrailsForNode(node, overridePruning) {
      // If subtrees were specified with pdomOrder, they should be skipped from the ordering of ancestor subtrees,
      // otherwise we could end up having multiple references to the same trail (which should be disallowed).
      let pruneCount = 0;
      // count the number of times our node appears in the pruneStack
      _.each(pruneStack, pruneNode => {
        if (node === pruneNode) {
          pruneCount++;
        }
      });

      // If overridePruning is set, we ignore one reference to our node in the prune stack. If there are two copies,
      // however, it means a node was specified in a pdomOrder that already needs to be pruned (so we skip it instead
      // of creating duplicate references in the traversal order).
      if (pruneCount > 1 || pruneCount === 1 && !overridePruning) {
        return;
      }

      // Pushing item and its children array, if has pdom content
      if (node.hasPDOMContent) {
        const item = {
          trail: currentTrail.copy(),
          children: []
        };
        nestedChildStack[nestedChildStack.length - 1].push(item);
        nestedChildStack.push(item.children);
      }
      const arrayPDOMOrder = node._pdomOrder === null ? [] : node._pdomOrder;

      // push specific focused nodes to the stack
      pruneStack = pruneStack.concat(arrayPDOMOrder);

      // Visiting trails to ordered nodes.
      // @ts-expect-error
      _.each(arrayPDOMOrder, descendant => {
        // Find all descendant references to the node.
        // NOTE: We are not reordering trails (due to descendant constraints) if there is more than one instance for
        // this descendant node.
        _.each(node.getLeafTrailsTo(descendant), descendantTrail => {
          descendantTrail.removeAncestor(); // strip off 'node', so that we handle only children

          // same as the normal order, but adding a full trail (since we may be referencing a descendant node)
          currentTrail.addDescendantTrail(descendantTrail);
          addTrailsForNode(descendant, true); // 'true' overrides one reference in the prune stack (added above)
          currentTrail.removeDescendantTrail(descendantTrail);
        });
      });

      // Visit everything. If there is a pdomOrder, those trails were already visited, and will be excluded.
      const numChildren = node._children.length;
      for (let i = 0; i < numChildren; i++) {
        const child = node._children[i];
        currentTrail.addDescendant(child, i);
        addTrailsForNode(child, false);
        currentTrail.removeDescendant();
      }

      // pop focused nodes from the stack (that were added above)
      _.each(arrayPDOMOrder, () => {
        pruneStack.pop();
      });

      // Popping children array if has pdom content
      if (node.hasPDOMContent) {
        nestedChildStack.pop();
      }
    }
    addTrailsForNode(this, false);
    return result;
  }

  /**
   * Sets the pdom content for a Node. See constructor for more information. Not part of the ParallelDOM
   * API (scenery-internal)
   */
  onPDOMContentChange() {
    PDOMTree.pdomContentChange(this);

    // recompute the heading level for this node if it is using the pdomHeading API.
    this.pdomHeading && this.computeHeadingLevel();
    this.rendererSummaryRefreshEmitter.emit();
  }

  /**
   * Returns whether or not this Node has any representation for the Parallel DOM.
   * Note this is still true if the content is pdomVisible=false or is otherwise hidden.
   */
  get hasPDOMContent() {
    return !!this._tagName;
  }

  /**
   * Called when the node is added as a child to this node AND the node's subtree contains pdom content.
   * We need to notify all Displays that can see this change, so that they can update the PDOMInstance tree.
   */
  onPDOMAddChild(node) {
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.ParallelDOM(`onPDOMAddChild n#${node.id} (parent:n#${this.id})`);
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.push();

    // Find descendants with pdomOrders and check them against all of their ancestors/self
    assert && function recur(descendant) {
      // Prune the search (because milliseconds don't grow on trees, even if we do have assertions enabled)
      if (descendant._rendererSummary.hasNoPDOM()) {
        return;
      }
      descendant.pdomOrder && assert(descendant.getTrails(node => _.includes(descendant.pdomOrder, node)).length === 0, 'pdomOrder should not include any ancestors or the node itself');
    }(node);
    assert && PDOMTree.auditNodeForPDOMCycles(this);
    this._pdomDisplaysInfo.onAddChild(node);
    PDOMTree.addChild(this, node);
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.pop();
  }

  /**
   * Called when the node is removed as a child from this node AND the node's subtree contains pdom content.
   * We need to notify all Displays that can see this change, so that they can update the PDOMInstance tree.
   */
  onPDOMRemoveChild(node) {
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.ParallelDOM(`onPDOMRemoveChild n#${node.id} (parent:n#${this.id})`);
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.push();
    this._pdomDisplaysInfo.onRemoveChild(node);
    PDOMTree.removeChild(this, node);

    // make sure that the associations for aria-labelledby and aria-describedby are updated for nodes associated
    // to this Node (they are pointing to this Node's IDs). https://github.com/phetsims/scenery/issues/816
    node.updateOtherNodesAriaLabelledby();
    node.updateOtherNodesAriaDescribedby();
    node.updateOtherNodesActiveDescendant();
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.pop();
  }

  /**
   * Called when this node's children are reordered (with nothing added/removed).
   */
  onPDOMReorderedChildren() {
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.ParallelDOM(`onPDOMReorderedChildren (parent:n#${this.id})`);
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.push();
    PDOMTree.childrenOrderChange(this);
    sceneryLog && sceneryLog.ParallelDOM && sceneryLog.pop();
  }

  /**
   * Handles linking and checking child PhET-iO Properties such as Node.visibleProperty and Node.enabledProperty.
   */
  updateLinkedElementForProperty(tandemName, oldProperty, newProperty) {
    assert && assert(oldProperty !== newProperty, 'should not be called on same values');

    // Only update linked elements if this Node is instrumented for PhET-iO
    if (this.isPhetioInstrumented()) {
      oldProperty && oldProperty instanceof ReadOnlyProperty && oldProperty.isPhetioInstrumented() && oldProperty instanceof PhetioObject && this.removeLinkedElements(oldProperty);
      const tandem = this.tandem.createTandem(tandemName);
      if (newProperty && newProperty instanceof ReadOnlyProperty && newProperty.isPhetioInstrumented() && newProperty instanceof PhetioObject && tandem !== newProperty.tandem) {
        this.addLinkedElement(newProperty, {
          tandemName: tandemName
        });
      }
    }
  }

  /*---------------------------------------------------------------------------*/
  //
  // PDOM Instance handling

  /**
   * Returns a reference to the pdom instances array. (scenery-internal)
   */
  getPDOMInstances() {
    return this._pdomInstances;
  }
  get pdomInstances() {
    return this.getPDOMInstances();
  }

  /**
   * Adds a PDOMInstance reference to our array. (scenery-internal)
   */
  addPDOMInstance(pdomInstance) {
    this._pdomInstances.push(pdomInstance);
  }

  /**
   * Removes a PDOMInstance reference from our array. (scenery-internal)
   */
  removePDOMInstance(pdomInstance) {
    const index = _.indexOf(this._pdomInstances, pdomInstance);
    assert && assert(index !== -1, 'Cannot remove a PDOMInstance from a Node if it was not there');
    this._pdomInstances.splice(index, 1);
  }
  static BASIC_ACCESSIBLE_NAME_BEHAVIOR(node, options, accessibleName) {
    if (node.tagName === 'input') {
      options.labelTagName = 'label';
      options.labelContent = accessibleName;
    } else if (PDOMUtils.tagNameSupportsContent(node.tagName)) {
      options.innerContent = accessibleName;
    } else {
      options.ariaLabel = accessibleName;
    }
    return options;
  }
  static HELP_TEXT_BEFORE_CONTENT(node, options, helpText) {
    options.descriptionTagName = PDOMUtils.DEFAULT_DESCRIPTION_TAG_NAME;
    options.descriptionContent = helpText;
    options.appendDescription = false;
    return options;
  }
  static HELP_TEXT_AFTER_CONTENT(node, options, helpText) {
    options.descriptionTagName = PDOMUtils.DEFAULT_DESCRIPTION_TAG_NAME;
    options.descriptionContent = helpText;
    options.appendDescription = true;
    return options;
  }
}
scenery.register('ParallelDOM', ParallelDOM);
export { ACCESSIBILITY_OPTION_KEYS };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsInZhbGlkYXRlIiwiVmFsaWRhdGlvbiIsImFycmF5RGlmZmVyZW5jZSIsIlBoZXRpb09iamVjdCIsIk5vZGUiLCJQRE9NRGlzcGxheXNJbmZvIiwiUERPTVBlZXIiLCJQRE9NVHJlZSIsIlBET01VdGlscyIsInNjZW5lcnkiLCJUcmFpbCIsIm9wdGlvbml6ZSIsIlRhbmRlbSIsImlzVFJlYWRPbmx5UHJvcGVydHkiLCJSZWFkT25seVByb3BlcnR5IiwiaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSIsIlRpbnlGb3J3YXJkaW5nUHJvcGVydHkiLCJJTlBVVF9UQUciLCJUQUdTIiwiSU5QVVQiLCJQX1RBRyIsIlAiLCJERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FIiwiREVGQVVMVF9MQUJFTF9UQUdfTkFNRSIsIkRFRkFVTFRfUERPTV9IRUFESU5HX0JFSEFWSU9SIiwibm9kZSIsIm9wdGlvbnMiLCJoZWFkaW5nIiwibGFiZWxUYWdOYW1lIiwiaGVhZGluZ0xldmVsIiwibGFiZWxDb250ZW50IiwidW53cmFwUHJvcGVydHkiLCJ2YWx1ZU9yUHJvcGVydHkiLCJyZXN1bHQiLCJ2YWx1ZSIsImFzc2VydCIsIkZPUk1fRUxFTUVOVFMiLCJJTlBVVF9UWVBFU19USEFUX1NVUFBPUlRfQ0hFQ0tFRCIsIkFTU09DSUFUSU9OX0FUVFJJQlVURVMiLCJBQ0NFU1NJQklMSVRZX09QVElPTl9LRVlTIiwiUGFyYWxsZWxET00iLCJfaW5wdXRWYWx1ZSIsIl9sYWJlbENvbnRlbnQiLCJfaW5uZXJDb250ZW50IiwiX2Rlc2NyaXB0aW9uQ29udGVudCIsIl9hcmlhTGFiZWwiLCJfaGFzQXBwbGllZEFyaWFMYWJlbCIsIl9hcmlhVmFsdWVUZXh0IiwiX2hhc0FwcGxpZWRBcmlhVmFsdWVUZXh0IiwiX2FjY2Vzc2libGVOYW1lIiwiX2hlbHBUZXh0IiwiX3Bkb21IZWFkaW5nIiwiZm9jdXNIaWdobGlnaHRDaGFuZ2VkRW1pdHRlciIsInBkb21QYXJlbnRDaGFuZ2VkRW1pdHRlciIsInBkb21EaXNwbGF5c0VtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsIl9vblBET01Db250ZW50Q2hhbmdlTGlzdGVuZXIiLCJvblBET01Db250ZW50Q2hhbmdlIiwiYmluZCIsIl9vbklucHV0VmFsdWVDaGFuZ2VMaXN0ZW5lciIsImludmFsaWRhdGVQZWVySW5wdXRWYWx1ZSIsIl9vbkFyaWFMYWJlbENoYW5nZUxpc3RlbmVyIiwib25BcmlhTGFiZWxDaGFuZ2UiLCJfb25BcmlhVmFsdWVUZXh0Q2hhbmdlTGlzdGVuZXIiLCJvbkFyaWFWYWx1ZVRleHRDaGFuZ2UiLCJfb25MYWJlbENvbnRlbnRDaGFuZ2VMaXN0ZW5lciIsImludmFsaWRhdGVQZWVyTGFiZWxTaWJsaW5nQ29udGVudCIsIl9vbkRlc2NyaXB0aW9uQ29udGVudENoYW5nZUxpc3RlbmVyIiwiaW52YWxpZGF0ZVBlZXJEZXNjcmlwdGlvblNpYmxpbmdDb250ZW50IiwiX29uSW5uZXJDb250ZW50Q2hhbmdlTGlzdGVuZXIiLCJvbklubmVyQ29udGVudFByb3BlcnR5Q2hhbmdlIiwiX3RhZ05hbWUiLCJfY29udGFpbmVyVGFnTmFtZSIsIl9sYWJlbFRhZ05hbWUiLCJfZGVzY3JpcHRpb25UYWdOYW1lIiwiX2lucHV0VHlwZSIsIl9wZG9tQ2hlY2tlZCIsIl9hcHBlbmRMYWJlbCIsIl9hcHBlbmREZXNjcmlwdGlvbiIsIl9wZG9tQXR0cmlidXRlcyIsIl9wZG9tQ2xhc3NlcyIsIl9wZG9tTmFtZXNwYWNlIiwiX2FyaWFSb2xlIiwiX2NvbnRhaW5lckFyaWFSb2xlIiwiX2FyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zIiwiX25vZGVzVGhhdEFyZUFyaWFMYWJlbGxlZGJ5VGhpc05vZGUiLCJfYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zIiwiX25vZGVzVGhhdEFyZUFyaWFEZXNjcmliZWRieVRoaXNOb2RlIiwiX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMiLCJfbm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGUiLCJfZm9jdXNhYmxlT3ZlcnJpZGUiLCJfZm9jdXNIaWdobGlnaHQiLCJfZm9jdXNIaWdobGlnaHRMYXllcmFibGUiLCJfZ3JvdXBGb2N1c0hpZ2hsaWdodCIsIl9wZG9tT3JkZXIiLCJfcGRvbVBhcmVudCIsIl9wZG9tVHJhbnNmb3JtU291cmNlTm9kZSIsIl9mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5IiwiX2xpbWl0UGFuRGlyZWN0aW9uIiwiX3Bkb21EaXNwbGF5c0luZm8iLCJfcGRvbUluc3RhbmNlcyIsIl9wb3NpdGlvbkluUERPTSIsImV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQiLCJfcGRvbVZpc2libGVQcm9wZXJ0eSIsIm9uUGRvbVZpc2libGVQcm9wZXJ0eUNoYW5nZSIsIl9hY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIiwiQkFTSUNfQUNDRVNTSUJMRV9OQU1FX0JFSEFWSU9SIiwiX2hlbHBUZXh0QmVoYXZpb3IiLCJIRUxQX1RFWFRfQUZURVJfQ09OVEVOVCIsIl9oZWFkaW5nTGV2ZWwiLCJfcGRvbUhlYWRpbmdCZWhhdmlvciIsInBkb21Cb3VuZElucHV0RW5hYmxlZExpc3RlbmVyIiwicGRvbUlucHV0RW5hYmxlZExpc3RlbmVyIiwiZGlzcG9zZVBhcmFsbGVsRE9NIiwiaXNEaXNwb3NlZCIsInVubGluayIsImlucHV0RW5hYmxlZFByb3BlcnR5IiwicGRvbU9yZGVyIiwic2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUiLCJzZXRBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsInNldEFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucyIsInNldEFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMiLCJyZW1vdmVQRE9NQXR0cmlidXRlcyIsImRpc3Bvc2UiLCJlbmFibGVkIiwic2V0UERPTUF0dHJpYnV0ZSIsImlzRm9jdXNlZCIsImkiLCJsZW5ndGgiLCJwZWVyIiwiZm9jdXNlZCIsImZvY3VzIiwiZm9jdXNhYmxlIiwicGRvbVZpc2libGUiLCJibHVyIiwicGRvbUF1ZGl0IiwiaGFzUERPTUNvbnRlbnQiLCJ0b1VwcGVyQ2FzZSIsImluY2x1ZGVzIiwiZm9jdXNIaWdobGlnaHQiLCJhcmlhUm9sZSIsImlubmVyQ29udGVudCIsImFjY2Vzc2libGVOYW1lIiwiY2hpbGRyZW4iLCJzZXRBY2Nlc3NpYmxlTmFtZSIsImxhenlMaW5rIiwiZ2V0QWNjZXNzaWJsZU5hbWUiLCJyZW1vdmVGcm9tUERPTSIsInRhZ05hbWUiLCJzZXRBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIiwiYWNjZXNzaWJsZU5hbWVCZWhhdmlvciIsImdldEFjY2Vzc2libGVOYW1lQmVoYXZpb3IiLCJzZXRQRE9NSGVhZGluZyIsInBkb21IZWFkaW5nIiwiZ2V0UERPTUhlYWRpbmciLCJzZXRQRE9NSGVhZGluZ0JlaGF2aW9yIiwicGRvbUhlYWRpbmdCZWhhdmlvciIsImdldFBET01IZWFkaW5nQmVoYXZpb3IiLCJnZXRIZWFkaW5nTGV2ZWwiLCJjb21wdXRlSGVhZGluZ0xldmVsIiwibGV2ZWwiLCJzZXRIZWxwVGV4dCIsImhlbHBUZXh0IiwiZ2V0SGVscFRleHQiLCJzZXRIZWxwVGV4dEJlaGF2aW9yIiwiaGVscFRleHRCZWhhdmlvciIsImdldEhlbHBUZXh0QmVoYXZpb3IiLCJzZXRUYWdOYW1lIiwiZ2V0VGFnTmFtZSIsInNldExhYmVsVGFnTmFtZSIsImdldExhYmVsVGFnTmFtZSIsInNldERlc2NyaXB0aW9uVGFnTmFtZSIsImRlc2NyaXB0aW9uVGFnTmFtZSIsImdldERlc2NyaXB0aW9uVGFnTmFtZSIsInNldElucHV0VHlwZSIsImlucHV0VHlwZSIsInJlbW92ZUF0dHJpYnV0ZUZyb21FbGVtZW50Iiwic2V0QXR0cmlidXRlVG9FbGVtZW50IiwiZ2V0SW5wdXRUeXBlIiwic2V0QXBwZW5kTGFiZWwiLCJhcHBlbmRMYWJlbCIsImdldEFwcGVuZExhYmVsIiwic2V0QXBwZW5kRGVzY3JpcHRpb24iLCJhcHBlbmREZXNjcmlwdGlvbiIsImdldEFwcGVuZERlc2NyaXB0aW9uIiwic2V0Q29udGFpbmVyVGFnTmFtZSIsImNvbnRhaW5lclRhZ05hbWUiLCJnZXRDb250YWluZXJUYWdOYW1lIiwic2V0TGFiZWxTaWJsaW5nQ29udGVudCIsInNldExhYmVsQ29udGVudCIsImxhYmVsIiwiZ2V0TGFiZWxDb250ZW50Iiwic2V0UHJpbWFyeVNpYmxpbmdDb250ZW50Iiwic2V0SW5uZXJDb250ZW50IiwiY29udGVudCIsImdldElubmVyQ29udGVudCIsImRlc2NyaXB0aW9uQ29udGVudCIsInNldERlc2NyaXB0aW9uU2libGluZ0NvbnRlbnQiLCJzZXREZXNjcmlwdGlvbkNvbnRlbnQiLCJ0ZXh0Q29udGVudCIsImdldERlc2NyaXB0aW9uQ29udGVudCIsInNldEFyaWFSb2xlIiwicmVtb3ZlUERPTUF0dHJpYnV0ZSIsImdldEFyaWFSb2xlIiwic2V0Q29udGFpbmVyQXJpYVJvbGUiLCJlbGVtZW50TmFtZSIsIkNPTlRBSU5FUl9QQVJFTlQiLCJjb250YWluZXJBcmlhUm9sZSIsImdldENvbnRhaW5lckFyaWFSb2xlIiwiYXJpYVZhbHVlVGV4dCIsInNldEFyaWFWYWx1ZVRleHQiLCJnZXRBcmlhVmFsdWVUZXh0Iiwic2V0UERPTU5hbWVzcGFjZSIsInBkb21OYW1lc3BhY2UiLCJnZXRQRE9NTmFtZXNwYWNlIiwiYXJpYUxhYmVsIiwic2V0QXJpYUxhYmVsIiwiZ2V0QXJpYUxhYmVsIiwic2V0Rm9jdXNIaWdobGlnaHQiLCJ2aXNpYmxlIiwiZW1pdCIsImdldEZvY3VzSGlnaGxpZ2h0Iiwic2V0Rm9jdXNIaWdobGlnaHRMYXllcmFibGUiLCJmb2N1c0hpZ2hsaWdodExheWVyYWJsZSIsImdldEZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlIiwic2V0R3JvdXBGb2N1c0hpZ2hsaWdodCIsImdyb3VwSGlnaGxpZ2h0IiwiZ3JvdXBGb2N1c0hpZ2hsaWdodCIsImdldEdyb3VwRm9jdXNIaWdobGlnaHQiLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsImFzc29jaWF0aW9uT2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwiYmVmb3JlT25seSIsImFmdGVyT25seSIsImluQm90aCIsInJlbW92ZUFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24iLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uIiwiYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiIsImdldEFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zIiwicHVzaCIsIm90aGVyTm9kZSIsInVwZGF0ZUFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zSW5QZWVycyIsIl8iLCJyZW1vdmVkT2JqZWN0Iiwic3BsaWNlIiwiaW5kZXhPZiIsInJlbW92ZU5vZGVUaGF0SXNBcmlhTGFiZWxsZWRCeVRoaXNOb2RlIiwiaW5kZXhPZk5vZGUiLCJwZG9tSW5zdGFuY2VzIiwib25BcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uQ2hhbmdlIiwidXBkYXRlT3RoZXJOb2Rlc0FyaWFMYWJlbGxlZGJ5IiwiZ2V0Tm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZSIsIm5vZGVzVGhhdEFyZUFyaWFMYWJlbGxlZGJ5VGhpc05vZGUiLCJhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMiLCJqIiwicmVtb3ZlQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24iLCJhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiIsImFkZEFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uIiwiZ2V0QXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zIiwidXBkYXRlQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zSW5QZWVycyIsImhhc0FyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uIiwicmVtb3ZlTm9kZVRoYXRJc0FyaWFEZXNjcmliZWRCeVRoaXNOb2RlIiwib25BcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbkNoYW5nZSIsInVwZGF0ZU90aGVyTm9kZXNBcmlhRGVzY3JpYmVkYnkiLCJnZXROb2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZSIsIm5vZGVzVGhhdEFyZUFyaWFEZXNjcmliZWRieVRoaXNOb2RlIiwiYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucyIsInJlbW92ZUFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbiIsImFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbiIsImFkZEFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbiIsImdldEFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMiLCJ1cGRhdGVBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zSW5QZWVycyIsInJlbW92ZU5vZGVUaGF0SXNBY3RpdmVEZXNjZW5kYW50VGhpc05vZGUiLCJvbkFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbkNoYW5nZSIsInVwZGF0ZU90aGVyTm9kZXNBY3RpdmVEZXNjZW5kYW50IiwiZ2V0Tm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGUiLCJub2Rlc1RoYXRBcmVBY3RpdmVEZXNjZW5kYW50VG9UaGlzTm9kZSIsInNldFBET01PcmRlciIsImZvckVhY2giLCJpbmRleCIsImdldFRyYWlscyIsIm9sZFBET01PcmRlciIsInNsaWNlIiwicGRvbU9yZGVyQ2hhbmdlIiwicmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXIiLCJnZXRQRE9NT3JkZXIiLCJoYXNQRE9NT3JkZXIiLCJnZXRQRE9NUGFyZW50IiwicGRvbVBhcmVudCIsImdldEVmZmVjdGl2ZUNoaWxkcmVuIiwibm9uT3JkZXJlZENoaWxkcmVuIiwiX2NoaWxkcmVuIiwiY2hpbGQiLCJlZmZlY3RpdmVDaGlsZHJlbiIsInBsYWNlaG9sZGVySW5kZXgiLCJ1bnNoaWZ0IiwicHJvdG90eXBlIiwiYXBwbHkiLCJvblBET01WaXNpYmlsaXR5Q2hhbmdlIiwic2V0UGRvbVZpc2libGVQcm9wZXJ0eSIsIm5ld1RhcmdldCIsInNldFRhcmdldFByb3BlcnR5IiwicGRvbVZpc2libGVQcm9wZXJ0eSIsInByb3BlcnR5IiwiZ2V0UGRvbVZpc2libGVQcm9wZXJ0eSIsInNldFBET01WaXNpYmxlIiwiaXNQRE9NVmlzaWJsZSIsImlzUERPTURpc3BsYXllZCIsImlzR2xvYmFsbHlWaXNpYmxlIiwicGRvbURpc3BsYXllZCIsIm9uSW5wdXRWYWx1ZUNoYW5nZSIsInNldElucHV0VmFsdWUiLCJpbnB1dFZhbHVlIiwiZ2V0SW5wdXRWYWx1ZSIsInNldFBET01DaGVja2VkIiwiY2hlY2tlZCIsImFzUHJvcGVydHkiLCJwZG9tQ2hlY2tlZCIsImdldFBET01DaGVja2VkIiwiZ2V0UERPTUF0dHJpYnV0ZXMiLCJwZG9tQXR0cmlidXRlcyIsImF0dHJpYnV0ZSIsInByb3ZpZGVkT3B0aW9ucyIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwibmFtZXNwYWNlIiwiUFJJTUFSWV9TSUJMSU5HIiwiY3VycmVudEF0dHJpYnV0ZSIsImxpc3RlbmVyIiwicmF3VmFsdWUiLCJTVFJJTkdfV0lUSE9VVF9URU1QTEFURV9WQVJTX1ZBTElEQVRPUiIsImxpbmsiLCJhdHRyaWJ1dGVSZW1vdmVkIiwib2xkQXR0cmlidXRlIiwiYXR0cmlidXRlcyIsImhhc1BET01BdHRyaWJ1dGUiLCJhdHRyaWJ1dGVGb3VuZCIsInNldFBET01DbGFzcyIsImNsYXNzTmFtZSIsImN1cnJlbnRDbGFzcyIsInNldENsYXNzVG9FbGVtZW50IiwicmVtb3ZlUERPTUNsYXNzIiwiY2xhc3NSZW1vdmVkIiwicmVtb3ZlQ2xhc3NGcm9tRWxlbWVudCIsImdldFBET01DbGFzc2VzIiwicGRvbUNsYXNzZXMiLCJzZXRGb2N1c2FibGUiLCJpc0ZvY3VzYWJsZSIsInRhZ0lzRGVmYXVsdEZvY3VzYWJsZSIsInBkb21UcmFuc2Zvcm1Tb3VyY2VOb2RlIiwiZ2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUiLCJzZXRGb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5IiwiYm91bmRzUHJvcGVydHkiLCJnZXRGb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5IiwiZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSIsInNldExpbWl0UGFuRGlyZWN0aW9uIiwibGltaXRQYW5EaXJlY3Rpb24iLCJnZXRMaW1pdFBhbkRpcmVjdGlvbiIsInNldFBvc2l0aW9uSW5QRE9NIiwicG9zaXRpb25JblBET00iLCJnZXRQb3NpdGlvbkluUERPTSIsInNldEV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQiLCJpc0luc2lkZVBoZXRpb0FyY2hldHlwZSIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwicGhldGlvSXNBcmNoZXR5cGUiLCJwYXJlbnRzIiwiYWxlcnREZXNjcmlwdGlvblV0dGVyYW5jZSIsInV0dGVyYW5jZSIsIlBIRVRfSU9fRU5BQkxFRCIsImNvbm5lY3RlZERpc3BsYXlzIiwiZ2V0Q29ubmVjdGVkRGlzcGxheXMiLCJkaXNwbGF5IiwiaXNBY2Nlc3NpYmxlIiwiZGVzY3JpcHRpb25VdHRlcmFuY2VRdWV1ZSIsImFkZFRvQmFjayIsImZvckVhY2hVdHRlcmFuY2VRdWV1ZSIsImNhbGxiYWNrIiwiZ2V0QmFzZU9wdGlvbnMiLCJjdXJyZW50T3B0aW9ucyIsIm9wdGlvbk5hbWUiLCJnZXROZXN0ZWRQRE9NT3JkZXIiLCJjdXJyZW50VHJhaWwiLCJwcnVuZVN0YWNrIiwibmVzdGVkQ2hpbGRTdGFjayIsImFkZFRyYWlsc0Zvck5vZGUiLCJvdmVycmlkZVBydW5pbmciLCJwcnVuZUNvdW50IiwiZWFjaCIsInBydW5lTm9kZSIsIml0ZW0iLCJ0cmFpbCIsImNvcHkiLCJhcnJheVBET01PcmRlciIsImNvbmNhdCIsImRlc2NlbmRhbnQiLCJnZXRMZWFmVHJhaWxzVG8iLCJkZXNjZW5kYW50VHJhaWwiLCJyZW1vdmVBbmNlc3RvciIsImFkZERlc2NlbmRhbnRUcmFpbCIsInJlbW92ZURlc2NlbmRhbnRUcmFpbCIsIm51bUNoaWxkcmVuIiwiYWRkRGVzY2VuZGFudCIsInJlbW92ZURlc2NlbmRhbnQiLCJwb3AiLCJwZG9tQ29udGVudENoYW5nZSIsIm9uUERPTUFkZENoaWxkIiwic2NlbmVyeUxvZyIsImlkIiwicmVjdXIiLCJfcmVuZGVyZXJTdW1tYXJ5IiwiaGFzTm9QRE9NIiwiYXVkaXROb2RlRm9yUERPTUN5Y2xlcyIsIm9uQWRkQ2hpbGQiLCJhZGRDaGlsZCIsIm9uUERPTVJlbW92ZUNoaWxkIiwib25SZW1vdmVDaGlsZCIsInJlbW92ZUNoaWxkIiwib25QRE9NUmVvcmRlcmVkQ2hpbGRyZW4iLCJjaGlsZHJlbk9yZGVyQ2hhbmdlIiwidXBkYXRlTGlua2VkRWxlbWVudEZvclByb3BlcnR5IiwidGFuZGVtTmFtZSIsIm9sZFByb3BlcnR5IiwibmV3UHJvcGVydHkiLCJyZW1vdmVMaW5rZWRFbGVtZW50cyIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsImFkZExpbmtlZEVsZW1lbnQiLCJnZXRQRE9NSW5zdGFuY2VzIiwiYWRkUERPTUluc3RhbmNlIiwicGRvbUluc3RhbmNlIiwicmVtb3ZlUERPTUluc3RhbmNlIiwidGFnTmFtZVN1cHBvcnRzQ29udGVudCIsIkhFTFBfVEVYVF9CRUZPUkVfQ09OVEVOVCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUGFyYWxsZWxET00udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzdXBlcmNsYXNzIGZvciBOb2RlLCBhZGRpbmcgYWNjZXNzaWJpbGl0eSBieSBkZWZpbmluZyBjb250ZW50IGZvciB0aGUgUGFyYWxsZWwgRE9NLiBQbGVhc2Ugbm90ZSB0aGF0IE5vZGUgYW5kXHJcbiAqIFBhcmFsbGVsRE9NIGFyZSBjbG9zZWx5IGludGVydHdpbmVkLCB0aG91Z2ggdGhleSBhcmUgc2VwYXJhdGVkIGludG8gc2VwYXJhdGUgZmlsZXMgaW4gdGhlIHR5cGUgaGllcmFyY2h5LlxyXG4gKlxyXG4gKiBUaGUgUGFyYWxsZWwgRE9NIGlzIGFuIEhUTUwgc3RydWN0dXJlIHRoYXQgcHJvdmlkZXMgc2VtYW50aWNzIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBGb3Igd2ViIGNvbnRlbnQgdG8gYmVcclxuICogYWNjZXNzaWJsZSwgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyByZXF1aXJlIEhUTUwgbWFya3VwLCB3aGljaCBpcyBzb21ldGhpbmcgdGhhdCBwdXJlIGdyYXBoaWNhbCBjb250ZW50IGRvZXMgbm90XHJcbiAqIGluY2x1ZGUuIFRoaXMgYWRkcyB0aGUgYWNjZXNzaWJsZSBIVE1MIGNvbnRlbnQgZm9yIGFueSBOb2RlIGluIHRoZSBzY2VuZSBncmFwaC5cclxuICpcclxuICogQW55IE5vZGUgY2FuIGhhdmUgcGRvbSBjb250ZW50LCBidXQgdGhleSBoYXZlIHRvIG9wdCBpbnRvIGl0LiBUaGUgc3RydWN0dXJlIG9mIHRoZSBwZG9tIGNvbnRlbnQgd2lsbFxyXG4gKiBtYXRjaCB0aGUgc3RydWN0dXJlIG9mIHRoZSBzY2VuZSBncmFwaC5cclxuICpcclxuICogU2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyBzY2VuZSBncmFwaDpcclxuICpcclxuICogICBBXHJcbiAqICAvIFxcXHJcbiAqIEIgICBDXHJcbiAqICAgIC8gXFxcclxuICogICBEICAgRVxyXG4gKiAgICAgICAgXFxcclxuICogICAgICAgICBGXHJcbiAqXHJcbiAqIEFuZCBzYXkgdGhhdCBub2RlcyBBLCBCLCBDLCBELCBhbmQgRiBzcGVjaWZ5IHBkb20gY29udGVudCBmb3IgdGhlIERPTS4gIFNjZW5lcnkgd2lsbCByZW5kZXIgdGhlIHBkb21cclxuICogY29udGVudCBsaWtlIHNvOlxyXG4gKlxyXG4gKiA8ZGl2IGlkPVwibm9kZS1BXCI+XHJcbiAqICAgPGRpdiBpZD1cIm5vZGUtQlwiPjwvZGl2PlxyXG4gKiAgIDxkaXYgaWQ9XCJub2RlLUNcIj5cclxuICogICAgIDxkaXYgaWQ9XCJub2RlLURcIj48L2Rpdj5cclxuICogICAgIDxkaXYgaWQ9XCJub2RlLUZcIj48L2Rpdj5cclxuICogICA8L2Rpdj5cclxuICogPC9kaXY+XHJcbiAqXHJcbiAqIEluIHRoaXMgZXhhbXBsZSwgZWFjaCBlbGVtZW50IGlzIHJlcHJlc2VudGVkIGJ5IGEgZGl2LCBidXQgYW55IEhUTUwgZWxlbWVudCBjb3VsZCBiZSB1c2VkLiBOb3RlIHRoYXQgaW4gdGhpcyBleGFtcGxlLFxyXG4gKiBub2RlIEUgZGlkIG5vdCBzcGVjaWZ5IHBkb20gY29udGVudCwgc28gbm9kZSBGIHdhcyBhZGRlZCBhcyBhIGNoaWxkIHVuZGVyIG5vZGUgQy4gIElmIG5vZGUgRSBoYWQgc3BlY2lmaWVkXHJcbiAqIHBkb20gY29udGVudCwgY29udGVudCBmb3Igbm9kZSBGIHdvdWxkIGhhdmUgYmVlbiBhZGRlZCBhcyBhIGNoaWxkIHVuZGVyIHRoZSBjb250ZW50IGZvciBub2RlIEUuXHJcbiAqXHJcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICNCQVNJQyBFWEFNUExFXHJcbiAqXHJcbiAqIEluIGEgYmFzaWMgZXhhbXBsZSBsZXQncyBzYXkgdGhhdCB3ZSB3YW50IHRvIG1ha2UgYSBOb2RlIGFuIHVub3JkZXJlZCBsaXN0LiBUbyBkbyB0aGlzLCBhZGQgdGhlIGB0YWdOYW1lYCBvcHRpb24gdG9cclxuICogdGhlIE5vZGUsIGFuZCBhc3NpZ24gaXQgdG8gdGhlIHN0cmluZyBcInVsXCIuIEhlcmUgaXMgd2hhdCB0aGUgY29kZSBjb3VsZCBsb29rIGxpa2U6XHJcbiAqXHJcbiAqIHZhciBteVVub3JkZXJlZExpc3QgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAndWwnIH0gKTtcclxuICpcclxuICogVG8gZ2V0IHRoZSBkZXNpcmVkIGxpc3QgaHRtbCwgd2UgY2FuIGFzc2lnbiB0aGUgYGxpYCBgdGFnTmFtZWAgdG8gY2hpbGRyZW4gTm9kZXMsIGxpa2U6XHJcbiAqXHJcbiAqIHZhciBsaXN0SXRlbTEgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnbGknIH0gKTtcclxuICogbXlVbm9yZGVyZWRMaXN0LmFkZENoaWxkKCBsaXN0SXRlbTEgKTtcclxuICpcclxuICogTm93IHdlIGhhdmUgYSBzaW5nbGUgbGlzdCBlbGVtZW50IGluIHRoZSB1bm9yZGVyZWQgbGlzdC4gVG8gYXNzaWduIGNvbnRlbnQgdG8gdGhpcyA8bGk+LCB1c2UgdGhlIGBpbm5lckNvbnRlbnRgXHJcbiAqIG9wdGlvbiAoYWxsIG9mIHRoZXNlIE5vZGUgb3B0aW9ucyBoYXZlIGdldHRlcnMgYW5kIHNldHRlcnMsIGp1c3QgbGlrZSBhbnkgb3RoZXIgTm9kZSBvcHRpb24pOlxyXG4gKlxyXG4gKiBsaXN0SXRlbTEuaW5uZXJDb250ZW50ID0gJ0kgYW0gbGlzdCBpdGVtIG51bWJlciAxJztcclxuICpcclxuICogVGhlIGFib3ZlIG9wZXJhdGlvbnMgd2lsbCBjcmVhdGUgdGhlIGZvbGxvd2luZyBQRE9NIHN0cnVjdHVyZSAobm90ZSB0aGF0IGFjdHVhbCBpZHMgd2lsbCBiZSBkaWZmZXJlbnQpOlxyXG4gKlxyXG4gKiA8dWwgaWQ9J215VW5vcmRlcmVkTGlzdCc+XHJcbiAqICAgPGxpPkkgYW0gYSBsaXN0IGl0ZW0gbnVtYmVyIDE8L2xpPlxyXG4gKiA8L3VsXHJcbiAqXHJcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICNET00gU0lCTElOR1NcclxuICpcclxuICogVGhlIEFQSSBpbiB0aGlzIGNsYXNzIGFsbG93cyB5b3UgdG8gYWRkIGFkZGl0aW9uYWwgc3RydWN0dXJlIHRvIHRoZSBhY2Nlc3NpYmxlIERPTSBjb250ZW50IGlmIG5lY2Vzc2FyeS4gRWFjaCBub2RlXHJcbiAqIGNhbiBoYXZlIG11bHRpcGxlIERPTSBFbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggaXQuIEEgTm9kZSBjYW4gaGF2ZSBhIGxhYmVsIERPTSBlbGVtZW50LCBhbmQgYSBkZXNjcmlwdGlvbiBET00gZWxlbWVudC5cclxuICogVGhlc2UgYXJlIGNhbGxlZCBzaWJsaW5ncy4gVGhlIE5vZGUncyBkaXJlY3QgRE9NIGVsZW1lbnQgKHRoZSBET00gZWxlbWVudCB5b3UgY3JlYXRlIHdpdGggdGhlIGB0YWdOYW1lYCBvcHRpb24pXHJcbiAqIGlzIGNhbGxlZCB0aGUgXCJwcmltYXJ5IHNpYmxpbmcuXCIgWW91IGNhbiBhbHNvIGhhdmUgYSBjb250YWluZXIgcGFyZW50IERPTSBlbGVtZW50IHRoYXQgc3Vycm91bmRzIGFsbCBvZiB0aGVzZVxyXG4gKiBzaWJsaW5ncy4gV2l0aCB0aHJlZSBzaWJsaW5ncyBhbmQgYSBjb250YWluZXIgcGFyZW50LCBlYWNoIE5vZGUgY2FuIGhhdmUgdXAgdG8gNCBET00gRWxlbWVudHMgcmVwcmVzZW50aW5nIGl0IGluIHRoZVxyXG4gKiBQRE9NLiBIZXJlIGlzIGFuIGV4YW1wbGUgb2YgaG93IGEgTm9kZSBtYXkgdXNlIHRoZXNlIGZlYXR1cmVzOlxyXG4gKlxyXG4gKiA8ZGl2PlxyXG4gKiAgIDxsYWJlbCBmb3I9XCJteUlucHV0XCI+VGhpcyBncmVhdCBsYWJlbCBmb3IgaW5wdXQ8L2xhYmVsXHJcbiAqICAgPGlucHV0IGlkPVwibXlJbnB1dFwiLz5cclxuICogICA8cD5UaGlzIGlzIGEgZGVzY3JpcHRpb24gZm9yIHRoZSBpbnB1dDwvcD5cclxuICogPC9kaXY+XHJcbiAqXHJcbiAqIEFsdGhvdWdoIHlvdSBjYW4gY3JlYXRlIHRoaXMgc3RydWN0dXJlIHdpdGggZm91ciBub2RlcyAoYGlucHV0YCBBLCBgbGFiZWwgQiwgYW5kIGBwYCBDIGNoaWxkcmVuIHRvIGBkaXZgIEQpLFxyXG4gKiB0aGlzIHN0cnVjdHVyZSBjYW4gYmUgY3JlYXRlZCB3aXRoIG9uZSBzaW5nbGUgTm9kZS4gSXQgaXMgb2Z0ZW4gcHJlZmVyYWJsZSB0byBkbyB0aGlzIHRvIGxpbWl0IHRoZSBudW1iZXIgb2YgbmV3XHJcbiAqIE5vZGVzIHRoYXQgaGF2ZSB0byBiZSBjcmVhdGVkIGp1c3QgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuIFRvIGFjY29tcGxpc2ggdGhpcyB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgTm9kZSBjb2RlLlxyXG4gKlxyXG4gKiBuZXcgTm9kZSgge1xyXG4gKiAgdGFnTmFtZTogJ2lucHV0J1xyXG4gKiAgbGFiZWxUYWdOYW1lOiAnbGFiZWwnLFxyXG4gKiAgbGFiZWxDb250ZW50OiAnVGhpcyBncmVhdCBsYWJlbCBmb3IgaW5wdXQnXHJcbiAqICBkZXNjcmlwdGlvblRhZ05hbWU6ICdwJyxcclxuICogIGRlc2NyaXB0aW9uQ29udGVudDogJ1RoaXMgaXMgYSBkZXNjcmlwdGlvbiBmb3IgdGhlIGlucHV0JyxcclxuICogIGNvbnRhaW5lclRhZ05hbWU6ICdkaXYnXHJcbiAqIH0pO1xyXG4gKlxyXG4gKiBBIGZldyBub3RlczpcclxuICogMS4gT25seSB0aGUgcHJpbWFyeSBzaWJsaW5nIChzcGVjaWZpZWQgYnkgdGFnTmFtZSkgaXMgZm9jdXNhYmxlLiBVc2luZyBhIGZvY3VzYWJsZSBlbGVtZW50IHRocm91Z2ggYW5vdGhlciBlbGVtZW50XHJcbiAqICAgIChsaWtlIGxhYmVsVGFnTmFtZSkgd2lsbCByZXN1bHQgaW4gYnVnZ3kgYmVoYXZpb3IuXHJcbiAqIDIuIE5vdGljZSB0aGUgbmFtZXMgb2YgdGhlIGNvbnRlbnQgc2V0dGVycyBmb3Igc2libGluZ3MgcGFyYWxsZWwgdGhlIGBpbm5lckNvbnRlbnRgIG9wdGlvbiBmb3Igc2V0dGluZyB0aGUgcHJpbWFyeVxyXG4gKiAgICBzaWJsaW5nLlxyXG4gKiAzLiBUbyBtYWtlIHRoaXMgZXhhbXBsZSBhY3R1YWxseSB3b3JrLCB5b3Ugd291bGQgbmVlZCB0aGUgYGlucHV0VHlwZWAgb3B0aW9uIHRvIHNldCB0aGUgXCJ0eXBlXCIgYXR0cmlidXRlIG9uIHRoZSBgaW5wdXRgLlxyXG4gKiA0LiBXaGVuIHlvdSBzcGVjaWZ5IHRoZSAgPGxhYmVsPiB0YWcgZm9yIHRoZSBsYWJlbCBzaWJsaW5nLCB0aGUgXCJmb3JcIiBhdHRyaWJ1dGUgaXMgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgc2libGluZy5cclxuICogNS4gRmluYWxseSwgdGhlIGV4YW1wbGUgYWJvdmUgZG9lc24ndCB1dGlsaXplIHRoZSBkZWZhdWx0IHRhZ3MgdGhhdCB3ZSBoYXZlIGluIHBsYWNlIGZvciB0aGUgcGFyZW50IGFuZCBzaWJsaW5ncy5cclxuICogICAgICBkZWZhdWx0IGxhYmVsVGFnTmFtZTogJ3AnXHJcbiAqICAgICAgZGVmYXVsdCBkZXNjcmlwdGlvblRhZ05hbWU6ICdwJ1xyXG4gKiAgICAgIGRlZmF1bHQgY29udGFpbmVyVGFnTmFtZTogJ2RpdidcclxuICogICAgc28gdGhlIGZvbGxvd2luZyB3aWxsIHlpZWxkIHRoZSBzYW1lIFBET00gc3RydWN0dXJlOlxyXG4gKlxyXG4gKiAgICBuZXcgTm9kZSgge1xyXG4gKiAgICAgdGFnTmFtZTogJ2lucHV0JyxcclxuICogICAgIGxhYmVsVGFnTmFtZTogJ2xhYmVsJyxcclxuICogICAgIGxhYmVsQ29udGVudDogJ1RoaXMgZ3JlYXQgbGFiZWwgZm9yIGlucHV0J1xyXG4gKiAgICAgZGVzY3JpcHRpb25Db250ZW50OiAnVGhpcyBpcyBhIGRlc2NyaXB0aW9uIGZvciB0aGUgaW5wdXQnLFxyXG4gKiAgICB9KTtcclxuICpcclxuICogVGhlIFBhcmFsbGVsRE9NIGNsYXNzIGlzIHNtYXJ0IGVub3VnaCB0byBrbm93IHdoZW4gdGhlcmUgbmVlZHMgdG8gYmUgYSBjb250YWluZXIgcGFyZW50IHRvIHdyYXAgbXVsdGlwbGUgc2libGluZ3MsXHJcbiAqIGl0IGlzIG5vdCBuZWNlc3NhcnkgdG8gdXNlIHRoYXQgb3B0aW9uIHVubGVzcyB0aGUgZGVzaXJlZCB0YWcgbmFtZSBpcyAgc29tZXRoaW5nIG90aGVyIHRoYW4gJ2RpdicuXHJcbiAqXHJcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqXHJcbiAqIEZvciBhZGRpdGlvbmFsIGFjY2Vzc2liaWxpdHkgb3B0aW9ucywgcGxlYXNlIHNlZSB0aGUgb3B0aW9ucyBsaXN0ZWQgaW4gQUNDRVNTSUJJTElUWV9PUFRJT05fS0VZUy4gVG8gdW5kZXJzdGFuZCB0aGVcclxuICogUERPTSBtb3JlLCBzZWUgUERPTVBlZXIsIHdoaWNoIG1hbmFnZXMgdGhlIERPTSBFbGVtZW50cyBmb3IgYSBub2RlLiBGb3IgbW9yZSBkb2N1bWVudGF0aW9uIG9uIFNjZW5lcnksIE5vZGVzLFxyXG4gKiBhbmQgdGhlIHNjZW5lIGdyYXBoLCBwbGVhc2Ugc2VlIGh0dHA6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCB2YWxpZGF0ZSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL3ZhbGlkYXRlLmpzJztcclxuaW1wb3J0IFZhbGlkYXRpb24gZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9WYWxpZGF0aW9uLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgYXJyYXlEaWZmZXJlbmNlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheURpZmZlcmVuY2UuanMnO1xyXG5pbXBvcnQgUGhldGlvT2JqZWN0LCB7IFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFV0dGVyYW5jZVF1ZXVlIGZyb20gJy4uLy4uLy4uLy4uL3V0dGVyYW5jZS1xdWV1ZS9qcy9VdHRlcmFuY2VRdWV1ZS5qcyc7XHJcbmltcG9ydCB7IFRBbGVydGFibGUgfSBmcm9tICcuLi8uLi8uLi8uLi91dHRlcmFuY2UtcXVldWUvanMvVXR0ZXJhbmNlLmpzJztcclxuaW1wb3J0IHsgTm9kZSwgUERPTURpc3BsYXlzSW5mbywgUERPTUluc3RhbmNlLCBQRE9NUGVlciwgUERPTVRyZWUsIFBET01VdGlscywgc2NlbmVyeSwgVHJhaWwgfSBmcm9tICcuLi8uLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgSGlnaGxpZ2h0IH0gZnJvbSAnLi4vLi4vb3ZlcmxheXMvSGlnaGxpZ2h0T3ZlcmxheS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5LCB7IGlzVFJlYWRPbmx5UHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5cclxuY29uc3QgSU5QVVRfVEFHID0gUERPTVV0aWxzLlRBR1MuSU5QVVQ7XHJcbmNvbnN0IFBfVEFHID0gUERPTVV0aWxzLlRBR1MuUDtcclxuXHJcbi8vIGRlZmF1bHQgdGFnIG5hbWVzIGZvciBzaWJsaW5nc1xyXG5jb25zdCBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FID0gUF9UQUc7XHJcbmNvbnN0IERFRkFVTFRfTEFCRUxfVEFHX05BTUUgPSBQX1RBRztcclxuXHJcbmV4cG9ydCB0eXBlIFBET01WYWx1ZVR5cGUgPSBzdHJpbmcgfCBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG5leHBvcnQgdHlwZSBMaW1pdFBhbkRpcmVjdGlvbiA9ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCc7XHJcblxyXG4vLyBzZWUgc2V0UERPTUhlYWRpbmdCZWhhdmlvciBmb3IgbW9yZSBkZXRhaWxzXHJcbmNvbnN0IERFRkFVTFRfUERPTV9IRUFESU5HX0JFSEFWSU9SID0gKCBub2RlOiBOb2RlLCBvcHRpb25zOiBQYXJhbGxlbERPTU9wdGlvbnMsIGhlYWRpbmc6IFBET01WYWx1ZVR5cGUgKSA9PiB7XHJcblxyXG4gIG9wdGlvbnMubGFiZWxUYWdOYW1lID0gYGgke25vZGUuaGVhZGluZ0xldmVsfWA7IC8vIFRPRE86IG1ha2Ugc3VyZSBoZWFkaW5nIGxldmVsIGNoYW5nZSBmaXJlcyBhIGZ1bGwgcGVlciByZWJ1aWxkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg2N1xyXG4gIG9wdGlvbnMubGFiZWxDb250ZW50ID0gaGVhZGluZztcclxuICByZXR1cm4gb3B0aW9ucztcclxufTtcclxuXHJcbmNvbnN0IHVud3JhcFByb3BlcnR5ID0gKCB2YWx1ZU9yUHJvcGVydHk6IFBET01WYWx1ZVR5cGUgfCBudWxsICk6IHN0cmluZyB8IG51bGwgPT4ge1xyXG4gIGNvbnN0IHJlc3VsdCA9IHZhbHVlT3JQcm9wZXJ0eSA9PT0gbnVsbCA/IG51bGwgOiAoIHR5cGVvZiB2YWx1ZU9yUHJvcGVydHkgPT09ICdzdHJpbmcnID8gdmFsdWVPclByb3BlcnR5IDogdmFsdWVPclByb3BlcnR5LnZhbHVlICk7XHJcblxyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJyApO1xyXG5cclxuICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLy8gdGhlc2UgZWxlbWVudHMgYXJlIHR5cGljYWxseSBhc3NvY2lhdGVkIHdpdGggZm9ybXMsIGFuZCBzdXBwb3J0IGNlcnRhaW4gYXR0cmlidXRlc1xyXG5jb25zdCBGT1JNX0VMRU1FTlRTID0gUERPTVV0aWxzLkZPUk1fRUxFTUVOVFM7XHJcblxyXG4vLyBsaXN0IG9mIGlucHV0IFwidHlwZVwiIGF0dHJpYnV0ZSB2YWx1ZXMgdGhhdCBzdXBwb3J0IHRoZSBcImNoZWNrZWRcIiBhdHRyaWJ1dGVcclxuY29uc3QgSU5QVVRfVFlQRVNfVEhBVF9TVVBQT1JUX0NIRUNLRUQgPSBQRE9NVXRpbHMuSU5QVVRfVFlQRVNfVEhBVF9TVVBQT1JUX0NIRUNLRUQ7XHJcblxyXG4vLyBIVE1MRWxlbWVudCBhdHRyaWJ1dGVzIHdob3NlIHZhbHVlIGlzIGFuIElEIG9mIGFub3RoZXIgZWxlbWVudFxyXG5jb25zdCBBU1NPQ0lBVElPTl9BVFRSSUJVVEVTID0gUERPTVV0aWxzLkFTU09DSUFUSU9OX0FUVFJJQlVURVM7XHJcblxyXG4vLyBUaGUgb3B0aW9ucyBmb3IgdGhlIFBhcmFsbGVsRE9NIEFQSS4gSW4gZ2VuZXJhbCwgbW9zdCBkZWZhdWx0IHRvIG51bGw7IHRvIGNsZWFyLCBzZXQgYmFjayB0byBudWxsLiBFYWNoIG9uZSBvZlxyXG4vLyB0aGVzZSBoYXMgYW4gYXNzb2NpYXRlZCBzZXR0ZXIsIHNlZSBzZXR0ZXIgZnVuY3Rpb25zIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGVhY2guXHJcbmNvbnN0IEFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVMgPSBbXHJcblxyXG4gIC8vIE9yZGVyIG1hdHRlcnMuIEhhdmluZyBmb2N1cyBiZWZvcmUgdGFnTmFtZSBjb3ZlcnMgdGhlIGNhc2Ugd2hlcmUgeW91IGNoYW5nZSB0aGUgdGFnTmFtZSBhbmQgZm9jdXNhYmlsaXR5IG9mIGFcclxuICAvLyBjdXJyZW50bHkgZm9jdXNlZCBub2RlLiBXZSB3YW50IHRoZSBmb2N1c2FiaWxpdHkgdG8gdXBkYXRlIGNvcnJlY3RseS5cclxuICAnZm9jdXNhYmxlJyxcclxuICAndGFnTmFtZScsXHJcblxyXG4gIC8qXHJcbiAgICogSGlnaGVyIExldmVsIEFQSSBGdW5jdGlvbnNcclxuICAgKi9cclxuICAnYWNjZXNzaWJsZU5hbWUnLFxyXG4gICdhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yJyxcclxuICAnaGVscFRleHQnLFxyXG4gICdoZWxwVGV4dEJlaGF2aW9yJyxcclxuICAncGRvbUhlYWRpbmcnLFxyXG4gICdwZG9tSGVhZGluZ0JlaGF2aW9yJyxcclxuXHJcbiAgLypcclxuICAgKiBMb3dlciBMZXZlbCBBUEkgRnVuY3Rpb25zXHJcbiAgICovXHJcbiAgJ2NvbnRhaW5lclRhZ05hbWUnLFxyXG4gICdjb250YWluZXJBcmlhUm9sZScsXHJcblxyXG4gICdpbm5lckNvbnRlbnQnLFxyXG4gICdpbnB1dFR5cGUnLFxyXG4gICdpbnB1dFZhbHVlJyxcclxuICAncGRvbUNoZWNrZWQnLFxyXG4gICdwZG9tTmFtZXNwYWNlJyxcclxuICAnYXJpYUxhYmVsJyxcclxuICAnYXJpYVJvbGUnLFxyXG4gICdhcmlhVmFsdWVUZXh0JyxcclxuXHJcbiAgJ2xhYmVsVGFnTmFtZScsXHJcbiAgJ2xhYmVsQ29udGVudCcsXHJcbiAgJ2FwcGVuZExhYmVsJyxcclxuXHJcbiAgJ2Rlc2NyaXB0aW9uVGFnTmFtZScsXHJcbiAgJ2Rlc2NyaXB0aW9uQ29udGVudCcsXHJcbiAgJ2FwcGVuZERlc2NyaXB0aW9uJyxcclxuXHJcbiAgJ2ZvY3VzSGlnaGxpZ2h0JyxcclxuICAnZm9jdXNIaWdobGlnaHRMYXllcmFibGUnLFxyXG4gICdncm91cEZvY3VzSGlnaGxpZ2h0JyxcclxuICAncGRvbVZpc2libGVQcm9wZXJ0eScsXHJcbiAgJ3Bkb21WaXNpYmxlJyxcclxuICAncGRvbU9yZGVyJyxcclxuXHJcbiAgJ2FyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zJyxcclxuICAnYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zJyxcclxuICAnYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucycsXHJcblxyXG4gICdmb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5JyxcclxuICAnbGltaXRQYW5EaXJlY3Rpb24nLFxyXG5cclxuICAncG9zaXRpb25JblBET00nLFxyXG5cclxuICAncGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUnXHJcbl07XHJcblxyXG4vLyBNb3N0IG9wdGlvbnMgdXNlIG51bGwgZm9yIHRoZWlyIGRlZmF1bHQgYmVoYXZpb3IsIHNlZSB0aGUgc2V0dGVycyBmb3IgZWFjaCBvcHRpb24gZm9yIGEgZGVzY3JpcHRpb24gb2YgaG93IG51bGxcclxuLy8gYmVoYXZlcyBhcyBhIGRlZmF1bHQuXHJcbmV4cG9ydCB0eXBlIFBhcmFsbGVsRE9NT3B0aW9ucyA9IHtcclxuICBmb2N1c2FibGU/OiBib29sZWFuIHwgbnVsbDsgLy8gU2V0cyB3aGV0aGVyIHRoZSBub2RlIGNhbiByZWNlaXZlIGtleWJvYXJkIGZvY3VzXHJcbiAgdGFnTmFtZT86IHN0cmluZyB8IG51bGw7IC8vIFNldHMgdGhlIHRhZyBuYW1lIGZvciB0aGUgcHJpbWFyeSBzaWJsaW5nIERPTSBlbGVtZW50IGluIHRoZSBwYXJhbGxlbCBET00sIHNob3VsZCBiZSBmaXJzdFxyXG5cclxuICAvKlxyXG4gICAqIEhpZ2hlciBMZXZlbCBBUEkgRnVuY3Rpb25zXHJcbiAgICovXHJcbiAgYWNjZXNzaWJsZU5hbWU/OiBQRE9NVmFsdWVUeXBlIHwgbnVsbDsgLy8gU2V0cyB0aGUgbmFtZSBvZiB0aGlzIG5vZGUsIHJlYWQgd2hlbiB0aGlzIG5vZGUgcmVjZWl2ZXMgZm9jdXMgYW5kIGluc2VydGVkIGFwcHJvcHJpYXRlbHkgYmFzZWQgb24gYWNjZXNzaWJsZU5hbWVCZWhhdmlvclxyXG4gIGFjY2Vzc2libGVOYW1lQmVoYXZpb3I/OiBQRE9NQmVoYXZpb3JGdW5jdGlvbjsgLy8gU2V0cyB0aGUgd2F5IGluIHdoaWNoIGFjY2Vzc2libGVOYW1lIHdpbGwgYmUgc2V0IGZvciB0aGUgTm9kZSwgc2VlIERFRkFVTFRfQUNDRVNTSUJMRV9OQU1FX0JFSEFWSU9SIGZvciBleGFtcGxlXHJcbiAgaGVscFRleHQ/OiBQRE9NVmFsdWVUeXBlIHwgbnVsbDsgLy8gU2V0cyB0aGUgZGVzY3JpcHRpdmUgY29udGVudCBmb3IgdGhpcyBub2RlLCByZWFkIGJ5IHRoZSB2aXJ0dWFsIGN1cnNvciwgaW5zZXJ0ZWQgaW50byBET00gYXBwcm9wcmlhdGVseSBiYXNlZCBvbiBoZWxwVGV4dEJlaGF2aW9yXHJcbiAgaGVscFRleHRCZWhhdmlvcj86IFBET01CZWhhdmlvckZ1bmN0aW9uOyAvLyBTZXRzIHRoZSB3YXkgaW4gd2hpY2ggaGVscCB0ZXh0IHdpbGwgYmUgc2V0IGZvciB0aGUgTm9kZSwgc2VlIERFRkFVTFRfSEVMUF9URVhUX0JFSEFWSU9SIGZvciBleGFtcGxlXHJcbiAgcGRvbUhlYWRpbmc/OiBQRE9NVmFsdWVUeXBlIHwgbnVsbDsgLy8gU2V0cyBjb250ZW50IGZvciB0aGUgaGVhZGluZyB3aG9zZSBsZXZlbCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGlmIHNwZWNpZmllZFxyXG4gIHBkb21IZWFkaW5nQmVoYXZpb3I/OiBQRE9NQmVoYXZpb3JGdW5jdGlvbjsgLy8gU2V0IHRvIG1vZGlmeSBkZWZhdWx0IGJlaGF2aW9yIGZvciBpbnNlcnRpbmcgcGRvbUhlYWRpbmcgc3RyaW5nXHJcblxyXG4gIC8qXHJcbiAgICogTG93ZXIgTGV2ZWwgQVBJIEZ1bmN0aW9uc1xyXG4gICAqL1xyXG4gIGNvbnRhaW5lclRhZ05hbWU/OiBzdHJpbmcgfCBudWxsOyAvLyBTZXRzIHRoZSB0YWcgbmFtZSBmb3IgYW4gW29wdGlvbmFsXSBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhpcyBOb2RlJ3Mgc2libGluZ3NcclxuICBjb250YWluZXJBcmlhUm9sZT86IHN0cmluZyB8IG51bGw7IC8vIFNldHMgdGhlIEFSSUEgcm9sZSBmb3IgdGhlIGNvbnRhaW5lciBwYXJlbnQgRE9NIGVsZW1lbnRcclxuXHJcbiAgaW5uZXJDb250ZW50PzogUERPTVZhbHVlVHlwZSB8IG51bGw7IC8vIFNldHMgdGhlIGlubmVyIHRleHQgb3IgSFRNTCBmb3IgYSBub2RlJ3MgcHJpbWFyeSBzaWJsaW5nIGVsZW1lbnRcclxuICBpbnB1dFR5cGU/OiBzdHJpbmcgfCBudWxsOyAvLyBTZXRzIHRoZSBpbnB1dCB0eXBlIGZvciB0aGUgcHJpbWFyeSBzaWJsaW5nIERPTSBlbGVtZW50LCBvbmx5IHJlbGV2YW50IGlmIHRhZ05hbWUgaXMgJ2lucHV0J1xyXG4gIGlucHV0VmFsdWU/OiBQRE9NVmFsdWVUeXBlIHwgbnVsbCB8IG51bWJlcjsgLy8gU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcmltYXJ5IHNpYmxpbmcgRE9NIGVsZW1lbnQsIG9ubHkgcmVsZXZhbnQgaWYgdGFnTmFtZSBpcyAnaW5wdXQnXHJcbiAgcGRvbUNoZWNrZWQ/OiBib29sZWFuOyAvLyBTZXRzIHRoZSAnY2hlY2tlZCcgc3RhdGUgZm9yIGlucHV0cyBvZiB0eXBlICdyYWRpbycgYW5kICdjaGVja2JveCdcclxuICBwZG9tTmFtZXNwYWNlPzogc3RyaW5nIHwgbnVsbDsgLy8gU2V0cyB0aGUgbmFtZXNwYWNlIGZvciB0aGUgcHJpbWFyeSBlbGVtZW50XHJcbiAgYXJpYUxhYmVsPzogUERPTVZhbHVlVHlwZSB8IG51bGw7IC8vIFNldHMgdGhlIHZhbHVlIG9mIHRoZSAnYXJpYS1sYWJlbCcgYXR0cmlidXRlIG9uIHRoZSBwcmltYXJ5IHNpYmxpbmcgb2YgdGhpcyBOb2RlXHJcbiAgYXJpYVJvbGU/OiBzdHJpbmcgfCBudWxsOyAvLyBTZXRzIHRoZSBBUklBIHJvbGUgZm9yIHRoZSBwcmltYXJ5IHNpYmxpbmcgb2YgdGhpcyBOb2RlXHJcbiAgYXJpYVZhbHVlVGV4dD86IFBET01WYWx1ZVR5cGUgfCBudWxsOyAvLyBzZXRzIHRoZSBhcmlhLXZhbHVldGV4dCBhdHRyaWJ1dGUgb2YgdGhlIHByaW1hcnkgc2libGluZ1xyXG5cclxuICBsYWJlbFRhZ05hbWU/OiBzdHJpbmcgfCBudWxsOyAvLyBTZXRzIHRoZSB0YWcgbmFtZSBmb3IgdGhlIERPTSBlbGVtZW50IHNpYmxpbmcgbGFiZWxpbmcgdGhpcyBub2RlXHJcbiAgbGFiZWxDb250ZW50PzogUERPTVZhbHVlVHlwZSB8IG51bGw7IC8vIFNldHMgdGhlIGxhYmVsIGNvbnRlbnQgZm9yIHRoZSBub2RlXHJcbiAgYXBwZW5kTGFiZWw/OiBib29sZWFuOyAvLyBTZXRzIHRoZSBsYWJlbCBzaWJsaW5nIHRvIGNvbWUgYWZ0ZXIgdGhlIHByaW1hcnkgc2libGluZyBpbiB0aGUgUERPTVxyXG5cclxuICBkZXNjcmlwdGlvblRhZ05hbWU/OiBzdHJpbmcgfCBudWxsOyAvLyBTZXRzIHRoZSB0YWcgbmFtZSBmb3IgdGhlIERPTSBlbGVtZW50IHNpYmxpbmcgZGVzY3JpYmluZyB0aGlzIG5vZGVcclxuICBkZXNjcmlwdGlvbkNvbnRlbnQ/OiBQRE9NVmFsdWVUeXBlIHwgbnVsbDsgLy8gU2V0cyB0aGUgZGVzY3JpcHRpb24gY29udGVudCBmb3IgdGhlIG5vZGVcclxuICBhcHBlbmREZXNjcmlwdGlvbj86IGJvb2xlYW47IC8vIFNldHMgdGhlIGRlc2NyaXB0aW9uIHNpYmxpbmcgdG8gY29tZSBhZnRlciB0aGUgcHJpbWFyeSBzaWJsaW5nIGluIHRoZSBQRE9NXHJcblxyXG4gIGZvY3VzSGlnaGxpZ2h0PzogSGlnaGxpZ2h0OyAvLyBTZXRzIHRoZSBmb2N1cyBoaWdobGlnaHQgZm9yIHRoZSBub2RlXHJcbiAgZm9jdXNIaWdobGlnaHRMYXllcmFibGU/OiBib29sZWFuOyAvL2xhZyB0byBkZXRlcm1pbmUgaWYgdGhlIGZvY3VzIGhpZ2hsaWdodCBub2RlIGNhbiBiZSBsYXllcmVkIGluIHRoZSBzY2VuZSBncmFwaFxyXG4gIGdyb3VwRm9jdXNIaWdobGlnaHQ/OiBOb2RlIHwgYm9vbGVhbjsgLy8gU2V0cyB0aGUgb3V0ZXIgZm9jdXMgaGlnaGxpZ2h0IGZvciB0aGlzIG5vZGUgd2hlbiBhIGRlc2NlbmRhbnQgaGFzIGZvY3VzXHJcbiAgcGRvbVZpc2libGVQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbDtcclxuICBwZG9tVmlzaWJsZT86IGJvb2xlYW47IC8vIFNldHMgd2hldGhlciBvciBub3QgdGhlIG5vZGUncyBET00gZWxlbWVudCBpcyB2aXNpYmxlIGluIHRoZSBwYXJhbGxlbCBET01cclxuICBwZG9tT3JkZXI/OiAoIE5vZGUgfCBudWxsIClbXSB8IG51bGw7IC8vIE1vZGlmaWVzIHRoZSBvcmRlciBvZiBhY2Nlc3NpYmxlIG5hdmlnYXRpb25cclxuXHJcbiAgYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnM/OiBBc3NvY2lhdGlvbltdOyAvLyBzZXRzIHRoZSBsaXN0IG9mIGFyaWEtbGFiZWxsZWRieSBhc3NvY2lhdGlvbnMgYmV0d2VlbiBmcm9tIHRoaXMgbm9kZSB0byBvdGhlcnMgKGluY2x1ZGluZyBpdHNlbGYpXHJcbiAgYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zPzogQXNzb2NpYXRpb25bXTsgLy8gc2V0cyB0aGUgbGlzdCBvZiBhcmlhLWRlc2NyaWJlZGJ5IGFzc29jaWF0aW9ucyBiZXR3ZWVuIGZyb20gdGhpcyBub2RlIHRvIG90aGVycyAoaW5jbHVkaW5nIGl0c2VsZilcclxuICBhY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zPzogQXNzb2NpYXRpb25bXTsgLy8gc2V0cyB0aGUgbGlzdCBvZiBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQgYXNzb2NpYXRpb25zIGJldHdlZW4gZnJvbSB0aGlzIG5vZGUgdG8gb3RoZXJzIChpbmNsdWRpbmcgaXRzZWxmKVxyXG5cclxuICBmb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Qm91bmRzMj4gfCBudWxsOyAvLyBBIFByb3BlcnR5IHdpdGggYm91bmRzIHRoYXQgZGVzY3JpYmUgdGhlIGJvdW5kcyBvZiB0aGlzIE5vZGUgdGhhdCBzaG91bGQgcmVtYWluIGRpc3BsYXllZCBieSB0aGUgZ2xvYmFsIEFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyXHJcbiAgbGltaXRQYW5EaXJlY3Rpb24/OiBMaW1pdFBhbkRpcmVjdGlvbiB8IG51bGw7IC8vIEEgY29uc3RyYWludCBvbiB0aGUgZGlyZWN0aW9uIG9mIHBhbm5pbmcgd2hlbiBpbnRlcmFjdGluZyB3aXRoIHRoaXMgTm9kZS5cclxuXHJcbiAgcG9zaXRpb25JblBET00/OiBib29sZWFuOyAvLyBTZXRzIHdoZXRoZXIgdGhlIG5vZGUncyBET00gZWxlbWVudHMgYXJlIHBvc2l0aW9uZWQgaW4gdGhlIHZpZXdwb3J0XHJcblxyXG4gIHBkb21UcmFuc2Zvcm1Tb3VyY2VOb2RlPzogTm9kZSB8IG51bGw7IC8vIHsgc2V0cyB0aGUgbm9kZSB0aGF0IGNvbnRyb2xzIHByaW1hcnkgc2libGluZyBlbGVtZW50IHBvc2l0aW9uaW5nIGluIHRoZSBkaXNwbGF5LCBzZWUgc2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUoKVxyXG59ICYgUGhldGlvT2JqZWN0T3B0aW9ucztcclxuXHJcbnR5cGUgUERPTUF0dHJpYnV0ZSA9IHtcclxuICBhdHRyaWJ1dGU6IHN0cmluZztcclxuICB2YWx1ZTogUERPTVZhbHVlVHlwZSB8IGJvb2xlYW4gfCBudW1iZXI7XHJcbiAgbGlzdGVuZXI6ICggKCByYXdWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlciApID0+IHZvaWQgKSB8IG51bGw7XHJcbiAgb3B0aW9uczogU2V0UERPTUF0dHJpYnV0ZU9wdGlvbnM7XHJcbn07XHJcblxyXG50eXBlIFBET01DbGFzcyA9IHtcclxuICBjbGFzc05hbWU6IHN0cmluZztcclxuICBvcHRpb25zOiBTZXRQRE9NQ2xhc3NPcHRpb25zO1xyXG59O1xyXG5cclxudHlwZSBBc3NvY2lhdGlvbiA9IHtcclxuICBvdGhlck5vZGU6IE5vZGU7XHJcbiAgb3RoZXJFbGVtZW50TmFtZTogc3RyaW5nO1xyXG4gIHRoaXNFbGVtZW50TmFtZTogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBTZXRQRE9NQXR0cmlidXRlT3B0aW9ucyA9IHtcclxuICBuYW1lc3BhY2U/OiBzdHJpbmcgfCBudWxsO1xyXG4gIGFzUHJvcGVydHk/OiBib29sZWFuO1xyXG4gIGVsZW1lbnROYW1lPzogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBSZW1vdmVQRE9NQXR0cmlidXRlT3B0aW9ucyA9IHtcclxuICBuYW1lc3BhY2U/OiBzdHJpbmcgfCBudWxsO1xyXG4gIGVsZW1lbnROYW1lPzogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBIYXNQRE9NQXR0cmlidXRlT3B0aW9ucyA9IHtcclxuICBuYW1lc3BhY2U/OiBzdHJpbmcgfCBudWxsO1xyXG4gIGVsZW1lbnROYW1lPzogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBTZXRQRE9NQ2xhc3NPcHRpb25zID0ge1xyXG4gIGVsZW1lbnROYW1lPzogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBSZW1vdmVQRE9NQ2xhc3NPcHRpb25zID0ge1xyXG4gIGVsZW1lbnROYW1lPzogc3RyaW5nO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSBub2RlIC0gdGhlIG5vZGUgdGhhdCB0aGUgcGRvbSBiZWhhdmlvciBpcyBiZWluZyBhcHBsaWVkIHRvXHJcbiAqIEBwYXJhbSBvcHRpb25zIC0gb3B0aW9ucyB0byBtdXRhdGUgd2l0aGluIHRoZSBmdW5jdGlvblxyXG4gKiBAcGFyYW0gdmFsdWUgLSB0aGUgdmFsdWUgdGhhdCB5b3UgYXJlIHNldHRpbmcgdGhlIGJlaGF2aW9yIG9mLCBsaWtlIHRoZSBhY2Nlc3NpYmxlTmFtZVxyXG4gKiBAcGFyYW0gY2FsbGJhY2tzRm9yT3RoZXJOb2RlcyAtIGJlaGF2aW9yIGZ1bmN0aW9uIGFsc28gc3VwcG9ydCB0YWtpbmcgc3RhdGUgZnJvbSBhIE5vZGUgYW5kIHVzaW5nIGl0IHRvXHJcbiAqIHNldCB0aGUgYWNjZXNzaWJsZSBjb250ZW50IGZvciBhbm90aGVyIE5vZGUuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoYXQgbG9naWMgc2hvdWxkIGJlIHNldCBpbiBhIGNsb3N1cmUgYW5kIGFkZGVkIHRvXHJcbiAqIHRoaXMgbGlzdCBmb3IgZXhlY3V0aW9uIGFmdGVyIHRoaXMgTm9kZSBpcyBmdWxseSBjcmVhdGVkLiBTZWUgZGlzY3Vzc2lvbiBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy81MDMjaXNzdWVjb21tZW50LTY3NjU0MTM3M1xyXG4gKiBAcmV0dXJucyB0aGUgb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBtdXRhdGVkIGJ5IHRoZSBiZWhhdmlvciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCB0eXBlIFBET01CZWhhdmlvckZ1bmN0aW9uID0gKCBub2RlOiBOb2RlLCBvcHRpb25zOiBQYXJhbGxlbERPTU9wdGlvbnMsIHZhbHVlOiBQRE9NVmFsdWVUeXBlLCBjYWxsYmFja3NGb3JPdGhlck5vZGVzOiAoICgpID0+IHZvaWQgKVtdICkgPT4gUGFyYWxsZWxET01PcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFyYWxsZWxET00gZXh0ZW5kcyBQaGV0aW9PYmplY3Qge1xyXG5cclxuICAvLyBUaGUgSFRNTCB0YWcgbmFtZSBvZiB0aGUgZWxlbWVudCByZXByZXNlbnRpbmcgdGhpcyBub2RlIGluIHRoZSBET01cclxuICBwcml2YXRlIF90YWdOYW1lOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgSFRNTCB0YWcgbmFtZSBmb3IgYSBjb250YWluZXIgcGFyZW50IGVsZW1lbnQgZm9yIHRoaXMgbm9kZSBpbiB0aGUgRE9NLiBUaGlzXHJcbiAgLy8gY29udGFpbmVyIHBhcmVudCB3aWxsIGNvbnRhaW4gdGhlIG5vZGUncyBET00gZWxlbWVudCwgYXMgd2VsbCBhcyBwZWVyIGVsZW1lbnRzIGZvciBhbnkgbGFiZWwgb3IgZGVzY3JpcHRpb25cclxuICAvLyBjb250ZW50LiBTZWUgc2V0Q29udGFpbmVyVGFnTmFtZSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uIElmIHRoaXMgb3B0aW9uIGlzIG5lZWRlZCAobGlrZSB0b1xyXG4gIC8vIGNvbnRhaW4gbXVsdGlwbGUgc2libGluZ3Mgd2l0aCB0aGUgcHJpbWFyeSBzaWJsaW5nKSwgaXQgd2lsbCBkZWZhdWx0IHRvIHRoZSB2YWx1ZSBvZiBERUZBVUxUX0NPTlRBSU5FUl9UQUdfTkFNRS5cclxuICBwcml2YXRlIF9jb250YWluZXJUYWdOYW1lOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgSFRNTCB0YWcgbmFtZSBmb3IgdGhlIGxhYmVsIGVsZW1lbnQgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGxhYmVsIGNvbnRlbnQgZm9yXHJcbiAgLy8gdGhpcyBkb20gZWxlbWVudC4gVGhlcmUgYXJlIHdheXMgaW4gd2hpY2ggeW91IGNhbiBoYXZlIGEgbGFiZWwgd2l0aG91dCBzcGVjaWZ5aW5nIGEgbGFiZWwgdGFnIG5hbWUsXHJcbiAgLy8gc2VlIHNldExhYmVsQ29udGVudCgpIGZvciB0aGUgbGlzdCBvZiB3YXlzLlxyXG4gIHByaXZhdGUgX2xhYmVsVGFnTmFtZTogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLy8gVGhlIEhUTUwgdGFnIG5hbWUgZm9yIHRoZSBkZXNjcmlwdGlvbiBlbGVtZW50IHRoYXQgd2lsbCBjb250YWluIGRlc2NzcmlwdGlvbiBjb250ZW50XHJcbiAgLy8gZm9yIHRoaXMgZG9tIGVsZW1lbnQuIElmIGEgZGVzY3JpcHRpb24gaXMgc2V0IGJlZm9yZSBhIHRhZyBuYW1lIGlzIGRlZmluZWQsIGEgcGFyYWdyYXBoIGVsZW1lbnRcclxuICAvLyB3aWxsIGJlIGNyZWF0ZWQgZm9yIHRoZSBkZXNjcmlwdGlvbi5cclxuICBwcml2YXRlIF9kZXNjcmlwdGlvblRhZ05hbWU6IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSB0eXBlIGZvciBhbiBlbGVtZW50IHdpdGggdGFnIG5hbWUgb2YgSU5QVVQuICBUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWRcclxuICAvLyBpZiB0aGUgZWxlbWVudCBoYXMgYSB0YWcgbmFtZSBJTlBVVC5cclxuICBwcml2YXRlIF9pbnB1dFR5cGU6IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQsIG9ubHkgcmVsZXZhbnQgaWYgdGhlIHRhZyBuYW1lIGlzIG9mIHR5cGUgXCJJTlBVVFwiLiBJcyBhXHJcbiAgLy8gc3RyaW5nIGJlY2F1c2UgdGhlIGB2YWx1ZWAgYXR0cmlidXRlIGlzIGEgRE9NU3RyaW5nLiBudWxsIHZhbHVlIGluZGljYXRlcyBubyB2YWx1ZS5cclxuICBwcml2YXRlIF9pbnB1dFZhbHVlOiBQRE9NVmFsdWVUeXBlIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIHBkb20gaW5wdXQgaXMgY29uc2lkZXJlZCAnY2hlY2tlZCcsIG9ubHkgdXNlZnVsIGZvciBpbnB1dHMgb2ZcclxuICAvLyB0eXBlICdyYWRpbycgYW5kICdjaGVja2JveCdcclxuICBwcml2YXRlIF9wZG9tQ2hlY2tlZDogYm9vbGVhbjtcclxuXHJcbiAgLy8gQnkgZGVmYXVsdCB0aGUgbGFiZWwgd2lsbCBiZSBwcmVwZW5kZWQgYmVmb3JlIHRoZSBwcmltYXJ5IHNpYmxpbmcgaW4gdGhlIFBET00uIFRoaXNcclxuICAvLyBvcHRpb24gYWxsb3dzIHlvdSB0byBpbnN0ZWFkIGhhdmUgdGhlIGxhYmVsIGFkZGVkIGFmdGVyIHRoZSBwcmltYXJ5IHNpYmxpbmcuIE5vdGU6IFRoZSBsYWJlbCB3aWxsIGFsd2F5c1xyXG4gIC8vIGJlIGluIGZyb250IG9mIHRoZSBkZXNjcmlwdGlvbiBzaWJsaW5nLiBJZiB0aGlzIGZsYWcgaXMgc2V0IHdpdGggYGFwcGVuZERlc2NyaXB0aW9uOiB0cnVlYCwgdGhlIG9yZGVyIHdpbGwgYmVcclxuICAvLyAoMSkgcHJpbWFyeSBzaWJsaW5nLCAoMikgbGFiZWwgc2libGluZywgKDMpIGRlc2NyaXB0aW9uIHNpYmxpbmcuIEFsbCBzaWJsaW5ncyB3aWxsIGJlIHBsYWNlZCB3aXRoaW4gdGhlXHJcbiAgLy8gY29udGFpbmVyUGFyZW50LlxyXG4gIHByaXZhdGUgX2FwcGVuZExhYmVsOiBib29sZWFuO1xyXG5cclxuICAvLyBCeSBkZWZhdWx0IHRoZSBkZXNjcmlwdGlvbiB3aWxsIGJlIHByZXBlbmRlZCBiZWZvcmUgdGhlIHByaW1hcnkgc2libGluZyBpbiB0aGUgUERPTS4gVGhpc1xyXG4gIC8vIG9wdGlvbiBhbGxvd3MgeW91IHRvIGluc3RlYWQgaGF2ZSB0aGUgZGVzY3JpcHRpb24gYWRkZWQgYWZ0ZXIgdGhlIHByaW1hcnkgc2libGluZy4gTm90ZTogVGhlIGRlc2NyaXB0aW9uXHJcbiAgLy8gd2lsbCBhbHdheXMgYmUgYWZ0ZXIgdGhlIGxhYmVsIHNpYmxpbmcuIElmIHRoaXMgZmxhZyBpcyBzZXQgd2l0aCBgYXBwZW5kTGFiZWw6IHRydWVgLCB0aGUgb3JkZXIgd2lsbCBiZVxyXG4gIC8vICgxKSBwcmltYXJ5IHNpYmxpbmcsICgyKSBsYWJlbCBzaWJsaW5nLCAoMykgZGVzY3JpcHRpb24gc2libGluZy4gQWxsIHNpYmxpbmdzIHdpbGwgYmUgcGxhY2VkIHdpdGhpbiB0aGVcclxuICAvLyBjb250YWluZXJQYXJlbnQuXHJcbiAgcHJpdmF0ZSBfYXBwZW5kRGVzY3JpcHRpb246IGJvb2xlYW47XHJcblxyXG4gIC8vIEFycmF5IG9mIGF0dHJpYnV0ZXMgdGhhdCBhcmUgb24gdGhlIG5vZGUncyBET00gZWxlbWVudC4gIE9iamVjdHMgd2lsbCBoYXZlIHRoZVxyXG4gIC8vIGZvcm0geyBhdHRyaWJ1dGU6e3N0cmluZ30sIHZhbHVlOnsqfSwgbmFtZXNwYWNlOntzdHJpbmd8bnVsbH0gfVxyXG4gIHByaXZhdGUgX3Bkb21BdHRyaWJ1dGVzOiBQRE9NQXR0cmlidXRlW107XHJcblxyXG4gIC8vIENvbGxlY3Rpb24gb2YgY2xhc3MgYXR0cmlidXRlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBub2RlJ3MgRE9NIGVsZW1lbnQuXHJcbiAgLy8gT2JqZWN0cyBoYXZlIHRoZSBmb3JtIHsgY2xhc3NOYW1lOntzdHJpbmd9LCBvcHRpb25zOnsqfSB9XHJcbiAgcHJpdmF0ZSBfcGRvbUNsYXNzZXM6IFBET01DbGFzc1tdO1xyXG5cclxuICAvLyBUaGUgbGFiZWwgY29udGVudCBmb3IgdGhpcyBub2RlJ3MgRE9NIGVsZW1lbnQuICBUaGVyZSBhcmUgbXVsdGlwbGUgd2F5cyB0aGF0IGEgbGFiZWxcclxuICAvLyBjYW4gYmUgYXNzb2NpYXRlZCB3aXRoIGEgbm9kZSdzIGRvbSBlbGVtZW50LCBzZWUgc2V0TGFiZWxDb250ZW50KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gIHByaXZhdGUgX2xhYmVsQ29udGVudDogUERPTVZhbHVlVHlwZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBUaGUgaW5uZXIgbGFiZWwgY29udGVudCBmb3IgdGhpcyBub2RlJ3MgcHJpbWFyeSBzaWJsaW5nLiBTZXQgYXMgaW5uZXIgSFRNTFxyXG4gIC8vIG9yIHRleHQgY29udGVudCBvZiB0aGUgYWN0dWFsIERPTSBlbGVtZW50LiBJZiB0aGlzIGlzIHVzZWQsIHRoZSBub2RlIHNob3VsZCBub3QgaGF2ZSBjaGlsZHJlbi5cclxuICBwcml2YXRlIF9pbm5lckNvbnRlbnQ6IFBET01WYWx1ZVR5cGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gVGhlIGRlc2NyaXB0aW9uIGNvbnRlbnQgZm9yIHRoaXMgbm9kZSdzIERPTSBlbGVtZW50LlxyXG4gIHByaXZhdGUgX2Rlc2NyaXB0aW9uQ29udGVudDogUERPTVZhbHVlVHlwZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgaXQgd2lsbCBjcmVhdGUgdGhlIHByaW1hcnkgRE9NIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWVzcGFjZS5cclxuICAvLyBUaGlzIG1heSBiZSBuZWVkZWQsIGZvciBleGFtcGxlLCB3aXRoIE1hdGhNTC9TVkcvZXRjLlxyXG4gIHByaXZhdGUgX3Bkb21OYW1lc3BhY2U6IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCBcImFyaWEtbGFiZWxcIiB3aWxsIGJlIGFkZGVkIGFzIGFuIGlubGluZSBhdHRyaWJ1dGUgb24gdGhlIG5vZGUncyBET01cclxuICAvLyBlbGVtZW50IGFuZCBzZXQgdG8gdGhpcyB2YWx1ZS4gVGhpcyB3aWxsIGRldGVybWluZSBob3cgdGhlIEFjY2Vzc2libGUgTmFtZSBpcyBwcm92aWRlZCBmb3IgdGhlIERPTSBlbGVtZW50LlxyXG4gIHByaXZhdGUgX2FyaWFMYWJlbDogUERPTVZhbHVlVHlwZSB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgX2hhc0FwcGxpZWRBcmlhTGFiZWwgPSBmYWxzZTtcclxuXHJcbiAgLy8gVGhlIEFSSUEgcm9sZSBmb3IgdGhpcyBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLCBhZGRlZCBhcyBhbiBIVE1MIGF0dHJpYnV0ZS4gIEZvciBhIGNvbXBsZXRlXHJcbiAgLy8gbGlzdCBvZiBBUklBIHJvbGVzLCBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3dhaS1hcmlhL3JvbGVzLiAgQmV3YXJlIHRoYXQgbWFueSByb2xlcyBhcmUgbm90IHN1cHBvcnRlZFxyXG4gIC8vIGJ5IGJyb3dzZXJzIG9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMsIHNvIHVzZSB2YW5pbGxhIEhUTUwgZm9yIGFjY2Vzc2liaWxpdHkgc2VtYW50aWNzIHdoZXJlIHBvc3NpYmxlLlxyXG4gIHByaXZhdGUgX2FyaWFSb2xlOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgQVJJQSByb2xlIGZvciB0aGUgY29udGFpbmVyIHBhcmVudCBlbGVtZW50LCBhZGRlZCBhcyBhbiBIVE1MIGF0dHJpYnV0ZS4gRm9yIGFcclxuICAvLyBjb21wbGV0ZSBsaXN0IG9mIEFSSUEgcm9sZXMsIHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvd2FpLWFyaWEvcm9sZXMuIEJld2FyZSB0aGF0IG1hbnkgcm9sZXMgYXJlIG5vdFxyXG4gIC8vIHN1cHBvcnRlZCBieSBicm93c2VycyBvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLCBzbyB1c2UgdmFuaWxsYSBIVE1MIGZvciBhY2Nlc3NpYmlsaXR5IHNlbWFudGljcyB3aGVyZVxyXG4gIC8vIHBvc3NpYmxlLlxyXG4gIHByaXZhdGUgX2NvbnRhaW5lckFyaWFSb2xlOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgXCJhcmlhLXZhbHVldGV4dFwiIHdpbGwgYmUgYWRkZWQgYXMgYW4gaW5saW5lIGF0dHJpYnV0ZSBvbiB0aGUgTm9kZSdzXHJcbiAgLy8gcHJpbWFyeSBzaWJsaW5nIGFuZCBzZXQgdG8gdGhpcyB2YWx1ZS4gU2V0dGluZyBiYWNrIHRvIG51bGwgd2lsbCBjbGVhciB0aGlzIGF0dHJpYnV0ZSBpbiB0aGUgdmlldy5cclxuICBwcml2YXRlIF9hcmlhVmFsdWVUZXh0OiBQRE9NVmFsdWVUeXBlIHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBfaGFzQXBwbGllZEFyaWFWYWx1ZVRleHQgPSBmYWxzZTtcclxuXHJcbiAgLy8gS2VlcCB0cmFjayBvZiB3aGF0IHRoaXMgTm9kZSBpcyBhcmlhLWxhYmVsbGVkYnkgdmlhIFwiYXNzb2NpYXRpb25PYmplY3RzXCJcclxuICAvLyBzZWUgYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiBmb3Igd2h5IHdlIHN1cHBvcnQgbW9yZSB0aGFuIG9uZSBhc3NvY2lhdGlvbi5cclxuICBwcml2YXRlIF9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uczogQXNzb2NpYXRpb25bXTtcclxuXHJcbiAgLy8gS2VlcCBhIHJlZmVyZW5jZSB0byBhbGwgbm9kZXMgdGhhdCBhcmUgYXJpYS1sYWJlbGxlZGJ5IHRoaXMgbm9kZSwgaS5lLiB0aGF0IGhhdmUgc3RvcmUgb25lIG9mIHRoaXMgTm9kZSdzXHJcbiAgLy8gcGVlciBIVE1MRWxlbWVudCdzIGlkIGluIHRoZWlyIHBlZXIgSFRNTEVsZW1lbnQncyBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlLiBUaGlzIHdheSB3ZSBjYW4gdGVsbCBvdGhlclxyXG4gIC8vIG5vZGVzIHRvIHVwZGF0ZSB0aGVpciBhcmlhLWxhYmVsbGVkYnkgYXNzb2NpYXRpb25zIHdoZW4gdGhpcyBOb2RlIHJlYnVpbGRzIGl0cyBwZG9tIGNvbnRlbnQuXHJcbiAgcHJpdmF0ZSBfbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZTogTm9kZVtdO1xyXG5cclxuICAvLyBLZWVwIHRyYWNrIG9mIHdoYXQgdGhpcyBOb2RlIGlzIGFyaWEtZGVzY3JpYmVkYnkgdmlhIFwiYXNzb2NpYXRpb25PYmplY3RzXCJcclxuICAvLyBzZWUgYWRkQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24gZm9yIHdoeSB3ZSBzdXBwb3J0IG1vcmUgdGhhbiBvbmUgYXNzb2NpYXRpb24uXHJcbiAgcHJpdmF0ZSBfYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zOiBBc3NvY2lhdGlvbltdO1xyXG5cclxuICAvLyBLZWVwIGEgcmVmZXJlbmNlIHRvIGFsbCBub2RlcyB0aGF0IGFyZSBhcmlhLWRlc2NyaWJlZGJ5IHRoaXMgbm9kZSwgaS5lLiB0aGF0IGhhdmUgc3RvcmUgb25lIG9mIHRoaXMgTm9kZSdzXHJcbiAgLy8gcGVlciBIVE1MRWxlbWVudCdzIGlkIGluIHRoZWlyIHBlZXIgSFRNTEVsZW1lbnQncyBhcmlhLWRlc2NyaWJlZGJ5IGF0dHJpYnV0ZS4gVGhpcyB3YXkgd2UgY2FuIHRlbGwgb3RoZXJcclxuICAvLyBub2RlcyB0byB1cGRhdGUgdGhlaXIgYXJpYS1kZXNjcmliZWRieSBhc3NvY2lhdGlvbnMgd2hlbiB0aGlzIE5vZGUgcmVidWlsZHMgaXRzIHBkb20gY29udGVudC5cclxuICBwcml2YXRlIF9ub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZTogTm9kZVtdO1xyXG5cclxuICAvLyBLZWVwIHRyYWNrIG9mIHdoYXQgdGhpcyBOb2RlIGlzIGFyaWEtYWN0aXZlZGVzY2VuZGFudCB2aWEgXCJhc3NvY2lhdGlvbk9iamVjdHNcIlxyXG4gIC8vIHNlZSBhZGRBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24gZm9yIHdoeSB3ZSBzdXBwb3J0IG1vcmUgdGhhbiBvbmUgYXNzb2NpYXRpb24uXHJcbiAgcHJpdmF0ZSBfYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uczogQXNzb2NpYXRpb25bXTtcclxuXHJcbiAgLy8gS2VlcCBhIHJlZmVyZW5jZSB0byBhbGwgbm9kZXMgdGhhdCBhcmUgYXJpYS1hY3RpdmVkZXNjZW5kYW50IHRoaXMgbm9kZSwgaS5lLiB0aGF0IGhhdmUgc3RvcmUgb25lIG9mIHRoaXMgTm9kZSdzXHJcbiAgLy8gcGVlciBIVE1MRWxlbWVudCdzIGlkIGluIHRoZWlyIHBlZXIgSFRNTEVsZW1lbnQncyBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQgYXR0cmlidXRlLiBUaGlzIHdheSB3ZSBjYW4gdGVsbCBvdGhlclxyXG4gIC8vIG5vZGVzIHRvIHVwZGF0ZSB0aGVpciBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQgYXNzb2NpYXRpb25zIHdoZW4gdGhpcyBOb2RlIHJlYnVpbGRzIGl0cyBwZG9tIGNvbnRlbnQuXHJcbiAgcHJpdmF0ZSBfbm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGU6IE5vZGVbXTtcclxuXHJcbiAgLy8gV2hldGhlciB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcgaGFzIGJlZW4gZXhwbGljaXRseSBzZXQgdG8gcmVjZWl2ZSBmb2N1cyBmcm9tXHJcbiAgLy8gdGFiIG5hdmlnYXRpb24uIFNldHMgdGhlIHRhYkluZGV4IGF0dHJpYnV0ZSBvbiB0aGUgTm9kZSdzIHByaW1hcnkgc2libGluZy4gU2V0dGluZyB0byBmYWxzZSB3aWxsIG5vdCByZW1vdmUgdGhlXHJcbiAgLy8gbm9kZSdzIERPTSBmcm9tIHRoZSBkb2N1bWVudCwgYnV0IHdpbGwgZW5zdXJlIHRoYXQgaXQgY2Fubm90IHJlY2VpdmUgZm9jdXMgYnkgcHJlc3NpbmcgJ3RhYicuICBTZXZlcmFsXHJcbiAgLy8gSFRNTEVsZW1lbnRzIChzdWNoIGFzIEhUTUwgZm9ybSBlbGVtZW50cykgY2FuIGJlIGZvY3VzYWJsZSBieSBkZWZhdWx0LCB3aXRob3V0IHNldHRpbmcgdGhpcyBwcm9wZXJ0eS4gVGhlXHJcbiAgLy8gbmF0aXZlIEhUTUwgZnVuY3Rpb24gZnJvbSB0aGVzZSBmb3JtIGVsZW1lbnRzIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhpcyBwcm9wZXJ0eS5cclxuICBwcml2YXRlIF9mb2N1c2FibGVPdmVycmlkZTogYm9vbGVhbiB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSBmb2N1cyBoaWdobGlnaHQgdGhhdCB3aWxsIHN1cnJvdW5kIHRoaXMgbm9kZSB3aGVuIGl0XHJcbiAgLy8gaXMgZm9jdXNlZC4gIEJ5IGRlZmF1bHQsIHRoZSBmb2N1cyBoaWdobGlnaHQgd2lsbCBiZSBhIHBpbmsgcmVjdGFuZ2xlIHRoYXQgc3Vycm91bmRzIHRoZSBOb2RlJ3MgbG9jYWxcclxuICAvLyBib3VuZHMuIFdoZW4gcHJvdmlkaW5nIGEgY3VzdG9tIGhpZ2hsaWdodCwgZHJhdyBhcm91bmQgdGhlIE5vZGUncyBsb2NhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gIHByaXZhdGUgX2ZvY3VzSGlnaGxpZ2h0OiBTaGFwZSB8IE5vZGUgfCAnaW52aXNpYmxlJyB8IG51bGw7XHJcblxyXG4gIC8vIEEgZmxhZyB0aGF0IGFsbG93cyBwcmV2ZW50cyBmb2N1cyBoaWdobGlnaHQgZnJvbSBiZWluZyBkaXNwbGF5ZWQgaW4gdGhlIEhpZ2hsaWdodE92ZXJsYXkuXHJcbiAgLy8gSWYgdHJ1ZSwgdGhlIGZvY3VzIGhpZ2hsaWdodCBmb3IgdGhpcyBub2RlIHdpbGwgYmUgbGF5ZXJhYmxlIGluIHRoZSBzY2VuZSBncmFwaC4gIFBoZXRpb0NsaWVudCBpcyByZXNwb25zaWJsZVxyXG4gIC8vIGZvciBwbGFjZW1lbnQgb2YgdGhlIGZvY3VzIGhpZ2hsaWdodCBpbiB0aGUgc2NlbmUgZ3JhcGguXHJcbiAgcHJpdmF0ZSBfZm9jdXNIaWdobGlnaHRMYXllcmFibGU6IGJvb2xlYW47XHJcblxyXG4gIC8vIEFkZHMgYSBncm91cCBmb2N1cyBoaWdobGlnaHQgdGhhdCBzdXJyb3VuZHMgdGhpcyBub2RlIHdoZW4gYSBkZXNjZW5kYW50IGhhc1xyXG4gIC8vIGZvY3VzLiBUeXBpY2FsbHkgdXNlZnVsIHRvIGluZGljYXRlIGZvY3VzIGlmIGZvY3VzIGVudGVycyBhIGdyb3VwIG9mIGVsZW1lbnRzLiBJZiAndHJ1ZScsIGdyb3VwXHJcbiAgLy8gaGlnaGxpZ2h0IHdpbGwgZ28gYXJvdW5kIGxvY2FsIGJvdW5kcyBvZiB0aGlzIG5vZGUuIE90aGVyd2lzZSB0aGUgY3VzdG9tIG5vZGUgd2lsbCBiZSB1c2VkIGFzIHRoZSBoaWdobGlnaHQvXHJcbiAgcHJpdmF0ZSBfZ3JvdXBGb2N1c0hpZ2hsaWdodDogTm9kZSB8IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIHBkb20gY29udGVudCB3aWxsIGJlIHZpc2libGUgZnJvbSB0aGUgYnJvd3NlciBhbmQgYXNzaXN0aXZlXHJcbiAgLy8gdGVjaG5vbG9naWVzLiAgV2hlbiBwZG9tVmlzaWJsZSBpcyBmYWxzZSwgdGhlIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcgd2lsbCBub3QgYmUgZm9jdXNhYmxlLCBhbmQgaXQgY2Fubm90XHJcbiAgLy8gYmUgZm91bmQgYnkgdGhlIGFzc2lzdGl2ZSB0ZWNobm9sb2d5IHZpcnR1YWwgY3Vyc29yLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgYXNzaXN0aXZlIHRlY2hub2xvZ2llc1xyXG4gIC8vIHJlYWQgd2l0aCB0aGUgdmlydHVhbCBjdXJzb3Igc2VlXHJcbiAgLy8gaHR0cDovL3d3dy5zc2JiYXJ0Z3JvdXAuY29tL2Jsb2cvaG93LXdpbmRvd3Mtc2NyZWVuLXJlYWRlcnMtd29yay1vbi10aGUtd2ViL1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Bkb21WaXNpYmxlUHJvcGVydHk6IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCBpdCB3aWxsIG92ZXJyaWRlIHRoZSBmb2N1cyBvcmRlciBiZXR3ZWVuIGNoaWxkcmVuXHJcbiAgLy8gKGFuZCBvcHRpb25hbGx5IGFyYml0cmFyeSBzdWJ0cmVlcykuIElmIG5vdCBwcm92aWRlZCwgdGhlIGZvY3VzIG9yZGVyIHdpbGwgZGVmYXVsdCB0byB0aGUgcmVuZGVyaW5nIG9yZGVyXHJcbiAgLy8gKGZpcnN0IGNoaWxkcmVuIGZpcnN0LCBsYXN0IGNoaWxkcmVuIGxhc3QpIGRldGVybWluZWQgYnkgdGhlIGNoaWxkcmVuIGFycmF5LlxyXG4gIC8vIFNlZSBzZXRQRE9NT3JkZXIoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gIHByaXZhdGUgX3Bkb21PcmRlcjogKCBOb2RlIHwgbnVsbCApW10gfCBudWxsO1xyXG5cclxuICAvLyBJZiB0aGlzIG5vZGUgaXMgc3BlY2lmaWVkIGluIGFub3RoZXIgbm9kZSdzIHBkb21PcmRlciwgdGhlbiB0aGlzIHdpbGwgaGF2ZSB0aGUgdmFsdWUgb2YgdGhhdCBvdGhlciAoUERPTSBwYXJlbnQpXHJcbiAgLy8gTm9kZS4gT3RoZXJ3aXNlIGl0J3MgbnVsbC5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3Bkb21QYXJlbnQ6IE5vZGUgfCBudWxsO1xyXG5cclxuICAvLyBJZiB0aGlzIGlzIHNwZWNpZmllZCwgdGhlIHByaW1hcnkgc2libGluZyB3aWxsIGJlIHBvc2l0aW9uZWRcclxuICAvLyB0byBhbGlnbiB3aXRoIHRoaXMgc291cmNlIG5vZGUgYW5kIG9ic2VydmUgdGhlIHRyYW5zZm9ybXMgYWxvbmcgdGhpcyBub2RlJ3MgdHJhaWwuIEF0IHRoaXMgdGltZSB0aGVcclxuICAvLyBwZG9tVHJhbnNmb3JtU291cmNlTm9kZSBjYW5ub3QgdXNlIERBRy5cclxuICBwcml2YXRlIF9wZG9tVHJhbnNmb3JtU291cmNlTm9kZTogTm9kZSB8IG51bGw7XHJcblxyXG4gIC8vIElmIHRoaXMgaXMgcHJvdmlkZWQsIHRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB3aWxsIGF0dGVtcHQgdG8ga2VlcCB0aGlzIE5vZGUgaW4gdmlldyBhcyBsb25nIGFzIGl0IGhhc1xyXG4gIC8vIGZvY3VzXHJcbiAgcHJpdmF0ZSBfZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Qm91bmRzMj4gfCBudWxsO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgdGhlIEFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyIHdpbGwgT05MWSBwYW4gaW4gdGhlIHNwZWNpZmllZCBkaXJlY3Rpb25cclxuICBwcml2YXRlIF9saW1pdFBhbkRpcmVjdGlvbjogTGltaXRQYW5EaXJlY3Rpb24gfCBudWxsO1xyXG5cclxuICAvLyBDb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IHBkb20gZGlzcGxheXNcclxuICAvLyB0aGlzIG5vZGUgaXMgXCJ2aXNpYmxlXCIgZm9yLCBzZWUgUERPTURpc3BsYXlzSW5mby5qcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3Bkb21EaXNwbGF5c0luZm86IFBET01EaXNwbGF5c0luZm87XHJcblxyXG4gIC8vIEVtcHR5IHVubGVzcyB0aGUgTm9kZSBjb250YWlucyBzb21lIHBkb20gY29udGVudCAoUERPTUluc3RhbmNlKS5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9wZG9tSW5zdGFuY2VzOiBQRE9NSW5zdGFuY2VbXTtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lcyBpZiBET00gc2libGluZ3MgYXJlIHBvc2l0aW9uZWQgaW4gdGhlIHZpZXdwb3J0LiBUaGlzXHJcbiAgLy8gaXMgcmVxdWlyZWQgZm9yIE5vZGVzIHRoYXQgcmVxdWlyZSB1bmlxdWUgaW5wdXQgZ2VzdHVyZXMgd2l0aCBpT1MgVm9pY2VPdmVyIGxpa2UgXCJEcmFnIGFuZCBEcm9wXCIuXHJcbiAgLy8gU2VlIHNldFBvc2l0aW9uSW5QRE9NIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gIHByaXZhdGUgX3Bvc2l0aW9uSW5QRE9NOiBib29sZWFuO1xyXG5cclxuICAvLyBJZiB0cnVlLCBhbnkgRE9NIGV2ZW50cyByZWNlaXZlZCBvbiB0aGUgbGFiZWwgc2libGluZ1xyXG4gIC8vIHdpbGwgbm90IGRpc3BhdGNoIFNjZW5lcnlFdmVudHMgdGhyb3VnaCB0aGUgc2NlbmUgZ3JhcGgsIHNlZSBzZXRFeGNsdWRlTGFiZWxTaWJsaW5nRnJvbUlucHV0KCkgLSBzY2VuZXJ5IGludGVybmFsXHJcbiAgcHJpdmF0ZSBleGNsdWRlTGFiZWxTaWJsaW5nRnJvbUlucHV0OiBib29sZWFuO1xyXG5cclxuICAvLyBISUdIRVIgTEVWRUwgQVBJIElOSVRJQUxJWkFUSU9OXHJcblxyXG4gIC8vIFNldHMgdGhlIFwiQWNjZXNzaWJsZSBOYW1lXCIgb2YgdGhlIE5vZGUsIGFzIGRlZmluZWQgYnkgdGhlIEJyb3dzZXIncyBQYXJhbGxlbERPTSBUcmVlXHJcbiAgcHJpdmF0ZSBfYWNjZXNzaWJsZU5hbWU6IFBET01WYWx1ZVR5cGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gRnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBvcHRpb25zIG5lZWRlZCB0byBzZXQgdGhlIGFwcHJvcHJpYXRlIGFjY2Vzc2libGUgbmFtZSBmb3IgdGhlIE5vZGVcclxuICBwcml2YXRlIF9hY2Nlc3NpYmxlTmFtZUJlaGF2aW9yOiBQRE9NQmVoYXZpb3JGdW5jdGlvbjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgaGVscCB0ZXh0IG9mIHRoZSBOb2RlLCB0aGlzIG1vc3Qgb2Z0ZW4gY29ycmVzcG9uZHMgdG8gZGVzY3JpcHRpb24gdGV4dC5cclxuICBwcml2YXRlIF9oZWxwVGV4dDogUERPTVZhbHVlVHlwZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBTZXRzIHRoZSBoZWxwIHRleHQgb2YgdGhlIE5vZGUsIHRoaXMgbW9zdCBvZnRlbiBjb3JyZXNwb25kcyB0byBkZXNjcmlwdGlvbiB0ZXh0LlxyXG4gIHByaXZhdGUgX2hlbHBUZXh0QmVoYXZpb3I6IFBET01CZWhhdmlvckZ1bmN0aW9uO1xyXG5cclxuICAvLyBTZXRzIHRoZSBoZWxwIHRleHQgb2YgdGhlIE5vZGUsIHRoaXMgbW9zdCBvZnRlbiBjb3JyZXNwb25kcyB0byBsYWJlbCBzaWJsaW5nIHRleHQuXHJcbiAgcHJpdmF0ZSBfcGRvbUhlYWRpbmc6IFBET01WYWx1ZVR5cGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gVE9ETzogaW1wbGVtZW50IGhlYWRpbmdMZXZlbCBvdmVycmlkZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NTVcclxuICAvLyBUaGUgbnVtYmVyIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGhlYWRpbmcgdGFnIHRoZSBub2RlIHdpbGwgZ2V0IGlmIHVzaW5nIHRoZSBwZG9tSGVhZGluZyBBUEksLlxyXG4gIHByaXZhdGUgX2hlYWRpbmdMZXZlbDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgLy8gU2V0cyB0aGUgaGVscCB0ZXh0IG9mIHRoZSBOb2RlLCB0aGlzIG1vc3Qgb2Z0ZW4gY29ycmVzcG9uZHMgdG8gZGVzY3JpcHRpb24gdGV4dC5cclxuICBwcml2YXRlIF9wZG9tSGVhZGluZ0JlaGF2aW9yOiBQRE9NQmVoYXZpb3JGdW5jdGlvbjtcclxuXHJcbiAgLy8gRW1pdHMgYW4gZXZlbnQgd2hlbiB0aGUgZm9jdXMgaGlnaGxpZ2h0IGlzIGNoYW5nZWQuXHJcbiAgcHVibGljIHJlYWRvbmx5IGZvY3VzSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEVtaXRzIGFuIGV2ZW50IHdoZW4gdGhlIHBkb20gcGFyZW50IG9mIHRoaXMgTm9kZSBoYXMgY2hhbmdlZFxyXG4gIHB1YmxpYyByZWFkb25seSBwZG9tUGFyZW50Q2hhbmdlZEVtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW4gdGhlIFBET00gRGlzcGxheXMgZm9yIHRoaXMgTm9kZSBoYXZlIGNoYW5nZWQgKHNlZSBQRE9NSW5zdGFuY2UpXHJcbiAgcHVibGljIHJlYWRvbmx5IHBkb21EaXNwbGF5c0VtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIFBET00gc3BlY2lmaWMgZW5hYmxlZCBsaXN0ZW5lclxyXG4gIHByb3RlY3RlZCBwZG9tQm91bmRJbnB1dEVuYWJsZWRMaXN0ZW5lcjogKCBlbmFibGVkOiBib29sZWFuICkgPT4gdm9pZDtcclxuXHJcbiAgcHJvdGVjdGVkIF9vblBET01Db250ZW50Q2hhbmdlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcbiAgcHJvdGVjdGVkIF9vbklucHV0VmFsdWVDaGFuZ2VMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuICBwcm90ZWN0ZWQgX29uQXJpYUxhYmVsQ2hhbmdlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcbiAgcHJvdGVjdGVkIF9vbkFyaWFWYWx1ZVRleHRDaGFuZ2VMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuICBwcm90ZWN0ZWQgX29uTGFiZWxDb250ZW50Q2hhbmdlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcbiAgcHJvdGVjdGVkIF9vbkRlc2NyaXB0aW9uQ29udGVudENoYW5nZUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG4gIHByb3RlY3RlZCBfb25Jbm5lckNvbnRlbnRDaGFuZ2VMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogUGhldGlvT2JqZWN0T3B0aW9ucyApIHtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciA9IHRoaXMub25QRE9NQ29udGVudENoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLl9vbklucHV0VmFsdWVDaGFuZ2VMaXN0ZW5lciA9IHRoaXMuaW52YWxpZGF0ZVBlZXJJbnB1dFZhbHVlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuX29uQXJpYUxhYmVsQ2hhbmdlTGlzdGVuZXIgPSB0aGlzLm9uQXJpYUxhYmVsQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuX29uQXJpYVZhbHVlVGV4dENoYW5nZUxpc3RlbmVyID0gdGhpcy5vbkFyaWFWYWx1ZVRleHRDaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5fb25MYWJlbENvbnRlbnRDaGFuZ2VMaXN0ZW5lciA9IHRoaXMuaW52YWxpZGF0ZVBlZXJMYWJlbFNpYmxpbmdDb250ZW50LmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuX29uRGVzY3JpcHRpb25Db250ZW50Q2hhbmdlTGlzdGVuZXIgPSB0aGlzLmludmFsaWRhdGVQZWVyRGVzY3JpcHRpb25TaWJsaW5nQ29udGVudC5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLl9vbklubmVyQ29udGVudENoYW5nZUxpc3RlbmVyID0gdGhpcy5vbklubmVyQ29udGVudFByb3BlcnR5Q2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICB0aGlzLl90YWdOYW1lID0gbnVsbDtcclxuICAgIHRoaXMuX2NvbnRhaW5lclRhZ05hbWUgPSBudWxsO1xyXG4gICAgdGhpcy5fbGFiZWxUYWdOYW1lID0gbnVsbDtcclxuICAgIHRoaXMuX2Rlc2NyaXB0aW9uVGFnTmFtZSA9IG51bGw7XHJcbiAgICB0aGlzLl9pbnB1dFR5cGUgPSBudWxsO1xyXG4gICAgdGhpcy5fcGRvbUNoZWNrZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuX2FwcGVuZExhYmVsID0gZmFsc2U7XHJcbiAgICB0aGlzLl9hcHBlbmREZXNjcmlwdGlvbiA9IGZhbHNlO1xyXG4gICAgdGhpcy5fcGRvbUF0dHJpYnV0ZXMgPSBbXTtcclxuICAgIHRoaXMuX3Bkb21DbGFzc2VzID0gW107XHJcblxyXG4gICAgdGhpcy5fcGRvbU5hbWVzcGFjZSA9IG51bGw7XHJcbiAgICB0aGlzLl9hcmlhUm9sZSA9IG51bGw7XHJcbiAgICB0aGlzLl9jb250YWluZXJBcmlhUm9sZSA9IG51bGw7XHJcbiAgICB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZSA9IFtdO1xyXG4gICAgdGhpcy5fYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zID0gW107XHJcbiAgICB0aGlzLl9ub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZSA9IFtdO1xyXG4gICAgdGhpcy5fYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy5fbm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGUgPSBbXTtcclxuICAgIHRoaXMuX2ZvY3VzYWJsZU92ZXJyaWRlID0gbnVsbDtcclxuICAgIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0ID0gbnVsbDtcclxuICAgIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlID0gZmFsc2U7XHJcbiAgICB0aGlzLl9ncm91cEZvY3VzSGlnaGxpZ2h0ID0gZmFsc2U7XHJcbiAgICB0aGlzLl9wZG9tT3JkZXIgPSBudWxsO1xyXG4gICAgdGhpcy5fcGRvbVBhcmVudCA9IG51bGw7XHJcbiAgICB0aGlzLl9wZG9tVHJhbnNmb3JtU291cmNlTm9kZSA9IG51bGw7XHJcbiAgICB0aGlzLl9mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5ID0gbnVsbDtcclxuICAgIHRoaXMuX2xpbWl0UGFuRGlyZWN0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8gPSBuZXcgUERPTURpc3BsYXlzSW5mbyggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKTtcclxuICAgIHRoaXMuX3Bkb21JbnN0YW5jZXMgPSBbXTtcclxuICAgIHRoaXMuX3Bvc2l0aW9uSW5QRE9NID0gZmFsc2U7XHJcbiAgICB0aGlzLmV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLl9wZG9tVmlzaWJsZVByb3BlcnR5ID0gbmV3IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8Ym9vbGVhbj4oIHRydWUsIGZhbHNlLCB0aGlzLm9uUGRvbVZpc2libGVQcm9wZXJ0eUNoYW5nZS5iaW5kKCB0aGlzICkgKTtcclxuXHJcbiAgICAvLyBISUdIRVIgTEVWRUwgQVBJIElOSVRJQUxJWkFUSU9OXHJcblxyXG4gICAgdGhpcy5fYWNjZXNzaWJsZU5hbWVCZWhhdmlvciA9IFBhcmFsbGVsRE9NLkJBU0lDX0FDQ0VTU0lCTEVfTkFNRV9CRUhBVklPUjtcclxuICAgIHRoaXMuX2hlbHBUZXh0QmVoYXZpb3IgPSBQYXJhbGxlbERPTS5IRUxQX1RFWFRfQUZURVJfQ09OVEVOVDtcclxuICAgIHRoaXMuX2hlYWRpbmdMZXZlbCA9IG51bGw7XHJcbiAgICB0aGlzLl9wZG9tSGVhZGluZ0JlaGF2aW9yID0gREVGQVVMVF9QRE9NX0hFQURJTkdfQkVIQVZJT1I7XHJcbiAgICB0aGlzLnBkb21Cb3VuZElucHV0RW5hYmxlZExpc3RlbmVyID0gdGhpcy5wZG9tSW5wdXRFbmFibGVkTGlzdGVuZXIuYmluZCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIC8vIFBVQkxJQyBNRVRIT0RTXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlIGFjY2Vzc2liaWxpdHkgYnkgcmVtb3ZpbmcgYWxsIGxpc3RlbmVycyBvbiB0aGlzIG5vZGUgZm9yIGFjY2Vzc2libGUgaW5wdXQuIFBhcmFsbGVsRE9NIGlzIGRpc3Bvc2VkXHJcbiAgICogYnkgY2FsbGluZyBOb2RlLmRpc3Bvc2UoKSwgc28gdGhpcyBmdW5jdGlvbiBpcyBzY2VuZXJ5LWludGVybmFsLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBkaXNwb3NlUGFyYWxsZWxET00oKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9hY2Nlc3NpYmxlTmFtZSApICYmICF0aGlzLl9hY2Nlc3NpYmxlTmFtZS5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICB0aGlzLl9hY2Nlc3NpYmxlTmFtZS51bmxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9hY2Nlc3NpYmxlTmFtZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9oZWxwVGV4dCApICYmICF0aGlzLl9oZWxwVGV4dC5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICB0aGlzLl9oZWxwVGV4dC51bmxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9oZWxwVGV4dCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9wZG9tSGVhZGluZyApICYmICF0aGlzLl9wZG9tSGVhZGluZy5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICB0aGlzLl9wZG9tSGVhZGluZy51bmxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9wZG9tSGVhZGluZyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9pbnB1dFZhbHVlICkgJiYgIXRoaXMuX2lucHV0VmFsdWUuaXNEaXNwb3NlZCApIHtcclxuICAgICAgdGhpcy5faW5wdXRWYWx1ZS51bmxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9pbnB1dFZhbHVlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2FyaWFMYWJlbCApICYmICF0aGlzLl9hcmlhTGFiZWwuaXNEaXNwb3NlZCApIHtcclxuICAgICAgdGhpcy5fYXJpYUxhYmVsLnVubGluayggdGhpcy5fb25BcmlhTGFiZWxDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggdGhpcy5fYXJpYVZhbHVlVGV4dCApICYmICF0aGlzLl9hcmlhVmFsdWVUZXh0LmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgIHRoaXMuX2FyaWFWYWx1ZVRleHQudW5saW5rKCB0aGlzLl9vbkFyaWFWYWx1ZVRleHRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggdGhpcy5faW5uZXJDb250ZW50ICkgJiYgIXRoaXMuX2lubmVyQ29udGVudC5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICB0aGlzLl9pbm5lckNvbnRlbnQudW5saW5rKCB0aGlzLl9vbklubmVyQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9sYWJlbENvbnRlbnQgKSAmJiAhdGhpcy5fbGFiZWxDb250ZW50LmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgIHRoaXMuX2xhYmVsQ29udGVudC51bmxpbmsoIHRoaXMuX29uTGFiZWxDb250ZW50Q2hhbmdlTGlzdGVuZXIgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2Rlc2NyaXB0aW9uQ29udGVudCApICYmICF0aGlzLl9kZXNjcmlwdGlvbkNvbnRlbnQuaXNEaXNwb3NlZCApIHtcclxuICAgICAgdGhpcy5fZGVzY3JpcHRpb25Db250ZW50LnVubGluayggdGhpcy5fb25EZXNjcmlwdGlvbkNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgICggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKS5pbnB1dEVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIHRoaXMucGRvbUJvdW5kSW5wdXRFbmFibGVkTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBUbyBwcmV2ZW50IG1lbW9yeSBsZWFrcywgd2Ugd2FudCB0byBjbGVhciBvdXIgb3JkZXIgKHNpbmNlIG90aGVyd2lzZSBub2RlcyBpbiBvdXIgb3JkZXIgd2lsbCByZWZlcmVuY2VcclxuICAgIC8vIHRoaXMgbm9kZSkuXHJcbiAgICB0aGlzLnBkb21PcmRlciA9IG51bGw7XHJcblxyXG4gICAgLy8gY2xlYXIgcmVmZXJlbmNlcyB0byB0aGUgcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGVcclxuICAgIHRoaXMuc2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUoIG51bGwgKTtcclxuXHJcbiAgICAvLyBDbGVhciBvdXQgYXJpYSBhc3NvY2lhdGlvbiBhdHRyaWJ1dGVzLCB3aGljaCBob2xkIHJlZmVyZW5jZXMgdG8gb3RoZXIgbm9kZXMuXHJcbiAgICB0aGlzLnNldEFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zKCBbXSApO1xyXG4gICAgdGhpcy5zZXRBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMoIFtdICk7XHJcbiAgICB0aGlzLnNldEFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMoIFtdICk7XHJcblxyXG4gICAgLy8gUERPTSBhdHRyaWJ1dGVzIGNhbiBwb3RlbnRpYWxseSBoYXZlIGxpc3RlbmVycywgc28gd2Ugd2lsbCBjbGVhciB0aG9zZSBvdXQuXHJcbiAgICB0aGlzLnJlbW92ZVBET01BdHRyaWJ1dGVzKCk7XHJcblxyXG4gICAgdGhpcy5fcGRvbVZpc2libGVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBkb21JbnB1dEVuYWJsZWRMaXN0ZW5lciggZW5hYmxlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBNYXJrIHRoaXMgTm9kZSBhcyBkaXNhYmxlZCBpbiB0aGUgUGFyYWxsZWxET01cclxuICAgIHRoaXMuc2V0UERPTUF0dHJpYnV0ZSggJ2FyaWEtZGlzYWJsZWQnLCAhZW5hYmxlZCApO1xyXG5cclxuICAgIC8vIEJ5IHJldHVybmluZyBmYWxzZSwgd2UgcHJldmVudCB0aGUgY29tcG9uZW50IGZyb20gdG9nZ2xpbmcgbmF0aXZlIEhUTUwgZWxlbWVudCBhdHRyaWJ1dGVzIHRoYXQgY29udmV5IHN0YXRlLlxyXG4gICAgLy8gRm9yIGV4YW1wbGUsdGhpcyB3aWxsIHByZXZlbnQgYSBjaGVja2JveCBmcm9tIGNoYW5naW5nIGBjaGVja2VkYCBwcm9wZXJ0eSB3aGlsZSBpdCBpcyBkaXNhYmxlZC4gVGhpcyB3YXlcclxuICAgIC8vIHdlIGNhbiBrZWVwIHRoZSBjb21wb25lbnQgaW4gdHJhdmVyc2FsIG9yZGVyIGFuZCBkb24ndCBuZWVkIHRvIGFkZCB0aGUgYGRpc2FibGVkYCBhdHRyaWJ1dGUuIFNlZVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNTE5IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82NDBcclxuICAgIC8vIFRoaXMgc29sdXRpb24gd2FzIGZvdW5kIGF0IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjI2NzM1MC8zNDA4NTAyXHJcbiAgICB0aGlzLnNldFBET01BdHRyaWJ1dGUoICdvbmNsaWNrJywgZW5hYmxlZCA/ICcnIDogJ3JldHVybiBmYWxzZScgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB3aGV0aGVyIHRoaXMgTm9kZSdzIHByaW1hcnkgRE9NIGVsZW1lbnQgY3VycmVudGx5IGhhcyBmb2N1cy5cclxuICAgKi9cclxuICBwdWJsaWMgaXNGb2N1c2VkKCk6IGJvb2xlYW4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGVlciA9IHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyITtcclxuICAgICAgaWYgKCBwZWVyLmlzRm9jdXNlZCgpICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvY3VzZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzRm9jdXNlZCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvY3VzIHRoaXMgbm9kZSdzIHByaW1hcnkgZG9tIGVsZW1lbnQuIFRoZSBlbGVtZW50IG11c3Qgbm90IGJlIGhpZGRlbiwgYW5kIGl0IG11c3QgYmUgZm9jdXNhYmxlLiBJZiB0aGUgbm9kZVxyXG4gICAqIGhhcyBtb3JlIHRoYW4gb25lIGluc3RhbmNlLCB0aGlzIHdpbGwgZmFpbCBiZWNhdXNlIHRoZSBET00gZWxlbWVudCBpcyBub3QgdW5pcXVlbHkgZGVmaW5lZC4gSWYgYWNjZXNzaWJpbGl0eVxyXG4gICAqIGlzIG5vdCBlbmFibGVkLCB0aGlzIHdpbGwgYmUgYSBubyBvcC4gV2hlbiBQYXJhbGxlbERPTSBpcyBtb3JlIHdpZGVseSB1c2VkLCB0aGUgbm8gb3AgY2FuIGJlIHJlcGxhY2VkXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gdGhhdCBjaGVja3MgZm9yIHBkb20gY29udGVudC5cclxuICAgKi9cclxuICBwdWJsaWMgZm9jdXMoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gaWYgYSBzaW0gaXMgcnVubmluZyB3aXRob3V0IGFjY2Vzc2liaWxpdHkgZW5hYmxlZCwgdGhlcmUgd2lsbCBiZSBubyBhY2Nlc3NpYmxlIGluc3RhbmNlcywgYnV0IGZvY3VzKCkgbWlnaHRcclxuICAgIC8vIHN0aWxsIGJlIGNhbGxlZCB3aXRob3V0IGFjY2Vzc2liaWxpdHkgZW5hYmxlZFxyXG4gICAgaWYgKCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAvLyB3aGVuIGFjY2Vzc2liaWxpdHkgaXMgd2lkZWx5IHVzZWQsIHRoaXMgYXNzZXJ0aW9uIGNhbiBiZSBhZGRlZCBiYWNrIGluXHJcbiAgICAgIC8vIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3Bkb21JbnN0YW5jZXMubGVuZ3RoID4gMCwgJ3RoZXJlIG11c3QgYmUgcGRvbSBjb250ZW50IGZvciB0aGUgbm9kZSB0byByZWNlaXZlIGZvY3VzJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmZvY3VzYWJsZSwgJ3RyeWluZyB0byBzZXQgZm9jdXMgb24gYSBub2RlIHRoYXQgaXMgbm90IGZvY3VzYWJsZScgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wZG9tVmlzaWJsZSwgJ3RyeWluZyB0byBzZXQgZm9jdXMgb24gYSBub2RlIHdpdGggaW52aXNpYmxlIHBkb20gY29udGVudCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGggPT09IDEsICdmb2N1cygpIHVuc3VwcG9ydGVkIGZvciBOb2RlcyB1c2luZyBEQUcsIHBkb20gY29udGVudCBpcyBub3QgdW5pcXVlJyApO1xyXG5cclxuICAgICAgY29uc3QgcGVlciA9IHRoaXMuX3Bkb21JbnN0YW5jZXNbIDAgXS5wZWVyITtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGVlciwgJ211c3QgaGF2ZSBhIHBlZXIgdG8gZm9jdXMnICk7XHJcbiAgICAgIHBlZXIuZm9jdXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBmb2N1cyBmcm9tIHRoaXMgbm9kZSdzIHByaW1hcnkgRE9NIGVsZW1lbnQuICBUaGUgZm9jdXMgaGlnaGxpZ2h0IHdpbGwgZGlzYXBwZWFyLCBhbmQgdGhlIGVsZW1lbnQgd2lsbCBub3QgcmVjZWl2ZVxyXG4gICAqIGtleWJvYXJkIGV2ZW50cyB3aGVuIGl0IGRvZXNuJ3QgaGF2ZSBmb2N1cy5cclxuICAgKi9cclxuICBwdWJsaWMgYmx1cigpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aCA9PT0gMSwgJ2JsdXIoKSB1bnN1cHBvcnRlZCBmb3IgTm9kZXMgdXNpbmcgREFHLCBwZG9tIGNvbnRlbnQgaXMgbm90IHVuaXF1ZScgKTtcclxuICAgICAgY29uc3QgcGVlciA9IHRoaXMuX3Bkb21JbnN0YW5jZXNbIDAgXS5wZWVyITtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGVlciwgJ211c3QgaGF2ZSBhIHBlZXIgdG8gYmx1cicgKTtcclxuICAgICAgcGVlci5ibHVyKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhc3NlcnRpb25zIGFyZSBlbmFibGVkIGFuZCBvbmNlIHRoZSBOb2RlIGhhcyBiZWVuIGNvbXBsZXRlbHkgY29uc3RydWN0ZWQuIFRoaXMgaXMgdGhlIHRpbWUgdG9cclxuICAgKiBtYWtlIHN1cmUgdGhhdCBvcHRpb25zIGFyZSBzZXQgdXAgdGhlIHdheSB0aGV5IGFyZSBleHBlY3RlZCB0byBiZS4gRm9yIGV4YW1wbGUuIHlvdSBkb24ndCB3YW50IGFjY2Vzc2libGVOYW1lXHJcbiAgICogYW5kIGxhYmVsQ29udGVudCBkZWNsYXJlZC5cclxuICAgKiAob25seSBjYWxsZWQgYnkgU2NyZWVuLmpzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwZG9tQXVkaXQoKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCB0aGlzLmhhc1BET01Db250ZW50ICYmIGFzc2VydCApIHtcclxuXHJcbiAgICAgIHRoaXMuX2lucHV0VHlwZSAmJiBhc3NlcnQoIHRoaXMuX3RhZ05hbWUhLnRvVXBwZXJDYXNlKCkgPT09IElOUFVUX1RBRywgJ3RhZ05hbWUgbXVzdCBiZSBJTlBVVCB0byBzdXBwb3J0IGlucHV0VHlwZScgKTtcclxuICAgICAgdGhpcy5fcGRvbUNoZWNrZWQgJiYgYXNzZXJ0KCB0aGlzLl90YWdOYW1lIS50b1VwcGVyQ2FzZSgpID09PSBJTlBVVF9UQUcsICd0YWdOYW1lIG11c3QgYmUgSU5QVVQgdG8gc3VwcG9ydCBwZG9tQ2hlY2tlZC4nICk7XHJcbiAgICAgIHRoaXMuX2lucHV0VmFsdWUgJiYgYXNzZXJ0KCB0aGlzLl90YWdOYW1lIS50b1VwcGVyQ2FzZSgpID09PSBJTlBVVF9UQUcsICd0YWdOYW1lIG11c3QgYmUgSU5QVVQgdG8gc3VwcG9ydCBpbnB1dFZhbHVlJyApO1xyXG4gICAgICB0aGlzLl9wZG9tQ2hlY2tlZCAmJiBhc3NlcnQoIElOUFVUX1RZUEVTX1RIQVRfU1VQUE9SVF9DSEVDS0VELmluY2x1ZGVzKCB0aGlzLl9pbnB1dFR5cGUhLnRvVXBwZXJDYXNlKCkgKSwgYGlucHV0VHlwZSBkb2VzIG5vdCBzdXBwb3J0IGNoZWNrZWQgYXR0cmlidXRlOiAke3RoaXMuX2lucHV0VHlwZX1gICk7XHJcbiAgICAgIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlICYmIGFzc2VydCggdGhpcy5mb2N1c0hpZ2hsaWdodCBpbnN0YW5jZW9mIE5vZGUsICdmb2N1c0hpZ2hsaWdodCBtdXN0IGJlIE5vZGUgaWYgaGlnaGxpZ2h0IGlzIGxheWVyYWJsZScgKTtcclxuICAgICAgdGhpcy5fdGFnTmFtZSEudG9VcHBlckNhc2UoKSA9PT0gSU5QVVRfVEFHICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX2lucHV0VHlwZSA9PT0gJ3N0cmluZycsICcgaW5wdXRUeXBlIGV4cGVjdGVkIGZvciBpbnB1dCcgKTtcclxuXHJcbiAgICAgIC8vIG5vdGUgdGhhdCBtb3N0IHRoaW5ncyB0aGF0IGFyZSBub3QgZm9jdXNhYmxlIGJ5IGRlZmF1bHQgbmVlZCBpbm5lckNvbnRlbnQgdG8gYmUgZm9jdXNhYmxlIG9uIFZvaWNlT3ZlcixcclxuICAgICAgLy8gYnV0IHRoaXMgd2lsbCBjYXRjaCBtb3N0IGNhc2VzIHNpbmNlIG9mdGVuIHRoaW5ncyB0aGF0IGdldCBhZGRlZCB0byB0aGUgZm9jdXMgb3JkZXIgaGF2ZSB0aGUgYXBwbGljYXRpb25cclxuICAgICAgLy8gcm9sZSBmb3IgY3VzdG9tIGlucHV0LiBOb3RlIHRoYXQgYWNjZXNzaWJsZU5hbWUgd2lsbCBub3QgYmUgY2hlY2tlZCB0aGF0IGl0IHNwZWNpZmljYWxseSBjaGFuZ2VzIGlubmVyQ29udGVudCwgaXQgaXMgdXAgdG8gdGhlIGRldiB0byBkbyB0aGlzLlxyXG4gICAgICB0aGlzLmFyaWFSb2xlID09PSAnYXBwbGljYXRpb24nICYmIGFzc2VydCggdGhpcy5pbm5lckNvbnRlbnQgfHwgdGhpcy5hY2Nlc3NpYmxlTmFtZSwgJ211c3QgaGF2ZSBzb21lIGlubmVyQ29udGVudCBvciBlbGVtZW50IHdpbGwgbmV2ZXIgYmUgZm9jdXNhYmxlIGluIFZvaWNlT3ZlcicgKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKS5jaGlsZHJlblsgaSBdLnBkb21BdWRpdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIC8vIEhJR0hFUiBMRVZFTCBBUEk6IEdFVFRFUlMgQU5EIFNFVFRFUlMgRk9SIFBET00gQVBJIE9QVElPTlNcclxuICAvL1xyXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyB1dGlsaXplIHRoZSBsb3dlciBsZXZlbCBBUEkgdG8gYWNoaWV2ZSBhIGNvbnNpc3RlbmNlLCBhbmQgY29udmVuaWVudCBBUEkgZm9yIGFkZGluZ1xyXG4gIC8vIHBkb20gY29udGVudCB0byB0aGUgUERPTS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy83OTVcclxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgTm9kZSdzIHBkb20gY29udGVudCBpbiBhIHdheSB0aGF0IHdpbGwgZGVmaW5lIHRoZSBBY2Nlc3NpYmxlIE5hbWUgZm9yIHRoZSBicm93c2VyLiBEaWZmZXJlbnRcclxuICAgKiBIVE1MIGNvbXBvbmVudHMgYW5kIGNvZGUgc2l0dWF0aW9ucyByZXF1aXJlIGRpZmZlcmVudCBtZXRob2RzIG9mIHNldHRpbmcgdGhlIEFjY2Vzc2libGUgTmFtZS4gU2VlXHJcbiAgICogc2V0QWNjZXNzaWJsZU5hbWVCZWhhdmlvciBmb3IgZGV0YWlscyBvbiBob3cgdGhpcyBzdHJpbmcgaXMgcmVuZGVyZWQgaW4gdGhlIFBET00uIFNldHRpbmcgdG8gbnVsbCB3aWxsIGNsZWFyXHJcbiAgICogdGhpcyBOb2RlJ3MgYWNjZXNzaWJsZU5hbWVcclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIHNldEFjY2Vzc2libGVOYW1lKCBhY2Nlc3NpYmxlTmFtZTogUERPTVZhbHVlVHlwZSB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIGFjY2Vzc2libGVOYW1lICE9PSB0aGlzLl9hY2Nlc3NpYmxlTmFtZSApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9hY2Nlc3NpYmxlTmFtZSApICYmICF0aGlzLl9hY2Nlc3NpYmxlTmFtZS5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc2libGVOYW1lLnVubGluayggdGhpcy5fb25QRE9NQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2FjY2Vzc2libGVOYW1lID0gYWNjZXNzaWJsZU5hbWU7XHJcblxyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGFjY2Vzc2libGVOYW1lICkgKSB7XHJcbiAgICAgICAgYWNjZXNzaWJsZU5hbWUubGF6eUxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYWNjZXNzaWJsZU5hbWUoIGFjY2Vzc2libGVOYW1lOiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApIHsgdGhpcy5zZXRBY2Nlc3NpYmxlTmFtZSggYWNjZXNzaWJsZU5hbWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFjY2Vzc2libGVOYW1lKCk6IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRBY2Nlc3NpYmxlTmFtZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgdGFnIG5hbWUgb2YgdGhlIERPTSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGlzIG5vZGUgZm9yIGFjY2Vzc2liaWxpdHkuXHJcbiAgICpcclxuICAgKiBAZXhwZXJpbWVudGFsIC0gTk9URTogdXNlIHdpdGggY2F1dGlvbiwgYTExeSB0ZWFtIHJlc2VydmVzIHRoZSByaWdodCB0byBjaGFuZ2UgQVBJICh0aG91Z2ggdW5saWtlbHkpLiBOb3QgeWV0IGZ1bGx5IGltcGxlbWVudGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg2N1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBY2Nlc3NpYmxlTmFtZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggdGhpcy5fYWNjZXNzaWJsZU5hbWUgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc2libGVOYW1lLnZhbHVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NpYmxlTmFtZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSB0aGlzIE5vZGUgZnJvbSB0aGUgUERPTSBieSBjbGVhcmluZyBpdHMgcGRvbSBjb250ZW50LiBUaGlzIGNhbiBiZSB1c2VmdWwgd2hlbiBjcmVhdGluZyBpY29ucyBmcm9tXHJcbiAgICogcGRvbSBjb250ZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVGcm9tUERPTSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3RhZ05hbWUgIT09IG51bGwsICdUaGVyZSBpcyBubyBwZG9tIGNvbnRlbnQgdG8gY2xlYXIgZnJvbSB0aGUgUERPTScgKTtcclxuICAgIHRoaXMudGFnTmFtZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogYWNjZXNzaWJsZU5hbWVCZWhhdmlvciBpcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBzZXQgdGhlIGFwcHJvcHJpYXRlIG9wdGlvbnMgb24gdGhpcyBub2RlIHRvIGdldCB0aGUgZGVzaXJlZFxyXG4gICAqIFwiQWNjZXNzaWJsZSBOYW1lXCJcclxuICAgKlxyXG4gICAqIFRoaXMgYWNjZXNzaWJsZU5hbWVCZWhhdmlvcidzIGRlZmF1bHQgZG9lcyB0aGUgYmVzdCBpdCBjYW4gdG8gY3JlYXRlIGEgZ2VuZXJhbCBtZXRob2QgdG8gc2V0IHRoZSBBY2Nlc3NpYmxlXHJcbiAgICogTmFtZSBmb3IgYSB2YXJpZXR5IG9mIGRpZmZlcmVudCBOb2RlIHR5cGVzIGFuZCBjb25maWd1cmF0aW9ucywgYnV0IGlmIGEgTm9kZSBpcyBtb3JlIGNvbXBsaWNhdGVkLCB0aGVuIHRoaXNcclxuICAgKiBtZXRob2Qgd2lsbCBub3QgcHJvcGVybHkgc2V0IHRoZSBBY2Nlc3NpYmxlIE5hbWUgZm9yIHRoZSBOb2RlJ3MgSFRNTCBjb250ZW50LiBJbiB0aGlzIHNpdHVhdGlvbiB0aGlzIGZ1bmN0aW9uXHJcbiAgICogbmVlZHMgdG8gYmUgb3ZlcnJpZGRlbiBieSB0aGUgc3VidHlwZSB0byBtZWV0IGl0cyBzcGVjaWZpYyBjb25zdHJhaW50cy4gV2hlbiBkb2luZyB0aGlzIG1ha2UgaXQgaXMgdXAgdG8gdGhlXHJcbiAgICogdXNhZ2Ugc2l0ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgQWNjZXNzaWJsZSBOYW1lIGlzIHByb3Blcmx5IGJlaW5nIHNldCBhbmQgY29udmV5ZWQgdG8gQVQsIGFzIGl0IGlzIHZlcnkgaGFyZFxyXG4gICAqIHRvIHZhbGlkYXRlIHRoaXMgZnVuY3Rpb24uXHJcbiAgICpcclxuICAgKiBOT1RFOiBCeSBBY2Nlc3NpYmxlIE5hbWUgKGNhcGl0YWxpemVkKSwgd2UgbWVhbiB0aGUgcHJvcGVyIHRpdGxlIG9mIHRoZSBIVE1MIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHNldCBpblxyXG4gICAqIHRoZSBicm93c2VyIFBhcmFsbGVsRE9NIFRyZWUgYW5kIHRoZW4gaW50ZXJwcmV0ZWQgYnkgQVQuIFRoaXMgaXMgbmVjZXNzaWx5IGRpZmZlcmVudCBmcm9tIHNjZW5lcnkgaW50ZXJuYWxcclxuICAgKiBuYW1lcyBvZiBIVE1MIGVsZW1lbnRzIGxpa2UgXCJsYWJlbCBzaWJsaW5nXCIgKGV2ZW4gdGhvdWdoLCBpbiBjZXJ0YWluIGNpcmN1bXN0YW5jZXMsIGFuIEFjY2Vzc2libGUgTmFtZSBjb3VsZFxyXG4gICAqIGJlIHNldCBieSB1c2luZyB0aGUgXCJsYWJlbCBzaWJsaW5nXCIgd2l0aCB0YWcgbmFtZSBcImxhYmVsXCIgYW5kIGEgXCJmb3JcIiBhdHRyaWJ1dGUpLlxyXG4gICAqXHJcbiAgICogRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgc2V0dGluZyBhbiBBY2Nlc3NpYmxlIE5hbWUgb24gSFRNTCBzZWUgdGhlIHNjZW5lcnkgZG9jcyBmb3IgYWNjZXNzaWJpbGl0eSxcclxuICAgKiBhbmQgc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLnBhY2llbGxvZ3JvdXAuY29tL2Jsb2cvMjAxNy8wNC93aGF0LWlzLWFuLWFjY2Vzc2libGUtbmFtZS9cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIHNldEFjY2Vzc2libGVOYW1lQmVoYXZpb3IoIGFjY2Vzc2libGVOYW1lQmVoYXZpb3I6IFBET01CZWhhdmlvckZ1bmN0aW9uICk6IHZvaWQge1xyXG5cclxuICAgIGlmICggdGhpcy5fYWNjZXNzaWJsZU5hbWVCZWhhdmlvciAhPT0gYWNjZXNzaWJsZU5hbWVCZWhhdmlvciApIHtcclxuXHJcbiAgICAgIHRoaXMuX2FjY2Vzc2libGVOYW1lQmVoYXZpb3IgPSBhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yO1xyXG5cclxuICAgICAgdGhpcy5vblBET01Db250ZW50Q2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFjY2Vzc2libGVOYW1lQmVoYXZpb3IoIGFjY2Vzc2libGVOYW1lQmVoYXZpb3I6IFBET01CZWhhdmlvckZ1bmN0aW9uICkgeyB0aGlzLnNldEFjY2Vzc2libGVOYW1lQmVoYXZpb3IoIGFjY2Vzc2libGVOYW1lQmVoYXZpb3IgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFjY2Vzc2libGVOYW1lQmVoYXZpb3IoKTogUERPTUJlaGF2aW9yRnVuY3Rpb24geyByZXR1cm4gdGhpcy5nZXRBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBoZWxwIHRleHQgb2YgdGhlIGludGVyYWN0aXZlIGVsZW1lbnQuXHJcbiAgICpcclxuICAgKiBAZXhwZXJpbWVudGFsIC0gTk9URTogdXNlIHdpdGggY2F1dGlvbiwgYTExeSB0ZWFtIHJlc2VydmVzIHRoZSByaWdodCB0byBjaGFuZ2UgQVBJICh0aG91Z2ggdW5saWtlbHkpLlxyXG4gICAqICAgICAgICAgICAgICAgICBOb3QgeWV0IGZ1bGx5IGltcGxlbWVudGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg2N1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yKCk6IFBET01CZWhhdmlvckZ1bmN0aW9uIHtcclxuICAgIHJldHVybiB0aGlzLl9hY2Nlc3NpYmxlTmFtZUJlaGF2aW9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBOb2RlIGhlYWRpbmcgY29udGVudC4gVGhpcyBieSBkZWZhdWx0IHdpbGwgYmUgYSBoZWFkaW5nIHRhZyB3aG9zZSBsZXZlbCBpcyBkZXBlbmRlbnQgb24gaG93IG1hbnkgcGFyZW50c1xyXG4gICAqIE5vZGVzIGFyZSBoZWFkaW5nIG5vZGVzLiBTZWUgY29tcHV0ZUhlYWRpbmdMZXZlbCgpIGZvciBtb3JlIGluZm9cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIHNldFBET01IZWFkaW5nKCBwZG9tSGVhZGluZzogUERPTVZhbHVlVHlwZSB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIHBkb21IZWFkaW5nICE9PSB0aGlzLl9wZG9tSGVhZGluZyApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9wZG9tSGVhZGluZyApICYmICF0aGlzLl9wZG9tSGVhZGluZy5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICAgIHRoaXMuX3Bkb21IZWFkaW5nLnVubGluayggdGhpcy5fb25QRE9NQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3Bkb21IZWFkaW5nID0gcGRvbUhlYWRpbmc7XHJcblxyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHBkb21IZWFkaW5nICkgKSB7XHJcbiAgICAgICAgcGRvbUhlYWRpbmcubGF6eUxpbmsoIHRoaXMuX29uUERPTUNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcGRvbUhlYWRpbmcoIHBkb21IZWFkaW5nOiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApIHsgdGhpcy5zZXRQRE9NSGVhZGluZyggcGRvbUhlYWRpbmcgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHBkb21IZWFkaW5nKCk6IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRQRE9NSGVhZGluZygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgdmFsdWUgb2YgdGhpcyBOb2RlJ3MgaGVhZGluZy4gVXNlIG51bGwgdG8gY2xlYXIgdGhlIGhlYWRpbmdcclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIGdldFBET01IZWFkaW5nKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9wZG9tSGVhZGluZyApICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcGRvbUhlYWRpbmcudmFsdWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3Bkb21IZWFkaW5nO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBiZWhhdmlvciBvZiBob3cgYHRoaXMucGRvbUhlYWRpbmdgIGlzIHNldCBpbiB0aGUgUERPTS4gU2VlIGRlZmF1bHQgYmVoYXZpb3IgZnVuY3Rpb24gZm9yIG1vcmVcclxuICAgKiBpbmZvcm1hdGlvbi5cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIHNldFBET01IZWFkaW5nQmVoYXZpb3IoIHBkb21IZWFkaW5nQmVoYXZpb3I6IFBET01CZWhhdmlvckZ1bmN0aW9uICk6IHZvaWQge1xyXG5cclxuICAgIGlmICggdGhpcy5fcGRvbUhlYWRpbmdCZWhhdmlvciAhPT0gcGRvbUhlYWRpbmdCZWhhdmlvciApIHtcclxuXHJcbiAgICAgIHRoaXMuX3Bkb21IZWFkaW5nQmVoYXZpb3IgPSBwZG9tSGVhZGluZ0JlaGF2aW9yO1xyXG5cclxuICAgICAgdGhpcy5vblBET01Db250ZW50Q2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHBkb21IZWFkaW5nQmVoYXZpb3IoIHBkb21IZWFkaW5nQmVoYXZpb3I6IFBET01CZWhhdmlvckZ1bmN0aW9uICkgeyB0aGlzLnNldFBET01IZWFkaW5nQmVoYXZpb3IoIHBkb21IZWFkaW5nQmVoYXZpb3IgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHBkb21IZWFkaW5nQmVoYXZpb3IoKTogUERPTUJlaGF2aW9yRnVuY3Rpb24geyByZXR1cm4gdGhpcy5nZXRQRE9NSGVhZGluZ0JlaGF2aW9yKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBoZWxwIHRleHQgb2YgdGhlIGludGVyYWN0aXZlIGVsZW1lbnQuXHJcbiAgICpcclxuICAgKiBAZXhwZXJpbWVudGFsIC0gTk9URTogdXNlIHdpdGggY2F1dGlvbiwgYTExeSB0ZWFtIHJlc2VydmVzIHRoZSByaWdodCB0byBjaGFuZ2UgQVBJICh0aG91Z2ggdW5saWtlbHkpLlxyXG4gICAqICAgICAgICAgICAgICAgICBOb3QgeWV0IGZ1bGx5IGltcGxlbWVudGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg2N1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQRE9NSGVhZGluZ0JlaGF2aW9yKCk6IFBET01CZWhhdmlvckZ1bmN0aW9uIHtcclxuICAgIHJldHVybiB0aGlzLl9wZG9tSGVhZGluZ0JlaGF2aW9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSB0YWcgbmFtZSBvZiB0aGUgRE9NIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoaXMgbm9kZSBmb3IgYWNjZXNzaWJpbGl0eS5cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIGdldEhlYWRpbmdMZXZlbCgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9oZWFkaW5nTGV2ZWw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGhlYWRpbmdMZXZlbCgpOiBudW1iZXIgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0SGVhZGluZ0xldmVsKCk7IH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAvLyBUT0RPOiB3aGF0IGlmIGFuY2VzdG9yIGNoYW5nZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODU1XHJcbiAgICogU2V0cyB0aGlzIE5vZGUncyBoZWFkaW5nIGxldmVsLCBieSByZWN1cnNpbmcgdXAgdGhlIGFjY2Vzc2liaWxpdHkgdHJlZSB0byBmaW5kIGhlYWRpbmdzIHRoaXMgTm9kZVxyXG4gICAqIGlzIG5lc3RlZCB1bmRlci5cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjb21wdXRlSGVhZGluZ0xldmVsKCk6IG51bWJlciB7XHJcblxyXG4gICAgLy8gVE9ETzogYXNzZXJ0Pz8/IGFzc2VydCggdGhpcy5oZWFkaW5nTGV2ZWwgfHwgdGhpcy5fcGRvbVBhcmVudCk7IHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODU1XHJcbiAgICAvLyBFaXRoZXIgXiB3aGljaCBtYXkgYnJlYWsgZHVyaW5nIGNvbnN0cnVjdGlvbiwgb3IgViAoYmVsb3cpXHJcbiAgICAvLyAgYmFzZSBjYXNlIHRvIGhlYWRpbmcgbGV2ZWwgMVxyXG4gICAgaWYgKCAhdGhpcy5fcGRvbVBhcmVudCApIHtcclxuICAgICAgaWYgKCB0aGlzLnBkb21IZWFkaW5nICkge1xyXG4gICAgICAgIHRoaXMuX2hlYWRpbmdMZXZlbCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIDA7IC8vIHNvIHRoYXQgdGhlIGZpcnN0IG5vZGUgd2l0aCBhIGhlYWRpbmcgaXMgaGVhZGluZ0xldmVsIDFcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMucGRvbUhlYWRpbmcgKSB7XHJcbiAgICAgIGNvbnN0IGxldmVsID0gdGhpcy5fcGRvbVBhcmVudC5jb21wdXRlSGVhZGluZ0xldmVsKCkgKyAxO1xyXG4gICAgICB0aGlzLl9oZWFkaW5nTGV2ZWwgPSBsZXZlbDtcclxuICAgICAgcmV0dXJuIGxldmVsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9wZG9tUGFyZW50LmNvbXB1dGVIZWFkaW5nTGV2ZWwoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgaGVscCB0ZXh0IGZvciBhIE5vZGUuIFNlZSBzZXRBY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIGZvciBkZXRhaWxzIG9uIGhvdyB0aGlzIHN0cmluZyBpc1xyXG4gICAqIHJlbmRlcmVkIGluIHRoZSBQRE9NLiBOdWxsIHdpbGwgY2xlYXIgdGhlIGhlbHAgdGV4dCBmb3IgdGhpcyBOb2RlLlxyXG4gICAqXHJcbiAgICogQGV4cGVyaW1lbnRhbCAtIE5PVEU6IHVzZSB3aXRoIGNhdXRpb24sIGExMXkgdGVhbSByZXNlcnZlcyB0aGUgcmlnaHQgdG8gY2hhbmdlIEFQSSAodGhvdWdoIHVubGlrZWx5KS5cclxuICAgKiAgICAgICAgICAgICAgICAgTm90IHlldCBmdWxseSBpbXBsZW1lbnRlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NjdcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SGVscFRleHQoIGhlbHBUZXh0OiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGlmICggaGVscFRleHQgIT09IHRoaXMuX2hlbHBUZXh0ICkge1xyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2hlbHBUZXh0ICkgJiYgIXRoaXMuX2hlbHBUZXh0LmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgICAgdGhpcy5faGVscFRleHQudW5saW5rKCB0aGlzLl9vblBET01Db250ZW50Q2hhbmdlTGlzdGVuZXIgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5faGVscFRleHQgPSBoZWxwVGV4dDtcclxuXHJcbiAgICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggaGVscFRleHQgKSApIHtcclxuICAgICAgICBoZWxwVGV4dC5sYXp5TGluayggdGhpcy5fb25QRE9NQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMub25QRE9NQ29udGVudENoYW5nZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBoZWxwVGV4dCggaGVscFRleHQ6IFBET01WYWx1ZVR5cGUgfCBudWxsICkgeyB0aGlzLnNldEhlbHBUZXh0KCBoZWxwVGV4dCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaGVscFRleHQoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldEhlbHBUZXh0KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBoZWxwIHRleHQgb2YgdGhlIGludGVyYWN0aXZlIGVsZW1lbnQuXHJcbiAgICpcclxuICAgKiBAZXhwZXJpbWVudGFsIC0gTk9URTogdXNlIHdpdGggY2F1dGlvbiwgYTExeSB0ZWFtIHJlc2VydmVzIHRoZSByaWdodCB0byBjaGFuZ2UgQVBJICh0aG91Z2ggdW5saWtlbHkpLlxyXG4gICAqICAgICAgICAgICAgICAgICBOb3QgeWV0IGZ1bGx5IGltcGxlbWVudGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg2N1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRIZWxwVGV4dCgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggdGhpcy5faGVscFRleHQgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2hlbHBUZXh0LnZhbHVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9oZWxwVGV4dDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGhlbHBUZXh0QmVoYXZpb3IgaXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgc2V0IHRoZSBhcHByb3ByaWF0ZSBvcHRpb25zIG9uIHRoaXMgbm9kZSB0byBnZXQgdGhlIGRlc2lyZWRcclxuICAgKiBcIkhlbHAgVGV4dFwiLlxyXG4gICAqXHJcbiAgICogQGV4cGVyaW1lbnRhbCAtIE5PVEU6IHVzZSB3aXRoIGNhdXRpb24sIGExMXkgdGVhbSByZXNlcnZlcyB0aGUgcmlnaHQgdG8gY2hhbmdlIEFQSSAodGhvdWdoIHVubGlrZWx5KS5cclxuICAgKiAgICAgICAgICAgICAgICAgTm90IHlldCBmdWxseSBpbXBsZW1lbnRlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NjdcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SGVscFRleHRCZWhhdmlvciggaGVscFRleHRCZWhhdmlvcjogUERPTUJlaGF2aW9yRnVuY3Rpb24gKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9oZWxwVGV4dEJlaGF2aW9yICE9PSBoZWxwVGV4dEJlaGF2aW9yICkge1xyXG5cclxuICAgICAgdGhpcy5faGVscFRleHRCZWhhdmlvciA9IGhlbHBUZXh0QmVoYXZpb3I7XHJcblxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgaGVscFRleHRCZWhhdmlvciggaGVscFRleHRCZWhhdmlvcjogUERPTUJlaGF2aW9yRnVuY3Rpb24gKSB7IHRoaXMuc2V0SGVscFRleHRCZWhhdmlvciggaGVscFRleHRCZWhhdmlvciApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaGVscFRleHRCZWhhdmlvcigpOiBQRE9NQmVoYXZpb3JGdW5jdGlvbiB7IHJldHVybiB0aGlzLmdldEhlbHBUZXh0QmVoYXZpb3IoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGhlbHAgdGV4dCBvZiB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudC5cclxuICAgKlxyXG4gICAqIEBleHBlcmltZW50YWwgLSBOT1RFOiB1c2Ugd2l0aCBjYXV0aW9uLCBhMTF5IHRlYW0gcmVzZXJ2ZXMgdGhlIHJpZ2h0IHRvIGNoYW5nZSBBUEkgKHRob3VnaCB1bmxpa2VseSkuXHJcbiAgICogICAgICAgICAgICAgICAgIE5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODY3XHJcbiAgICovXHJcbiAgcHVibGljIGdldEhlbHBUZXh0QmVoYXZpb3IoKTogUERPTUJlaGF2aW9yRnVuY3Rpb24ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2hlbHBUZXh0QmVoYXZpb3I7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIC8vIExPV0VSIExFVkVMIEdFVFRFUlMgQU5EIFNFVFRFUlMgRk9SIFBET00gQVBJIE9QVElPTlNcclxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgdGFnIG5hbWUgZm9yIHRoZSBwcmltYXJ5IHNpYmxpbmcgaW4gdGhlIFBET00uIERPTSBlbGVtZW50IHRhZyBuYW1lcyBhcmUgcmVhZC1vbmx5LCBzbyB0aGlzXHJcbiAgICogZnVuY3Rpb24gd2lsbCBjcmVhdGUgYSBuZXcgRE9NIGVsZW1lbnQgZWFjaCB0aW1lIGl0IGlzIGNhbGxlZCBmb3IgdGhlIE5vZGUncyBQRE9NUGVlciBhbmRcclxuICAgKiByZXNldCB0aGUgcGRvbSBjb250ZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB0aGUgXCJlbnRyeSBwb2ludFwiIGZvciBQYXJhbGxlbCBET00gY29udGVudC4gV2hlbiBhIE5vZGUgaGFzIGEgdGFnTmFtZSBpdCB3aWxsIGFwcGVhciBpbiB0aGUgUGFyYWxsZWwgRE9NXHJcbiAgICogYW5kIG90aGVyIGF0dHJpYnV0ZXMgY2FuIGJlIHNldC4gV2l0aG91dCBpdCwgbm90aGluZyB3aWxsIGFwcGVhciBpbiB0aGUgUGFyYWxsZWwgRE9NLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUYWdOYW1lKCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGFnTmFtZSA9PT0gbnVsbCB8fCB0eXBlb2YgdGFnTmFtZSA9PT0gJ3N0cmluZycgKTtcclxuXHJcbiAgICBpZiAoIHRhZ05hbWUgIT09IHRoaXMuX3RhZ05hbWUgKSB7XHJcbiAgICAgIHRoaXMuX3RhZ05hbWUgPSB0YWdOYW1lO1xyXG5cclxuICAgICAgLy8gVE9ETzogdGhpcyBjb3VsZCBiZSBzZXR0aW5nIFBET00gY29udGVudCB0d2ljZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgdGFnTmFtZSggdGFnTmFtZTogc3RyaW5nIHwgbnVsbCApIHsgdGhpcy5zZXRUYWdOYW1lKCB0YWdOYW1lICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB0YWdOYW1lKCk6IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRUYWdOYW1lKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSB0YWcgbmFtZSBvZiB0aGUgRE9NIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoaXMgbm9kZSBmb3IgYWNjZXNzaWJpbGl0eS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VGFnTmFtZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl90YWdOYW1lO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSB0YWcgbmFtZSBmb3IgdGhlIGFjY2Vzc2libGUgbGFiZWwgc2libGluZyBmb3IgdGhpcyBOb2RlLiBET00gZWxlbWVudCB0YWcgbmFtZXMgYXJlIHJlYWQtb25seSxcclxuICAgKiBzbyB0aGlzIHdpbGwgcmVxdWlyZSBjcmVhdGluZyBhIG5ldyBQRE9NUGVlciBmb3IgdGhpcyBOb2RlIChyZWNvbnN0cnVjdGluZyBhbGwgRE9NIEVsZW1lbnRzKS4gSWZcclxuICAgKiBsYWJlbENvbnRlbnQgaXMgc3BlY2lmaWVkIHdpdGhvdXQgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlbiB0aGUgREVGQVVMVF9MQUJFTF9UQUdfTkFNRSB3aWxsIGJlIHVzZWQgYXMgdGhlXHJcbiAgICogdGFnIG5hbWUgZm9yIHRoZSBsYWJlbCBzaWJsaW5nLiBVc2UgbnVsbCB0byBjbGVhciB0aGUgbGFiZWwgc2libGluZyBlbGVtZW50IGZyb20gdGhlIFBET00uXHJcbiAgICovXHJcbiAgcHVibGljIHNldExhYmVsVGFnTmFtZSggdGFnTmFtZTogc3RyaW5nIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRhZ05hbWUgPT09IG51bGwgfHwgdHlwZW9mIHRhZ05hbWUgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gICAgaWYgKCB0YWdOYW1lICE9PSB0aGlzLl9sYWJlbFRhZ05hbWUgKSB7XHJcbiAgICAgIHRoaXMuX2xhYmVsVGFnTmFtZSA9IHRhZ05hbWU7XHJcblxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGFiZWxUYWdOYW1lKCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsICkgeyB0aGlzLnNldExhYmVsVGFnTmFtZSggdGFnTmFtZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbGFiZWxUYWdOYW1lKCk6IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRMYWJlbFRhZ05hbWUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGxhYmVsIHNpYmxpbmcgSFRNTCB0YWcgbmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGFiZWxUYWdOYW1lKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xhYmVsVGFnTmFtZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgdGFnIG5hbWUgZm9yIHRoZSBkZXNjcmlwdGlvbiBzaWJsaW5nLiBIVE1MIGVsZW1lbnQgdGFnIG5hbWVzIGFyZSByZWFkLW9ubHksIHNvIHRoaXMgd2lsbCByZXF1aXJlIGNyZWF0aW5nXHJcbiAgICogYSBuZXcgSFRNTCBlbGVtZW50LCBhbmQgaW5zZXJ0aW5nIGl0IGludG8gdGhlIERPTS4gVGhlIHRhZyBuYW1lIHByb3ZpZGVkIG11c3Qgc3VwcG9ydFxyXG4gICAqIGlubmVySFRNTCBhbmQgdGV4dENvbnRlbnQuIElmIGRlc2NyaXB0aW9uQ29udGVudCBpcyBzcGVjaWZpZWQgd2l0aG91dCB0aGlzIG9wdGlvbixcclxuICAgKiB0aGVuIGRlc2NyaXB0aW9uVGFnTmFtZSB3aWxsIGJlIHNldCB0byBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FLlxyXG4gICAqXHJcbiAgICogUGFzc2luZyAnbnVsbCcgd2lsbCBjbGVhciBhd2F5IHRoZSBkZXNjcmlwdGlvbiBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXREZXNjcmlwdGlvblRhZ05hbWUoIHRhZ05hbWU6IHN0cmluZyB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0YWdOYW1lID09PSBudWxsIHx8IHR5cGVvZiB0YWdOYW1lID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgIGlmICggdGFnTmFtZSAhPT0gdGhpcy5fZGVzY3JpcHRpb25UYWdOYW1lICkge1xyXG5cclxuICAgICAgdGhpcy5fZGVzY3JpcHRpb25UYWdOYW1lID0gdGFnTmFtZTtcclxuXHJcbiAgICAgIHRoaXMub25QRE9NQ29udGVudENoYW5nZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBkZXNjcmlwdGlvblRhZ05hbWUoIHRhZ05hbWU6IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0RGVzY3JpcHRpb25UYWdOYW1lKCB0YWdOYW1lICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBkZXNjcmlwdGlvblRhZ05hbWUoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldERlc2NyaXB0aW9uVGFnTmFtZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgSFRNTCB0YWcgbmFtZSBmb3IgdGhlIGRlc2NyaXB0aW9uIHNpYmxpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERlc2NyaXB0aW9uVGFnTmFtZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvblRhZ05hbWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB0eXBlIGZvciBhbiBpbnB1dCBlbGVtZW50LiAgRWxlbWVudCBtdXN0IGhhdmUgdGhlIElOUFVUIHRhZyBuYW1lLiBUaGUgaW5wdXQgYXR0cmlidXRlIGlzIG5vdFxyXG4gICAqIHNwZWNpZmllZCBhcyByZWFkb25seSwgc28gaW52YWxpZGF0aW5nIHBkb20gY29udGVudCBpcyBub3QgbmVjZXNzYXJ5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbnB1dFR5cGUoIGlucHV0VHlwZTogc3RyaW5nIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlucHV0VHlwZSA9PT0gbnVsbCB8fCB0eXBlb2YgaW5wdXRUeXBlID09PSAnc3RyaW5nJyApO1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMudGFnTmFtZSAmJiBhc3NlcnQoIHRoaXMuX3RhZ05hbWUhLnRvVXBwZXJDYXNlKCkgPT09IElOUFVUX1RBRywgJ3RhZyBuYW1lIG11c3QgYmUgSU5QVVQgdG8gc3VwcG9ydCBpbnB1dFR5cGUnICk7XHJcblxyXG4gICAgaWYgKCBpbnB1dFR5cGUgIT09IHRoaXMuX2lucHV0VHlwZSApIHtcclxuXHJcbiAgICAgIHRoaXMuX2lucHV0VHlwZSA9IGlucHV0VHlwZTtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb25zdCBwZWVyID0gdGhpcy5fcGRvbUluc3RhbmNlc1sgaSBdLnBlZXIhO1xyXG5cclxuICAgICAgICAvLyByZW1vdmUgdGhlIGF0dHJpYnV0ZSBpZiBjbGVhcmVkIGJ5IHNldHRpbmcgdG8gJ251bGwnXHJcbiAgICAgICAgaWYgKCBpbnB1dFR5cGUgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICBwZWVyLnJlbW92ZUF0dHJpYnV0ZUZyb21FbGVtZW50KCAndHlwZScgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBwZWVyLnNldEF0dHJpYnV0ZVRvRWxlbWVudCggJ3R5cGUnLCBpbnB1dFR5cGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgaW5wdXRUeXBlKCBpbnB1dFR5cGU6IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0SW5wdXRUeXBlKCBpbnB1dFR5cGUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGlucHV0VHlwZSgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0SW5wdXRUeXBlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBpbnB1dCB0eXBlLiBJbnB1dCB0eXBlIGlzIG9ubHkgcmVsZXZhbnQgaWYgdGhpcyBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nIGhhcyB0YWcgbmFtZSBcIklOUFVUXCIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldElucHV0VHlwZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnB1dFR5cGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCeSBkZWZhdWx0IHRoZSBsYWJlbCB3aWxsIGJlIHByZXBlbmRlZCBiZWZvcmUgdGhlIHByaW1hcnkgc2libGluZyBpbiB0aGUgUERPTS4gVGhpc1xyXG4gICAqIG9wdGlvbiBhbGxvd3MgeW91IHRvIGluc3RlYWQgaGF2ZSB0aGUgbGFiZWwgYWRkZWQgYWZ0ZXIgdGhlIHByaW1hcnkgc2libGluZy4gTm90ZTogVGhlIGxhYmVsIHdpbGwgYWx3YXlzXHJcbiAgICogYmUgaW4gZnJvbnQgb2YgdGhlIGRlc2NyaXB0aW9uIHNpYmxpbmcuIElmIHRoaXMgZmxhZyBpcyBzZXQgd2l0aCBgYXBwZW5kRGVzY3JpcHRpb25gLCB0aGUgb3JkZXIgd2lsbCBiZVxyXG4gICAqXHJcbiAgICogPGNvbnRhaW5lcj5cclxuICAgKiAgIDxwcmltYXJ5IHNpYmxpbmcvPlxyXG4gICAqICAgPGxhYmVsIHNpYmxpbmcvPlxyXG4gICAqICAgPGRlc2NyaXB0aW9uIHNpYmxpbmcvPlxyXG4gICAqIDwvY29udGFpbmVyPlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRBcHBlbmRMYWJlbCggYXBwZW5kTGFiZWw6IGJvb2xlYW4gKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hcHBlbmRMYWJlbCAhPT0gYXBwZW5kTGFiZWwgKSB7XHJcbiAgICAgIHRoaXMuX2FwcGVuZExhYmVsID0gYXBwZW5kTGFiZWw7XHJcblxyXG4gICAgICB0aGlzLm9uUERPTUNvbnRlbnRDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYXBwZW5kTGFiZWwoIGFwcGVuZExhYmVsOiBib29sZWFuICkgeyB0aGlzLnNldEFwcGVuZExhYmVsKCBhcHBlbmRMYWJlbCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYXBwZW5kTGFiZWwoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEFwcGVuZExhYmVsKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHdoZXRoZXIgdGhlIGxhYmVsIHNpYmxpbmcgc2hvdWxkIGJlIGFwcGVuZGVkIGFmdGVyIHRoZSBwcmltYXJ5IHNpYmxpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFwcGVuZExhYmVsKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FwcGVuZExhYmVsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnkgZGVmYXVsdCB0aGUgbGFiZWwgd2lsbCBiZSBwcmVwZW5kZWQgYmVmb3JlIHRoZSBwcmltYXJ5IHNpYmxpbmcgaW4gdGhlIFBET00uIFRoaXNcclxuICAgKiBvcHRpb24gYWxsb3dzIHlvdSB0byBpbnN0ZWFkIGhhdmUgdGhlIGxhYmVsIGFkZGVkIGFmdGVyIHRoZSBwcmltYXJ5IHNpYmxpbmcuIE5vdGU6IFRoZSBsYWJlbCB3aWxsIGFsd2F5c1xyXG4gICAqIGJlIGluIGZyb250IG9mIHRoZSBkZXNjcmlwdGlvbiBzaWJsaW5nLiBJZiB0aGlzIGZsYWcgaXMgc2V0IHdpdGggYGFwcGVuZExhYmVsYCwgdGhlIG9yZGVyIHdpbGwgYmVcclxuICAgKlxyXG4gICAqIDxjb250YWluZXI+XHJcbiAgICogICA8cHJpbWFyeSBzaWJsaW5nLz5cclxuICAgKiAgIDxsYWJlbCBzaWJsaW5nLz5cclxuICAgKiAgIDxkZXNjcmlwdGlvbiBzaWJsaW5nLz5cclxuICAgKiA8L2NvbnRhaW5lcj5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QXBwZW5kRGVzY3JpcHRpb24oIGFwcGVuZERlc2NyaXB0aW9uOiBib29sZWFuICk6IHZvaWQge1xyXG5cclxuICAgIGlmICggdGhpcy5fYXBwZW5kRGVzY3JpcHRpb24gIT09IGFwcGVuZERlc2NyaXB0aW9uICkge1xyXG4gICAgICB0aGlzLl9hcHBlbmREZXNjcmlwdGlvbiA9IGFwcGVuZERlc2NyaXB0aW9uO1xyXG5cclxuICAgICAgdGhpcy5vblBET01Db250ZW50Q2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFwcGVuZERlc2NyaXB0aW9uKCBhcHBlbmREZXNjcmlwdGlvbjogYm9vbGVhbiApIHsgdGhpcy5zZXRBcHBlbmREZXNjcmlwdGlvbiggYXBwZW5kRGVzY3JpcHRpb24gKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFwcGVuZERlc2NyaXB0aW9uKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXRBcHBlbmREZXNjcmlwdGlvbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB3aGV0aGVyIHRoZSBkZXNjcmlwdGlvbiBzaWJsaW5nIHNob3VsZCBiZSBhcHBlbmRlZCBhZnRlciB0aGUgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcHBlbmREZXNjcmlwdGlvbigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9hcHBlbmREZXNjcmlwdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29udGFpbmVyIHBhcmVudCB0YWcgbmFtZS4gQnkgc3BlY2lmeWluZyB0aGlzIGNvbnRhaW5lciBwYXJlbnQsIGFuIGVsZW1lbnQgd2lsbCBiZSBjcmVhdGVkIHRoYXRcclxuICAgKiBhY3RzIGFzIGEgY29udGFpbmVyIGZvciB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcgRE9NIEVsZW1lbnQgYW5kIGl0cyBsYWJlbCBhbmQgZGVzY3JpcHRpb24gc2libGluZ3MuXHJcbiAgICogVGhpcyBjb250YWluZXJUYWdOYW1lIHdpbGwgZGVmYXVsdCB0byBERUZBVUxUX0xBQkVMX1RBR19OQU1FLCBhbmQgYmUgYWRkZWQgdG8gdGhlIFBET00gYXV0b21hdGljYWxseSBpZlxyXG4gICAqIG1vcmUgdGhhbiBqdXN0IHRoZSBwcmltYXJ5IHNpYmxpbmcgaXMgY3JlYXRlZC5cclxuICAgKlxyXG4gICAqIEZvciBpbnN0YW5jZSwgYSBidXR0b24gZWxlbWVudCB3aXRoIGEgbGFiZWwgYW5kIGRlc2NyaXB0aW9uIHdpbGwgYmUgY29udGFpbmVkIGxpa2UgdGhlIGZvbGxvd2luZ1xyXG4gICAqIGlmIHRoZSBjb250YWluZXJUYWdOYW1lIGlzIHNwZWNpZmllZCBhcyAnc2VjdGlvbicuXHJcbiAgICpcclxuICAgKiA8c2VjdGlvbiBpZD0ncGFyZW50LWNvbnRhaW5lci10cmFpbC1pZCc+XHJcbiAgICogICA8YnV0dG9uPlByZXNzIG1lITwvYnV0dG9uPlxyXG4gICAqICAgPHA+QnV0dG9uIGxhYmVsPC9wPlxyXG4gICAqICAgPHA+QnV0dG9uIGRlc2NyaXB0aW9uPC9wPlxyXG4gICAqIDwvc2VjdGlvbj5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q29udGFpbmVyVGFnTmFtZSggdGFnTmFtZTogc3RyaW5nIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRhZ05hbWUgPT09IG51bGwgfHwgdHlwZW9mIHRhZ05hbWUgPT09ICdzdHJpbmcnLCBgaW52YWxpZCB0YWdOYW1lIGFyZ3VtZW50OiAke3RhZ05hbWV9YCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fY29udGFpbmVyVGFnTmFtZSAhPT0gdGFnTmFtZSApIHtcclxuICAgICAgdGhpcy5fY29udGFpbmVyVGFnTmFtZSA9IHRhZ05hbWU7XHJcbiAgICAgIHRoaXMub25QRE9NQ29udGVudENoYW5nZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBjb250YWluZXJUYWdOYW1lKCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsICkgeyB0aGlzLnNldENvbnRhaW5lclRhZ05hbWUoIHRhZ05hbWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNvbnRhaW5lclRhZ05hbWUoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldENvbnRhaW5lclRhZ05hbWUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHRhZyBuYW1lIGZvciB0aGUgY29udGFpbmVyIHBhcmVudCBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb250YWluZXJUYWdOYW1lKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lclRhZ05hbWU7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGludmFsaWRhdGVQZWVyTGFiZWxTaWJsaW5nQ29udGVudCgpOiB2b2lkIHtcclxuICAgIGNvbnN0IGxhYmVsQ29udGVudCA9IHRoaXMubGFiZWxDb250ZW50O1xyXG5cclxuICAgIC8vIGlmIHRyeWluZyB0byBzZXQgbGFiZWxDb250ZW50LCBtYWtlIHN1cmUgdGhhdCB0aGVyZSBpcyBhIGxhYmVsVGFnTmFtZSBkZWZhdWx0XHJcbiAgICBpZiAoICF0aGlzLl9sYWJlbFRhZ05hbWUgKSB7XHJcbiAgICAgIHRoaXMuc2V0TGFiZWxUYWdOYW1lKCBERUZBVUxUX0xBQkVMX1RBR19OQU1FICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGVlciA9IHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyITtcclxuICAgICAgcGVlci5zZXRMYWJlbFNpYmxpbmdDb250ZW50KCBsYWJlbENvbnRlbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY29udGVudCBvZiB0aGUgbGFiZWwgc2libGluZyBmb3IgdGhlIHRoaXMgbm9kZS4gIFRoZSBsYWJlbCBzaWJsaW5nIHdpbGwgZGVmYXVsdCB0byB0aGUgdmFsdWUgb2ZcclxuICAgKiBERUZBVUxUX0xBQkVMX1RBR19OQU1FIGlmIG5vIGBsYWJlbFRhZ05hbWVgIGlzIHByb3ZpZGVkLiBJZiB0aGUgbGFiZWwgc2libGluZyBpcyBhIGBMQUJFTGAgaHRtbCBlbGVtZW50LFxyXG4gICAqIHRoZW4gdGhlIGBmb3JgIGF0dHJpYnV0ZSB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgYWRkZWQsIHBvaW50aW5nIHRvIHRoZSBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2Qgc3VwcG9ydHMgYWRkaW5nIGNvbnRlbnQgaW4gdHdvIHdheXMsIHdpdGggSFRNTEVsZW1lbnQudGV4dENvbnRlbnQgYW5kIEhUTUxFbGVtZW50LmlubmVySFRNTC5cclxuICAgKiBUaGUgRE9NIHNldHRlciBpcyBjaG9zZW4gYmFzZWQgb24gaWYgdGhlIGxhYmVsIHBhc3NlcyB0aGUgYGNvbnRhaW5zRm9ybWF0dGluZ1RhZ3NgLlxyXG4gICAqXHJcbiAgICogUGFzc2luZyBhIG51bGwgbGFiZWwgdmFsdWUgd2lsbCBub3QgY2xlYXIgdGhlIHdob2xlIGxhYmVsIHNpYmxpbmcsIGp1c3QgdGhlIGlubmVyIGNvbnRlbnQgb2YgdGhlIERPTSBFbGVtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMYWJlbENvbnRlbnQoIGxhYmVsQ29udGVudDogUERPTVZhbHVlVHlwZSB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIGxhYmVsQ29udGVudCAhPT0gdGhpcy5fbGFiZWxDb250ZW50ICkge1xyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2xhYmVsQ29udGVudCApICYmICF0aGlzLl9sYWJlbENvbnRlbnQuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICB0aGlzLl9sYWJlbENvbnRlbnQudW5saW5rKCB0aGlzLl9vbkxhYmVsQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2xhYmVsQ29udGVudCA9IGxhYmVsQ29udGVudDtcclxuXHJcbiAgICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggbGFiZWxDb250ZW50ICkgKSB7XHJcbiAgICAgICAgbGFiZWxDb250ZW50LmxhenlMaW5rKCB0aGlzLl9vbkxhYmVsQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVBlZXJMYWJlbFNpYmxpbmdDb250ZW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGxhYmVsQ29udGVudCggbGFiZWw6IFBET01WYWx1ZVR5cGUgfCBudWxsICkgeyB0aGlzLnNldExhYmVsQ29udGVudCggbGFiZWwgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxhYmVsQ29udGVudCgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0TGFiZWxDb250ZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBjb250ZW50IGZvciB0aGlzIE5vZGUncyBsYWJlbCBzaWJsaW5nIERPTSBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMYWJlbENvbnRlbnQoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdW53cmFwUHJvcGVydHkoIHRoaXMuX2xhYmVsQ29udGVudCApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvbklubmVyQ29udGVudFByb3BlcnR5Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmlubmVyQ29udGVudDtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwZWVyID0gdGhpcy5fcGRvbUluc3RhbmNlc1sgaSBdLnBlZXIhO1xyXG4gICAgICBwZWVyLnNldFByaW1hcnlTaWJsaW5nQ29udGVudCggdmFsdWUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgaW5uZXIgY29udGVudCBmb3IgdGhlIHByaW1hcnkgc2libGluZyBvZiB0aGUgUERPTVBlZXJzIG9mIHRoaXMgTm9kZS4gV2lsbCBiZSBzZXQgYXMgdGV4dENvbnRlbnRcclxuICAgKiB1bmxlc3MgY29udGVudCBpcyBodG1sIHdoaWNoIHVzZXMgZXhjbHVzaXZlbHkgZm9ybWF0dGluZyB0YWdzLiBBIG5vZGUgd2l0aCBpbm5lciBjb250ZW50IGNhbm5vdFxyXG4gICAqIGhhdmUgYWNjZXNzaWJsZSBkZXNjZW5kYW50cyBiZWNhdXNlIHRoaXMgY29udGVudCB3aWxsIG92ZXJyaWRlIHRoZSBIVE1MIG9mIGRlc2NlbmRhbnRzIG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0SW5uZXJDb250ZW50KCBpbm5lckNvbnRlbnQ6IFBET01WYWx1ZVR5cGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCBpbm5lckNvbnRlbnQgIT09IHRoaXMuX2lubmVyQ29udGVudCApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9pbm5lckNvbnRlbnQgKSAmJiAhdGhpcy5faW5uZXJDb250ZW50LmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgICAgdGhpcy5faW5uZXJDb250ZW50LnVubGluayggdGhpcy5fb25Jbm5lckNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9pbm5lckNvbnRlbnQgPSBpbm5lckNvbnRlbnQ7XHJcblxyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGlubmVyQ29udGVudCApICkge1xyXG4gICAgICAgIGlubmVyQ29udGVudC5sYXp5TGluayggdGhpcy5fb25Jbm5lckNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLm9uSW5uZXJDb250ZW50UHJvcGVydHlDaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgaW5uZXJDb250ZW50KCBjb250ZW50OiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApIHsgdGhpcy5zZXRJbm5lckNvbnRlbnQoIGNvbnRlbnQgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGlubmVyQ29udGVudCgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0SW5uZXJDb250ZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBpbm5lciBjb250ZW50LCB0aGUgc3RyaW5nIHRoYXQgaXMgdGhlIGlubmVySFRNTCBvciBpbm5lclRleHQgZm9yIHRoZSBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRJbm5lckNvbnRlbnQoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdW53cmFwUHJvcGVydHkoIHRoaXMuX2lubmVyQ29udGVudCApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpbnZhbGlkYXRlUGVlckRlc2NyaXB0aW9uU2libGluZ0NvbnRlbnQoKTogdm9pZCB7XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbkNvbnRlbnQgPSB0aGlzLmRlc2NyaXB0aW9uQ29udGVudDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSBpcyBubyBkZXNjcmlwdGlvbiBlbGVtZW50LCBhc3N1bWUgdGhhdCBhIHBhcmFncmFwaCBlbGVtZW50IHNob3VsZCBiZSB1c2VkXHJcbiAgICBpZiAoICF0aGlzLl9kZXNjcmlwdGlvblRhZ05hbWUgKSB7XHJcbiAgICAgIHRoaXMuc2V0RGVzY3JpcHRpb25UYWdOYW1lKCBERUZBVUxUX0RFU0NSSVBUSU9OX1RBR19OQU1FICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGVlciA9IHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyITtcclxuICAgICAgcGVlci5zZXREZXNjcmlwdGlvblNpYmxpbmdDb250ZW50KCBkZXNjcmlwdGlvbkNvbnRlbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgZGVzY3JpcHRpb24gY29udGVudCBmb3IgdGhpcyBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLiBUaGUgZGVzY3JpcHRpb24gc2libGluZyB0YWcgbmFtZSBtdXN0IHN1cHBvcnRcclxuICAgKiBpbm5lckhUTUwgYW5kIHRleHRDb250ZW50LiBJZiBhIGRlc2NyaXB0aW9uIGVsZW1lbnQgZG9lcyBub3QgZXhpc3QgeWV0LCBhIGRlZmF1bHRcclxuICAgKiBERUZBVUxUX0xBQkVMX1RBR19OQU1FIHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGRlc2NyaXB0aW9uVGFnTmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0RGVzY3JpcHRpb25Db250ZW50KCBkZXNjcmlwdGlvbkNvbnRlbnQ6IFBET01WYWx1ZVR5cGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCBkZXNjcmlwdGlvbkNvbnRlbnQgIT09IHRoaXMuX2Rlc2NyaXB0aW9uQ29udGVudCApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9kZXNjcmlwdGlvbkNvbnRlbnQgKSAmJiAhdGhpcy5fZGVzY3JpcHRpb25Db250ZW50LmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgICAgdGhpcy5fZGVzY3JpcHRpb25Db250ZW50LnVubGluayggdGhpcy5fb25EZXNjcmlwdGlvbkNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9kZXNjcmlwdGlvbkNvbnRlbnQgPSBkZXNjcmlwdGlvbkNvbnRlbnQ7XHJcblxyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGRlc2NyaXB0aW9uQ29udGVudCApICkge1xyXG4gICAgICAgIGRlc2NyaXB0aW9uQ29udGVudC5sYXp5TGluayggdGhpcy5fb25EZXNjcmlwdGlvbkNvbnRlbnRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVQZWVyRGVzY3JpcHRpb25TaWJsaW5nQ29udGVudCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBkZXNjcmlwdGlvbkNvbnRlbnQoIHRleHRDb250ZW50OiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApIHsgdGhpcy5zZXREZXNjcmlwdGlvbkNvbnRlbnQoIHRleHRDb250ZW50ICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBkZXNjcmlwdGlvbkNvbnRlbnQoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldERlc2NyaXB0aW9uQ29udGVudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgY29udGVudCBmb3IgdGhpcyBOb2RlJ3MgZGVzY3JpcHRpb24gc2libGluZyBET00gRWxlbWVudC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RGVzY3JpcHRpb25Db250ZW50KCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHVud3JhcFByb3BlcnR5KCB0aGlzLl9kZXNjcmlwdGlvbkNvbnRlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgQVJJQSByb2xlIGZvciB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcuIEFjY29yZGluZyB0byB0aGUgVzNDLCB0aGUgQVJJQSByb2xlIGlzIHJlYWQtb25seSBmb3IgYSBET01cclxuICAgKiBlbGVtZW50LiAgU28gdGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBET00gZWxlbWVudCBmb3IgdGhpcyBOb2RlIHdpdGggdGhlIGRlc2lyZWQgcm9sZSwgYW5kIHJlcGxhY2UgdGhlIG9sZFxyXG4gICAqIGVsZW1lbnQgaW4gdGhlIERPTS4gTm90ZSB0aGF0IHRoZSBhcmlhIHJvbGUgY2FuIGNvbXBsZXRlbHkgY2hhbmdlIHRoZSBldmVudHMgdGhhdCBmaXJlIGZyb20gYW4gZWxlbWVudCxcclxuICAgKiBlc3BlY2lhbGx5IHdoZW4gdXNpbmcgYSBzY3JlZW4gcmVhZGVyLiBGb3IgZXhhbXBsZSwgYSByb2xlIG9mIGBhcHBsaWNhdGlvbmAgd2lsbCBsYXJnZWx5IGJ5cGFzcyB0aGUgZGVmYXVsdFxyXG4gICAqIGJlaGF2aW9yIGFuZCBsb2dpYyBvZiB0aGUgc2NyZWVuIHJlYWRlciwgdHJpZ2dlcmluZyBrZXlkb3duL2tleXVwIGV2ZW50cyBldmVuIGZvciBidXR0b25zIHRoYXQgd291bGQgdXN1YWxseVxyXG4gICAqIG9ubHkgcmVjZWl2ZSBhIFwiY2xpY2tcIiBldmVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhcmlhUm9sZSAtIHJvbGUgZm9yIHRoZSBlbGVtZW50LCBzZWVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbC1hcmlhLyNhbGxvd2VkLWFyaWEtcm9sZXMtc3RhdGVzLWFuZC1wcm9wZXJ0aWVzXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGEgbGlzdCBvZiByb2xlcywgc3RhdGVzLCBhbmQgcHJvcGVydGllcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QXJpYVJvbGUoIGFyaWFSb2xlOiBzdHJpbmcgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYXJpYVJvbGUgPT09IG51bGwgfHwgdHlwZW9mIGFyaWFSb2xlID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fYXJpYVJvbGUgIT09IGFyaWFSb2xlICkge1xyXG5cclxuICAgICAgdGhpcy5fYXJpYVJvbGUgPSBhcmlhUm9sZTtcclxuXHJcbiAgICAgIGlmICggYXJpYVJvbGUgIT09IG51bGwgKSB7XHJcbiAgICAgICAgdGhpcy5zZXRQRE9NQXR0cmlidXRlKCAncm9sZScsIGFyaWFSb2xlICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVQRE9NQXR0cmlidXRlKCAncm9sZScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBhcmlhUm9sZSggYXJpYVJvbGU6IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0QXJpYVJvbGUoIGFyaWFSb2xlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBhcmlhUm9sZSgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0QXJpYVJvbGUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIEFSSUEgcm9sZSByZXByZXNlbnRpbmcgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmlhUm9sZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9hcmlhUm9sZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgQVJJQSByb2xlIGZvciB0aGlzIG5vZGUncyBjb250YWluZXIgcGFyZW50IGVsZW1lbnQuICBBY2NvcmRpbmcgdG8gdGhlIFczQywgdGhlIEFSSUEgcm9sZSBpcyByZWFkLW9ubHlcclxuICAgKiBmb3IgYSBET00gZWxlbWVudC4gVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBET00gZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBwYXJlbnQgd2l0aCB0aGUgZGVzaXJlZCByb2xlLCBhbmRcclxuICAgKiByZXBsYWNlIGl0IGluIHRoZSBET00uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYXJpYVJvbGUgLSByb2xlIGZvciB0aGUgZWxlbWVudCwgc2VlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWwtYXJpYS8jYWxsb3dlZC1hcmlhLXJvbGVzLXN0YXRlcy1hbmQtcHJvcGVydGllc1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhIGxpc3Qgb2Ygcm9sZXMsIHN0YXRlcywgYW5kIHByb3BlcnRpZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENvbnRhaW5lckFyaWFSb2xlKCBhcmlhUm9sZTogc3RyaW5nIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyaWFSb2xlID09PSBudWxsIHx8IHR5cGVvZiBhcmlhUm9sZSA9PT0gJ3N0cmluZycgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2NvbnRhaW5lckFyaWFSb2xlICE9PSBhcmlhUm9sZSApIHtcclxuXHJcbiAgICAgIHRoaXMuX2NvbnRhaW5lckFyaWFSb2xlID0gYXJpYVJvbGU7XHJcblxyXG4gICAgICAvLyBjbGVhciBvdXQgdGhlIGF0dHJpYnV0ZVxyXG4gICAgICBpZiAoIGFyaWFSb2xlID09PSBudWxsICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ3JvbGUnLCB7XHJcbiAgICAgICAgICBlbGVtZW50TmFtZTogUERPTVBlZXIuQ09OVEFJTkVSX1BBUkVOVFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYWRkIHRoZSBhdHRyaWJ1dGVcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRQRE9NQXR0cmlidXRlKCAncm9sZScsIGFyaWFSb2xlLCB7XHJcbiAgICAgICAgICBlbGVtZW50TmFtZTogUERPTVBlZXIuQ09OVEFJTkVSX1BBUkVOVFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBjb250YWluZXJBcmlhUm9sZSggYXJpYVJvbGU6IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0Q29udGFpbmVyQXJpYVJvbGUoIGFyaWFSb2xlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjb250YWluZXJBcmlhUm9sZSgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0Q29udGFpbmVyQXJpYVJvbGUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIEFSSUEgcm9sZSBhc3NpZ25lZCB0byB0aGUgY29udGFpbmVyIHBhcmVudCBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb250YWluZXJBcmlhUm9sZSgpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9jb250YWluZXJBcmlhUm9sZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25BcmlhVmFsdWVUZXh0Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgY29uc3QgYXJpYVZhbHVlVGV4dCA9IHRoaXMuYXJpYVZhbHVlVGV4dDtcclxuXHJcbiAgICBpZiAoIGFyaWFWYWx1ZVRleHQgPT09IG51bGwgKSB7XHJcbiAgICAgIGlmICggdGhpcy5faGFzQXBwbGllZEFyaWFMYWJlbCApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZVBET01BdHRyaWJ1dGUoICdhcmlhLXZhbHVldGV4dCcgKTtcclxuICAgICAgICB0aGlzLl9oYXNBcHBsaWVkQXJpYUxhYmVsID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLnNldFBET01BdHRyaWJ1dGUoICdhcmlhLXZhbHVldGV4dCcsIGFyaWFWYWx1ZVRleHQgKTtcclxuICAgICAgdGhpcy5faGFzQXBwbGllZEFyaWFMYWJlbCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGFyaWEtdmFsdWV0ZXh0IG9mIHRoaXMgTm9kZSBpbmRlcGVuZGVudGx5IGZyb20gdGhlIGNoYW5naW5nIHZhbHVlLCBpZiBuZWNlc3NhcnkuIFNldHRpbmcgdG8gbnVsbCB3aWxsXHJcbiAgICogY2xlYXIgdGhpcyBhdHRyaWJ1dGUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEFyaWFWYWx1ZVRleHQoIGFyaWFWYWx1ZVRleHQ6IFBET01WYWx1ZVR5cGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl9hcmlhVmFsdWVUZXh0ICE9PSBhcmlhVmFsdWVUZXh0ICkge1xyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2FyaWFWYWx1ZVRleHQgKSAmJiAhdGhpcy5fYXJpYVZhbHVlVGV4dC5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICAgIHRoaXMuX2FyaWFWYWx1ZVRleHQudW5saW5rKCB0aGlzLl9vbkFyaWFWYWx1ZVRleHRDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9hcmlhVmFsdWVUZXh0ID0gYXJpYVZhbHVlVGV4dDtcclxuXHJcbiAgICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggYXJpYVZhbHVlVGV4dCApICkge1xyXG4gICAgICAgIGFyaWFWYWx1ZVRleHQubGF6eUxpbmsoIHRoaXMuX29uQXJpYVZhbHVlVGV4dENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMub25BcmlhVmFsdWVUZXh0Q2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFyaWFWYWx1ZVRleHQoIGFyaWFWYWx1ZVRleHQ6IFBET01WYWx1ZVR5cGUgfCBudWxsICkgeyB0aGlzLnNldEFyaWFWYWx1ZVRleHQoIGFyaWFWYWx1ZVRleHQgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFyaWFWYWx1ZVRleHQoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldEFyaWFWYWx1ZVRleHQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBhcmlhLXZhbHVldGV4dCBhdHRyaWJ1dGUgZm9yIHRoaXMgTm9kZSdzIHByaW1hcnkgc2libGluZy4gSWYgbnVsbCwgdGhlbiB0aGUgYXR0cmlidXRlXHJcbiAgICogaGFzIG5vdCBiZWVuIHNldCBvbiB0aGUgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmlhVmFsdWVUZXh0KCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHVud3JhcFByb3BlcnR5KCB0aGlzLl9hcmlhVmFsdWVUZXh0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBuYW1lc3BhY2UgZm9yIHRoZSBwcmltYXJ5IGVsZW1lbnQgKHJlbGV2YW50IGZvciBNYXRoTUwvU1ZHL2V0Yy4pXHJcbiAgICpcclxuICAgKiBGb3IgZXhhbXBsZSwgdG8gY3JlYXRlIGEgTWF0aE1MIGVsZW1lbnQ6XHJcbiAgICogeyB0YWdOYW1lOiAnbWF0aCcsIHBkb21OYW1lc3BhY2U6ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MJyB9XHJcbiAgICpcclxuICAgKiBvciBmb3IgU1ZHOlxyXG4gICAqIHsgdGFnTmFtZTogJ3N2ZycsIHBkb21OYW1lc3BhY2U6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBkb21OYW1lc3BhY2UgLSBOdWxsIGluZGljYXRlcyBubyBuYW1lc3BhY2UuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBET01OYW1lc3BhY2UoIHBkb21OYW1lc3BhY2U6IHN0cmluZyB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwZG9tTmFtZXNwYWNlID09PSBudWxsIHx8IHR5cGVvZiBwZG9tTmFtZXNwYWNlID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fcGRvbU5hbWVzcGFjZSAhPT0gcGRvbU5hbWVzcGFjZSApIHtcclxuICAgICAgdGhpcy5fcGRvbU5hbWVzcGFjZSA9IHBkb21OYW1lc3BhY2U7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgbmFtZXNwYWNlIGNoYW5nZXMsIHRlYXIgZG93biB0aGUgdmlldyBhbmQgcmVkcmF3IHRoZSB3aG9sZSB0aGluZywgdGhlcmUgaXMgbm8gZWFzeSBtdXRhYmxlIHNvbHV0aW9uIGhlcmUuXHJcbiAgICAgIHRoaXMub25QRE9NQ29udGVudENoYW5nZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBwZG9tTmFtZXNwYWNlKCB2YWx1ZTogc3RyaW5nIHwgbnVsbCApIHsgdGhpcy5zZXRQRE9NTmFtZXNwYWNlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGRvbU5hbWVzcGFjZSgpOiBzdHJpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0UERPTU5hbWVzcGFjZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFjY2Vzc2libGUgbmFtZXNwYWNlIChzZWUgc2V0UERPTU5hbWVzcGFjZSBmb3IgbW9yZSBpbmZvcm1hdGlvbikuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBET01OYW1lc3BhY2UoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGRvbU5hbWVzcGFjZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25BcmlhTGFiZWxDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBjb25zdCBhcmlhTGFiZWwgPSB0aGlzLmFyaWFMYWJlbDtcclxuXHJcbiAgICBpZiAoIGFyaWFMYWJlbCA9PT0gbnVsbCApIHtcclxuICAgICAgaWYgKCB0aGlzLl9oYXNBcHBsaWVkQXJpYUxhYmVsICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlUERPTUF0dHJpYnV0ZSggJ2FyaWEtbGFiZWwnICk7XHJcbiAgICAgICAgdGhpcy5faGFzQXBwbGllZEFyaWFMYWJlbCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5zZXRQRE9NQXR0cmlidXRlKCAnYXJpYS1sYWJlbCcsIGFyaWFMYWJlbCApO1xyXG4gICAgICB0aGlzLl9oYXNBcHBsaWVkQXJpYUxhYmVsID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlICdhcmlhLWxhYmVsJyBhdHRyaWJ1dGUgZm9yIGxhYmVsbGluZyB0aGUgTm9kZSdzIHByaW1hcnkgc2libGluZy4gQnkgdXNpbmcgdGhlXHJcbiAgICogJ2FyaWEtbGFiZWwnIGF0dHJpYnV0ZSwgdGhlIGxhYmVsIHdpbGwgYmUgcmVhZCBvbiBmb2N1cywgYnV0IGNhbiBub3QgYmUgZm91bmQgd2l0aCB0aGVcclxuICAgKiB2aXJ0dWFsIGN1cnNvci4gVGhpcyBpcyBvbmUgd2F5IHRvIHNldCBhIERPTSBFbGVtZW50J3MgQWNjZXNzaWJsZSBOYW1lLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFyaWFMYWJlbCAtIHRoZSB0ZXh0IGZvciB0aGUgYXJpYSBsYWJlbCBhdHRyaWJ1dGVcclxuICAgKi9cclxuICBwdWJsaWMgc2V0QXJpYUxhYmVsKCBhcmlhTGFiZWw6IFBET01WYWx1ZVR5cGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl9hcmlhTGFiZWwgIT09IGFyaWFMYWJlbCApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9hcmlhTGFiZWwgKSAmJiAhdGhpcy5fYXJpYUxhYmVsLmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgICAgdGhpcy5fYXJpYUxhYmVsLnVubGluayggdGhpcy5fb25BcmlhTGFiZWxDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9hcmlhTGFiZWwgPSBhcmlhTGFiZWw7XHJcblxyXG4gICAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGFyaWFMYWJlbCApICkge1xyXG4gICAgICAgIGFyaWFMYWJlbC5sYXp5TGluayggdGhpcy5fb25BcmlhTGFiZWxDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLm9uQXJpYUxhYmVsQ2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFyaWFMYWJlbCggYXJpYUxhYmVsOiBQRE9NVmFsdWVUeXBlIHwgbnVsbCApIHsgdGhpcy5zZXRBcmlhTGFiZWwoIGFyaWFMYWJlbCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYXJpYUxhYmVsKCk6IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRBcmlhTGFiZWwoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBhcmlhLWxhYmVsIGF0dHJpYnV0ZSBmb3IgdGhpcyBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmlhTGFiZWwoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdW53cmFwUHJvcGVydHkoIHRoaXMuX2FyaWFMYWJlbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBmb2N1cyBoaWdobGlnaHQgZm9yIHRoaXMgbm9kZS4gQnkgZGVmYXVsdCwgdGhlIGZvY3VzIGhpZ2hsaWdodCB3aWxsIGJlIGEgcGluayByZWN0YW5nbGUgdGhhdFxyXG4gICAqIHN1cnJvdW5kcyB0aGUgbm9kZSdzIGxvY2FsIGJvdW5kcy4gIElmIGZvY3VzIGhpZ2hsaWdodCBpcyBzZXQgdG8gJ2ludmlzaWJsZScsIHRoZSBub2RlIHdpbGwgbm90IGhhdmVcclxuICAgKiBhbnkgaGlnaGxpZ2h0aW5nIHdoZW4gaXQgcmVjZWl2ZXMgZm9jdXMuXHJcbiAgICpcclxuICAgKiBVc2UgdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgd2hlbiBkcmF3aW5nIGEgY3VzdG9tIGhpZ2hsaWdodCBmb3IgdGhpcyBOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRGb2N1c0hpZ2hsaWdodCggZm9jdXNIaWdobGlnaHQ6IEhpZ2hsaWdodCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5fZm9jdXNIaWdobGlnaHQgIT09IGZvY3VzSGlnaGxpZ2h0ICkge1xyXG4gICAgICB0aGlzLl9mb2N1c0hpZ2hsaWdodCA9IGZvY3VzSGlnaGxpZ2h0O1xyXG5cclxuICAgICAgLy8gaWYgdGhlIGZvY3VzIGhpZ2hsaWdodCBpcyBsYXllcmFibGUgaW4gdGhlIHNjZW5lIGdyYXBoLCB1cGRhdGUgdmlzaWJpbGl0eSBzbyB0aGF0IGl0IGlzIG9ubHlcclxuICAgICAgLy8gdmlzaWJsZSB3aGVuIGFzc29jaWF0ZWQgbm9kZSBoYXMgZm9jdXNcclxuICAgICAgaWYgKCB0aGlzLl9mb2N1c0hpZ2hsaWdodExheWVyYWJsZSApIHtcclxuXHJcbiAgICAgICAgLy8gaWYgZm9jdXMgaGlnaGxpZ2h0IGlzIGxheWVyYWJsZSwgaXQgbXVzdCBiZSBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZm9jdXNIaWdobGlnaHQgaW5zdGFuY2VvZiBOb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2ltcGxlLXR5cGUtY2hlY2tpbmctYXNzZXJ0aW9uc1xyXG5cclxuICAgICAgICAvLyB0aGUgaGlnaGxpZ2h0IHN0YXJ0cyBvZmYgaW52aXNpYmxlLCBIaWdobGlnaHRPdmVybGF5IHdpbGwgbWFrZSBpdCB2aXNpYmxlIHdoZW4gdGhpcyBOb2RlIGhhcyBET00gZm9jdXNcclxuICAgICAgICAoIGZvY3VzSGlnaGxpZ2h0IGFzIE5vZGUgKS52aXNpYmxlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZm9jdXNIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGZvY3VzSGlnaGxpZ2h0KCBmb2N1c0hpZ2hsaWdodDogSGlnaGxpZ2h0ICkgeyB0aGlzLnNldEZvY3VzSGlnaGxpZ2h0KCBmb2N1c0hpZ2hsaWdodCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9jdXNIaWdobGlnaHQoKTogSGlnaGxpZ2h0IHsgcmV0dXJuIHRoaXMuZ2V0Rm9jdXNIaWdobGlnaHQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGZvY3VzIGhpZ2hsaWdodCBmb3IgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRGb2N1c0hpZ2hsaWdodCgpOiBIaWdobGlnaHQge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0dGluZyBhIGZsYWcgdG8gYnJlYWsgZGVmYXVsdCBhbmQgYWxsb3cgdGhlIGZvY3VzIGhpZ2hsaWdodCB0byBiZSAoeikgbGF5ZXJlZCBpbnRvIHRoZSBzY2VuZSBncmFwaC5cclxuICAgKiBUaGlzIHdpbGwgc2V0IHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBsYXllcmVkIGZvY3VzIGhpZ2hsaWdodCwgaXQgd2lsbCBhbHdheXMgYmUgaW52aXNpYmxlIHVudGlsIHRoaXMgbm9kZSBoYXNcclxuICAgKiBmb2N1cy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rm9jdXNIaWdobGlnaHRMYXllcmFibGUoIGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG5cclxuICAgIGlmICggdGhpcy5fZm9jdXNIaWdobGlnaHRMYXllcmFibGUgIT09IGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlICkge1xyXG4gICAgICB0aGlzLl9mb2N1c0hpZ2hsaWdodExheWVyYWJsZSA9IGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlO1xyXG5cclxuICAgICAgLy8gaWYgYSBmb2N1cyBoaWdobGlnaHQgaXMgZGVmaW5lZCAoaXQgbXVzdCBiZSBhIG5vZGUpLCB1cGRhdGUgaXRzIHZpc2liaWxpdHkgc28gaXQgaXMgbGlua2VkIHRvIGZvY3VzXHJcbiAgICAgIC8vIG9mIHRoZSBhc3NvY2lhdGVkIG5vZGVcclxuICAgICAgaWYgKCB0aGlzLl9mb2N1c0hpZ2hsaWdodCApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9mb2N1c0hpZ2hsaWdodCBpbnN0YW5jZW9mIE5vZGUgKTtcclxuICAgICAgICAoIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0IGFzIE5vZGUgKS52aXNpYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIGVtaXQgdGhhdCB0aGUgaGlnaGxpZ2h0IGhhcyBjaGFuZ2VkIGFuZCB3ZSBtYXkgbmVlZCB0byB1cGRhdGUgaXRzIHZpc3VhbCByZXByZXNlbnRhdGlvblxyXG4gICAgICAgIHRoaXMuZm9jdXNIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZm9jdXNIaWdobGlnaHRMYXllcmFibGUoIGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlOiBib29sZWFuICkgeyB0aGlzLnNldEZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlKCBmb2N1c0hpZ2hsaWdodExheWVyYWJsZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9jdXNIaWdobGlnaHRMYXllcmFibGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBmbGFnIGZvciBpZiB0aGlzIG5vZGUgaXMgbGF5ZXJhYmxlIGluIHRoZSBzY2VuZSBncmFwaCAob3IgaWYgaXQgaXMgYWx3YXlzIG9uIHRvcCwgbGlrZSB0aGUgZGVmYXVsdCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHdoZXRoZXIgb3Igbm90IHRoaXMgbm9kZSBoYXMgYSBncm91cCBmb2N1cyBoaWdobGlnaHQuIElmIHRoaXMgbm9kZSBoYXMgYSBncm91cCBmb2N1cyBoaWdobGlnaHQsIGFuIGV4dHJhXHJcbiAgICogZm9jdXMgaGlnaGxpZ2h0IHdpbGwgc3Vycm91bmQgdGhpcyBub2RlIHdoZW5ldmVyIGEgZGVzY2VuZGFudCBub2RlIGhhcyBmb2N1cy4gR2VuZXJhbGx5XHJcbiAgICogdXNlZnVsIHRvIGluZGljYXRlIG5lc3RlZCBrZXlib2FyZCBuYXZpZ2F0aW9uLiBJZiB0cnVlLCB0aGUgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0IHdpbGwgc3Vycm91bmRcclxuICAgKiB0aGlzIG5vZGUncyBsb2NhbCBib3VuZHMuIE90aGVyd2lzZSwgdGhlIE5vZGUgd2lsbCBiZSB1c2VkLlxyXG4gICAqXHJcbiAgICogVE9ETzogU3VwcG9ydCBtb3JlIHRoYW4gb25lIGdyb3VwIGZvY3VzIGhpZ2hsaWdodCAobXVsdGlwbGUgYW5jZXN0b3JzIGNvdWxkIGhhdmUgZ3JvdXBGb2N1c0hpZ2hsaWdodCksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTYwOFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRHcm91cEZvY3VzSGlnaGxpZ2h0KCBncm91cEhpZ2hsaWdodDogTm9kZSB8IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB0aGlzLl9ncm91cEZvY3VzSGlnaGxpZ2h0ID0gZ3JvdXBIaWdobGlnaHQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGdyb3VwRm9jdXNIaWdobGlnaHQoIGdyb3VwSGlnaGxpZ2h0OiBOb2RlIHwgYm9vbGVhbiApIHsgdGhpcy5zZXRHcm91cEZvY3VzSGlnaGxpZ2h0KCBncm91cEhpZ2hsaWdodCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZ3JvdXBGb2N1c0hpZ2hsaWdodCgpOiBOb2RlIHwgYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEdyb3VwRm9jdXNIaWdobGlnaHQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgd2hldGhlciBvciBub3QgdGhpcyBub2RlIGhhcyBhICdncm91cCcgZm9jdXMgaGlnaGxpZ2h0LCBzZWUgc2V0dGVyIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRHcm91cEZvY3VzSGlnaGxpZ2h0KCk6IE5vZGUgfCBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9ncm91cEZvY3VzSGlnaGxpZ2h0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVmVyeSBzaW1pbGFyIGFsZ29yaXRobSB0byBzZXRDaGlsZHJlbiBpbiBOb2RlLmpzXHJcbiAgICogQHBhcmFtIGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zIC0gbGlzdCBvZiBhc3NvY2lhdGlvbk9iamVjdHMsIHNlZSB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMoIGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zOiBBc3NvY2lhdGlvbltdICk6IHZvaWQge1xyXG4gICAgbGV0IGFzc29jaWF0aW9uT2JqZWN0O1xyXG4gICAgbGV0IGk7XHJcblxyXG4gICAgLy8gdmFsaWRhdGlvbiBpZiBhc3NlcnQgaXMgZW5hYmxlZFxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMgKSApO1xyXG4gICAgICBmb3IgKCBpID0gMDsgaSA8IGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGFzc29jaWF0aW9uT2JqZWN0ID0gYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnNbIGkgXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG5vIHdvcmsgdG8gYmUgZG9uZSBpZiBib3RoIGFyZSBlbXB0eSwgcmV0dXJuIGVhcmx5XHJcbiAgICBpZiAoIGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zLmxlbmd0aCA9PT0gMCAmJiB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiZWZvcmVPbmx5OiBBc3NvY2lhdGlvbltdID0gW107IC8vIFdpbGwgaG9sZCBhbGwgbm9kZXMgdGhhdCB3aWxsIGJlIHJlbW92ZWQuXHJcbiAgICBjb25zdCBhZnRlck9ubHk6IEFzc29jaWF0aW9uW10gPSBbXTsgLy8gV2lsbCBob2xkIGFsbCBub2RlcyB0aGF0IHdpbGwgYmUgXCJuZXdcIiBjaGlsZHJlbiAoYWRkZWQpXHJcbiAgICBjb25zdCBpbkJvdGg6IEFzc29jaWF0aW9uW10gPSBbXTsgLy8gQ2hpbGQgbm9kZXMgdGhhdCBcInN0YXlcIi4gV2lsbCBiZSBvcmRlcmVkIGZvciB0aGUgXCJhZnRlclwiIGNhc2UuXHJcblxyXG4gICAgLy8gZ2V0IGEgZGlmZmVyZW5jZSBvZiB0aGUgZGVzaXJlZCBuZXcgbGlzdCwgYW5kIHRoZSBvbGRcclxuICAgIGFycmF5RGlmZmVyZW5jZSggYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMsIHRoaXMuX2FyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zLCBhZnRlck9ubHksIGJlZm9yZU9ubHksIGluQm90aCApO1xyXG5cclxuICAgIC8vIHJlbW92ZSBlYWNoIGN1cnJlbnQgYXNzb2NpYXRpb25PYmplY3QgdGhhdCBpc24ndCBpbiB0aGUgbmV3IGxpc3RcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgYmVmb3JlT25seS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgYXNzb2NpYXRpb25PYmplY3QgPSBiZWZvcmVPbmx5WyBpIF07XHJcbiAgICAgIHRoaXMucmVtb3ZlQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiggYXNzb2NpYXRpb25PYmplY3QgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucy5sZW5ndGggPT09IGluQm90aC5sZW5ndGgsXHJcbiAgICAgICdSZW1vdmluZyBhc3NvY2lhdGlvbnMgc2hvdWxkIG5vdCBoYXZlIHRyaWdnZXJlZCBvdGhlciBhc3NvY2lhdGlvbiBjaGFuZ2VzJyApO1xyXG5cclxuICAgIC8vIGFkZCBlYWNoIGFzc29jaWF0aW9uIGZyb20gdGhlIG5ldyBsaXN0IHRoYXQgaGFzbid0IGJlZW4gYWRkZWQgeWV0XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGFmdGVyT25seS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiA9IGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zWyBpIF07XHJcbiAgICAgIHRoaXMuYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiggYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyggYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnM6IEFzc29jaWF0aW9uW10gKSB7IHRoaXMuc2V0QXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMoIGFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucygpOiBBc3NvY2lhdGlvbltdIHsgcmV0dXJuIHRoaXMuZ2V0QXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMoKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0QXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMoKTogQXNzb2NpYXRpb25bXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYW4gYXJpYS1sYWJlbGxlZGJ5IGFzc29jaWF0aW9uIHRvIHRoaXMgbm9kZS4gVGhlIGRhdGEgaW4gdGhlIGFzc29jaWF0aW9uT2JqZWN0IHdpbGwgYmUgaW1wbGVtZW50ZWQgbGlrZVxyXG4gICAqIFwiYSBwZWVyJ3MgSFRNTEVsZW1lbnQgb2YgdGhpcyBOb2RlIChzcGVjaWZpZWQgd2l0aCB0aGUgc3RyaW5nIGNvbnN0YW50IHN0b3JlZCBpbiBgdGhpc0VsZW1lbnROYW1lYCkgd2lsbCBoYXZlIGFuXHJcbiAgICogYXJpYS1sYWJlbGxlZGJ5IGF0dHJpYnV0ZSB3aXRoIGEgdmFsdWUgdGhhdCBpbmNsdWRlcyB0aGUgYG90aGVyTm9kZWAncyBwZWVyIEhUTUxFbGVtZW50J3MgaWQgKHNwZWNpZmllZCB3aXRoXHJcbiAgICogYG90aGVyRWxlbWVudE5hbWVgKS5cIlxyXG4gICAqXHJcbiAgICogVGhlcmUgY2FuIGJlIG1vcmUgdGhhbiBvbmUgYXNzb2NpYXRpb24gYmVjYXVzZSBhbiBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlJ3MgdmFsdWUgY2FuIGJlIGEgc3BhY2Ugc2VwYXJhdGVkXHJcbiAgICogbGlzdCBvZiBIVE1MIGlkcywgYW5kIG5vdCBqdXN0IGEgc2luZ2xlIGlkLCBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1dBSS9HTC93aWtpL1VzaW5nX2FyaWEtbGFiZWxsZWRieV90b19jb25jYXRlbmF0ZV9hX2xhYmVsX2Zyb21fc2V2ZXJhbF90ZXh0X25vZGVzXHJcbiAgICovXHJcbiAgcHVibGljIGFkZEFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24oIGFzc29jaWF0aW9uT2JqZWN0OiBBc3NvY2lhdGlvbiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUT0RPOiBhc3NlcnQgaWYgdGhpcyBhc3NvY2lhdGlvbk9iamVjdCBpcyBhbHJlYWR5IGluIHRoZSBhc3NvY2lhdGlvbiBvYmplY3RzIGxpc3QhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84MzJcclxuXHJcbiAgICB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucy5wdXNoKCBhc3NvY2lhdGlvbk9iamVjdCApOyAvLyBLZWVwIHRyYWNrIG9mIHRoaXMgYXNzb2NpYXRpb24uXHJcblxyXG4gICAgLy8gRmxhZyB0aGF0IHRoaXMgbm9kZSBpcyBpcyBiZWluZyBsYWJlbGxlZCBieSB0aGUgb3RoZXIgbm9kZSwgc28gdGhhdCBpZiB0aGUgb3RoZXIgbm9kZSBjaGFuZ2VzIGl0IGNhbiB0ZWxsXHJcbiAgICAvLyB0aGlzIG5vZGUgdG8gcmVzdG9yZSB0aGUgYXNzb2NpYXRpb24gYXBwcm9wcmlhdGVseS5cclxuICAgIGFzc29jaWF0aW9uT2JqZWN0Lm90aGVyTm9kZS5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZS5wdXNoKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnNJblBlZXJzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYW4gYXJpYS1sYWJlbGxlZGJ5IGFzc29jaWF0aW9uIG9iamVjdCwgc2VlIGFkZEFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb24gZm9yIG1vcmUgZGV0YWlsc1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uKCBhc3NvY2lhdGlvbk9iamVjdDogQXNzb2NpYXRpb24gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucywgYXNzb2NpYXRpb25PYmplY3QgKSApO1xyXG5cclxuICAgIC8vIHJlbW92ZSB0aGVcclxuICAgIGNvbnN0IHJlbW92ZWRPYmplY3QgPSB0aGlzLl9hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucy5zcGxpY2UoIF8uaW5kZXhPZiggdGhpcy5fYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uT2JqZWN0ICksIDEgKTtcclxuXHJcbiAgICAvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSBmcm9tIHRoZSBvdGhlciBub2RlIGJhY2sgdG8gdGhpcyBub2RlIGJlY2F1c2Ugd2UgZG9uJ3QgbmVlZCBpdCBhbnltb3JlXHJcbiAgICByZW1vdmVkT2JqZWN0WyAwIF0ub3RoZXJOb2RlLnJlbW92ZU5vZGVUaGF0SXNBcmlhTGFiZWxsZWRCeVRoaXNOb2RlKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnNJblBlZXJzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgdGhlIHJlZmVyZW5jZSB0byB0aGUgbm9kZSB0aGF0IGlzIHVzaW5nIHRoaXMgTm9kZSdzIElEIGFzIGFuIGFyaWEtbGFiZWxsZWRieSB2YWx1ZSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlTm9kZVRoYXRJc0FyaWFMYWJlbGxlZEJ5VGhpc05vZGUoIG5vZGU6IE5vZGUgKTogdm9pZCB7XHJcbiAgICBjb25zdCBpbmRleE9mTm9kZSA9IF8uaW5kZXhPZiggdGhpcy5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZSwgbm9kZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5kZXhPZk5vZGUgPj0gMCApO1xyXG4gICAgdGhpcy5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZS5zcGxpY2UoIGluZGV4T2ZOb2RlLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VyIHRoZSB2aWV3IHVwZGF0ZSBmb3IgZWFjaCBQRE9NUGVlclxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uc0luUGVlcnMoKTogdm9pZCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnBkb21JbnN0YW5jZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHBlZXIgPSB0aGlzLnBkb21JbnN0YW5jZXNbIGkgXS5wZWVyITtcclxuICAgICAgcGVlci5vbkFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25DaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgYXNzb2NpYXRpb25zIGZvciBhcmlhLWxhYmVsbGVkYnkgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZU90aGVyTm9kZXNBcmlhTGFiZWxsZWRieSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBpZiBhbnkgb3RoZXIgbm9kZXMgYXJlIGFyaWEtbGFiZWxsZWRieSB0aGlzIE5vZGUsIHVwZGF0ZSB0aG9zZSBhc3NvY2lhdGlvbnMgdG9vLiBTaW5jZSB0aGlzIG5vZGUnc1xyXG4gICAgLy8gcGRvbSBjb250ZW50IG5lZWRzIHRvIGJlIHJlY3JlYXRlZCwgdGhleSBuZWVkIHRvIHVwZGF0ZSB0aGVpciBhcmlhLWxhYmVsbGVkYnkgYXNzb2NpYXRpb25zIGFjY29yZGluZ2x5LlxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgb3RoZXJOb2RlID0gdGhpcy5fbm9kZXNUaGF0QXJlQXJpYUxhYmVsbGVkYnlUaGlzTm9kZVsgaSBdO1xyXG4gICAgICBvdGhlck5vZGUudXBkYXRlQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnNJblBlZXJzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgbGlzdCBvZiBOb2RlcyB0aGF0IGFyZSBhcmlhLWxhYmVsbGVkYnkgdGhpcyBub2RlIChvdGhlciBub2RlJ3MgcGVlciBlbGVtZW50IHdpbGwgaGF2ZSB0aGlzIE5vZGUncyBQZWVyIGVsZW1lbnQnc1xyXG4gICAqIGlkIGluIHRoZSBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlXHJcbiAgICovXHJcbiAgcHVibGljIGdldE5vZGVzVGhhdEFyZUFyaWFMYWJlbGxlZGJ5VGhpc05vZGUoKTogTm9kZVtdIHtcclxuICAgIHJldHVybiB0aGlzLl9ub2Rlc1RoYXRBcmVBcmlhTGFiZWxsZWRieVRoaXNOb2RlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBub2Rlc1RoYXRBcmVBcmlhTGFiZWxsZWRieVRoaXNOb2RlKCk6IE5vZGVbXSB7IHJldHVybiB0aGlzLmdldE5vZGVzVGhhdEFyZUFyaWFMYWJlbGxlZGJ5VGhpc05vZGUoKTsgfVxyXG5cclxuICBwdWJsaWMgc2V0QXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zKCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnM6IEFzc29jaWF0aW9uW10gKTogdm9pZCB7XHJcbiAgICBsZXQgYXNzb2NpYXRpb25PYmplY3Q7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMgKSApO1xyXG4gICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgYXNzb2NpYXRpb25PYmplY3QgPSBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnNbIGogXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG5vIHdvcmsgdG8gYmUgZG9uZSBpZiBib3RoIGFyZSBlbXB0eVxyXG4gICAgaWYgKCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMubGVuZ3RoID09PSAwICYmIHRoaXMuX2FyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiZWZvcmVPbmx5OiBBc3NvY2lhdGlvbltdID0gW107IC8vIFdpbGwgaG9sZCBhbGwgbm9kZXMgdGhhdCB3aWxsIGJlIHJlbW92ZWQuXHJcbiAgICBjb25zdCBhZnRlck9ubHk6IEFzc29jaWF0aW9uW10gPSBbXTsgLy8gV2lsbCBob2xkIGFsbCBub2RlcyB0aGF0IHdpbGwgYmUgXCJuZXdcIiBjaGlsZHJlbiAoYWRkZWQpXHJcbiAgICBjb25zdCBpbkJvdGg6IEFzc29jaWF0aW9uW10gPSBbXTsgLy8gQ2hpbGQgbm9kZXMgdGhhdCBcInN0YXlcIi4gV2lsbCBiZSBvcmRlcmVkIGZvciB0aGUgXCJhZnRlclwiIGNhc2UuXHJcbiAgICBsZXQgaTtcclxuXHJcbiAgICAvLyBnZXQgYSBkaWZmZXJlbmNlIG9mIHRoZSBkZXNpcmVkIG5ldyBsaXN0LCBhbmQgdGhlIG9sZFxyXG4gICAgYXJyYXlEaWZmZXJlbmNlKCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMsIHRoaXMuX2FyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucywgYWZ0ZXJPbmx5LCBiZWZvcmVPbmx5LCBpbkJvdGggKTtcclxuXHJcbiAgICAvLyByZW1vdmUgZWFjaCBjdXJyZW50IGFzc29jaWF0aW9uT2JqZWN0IHRoYXQgaXNuJ3QgaW4gdGhlIG5ldyBsaXN0XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGJlZm9yZU9ubHkubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGFzc29jaWF0aW9uT2JqZWN0ID0gYmVmb3JlT25seVsgaSBdO1xyXG4gICAgICB0aGlzLnJlbW92ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uKCBhc3NvY2lhdGlvbk9iamVjdCApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2FyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucy5sZW5ndGggPT09IGluQm90aC5sZW5ndGgsXHJcbiAgICAgICdSZW1vdmluZyBhc3NvY2lhdGlvbnMgc2hvdWxkIG5vdCBoYXZlIHRyaWdnZXJlZCBvdGhlciBhc3NvY2lhdGlvbiBjaGFuZ2VzJyApO1xyXG5cclxuICAgIC8vIGFkZCBlYWNoIGFzc29jaWF0aW9uIGZyb20gdGhlIG5ldyBsaXN0IHRoYXQgaGFzbid0IGJlZW4gYWRkZWQgeWV0XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGFmdGVyT25seS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24gPSBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnNbIGkgXTtcclxuICAgICAgdGhpcy5hZGRBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiggYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zKCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnM6IEFzc29jaWF0aW9uW10gKSB7IHRoaXMuc2V0QXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zKCBhcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucygpOiBBc3NvY2lhdGlvbltdIHsgcmV0dXJuIHRoaXMuZ2V0QXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zKCk7IH1cclxuXHJcbiAgcHVibGljIGdldEFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9ucygpOiBBc3NvY2lhdGlvbltdIHtcclxuICAgIHJldHVybiB0aGlzLl9hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYW4gYXJpYS1kZXNjcmliZWRieSBhc3NvY2lhdGlvbiB0byB0aGlzIG5vZGUuIFRoZSBkYXRhIGluIHRoZSBhc3NvY2lhdGlvbk9iamVjdCB3aWxsIGJlIGltcGxlbWVudGVkIGxpa2VcclxuICAgKiBcImEgcGVlcidzIEhUTUxFbGVtZW50IG9mIHRoaXMgTm9kZSAoc3BlY2lmaWVkIHdpdGggdGhlIHN0cmluZyBjb25zdGFudCBzdG9yZWQgaW4gYHRoaXNFbGVtZW50TmFtZWApIHdpbGwgaGF2ZSBhblxyXG4gICAqIGFyaWEtZGVzY3JpYmVkYnkgYXR0cmlidXRlIHdpdGggYSB2YWx1ZSB0aGF0IGluY2x1ZGVzIHRoZSBgb3RoZXJOb2RlYCdzIHBlZXIgSFRNTEVsZW1lbnQncyBpZCAoc3BlY2lmaWVkIHdpdGhcclxuICAgKiBgb3RoZXJFbGVtZW50TmFtZWApLlwiXHJcbiAgICpcclxuICAgKiBUaGVyZSBjYW4gYmUgbW9yZSB0aGFuIG9uZSBhc3NvY2lhdGlvbiBiZWNhdXNlIGFuIGFyaWEtZGVzY3JpYmVkYnkgYXR0cmlidXRlJ3MgdmFsdWUgY2FuIGJlIGEgc3BhY2Ugc2VwYXJhdGVkXHJcbiAgICogbGlzdCBvZiBIVE1MIGlkcywgYW5kIG5vdCBqdXN0IGEgc2luZ2xlIGlkLCBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1dBSS9HTC93aWtpL1VzaW5nX2FyaWEtbGFiZWxsZWRieV90b19jb25jYXRlbmF0ZV9hX2xhYmVsX2Zyb21fc2V2ZXJhbF90ZXh0X25vZGVzXHJcbiAgICovXHJcbiAgcHVibGljIGFkZEFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uKCBhc3NvY2lhdGlvbk9iamVjdDogQXNzb2NpYXRpb24gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhXy5pbmNsdWRlcyggdGhpcy5fYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zLCBhc3NvY2lhdGlvbk9iamVjdCApLCAnZGVzY3JpYmVkYnkgYXNzb2NpYXRpb24gYWxyZWFkeSByZWdpc3RlZCcgKTtcclxuXHJcbiAgICB0aGlzLl9hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMucHVzaCggYXNzb2NpYXRpb25PYmplY3QgKTsgLy8gS2VlcCB0cmFjayBvZiB0aGlzIGFzc29jaWF0aW9uLlxyXG5cclxuICAgIC8vIEZsYWcgdGhhdCB0aGlzIG5vZGUgaXMgaXMgYmVpbmcgZGVzY3JpYmVkIGJ5IHRoZSBvdGhlciBub2RlLCBzbyB0aGF0IGlmIHRoZSBvdGhlciBub2RlIGNoYW5nZXMgaXQgY2FuIHRlbGxcclxuICAgIC8vIHRoaXMgbm9kZSB0byByZXN0b3JlIHRoZSBhc3NvY2lhdGlvbiBhcHByb3ByaWF0ZWx5LlxyXG4gICAgYXNzb2NpYXRpb25PYmplY3Qub3RoZXJOb2RlLl9ub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZS5wdXNoKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApO1xyXG5cclxuICAgIC8vIHVwZGF0ZSB0aGUgUERPTVBlZXJzIHdpdGggdGhpcyBhcmlhLWRlc2NyaWJlZGJ5IGFzc29jaWF0aW9uXHJcbiAgICB0aGlzLnVwZGF0ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uc0luUGVlcnMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElzIHRoaXMgb2JqZWN0IGFscmVhZHkgaW4gdGhlIGRlc2NyaWJlZGJ5IGFzc29jaWF0aW9uIGxpc3RcclxuICAgKi9cclxuICBwdWJsaWMgaGFzQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24oIGFzc29jaWF0aW9uT2JqZWN0OiBBc3NvY2lhdGlvbiApOiBib29sZWFuIHtcclxuICAgIHJldHVybiBfLmluY2x1ZGVzKCB0aGlzLl9hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uT2JqZWN0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYW4gYXJpYS1kZXNjcmliZWRieSBhc3NvY2lhdGlvbiBvYmplY3QsIHNlZSBhZGRBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiBmb3IgbW9yZSBkZXRhaWxzXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uKCBhc3NvY2lhdGlvbk9iamVjdDogQXNzb2NpYXRpb24gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCB0aGlzLl9hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uT2JqZWN0ICkgKTtcclxuXHJcbiAgICAvLyByZW1vdmUgdGhlXHJcbiAgICBjb25zdCByZW1vdmVkT2JqZWN0ID0gdGhpcy5fYXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb25zLnNwbGljZSggXy5pbmRleE9mKCB0aGlzLl9hcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uT2JqZWN0ICksIDEgKTtcclxuXHJcbiAgICAvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSBmcm9tIHRoZSBvdGhlciBub2RlIGJhY2sgdG8gdGhpcyBub2RlIGJlY2F1c2Ugd2UgZG9uJ3QgbmVlZCBpdCBhbnltb3JlXHJcbiAgICByZW1vdmVkT2JqZWN0WyAwIF0ub3RoZXJOb2RlLnJlbW92ZU5vZGVUaGF0SXNBcmlhRGVzY3JpYmVkQnlUaGlzTm9kZSggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uc0luUGVlcnMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSB0aGUgcmVmZXJlbmNlIHRvIHRoZSBub2RlIHRoYXQgaXMgdXNpbmcgdGhpcyBOb2RlJ3MgSUQgYXMgYW4gYXJpYS1kZXNjcmliZWRieSB2YWx1ZSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlTm9kZVRoYXRJc0FyaWFEZXNjcmliZWRCeVRoaXNOb2RlKCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgY29uc3QgaW5kZXhPZk5vZGUgPSBfLmluZGV4T2YoIHRoaXMuX25vZGVzVGhhdEFyZUFyaWFEZXNjcmliZWRieVRoaXNOb2RlLCBub2RlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleE9mTm9kZSA+PSAwICk7XHJcbiAgICB0aGlzLl9ub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZS5zcGxpY2UoIGluZGV4T2ZOb2RlLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VyIHRoZSB2aWV3IHVwZGF0ZSBmb3IgZWFjaCBQRE9NUGVlclxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbnNJblBlZXJzKCk6IHZvaWQge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwZWVyID0gdGhpcy5wZG9tSW5zdGFuY2VzWyBpIF0ucGVlciE7XHJcbiAgICAgIHBlZXIub25BcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbkNoYW5nZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHRoZSBhc3NvY2lhdGlvbnMgZm9yIGFyaWEtZGVzY3JpYmVkYnkgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZU90aGVyTm9kZXNBcmlhRGVzY3JpYmVkYnkoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gaWYgYW55IG90aGVyIG5vZGVzIGFyZSBhcmlhLWRlc2NyaWJlZGJ5IHRoaXMgTm9kZSwgdXBkYXRlIHRob3NlIGFzc29jaWF0aW9ucyB0b28uIFNpbmNlIHRoaXMgbm9kZSdzXHJcbiAgICAvLyBwZG9tIGNvbnRlbnQgbmVlZHMgdG8gYmUgcmVjcmVhdGVkLCB0aGV5IG5lZWQgdG8gdXBkYXRlIHRoZWlyIGFyaWEtZGVzY3JpYmVkYnkgYXNzb2NpYXRpb25zIGFjY29yZGluZ2x5LlxyXG4gICAgLy8gVE9ETzogb25seSB1c2UgdW5pcXVlIGVsZW1lbnRzIG9mIHRoZSBhcnJheSAoXy51bmlxdWUpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9ub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgb3RoZXJOb2RlID0gdGhpcy5fbm9kZXNUaGF0QXJlQXJpYURlc2NyaWJlZGJ5VGhpc05vZGVbIGkgXTtcclxuICAgICAgb3RoZXJOb2RlLnVwZGF0ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uc0luUGVlcnMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsaXN0IG9mIE5vZGVzIHRoYXQgYXJlIGFyaWEtZGVzY3JpYmVkYnkgdGhpcyBub2RlIChvdGhlciBub2RlJ3MgcGVlciBlbGVtZW50IHdpbGwgaGF2ZSB0aGlzIE5vZGUncyBQZWVyIGVsZW1lbnQnc1xyXG4gICAqIGlkIGluIHRoZSBhcmlhLWRlc2NyaWJlZGJ5IGF0dHJpYnV0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROb2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZSgpOiBOb2RlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX25vZGVzVGhhdEFyZUFyaWFEZXNjcmliZWRieVRoaXNOb2RlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBub2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZSgpOiBOb2RlW10geyByZXR1cm4gdGhpcy5nZXROb2Rlc1RoYXRBcmVBcmlhRGVzY3JpYmVkYnlUaGlzTm9kZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXRBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zKCBhY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zOiBBc3NvY2lhdGlvbltdICk6IHZvaWQge1xyXG5cclxuICAgIGxldCBhc3NvY2lhdGlvbk9iamVjdDtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMgKSApO1xyXG4gICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBhY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIGFzc29jaWF0aW9uT2JqZWN0ID0gYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uc1sgaiBdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbm8gd29yayB0byBiZSBkb25lIGlmIGJvdGggYXJlIGVtcHR5LCBzYWZlIHRvIHJldHVybiBlYXJseVxyXG4gICAgaWYgKCBhY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zLmxlbmd0aCA9PT0gMCAmJiB0aGlzLl9hY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGJlZm9yZU9ubHk6IEFzc29jaWF0aW9uW10gPSBbXTsgLy8gV2lsbCBob2xkIGFsbCBub2RlcyB0aGF0IHdpbGwgYmUgcmVtb3ZlZC5cclxuICAgIGNvbnN0IGFmdGVyT25seTogQXNzb2NpYXRpb25bXSA9IFtdOyAvLyBXaWxsIGhvbGQgYWxsIG5vZGVzIHRoYXQgd2lsbCBiZSBcIm5ld1wiIGNoaWxkcmVuIChhZGRlZClcclxuICAgIGNvbnN0IGluQm90aDogQXNzb2NpYXRpb25bXSA9IFtdOyAvLyBDaGlsZCBub2RlcyB0aGF0IFwic3RheVwiLiBXaWxsIGJlIG9yZGVyZWQgZm9yIHRoZSBcImFmdGVyXCIgY2FzZS5cclxuICAgIGxldCBpO1xyXG5cclxuICAgIC8vIGdldCBhIGRpZmZlcmVuY2Ugb2YgdGhlIGRlc2lyZWQgbmV3IGxpc3QsIGFuZCB0aGUgb2xkXHJcbiAgICBhcnJheURpZmZlcmVuY2UoIGFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMsIHRoaXMuX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMsIGFmdGVyT25seSwgYmVmb3JlT25seSwgaW5Cb3RoICk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIGVhY2ggY3VycmVudCBhc3NvY2lhdGlvbk9iamVjdCB0aGF0IGlzbid0IGluIHRoZSBuZXcgbGlzdFxyXG4gICAgZm9yICggaSA9IDA7IGkgPCBiZWZvcmVPbmx5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBhc3NvY2lhdGlvbk9iamVjdCA9IGJlZm9yZU9ubHlbIGkgXTtcclxuICAgICAgdGhpcy5yZW1vdmVBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24oIGFzc29jaWF0aW9uT2JqZWN0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucy5sZW5ndGggPT09IGluQm90aC5sZW5ndGgsXHJcbiAgICAgICdSZW1vdmluZyBhc3NvY2lhdGlvbnMgc2hvdWxkIG5vdCBoYXZlIHRyaWdnZXJlZCBvdGhlciBhc3NvY2lhdGlvbiBjaGFuZ2VzJyApO1xyXG5cclxuICAgIC8vIGFkZCBlYWNoIGFzc29jaWF0aW9uIGZyb20gdGhlIG5ldyBsaXN0IHRoYXQgaGFzbid0IGJlZW4gYWRkZWQgeWV0XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGFmdGVyT25seS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uID0gYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uc1sgaSBdO1xyXG4gICAgICB0aGlzLmFkZEFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbiggYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMoIGFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnM6IEFzc29jaWF0aW9uW10gKSB7IHRoaXMuc2V0QWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucyggYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucyApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucygpOiBBc3NvY2lhdGlvbltdIHsgcmV0dXJuIHRoaXMuZ2V0QWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9ucygpOyB9XHJcblxyXG4gIHB1YmxpYyBnZXRBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zKCk6IEFzc29jaWF0aW9uW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYW4gYXJpYS1hY3RpdmVEZXNjZW5kYW50IGFzc29jaWF0aW9uIHRvIHRoaXMgbm9kZS4gVGhlIGRhdGEgaW4gdGhlIGFzc29jaWF0aW9uT2JqZWN0IHdpbGwgYmUgaW1wbGVtZW50ZWQgbGlrZVxyXG4gICAqIFwiYSBwZWVyJ3MgSFRNTEVsZW1lbnQgb2YgdGhpcyBOb2RlIChzcGVjaWZpZWQgd2l0aCB0aGUgc3RyaW5nIGNvbnN0YW50IHN0b3JlZCBpbiBgdGhpc0VsZW1lbnROYW1lYCkgd2lsbCBoYXZlIGFuXHJcbiAgICogYXJpYS1hY3RpdmVEZXNjZW5kYW50IGF0dHJpYnV0ZSB3aXRoIGEgdmFsdWUgdGhhdCBpbmNsdWRlcyB0aGUgYG90aGVyTm9kZWAncyBwZWVyIEhUTUxFbGVtZW50J3MgaWQgKHNwZWNpZmllZCB3aXRoXHJcbiAgICogYG90aGVyRWxlbWVudE5hbWVgKS5cIlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb24oIGFzc29jaWF0aW9uT2JqZWN0OiBBc3NvY2lhdGlvbiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUT0RPOiBhc3NlcnQgaWYgdGhpcyBhc3NvY2lhdGlvbk9iamVjdCBpcyBhbHJlYWR5IGluIHRoZSBhc3NvY2lhdGlvbiBvYmplY3RzIGxpc3QhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84MzJcclxuICAgIHRoaXMuX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMucHVzaCggYXNzb2NpYXRpb25PYmplY3QgKTsgLy8gS2VlcCB0cmFjayBvZiB0aGlzIGFzc29jaWF0aW9uLlxyXG5cclxuICAgIC8vIEZsYWcgdGhhdCB0aGlzIG5vZGUgaXMgaXMgYmVpbmcgZGVzY3JpYmVkIGJ5IHRoZSBvdGhlciBub2RlLCBzbyB0aGF0IGlmIHRoZSBvdGhlciBub2RlIGNoYW5nZXMgaXQgY2FuIHRlbGxcclxuICAgIC8vIHRoaXMgbm9kZSB0byByZXN0b3JlIHRoZSBhc3NvY2lhdGlvbiBhcHByb3ByaWF0ZWx5LlxyXG4gICAgYXNzb2NpYXRpb25PYmplY3Qub3RoZXJOb2RlLl9ub2Rlc1RoYXRBcmVBY3RpdmVEZXNjZW5kYW50VG9UaGlzTm9kZS5wdXNoKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApO1xyXG5cclxuICAgIC8vIHVwZGF0ZSB0aGUgcGRvbVBlZXJzIHdpdGggdGhpcyBhcmlhLWFjdGl2ZURlc2NlbmRhbnQgYXNzb2NpYXRpb25cclxuICAgIHRoaXMudXBkYXRlQWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uc0luUGVlcnMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhbiBhcmlhLWFjdGl2ZURlc2NlbmRhbnQgYXNzb2NpYXRpb24gb2JqZWN0LCBzZWUgYWRkQWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uIGZvciBtb3JlIGRldGFpbHNcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlQWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uKCBhc3NvY2lhdGlvbk9iamVjdDogQXNzb2NpYXRpb24gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCB0aGlzLl9hY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zLCBhc3NvY2lhdGlvbk9iamVjdCApICk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHRoZVxyXG4gICAgY29uc3QgcmVtb3ZlZE9iamVjdCA9IHRoaXMuX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMuc3BsaWNlKCBfLmluZGV4T2YoIHRoaXMuX2FjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uT2JqZWN0ICksIDEgKTtcclxuXHJcbiAgICAvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSBmcm9tIHRoZSBvdGhlciBub2RlIGJhY2sgdG8gdGhpcyBub2RlIGJlY2F1c2Ugd2UgZG9uJ3QgbmVlZCBpdCBhbnltb3JlXHJcbiAgICByZW1vdmVkT2JqZWN0WyAwIF0ub3RoZXJOb2RlLnJlbW92ZU5vZGVUaGF0SXNBY3RpdmVEZXNjZW5kYW50VGhpc05vZGUoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICk7XHJcblxyXG4gICAgdGhpcy51cGRhdGVBY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25zSW5QZWVycygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIHRoZSByZWZlcmVuY2UgdG8gdGhlIG5vZGUgdGhhdCBpcyB1c2luZyB0aGlzIE5vZGUncyBJRCBhcyBhbiBhcmlhLWFjdGl2ZURlc2NlbmRhbnQgdmFsdWUgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZW1vdmVOb2RlVGhhdElzQWN0aXZlRGVzY2VuZGFudFRoaXNOb2RlKCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgY29uc3QgaW5kZXhPZk5vZGUgPSBfLmluZGV4T2YoIHRoaXMuX25vZGVzVGhhdEFyZUFjdGl2ZURlc2NlbmRhbnRUb1RoaXNOb2RlLCBub2RlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleE9mTm9kZSA+PSAwICk7XHJcbiAgICB0aGlzLl9ub2Rlc1RoYXRBcmVBY3RpdmVEZXNjZW5kYW50VG9UaGlzTm9kZS5zcGxpY2UoIGluZGV4T2ZOb2RlLCAxICk7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlciB0aGUgdmlldyB1cGRhdGUgZm9yIGVhY2ggUERPTVBlZXJcclxuICAgKi9cclxuICBwcml2YXRlIHVwZGF0ZUFjdGl2ZURlc2NlbmRhbnRBc3NvY2lhdGlvbnNJblBlZXJzKCk6IHZvaWQge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwZWVyID0gdGhpcy5wZG9tSW5zdGFuY2VzWyBpIF0ucGVlciE7XHJcbiAgICAgIHBlZXIub25BY3RpdmVEZXNjZW5kYW50QXNzb2NpYXRpb25DaGFuZ2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgYXNzb2NpYXRpb25zIGZvciBhcmlhLWFjdGl2ZURlc2NlbmRhbnQgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZU90aGVyTm9kZXNBY3RpdmVEZXNjZW5kYW50KCk6IHZvaWQge1xyXG5cclxuICAgIC8vIGlmIGFueSBvdGhlciBub2RlcyBhcmUgYXJpYS1hY3RpdmVEZXNjZW5kYW50IHRoaXMgTm9kZSwgdXBkYXRlIHRob3NlIGFzc29jaWF0aW9ucyB0b28uIFNpbmNlIHRoaXMgbm9kZSdzXHJcbiAgICAvLyBwZG9tIGNvbnRlbnQgbmVlZHMgdG8gYmUgcmVjcmVhdGVkLCB0aGV5IG5lZWQgdG8gdXBkYXRlIHRoZWlyIGFyaWEtYWN0aXZlRGVzY2VuZGFudCBhc3NvY2lhdGlvbnMgYWNjb3JkaW5nbHkuXHJcbiAgICAvLyBUT0RPOiBvbmx5IHVzZSB1bmlxdWUgZWxlbWVudHMgb2YgdGhlIGFycmF5IChfLnVuaXF1ZSkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX25vZGVzVGhhdEFyZUFjdGl2ZURlc2NlbmRhbnRUb1RoaXNOb2RlLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBvdGhlck5vZGUgPSB0aGlzLl9ub2Rlc1RoYXRBcmVBY3RpdmVEZXNjZW5kYW50VG9UaGlzTm9kZVsgaSBdO1xyXG4gICAgICBvdGhlck5vZGUudXBkYXRlQWN0aXZlRGVzY2VuZGFudEFzc29jaWF0aW9uc0luUGVlcnMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsaXN0IG9mIE5vZGVzIHRoYXQgYXJlIGFyaWEtYWN0aXZlRGVzY2VuZGFudCB0aGlzIG5vZGUgKG90aGVyIG5vZGUncyBwZWVyIGVsZW1lbnQgd2lsbCBoYXZlIHRoaXMgTm9kZSdzIFBlZXIgZWxlbWVudCdzXHJcbiAgICogaWQgaW4gdGhlIGFyaWEtYWN0aXZlRGVzY2VuZGFudCBhdHRyaWJ1dGVcclxuICAgKi9cclxuICBwcml2YXRlIGdldE5vZGVzVGhhdEFyZUFjdGl2ZURlc2NlbmRhbnRUb1RoaXNOb2RlKCk6IE5vZGVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGU7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldCBub2Rlc1RoYXRBcmVBY3RpdmVEZXNjZW5kYW50VG9UaGlzTm9kZSgpIHsgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNUaGF0QXJlQWN0aXZlRGVzY2VuZGFudFRvVGhpc05vZGUoKTsgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgUERPTS9ET00gb3JkZXIgZm9yIHRoaXMgTm9kZS4gVGhpcyBpbmNsdWRlcyBub3Qgb25seSBmb2N1c2VkIGl0ZW1zLCBidXQgZWxlbWVudHMgdGhhdCBjYW4gYmVcclxuICAgKiBwbGFjZWQgaW4gdGhlIFBhcmFsbGVsIERPTS4gSWYgcHJvdmlkZWQsIGl0IHdpbGwgb3ZlcnJpZGUgdGhlIGZvY3VzIG9yZGVyIGJldHdlZW4gY2hpbGRyZW4gKGFuZFxyXG4gICAqIG9wdGlvbmFsbHkgYXJiaXRyYXJ5IHN1YnRyZWVzKS4gSWYgbm90IHByb3ZpZGVkLCB0aGUgZm9jdXMgb3JkZXIgd2lsbCBkZWZhdWx0IHRvIHRoZSByZW5kZXJpbmcgb3JkZXJcclxuICAgKiAoZmlyc3QgY2hpbGRyZW4gZmlyc3QsIGxhc3QgY2hpbGRyZW4gbGFzdCksIGRldGVybWluZWQgYnkgdGhlIGNoaWxkcmVuIGFycmF5LiBBIE5vZGUgbXVzdCBiZSBjb25uZWN0ZWQgdG8gYSBzY2VuZVxyXG4gICAqIGdyYXBoICh2aWEgY2hpbGRyZW4pIGluIG9yZGVyIGZvciBwZG9tT3JkZXIgdG8gYXBwbHkuIFRodXMsIGBzZXRQRE9NT3JkZXJgIGNhbm5vdCBiZSB1c2VkIGluIGV4Y2hhbmdlIGZvclxyXG4gICAqIHNldHRpbmcgYSBOb2RlIGFzIGEgY2hpbGQuXHJcbiAgICpcclxuICAgKiBJbiB0aGUgZ2VuZXJhbCBjYXNlLCB3aGVuIHBkb21PcmRlciBpcyBzcGVjaWZpZWQsIGl0J3MgYW4gYXJyYXkgb2YgTm9kZXMsIHdpdGggb3B0aW9uYWxseSBvbmVcclxuICAgKiBlbGVtZW50IGJlaW5nIGEgcGxhY2Vob2xkZXIgZm9yIFwidGhlIHJlc3Qgb2YgdGhlIGNoaWxkcmVuXCIsIHNpZ25pZmllZCBieSBudWxsLiBUaGlzIG1lYW5zIHRoYXQsIGZvclxyXG4gICAqIGFjY2Vzc2liaWxpdHksIGl0IHdpbGwgYWN0IGFzIGlmIHRoZSBjaGlsZHJlbiBmb3IgdGhpcyBOb2RlIFdFUkUgdGhlIHBkb21PcmRlciAocG90ZW50aWFsbHlcclxuICAgKiBzdXBwbGVtZW50ZWQgd2l0aCBvdGhlciBjaGlsZHJlbiB2aWEgdGhlIHBsYWNlaG9sZGVyKS5cclxuICAgKlxyXG4gICAqIEZvciBleGFtcGxlLCBpZiB5b3UgaGF2ZSB0aGUgdHJlZTpcclxuICAgKiAgIGFcclxuICAgKiAgICAgYlxyXG4gICAqICAgICAgIGRcclxuICAgKiAgICAgICBlXHJcbiAgICogICAgIGNcclxuICAgKiAgICAgICBnXHJcbiAgICogICAgICAgZlxyXG4gICAqICAgICAgICAgaFxyXG4gICAqXHJcbiAgICogYW5kIHdlIHNwZWNpZnkgYi5wZG9tT3JkZXIgPSBbIGUsIGYsIGQsIGMgXSwgdGhlbiB0aGUgcGRvbSBzdHJ1Y3R1cmUgd2lsbCBhY3QgYXMgaWYgdGhlIHRyZWUgaXM6XHJcbiAgICogIGFcclxuICAgKiAgICBiXHJcbiAgICogICAgICBlXHJcbiAgICogICAgICBmIDwtLS0gdGhlIGVudGlyZSBzdWJ0cmVlIG9mIGBmYCBnZXRzIHBsYWNlZCBoZXJlIHVuZGVyIGBiYCwgcHVsbGluZyBpdCBvdXQgZnJvbSB3aGVyZSBpdCB3YXMgYmVmb3JlLlxyXG4gICAqICAgICAgICBoXHJcbiAgICogICAgICBkXHJcbiAgICogICAgICBjIDwtLS0gbm90ZSB0aGF0IGBnYCBpcyBOT1QgdW5kZXIgYGNgIGFueW1vcmUsIGJlY2F1c2UgaXQgZ290IHB1bGxlZCBvdXQgdW5kZXIgYiBkaXJlY3RseVxyXG4gICAqICAgICAgICBnXHJcbiAgICpcclxuICAgKiBUaGUgcGxhY2Vob2xkZXIgKGBudWxsYCkgd2lsbCBnZXQgZmlsbGVkIGluIHdpdGggYWxsIGRpcmVjdCBjaGlsZHJlbiB0aGF0IGFyZSBOT1QgaW4gYW55IHBkb21PcmRlci5cclxuICAgKiBJZiB0aGVyZSBpcyBubyBwbGFjZWhvbGRlciBzcGVjaWZpZWQsIGl0IHdpbGwgYWN0IGFzIGlmIHRoZSBwbGFjZWhvbGRlciBpcyBhdCB0aGUgZW5kIG9mIHRoZSBvcmRlci5cclxuICAgKiBUaGUgdmFsdWUgYG51bGxgICh0aGUgZGVmYXVsdCkgYW5kIHRoZSBlbXB0eSBhcnJheSAoYFtdYCkgYm90aCBhY3QgYXMgaWYgdGhlIG9ubHkgb3JkZXIgaXMgdGhlIHBsYWNlaG9sZGVyLFxyXG4gICAqIGkuZS4gYFtudWxsXWAuXHJcbiAgICpcclxuICAgKiBTb21lIGdlbmVyYWwgY29uc3RyYWludHMgZm9yIHRoZSBvcmRlcnMgYXJlOlxyXG4gICAqIC0gTm9kZXMgbXVzdCBiZSBhdHRhY2hlZCB0byBhIERpc3BsYXkgKGluIGEgc2NlbmUgZ3JhcGgpIHRvIGJlIHNob3duIGluIGEgcGRvbSBvcmRlci5cclxuICAgKiAtIFlvdSBjYW4ndCBzcGVjaWZ5IGEgbm9kZSBpbiBtb3JlIHRoYW4gb25lIHBkb21PcmRlciwgYW5kIHlvdSBjYW4ndCBzcGVjaWZ5IGR1cGxpY2F0ZXMgb2YgYSB2YWx1ZVxyXG4gICAqICAgaW4gYSBwZG9tT3JkZXIuXHJcbiAgICogLSBZb3UgY2FuJ3Qgc3BlY2lmeSBhbiBhbmNlc3RvciBvZiBhIG5vZGUgaW4gdGhhdCBub2RlJ3MgcGRvbU9yZGVyXHJcbiAgICogICAoZS5nLiB0aGlzLnBkb21PcmRlciA9IHRoaXMucGFyZW50cyApLlxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IHNwZWNpZnlpbmcgc29tZXRoaW5nIGluIGEgcGRvbU9yZGVyIHdpbGwgZWZmZWN0aXZlbHkgcmVtb3ZlIGl0IGZyb20gYWxsIG9mIGl0cyBwYXJlbnRzIGZvclxyXG4gICAqIHRoZSBwZG9tIHRyZWUgKHNvIGlmIHlvdSBjcmVhdGUgYHRtcE5vZGUucGRvbU9yZGVyID0gWyBhIF1gIHRoZW4gdG9zcyB0aGUgdG1wTm9kZSB3aXRob3V0XHJcbiAgICogZGlzcG9zaW5nIGl0LCBgYWAgd29uJ3Qgc2hvdyB1cCBpbiB0aGUgcGFyYWxsZWwgRE9NKS4gSWYgdGhlcmUgaXMgYSBuZWVkIGZvciB0aGF0LCBkaXNwb3NpbmcgYSBOb2RlXHJcbiAgICogZWZmZWN0aXZlbHkgcmVtb3ZlcyBpdHMgcGRvbU9yZGVyLlxyXG4gICAqXHJcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzM2NSNpc3N1ZWNvbW1lbnQtMzgxMzAyNTgzIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHRoZVxyXG4gICAqIGRlY2lzaW9ucyBhbmQgZGVzaWduIGZvciB0aGlzIGZlYXR1cmUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBET01PcmRlciggcGRvbU9yZGVyOiAoIE5vZGUgfCBudWxsIClbXSB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBwZG9tT3JkZXIgKSB8fCBwZG9tT3JkZXIgPT09IG51bGwsXHJcbiAgICAgIGBBcnJheSBvciBudWxsIGV4cGVjdGVkLCByZWNlaXZlZDogJHtwZG9tT3JkZXJ9YCApO1xyXG4gICAgYXNzZXJ0ICYmIHBkb21PcmRlciAmJiBwZG9tT3JkZXIuZm9yRWFjaCggKCBub2RlLCBpbmRleCApID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSA9PT0gbnVsbCB8fCBub2RlIGluc3RhbmNlb2YgTm9kZSxcclxuICAgICAgICBgRWxlbWVudHMgb2YgcGRvbU9yZGVyIHNob3VsZCBiZSBlaXRoZXIgYSBOb2RlIG9yIG51bGwuIEVsZW1lbnQgYXQgaW5kZXggJHtpbmRleH0gaXM6ICR7bm9kZX1gICk7XHJcbiAgICB9ICk7XHJcbiAgICBhc3NlcnQgJiYgcGRvbU9yZGVyICYmIGFzc2VydCggKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApLmdldFRyYWlscyggbm9kZSA9PiBfLmluY2x1ZGVzKCBwZG9tT3JkZXIsIG5vZGUgKSApLmxlbmd0aCA9PT0gMCwgJ3Bkb21PcmRlciBzaG91bGQgbm90IGluY2x1ZGUgYW55IGFuY2VzdG9ycyBvciB0aGUgbm9kZSBpdHNlbGYnICk7XHJcblxyXG4gICAgLy8gT25seSB1cGRhdGUgaWYgaXQgaGFzIGNoYW5nZWRcclxuICAgIGlmICggdGhpcy5fcGRvbU9yZGVyICE9PSBwZG9tT3JkZXIgKSB7XHJcbiAgICAgIGNvbnN0IG9sZFBET01PcmRlciA9IHRoaXMuX3Bkb21PcmRlcjtcclxuXHJcbiAgICAgIC8vIFN0b3JlIG91ciBvd24gcmVmZXJlbmNlIHRvIHRoaXMsIHNvIGNsaWVudCBtb2RpZmljYXRpb25zIHRvIHRoZSBpbnB1dCBhcnJheSB3b24ndCBzaWxlbnRseSBicmVhayB0aGluZ3MuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNzg2XHJcbiAgICAgIHRoaXMuX3Bkb21PcmRlciA9IHBkb21PcmRlciA9PT0gbnVsbCA/IG51bGwgOiBwZG9tT3JkZXIuc2xpY2UoKTtcclxuXHJcbiAgICAgIFBET01UcmVlLnBkb21PcmRlckNoYW5nZSggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUsIG9sZFBET01PcmRlciwgcGRvbU9yZGVyICk7XHJcblxyXG4gICAgICAoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkucmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBwZG9tT3JkZXIoIHZhbHVlOiAoIE5vZGUgfCBudWxsIClbXSB8IG51bGwgKSB7IHRoaXMuc2V0UERPTU9yZGVyKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGRvbU9yZGVyKCk6ICggTm9kZSB8IG51bGwgKVtdIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFBET01PcmRlcigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBkb20gKGZvY3VzKSBvcmRlciBmb3IgdGhpcyBub2RlLlxyXG4gICAqIElmIHRoZXJlIGlzIGFuIGV4aXN0aW5nIGFycmF5LCB0aGlzIHJldHVybnMgYSBjb3B5IG9mIHRoYXQgYXJyYXkuIFRoaXMgaXMgaW1wb3J0YW50IGJlY2F1c2UgY2xpZW50cyBtYXkgdGhlblxyXG4gICAqIG1vZGlmeSB0aGUgYXJyYXksIGFuZCBjYWxsIHNldFBET01PcmRlciAtIHdoaWNoIGlzIGEgbm8tb3AgdW5sZXNzIHRoZSBhcnJheSByZWZlcmVuY2UgaXMgZGlmZmVyZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQRE9NT3JkZXIoKTogKCBOb2RlIHwgbnVsbCApW10gfCBudWxsIHtcclxuICAgIGlmICggdGhpcy5fcGRvbU9yZGVyICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcGRvbU9yZGVyLnNsaWNlKCAwICk7IC8vIGNyZWF0ZSBhIGRlZmVuc2l2ZSBjb3B5XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fcGRvbU9yZGVyO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbm9kZSBoYXMgYSBwZG9tT3JkZXIgdGhhdCBpcyBlZmZlY3RpdmVseSBkaWZmZXJlbnQgdGhhbiB0aGUgZGVmYXVsdC5cclxuICAgKlxyXG4gICAqIE5PVEU6IGBudWxsYCwgYFtdYCBhbmQgYFtudWxsXWAgYXJlIGFsbCBlZmZlY3RpdmVseSB0aGUgc2FtZSB0aGluZywgc28gdGhpcyB3aWxsIHJldHVybiB0cnVlIGZvciBhbnkgb2ZcclxuICAgKiB0aG9zZS4gVXNhZ2Ugb2YgYG51bGxgIGlzIHJlY29tbWVuZGVkLCBhcyBpdCBkb2Vzbid0IGNyZWF0ZSB0aGUgZXh0cmEgb2JqZWN0IHJlZmVyZW5jZSAoYnV0IHNvbWUgY29kZVxyXG4gICAqIHRoYXQgZ2VuZXJhdGVzIGFycmF5cyBtYXkgYmUgbW9yZSBjb252ZW5pZW50KS5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzUERPTU9yZGVyKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Bkb21PcmRlciAhPT0gbnVsbCAmJlxyXG4gICAgICAgICAgIHRoaXMuX3Bkb21PcmRlci5sZW5ndGggIT09IDAgJiZcclxuICAgICAgICAgICAoIHRoaXMuX3Bkb21PcmRlci5sZW5ndGggPiAxIHx8IHRoaXMuX3Bkb21PcmRlclsgMCBdICE9PSBudWxsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIG91ciBcIlBET00gcGFyZW50XCIgaWYgYXZhaWxhYmxlOiB0aGUgbm9kZSB0aGF0IHNwZWNpZmllcyB0aGlzIG5vZGUgaW4gaXRzIHBkb21PcmRlci5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UERPTVBhcmVudCgpOiBOb2RlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGRvbVBhcmVudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGRvbVBhcmVudCgpOiBOb2RlIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFBET01QYXJlbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBcImVmZmVjdGl2ZVwiIHBkb20gY2hpbGRyZW4gZm9yIHRoZSBub2RlICh3aGljaCBtYXkgYmUgZGlmZmVyZW50IGJhc2VkIG9uIHRoZSBvcmRlciBvciBvdGhlclxyXG4gICAqIGV4Y2x1ZGVkIHN1YnRyZWVzKS5cclxuICAgKlxyXG4gICAqIElmIHRoZXJlIGlzIG5vIHBkb21PcmRlciBzcGVjaWZpZWQsIHRoaXMgaXMgYmFzaWNhbGx5IFwiYWxsIGNoaWxkcmVuIHRoYXQgZG9uJ3QgaGF2ZSBwZG9tIHBhcmVudHNcIlxyXG4gICAqIChhIE5vZGUgaGFzIGEgXCJQRE9NIHBhcmVudFwiIGlmIGl0IGlzIHNwZWNpZmllZCBpbiBhIHBkb21PcmRlcikuXHJcbiAgICpcclxuICAgKiBPdGhlcndpc2UgKGlmIGl0IGhhcyBhIHBkb21PcmRlciksIGl0IGlzIHRoZSBwZG9tT3JkZXIsIHdpdGggdGhlIGFib3ZlIGxpc3Qgb2Ygbm9kZXMgcGxhY2VkXHJcbiAgICogaW4gYXQgdGhlIGxvY2F0aW9uIG9mIHRoZSBwbGFjZWhvbGRlci4gSWYgdGhlcmUgaXMgbm8gcGxhY2Vob2xkZXIsIGl0IGFjdHMgbGlrZSBhIHBsYWNlaG9sZGVyIHdhcyB0aGUgbGFzdFxyXG4gICAqIGVsZW1lbnQgb2YgdGhlIHBkb21PcmRlciAoc2VlIHNldFBET01PcmRlciBmb3IgbW9yZSBkb2N1bWVudGF0aW9uIGluZm9ybWF0aW9uKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHlvdSBzcGVjaWZ5IGEgY2hpbGQgaW4gdGhlIHBkb21PcmRlciwgaXQgd2lsbCBOT1QgYmUgZG91YmxlLWluY2x1ZGVkIChzaW5jZSBpdCB3aWxsIGhhdmUgYW5cclxuICAgKiBQRE9NIHBhcmVudCkuXHJcbiAgICpcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RWZmZWN0aXZlQ2hpbGRyZW4oKTogTm9kZVtdIHtcclxuICAgIC8vIEZpbmQgYWxsIGNoaWxkcmVuIHdpdGhvdXQgUERPTSBwYXJlbnRzLlxyXG4gICAgY29uc3Qgbm9uT3JkZXJlZENoaWxkcmVuID0gW107XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkuX2NoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBjaGlsZCA9ICggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKS5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgIGlmICggIWNoaWxkLl9wZG9tUGFyZW50ICkge1xyXG4gICAgICAgIG5vbk9yZGVyZWRDaGlsZHJlbi5wdXNoKCBjaGlsZCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3ZlcnJpZGUgdGhlIG9yZGVyLCBhbmQgcmVwbGFjZSB0aGUgcGxhY2Vob2xkZXIgaWYgaXQgZXhpc3RzLlxyXG4gICAgaWYgKCB0aGlzLmhhc1BET01PcmRlcigpICkge1xyXG4gICAgICBjb25zdCBlZmZlY3RpdmVDaGlsZHJlbiA9IHRoaXMucGRvbU9yZGVyIS5zbGljZSgpO1xyXG5cclxuICAgICAgY29uc3QgcGxhY2Vob2xkZXJJbmRleCA9IGVmZmVjdGl2ZUNoaWxkcmVuLmluZGV4T2YoIG51bGwgKTtcclxuXHJcbiAgICAgIC8vIElmIHdlIGhhdmUgYSBwbGFjZWhvbGRlciwgcmVwbGFjZSBpdHMgY29udGVudCB3aXRoIHRoZSBjaGlsZHJlblxyXG4gICAgICBpZiAoIHBsYWNlaG9sZGVySW5kZXggPj0gMCApIHtcclxuICAgICAgICAvLyBmb3IgZWZmaWNpZW5jeVxyXG4gICAgICAgIG5vbk9yZGVyZWRDaGlsZHJlbi51bnNoaWZ0KCBwbGFjZWhvbGRlckluZGV4LCAxICk7XHJcblxyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBUT0RPOiBiZXN0IHdheSB0byB0eXBlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoIGVmZmVjdGl2ZUNoaWxkcmVuLCBub25PcmRlcmVkQ2hpbGRyZW4gKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBPdGhlcndpc2UsIGp1c3QgYWRkIHRoZSBub3JtYWwgdGhpbmdzIGF0IHRoZSBlbmRcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGVmZmVjdGl2ZUNoaWxkcmVuLCBub25PcmRlcmVkQ2hpbGRyZW4gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGVmZmVjdGl2ZUNoaWxkcmVuIGFzIE5vZGVbXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbm9uT3JkZXJlZENoaWxkcmVuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gb3VyIHBkb21WaXNpYmxlIFByb3BlcnR5IGNoYW5nZXMgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25QZG9tVmlzaWJsZVByb3BlcnR5Q2hhbmdlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5fcGRvbURpc3BsYXlzSW5mby5vblBET01WaXNpYmlsaXR5Q2hhbmdlKCB2aXNpYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgUHJvcGVydHkgb3VyIHBkb21WaXNpYmxlUHJvcGVydHkgaXMgYmFja2VkIGJ5LCBzbyB0aGF0IGNoYW5nZXMgdG8gdGhpcyBwcm92aWRlZCBQcm9wZXJ0eSB3aWxsIGNoYW5nZSB0aGlzXHJcbiAgICogTm9kZSdzIHBkb20gdmlzaWJpbGl0eSwgYW5kIHZpY2UgdmVyc2EuIFRoaXMgZG9lcyBub3QgY2hhbmdlIHRoaXMuX3Bkb21WaXNpYmxlUHJvcGVydHkuIFNlZSBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LnNldFRhcmdldFByb3BlcnR5KClcclxuICAgKiBmb3IgbW9yZSBpbmZvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQZG9tVmlzaWJsZVByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApOiB0aGlzIHtcclxuICAgIHRoaXMuX3Bkb21WaXNpYmxlUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFBkb21WaXNpYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcGRvbVZpc2libGVQcm9wZXJ0eSggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0UGRvbVZpc2libGVQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRQZG9tVmlzaWJsZVByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBkb21WaXNpYmxlUHJvcGVydHkoKTogVFByb3BlcnR5PGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmdldFBkb21WaXNpYmxlUHJvcGVydHkoKTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhpcyBOb2RlJ3MgcGRvbVZpc2libGVQcm9wZXJ0eS4gU2VlIE5vZGUuZ2V0VmlzaWJsZVByb3BlcnR5IGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBkb21WaXNpYmxlUHJvcGVydHkoKTogVFByb3BlcnR5PGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLl9wZG9tVmlzaWJsZVByb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZSBjb21wbGV0ZWx5IGZyb20gYSBzY3JlZW4gcmVhZGVyIGFuZCB0aGUgYnJvd3NlciBieSBzZXR0aW5nIHRoZSBoaWRkZW4gYXR0cmlidXRlIG9uIHRoZSBub2RlJ3NcclxuICAgKiByZXByZXNlbnRhdGl2ZSBET00gZWxlbWVudC4gSWYgdGhlIHNpYmxpbmcgRE9NIEVsZW1lbnRzIGhhdmUgYSBjb250YWluZXIgcGFyZW50LCB0aGUgY29udGFpbmVyXHJcbiAgICogc2hvdWxkIGJlIGhpZGRlbiBzbyB0aGF0IGFsbCBQRE9NIGVsZW1lbnRzIGFyZSBoaWRkZW4gYXMgd2VsbC4gIEhpZGluZyB0aGUgZWxlbWVudCB3aWxsIHJlbW92ZSBpdCBmcm9tIHRoZSBmb2N1c1xyXG4gICAqIG9yZGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQRE9NVmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHRoaXMucGRvbVZpc2libGVQcm9wZXJ0eS52YWx1ZSA9IHZpc2libGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHBkb21WaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICkgeyB0aGlzLnNldFBET01WaXNpYmxlKCB2aXNpYmxlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBwZG9tVmlzaWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXNQRE9NVmlzaWJsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB3aGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUncyByZXByZXNlbnRhdGl2ZSBET00gZWxlbWVudCBpcyB2aXNpYmxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1BET01WaXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucGRvbVZpc2libGVQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBhbnkgb2YgdGhlIFBET01JbnN0YW5jZXMgZm9yIHRoZSBOb2RlIGFyZSBnbG9iYWxseSB2aXNpYmxlIGFuZCBkaXNwbGF5ZWQgaW4gdGhlIFBET00uIEFcclxuICAgKiBQRE9NSW5zdGFuY2UgaXMgZ2xvYmFsbHkgdmlzaWJsZSBpZiBOb2RlIGFuZCBhbGwgYW5jZXN0b3JzIGFyZSBwZG9tVmlzaWJsZS4gUERPTUluc3RhbmNlIHZpc2liaWxpdHkgaXNcclxuICAgKiB1cGRhdGVkIHN5bmNocm9ub3VzbHksIHNvIHRoaXMgcmV0dXJucyB0aGUgbW9zdCB1cC10by1kYXRlIGluZm9ybWF0aW9uIHdpdGhvdXQgcmVxdWlyaW5nIERpc3BsYXkudXBkYXRlRGlzcGxheVxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1BET01EaXNwbGF5ZWQoKTogYm9vbGVhbiB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5pc0dsb2JhbGx5VmlzaWJsZSgpICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHBkb21EaXNwbGF5ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzUERPTURpc3BsYXllZCgpOyB9XHJcblxyXG4gIHByaXZhdGUgaW52YWxpZGF0ZVBlZXJJbnB1dFZhbHVlKCk6IHZvaWQge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwZWVyID0gdGhpcy5wZG9tSW5zdGFuY2VzWyBpIF0ucGVlciE7XHJcbiAgICAgIHBlZXIub25JbnB1dFZhbHVlQ2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIHZhbHVlIG9mIGFuIGlucHV0IGVsZW1lbnQuICBFbGVtZW50IG11c3QgYmUgYSBmb3JtIGVsZW1lbnQgdG8gc3VwcG9ydCB0aGUgdmFsdWUgYXR0cmlidXRlLiBUaGUgaW5wdXRcclxuICAgKiB2YWx1ZSBpcyBjb252ZXJ0ZWQgdG8gc3RyaW5nIHNpbmNlIGlucHV0IHZhbHVlcyBhcmUgZ2VuZXJhbGx5IHN0cmluZyBmb3IgSFRNTC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0SW5wdXRWYWx1ZSggaW5wdXRWYWx1ZTogUERPTVZhbHVlVHlwZSB8IG51bWJlciB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5fdGFnTmFtZSAmJiBhc3NlcnQoIF8uaW5jbHVkZXMoIEZPUk1fRUxFTUVOVFMsIHRoaXMuX3RhZ05hbWUudG9VcHBlckNhc2UoKSApLCAnZG9tIGVsZW1lbnQgbXVzdCBiZSBhIGZvcm0gZWxlbWVudCB0byBzdXBwb3J0IHZhbHVlJyApO1xyXG5cclxuICAgIGlmICggaW5wdXRWYWx1ZSAhPT0gdGhpcy5faW5wdXRWYWx1ZSApIHtcclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB0aGlzLl9pbnB1dFZhbHVlICkgJiYgIXRoaXMuX2lucHV0VmFsdWUuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICB0aGlzLl9pbnB1dFZhbHVlLnVubGluayggdGhpcy5fb25QRE9NQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xyXG5cclxuICAgICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCBpbnB1dFZhbHVlICkgKSB7XHJcbiAgICAgICAgaW5wdXRWYWx1ZS5sYXp5TGluayggdGhpcy5fb25QRE9NQ29udGVudENoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVBlZXJJbnB1dFZhbHVlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGlucHV0VmFsdWUoIHZhbHVlOiBQRE9NVmFsdWVUeXBlIHwgbnVtYmVyIHwgbnVsbCApIHsgdGhpcy5zZXRJbnB1dFZhbHVlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaW5wdXRWYWx1ZSgpOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0SW5wdXRWYWx1ZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQuIEVsZW1lbnQgbXVzdCBiZSBhIGZvcm0gZWxlbWVudCB0byBzdXBwb3J0IHRoZSB2YWx1ZSBhdHRyaWJ1dGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldElucHV0VmFsdWUoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBsZXQgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGw7XHJcbiAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIHRoaXMuX2lucHV0VmFsdWUgKSApIHtcclxuICAgICAgdmFsdWUgPSB0aGlzLl9pbnB1dFZhbHVlLnZhbHVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHZhbHVlID0gdGhpcy5faW5wdXRWYWx1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCA/IG51bGwgOiAnJyArIHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHdoZXRoZXIgb3Igbm90IHRoZSBjaGVja2VkIGF0dHJpYnV0ZSBhcHBlYXJzIG9uIHRoZSBkb20gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgTm9kZSdzXHJcbiAgICogcGRvbSBjb250ZW50LiAgVGhpcyBpcyBvbmx5IHVzZWZ1bCBmb3IgaW5wdXRzIG9mIHR5cGUgJ3JhZGlvJyBhbmQgJ2NoZWNrYm94Jy4gQSAnY2hlY2tlZCcgaW5wdXRcclxuICAgKiBpcyBjb25zaWRlcmVkIHNlbGVjdGVkIHRvIHRoZSBicm93c2VyIGFuZCBhc3Npc3RpdmUgdGVjaG5vbG9neS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UERPTUNoZWNrZWQoIGNoZWNrZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCB0aGlzLl90YWdOYW1lICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl90YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09IElOUFVUX1RBRywgJ0Nhbm5vdCBzZXQgY2hlY2tlZCBvbiBhIG5vbiBpbnB1dCB0YWcuJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0aGlzLl9pbnB1dFR5cGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIElOUFVUX1RZUEVTX1RIQVRfU1VQUE9SVF9DSEVDS0VELmluY2x1ZGVzKCB0aGlzLl9pbnB1dFR5cGUudG9VcHBlckNhc2UoKSApLCBgaW5wdXRUeXBlIGRvZXMgbm90IHN1cHBvcnQgY2hlY2tlZDogJHt0aGlzLl9pbnB1dFR5cGV9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5fcGRvbUNoZWNrZWQgIT09IGNoZWNrZWQgKSB7XHJcbiAgICAgIHRoaXMuX3Bkb21DaGVja2VkID0gY2hlY2tlZDtcclxuXHJcbiAgICAgIHRoaXMuc2V0UERPTUF0dHJpYnV0ZSggJ2NoZWNrZWQnLCBjaGVja2VkLCB7XHJcbiAgICAgICAgYXNQcm9wZXJ0eTogdHJ1ZVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHBkb21DaGVja2VkKCBjaGVja2VkOiBib29sZWFuICkgeyB0aGlzLnNldFBET01DaGVja2VkKCBjaGVja2VkICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBwZG9tQ2hlY2tlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZ2V0UERPTUNoZWNrZWQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgd2hldGhlciBvciBub3QgdGhlIHBkb20gaW5wdXQgaXMgJ2NoZWNrZWQnLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQRE9NQ2hlY2tlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9wZG9tQ2hlY2tlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbiBhcnJheSBjb250YWluaW5nIGFsbCBwZG9tIGF0dHJpYnV0ZXMgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdG8gdGhpcyBOb2RlJ3MgcHJpbWFyeSBzaWJsaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQRE9NQXR0cmlidXRlcygpOiBQRE9NQXR0cmlidXRlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Bkb21BdHRyaWJ1dGVzLnNsaWNlKCAwICk7IC8vIGRlZmVuc2l2ZSBjb3B5XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHBkb21BdHRyaWJ1dGVzKCk6IFBET01BdHRyaWJ1dGVbXSB7IHJldHVybiB0aGlzLmdldFBET01BdHRyaWJ1dGVzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGEgcGFydGljdWxhciBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgZm9yIHRoaXMgTm9kZSdzIHByaW1hcnkgc2libGluZywgZ2VuZXJhbGx5IHRvIHByb3ZpZGUgZXh0cmEgc2VtYW50aWMgaW5mb3JtYXRpb24gZm9yXHJcbiAgICogYSBzY3JlZW4gcmVhZGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGF0dHJpYnV0ZSAtIHN0cmluZyBuYW1pbmcgdGhlIGF0dHJpYnV0ZVxyXG4gICAqIEBwYXJhbSB2YWx1ZSAtIHRoZSB2YWx1ZSBmb3IgdGhlIGF0dHJpYnV0ZSwgaWYgYm9vbGVhbiwgdGhlbiBpdCB3aWxsIGJlIHNldCBhcyBhIGphdmFzY3JpcHQgcHJvcGVydHkgb24gdGhlIEhUTUxFbGVtZW50IHJhdGhlciB0aGFuIGFuIGF0dHJpYnV0ZVxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQRE9NQXR0cmlidXRlKCBhdHRyaWJ1dGU6IHN0cmluZywgdmFsdWU6IFBET01WYWx1ZVR5cGUgfCBib29sZWFuIHwgbnVtYmVyLCBwcm92aWRlZE9wdGlvbnM/OiBTZXRQRE9NQXR0cmlidXRlT3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgcHJvdmlkZWRPcHRpb25zICYmIGFzc2VydCggT2JqZWN0LmdldFByb3RvdHlwZU9mKCBwcm92aWRlZE9wdGlvbnMgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSxcclxuICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBwZG9tQXR0cmlidXRlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFNldFBET01BdHRyaWJ1dGVPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyB7c3RyaW5nfG51bGx9IC0gSWYgbm9uLW51bGwsIHdpbGwgc2V0IHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWVzcGFjZS4gVGhpcyBjYW4gYmUgcmVxdWlyZWRcclxuICAgICAgLy8gZm9yIHNldHRpbmcgY2VydGFpbiBhdHRyaWJ1dGVzIChlLmcuIE1hdGhNTCkuXHJcbiAgICAgIG5hbWVzcGFjZTogbnVsbCxcclxuXHJcbiAgICAgIC8vIHNldCB0aGUgXCJhdHRyaWJ1dGVcIiBhcyBhIGphdmFzY3JpcHQgcHJvcGVydHkgb24gdGhlIERPTUVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICBhc1Byb3BlcnR5OiBmYWxzZSxcclxuXHJcbiAgICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcgLy8gc2VlIFBET01QZWVyLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlcywgZGVmYXVsdCB0byB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhQVNTT0NJQVRJT05fQVRUUklCVVRFUy5pbmNsdWRlcyggYXR0cmlidXRlICksICdzZXRQRE9NQXR0cmlidXRlIGRvZXMgbm90IHN1cHBvcnQgYXNzb2NpYXRpb24gYXR0cmlidXRlcycgKTtcclxuXHJcbiAgICAvLyBpZiB0aGUgcGRvbSBhdHRyaWJ1dGUgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGxpc3QsIHJlbW92ZSBpdCAtIG5vIG5lZWRcclxuICAgIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBwZWVycywgZXhpc3RpbmcgYXR0cmlidXRlcyB3aWxsIHNpbXBseSBiZSByZXBsYWNlZCBpbiB0aGUgRE9NXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wZG9tQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY3VycmVudEF0dHJpYnV0ZSA9IHRoaXMuX3Bkb21BdHRyaWJ1dGVzWyBpIF07XHJcbiAgICAgIGlmICggY3VycmVudEF0dHJpYnV0ZS5hdHRyaWJ1dGUgPT09IGF0dHJpYnV0ZSAmJlxyXG4gICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGUub3B0aW9ucy5uYW1lc3BhY2UgPT09IG9wdGlvbnMubmFtZXNwYWNlICYmXHJcbiAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZS5vcHRpb25zLmVsZW1lbnROYW1lID09PSBvcHRpb25zLmVsZW1lbnROYW1lICkge1xyXG5cclxuICAgICAgICBpZiAoIGN1cnJlbnRBdHRyaWJ1dGUub3B0aW9ucy5hc1Byb3BlcnR5ID09PSBvcHRpb25zLmFzUHJvcGVydHkgKSB7XHJcbiAgICAgICAgICB0aGlzLl9wZG9tQXR0cmlidXRlcy5zcGxpY2UoIGksIDEgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gU3dhcHBpbmcgYXNQcm9wZXJ0eSBzZXR0aW5nIHN0cmF0ZWdpZXMgc2hvdWxkIHJlbW92ZSB0aGUgYXR0cmlidXRlIHNvIGl0IGNhbiBiZSBzZXQgYXMgYSBwcm9wZXJ0eS5cclxuICAgICAgICAgIHRoaXMucmVtb3ZlUERPTUF0dHJpYnV0ZSggY3VycmVudEF0dHJpYnV0ZS5hdHRyaWJ1dGUsIGN1cnJlbnRBdHRyaWJ1dGUub3B0aW9ucyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBsaXN0ZW5lcjogKCAoIHJhd1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyICkgPT4gdm9pZCApIHwgbnVsbCA9ICggcmF3VmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudW1iZXIgKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiB0eXBlb2YgcmF3VmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbGlkYXRlKCByYXdWYWx1ZSwgVmFsaWRhdGlvbi5TVFJJTkdfV0lUSE9VVF9URU1QTEFURV9WQVJTX1ZBTElEQVRPUiApO1xyXG5cclxuICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgdGhpcy5fcGRvbUluc3RhbmNlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBjb25zdCBwZWVyID0gdGhpcy5fcGRvbUluc3RhbmNlc1sgaiBdLnBlZXIhO1xyXG4gICAgICAgIHBlZXIuc2V0QXR0cmlidXRlVG9FbGVtZW50KCBhdHRyaWJ1dGUsIHJhd1ZhbHVlLCBvcHRpb25zICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYgKCBpc1RSZWFkT25seVByb3BlcnR5KCB2YWx1ZSApICkge1xyXG4gICAgICAvLyBzaG91bGQgcnVuIGl0IG9uY2UgaW5pdGlhbGx5XHJcbiAgICAgIHZhbHVlLmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gcnVuIGl0IG9uY2UgYW5kIHRvc3MgaXQsIHNvIHdlIGRvbid0IG5lZWQgdG8gc3RvcmUgdGhlIHJlZmVyZW5jZSBvciB1bmxpbmsgaXQgbGF0ZXJcclxuICAgICAgbGlzdGVuZXIoIHZhbHVlICk7XHJcbiAgICAgIGxpc3RlbmVyID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9wZG9tQXR0cmlidXRlcy5wdXNoKCB7XHJcbiAgICAgIGF0dHJpYnV0ZTogYXR0cmlidXRlLFxyXG4gICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcclxuICAgICAgb3B0aW9uczogb3B0aW9uc1xyXG4gICAgfSApO1xyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhIHBhcnRpY3VsYXIgYXR0cmlidXRlLCByZW1vdmluZyB0aGUgYXNzb2NpYXRlZCBzZW1hbnRpYyBpbmZvcm1hdGlvbiBmcm9tIHRoZSBET00gZWxlbWVudC5cclxuICAgKlxyXG4gICAqIEl0IGlzIEhJR0hMWSByZWNvbW1lbmRlZCB0aGF0IHlvdSBuZXZlciBjYWxsIHRoaXMgZnVuY3Rpb24gZnJvbSBhbiBhdHRyaWJ1dGUgc2V0IHdpdGggYGFzUHJvcGVydHk6dHJ1ZWAsIHNlZVxyXG4gICAqIHNldFBET01BdHRyaWJ1dGUgZm9yIHRoZSBvcHRpb24gZGV0YWlscy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGUgLSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gcmVtb3ZlXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVBET01BdHRyaWJ1dGUoIGF0dHJpYnV0ZTogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBSZW1vdmVQRE9NQXR0cmlidXRlT3B0aW9ucyApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBwcm92aWRlZE9wdGlvbnMgJiYgYXNzZXJ0KCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHByb3ZpZGVkT3B0aW9ucyApID09PSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIHBkb21BdHRyaWJ1dGUgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UmVtb3ZlUERPTUF0dHJpYnV0ZU9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIHtzdHJpbmd8bnVsbH0gLSBJZiBub24tbnVsbCwgd2lsbCByZW1vdmUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZXNwYWNlLiBUaGlzIGNhbiBiZSByZXF1aXJlZFxyXG4gICAgICAvLyBmb3IgcmVtb3ZpbmcgY2VydGFpbiBhdHRyaWJ1dGVzIChlLmcuIE1hdGhNTCkuXHJcbiAgICAgIG5hbWVzcGFjZTogbnVsbCxcclxuXHJcbiAgICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcgLy8gc2VlIFBET01QZWVyLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlcywgZGVmYXVsdCB0byB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBsZXQgYXR0cmlidXRlUmVtb3ZlZCA9IGZhbHNlO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGRvbUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggdGhpcy5fcGRvbUF0dHJpYnV0ZXNbIGkgXS5hdHRyaWJ1dGUgPT09IGF0dHJpYnV0ZSAmJlxyXG4gICAgICAgICAgIHRoaXMuX3Bkb21BdHRyaWJ1dGVzWyBpIF0ub3B0aW9ucy5uYW1lc3BhY2UgPT09IG9wdGlvbnMubmFtZXNwYWNlICYmXHJcbiAgICAgICAgICAgdGhpcy5fcGRvbUF0dHJpYnV0ZXNbIGkgXS5vcHRpb25zLmVsZW1lbnROYW1lID09PSBvcHRpb25zLmVsZW1lbnROYW1lICkge1xyXG5cclxuICAgICAgICBjb25zdCBvbGRBdHRyaWJ1dGUgPSB0aGlzLl9wZG9tQXR0cmlidXRlc1sgaSBdO1xyXG4gICAgICAgIGlmICggb2xkQXR0cmlidXRlLmxpc3RlbmVyICYmIGlzVFJlYWRPbmx5UHJvcGVydHkoIG9sZEF0dHJpYnV0ZS52YWx1ZSApICYmICFvbGRBdHRyaWJ1dGUudmFsdWUuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICAgIG9sZEF0dHJpYnV0ZS52YWx1ZS51bmxpbmsoIG9sZEF0dHJpYnV0ZS5saXN0ZW5lciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcGRvbUF0dHJpYnV0ZXMuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgYXR0cmlidXRlUmVtb3ZlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGF0dHJpYnV0ZVJlbW92ZWQsIGBOb2RlIGRvZXMgbm90IGhhdmUgcGRvbSBhdHRyaWJ1dGUgJHthdHRyaWJ1dGV9YCApO1xyXG5cclxuICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHRoaXMuX3Bkb21JbnN0YW5jZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgIGNvbnN0IHBlZXIgPSB0aGlzLl9wZG9tSW5zdGFuY2VzWyBqIF0ucGVlciE7XHJcbiAgICAgIHBlZXIucmVtb3ZlQXR0cmlidXRlRnJvbUVsZW1lbnQoIGF0dHJpYnV0ZSwgb3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGFsbCBhdHRyaWJ1dGVzIGZyb20gdGhpcyBub2RlJ3MgZG9tIGVsZW1lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVBET01BdHRyaWJ1dGVzKCk6IHZvaWQge1xyXG5cclxuICAgIC8vIGFsbCBhdHRyaWJ1dGVzIGN1cnJlbnRseSBvbiB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmdcclxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB0aGlzLmdldFBET01BdHRyaWJ1dGVzKCk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1sgaSBdLmF0dHJpYnV0ZTtcclxuICAgICAgdGhpcy5yZW1vdmVQRE9NQXR0cmlidXRlKCBhdHRyaWJ1dGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhIHBhcnRpY3VsYXIgYXR0cmlidXRlLCByZW1vdmluZyB0aGUgYXNzb2NpYXRlZCBzZW1hbnRpYyBpbmZvcm1hdGlvbiBmcm9tIHRoZSBET00gZWxlbWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGUgLSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gcmVtb3ZlXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGhhc1BET01BdHRyaWJ1dGUoIGF0dHJpYnV0ZTogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBIYXNQRE9NQXR0cmlidXRlT3B0aW9ucyApOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBwcm92aWRlZE9wdGlvbnMgJiYgYXNzZXJ0KCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHByb3ZpZGVkT3B0aW9ucyApID09PSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIHBkb21BdHRyaWJ1dGUgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8SGFzUERPTUF0dHJpYnV0ZU9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIHtzdHJpbmd8bnVsbH0gLSBJZiBub24tbnVsbCwgd2lsbCByZW1vdmUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZXNwYWNlLiBUaGlzIGNhbiBiZSByZXF1aXJlZFxyXG4gICAgICAvLyBmb3IgcmVtb3ZpbmcgY2VydGFpbiBhdHRyaWJ1dGVzIChlLmcuIE1hdGhNTCkuXHJcbiAgICAgIG5hbWVzcGFjZTogbnVsbCxcclxuXHJcbiAgICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcgLy8gc2VlIFBET01QZWVyLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlcywgZGVmYXVsdCB0byB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBsZXQgYXR0cmlidXRlRm91bmQgPSBmYWxzZTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3Bkb21BdHRyaWJ1dGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX3Bkb21BdHRyaWJ1dGVzWyBpIF0uYXR0cmlidXRlID09PSBhdHRyaWJ1dGUgJiZcclxuICAgICAgICAgICB0aGlzLl9wZG9tQXR0cmlidXRlc1sgaSBdLm9wdGlvbnMubmFtZXNwYWNlID09PSBvcHRpb25zLm5hbWVzcGFjZSAmJlxyXG4gICAgICAgICAgIHRoaXMuX3Bkb21BdHRyaWJ1dGVzWyBpIF0ub3B0aW9ucy5lbGVtZW50TmFtZSA9PT0gb3B0aW9ucy5lbGVtZW50TmFtZSApIHtcclxuICAgICAgICBhdHRyaWJ1dGVGb3VuZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhdHRyaWJ1dGVGb3VuZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCB0aGUgY2xhc3MgdG8gdGhlIFBET00gZWxlbWVudCdzIGNsYXNzTGlzdC4gVGhlIFBET00gaXMgZ2VuZXJhbGx5IGludmlzaWJsZSxcclxuICAgKiBidXQgc29tZSBzdHlsaW5nIG9jY2FzaW9uYWxseSBoYXMgYW4gaW1wYWN0IG9uIHNlbWFudGljcyBzbyBpdCBpcyBuZWNlc3NhcnkgdG8gc2V0IHN0eWxlcy5cclxuICAgKiBBZGQgYSBjbGFzcyB3aXRoIHRoaXMgZnVuY3Rpb24gYW5kIGRlZmluZSB0aGUgc3R5bGUgaW4gc3R5bGVzaGVldHMgKGxpa2VseSBTY2VuZXJ5U3R5bGUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQRE9NQ2xhc3MoIGNsYXNzTmFtZTogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBTZXRQRE9NQ2xhc3NPcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U2V0UERPTUNsYXNzT3B0aW9ucz4oKSgge1xyXG4gICAgICBlbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSBzZXQgdG8gdGhlIHNpYmxpbmcsIGRvIG5vdGhpbmdcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3Bkb21DbGFzc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBjdXJyZW50Q2xhc3MgPSB0aGlzLl9wZG9tQ2xhc3Nlc1sgaSBdO1xyXG4gICAgICBpZiAoIGN1cnJlbnRDbGFzcy5jbGFzc05hbWUgPT09IGNsYXNzTmFtZSAmJiBjdXJyZW50Q2xhc3Mub3B0aW9ucy5lbGVtZW50TmFtZSA9PT0gb3B0aW9ucy5lbGVtZW50TmFtZSApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9wZG9tQ2xhc3Nlcy5wdXNoKCB7IGNsYXNzTmFtZTogY2xhc3NOYW1lLCBvcHRpb25zOiBvcHRpb25zIH0gKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICBjb25zdCBwZWVyID0gdGhpcy5fcGRvbUluc3RhbmNlc1sgaiBdLnBlZXIhO1xyXG4gICAgICBwZWVyLnNldENsYXNzVG9FbGVtZW50KCBjbGFzc05hbWUsIG9wdGlvbnMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhIGNsYXNzIGZyb20gdGhlIGNsYXNzTGlzdCBvZiBvbmUgb2YgdGhlIGVsZW1lbnRzIGZvciB0aGlzIE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVBET01DbGFzcyggY2xhc3NOYW1lOiBzdHJpbmcsIHByb3ZpZGVkT3B0aW9ucz86IFJlbW92ZVBET01DbGFzc09wdGlvbnMgKTogdm9pZCB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxSZW1vdmVQRE9NQ2xhc3NPcHRpb25zPigpKCB7XHJcbiAgICAgIGVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcgLy8gc2VlIFBET01QZWVyLmdldEVsZW1lbnROYW1lKCkgZm9yIHZhbGlkIHZhbHVlcywgZGVmYXVsdCB0byB0aGUgcHJpbWFyeSBzaWJsaW5nXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBsZXQgY2xhc3NSZW1vdmVkID0gZmFsc2U7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wZG9tQ2xhc3Nlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCB0aGlzLl9wZG9tQ2xhc3Nlc1sgaSBdLmNsYXNzTmFtZSA9PT0gY2xhc3NOYW1lICYmXHJcbiAgICAgICAgICAgdGhpcy5fcGRvbUNsYXNzZXNbIGkgXS5vcHRpb25zLmVsZW1lbnROYW1lID09PSBvcHRpb25zLmVsZW1lbnROYW1lICkge1xyXG4gICAgICAgIHRoaXMuX3Bkb21DbGFzc2VzLnNwbGljZSggaSwgMSApO1xyXG4gICAgICAgIGNsYXNzUmVtb3ZlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNsYXNzUmVtb3ZlZCwgYE5vZGUgZG9lcyBub3QgaGF2ZSBwZG9tIGF0dHJpYnV0ZSAke2NsYXNzTmFtZX1gICk7XHJcblxyXG4gICAgZm9yICggbGV0IGogPSAwOyBqIDwgdGhpcy5fcGRvbUNsYXNzZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgIGNvbnN0IHBlZXIgPSB0aGlzLnBkb21JbnN0YW5jZXNbIGogXS5wZWVyITtcclxuICAgICAgcGVlci5yZW1vdmVDbGFzc0Zyb21FbGVtZW50KCBjbGFzc05hbWUsIG9wdGlvbnMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgbGlzdCBvZiBjbGFzc2VzIGFzc2lnbmVkIHRvIFBET00gZWxlbWVudHMgZm9yIHRoaXMgTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UERPTUNsYXNzZXMoKTogUERPTUNsYXNzW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Bkb21DbGFzc2VzLnNsaWNlKCAwICk7IC8vIGRlZmVuc2l2ZSBjb3B5XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHBkb21DbGFzc2VzKCk6IFBET01DbGFzc1tdIHsgcmV0dXJuIHRoaXMuZ2V0UERPTUNsYXNzZXMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlIHRoZSBET00gZWxlbWVudCBleHBsaWNpdGx5IGZvY3VzYWJsZSB3aXRoIGEgdGFiIGluZGV4LiBOYXRpdmUgSFRNTCBmb3JtIGVsZW1lbnRzIHdpbGwgZ2VuZXJhbGx5IGJlIGluXHJcbiAgICogdGhlIG5hdmlnYXRpb24gb3JkZXIgd2l0aG91dCBleHBsaWNpdGx5IHNldHRpbmcgZm9jdXNhYmxlLiAgSWYgdGhlc2UgbmVlZCB0byBiZSByZW1vdmVkIGZyb20gdGhlIG5hdmlnYXRpb25cclxuICAgKiBvcmRlciwgY2FsbCBzZXRGb2N1c2FibGUoIGZhbHNlICkuICBSZW1vdmluZyBhbiBlbGVtZW50IGZyb20gdGhlIGZvY3VzIG9yZGVyIGRvZXMgbm90IGhpZGUgdGhlIGVsZW1lbnQgZnJvbVxyXG4gICAqIGFzc2lzdGl2ZSB0ZWNobm9sb2d5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGZvY3VzYWJsZSAtIG51bGwgdG8gdXNlIHRoZSBkZWZhdWx0IGJyb3dzZXIgZm9jdXMgZm9yIHRoZSBwcmltYXJ5IGVsZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rm9jdXNhYmxlKCBmb2N1c2FibGU6IGJvb2xlYW4gfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZm9jdXNhYmxlID09PSBudWxsIHx8IHR5cGVvZiBmb2N1c2FibGUgPT09ICdib29sZWFuJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fZm9jdXNhYmxlT3ZlcnJpZGUgIT09IGZvY3VzYWJsZSApIHtcclxuICAgICAgdGhpcy5fZm9jdXNhYmxlT3ZlcnJpZGUgPSBmb2N1c2FibGU7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wZG9tSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG5cclxuICAgICAgICAvLyBhZnRlciB0aGUgb3ZlcnJpZGUgaXMgc2V0LCB1cGRhdGUgdGhlIGZvY3VzYWJpbGl0eSBvZiB0aGUgcGVlciBiYXNlZCBvbiB0aGlzIG5vZGUncyB2YWx1ZSBmb3IgZm9jdXNhYmxlXHJcbiAgICAgICAgLy8gd2hpY2ggbWF5IGJlIHRydWUgb3IgZmFsc2UgKGJ1dCBub3QgbnVsbClcclxuICAgICAgICAvLyBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5mb2N1c2FibGUgPT09ICdib29sZWFuJyApO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyLCAnUGVlciByZXF1aXJlZCB0byBzZXQgZm9jdXNhYmxlLicgKTtcclxuICAgICAgICB0aGlzLl9wZG9tSW5zdGFuY2VzWyBpIF0ucGVlciEuc2V0Rm9jdXNhYmxlKCB0aGlzLmZvY3VzYWJsZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGZvY3VzYWJsZSggaXNGb2N1c2FibGU6IGJvb2xlYW4gfCBudWxsICkgeyB0aGlzLnNldEZvY3VzYWJsZSggaXNGb2N1c2FibGUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvY3VzYWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXNGb2N1c2FibGUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgd2hldGhlciBvciBub3QgdGhlIG5vZGUgaXMgZm9jdXNhYmxlLiBVc2UgdGhlIGZvY3VzT3ZlcnJpZGUsIGFuZCB0aGVuIGRlZmF1bHQgdG8gYnJvd3NlciBkZWZpbmVkXHJcbiAgICogZm9jdXNhYmxlIGVsZW1lbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0ZvY3VzYWJsZSgpOiBib29sZWFuIHtcclxuICAgIGlmICggdGhpcy5fZm9jdXNhYmxlT3ZlcnJpZGUgIT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9mb2N1c2FibGVPdmVycmlkZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSBpc24ndCBhIHRhZ05hbWUgeWV0LCB0aGVuIHRoZXJlIGlzbid0IGFuIGVsZW1lbnQsIHNvIHdlIGFyZW4ndCBmb2N1c2FibGUuIFRvIHN1cHBvcnQgb3B0aW9uIG9yZGVyLlxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX3RhZ05hbWUgPT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gUERPTVV0aWxzLnRhZ0lzRGVmYXVsdEZvY3VzYWJsZSggdGhpcy5fdGFnTmFtZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc291cmNlIE5vZGUgdGhhdCBjb250cm9scyBwb3NpdGlvbmluZyBvZiB0aGUgcHJpbWFyeSBzaWJsaW5nLiBUcmFuc2Zvcm1zIGFsb25nIHRoZSB0cmFpbCB0byB0aGlzXHJcbiAgICogbm9kZSBhcmUgb2JzZXJ2ZWQgc28gdGhhdCB0aGUgcHJpbWFyeSBzaWJsaW5nIGlzIHBvc2l0aW9uZWQgY29ycmVjdGx5IGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIFRoZSB0cmFuc2Zvcm1Tb3VyY2VOb2RlIGNhbm5vdCB1c2UgREFHIGZvciBub3cgYmVjYXVzZSB3ZSBuZWVkIGEgdW5pcXVlIHRyYWlsIHRvIG9ic2VydmUgdHJhbnNmb3Jtcy5cclxuICAgKlxyXG4gICAqIEJ5IGRlZmF1bHQsIHRyYW5zZm9ybXMgYWxvbmcgdHJhaWxzIHRvIGFsbCBvZiB0aGlzIE5vZGUncyBQRE9NSW5zdGFuY2VzIGFyZSBvYnNlcnZlZC4gQnV0IHRoaXNcclxuICAgKiBmdW5jdGlvbiBjYW4gYmUgdXNlZCBpZiB5b3UgaGF2ZSBhIHZpc3VhbCBOb2RlIHJlcHJlc2VudGVkIGluIHRoZSBQRE9NIGJ5IGEgZGlmZmVyZW50IE5vZGUgaW4gdGhlIHNjZW5lXHJcbiAgICogZ3JhcGggYnV0IHN0aWxsIG5lZWQgdGhlIG90aGVyIE5vZGUncyBQRE9NIGNvbnRlbnQgcG9zaXRpb25lZCBvdmVyIHRoZSB2aXN1YWwgbm9kZS4gRm9yIGV4YW1wbGUsIHRoaXMgY291bGRcclxuICAgKiBiZSByZXF1aXJlZCB0byBjYXRjaCBhbGwgZmFrZSBwb2ludGVyIGV2ZW50cyB0aGF0IG1heSBjb21lIGZyb20gY2VydGFpbiB0eXBlcyBvZiBzY3JlZW4gcmVhZGVycy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUoIG5vZGU6IE5vZGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgdGhpcy5fcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUgPSBub2RlO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3Bkb21JbnN0YW5jZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyIS5zZXRQRE9NVHJhbnNmb3JtU291cmNlTm9kZSggdGhpcy5fcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUoIG5vZGU6IE5vZGUgfCBudWxsICkgeyB0aGlzLnNldFBET01UcmFuc2Zvcm1Tb3VyY2VOb2RlKCBub2RlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBwZG9tVHJhbnNmb3JtU291cmNlTm9kZSgpOiBOb2RlIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFBET01UcmFuc2Zvcm1Tb3VyY2VOb2RlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBzb3VyY2UgTm9kZSB0aGF0IGNvbnRyb2xzIHBvc2l0aW9uaW5nIG9mIHRoZSBwcmltYXJ5IHNpYmxpbmcgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLiBTZWVcclxuICAgKiBzZXRQRE9NVHJhbnNmb3JtU291cmNlTm9kZSBmb3IgbW9yZSBpbiBkZXB0aCBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUoKTogTm9kZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Bkb21UcmFuc2Zvcm1Tb3VyY2VOb2RlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCBieSB0aGUgYW5pbWF0ZWRQYW5ab29tU2luZ2xldG9uLiBJdCB3aWxsIHRyeSB0byBrZWVwIHRoZXNlIGJvdW5kcyB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydCB3aGVuIHRoaXMgTm9kZVxyXG4gICAqIChvciBhbnkgYW5jZXN0b3IpIGhhcyBhIHRyYW5zZm9ybSBjaGFuZ2Ugd2hpbGUgZm9jdXNlZC4gVGhpcyBpcyB1c2VmdWwgaWYgdGhlIGJvdW5kcyBvZiB5b3VyIGZvY3VzYWJsZVxyXG4gICAqIE5vZGUgZG8gbm90IGFjY3VyYXRlbHkgc3Vycm91bmQgdGhlIGNvbmNlcHR1YWwgaW50ZXJhY3RpdmUgY29tcG9uZW50LiBJZiBudWxsLCB0aGlzIE5vZGUncyBsb2NhbCBib3VuZHNcclxuICAgKiBhcmUgdXNlZC5cclxuICAgKlxyXG4gICAqIEF0IHRoaXMgdGltZSwgdGhlIFByb3BlcnR5IGNhbm5vdCBiZSBjaGFuZ2VkIGFmdGVyIGl0IGlzIHNldC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSggYm91bmRzUHJvcGVydHk6IG51bGwgfCBUUmVhZE9ubHlQcm9wZXJ0eTxCb3VuZHMyPiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBXZSBtYXkgY2FsbCB0aGlzIG1vcmUgdGhhbiBvbmNlIHdpdGggbXV0YXRlXHJcbiAgICBpZiAoIGJvdW5kc1Byb3BlcnR5ICE9PSB0aGlzLl9mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5ICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5fZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSwgJ0Nhbm5vdCBjaGFuZ2UgZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSBhZnRlciBpdCBpcyBzZXQuJyApO1xyXG4gICAgICB0aGlzLl9mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5ID0gYm91bmRzUHJvcGVydHk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgZ2xvYmFsIGJvdW5kcyB0byBrZWVwIGluIHRoZSB2aWV3cG9ydCB3aGlsZSB0aGUgY29tcG9uZW50IGhhcyBmb2N1cywgc2VlIHRoZVxyXG4gICAqIHNldEZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkgZnVuY3Rpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkoKTogbnVsbCB8IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczI+IHtcclxuICAgIHJldHVybiB0aGlzLl9mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBmb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5KCBib3VuZHNQcm9wZXJ0eTogbnVsbCB8IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczI+ICkge1xyXG4gICAgdGhpcy5zZXRGb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5KCBib3VuZHNQcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBmb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5KCk6IG51bGwgfCBUUmVhZE9ubHlQcm9wZXJ0eTxCb3VuZHMyPiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRGb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gdGhhdCB0aGUgZ2xvYmFsIEFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyIHdpbGwgcGFuIHdoaWxlIGludGVyYWN0aW5nIHdpdGggdGhpcyBOb2RlLiBQYW4gd2lsbCBPTkxZXHJcbiAgICogb2NjdXIgaW4gdGhpcyBkaW1lbnNpb24uIFRoaXMgaXMgZXNwZWNpYWxseSB1c2VmdWwgZm9yIHBhbm5pbmcgdG8gbGFyZ2UgTm9kZXMgd2hlcmUgcGFubmluZyB0byB0aGUgY2VudGVyIG9mIHRoZVxyXG4gICAqIE5vZGUgd291bGQgbW92ZSBvdGhlciBOb2RlcyBvdXQgb2YgdGhlIHZpZXdwb3J0LlxyXG4gICAqXHJcbiAgICogU2V0IHRvIG51bGwgZm9yIGRlZmF1bHQgYmVoYXZpb3IgKHBhbm5pbmcgaW4gYWxsIGRpcmVjdGlvbnMpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMaW1pdFBhbkRpcmVjdGlvbiggbGltaXRQYW5EaXJlY3Rpb246IExpbWl0UGFuRGlyZWN0aW9uIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIHRoaXMuX2xpbWl0UGFuRGlyZWN0aW9uID0gbGltaXRQYW5EaXJlY3Rpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TGltaXRQYW5EaXJlY3Rpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldExpbWl0UGFuRGlyZWN0aW9uKCk6IExpbWl0UGFuRGlyZWN0aW9uIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGltaXRQYW5EaXJlY3Rpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TGltaXRQYW5EaXJlY3Rpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICogQHBhcmFtIGxpbWl0UGFuRGlyZWN0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBsaW1pdFBhbkRpcmVjdGlvbiggbGltaXRQYW5EaXJlY3Rpb246IExpbWl0UGFuRGlyZWN0aW9uICkge1xyXG4gICAgdGhpcy5zZXRMaW1pdFBhbkRpcmVjdGlvbiggbGltaXRQYW5EaXJlY3Rpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMaW1pdFBhbkRpcmVjdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxpbWl0UGFuRGlyZWN0aW9uKCk6IExpbWl0UGFuRGlyZWN0aW9uIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMaW1pdFBhbkRpcmVjdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIHRoZSBQRE9NIHNpYmxpbmcgZWxlbWVudHMgYXJlIHBvc2l0aW9uZWQgaW4gdGhlIGNvcnJlY3QgcGxhY2UgaW4gdGhlIHZpZXdwb3J0LiBEb2luZyBzbyBpcyBhXHJcbiAgICogcmVxdWlyZW1lbnQgZm9yIGN1c3RvbSBnZXN0dXJlcyBvbiB0b3VjaCBiYXNlZCBzY3JlZW4gcmVhZGVycy4gSG93ZXZlciwgZG9pbmcgdGhpcyBET00gbGF5b3V0IGlzIGV4cGVuc2l2ZSBzb1xyXG4gICAqIG9ubHkgZG8gdGhpcyB3aGVuIG5lY2Vzc2FyeS4gR2VuZXJhbGx5IG9ubHkgbmVlZGVkIGZvciBlbGVtZW50cyB0aGF0IHV0aWxpemUgYSBcImRvdWJsZSB0YXAgYW5kIGhvbGRcIiBnZXN0dXJlXHJcbiAgICogdG8gZHJhZyBhbmQgZHJvcC5cclxuICAgKlxyXG4gICAqIFBvc2l0aW9uaW5nIHRoZSBQRE9NIGVsZW1lbnQgd2lsbCBjYXVzZWQgc29tZSBzY3JlZW4gcmVhZGVycyB0byBzZW5kIGJvdGggY2xpY2sgYW5kIHBvaW50ZXIgZXZlbnRzIHRvIHRoZVxyXG4gICAqIGxvY2F0aW9uIG9mIHRoZSBOb2RlIGluIGdsb2JhbCBjb29yZGluYXRlcy4gRG8gbm90IHBvc2l0aW9uIGVsZW1lbnRzIHRoYXQgdXNlIGNsaWNrIGxpc3RlbmVycyBzaW5jZSBhY3RpdmF0aW9uXHJcbiAgICogd2lsbCBmaXJlIHR3aWNlIChvbmNlIGZvciB0aGUgcG9pbnRlciBldmVudCBsaXN0ZW5lcnMgYW5kIG9uY2UgZm9yIHRoZSBjbGljayBldmVudCBsaXN0ZW5lcnMpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQb3NpdGlvbkluUERPTSggcG9zaXRpb25JblBET006IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB0aGlzLl9wb3NpdGlvbkluUERPTSA9IHBvc2l0aW9uSW5QRE9NO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3Bkb21JbnN0YW5jZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuX3Bkb21JbnN0YW5jZXNbIGkgXS5wZWVyIS5zZXRQb3NpdGlvbkluUERPTSggcG9zaXRpb25JblBET00gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcG9zaXRpb25JblBET00oIHBvc2l0aW9uSW5QRE9NOiBib29sZWFuICkgeyB0aGlzLnNldFBvc2l0aW9uSW5QRE9NKCBwb3NpdGlvbkluUERPTSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcG9zaXRpb25JblBET00oKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldFBvc2l0aW9uSW5QRE9NKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgcG9zaXRpb25pbmcgdGhlIFBET00gc2libGluZyBlbGVtZW50cy4gU2VlIHNldFBvc2l0aW9uSW5QRE9NKCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBvc2l0aW9uSW5QRE9NKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uSW5QRE9NO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgdXNlZCBzcGFyaW5nbHkgYXMgYSB3b3JrYXJvdW5kLiBJZiB1c2VkLCBhbnkgRE9NIGlucHV0IGV2ZW50cyByZWNlaXZlZCBmcm9tIHRoZSBsYWJlbFxyXG4gICAqIHNpYmxpbmcgd2lsbCBub3QgYmUgZGlzcGF0Y2hlZCBhcyBTY2VuZXJ5RXZlbnRzIGluIElucHV0LmpzLiBUaGUgbGFiZWwgc2libGluZyBtYXkgcmVjZWl2ZSBpbnB1dCBieSBzY3JlZW5cclxuICAgKiByZWFkZXJzIGlmIHRoZSB2aXJ0dWFsIGN1cnNvciBpcyBvdmVyIGl0LiBUaGF0IGlzIHVzdWFsbHkgZmluZSwgYnV0IHRoZXJlIGlzIGEgYnVnIHdpdGggTlZEQSBhbmQgRmlyZWZveCB3aGVyZVxyXG4gICAqIGJvdGggdGhlIGxhYmVsIHNpYmxpbmcgQU5EIHByaW1hcnkgc2libGluZyByZWNlaXZlIGV2ZW50cyBpbiB0aGlzIGNhc2UsIGFuZCBib3RoIGJ1YmJsZSB1cCB0byB0aGUgcm9vdCBvZiB0aGVcclxuICAgKiBQRE9NLCBhbmQgc28gd2Ugd291bGQgb3RoZXJ3aXNlIGRpc3BhdGNoIHR3byBTY2VuZXJ5RXZlbnRzIGluc3RlYWQgb2Ygb25lLlxyXG4gICAqXHJcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hMTF5LXJlc2VhcmNoL2lzc3Vlcy8xNTYgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHNldEV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLmV4Y2x1ZGVMYWJlbFNpYmxpbmdGcm9tSW5wdXQgPSB0cnVlO1xyXG4gICAgdGhpcy5vblBET01Db250ZW50Q2hhbmdlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIE5vZGUgaXMgYSBQaEVULWlPIGFyY2hldHlwZSBvciBpdCBpcyBhIE5vZGUgZGVzY2VuZGFudCBvZiBhIFBoRVQtaU8gYXJjaGV0eXBlLlxyXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzgxN1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0luc2lkZVBoZXRpb0FyY2hldHlwZSggbm9kZTogTm9kZSA9ICggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKSApOiBib29sZWFuIHtcclxuICAgIGlmICggbm9kZS5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG4gICAgICByZXR1cm4gbm9kZS5waGV0aW9Jc0FyY2hldHlwZTtcclxuICAgIH1cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG5vZGUucGFyZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCB0aGlzLmlzSW5zaWRlUGhldGlvQXJjaGV0eXBlKCBub2RlLnBhcmVudHNbIGkgXSApICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGVydCBvbiBhbGwgaW50ZXJhY3RpdmUgZGVzY3JpcHRpb24gdXR0ZXJhbmNlUXVldWVzIGxvY2F0ZWQgb24gZWFjaCBjb25uZWN0ZWQgRGlzcGxheS4gU2VlXHJcbiAgICogTm9kZS5nZXRDb25uZWN0ZWREaXNwbGF5cy4gTm90ZSB0aGF0IGlmIHlvdXIgTm9kZSBpcyBub3QgY29ubmVjdGVkIHRvIGEgRGlzcGxheSwgdGhpcyBmdW5jdGlvbiB3aWxsIGhhdmVcclxuICAgKiBubyBlZmZlY3QuXHJcbiAgICovXHJcbiAgcHVibGljIGFsZXJ0RGVzY3JpcHRpb25VdHRlcmFuY2UoIHV0dGVyYW5jZTogVEFsZXJ0YWJsZSApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBObyBkZXNjcmlwdGlvbiBzaG91bGQgYmUgYWxlcnRlZCBpZiBzZXR0aW5nIFBoRVQtaU8gc3RhdGUsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTM5N1xyXG4gICAgaWYgKCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm8gZGVzY3JpcHRpb24gc2hvdWxkIGJlIGFsZXJ0ZWQgaWYgYW4gYXJjaGV0eXBlIG9mIGEgUGhFVC1pTyBkeW5hbWljIGVsZW1lbnQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzgxN1xyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNJbnNpZGVQaGV0aW9BcmNoZXR5cGUoKSApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbm5lY3RlZERpc3BsYXlzID0gKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApLmdldENvbm5lY3RlZERpc3BsYXlzKCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjb25uZWN0ZWREaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgZGlzcGxheSA9IGNvbm5lY3RlZERpc3BsYXlzWyBpIF07XHJcbiAgICAgIGlmICggZGlzcGxheS5pc0FjY2Vzc2libGUoKSApIHtcclxuXHJcbiAgICAgICAgLy8gRG9uJ3QgdXNlIGBmb3JFYWNoVXR0ZXJhbmNlYCB0byBwcmV2ZW50IGNyZWF0aW5nIGEgY2xvc3VyZSBmb3IgZWFjaCB1c2FnZSBvZiB0aGlzIGZ1bmN0aW9uXHJcbiAgICAgICAgZGlzcGxheS5kZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggdXR0ZXJhbmNlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGx5IGEgY2FsbGJhY2sgb24gZWFjaCB1dHRlcmFuY2VRdWV1ZSB0aGF0IHRoaXMgTm9kZSBoYXMgYSBjb25uZWN0aW9uIHRvICh2aWEgRGlzcGxheSkuIE5vdGUgdGhhdCBvbmx5XHJcbiAgICogYWNjZXNzaWJsZSBEaXNwbGF5cyBoYXZlIHV0dGVyYW5jZVF1ZXVlcyB0aGF0IHRoaXMgZnVuY3Rpb24gd2lsbCBpbnRlcmZhY2Ugd2l0aC5cclxuICAgKi9cclxuICBwdWJsaWMgZm9yRWFjaFV0dGVyYW5jZVF1ZXVlKCBjYWxsYmFjazogKCBxdWV1ZTogVXR0ZXJhbmNlUXVldWUgKSA9PiB2b2lkICk6IHZvaWQge1xyXG4gICAgY29uc3QgY29ubmVjdGVkRGlzcGxheXMgPSAoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkuZ2V0Q29ubmVjdGVkRGlzcGxheXMoKTtcclxuXHJcbiAgICAvLyBJZiB5b3UgcnVuIGludG8gdGhpcyBhc3NlcnRpb24sIHRhbGsgdG8gQGplc3NlZ3JlZW5iZXJnIGFuZCBAemVwdW1waCwgYmVjYXVzZSBpdCBpcyBxdWl0ZSBwb3NzaWJsZSB3ZSB3b3VsZFxyXG4gICAgLy8gcmVtb3ZlIHRoaXMgYXNzZXJ0aW9uIGZvciB5b3VyIGNhc2UuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjb25uZWN0ZWREaXNwbGF5cy5sZW5ndGggPiAwLFxyXG4gICAgICAnbXVzdCBiZSBjb25uZWN0ZWQgdG8gYSBkaXNwbGF5IHRvIHVzZSBVdHRlcmFuY2VRdWV1ZSBmZWF0dXJlcycgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjb25uZWN0ZWREaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgZGlzcGxheSA9IGNvbm5lY3RlZERpc3BsYXlzWyBpIF07XHJcbiAgICAgIGlmICggZGlzcGxheS5pc0FjY2Vzc2libGUoKSApIHtcclxuICAgICAgICBjYWxsYmFjayggZGlzcGxheS5kZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICAvLyBTQ0VORVJZLUlOVEVSTkFMIEFORCBQUklWQVRFIE1FVEhPRFNcclxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gZ2V0IGEgbGlzdCBvZiBhbGwgc2V0dGFibGUgb3B0aW9ucyBhbmQgdGhlaXIgY3VycmVudCB2YWx1ZXMuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBrZXlzIGFyZSBhbGwgYWNjZXNzaWJpbGl0eSBvcHRpb24ga2V5cywgYW5kIHRoZSB2YWx1ZXMgYXJlIHRoZSB2YWx1ZXMgb2YgdGhvc2UgcHJvcGVydGllc1xyXG4gICAqIG9uIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QmFzZU9wdGlvbnMoKTogUGFyYWxsZWxET01PcHRpb25zIHtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50T3B0aW9uczogUGFyYWxsZWxET01PcHRpb25zID0ge307XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgQUNDRVNTSUJJTElUWV9PUFRJT05fS0VZUy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IEFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVNbIGkgXTtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBOb3Qgc3VyZSBvZiBhIGdyZWF0IHdheSB0byBkbyB0aGlzXHJcbiAgICAgIGN1cnJlbnRPcHRpb25zWyBvcHRpb25OYW1lIF0gPSB0aGlzWyBvcHRpb25OYW1lIF07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGN1cnJlbnRPcHRpb25zO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlY3Vyc2l2ZSBkYXRhIHN0cnVjdHVyZSB0aGF0IHJlcHJlc2VudHMgdGhlIG5lc3RlZCBvcmRlcmluZyBvZiBwZG9tIGNvbnRlbnQgZm9yIHRoaXMgTm9kZSdzXHJcbiAgICogc3VidHJlZS4gRWFjaCBcIkl0ZW1cIiB3aWxsIGhhdmUgdGhlIHR5cGUgeyB0cmFpbDoge1RyYWlsfSwgY2hpbGRyZW46IHtBcnJheS48SXRlbT59IH0sIGZvcm1pbmcgYSB0cmVlLWxpa2VcclxuICAgKiBzdHJ1Y3R1cmUuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROZXN0ZWRQRE9NT3JkZXIoKTogeyB0cmFpbDogVHJhaWw7IGNoaWxkcmVuOiBOb2RlW10gfVtdIHtcclxuICAgIGNvbnN0IGN1cnJlbnRUcmFpbCA9IG5ldyBUcmFpbCggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKTtcclxuICAgIGxldCBwcnVuZVN0YWNrOiBOb2RlW10gPSBbXTsgLy8gQSBsaXN0IG9mIG5vZGVzIHRvIHBydW5lXHJcblxyXG4gICAgLy8ge0FycmF5LjxJdGVtPn0gLSBUaGUgbWFpbiByZXN1bHQgd2Ugd2lsbCBiZSByZXR1cm5pbmcuIEl0IGlzIHRoZSB0b3AtbGV2ZWwgYXJyYXkgd2hlcmUgY2hpbGQgaXRlbXMgd2lsbCBiZVxyXG4gICAgLy8gaW5zZXJ0ZWQuXHJcbiAgICBjb25zdCByZXN1bHQ6IHsgdHJhaWw6IFRyYWlsOyBjaGlsZHJlbjogTm9kZVtdIH1bXSA9IFtdO1xyXG5cclxuICAgIC8vIHtBcnJheS48QXJyYXkuPEl0ZW0+Pn0gQSBzdGFjayBvZiBjaGlsZHJlbiBhcnJheXMsIHdoZXJlIHdlIHNob3VsZCBiZSBpbnNlcnRpbmcgaXRlbXMgaW50byB0aGUgdG9wIGFycmF5LlxyXG4gICAgLy8gV2Ugd2lsbCBzdGFydCBvdXQgd2l0aCB0aGUgcmVzdWx0LCBhbmQgYXMgbmVzdGVkIGxldmVscyBhcmUgYWRkZWQsIHRoZSBjaGlsZHJlbiBhcnJheXMgb2YgdGhvc2UgaXRlbXMgd2lsbCBiZVxyXG4gICAgLy8gcHVzaGVkIGFuZCBwb3BwcGVkLCBzbyB0aGF0IHRoZSB0b3AgYXJyYXkgb24gdGhpcyBzdGFjayBpcyB3aGVyZSB3ZSBzaG91bGQgaW5zZXJ0IG91ciBuZXh0IGNoaWxkIGl0ZW0uXHJcbiAgICBjb25zdCBuZXN0ZWRDaGlsZFN0YWNrID0gWyByZXN1bHQgXTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRUcmFpbHNGb3JOb2RlKCBub2RlOiBOb2RlLCBvdmVycmlkZVBydW5pbmc6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICAgIC8vIElmIHN1YnRyZWVzIHdlcmUgc3BlY2lmaWVkIHdpdGggcGRvbU9yZGVyLCB0aGV5IHNob3VsZCBiZSBza2lwcGVkIGZyb20gdGhlIG9yZGVyaW5nIG9mIGFuY2VzdG9yIHN1YnRyZWVzLFxyXG4gICAgICAvLyBvdGhlcndpc2Ugd2UgY291bGQgZW5kIHVwIGhhdmluZyBtdWx0aXBsZSByZWZlcmVuY2VzIHRvIHRoZSBzYW1lIHRyYWlsICh3aGljaCBzaG91bGQgYmUgZGlzYWxsb3dlZCkuXHJcbiAgICAgIGxldCBwcnVuZUNvdW50ID0gMDtcclxuICAgICAgLy8gY291bnQgdGhlIG51bWJlciBvZiB0aW1lcyBvdXIgbm9kZSBhcHBlYXJzIGluIHRoZSBwcnVuZVN0YWNrXHJcbiAgICAgIF8uZWFjaCggcHJ1bmVTdGFjaywgcHJ1bmVOb2RlID0+IHtcclxuICAgICAgICBpZiAoIG5vZGUgPT09IHBydW5lTm9kZSApIHtcclxuICAgICAgICAgIHBydW5lQ291bnQrKztcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIElmIG92ZXJyaWRlUHJ1bmluZyBpcyBzZXQsIHdlIGlnbm9yZSBvbmUgcmVmZXJlbmNlIHRvIG91ciBub2RlIGluIHRoZSBwcnVuZSBzdGFjay4gSWYgdGhlcmUgYXJlIHR3byBjb3BpZXMsXHJcbiAgICAgIC8vIGhvd2V2ZXIsIGl0IG1lYW5zIGEgbm9kZSB3YXMgc3BlY2lmaWVkIGluIGEgcGRvbU9yZGVyIHRoYXQgYWxyZWFkeSBuZWVkcyB0byBiZSBwcnVuZWQgKHNvIHdlIHNraXAgaXQgaW5zdGVhZFxyXG4gICAgICAvLyBvZiBjcmVhdGluZyBkdXBsaWNhdGUgcmVmZXJlbmNlcyBpbiB0aGUgdHJhdmVyc2FsIG9yZGVyKS5cclxuICAgICAgaWYgKCBwcnVuZUNvdW50ID4gMSB8fCAoIHBydW5lQ291bnQgPT09IDEgJiYgIW92ZXJyaWRlUHJ1bmluZyApICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUHVzaGluZyBpdGVtIGFuZCBpdHMgY2hpbGRyZW4gYXJyYXksIGlmIGhhcyBwZG9tIGNvbnRlbnRcclxuICAgICAgaWYgKCBub2RlLmhhc1BET01Db250ZW50ICkge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB7XHJcbiAgICAgICAgICB0cmFpbDogY3VycmVudFRyYWlsLmNvcHkoKSxcclxuICAgICAgICAgIGNoaWxkcmVuOiBbXVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbmVzdGVkQ2hpbGRTdGFja1sgbmVzdGVkQ2hpbGRTdGFjay5sZW5ndGggLSAxIF0ucHVzaCggaXRlbSApO1xyXG4gICAgICAgIG5lc3RlZENoaWxkU3RhY2sucHVzaCggaXRlbS5jaGlsZHJlbiApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhcnJheVBET01PcmRlciA9IG5vZGUuX3Bkb21PcmRlciA9PT0gbnVsbCA/IFtdIDogbm9kZS5fcGRvbU9yZGVyO1xyXG5cclxuICAgICAgLy8gcHVzaCBzcGVjaWZpYyBmb2N1c2VkIG5vZGVzIHRvIHRoZSBzdGFja1xyXG4gICAgICBwcnVuZVN0YWNrID0gcHJ1bmVTdGFjay5jb25jYXQoIGFycmF5UERPTU9yZGVyIGFzIE5vZGVbXSApO1xyXG5cclxuICAgICAgLy8gVmlzaXRpbmcgdHJhaWxzIHRvIG9yZGVyZWQgbm9kZXMuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgXy5lYWNoKCBhcnJheVBET01PcmRlciwgKCBkZXNjZW5kYW50OiBOb2RlICkgPT4ge1xyXG4gICAgICAgIC8vIEZpbmQgYWxsIGRlc2NlbmRhbnQgcmVmZXJlbmNlcyB0byB0aGUgbm9kZS5cclxuICAgICAgICAvLyBOT1RFOiBXZSBhcmUgbm90IHJlb3JkZXJpbmcgdHJhaWxzIChkdWUgdG8gZGVzY2VuZGFudCBjb25zdHJhaW50cykgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpbnN0YW5jZSBmb3JcclxuICAgICAgICAvLyB0aGlzIGRlc2NlbmRhbnQgbm9kZS5cclxuICAgICAgICBfLmVhY2goIG5vZGUuZ2V0TGVhZlRyYWlsc1RvKCBkZXNjZW5kYW50ICksIGRlc2NlbmRhbnRUcmFpbCA9PiB7XHJcbiAgICAgICAgICBkZXNjZW5kYW50VHJhaWwucmVtb3ZlQW5jZXN0b3IoKTsgLy8gc3RyaXAgb2ZmICdub2RlJywgc28gdGhhdCB3ZSBoYW5kbGUgb25seSBjaGlsZHJlblxyXG5cclxuICAgICAgICAgIC8vIHNhbWUgYXMgdGhlIG5vcm1hbCBvcmRlciwgYnV0IGFkZGluZyBhIGZ1bGwgdHJhaWwgKHNpbmNlIHdlIG1heSBiZSByZWZlcmVuY2luZyBhIGRlc2NlbmRhbnQgbm9kZSlcclxuICAgICAgICAgIGN1cnJlbnRUcmFpbC5hZGREZXNjZW5kYW50VHJhaWwoIGRlc2NlbmRhbnRUcmFpbCApO1xyXG4gICAgICAgICAgYWRkVHJhaWxzRm9yTm9kZSggZGVzY2VuZGFudCwgdHJ1ZSApOyAvLyAndHJ1ZScgb3ZlcnJpZGVzIG9uZSByZWZlcmVuY2UgaW4gdGhlIHBydW5lIHN0YWNrIChhZGRlZCBhYm92ZSlcclxuICAgICAgICAgIGN1cnJlbnRUcmFpbC5yZW1vdmVEZXNjZW5kYW50VHJhaWwoIGRlc2NlbmRhbnRUcmFpbCApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gVmlzaXQgZXZlcnl0aGluZy4gSWYgdGhlcmUgaXMgYSBwZG9tT3JkZXIsIHRob3NlIHRyYWlscyB3ZXJlIGFscmVhZHkgdmlzaXRlZCwgYW5kIHdpbGwgYmUgZXhjbHVkZWQuXHJcbiAgICAgIGNvbnN0IG51bUNoaWxkcmVuID0gbm9kZS5fY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1DaGlsZHJlbjsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gbm9kZS5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgICAgY3VycmVudFRyYWlsLmFkZERlc2NlbmRhbnQoIGNoaWxkLCBpICk7XHJcbiAgICAgICAgYWRkVHJhaWxzRm9yTm9kZSggY2hpbGQsIGZhbHNlICk7XHJcbiAgICAgICAgY3VycmVudFRyYWlsLnJlbW92ZURlc2NlbmRhbnQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcG9wIGZvY3VzZWQgbm9kZXMgZnJvbSB0aGUgc3RhY2sgKHRoYXQgd2VyZSBhZGRlZCBhYm92ZSlcclxuICAgICAgXy5lYWNoKCBhcnJheVBET01PcmRlciwgKCkgPT4ge1xyXG4gICAgICAgIHBydW5lU3RhY2sucG9wKCk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIFBvcHBpbmcgY2hpbGRyZW4gYXJyYXkgaWYgaGFzIHBkb20gY29udGVudFxyXG4gICAgICBpZiAoIG5vZGUuaGFzUERPTUNvbnRlbnQgKSB7XHJcbiAgICAgICAgbmVzdGVkQ2hpbGRTdGFjay5wb3AoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFRyYWlsc0Zvck5vZGUoICggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKSwgZmFsc2UgKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcGRvbSBjb250ZW50IGZvciBhIE5vZGUuIFNlZSBjb25zdHJ1Y3RvciBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gTm90IHBhcnQgb2YgdGhlIFBhcmFsbGVsRE9NXHJcbiAgICogQVBJIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25QRE9NQ29udGVudENoYW5nZSgpOiB2b2lkIHtcclxuXHJcbiAgICBQRE9NVHJlZS5wZG9tQ29udGVudENoYW5nZSggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKTtcclxuXHJcbiAgICAvLyByZWNvbXB1dGUgdGhlIGhlYWRpbmcgbGV2ZWwgZm9yIHRoaXMgbm9kZSBpZiBpdCBpcyB1c2luZyB0aGUgcGRvbUhlYWRpbmcgQVBJLlxyXG4gICAgdGhpcy5wZG9tSGVhZGluZyAmJiB0aGlzLmNvbXB1dGVIZWFkaW5nTGV2ZWwoKTtcclxuXHJcbiAgICAoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkucmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGlzIE5vZGUgaGFzIGFueSByZXByZXNlbnRhdGlvbiBmb3IgdGhlIFBhcmFsbGVsIERPTS5cclxuICAgKiBOb3RlIHRoaXMgaXMgc3RpbGwgdHJ1ZSBpZiB0aGUgY29udGVudCBpcyBwZG9tVmlzaWJsZT1mYWxzZSBvciBpcyBvdGhlcndpc2UgaGlkZGVuLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgaGFzUERPTUNvbnRlbnQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLl90YWdOYW1lO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gdGhlIG5vZGUgaXMgYWRkZWQgYXMgYSBjaGlsZCB0byB0aGlzIG5vZGUgQU5EIHRoZSBub2RlJ3Mgc3VidHJlZSBjb250YWlucyBwZG9tIGNvbnRlbnQuXHJcbiAgICogV2UgbmVlZCB0byBub3RpZnkgYWxsIERpc3BsYXlzIHRoYXQgY2FuIHNlZSB0aGlzIGNoYW5nZSwgc28gdGhhdCB0aGV5IGNhbiB1cGRhdGUgdGhlIFBET01JbnN0YW5jZSB0cmVlLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvblBET01BZGRDaGlsZCggbm9kZTogTm9kZSApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSAmJiBzY2VuZXJ5TG9nLlBhcmFsbGVsRE9NKCBgb25QRE9NQWRkQ2hpbGQgbiMke25vZGUuaWR9IChwYXJlbnQ6biMkeyggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKS5pZH0pYCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBhcmFsbGVsRE9NICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIC8vIEZpbmQgZGVzY2VuZGFudHMgd2l0aCBwZG9tT3JkZXJzIGFuZCBjaGVjayB0aGVtIGFnYWluc3QgYWxsIG9mIHRoZWlyIGFuY2VzdG9ycy9zZWxmXHJcbiAgICBhc3NlcnQgJiYgKCBmdW5jdGlvbiByZWN1ciggZGVzY2VuZGFudCApIHtcclxuICAgICAgLy8gUHJ1bmUgdGhlIHNlYXJjaCAoYmVjYXVzZSBtaWxsaXNlY29uZHMgZG9uJ3QgZ3JvdyBvbiB0cmVlcywgZXZlbiBpZiB3ZSBkbyBoYXZlIGFzc2VydGlvbnMgZW5hYmxlZClcclxuICAgICAgaWYgKCBkZXNjZW5kYW50Ll9yZW5kZXJlclN1bW1hcnkuaGFzTm9QRE9NKCkgKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgZGVzY2VuZGFudC5wZG9tT3JkZXIgJiYgYXNzZXJ0KCBkZXNjZW5kYW50LmdldFRyYWlscyggbm9kZSA9PiBfLmluY2x1ZGVzKCBkZXNjZW5kYW50LnBkb21PcmRlciwgbm9kZSApICkubGVuZ3RoID09PSAwLCAncGRvbU9yZGVyIHNob3VsZCBub3QgaW5jbHVkZSBhbnkgYW5jZXN0b3JzIG9yIHRoZSBub2RlIGl0c2VsZicgKTtcclxuICAgIH0gKSggbm9kZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBQRE9NVHJlZS5hdWRpdE5vZGVGb3JQRE9NQ3ljbGVzKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApO1xyXG5cclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8ub25BZGRDaGlsZCggbm9kZSApO1xyXG5cclxuICAgIFBET01UcmVlLmFkZENoaWxkKCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSwgbm9kZSApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gdGhlIG5vZGUgaXMgcmVtb3ZlZCBhcyBhIGNoaWxkIGZyb20gdGhpcyBub2RlIEFORCB0aGUgbm9kZSdzIHN1YnRyZWUgY29udGFpbnMgcGRvbSBjb250ZW50LlxyXG4gICAqIFdlIG5lZWQgdG8gbm90aWZ5IGFsbCBEaXNwbGF5cyB0aGF0IGNhbiBzZWUgdGhpcyBjaGFuZ2UsIHNvIHRoYXQgdGhleSBjYW4gdXBkYXRlIHRoZSBQRE9NSW5zdGFuY2UgdHJlZS5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb25QRE9NUmVtb3ZlQ2hpbGQoIG5vZGU6IE5vZGUgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFyYWxsZWxET00gJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSggYG9uUERPTVJlbW92ZUNoaWxkIG4jJHtub2RlLmlkfSAocGFyZW50Om4jJHsoIHRoaXMgYXMgdW5rbm93biBhcyBOb2RlICkuaWR9KWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLl9wZG9tRGlzcGxheXNJbmZvLm9uUmVtb3ZlQ2hpbGQoIG5vZGUgKTtcclxuXHJcbiAgICBQRE9NVHJlZS5yZW1vdmVDaGlsZCggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUsIG5vZGUgKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgYXNzb2NpYXRpb25zIGZvciBhcmlhLWxhYmVsbGVkYnkgYW5kIGFyaWEtZGVzY3JpYmVkYnkgYXJlIHVwZGF0ZWQgZm9yIG5vZGVzIGFzc29jaWF0ZWRcclxuICAgIC8vIHRvIHRoaXMgTm9kZSAodGhleSBhcmUgcG9pbnRpbmcgdG8gdGhpcyBOb2RlJ3MgSURzKS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzgxNlxyXG4gICAgbm9kZS51cGRhdGVPdGhlck5vZGVzQXJpYUxhYmVsbGVkYnkoKTtcclxuICAgIG5vZGUudXBkYXRlT3RoZXJOb2Rlc0FyaWFEZXNjcmliZWRieSgpO1xyXG4gICAgbm9kZS51cGRhdGVPdGhlck5vZGVzQWN0aXZlRGVzY2VuZGFudCgpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gdGhpcyBub2RlJ3MgY2hpbGRyZW4gYXJlIHJlb3JkZXJlZCAod2l0aCBub3RoaW5nIGFkZGVkL3JlbW92ZWQpLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvblBET01SZW9yZGVyZWRDaGlsZHJlbigpOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYXJhbGxlbERPTSAmJiBzY2VuZXJ5TG9nLlBhcmFsbGVsRE9NKCBgb25QRE9NUmVvcmRlcmVkQ2hpbGRyZW4gKHBhcmVudDpuIyR7KCB0aGlzIGFzIHVua25vd24gYXMgTm9kZSApLmlkfSlgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFyYWxsZWxET00gJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgUERPTVRyZWUuY2hpbGRyZW5PcmRlckNoYW5nZSggdGhpcyBhcyB1bmtub3duIGFzIE5vZGUgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFyYWxsZWxET00gJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgbGlua2luZyBhbmQgY2hlY2tpbmcgY2hpbGQgUGhFVC1pTyBQcm9wZXJ0aWVzIHN1Y2ggYXMgTm9kZS52aXNpYmxlUHJvcGVydHkgYW5kIE5vZGUuZW5hYmxlZFByb3BlcnR5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVMaW5rZWRFbGVtZW50Rm9yUHJvcGVydHk8VD4oIHRhbmRlbU5hbWU6IHN0cmluZywgb2xkUHJvcGVydHk/OiBUUmVhZE9ubHlQcm9wZXJ0eTxUPiB8IG51bGwsIG5ld1Byb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8VD4gfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb2xkUHJvcGVydHkgIT09IG5ld1Byb3BlcnR5LCAnc2hvdWxkIG5vdCBiZSBjYWxsZWQgb24gc2FtZSB2YWx1ZXMnICk7XHJcblxyXG4gICAgLy8gT25seSB1cGRhdGUgbGlua2VkIGVsZW1lbnRzIGlmIHRoaXMgTm9kZSBpcyBpbnN0cnVtZW50ZWQgZm9yIFBoRVQtaU9cclxuICAgIGlmICggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgb2xkUHJvcGVydHkgJiYgb2xkUHJvcGVydHkgaW5zdGFuY2VvZiBSZWFkT25seVByb3BlcnR5ICYmIG9sZFByb3BlcnR5LmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgJiYgb2xkUHJvcGVydHkgaW5zdGFuY2VvZiBQaGV0aW9PYmplY3QgJiYgdGhpcy5yZW1vdmVMaW5rZWRFbGVtZW50cyggb2xkUHJvcGVydHkgKTtcclxuXHJcbiAgICAgIGNvbnN0IHRhbmRlbSA9IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggdGFuZGVtTmFtZSApO1xyXG5cclxuICAgICAgaWYgKCBuZXdQcm9wZXJ0eSAmJiBuZXdQcm9wZXJ0eSBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgJiYgbmV3UHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSAmJiBuZXdQcm9wZXJ0eSBpbnN0YW5jZW9mIFBoZXRpb09iamVjdCAmJiB0YW5kZW0gIT09IG5ld1Byb3BlcnR5LnRhbmRlbSApIHtcclxuICAgICAgICB0aGlzLmFkZExpbmtlZEVsZW1lbnQoIG5ld1Byb3BlcnR5LCB7IHRhbmRlbU5hbWU6IHRhbmRlbU5hbWUgfSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbiAgLy9cclxuICAvLyBQRE9NIEluc3RhbmNlIGhhbmRsaW5nXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIHBkb20gaW5zdGFuY2VzIGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UERPTUluc3RhbmNlcygpOiBQRE9NSW5zdGFuY2VbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGRvbUluc3RhbmNlcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGRvbUluc3RhbmNlcygpOiBQRE9NSW5zdGFuY2VbXSB7IHJldHVybiB0aGlzLmdldFBET01JbnN0YW5jZXMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgUERPTUluc3RhbmNlIHJlZmVyZW5jZSB0byBvdXIgYXJyYXkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRQRE9NSW5zdGFuY2UoIHBkb21JbnN0YW5jZTogUERPTUluc3RhbmNlICk6IHZvaWQge1xyXG4gICAgdGhpcy5fcGRvbUluc3RhbmNlcy5wdXNoKCBwZG9tSW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYSBQRE9NSW5zdGFuY2UgcmVmZXJlbmNlIGZyb20gb3VyIGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlUERPTUluc3RhbmNlKCBwZG9tSW5zdGFuY2U6IFBET01JbnN0YW5jZSApOiB2b2lkIHtcclxuICAgIGNvbnN0IGluZGV4ID0gXy5pbmRleE9mKCB0aGlzLl9wZG9tSW5zdGFuY2VzLCBwZG9tSW5zdGFuY2UgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ICE9PSAtMSwgJ0Nhbm5vdCByZW1vdmUgYSBQRE9NSW5zdGFuY2UgZnJvbSBhIE5vZGUgaWYgaXQgd2FzIG5vdCB0aGVyZScgKTtcclxuICAgIHRoaXMuX3Bkb21JbnN0YW5jZXMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBCQVNJQ19BQ0NFU1NJQkxFX05BTUVfQkVIQVZJT1IoIG5vZGU6IE5vZGUsIG9wdGlvbnM6IFBhcmFsbGVsRE9NT3B0aW9ucywgYWNjZXNzaWJsZU5hbWU6IFBET01WYWx1ZVR5cGUgKTogUGFyYWxsZWxET01PcHRpb25zIHtcclxuICAgIGlmICggbm9kZS50YWdOYW1lID09PSAnaW5wdXQnICkge1xyXG4gICAgICBvcHRpb25zLmxhYmVsVGFnTmFtZSA9ICdsYWJlbCc7XHJcbiAgICAgIG9wdGlvbnMubGFiZWxDb250ZW50ID0gYWNjZXNzaWJsZU5hbWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggUERPTVV0aWxzLnRhZ05hbWVTdXBwb3J0c0NvbnRlbnQoIG5vZGUudGFnTmFtZSEgKSApIHtcclxuICAgICAgb3B0aW9ucy5pbm5lckNvbnRlbnQgPSBhY2Nlc3NpYmxlTmFtZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBvcHRpb25zLmFyaWFMYWJlbCA9IGFjY2Vzc2libGVOYW1lO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIEhFTFBfVEVYVF9CRUZPUkVfQ09OVEVOVCggbm9kZTogTm9kZSwgb3B0aW9uczogUGFyYWxsZWxET01PcHRpb25zLCBoZWxwVGV4dDogUERPTVZhbHVlVHlwZSApOiBQYXJhbGxlbERPTU9wdGlvbnMge1xyXG4gICAgb3B0aW9ucy5kZXNjcmlwdGlvblRhZ05hbWUgPSBQRE9NVXRpbHMuREVGQVVMVF9ERVNDUklQVElPTl9UQUdfTkFNRTtcclxuICAgIG9wdGlvbnMuZGVzY3JpcHRpb25Db250ZW50ID0gaGVscFRleHQ7XHJcbiAgICBvcHRpb25zLmFwcGVuZERlc2NyaXB0aW9uID0gZmFsc2U7XHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgSEVMUF9URVhUX0FGVEVSX0NPTlRFTlQoIG5vZGU6IE5vZGUsIG9wdGlvbnM6IFBhcmFsbGVsRE9NT3B0aW9ucywgaGVscFRleHQ6IFBET01WYWx1ZVR5cGUgKTogUGFyYWxsZWxET01PcHRpb25zIHtcclxuICAgIG9wdGlvbnMuZGVzY3JpcHRpb25UYWdOYW1lID0gUERPTVV0aWxzLkRFRkFVTFRfREVTQ1JJUFRJT05fVEFHX05BTUU7XHJcbiAgICBvcHRpb25zLmRlc2NyaXB0aW9uQ29udGVudCA9IGhlbHBUZXh0O1xyXG4gICAgb3B0aW9ucy5hcHBlbmREZXNjcmlwdGlvbiA9IHRydWU7XHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdQYXJhbGxlbERPTScsIFBhcmFsbGVsRE9NICk7XHJcbmV4cG9ydCB7IEFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVMgfTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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