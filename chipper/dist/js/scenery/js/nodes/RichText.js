// Copyright 2017-2024, University of Colorado Boulder

/**
 * Displays rich text by interpreting the input text as HTML, supporting a limited set of tags that prevent any
 * security vulnerabilities. It does this by parsing the input HTML and splitting it into multiple Text children
 * recursively.
 *
 * NOTE: Encoding HTML entities is required, and malformed HTML is not accepted.
 *
 * NOTE: Currently it can line-wrap at the start and end of tags. This will probably be fixed in the future to only
 *       potentially break on whitespace.
 *
 * It supports the following markup and features in the string content (in addition to other options as listed in
 * RICH_TEXT_OPTION_KEYS):
 * - <a href="{{placeholder}}"> for links (pass in { links: { placeholder: ACTUAL_HREF } })
 * - <b> and <strong> for bold text
 * - <i> and <em> for italic text
 * - <sub> and <sup> for subscripts / superscripts
 * - <u> for underlined text
 * - <s> for strikethrough text
 * - <span> tags with a dir="ltr" / dir="rtl" attribute
 * - <br> for explicit line breaks
 * - <node id="id"> for embedding a Node into the text (pass in { nodes: { id: NODE } }), with optional align attribute
 * - Unicode bidirectional marks (present in PhET strings) for full RTL support
 * - CSS style="..." attributes, with color and font settings, see https://github.com/phetsims/scenery/issues/807
 *
 * Examples from the scenery-phet demo:
 *
 * new RichText( 'RichText can have <b>bold</b> and <i>italic</i> text.' ),
 * new RichText( 'Can do H<sub>2</sub>O (A<sub>sub</sub> and A<sup>sup</sup>), or nesting: x<sup>2<sup>2</sup></sup>' ),
 * new RichText( 'Additionally: <span style="color: blue;">color</span>, <span style="font-size: 30px;">sizes</span>, <span style="font-family: serif;">faces</span>, <s>strikethrough</s>, and <u>underline</u>' ),
 * new RichText( 'These <b><em>can</em> <u><span style="color: red;">be</span> mixed<sup>1</sup></u></b>.' ),
 * new RichText( '\u202aHandles bidirectional text: \u202b<span style="color: #0a0;">مقابض</span> النص ثنائي <b>الاتجاه</b><sub>2</sub>\u202c\u202c' ),
 * new RichText( '\u202b\u062a\u0633\u062a (\u0632\u0628\u0627\u0646)\u202c' ),
 * new RichText( 'HTML entities need to be escaped, like &amp; and &lt;.' ),
 * new RichText( 'Supports <a href="{{phetWebsite}}"><em>links</em> with <b>markup</b></a>, and <a href="{{callback}}">links that call functions</a>.', {
 *   links: {
 *     phetWebsite: 'https://phet.colorado.edu',
 *     callback: function() {
 *       console.log( 'Link was clicked' );
 *     }
 *   }
 * } ),
 * new RichText( 'Or also <a href="https://phet.colorado.edu">links directly in the string</a>.', {
 *   links: true
 * } ),
 * new RichText( 'Links not found <a href="{{bogus}}">are ignored</a> for security.' ),
 * new HBox( {
 *   spacing: 30,
 *   children: [
 *     new RichText( 'Multi-line text with the<br>separator &lt;br&gt; and <a href="https://phet.colorado.edu">handles<br>links</a> and other <b>tags<br>across lines</b>', {
 *       links: true
 *     } ),
 *     new RichText( 'Supposedly RichText supports line wrapping. Here is a lineWrap of 300, which should probably wrap multiple times here', { lineWrap: 300 } )
 *   ]
 * } )
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import StringProperty from '../../../axon/js/StringProperty.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
import Tandem from '../../../tandem/js/Tandem.js';
import IOType from '../../../tandem/js/types/IOType.js';
import { allowLinksProperty, Color, Font, getLineBreakRanges, isHimalayaElementNode, isHimalayaTextNode, Line, Node, RichTextElement, RichTextLeaf, RichTextLink, RichTextNode, RichTextUtils, RichTextVerticalSpacer, scenery, Text, WidthSizable } from '../imports.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import phetioElementSelectionProperty from '../../../tandem/js/phetioElementSelectionProperty.js';
import '../../../sherpa/lib/himalaya-1.1.0.js';
// @ts-expect-error - Since himalaya isn't in tsconfig
const himalayaVar = himalaya;
assert && assert(himalayaVar, 'himalaya dependency needed for RichText.');

// Options that can be used in the constructor, with mutate(), or directly as setters/getters
// each of these options has an associated setter, see setter methods for more documentation
const RICH_TEXT_OPTION_KEYS = ['boundsMethod', 'font', 'fill', 'stroke', 'lineWidth', 'subScale', 'subXSpacing', 'subYOffset', 'supScale', 'supXSpacing', 'supYOffset', 'capHeightScale', 'underlineLineWidth', 'underlineHeightScale', 'strikethroughLineWidth', 'strikethroughHeightScale', 'linkFill', 'linkEventsHandled', 'links', 'nodes', 'replaceNewlines', 'align', 'leading', 'lineWrap', Text.STRING_PROPERTY_NAME, 'string'];
// Used only for guarding against assertions, we want to know that we aren't in stringTesting mode
const isStringTest = window.QueryStringMachine && QueryStringMachine.containsKey('stringTest');
const DEFAULT_FONT = new Font({
  size: 20
});

// Tags that should be included in accessible innerContent, see https://github.com/phetsims/joist/issues/430
const ACCESSIBLE_TAGS = ['b', 'strong', 'i', 'em', 'sub', 'sup', 'u', 's'];

// What type of line-break situations we can be in during our recursive process
const LineBreakState = {
  // There was a line break, but it was at the end of the element (or was a <br>). The relevant element can be fully
  // removed from the tree.
  COMPLETE: 'COMPLETE',
  // There was a line break, but there is some content left in this element after the line break. DO NOT remove it.
  INCOMPLETE: 'INCOMPLETE',
  // There was NO line break
  NONE: 'NONE'
};

// We'll store an array here that will record which links/nodes were used in the last rebuild (so we can assert out if
// there were some that were not used).
const usedLinks = [];
const usedNodes = [];

// himalaya converts dash separated CSS to camel case - use CSS compatible style with dashes, see above for examples
const FONT_STYLE_MAP = {
  'font-family': 'family',
  'font-size': 'size',
  'font-stretch': 'stretch',
  'font-style': 'style',
  'font-variant': 'variant',
  'font-weight': 'weight',
  'line-height': 'lineHeight'
};
const FONT_STYLE_KEYS = Object.keys(FONT_STYLE_MAP);
const STYLE_KEYS = ['color'].concat(FONT_STYLE_KEYS);
export default class RichText extends WidthSizable(Node) {
  // The string to display. We'll initialize this by mutating.

  _font = DEFAULT_FONT;
  _boundsMethod = 'hybrid';
  _fill = '#000000';
  _stroke = null;
  _lineWidth = 1;
  _subScale = 0.75;
  _subXSpacing = 0;
  _subYOffset = 0;
  _supScale = 0.75;
  _supXSpacing = 0;
  _supYOffset = 0;
  _capHeightScale = 0.75;
  _underlineLineWidth = 1;
  _underlineHeightScale = 0.15;
  _strikethroughLineWidth = 1;
  _strikethroughHeightScale = 0.3;
  _linkFill = 'rgb(27,0,241)';
  _linkEventsHandled = false;

  // If an object, values are either {string} or {function}
  _links = {};
  _nodes = {};
  _replaceNewlines = false;
  _align = 'left';
  _leading = 0;
  _lineWrap = null;

  // We need to consolidate links (that could be split across multiple lines) under one "link" node, so we track created
  // link fragments here so they can get pieced together later.
  _linkItems = [];

  // Whether something has been added to this line yet. We don't want to infinite-loop out if something is longer than
  // our lineWrap, so we'll place one item on its own on an otherwise empty line.
  _hasAddedLeafToLine = false;

  // Normal layout container of lines (separate, so we can clear it easily)

  // For lineWrap:stretch, we'll need to compute a new minimum width for the RichText, so these control
  // (a) whether we're computing this (it does a lot of unnecessary work otherwise if we don't need it), and (b)
  // the actual minimumWidth that we'll have.
  needPendingMinimumWidth = false;
  pendingMinimumWidth = 0;

  // Text and RichText currently use the same tandem name for their stringProperty.
  static STRING_PROPERTY_TANDEM_NAME = Text.STRING_PROPERTY_TANDEM_NAME;
  constructor(string, providedOptions) {
    // We only fill in some defaults, since the other defaults are defined below (and mutate is relied on)
    const options = optionize()({
      fill: '#000000',
      // phet-io
      tandemNameSuffix: 'Text',
      phetioType: RichText.RichTextIO,
      phetioVisiblePropertyInstrumented: false
    }, providedOptions);
    if (typeof string === 'string' || typeof string === 'number') {
      options.string = string;
    } else {
      options.stringProperty = string;
    }
    super();
    this._stringProperty = new TinyForwardingProperty('', true, this.onStringPropertyChange.bind(this));
    this.lineContainer = new Node({});
    this.addChild(this.lineContainer);

    // Initialize to an empty state, so we are immediately valid (since now we need to create an empty leaf even if we
    // have empty text).
    this.rebuildRichText();
    this.localPreferredWidthProperty.lazyLink(() => this.rebuildRichText());
    this.mutate(options);
  }

  /**
   * Called when our stringProperty changes values.
   */
  onStringPropertyChange() {
    this.rebuildRichText();
  }

  /**
   * See documentation for Node.setVisibleProperty, except this is for the text string.
   */
  setStringProperty(newTarget) {
    return this._stringProperty.setTargetProperty(newTarget, this, RichText.STRING_PROPERTY_TANDEM_NAME);
  }
  set stringProperty(property) {
    this.setStringProperty(property);
  }
  get stringProperty() {
    return this.getStringProperty();
  }

  /**
   * Like Node.getVisibleProperty, but for the text string. Note this is not the same as the Property provided in
   * setStringProperty. Thus is the nature of TinyForwardingProperty.
   */
  getStringProperty() {
    return this._stringProperty;
  }

  /**
   * RichText supports a "string" selection mode, in which it will map to its stringProperty (if applicable), otherwise is
   * uses the default mouse-hit target from the supertype.
   */
  getPhetioMouseHitTarget(fromLinking = false) {
    return phetioElementSelectionProperty.value === 'string' ? this.getStringPropertyPhetioMouseHitTarget(fromLinking) : super.getPhetioMouseHitTarget(fromLinking);
  }
  getStringPropertyPhetioMouseHitTarget(fromLinking = false) {
    const targetStringProperty = this._stringProperty.getTargetProperty();

    // Even if this isn't PhET-iO instrumented, it still qualifies as this RichText's hit
    return targetStringProperty instanceof PhetioObject ? targetStringProperty.getPhetioMouseHitTarget(fromLinking) : 'phetioNotSelectable';
  }

  /**
   * See documentation and comments in Node.initializePhetioObject
   */
  initializePhetioObject(baseOptions, providedOptions) {
    const options = optionize()({}, providedOptions);

    // Track this, so we only override our stringProperty once.
    const wasInstrumented = this.isPhetioInstrumented();
    super.initializePhetioObject(baseOptions, options);
    if (Tandem.PHET_IO_ENABLED && !wasInstrumented && this.isPhetioInstrumented()) {
      this._stringProperty.initializePhetio(this, RichText.STRING_PROPERTY_TANDEM_NAME, () => {
        return new StringProperty(this.string, combineOptions({
          // by default, texts should be readonly. Editable texts most likely pass in editable Properties from i18n model Properties, see https://github.com/phetsims/scenery/issues/1443
          phetioReadOnly: true,
          tandem: this.tandem.createTandem(RichText.STRING_PROPERTY_TANDEM_NAME),
          phetioDocumentation: 'Property for the displayed text'
        }, options.stringPropertyOptions));
      });
    }
  }

  /**
   * When called, will rebuild the node structure for this RichText
   */
  rebuildRichText() {
    assert && cleanArray(usedLinks);
    assert && cleanArray(usedNodes);
    const hasDynamicWidth = this._lineWrap === 'stretch';
    this.widthSizable = hasDynamicWidth;
    this.pendingMinimumWidth = 0;
    this.needPendingMinimumWidth = hasDynamicWidth;

    // NOTE: can't use hasDynamicWidth here, since TypeScript isn't inferring it yet
    const effectiveLineWrap = this._lineWrap === 'stretch' ? this.localPreferredWidth : this._lineWrap;
    this.freeChildrenToPool();

    // Bail early, particularly if we are being constructed.
    if (this.string === '') {
      this.appendEmptyLeaf();
      return;
    }
    sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`RichText#${this.id} rebuild`);
    sceneryLog && sceneryLog.RichText && sceneryLog.push();

    // Turn bidirectional marks into explicit elements, so that the nesting is applied correctly.
    let mappedText = this.string.replace(/\u202a/g, '<span dir="ltr">').replace(/\u202b/g, '<span dir="rtl">').replace(/\u202c/g, '</span>');

    // Optional replacement of newlines, see https://github.com/phetsims/scenery/issues/1542
    if (this._replaceNewlines) {
      mappedText = mappedText.replace(/\n/g, '<br>');
    }
    let rootElements;

    // Start appending all top-level elements
    try {
      rootElements = himalayaVar.parse(mappedText);
    } catch (e) {
      // If we error out, don't kill the sim. Instead, replace the string with something that looks obviously like an
      // error. See https://github.com/phetsims/chipper/issues/1361 (we don't want translations to error out our
      // build process).

      rootElements = himalayaVar.parse('INVALID TRANSLATION');
    }

    // Clear out link items, as we'll need to reconstruct them later
    this._linkItems.length = 0;
    const widthAvailable = effectiveLineWrap === null ? Number.POSITIVE_INFINITY : effectiveLineWrap;
    const isRootLTR = true;
    let currentLine = RichTextElement.pool.create(isRootLTR);
    this._hasAddedLeafToLine = false; // notify that if nothing has been added, the first leaf always gets added.

    // Himalaya can give us multiple top-level items, so we need to iterate over those
    while (rootElements.length) {
      const element = rootElements[0];

      // How long our current line is already
      const currentLineWidth = currentLine.bounds.isValid() ? currentLine.width : 0;

      // Add the element in
      const lineBreakState = this.appendElement(currentLine, element, this._font, this._fill, isRootLTR, widthAvailable - currentLineWidth, 1);
      sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`lineBreakState: ${lineBreakState}`);

      // If there was a line break (we'll need to swap to a new line node)
      if (lineBreakState !== LineBreakState.NONE) {
        // Add the line if it works
        if (currentLine.bounds.isValid()) {
          sceneryLog && sceneryLog.RichText && sceneryLog.RichText('Adding line due to lineBreak');
          this.appendLine(currentLine);
        }
        // Otherwise if it's a blank line, add in a strut (<br><br> should result in a blank line)
        else {
          this.appendLine(RichTextVerticalSpacer.pool.create(RichTextUtils.scratchText.setString('X').setFont(this._font).height));
        }

        // Set up a new line
        currentLine = RichTextElement.pool.create(isRootLTR);
        this._hasAddedLeafToLine = false;
      }

      // If it's COMPLETE or NONE, then we fully processed the line
      if (lineBreakState !== LineBreakState.INCOMPLETE) {
        sceneryLog && sceneryLog.RichText && sceneryLog.RichText('Finished root element');
        rootElements.splice(0, 1);
      }
    }

    // Only add the final line if it's valid (we don't want to add unnecessary padding at the bottom)
    if (currentLine.bounds.isValid()) {
      sceneryLog && sceneryLog.RichText && sceneryLog.RichText('Adding final line');
      this.appendLine(currentLine);
    }

    // If we reached here and have no children, we probably ran into a degenerate "no layout" case like `' '`. Add in
    // the empty leaf.
    if (this.lineContainer.getChildrenCount() === 0) {
      this.appendEmptyLeaf();
    }

    // All lines are constructed, so we can align them now
    this.alignLines();

    // Handle regrouping of links (so that all fragments of a link across multiple lines are contained under a single
    // ancestor that has listeners and a11y)
    while (this._linkItems.length) {
      // Close over the href and other references
      (() => {
        const linkElement = this._linkItems[0].element;
        const href = this._linkItems[0].href;
        let i;

        // Find all nodes that are for the same link
        const nodes = [];
        for (i = this._linkItems.length - 1; i >= 0; i--) {
          const item = this._linkItems[i];
          if (item.element === linkElement) {
            nodes.push(item.node);
            this._linkItems.splice(i, 1);
          }
        }
        const linkRootNode = RichTextLink.pool.create(linkElement.innerContent, href);
        this.lineContainer.addChild(linkRootNode);

        // Detach the node from its location, adjust its transform, and reattach under the link. This should keep each
        // fragment in the same place, but changes its parent.
        for (i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const matrix = node.getUniqueTrailTo(this.lineContainer).getMatrix();
          node.detach();
          node.matrix = matrix;
          linkRootNode.addChild(node);
        }
      })();
    }

    // Clear them out afterwards, for memory purposes
    this._linkItems.length = 0;
    if (assert) {
      if (this._links && this._links !== true) {
        Object.keys(this._links).forEach(link => {
          assert && allowLinksProperty.value && !isStringTest && assert(usedLinks.includes(link), `Unused RichText link: ${link}`);
        });
      }
      if (this._nodes) {
        Object.keys(this._nodes).forEach(node => {
          assert && allowLinksProperty.value && !isStringTest && assert(usedNodes.includes(node), `Unused RichText node: ${node}`);
        });
      }
    }

    // NOTE: If this is failing or causing infinite loops in the future, refactor RichText to use a LayoutConstraint.
    this.localMinimumWidth = hasDynamicWidth ? this.pendingMinimumWidth : this.localBounds.width;
    sceneryLog && sceneryLog.RichText && sceneryLog.pop();
  }

  /**
   * Cleans "recursively temporary disposes" the children.
   */
  freeChildrenToPool() {
    // Clear any existing lines or link fragments (higher performance, and return them to pools also)
    while (this.lineContainer._children.length) {
      const child = this.lineContainer._children[this.lineContainer._children.length - 1];
      this.lineContainer.removeChild(child);
      child.clean();
    }
  }

  /**
   * Releases references.
   */
  dispose() {
    this.freeChildrenToPool();
    super.dispose();
    this._stringProperty.dispose();
  }

  /**
   * Appends a finished line, applying any necessary leading.
   */
  appendLine(lineNode) {
    // Apply leading
    if (this.lineContainer.bounds.isValid()) {
      lineNode.top = this.lineContainer.bottom + this._leading;

      // This ensures RTL lines will still be laid out properly with the main origin (handled by alignLines later)
      lineNode.left = 0;
    }
    this.lineContainer.addChild(lineNode);
  }

  /**
   * If we end up with the equivalent of "no" content, toss in a basically empty leaf so that we get valid bounds
   * (0 width, correctly-positioned height). See https://github.com/phetsims/scenery/issues/769.
   */
  appendEmptyLeaf() {
    assert && assert(this.lineContainer.getChildrenCount() === 0);
    this.appendLine(RichTextLeaf.pool.create('', true, this._font, this._boundsMethod, this._fill, this._stroke, this._lineWidth));
  }

  /**
   * Aligns all lines attached to the lineContainer.
   */
  alignLines() {
    // All nodes will either share a 'left', 'centerX' or 'right'.
    const coordinateName = this._align === 'center' ? 'centerX' : this._align;
    const ideal = this.lineContainer[coordinateName];
    for (let i = 0; i < this.lineContainer.getChildrenCount(); i++) {
      this.lineContainer.getChildAt(i)[coordinateName] = ideal;
    }
  }

  /**
   * Main recursive function for constructing the RichText Node tree.
   *
   * We'll add any relevant content to the containerNode. The element will be mutated as things are added, so that
   * whenever content is added to the Node tree it will be removed from the element tree. This means we can pause
   * whenever (e.g. when a line-break is encountered) and the rest will be ready for parsing the next line.
   *
   * @param containerNode - The node where child elements should be placed
   * @param element - See Himalaya's element specification
   *                      (https://github.com/andrejewski/himalaya/blob/master/text/ast-spec-v0.md)
   * @param font - The font to apply at this level
   * @param fill - Fill to apply
   * @param isLTR - True if LTR, false if RTL (handles RTL strings properly)
   * @param widthAvailable - How much width we have available before forcing a line break (for lineWrap)
   * @returns - Whether a line break was reached
   */
  appendElement(containerNode, element, font, fill, isLTR, widthAvailable, appliedScale) {
    let lineBreakState = LineBreakState.NONE;

    // The main Node for the element that we are adding
    let node;

    // If this content gets added, it will need to be pushed over by this amount
    const containerSpacing = isLTR ? containerNode.rightSpacing : containerNode.leftSpacing;

    // Container spacing cuts into our effective available width
    const widthAvailableWithSpacing = widthAvailable - containerSpacing;

    // If we're a leaf
    if (isHimalayaTextNode(element)) {
      sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`appending leaf: ${element.content}`);
      sceneryLog && sceneryLog.RichText && sceneryLog.push();
      node = RichTextLeaf.pool.create(element.content, isLTR, font, this._boundsMethod, fill, this._stroke, this._lineWidth);
      if (this.needPendingMinimumWidth) {
        this.pendingMinimumWidth = Math.max(this.pendingMinimumWidth, Math.max(...getLineBreakRanges(element.content).map(range => {
          const string = element.content.slice(range.min, range.max);
          const temporaryNode = RichTextLeaf.pool.create(string, isLTR, font, this._boundsMethod, fill, this._stroke, this._lineWidth);
          const localMininumWidth = temporaryNode.width * appliedScale;
          temporaryNode.dispose();
          return localMininumWidth;
        })));
      }

      // Handle wrapping if required. Container spacing cuts into our available width
      if (!node.fitsIn(widthAvailableWithSpacing, this._hasAddedLeafToLine, isLTR)) {
        // Didn't fit, lets break into words to see what we can fit. We'll create ranges for all the individual
        // elements we could split the lines into. If we split into different lines, we can ignore the characters
        // in-between, however if not, we need to include them.
        const ranges = getLineBreakRanges(element.content);

        // Convert a group of ranges into a string (grab the content from the string).
        const rangesToString = ranges => {
          if (ranges.length === 0) {
            return '';
          } else {
            return element.content.slice(ranges[0].min, ranges[ranges.length - 1].max);
          }
        };
        sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`Overflow leafAdded:${this._hasAddedLeafToLine}, words: ${ranges.length}`);

        // If we need to add something (and there is only a single word), then add it
        if (this._hasAddedLeafToLine || ranges.length > 1) {
          sceneryLog && sceneryLog.RichText && sceneryLog.RichText('Skipping words');
          const skippedRanges = [];
          let success = false;
          skippedRanges.unshift(ranges.pop()); // We didn't fit with the last one!

          // Keep shortening by removing words until it fits (or if we NEED to fit it) or it doesn't fit.
          while (ranges.length) {
            node.clean(); // We're tossing the old one, so we'll free up memory for the new one
            node = RichTextLeaf.pool.create(rangesToString(ranges), isLTR, font, this._boundsMethod, fill, this._stroke, this._lineWidth);

            // If we haven't added anything to the line AND we are down to the first word, we need to just add it.
            if (!node.fitsIn(widthAvailableWithSpacing, this._hasAddedLeafToLine, isLTR) && (this._hasAddedLeafToLine || ranges.length > 1)) {
              sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`Skipping word ${rangesToString([ranges[ranges.length - 1]])}`);
              skippedRanges.unshift(ranges.pop());
            } else {
              sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`Success with ${rangesToString(ranges)}`);
              success = true;
              break;
            }
          }

          // If we haven't added anything yet to this line, we'll permit the overflow
          if (success) {
            lineBreakState = LineBreakState.INCOMPLETE;
            element.content = rangesToString(skippedRanges);
            sceneryLog && sceneryLog.RichText && sceneryLog.RichText(`Remaining content: ${element.content}`);
          } else {
            // We won't use this one, so we'll free it back to the pool
            node.clean();
            return LineBreakState.INCOMPLETE;
          }
        }
      }
      this._hasAddedLeafToLine = true;
      sceneryLog && sceneryLog.RichText && sceneryLog.pop();
    }
    // Otherwise presumably an element with content
    else if (isHimalayaElementNode(element)) {
      // Bail out quickly for a line break
      if (element.tagName === 'br') {
        sceneryLog && sceneryLog.RichText && sceneryLog.RichText('manual line break');
        return LineBreakState.COMPLETE;
      }

      // Span (dir attribute) -- we need the LTR/RTL knowledge before most other operations
      if (element.tagName === 'span') {
        const dirAttributeString = RichTextUtils.himalayaGetAttribute('dir', element);
        if (dirAttributeString) {
          assert && assert(dirAttributeString === 'ltr' || dirAttributeString === 'rtl', 'Span dir attributes should be ltr or rtl.');
          isLTR = dirAttributeString === 'ltr';
        }
      }

      // Handle <node> tags, which should not have content
      if (element.tagName === 'node') {
        const referencedId = RichTextUtils.himalayaGetAttribute('id', element);
        const referencedNode = referencedId ? this._nodes[referencedId] || null : null;
        assert && assert(referencedNode, referencedId ? `Could not find a matching item in RichText's nodes for ${referencedId}. It should be provided in the nodes option` : 'No id attribute provided for a given <node> element');
        if (referencedNode) {
          assert && usedNodes.push(referencedId);
          node = RichTextNode.pool.create(referencedNode);
          if (this._hasAddedLeafToLine && !node.fitsIn(widthAvailableWithSpacing)) {
            // If we don't fit, we'll toss this node to the pool and create it on the next line
            node.clean();
            return LineBreakState.INCOMPLETE;
          }
          const nodeAlign = RichTextUtils.himalayaGetAttribute('align', element);
          if (nodeAlign === 'center' || nodeAlign === 'top' || nodeAlign === 'bottom') {
            const textBounds = RichTextUtils.scratchText.setString('Test').setFont(font).bounds;
            if (nodeAlign === 'center') {
              node.centerY = textBounds.centerY;
            } else if (nodeAlign === 'top') {
              node.top = textBounds.top;
            } else if (nodeAlign === 'bottom') {
              node.bottom = textBounds.bottom;
            }
          }
        } else {
          // If there is no node in our map, we'll just skip it
          return lineBreakState;
        }
        this._hasAddedLeafToLine = true;
      }
      // If not a <node> tag
      else {
        node = RichTextElement.pool.create(isLTR);
      }
      sceneryLog && sceneryLog.RichText && sceneryLog.RichText('appending element');
      sceneryLog && sceneryLog.RichText && sceneryLog.push();
      const styleAttributeString = RichTextUtils.himalayaGetAttribute('style', element);
      if (styleAttributeString) {
        const css = RichTextUtils.himalayaStyleStringToMap(styleAttributeString);
        assert && Object.keys(css).forEach(key => {
          assert(_.includes(STYLE_KEYS, key), 'See supported style CSS keys');
        });

        // Fill
        if (css.color) {
          fill = new Color(css.color);
        }

        // Font
        const fontOptions = {};
        for (let i = 0; i < FONT_STYLE_KEYS.length; i++) {
          const styleKey = FONT_STYLE_KEYS[i];
          if (css[styleKey]) {
            fontOptions[FONT_STYLE_MAP[styleKey]] = css[styleKey];
          }
        }
        font = (typeof font === 'string' ? Font.fromCSS(font) : font).copy(fontOptions);
      }

      // Anchor (link)
      if (element.tagName === 'a') {
        let href = RichTextUtils.himalayaGetAttribute('href', element);
        const originalHref = href;

        // Try extracting the href from the links object
        if (href !== null && this._links !== true) {
          if (href.startsWith('{{') && href.indexOf('}}') === href.length - 2) {
            const linkName = href.slice(2, -2);
            href = this._links[linkName];
            assert && usedLinks.push(linkName);
          } else {
            href = null;
          }
        }

        // Ignore things if there is no matching href
        assert && assert(href, `Could not find a matching item in RichText's links for ${originalHref}. It should be provided in the links option, or links should be turned to true (to allow the string to create its own urls`);
        if (href) {
          if (this._linkFill !== null) {
            fill = this._linkFill; // Link color
          }
          // Don't overwrite only innerContents once things have been "torn down"
          if (!element.innerContent) {
            element.innerContent = RichText.himalayaElementToAccessibleString(element, isLTR);
          }

          // Store information about it for the "regroup links" step
          this._linkItems.push({
            element: element,
            node: node,
            href: href
          });
        }
      }
      // Bold
      else if (element.tagName === 'b' || element.tagName === 'strong') {
        font = (typeof font === 'string' ? Font.fromCSS(font) : font).copy({
          weight: 'bold'
        });
      }
      // Italic
      else if (element.tagName === 'i' || element.tagName === 'em') {
        font = (typeof font === 'string' ? Font.fromCSS(font) : font).copy({
          style: 'italic'
        });
      }
      // Subscript
      else if (element.tagName === 'sub') {
        node.scale(this._subScale);
        node.addExtraBeforeSpacing(this._subXSpacing);
        node.y += this._subYOffset;
      }
      // Superscript
      else if (element.tagName === 'sup') {
        node.scale(this._supScale);
        node.addExtraBeforeSpacing(this._supXSpacing);
        node.y += this._supYOffset;
      }

      // If we've added extra spacing, we'll need to subtract it off of our available width
      const scale = node.getScaleVector().x;

      // Process children
      if (element.tagName !== 'node') {
        while (lineBreakState === LineBreakState.NONE && element.children.length) {
          const widthBefore = node.bounds.isValid() ? node.width : 0;
          const childElement = element.children[0];
          lineBreakState = this.appendElement(node, childElement, font, fill, isLTR, widthAvailable / scale, appliedScale * scale);

          // for COMPLETE or NONE, we'll want to remove the childElement from the tree (we fully processed it)
          if (lineBreakState !== LineBreakState.INCOMPLETE) {
            element.children.splice(0, 1);
          }
          const widthAfter = node.bounds.isValid() ? node.width : 0;

          // Remove the amount of width taken up by the child
          widthAvailable += widthBefore - widthAfter;
        }
        // If there is a line break and there are still more things to process, we are incomplete
        if (lineBreakState === LineBreakState.COMPLETE && element.children.length) {
          lineBreakState = LineBreakState.INCOMPLETE;
        }
      }

      // Subscript positioning
      if (element.tagName === 'sub') {
        if (isFinite(node.height)) {
          node.centerY = 0;
        }
      }
      // Superscript positioning
      else if (element.tagName === 'sup') {
        if (isFinite(node.height)) {
          node.centerY = RichTextUtils.scratchText.setString('X').setFont(font).top * this._capHeightScale;
        }
      }
      // Underline
      else if (element.tagName === 'u') {
        const underlineY = -node.top * this._underlineHeightScale;
        if (isFinite(node.top)) {
          node.addChild(new Line(node.localLeft, underlineY, node.localRight, underlineY, {
            stroke: fill,
            lineWidth: this._underlineLineWidth
          }));
        }
      }
      // Strikethrough
      else if (element.tagName === 's') {
        const strikethroughY = node.top * this._strikethroughHeightScale;
        if (isFinite(node.top)) {
          node.addChild(new Line(node.localLeft, strikethroughY, node.localRight, strikethroughY, {
            stroke: fill,
            lineWidth: this._strikethroughLineWidth
          }));
        }
      }
      sceneryLog && sceneryLog.RichText && sceneryLog.pop();
    }
    if (node) {
      const wasAdded = containerNode.addElement(node);
      if (!wasAdded) {
        // Remove it from the linkItems if we didn't actually add it.
        this._linkItems = this._linkItems.filter(item => item.node !== node);

        // And since we won't dispose it (since it's not a child), clean it here
        node.clean();
      }
    }
    return lineBreakState;
  }

  /**
   * Sets the string displayed by our node.
   *
   * NOTE: Encoding HTML entities is required, and malformed HTML is not accepted.
   *
   * @param string - The string to display. If it's a number, it will be cast to a string
   */
  setString(string) {
    assert && assert(string !== null && string !== undefined, 'String should be defined and non-null. Use the empty string if needed.');

    // cast it to a string (for numbers, etc., and do it before the change guard so we don't accidentally trigger on non-changed string)
    string = `${string}`;
    this._stringProperty.set(string);
    return this;
  }
  set string(value) {
    this.setString(value);
  }
  get string() {
    return this.getString();
  }

  /**
   * Returns the string displayed by our text Node.
   */
  getString() {
    return this._stringProperty.value;
  }

  /**
   * Sets the method that is used to determine bounds from the text. See Text.setBoundsMethod for details
   */
  setBoundsMethod(method) {
    assert && assert(method === 'fast' || method === 'fastCanvas' || method === 'accurate' || method === 'hybrid', 'Unknown Text boundsMethod');
    if (method !== this._boundsMethod) {
      this._boundsMethod = method;
      this.rebuildRichText();
    }
    return this;
  }
  set boundsMethod(value) {
    this.setBoundsMethod(value);
  }
  get boundsMethod() {
    return this.getBoundsMethod();
  }

  /**
   * Returns the current method to estimate the bounds of the text. See setBoundsMethod() for more information.
   */
  getBoundsMethod() {
    return this._boundsMethod;
  }

  /**
   * Sets the font of our node.
   */
  setFont(font) {
    if (this._font !== font) {
      this._font = font;
      this.rebuildRichText();
    }
    return this;
  }
  set font(value) {
    this.setFont(value);
  }
  get font() {
    return this.getFont();
  }

  /**
   * Returns the current Font
   */
  getFont() {
    return this._font;
  }

  /**
   * Sets the fill of our text.
   */
  setFill(fill) {
    if (this._fill !== fill) {
      this._fill = fill;
      this.rebuildRichText();
    }
    return this;
  }
  set fill(value) {
    this.setFill(value);
  }
  get fill() {
    return this.getFill();
  }

  /**
   * Returns the current fill.
   */
  getFill() {
    return this._fill;
  }

  /**
   * Sets the stroke of our text.
   */
  setStroke(stroke) {
    if (this._stroke !== stroke) {
      this._stroke = stroke;
      this.rebuildRichText();
    }
    return this;
  }
  set stroke(value) {
    this.setStroke(value);
  }
  get stroke() {
    return this.getStroke();
  }

  /**
   * Returns the current stroke.
   */
  getStroke() {
    return this._stroke;
  }

  /**
   * Sets the lineWidth of our text.
   */
  setLineWidth(lineWidth) {
    if (this._lineWidth !== lineWidth) {
      this._lineWidth = lineWidth;
      this.rebuildRichText();
    }
    return this;
  }
  set lineWidth(value) {
    this.setLineWidth(value);
  }
  get lineWidth() {
    return this.getLineWidth();
  }

  /**
   * Returns the current lineWidth.
   */
  getLineWidth() {
    return this._lineWidth;
  }

  /**
   * Sets the scale (relative to 1) of any string under subscript (<sub>) elements.
   */
  setSubScale(subScale) {
    assert && assert(isFinite(subScale) && subScale > 0);
    if (this._subScale !== subScale) {
      this._subScale = subScale;
      this.rebuildRichText();
    }
    return this;
  }
  set subScale(value) {
    this.setSubScale(value);
  }
  get subScale() {
    return this.getSubScale();
  }

  /**
   * Returns the scale (relative to 1) of any string under subscript (<sub>) elements.
   */
  getSubScale() {
    return this._subScale;
  }

  /**
   * Sets the horizontal spacing before any subscript (<sub>) elements.
   */
  setSubXSpacing(subXSpacing) {
    assert && assert(isFinite(subXSpacing));
    if (this._subXSpacing !== subXSpacing) {
      this._subXSpacing = subXSpacing;
      this.rebuildRichText();
    }
    return this;
  }
  set subXSpacing(value) {
    this.setSubXSpacing(value);
  }
  get subXSpacing() {
    return this.getSubXSpacing();
  }

  /**
   * Returns the horizontal spacing before any subscript (<sub>) elements.
   */
  getSubXSpacing() {
    return this._subXSpacing;
  }

  /**
   * Sets the adjustment offset to the vertical placement of any subscript (<sub>) elements.
   */
  setSubYOffset(subYOffset) {
    assert && assert(isFinite(subYOffset));
    if (this._subYOffset !== subYOffset) {
      this._subYOffset = subYOffset;
      this.rebuildRichText();
    }
    return this;
  }
  set subYOffset(value) {
    this.setSubYOffset(value);
  }
  get subYOffset() {
    return this.getSubYOffset();
  }

  /**
   * Returns the adjustment offset to the vertical placement of any subscript (<sub>) elements.
   */
  getSubYOffset() {
    return this._subYOffset;
  }

  /**
   * Sets the scale (relative to 1) of any string under superscript (<sup>) elements.
   */
  setSupScale(supScale) {
    assert && assert(isFinite(supScale) && supScale > 0);
    if (this._supScale !== supScale) {
      this._supScale = supScale;
      this.rebuildRichText();
    }
    return this;
  }
  set supScale(value) {
    this.setSupScale(value);
  }
  get supScale() {
    return this.getSupScale();
  }

  /**
   * Returns the scale (relative to 1) of any string under superscript (<sup>) elements.
   */
  getSupScale() {
    return this._supScale;
  }

  /**
   * Sets the horizontal spacing before any superscript (<sup>) elements.
   */
  setSupXSpacing(supXSpacing) {
    assert && assert(isFinite(supXSpacing));
    if (this._supXSpacing !== supXSpacing) {
      this._supXSpacing = supXSpacing;
      this.rebuildRichText();
    }
    return this;
  }
  set supXSpacing(value) {
    this.setSupXSpacing(value);
  }
  get supXSpacing() {
    return this.getSupXSpacing();
  }

  /**
   * Returns the horizontal spacing before any superscript (<sup>) elements.
   */
  getSupXSpacing() {
    return this._supXSpacing;
  }

  /**
   * Sets the adjustment offset to the vertical placement of any superscript (<sup>) elements.
   */
  setSupYOffset(supYOffset) {
    assert && assert(isFinite(supYOffset));
    if (this._supYOffset !== supYOffset) {
      this._supYOffset = supYOffset;
      this.rebuildRichText();
    }
    return this;
  }
  set supYOffset(value) {
    this.setSupYOffset(value);
  }
  get supYOffset() {
    return this.getSupYOffset();
  }

  /**
   * Returns the adjustment offset to the vertical placement of any superscript (<sup>) elements.
   */
  getSupYOffset() {
    return this._supYOffset;
  }

  /**
   * Sets the expected cap height (baseline to top of capital letters) as a scale of the detected distance from the
   * baseline to the top of the text bounds.
   */
  setCapHeightScale(capHeightScale) {
    assert && assert(isFinite(capHeightScale) && capHeightScale > 0);
    if (this._capHeightScale !== capHeightScale) {
      this._capHeightScale = capHeightScale;
      this.rebuildRichText();
    }
    return this;
  }
  set capHeightScale(value) {
    this.setCapHeightScale(value);
  }
  get capHeightScale() {
    return this.getCapHeightScale();
  }

  /**
   * Returns the expected cap height (baseline to top of capital letters) as a scale of the detected distance from the
   * baseline to the top of the text bounds.
   */
  getCapHeightScale() {
    return this._capHeightScale;
  }

  /**
   * Sets the lineWidth of underline lines.
   */
  setUnderlineLineWidth(underlineLineWidth) {
    assert && assert(isFinite(underlineLineWidth) && underlineLineWidth > 0);
    if (this._underlineLineWidth !== underlineLineWidth) {
      this._underlineLineWidth = underlineLineWidth;
      this.rebuildRichText();
    }
    return this;
  }
  set underlineLineWidth(value) {
    this.setUnderlineLineWidth(value);
  }
  get underlineLineWidth() {
    return this.getUnderlineLineWidth();
  }

  /**
   * Returns the lineWidth of underline lines.
   */
  getUnderlineLineWidth() {
    return this._underlineLineWidth;
  }

  /**
   * Sets the underline height adjustment as a proportion of the detected distance from the baseline to the top of the
   * text bounds.
   */
  setUnderlineHeightScale(underlineHeightScale) {
    assert && assert(isFinite(underlineHeightScale) && underlineHeightScale > 0);
    if (this._underlineHeightScale !== underlineHeightScale) {
      this._underlineHeightScale = underlineHeightScale;
      this.rebuildRichText();
    }
    return this;
  }
  set underlineHeightScale(value) {
    this.setUnderlineHeightScale(value);
  }
  get underlineHeightScale() {
    return this.getUnderlineHeightScale();
  }

  /**
   * Returns the underline height adjustment as a proportion of the detected distance from the baseline to the top of the
   * text bounds.
   */
  getUnderlineHeightScale() {
    return this._underlineHeightScale;
  }

  /**
   * Sets the lineWidth of strikethrough lines.
   */
  setStrikethroughLineWidth(strikethroughLineWidth) {
    assert && assert(isFinite(strikethroughLineWidth) && strikethroughLineWidth > 0);
    if (this._strikethroughLineWidth !== strikethroughLineWidth) {
      this._strikethroughLineWidth = strikethroughLineWidth;
      this.rebuildRichText();
    }
    return this;
  }
  set strikethroughLineWidth(value) {
    this.setStrikethroughLineWidth(value);
  }
  get strikethroughLineWidth() {
    return this.getStrikethroughLineWidth();
  }

  /**
   * Returns the lineWidth of strikethrough lines.
   */
  getStrikethroughLineWidth() {
    return this._strikethroughLineWidth;
  }

  /**
   * Sets the strikethrough height adjustment as a proportion of the detected distance from the baseline to the top of the
   * text bounds.
   */
  setStrikethroughHeightScale(strikethroughHeightScale) {
    assert && assert(isFinite(strikethroughHeightScale) && strikethroughHeightScale > 0);
    if (this._strikethroughHeightScale !== strikethroughHeightScale) {
      this._strikethroughHeightScale = strikethroughHeightScale;
      this.rebuildRichText();
    }
    return this;
  }
  set strikethroughHeightScale(value) {
    this.setStrikethroughHeightScale(value);
  }
  get strikethroughHeightScale() {
    return this.getStrikethroughHeightScale();
  }

  /**
   * Returns the strikethrough height adjustment as a proportion of the detected distance from the baseline to the top of the
   * text bounds.
   */
  getStrikethroughHeightScale() {
    return this._strikethroughHeightScale;
  }

  /**
   * Sets the color of links. If null, no fill will be overridden.
   */
  setLinkFill(linkFill) {
    if (this._linkFill !== linkFill) {
      this._linkFill = linkFill;
      this.rebuildRichText();
    }
    return this;
  }
  set linkFill(value) {
    this.setLinkFill(value);
  }
  get linkFill() {
    return this.getLinkFill();
  }

  /**
   * Returns the color of links.
   */
  getLinkFill() {
    return this._linkFill;
  }

  /**
   * Sets whether link clicks will call event.handle().
   */
  setLinkEventsHandled(linkEventsHandled) {
    if (this._linkEventsHandled !== linkEventsHandled) {
      this._linkEventsHandled = linkEventsHandled;
      this.rebuildRichText();
    }
    return this;
  }
  set linkEventsHandled(value) {
    this.setLinkEventsHandled(value);
  }
  get linkEventsHandled() {
    return this.getLinkEventsHandled();
  }

  /**
   * Returns whether link events will be handled.
   */
  getLinkEventsHandled() {
    return this._linkEventsHandled;
  }
  setLinks(links) {
    assert && assert(links === true || Object.getPrototypeOf(links) === Object.prototype);
    if (this._links !== links) {
      this._links = links;
      this.rebuildRichText();
    }
    return this;
  }

  /**
   * Returns whether link events will be handled.
   */
  getLinks() {
    return this._links;
  }
  set links(value) {
    this.setLinks(value);
  }
  get links() {
    return this.getLinks();
  }
  setNodes(nodes) {
    assert && assert(Object.getPrototypeOf(nodes) === Object.prototype);
    if (this._nodes !== nodes) {
      this._nodes = nodes;
      this.rebuildRichText();
    }
    return this;
  }
  getNodes() {
    return this._nodes;
  }
  set nodes(value) {
    this.setNodes(value);
  }
  get nodes() {
    return this.getNodes();
  }

  /**
   * Sets whether newlines are replaced with <br>
   */
  setReplaceNewlines(replaceNewlines) {
    if (this._replaceNewlines !== replaceNewlines) {
      this._replaceNewlines = replaceNewlines;
      this.rebuildRichText();
    }
    return this;
  }
  set replaceNewlines(value) {
    this.setReplaceNewlines(value);
  }
  get replaceNewlines() {
    return this.getReplaceNewlines();
  }
  getReplaceNewlines() {
    return this._replaceNewlines;
  }

  /**
   * Sets the alignment of text (only relevant if there are multiple lines).
   */
  setAlign(align) {
    assert && assert(align === 'left' || align === 'center' || align === 'right');
    if (this._align !== align) {
      this._align = align;
      this.rebuildRichText();
    }
    return this;
  }
  set align(value) {
    this.setAlign(value);
  }
  get align() {
    return this.getAlign();
  }

  /**
   * Returns the current alignment of the text (only relevant if there are multiple lines).
   */
  getAlign() {
    return this._align;
  }

  /**
   * Sets the leading (spacing between lines)
   */
  setLeading(leading) {
    assert && assert(isFinite(leading));
    if (this._leading !== leading) {
      this._leading = leading;
      this.rebuildRichText();
    }
    return this;
  }
  set leading(value) {
    this.setLeading(value);
  }
  get leading() {
    return this.getLeading();
  }

  /**
   * Returns the leading (spacing between lines)
   */
  getLeading() {
    return this._leading;
  }

  /**
   * Sets the line wrap width for the text (or null if none is desired). Lines longer than this length will wrap
   * automatically to the next line.
   *
   * @param lineWrap - If it's a number, it should be greater than 0.
   */
  setLineWrap(lineWrap) {
    assert && assert(lineWrap === null || lineWrap === 'stretch' || isFinite(lineWrap) && lineWrap > 0);
    if (this._lineWrap !== lineWrap) {
      this._lineWrap = lineWrap;
      this.rebuildRichText();
    }
    return this;
  }
  set lineWrap(value) {
    this.setLineWrap(value);
  }
  get lineWrap() {
    return this.getLineWrap();
  }

  /**
   * Returns the line wrap width.
   */
  getLineWrap() {
    return this._lineWrap;
  }
  mutate(options) {
    if (assert && options && options.hasOwnProperty('string') && options.hasOwnProperty(Text.STRING_PROPERTY_NAME) && options.stringProperty) {
      assert && assert(options.stringProperty.value === options.string, 'If both string and stringProperty are provided, then values should match');
    }
    return super.mutate(options);
  }

  /**
   * Returns a wrapped version of the string with a font specifier that uses the given font object.
   *
   * NOTE: Does an approximation of some font values (using <b> or <i>), and cannot force the lack of those if it is
   * included in bold/italic exterior tags.
   */
  static stringWithFont(str, font) {
    // TODO: ES6 string interpolation. https://github.com/phetsims/scenery/issues/1581
    return `${'<span style=\'' + 'font-style: '}${font.style};` + `font-variant: ${font.variant};` + `font-weight: ${font.weight};` + `font-stretch: ${font.stretch};` + `font-size: ${font.size};` + `font-family: ${font.family};` + `line-height: ${font.lineHeight};` + `'>${str}</span>`;
  }

  /**
   * Stringifies an HTML subtree defined by the given element.
   */
  static himalayaElementToString(element, isLTR) {
    if (isHimalayaTextNode(element)) {
      return RichText.contentToString(element.content, isLTR);
    } else if (isHimalayaElementNode(element)) {
      const dirAttributeString = RichTextUtils.himalayaGetAttribute('dir', element);
      if (element.tagName === 'span' && dirAttributeString) {
        isLTR = dirAttributeString === 'ltr';
      }

      // Process children
      return element.children.map(child => RichText.himalayaElementToString(child, isLTR)).join('');
    } else {
      return '';
    }
  }

  /**
   * Stringifies an HTML subtree defined by the given element, but removing certain tags that we don't need for
   * accessibility (like <a>, <span>, etc.), and adding in tags we do want (see ACCESSIBLE_TAGS).
   */
  static himalayaElementToAccessibleString(element, isLTR) {
    if (isHimalayaTextNode(element)) {
      return RichText.contentToString(element.content, isLTR);
    } else if (isHimalayaElementNode(element)) {
      const dirAttribute = RichTextUtils.himalayaGetAttribute('dir', element);
      if (element.tagName === 'span' && dirAttribute) {
        isLTR = dirAttribute === 'ltr';
      }

      // Process children
      const content = element.children.map(child => RichText.himalayaElementToAccessibleString(child, isLTR)).join('');
      if (_.includes(ACCESSIBLE_TAGS, element.tagName)) {
        return `<${element.tagName}>${content}</${element.tagName}>`;
      } else {
        return content;
      }
    } else {
      return '';
    }
  }

  /**
   * Takes the element.content from himalaya, unescapes HTML entities, and applies the proper directional tags.
   *
   * See https://github.com/phetsims/scenery-phet/issues/315
   */
  static contentToString(content, isLTR) {
    // @ts-expect-error - we should get a string from this
    const unescapedContent = he.decode(content);
    return isLTR ? `\u202a${unescapedContent}\u202c` : `\u202b${unescapedContent}\u202c`;
  }
}

/**
 * {Array.<string>} - String keys for all the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
RichText.prototype._mutatorKeys = RICH_TEXT_OPTION_KEYS.concat(Node.prototype._mutatorKeys);
scenery.register('RichText', RichText);
RichText.RichTextIO = new IOType('RichTextIO', {
  valueType: RichText,
  supertype: Node.NodeIO,
  documentation: 'The PhET-iO Type for the scenery RichText node'
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJpbmdQcm9wZXJ0eSIsIlRpbnlGb3J3YXJkaW5nUHJvcGVydHkiLCJUYW5kZW0iLCJJT1R5cGUiLCJhbGxvd0xpbmtzUHJvcGVydHkiLCJDb2xvciIsIkZvbnQiLCJnZXRMaW5lQnJlYWtSYW5nZXMiLCJpc0hpbWFsYXlhRWxlbWVudE5vZGUiLCJpc0hpbWFsYXlhVGV4dE5vZGUiLCJMaW5lIiwiTm9kZSIsIlJpY2hUZXh0RWxlbWVudCIsIlJpY2hUZXh0TGVhZiIsIlJpY2hUZXh0TGluayIsIlJpY2hUZXh0Tm9kZSIsIlJpY2hUZXh0VXRpbHMiLCJSaWNoVGV4dFZlcnRpY2FsU3BhY2VyIiwic2NlbmVyeSIsIlRleHQiLCJXaWR0aFNpemFibGUiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIlBoZXRpb09iamVjdCIsImNsZWFuQXJyYXkiLCJwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkiLCJoaW1hbGF5YVZhciIsImhpbWFsYXlhIiwiYXNzZXJ0IiwiUklDSF9URVhUX09QVElPTl9LRVlTIiwiU1RSSU5HX1BST1BFUlRZX05BTUUiLCJpc1N0cmluZ1Rlc3QiLCJ3aW5kb3ciLCJRdWVyeVN0cmluZ01hY2hpbmUiLCJjb250YWluc0tleSIsIkRFRkFVTFRfRk9OVCIsInNpemUiLCJBQ0NFU1NJQkxFX1RBR1MiLCJMaW5lQnJlYWtTdGF0ZSIsIkNPTVBMRVRFIiwiSU5DT01QTEVURSIsIk5PTkUiLCJ1c2VkTGlua3MiLCJ1c2VkTm9kZXMiLCJGT05UX1NUWUxFX01BUCIsIkZPTlRfU1RZTEVfS0VZUyIsIk9iamVjdCIsImtleXMiLCJTVFlMRV9LRVlTIiwiY29uY2F0IiwiUmljaFRleHQiLCJfZm9udCIsIl9ib3VuZHNNZXRob2QiLCJfZmlsbCIsIl9zdHJva2UiLCJfbGluZVdpZHRoIiwiX3N1YlNjYWxlIiwiX3N1YlhTcGFjaW5nIiwiX3N1YllPZmZzZXQiLCJfc3VwU2NhbGUiLCJfc3VwWFNwYWNpbmciLCJfc3VwWU9mZnNldCIsIl9jYXBIZWlnaHRTY2FsZSIsIl91bmRlcmxpbmVMaW5lV2lkdGgiLCJfdW5kZXJsaW5lSGVpZ2h0U2NhbGUiLCJfc3RyaWtldGhyb3VnaExpbmVXaWR0aCIsIl9zdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUiLCJfbGlua0ZpbGwiLCJfbGlua0V2ZW50c0hhbmRsZWQiLCJfbGlua3MiLCJfbm9kZXMiLCJfcmVwbGFjZU5ld2xpbmVzIiwiX2FsaWduIiwiX2xlYWRpbmciLCJfbGluZVdyYXAiLCJfbGlua0l0ZW1zIiwiX2hhc0FkZGVkTGVhZlRvTGluZSIsIm5lZWRQZW5kaW5nTWluaW11bVdpZHRoIiwicGVuZGluZ01pbmltdW1XaWR0aCIsIlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRSIsImNvbnN0cnVjdG9yIiwic3RyaW5nIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImZpbGwiLCJ0YW5kZW1OYW1lU3VmZml4IiwicGhldGlvVHlwZSIsIlJpY2hUZXh0SU8iLCJwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJzdHJpbmdQcm9wZXJ0eSIsIl9zdHJpbmdQcm9wZXJ0eSIsIm9uU3RyaW5nUHJvcGVydHlDaGFuZ2UiLCJiaW5kIiwibGluZUNvbnRhaW5lciIsImFkZENoaWxkIiwicmVidWlsZFJpY2hUZXh0IiwibG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5IiwibGF6eUxpbmsiLCJtdXRhdGUiLCJzZXRTdHJpbmdQcm9wZXJ0eSIsIm5ld1RhcmdldCIsInNldFRhcmdldFByb3BlcnR5IiwicHJvcGVydHkiLCJnZXRTdHJpbmdQcm9wZXJ0eSIsImdldFBoZXRpb01vdXNlSGl0VGFyZ2V0IiwiZnJvbUxpbmtpbmciLCJ2YWx1ZSIsImdldFN0cmluZ1Byb3BlcnR5UGhldGlvTW91c2VIaXRUYXJnZXQiLCJ0YXJnZXRTdHJpbmdQcm9wZXJ0eSIsImdldFRhcmdldFByb3BlcnR5IiwiaW5pdGlhbGl6ZVBoZXRpb09iamVjdCIsImJhc2VPcHRpb25zIiwid2FzSW5zdHJ1bWVudGVkIiwiaXNQaGV0aW9JbnN0cnVtZW50ZWQiLCJQSEVUX0lPX0VOQUJMRUQiLCJpbml0aWFsaXplUGhldGlvIiwicGhldGlvUmVhZE9ubHkiLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwic3RyaW5nUHJvcGVydHlPcHRpb25zIiwiaGFzRHluYW1pY1dpZHRoIiwid2lkdGhTaXphYmxlIiwiZWZmZWN0aXZlTGluZVdyYXAiLCJsb2NhbFByZWZlcnJlZFdpZHRoIiwiZnJlZUNoaWxkcmVuVG9Qb29sIiwiYXBwZW5kRW1wdHlMZWFmIiwic2NlbmVyeUxvZyIsImlkIiwicHVzaCIsIm1hcHBlZFRleHQiLCJyZXBsYWNlIiwicm9vdEVsZW1lbnRzIiwicGFyc2UiLCJlIiwibGVuZ3RoIiwid2lkdGhBdmFpbGFibGUiLCJOdW1iZXIiLCJQT1NJVElWRV9JTkZJTklUWSIsImlzUm9vdExUUiIsImN1cnJlbnRMaW5lIiwicG9vbCIsImNyZWF0ZSIsImVsZW1lbnQiLCJjdXJyZW50TGluZVdpZHRoIiwiYm91bmRzIiwiaXNWYWxpZCIsIndpZHRoIiwibGluZUJyZWFrU3RhdGUiLCJhcHBlbmRFbGVtZW50IiwiYXBwZW5kTGluZSIsInNjcmF0Y2hUZXh0Iiwic2V0U3RyaW5nIiwic2V0Rm9udCIsImhlaWdodCIsInNwbGljZSIsImdldENoaWxkcmVuQ291bnQiLCJhbGlnbkxpbmVzIiwibGlua0VsZW1lbnQiLCJocmVmIiwiaSIsIm5vZGVzIiwiaXRlbSIsIm5vZGUiLCJsaW5rUm9vdE5vZGUiLCJpbm5lckNvbnRlbnQiLCJtYXRyaXgiLCJnZXRVbmlxdWVUcmFpbFRvIiwiZ2V0TWF0cml4IiwiZGV0YWNoIiwiZm9yRWFjaCIsImxpbmsiLCJpbmNsdWRlcyIsImxvY2FsTWluaW11bVdpZHRoIiwibG9jYWxCb3VuZHMiLCJwb3AiLCJfY2hpbGRyZW4iLCJjaGlsZCIsInJlbW92ZUNoaWxkIiwiY2xlYW4iLCJkaXNwb3NlIiwibGluZU5vZGUiLCJ0b3AiLCJib3R0b20iLCJsZWZ0IiwiY29vcmRpbmF0ZU5hbWUiLCJpZGVhbCIsImdldENoaWxkQXQiLCJjb250YWluZXJOb2RlIiwiZm9udCIsImlzTFRSIiwiYXBwbGllZFNjYWxlIiwiY29udGFpbmVyU3BhY2luZyIsInJpZ2h0U3BhY2luZyIsImxlZnRTcGFjaW5nIiwid2lkdGhBdmFpbGFibGVXaXRoU3BhY2luZyIsImNvbnRlbnQiLCJNYXRoIiwibWF4IiwibWFwIiwicmFuZ2UiLCJzbGljZSIsIm1pbiIsInRlbXBvcmFyeU5vZGUiLCJsb2NhbE1pbmludW1XaWR0aCIsImZpdHNJbiIsInJhbmdlcyIsInJhbmdlc1RvU3RyaW5nIiwic2tpcHBlZFJhbmdlcyIsInN1Y2Nlc3MiLCJ1bnNoaWZ0IiwidGFnTmFtZSIsImRpckF0dHJpYnV0ZVN0cmluZyIsImhpbWFsYXlhR2V0QXR0cmlidXRlIiwicmVmZXJlbmNlZElkIiwicmVmZXJlbmNlZE5vZGUiLCJub2RlQWxpZ24iLCJ0ZXh0Qm91bmRzIiwiY2VudGVyWSIsInN0eWxlQXR0cmlidXRlU3RyaW5nIiwiY3NzIiwiaGltYWxheWFTdHlsZVN0cmluZ1RvTWFwIiwia2V5IiwiXyIsImNvbG9yIiwiZm9udE9wdGlvbnMiLCJzdHlsZUtleSIsImZyb21DU1MiLCJjb3B5Iiwib3JpZ2luYWxIcmVmIiwic3RhcnRzV2l0aCIsImluZGV4T2YiLCJsaW5rTmFtZSIsImhpbWFsYXlhRWxlbWVudFRvQWNjZXNzaWJsZVN0cmluZyIsIndlaWdodCIsInN0eWxlIiwic2NhbGUiLCJhZGRFeHRyYUJlZm9yZVNwYWNpbmciLCJ5IiwiZ2V0U2NhbGVWZWN0b3IiLCJ4IiwiY2hpbGRyZW4iLCJ3aWR0aEJlZm9yZSIsImNoaWxkRWxlbWVudCIsIndpZHRoQWZ0ZXIiLCJpc0Zpbml0ZSIsInVuZGVybGluZVkiLCJsb2NhbExlZnQiLCJsb2NhbFJpZ2h0Iiwic3Ryb2tlIiwibGluZVdpZHRoIiwic3RyaWtldGhyb3VnaFkiLCJ3YXNBZGRlZCIsImFkZEVsZW1lbnQiLCJmaWx0ZXIiLCJ1bmRlZmluZWQiLCJzZXQiLCJnZXRTdHJpbmciLCJzZXRCb3VuZHNNZXRob2QiLCJtZXRob2QiLCJib3VuZHNNZXRob2QiLCJnZXRCb3VuZHNNZXRob2QiLCJnZXRGb250Iiwic2V0RmlsbCIsImdldEZpbGwiLCJzZXRTdHJva2UiLCJnZXRTdHJva2UiLCJzZXRMaW5lV2lkdGgiLCJnZXRMaW5lV2lkdGgiLCJzZXRTdWJTY2FsZSIsInN1YlNjYWxlIiwiZ2V0U3ViU2NhbGUiLCJzZXRTdWJYU3BhY2luZyIsInN1YlhTcGFjaW5nIiwiZ2V0U3ViWFNwYWNpbmciLCJzZXRTdWJZT2Zmc2V0Iiwic3ViWU9mZnNldCIsImdldFN1YllPZmZzZXQiLCJzZXRTdXBTY2FsZSIsInN1cFNjYWxlIiwiZ2V0U3VwU2NhbGUiLCJzZXRTdXBYU3BhY2luZyIsInN1cFhTcGFjaW5nIiwiZ2V0U3VwWFNwYWNpbmciLCJzZXRTdXBZT2Zmc2V0Iiwic3VwWU9mZnNldCIsImdldFN1cFlPZmZzZXQiLCJzZXRDYXBIZWlnaHRTY2FsZSIsImNhcEhlaWdodFNjYWxlIiwiZ2V0Q2FwSGVpZ2h0U2NhbGUiLCJzZXRVbmRlcmxpbmVMaW5lV2lkdGgiLCJ1bmRlcmxpbmVMaW5lV2lkdGgiLCJnZXRVbmRlcmxpbmVMaW5lV2lkdGgiLCJzZXRVbmRlcmxpbmVIZWlnaHRTY2FsZSIsInVuZGVybGluZUhlaWdodFNjYWxlIiwiZ2V0VW5kZXJsaW5lSGVpZ2h0U2NhbGUiLCJzZXRTdHJpa2V0aHJvdWdoTGluZVdpZHRoIiwic3RyaWtldGhyb3VnaExpbmVXaWR0aCIsImdldFN0cmlrZXRocm91Z2hMaW5lV2lkdGgiLCJzZXRTdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUiLCJzdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUiLCJnZXRTdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUiLCJzZXRMaW5rRmlsbCIsImxpbmtGaWxsIiwiZ2V0TGlua0ZpbGwiLCJzZXRMaW5rRXZlbnRzSGFuZGxlZCIsImxpbmtFdmVudHNIYW5kbGVkIiwiZ2V0TGlua0V2ZW50c0hhbmRsZWQiLCJzZXRMaW5rcyIsImxpbmtzIiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJnZXRMaW5rcyIsInNldE5vZGVzIiwiZ2V0Tm9kZXMiLCJzZXRSZXBsYWNlTmV3bGluZXMiLCJyZXBsYWNlTmV3bGluZXMiLCJnZXRSZXBsYWNlTmV3bGluZXMiLCJzZXRBbGlnbiIsImFsaWduIiwiZ2V0QWxpZ24iLCJzZXRMZWFkaW5nIiwibGVhZGluZyIsImdldExlYWRpbmciLCJzZXRMaW5lV3JhcCIsImxpbmVXcmFwIiwiZ2V0TGluZVdyYXAiLCJoYXNPd25Qcm9wZXJ0eSIsInN0cmluZ1dpdGhGb250Iiwic3RyIiwidmFyaWFudCIsInN0cmV0Y2giLCJmYW1pbHkiLCJsaW5lSGVpZ2h0IiwiaGltYWxheWFFbGVtZW50VG9TdHJpbmciLCJjb250ZW50VG9TdHJpbmciLCJqb2luIiwiZGlyQXR0cmlidXRlIiwidW5lc2NhcGVkQ29udGVudCIsImhlIiwiZGVjb2RlIiwiX211dGF0b3JLZXlzIiwicmVnaXN0ZXIiLCJ2YWx1ZVR5cGUiLCJzdXBlcnR5cGUiLCJOb2RlSU8iLCJkb2N1bWVudGF0aW9uIl0sInNvdXJjZXMiOlsiUmljaFRleHQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRGlzcGxheXMgcmljaCB0ZXh0IGJ5IGludGVycHJldGluZyB0aGUgaW5wdXQgdGV4dCBhcyBIVE1MLCBzdXBwb3J0aW5nIGEgbGltaXRlZCBzZXQgb2YgdGFncyB0aGF0IHByZXZlbnQgYW55XHJcbiAqIHNlY3VyaXR5IHZ1bG5lcmFiaWxpdGllcy4gSXQgZG9lcyB0aGlzIGJ5IHBhcnNpbmcgdGhlIGlucHV0IEhUTUwgYW5kIHNwbGl0dGluZyBpdCBpbnRvIG11bHRpcGxlIFRleHQgY2hpbGRyZW5cclxuICogcmVjdXJzaXZlbHkuXHJcbiAqXHJcbiAqIE5PVEU6IEVuY29kaW5nIEhUTUwgZW50aXRpZXMgaXMgcmVxdWlyZWQsIGFuZCBtYWxmb3JtZWQgSFRNTCBpcyBub3QgYWNjZXB0ZWQuXHJcbiAqXHJcbiAqIE5PVEU6IEN1cnJlbnRseSBpdCBjYW4gbGluZS13cmFwIGF0IHRoZSBzdGFydCBhbmQgZW5kIG9mIHRhZ3MuIFRoaXMgd2lsbCBwcm9iYWJseSBiZSBmaXhlZCBpbiB0aGUgZnV0dXJlIHRvIG9ubHlcclxuICogICAgICAgcG90ZW50aWFsbHkgYnJlYWsgb24gd2hpdGVzcGFjZS5cclxuICpcclxuICogSXQgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBtYXJrdXAgYW5kIGZlYXR1cmVzIGluIHRoZSBzdHJpbmcgY29udGVudCAoaW4gYWRkaXRpb24gdG8gb3RoZXIgb3B0aW9ucyBhcyBsaXN0ZWQgaW5cclxuICogUklDSF9URVhUX09QVElPTl9LRVlTKTpcclxuICogLSA8YSBocmVmPVwie3twbGFjZWhvbGRlcn19XCI+IGZvciBsaW5rcyAocGFzcyBpbiB7IGxpbmtzOiB7IHBsYWNlaG9sZGVyOiBBQ1RVQUxfSFJFRiB9IH0pXHJcbiAqIC0gPGI+IGFuZCA8c3Ryb25nPiBmb3IgYm9sZCB0ZXh0XHJcbiAqIC0gPGk+IGFuZCA8ZW0+IGZvciBpdGFsaWMgdGV4dFxyXG4gKiAtIDxzdWI+IGFuZCA8c3VwPiBmb3Igc3Vic2NyaXB0cyAvIHN1cGVyc2NyaXB0c1xyXG4gKiAtIDx1PiBmb3IgdW5kZXJsaW5lZCB0ZXh0XHJcbiAqIC0gPHM+IGZvciBzdHJpa2V0aHJvdWdoIHRleHRcclxuICogLSA8c3Bhbj4gdGFncyB3aXRoIGEgZGlyPVwibHRyXCIgLyBkaXI9XCJydGxcIiBhdHRyaWJ1dGVcclxuICogLSA8YnI+IGZvciBleHBsaWNpdCBsaW5lIGJyZWFrc1xyXG4gKiAtIDxub2RlIGlkPVwiaWRcIj4gZm9yIGVtYmVkZGluZyBhIE5vZGUgaW50byB0aGUgdGV4dCAocGFzcyBpbiB7IG5vZGVzOiB7IGlkOiBOT0RFIH0gfSksIHdpdGggb3B0aW9uYWwgYWxpZ24gYXR0cmlidXRlXHJcbiAqIC0gVW5pY29kZSBiaWRpcmVjdGlvbmFsIG1hcmtzIChwcmVzZW50IGluIFBoRVQgc3RyaW5ncykgZm9yIGZ1bGwgUlRMIHN1cHBvcnRcclxuICogLSBDU1Mgc3R5bGU9XCIuLi5cIiBhdHRyaWJ1dGVzLCB3aXRoIGNvbG9yIGFuZCBmb250IHNldHRpbmdzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzgwN1xyXG4gKlxyXG4gKiBFeGFtcGxlcyBmcm9tIHRoZSBzY2VuZXJ5LXBoZXQgZGVtbzpcclxuICpcclxuICogbmV3IFJpY2hUZXh0KCAnUmljaFRleHQgY2FuIGhhdmUgPGI+Ym9sZDwvYj4gYW5kIDxpPml0YWxpYzwvaT4gdGV4dC4nICksXHJcbiAqIG5ldyBSaWNoVGV4dCggJ0NhbiBkbyBIPHN1Yj4yPC9zdWI+TyAoQTxzdWI+c3ViPC9zdWI+IGFuZCBBPHN1cD5zdXA8L3N1cD4pLCBvciBuZXN0aW5nOiB4PHN1cD4yPHN1cD4yPC9zdXA+PC9zdXA+JyApLFxyXG4gKiBuZXcgUmljaFRleHQoICdBZGRpdGlvbmFsbHk6IDxzcGFuIHN0eWxlPVwiY29sb3I6IGJsdWU7XCI+Y29sb3I8L3NwYW4+LCA8c3BhbiBzdHlsZT1cImZvbnQtc2l6ZTogMzBweDtcIj5zaXplczwvc3Bhbj4sIDxzcGFuIHN0eWxlPVwiZm9udC1mYW1pbHk6IHNlcmlmO1wiPmZhY2VzPC9zcGFuPiwgPHM+c3RyaWtldGhyb3VnaDwvcz4sIGFuZCA8dT51bmRlcmxpbmU8L3U+JyApLFxyXG4gKiBuZXcgUmljaFRleHQoICdUaGVzZSA8Yj48ZW0+Y2FuPC9lbT4gPHU+PHNwYW4gc3R5bGU9XCJjb2xvcjogcmVkO1wiPmJlPC9zcGFuPiBtaXhlZDxzdXA+MTwvc3VwPjwvdT48L2I+LicgKSxcclxuICogbmV3IFJpY2hUZXh0KCAnXFx1MjAyYUhhbmRsZXMgYmlkaXJlY3Rpb25hbCB0ZXh0OiBcXHUyMDJiPHNwYW4gc3R5bGU9XCJjb2xvcjogIzBhMDtcIj7ZhdmC2KfYqNi2PC9zcGFuPiDYp9mE2YbYtSDYq9mG2KfYptmKIDxiPtin2YTYp9iq2KzYp9mHPC9iPjxzdWI+Mjwvc3ViPlxcdTIwMmNcXHUyMDJjJyApLFxyXG4gKiBuZXcgUmljaFRleHQoICdcXHUyMDJiXFx1MDYyYVxcdTA2MzNcXHUwNjJhIChcXHUwNjMyXFx1MDYyOFxcdTA2MjdcXHUwNjQ2KVxcdTIwMmMnICksXHJcbiAqIG5ldyBSaWNoVGV4dCggJ0hUTUwgZW50aXRpZXMgbmVlZCB0byBiZSBlc2NhcGVkLCBsaWtlICZhbXA7IGFuZCAmbHQ7LicgKSxcclxuICogbmV3IFJpY2hUZXh0KCAnU3VwcG9ydHMgPGEgaHJlZj1cInt7cGhldFdlYnNpdGV9fVwiPjxlbT5saW5rczwvZW0+IHdpdGggPGI+bWFya3VwPC9iPjwvYT4sIGFuZCA8YSBocmVmPVwie3tjYWxsYmFja319XCI+bGlua3MgdGhhdCBjYWxsIGZ1bmN0aW9uczwvYT4uJywge1xyXG4gKiAgIGxpbmtzOiB7XHJcbiAqICAgICBwaGV0V2Vic2l0ZTogJ2h0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUnLFxyXG4gKiAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBjb25zb2xlLmxvZyggJ0xpbmsgd2FzIGNsaWNrZWQnICk7XHJcbiAqICAgICB9XHJcbiAqICAgfVxyXG4gKiB9ICksXHJcbiAqIG5ldyBSaWNoVGV4dCggJ09yIGFsc28gPGEgaHJlZj1cImh0dHBzOi8vcGhldC5jb2xvcmFkby5lZHVcIj5saW5rcyBkaXJlY3RseSBpbiB0aGUgc3RyaW5nPC9hPi4nLCB7XHJcbiAqICAgbGlua3M6IHRydWVcclxuICogfSApLFxyXG4gKiBuZXcgUmljaFRleHQoICdMaW5rcyBub3QgZm91bmQgPGEgaHJlZj1cInt7Ym9ndXN9fVwiPmFyZSBpZ25vcmVkPC9hPiBmb3Igc2VjdXJpdHkuJyApLFxyXG4gKiBuZXcgSEJveCgge1xyXG4gKiAgIHNwYWNpbmc6IDMwLFxyXG4gKiAgIGNoaWxkcmVuOiBbXHJcbiAqICAgICBuZXcgUmljaFRleHQoICdNdWx0aS1saW5lIHRleHQgd2l0aCB0aGU8YnI+c2VwYXJhdG9yICZsdDticiZndDsgYW5kIDxhIGhyZWY9XCJodHRwczovL3BoZXQuY29sb3JhZG8uZWR1XCI+aGFuZGxlczxicj5saW5rczwvYT4gYW5kIG90aGVyIDxiPnRhZ3M8YnI+YWNyb3NzIGxpbmVzPC9iPicsIHtcclxuICogICAgICAgbGlua3M6IHRydWVcclxuICogICAgIH0gKSxcclxuICogICAgIG5ldyBSaWNoVGV4dCggJ1N1cHBvc2VkbHkgUmljaFRleHQgc3VwcG9ydHMgbGluZSB3cmFwcGluZy4gSGVyZSBpcyBhIGxpbmVXcmFwIG9mIDMwMCwgd2hpY2ggc2hvdWxkIHByb2JhYmx5IHdyYXAgbXVsdGlwbGUgdGltZXMgaGVyZScsIHsgbGluZVdyYXA6IDMwMCB9IClcclxuICogICBdXHJcbiAqIH0gKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFByb3BlcnR5T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgeyBhbGxvd0xpbmtzUHJvcGVydHksIENvbG9yLCBGb250LCBnZXRMaW5lQnJlYWtSYW5nZXMsIEhpbWFsYXlhTm9kZSwgaXNIaW1hbGF5YUVsZW1lbnROb2RlLCBpc0hpbWFsYXlhVGV4dE5vZGUsIExpbmUsIE5vZGUsIE5vZGVPcHRpb25zLCBSaWNoVGV4dENsZWFuYWJsZU5vZGUsIFJpY2hUZXh0RWxlbWVudCwgUmljaFRleHRMZWFmLCBSaWNoVGV4dExpbmssIFJpY2hUZXh0Tm9kZSwgUmljaFRleHRVdGlscywgUmljaFRleHRWZXJ0aWNhbFNwYWNlciwgc2NlbmVyeSwgVGV4dCwgVGV4dEJvdW5kc01ldGhvZCwgVFBhaW50LCBXaWR0aFNpemFibGUgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgUGhldGlvT2JqZWN0LCB7IFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3BoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi4vLi4vLi4vc2hlcnBhL2xpYi9oaW1hbGF5YS0xLjEuMC5qcyc7XHJcbmltcG9ydCBSZXF1aXJlZE9wdGlvbiBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUmVxdWlyZWRPcHRpb24uanMnO1xyXG5cclxuLy8gQHRzLWV4cGVjdC1lcnJvciAtIFNpbmNlIGhpbWFsYXlhIGlzbid0IGluIHRzY29uZmlnXHJcbmNvbnN0IGhpbWFsYXlhVmFyID0gaGltYWxheWE7XHJcbmFzc2VydCAmJiBhc3NlcnQoIGhpbWFsYXlhVmFyLCAnaGltYWxheWEgZGVwZW5kZW5jeSBuZWVkZWQgZm9yIFJpY2hUZXh0LicgKTtcclxuXHJcbi8vIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB0aGUgY29uc3RydWN0b3IsIHdpdGggbXV0YXRlKCksIG9yIGRpcmVjdGx5IGFzIHNldHRlcnMvZ2V0dGVyc1xyXG4vLyBlYWNoIG9mIHRoZXNlIG9wdGlvbnMgaGFzIGFuIGFzc29jaWF0ZWQgc2V0dGVyLCBzZWUgc2V0dGVyIG1ldGhvZHMgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5jb25zdCBSSUNIX1RFWFRfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ2JvdW5kc01ldGhvZCcsXHJcbiAgJ2ZvbnQnLFxyXG4gICdmaWxsJyxcclxuICAnc3Ryb2tlJyxcclxuICAnbGluZVdpZHRoJyxcclxuICAnc3ViU2NhbGUnLFxyXG4gICdzdWJYU3BhY2luZycsXHJcbiAgJ3N1YllPZmZzZXQnLFxyXG4gICdzdXBTY2FsZScsXHJcbiAgJ3N1cFhTcGFjaW5nJyxcclxuICAnc3VwWU9mZnNldCcsXHJcbiAgJ2NhcEhlaWdodFNjYWxlJyxcclxuICAndW5kZXJsaW5lTGluZVdpZHRoJyxcclxuICAndW5kZXJsaW5lSGVpZ2h0U2NhbGUnLFxyXG4gICdzdHJpa2V0aHJvdWdoTGluZVdpZHRoJyxcclxuICAnc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlJyxcclxuICAnbGlua0ZpbGwnLFxyXG4gICdsaW5rRXZlbnRzSGFuZGxlZCcsXHJcbiAgJ2xpbmtzJyxcclxuICAnbm9kZXMnLFxyXG4gICdyZXBsYWNlTmV3bGluZXMnLFxyXG4gICdhbGlnbicsXHJcbiAgJ2xlYWRpbmcnLFxyXG4gICdsaW5lV3JhcCcsXHJcbiAgVGV4dC5TVFJJTkdfUFJPUEVSVFlfTkFNRSxcclxuICAnc3RyaW5nJ1xyXG5dO1xyXG5cclxuZXhwb3J0IHR5cGUgUmljaFRleHRBbGlnbiA9ICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0JztcclxuZXhwb3J0IHR5cGUgUmljaFRleHRIcmVmID0gKCAoKSA9PiB2b2lkICkgfCBzdHJpbmc7XHJcbnR5cGUgUmljaFRleHRMaW5rc09iamVjdCA9IFJlY29yZDxzdHJpbmcsIFJpY2hUZXh0SHJlZj47XHJcbmV4cG9ydCB0eXBlIFJpY2hUZXh0TGlua3MgPSBSaWNoVGV4dExpbmtzT2JqZWN0IHwgdHJ1ZTtcclxuXHJcbi8vIFVzZWQgb25seSBmb3IgZ3VhcmRpbmcgYWdhaW5zdCBhc3NlcnRpb25zLCB3ZSB3YW50IHRvIGtub3cgdGhhdCB3ZSBhcmVuJ3QgaW4gc3RyaW5nVGVzdGluZyBtb2RlXHJcbmNvbnN0IGlzU3RyaW5nVGVzdCA9IHdpbmRvdy5RdWVyeVN0cmluZ01hY2hpbmUgJiYgUXVlcnlTdHJpbmdNYWNoaW5lLmNvbnRhaW5zS2V5KCAnc3RyaW5nVGVzdCcgKTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgLy8gU2V0cyBob3cgYm91bmRzIGFyZSBkZXRlcm1pbmVkIGZvciB0ZXh0XHJcbiAgYm91bmRzTWV0aG9kPzogVGV4dEJvdW5kc01ldGhvZDtcclxuXHJcbiAgLy8gU2V0cyB0aGUgZm9udCBmb3IgdGhlIHRleHRcclxuICBmb250PzogRm9udCB8IHN0cmluZztcclxuXHJcbiAgLy8gU2V0cyB0aGUgZmlsbCBvZiB0aGUgdGV4dFxyXG4gIGZpbGw/OiBUUGFpbnQ7XHJcblxyXG4gIC8vIFNldHMgdGhlIHN0cm9rZSBhcm91bmQgdGhlIHRleHRcclxuICBzdHJva2U/OiBUUGFpbnQ7XHJcblxyXG4gIC8vIFNldHMgdGhlIGxpbmVXaWR0aCBhcm91bmQgdGhlIHRleHRcclxuICBsaW5lV2lkdGg/OiBudW1iZXI7XHJcblxyXG4gIC8vIFNldHMgdGhlIHNjYWxlIG9mIGFueSBzdWJzY3JpcHQgZWxlbWVudHNcclxuICBzdWJTY2FsZT86IG51bWJlcjtcclxuXHJcbiAgLy8gU2V0cyBob3Jpem9udGFsIHNwYWNpbmcgYmVmb3JlIGFueSBzdWJzY3JpcHQgZWxlbWVudHNcclxuICBzdWJYU3BhY2luZz86IG51bWJlcjtcclxuXHJcbiAgLy8gU2V0cyB2ZXJ0aWNhbCBvZmZzZXQgZm9yIGFueSBzdWJzY3JpcHQgZWxlbWVudHNcclxuICBzdWJZT2Zmc2V0PzogbnVtYmVyO1xyXG5cclxuICAvLyBTZXRzIHRoZSBzY2FsZSBmb3IgYW55IHN1cGVyc2NyaXB0IGVsZW1lbnRzXHJcbiAgc3VwU2NhbGU/OiBudW1iZXI7XHJcblxyXG4gIC8vIFNldHMgdGhlIGhvcml6b250YWwgb2Zmc2V0IGJlZm9yZSBhbnkgc3VwZXJzY3JpcHQgZWxlbWVudHNcclxuICBzdXBYU3BhY2luZz86IG51bWJlcjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgdmVydGljYWwgb2Zmc2V0IGZvciBhbnkgc3VwZXJzY3JpcHQgZWxlbWVudHNcclxuICBzdXBZT2Zmc2V0PzogbnVtYmVyO1xyXG5cclxuICAvLyBTZXRzIHRoZSBleHBlY3RlZCBjYXAgaGVpZ2h0IGNhcCBoZWlnaHQgKGJhc2VsaW5lIHRvIHRvcCBvZiBjYXBpdGFsIGxldHRlcnMpIGFzIGEgc2NhbGVcclxuICBjYXBIZWlnaHRTY2FsZT86IG51bWJlcjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgbGluZSB3aWR0aCBmb3IgdW5kZXJsaW5lc1xyXG4gIHVuZGVybGluZUxpbmVXaWR0aD86IG51bWJlcjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgdW5kZXJsaW5lIGhlaWdodCBhcyBhIHNjYWxlIHJlbGF0aXZlIHRvIHRleHQgYm91bmRzIGhlaWdodFxyXG4gIHVuZGVybGluZUhlaWdodFNjYWxlPzogbnVtYmVyO1xyXG5cclxuICAvLyBTZXRzIGxpbmUgd2lkdGggZm9yIHN0cmlrZXRocm91Z2hcclxuICBzdHJpa2V0aHJvdWdoTGluZVdpZHRoPzogbnVtYmVyO1xyXG5cclxuICAvLyBTZXRzIGhlaWdodCBvZiBzdHJpa2V0aHJvdWdoIGFzIGEgc2NhbGUgcmVsYXRpdmUgdG8gdGV4dCBib3VuZHMgaGVpZ2h0XHJcbiAgc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlPzogbnVtYmVyO1xyXG5cclxuICAvLyBTZXRzIHRoZSBmaWxsIGZvciBsaW5rcyB3aXRoaW4gdGhlIHRleHRcclxuICBsaW5rRmlsbD86IFRQYWludDtcclxuXHJcbiAgLy8gU2V0cyB3aGV0aGVyIGxpbmsgY2xpY2tzIHdpbGwgY2FsbCBldmVudC5oYW5kbGUoKVxyXG4gIGxpbmtFdmVudHNIYW5kbGVkPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgbWFwIG9mIGhyZWYgcGxhY2Vob2xkZXIgPT4gYWN0dWFsIGhyZWYvY2FsbGJhY2sgdXNlZCBmb3IgbGlua3MuIEhvd2V2ZXIsIGlmIHNldCB0byB0cnVlICh7Ym9vbGVhbn0pIGFzIGFcclxuICAvLyBmdWxsIG9iamVjdCwgbGlua3MgaW4gdGhlIHN0cmluZyB3aWxsIG5vdCBiZSBtYXBwZWQsIGJ1dCB3aWxsIGJlIGRpcmVjdGx5IGFkZGVkLlxyXG4gIC8vXHJcbiAgLy8gRm9yIGluc3RhbmNlLCB0aGUgZGVmYXVsdCBpcyB0byBtYXAgaHJlZnMgZm9yIHNlY3VyaXR5IHB1cnBvc2VzOlxyXG4gIC8vXHJcbiAgLy8gbmV3IFJpY2hUZXh0KCAnPGEgaHJlZj1cInt7YWxpbmt9fVwiPmNvbnRlbnQ8L2E+Jywge1xyXG4gIC8vICAgbGlua3M6IHtcclxuICAvLyAgICAgYWxpbms6ICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1J1xyXG4gIC8vICAgfVxyXG4gIC8vIH0gKTtcclxuICAvL1xyXG4gIC8vIEJ1dCBsaW5rcyB3aXRoIGFuIGhyZWYgbm90IG1hdGNoaW5nIHdpbGwgYmUgaWdub3JlZC4gVGhpcyBjYW4gYmUgYXZvaWRlZCBieSBwYXNzaW5nIGxpbmtzOiB0cnVlIHRvIGRpcmVjdGx5XHJcbiAgLy8gZW1iZWQgbGlua3M6XHJcbiAgLy9cclxuICAvLyBuZXcgUmljaFRleHQoICc8YSBocmVmPVwiaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdVwiPmNvbnRlbnQ8L2E+JywgeyBsaW5rczogdHJ1ZSB9ICk7XHJcbiAgLy9cclxuICAvLyBDYWxsYmFja3MgKGluc3RlYWQgb2YgYSBVUkwpIGFyZSBhbHNvIHN1cHBvcnRlZCwgZS5nLjpcclxuICAvL1xyXG4gIC8vIG5ldyBSaWNoVGV4dCggJzxhIGhyZWY9XCJ7e2FjYWxsYmFja319XCI+Y29udGVudDwvYT4nLCB7XHJcbiAgLy8gICBsaW5rczoge1xyXG4gIC8vICAgICBhY2FsbGJhY2s6IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyggJ2NsaWNrZWQnICkgfVxyXG4gIC8vICAgfVxyXG4gIC8vIH0gKTtcclxuICAvL1xyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy8zMTYgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgbGlua3M/OiBSaWNoVGV4dExpbmtzO1xyXG5cclxuICAvLyBBIG1hcCBvZiBzdHJpbmcgPT4gTm9kZSwgd2hlcmUgYDxub2RlIGlkPVwic3RyaW5nXCIvPmAgd2lsbCBnZXQgcmVwbGFjZWQgYnkgdGhlIGdpdmVuIE5vZGUgKERBRyBzdXBwb3J0ZWQpXHJcbiAgLy9cclxuICAvLyBGb3IgZXhhbXBsZTpcclxuICAvL1xyXG4gIC8vIG5ldyBSaWNoVGV4dCggJ1RoaXMgaXMgYSA8bm9kZSBpZD1cInRlc3RcIi8+Jywge1xyXG4gIC8vICAgbm9kZXM6IHtcclxuICAvLyAgICAgdGVzdDogbmV3IFRleHQoICdOb2RlJyApXHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG4gIC8vXHJcbiAgLy8gQWxpZ25tZW50IGlzIGFsc28gc3VwcG9ydGVkLCB3aXRoIHRoZSBhbGlnbiBhdHRyaWJ1dGUgKGNlbnRlci90b3AvYm90dG9tL29yaWdpbikuXHJcbiAgLy8gVGhpcyBhbGlnbm1lbnQgaXMgaW4gcmVsYXRpb24gdG8gdGhlIGN1cnJlbnQgdGV4dC9mb250IHNpemUgaW4gdGhlIEhUTUwgd2hlcmUgdGhlIDxub2RlPiB0YWcgaXMgcGxhY2VkLlxyXG4gIC8vIEFuIGV4YW1wbGU6XHJcbiAgLy9cclxuICAvLyBuZXcgUmljaFRleHQoICdUaGlzIGlzIGEgPG5vZGUgaWQ9XCJ0ZXN0XCIgYWxpZ249XCJ0b3BcIi8+Jywge1xyXG4gIC8vICAgbm9kZXM6IHtcclxuICAvLyAgICAgdGVzdDogbmV3IFRleHQoICdOb2RlJyApXHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG4gIC8vIE5PVEU6IFdoZW4gYWxpZ25tZW50IGlzbid0IHN1cHBsaWVkLCBvcmlnaW4gaXMgdXNlZCBhcyBhIGRlZmF1bHQuIE9yaWdpbiBtZWFucyBcInk9MCBpcyBwbGFjZWQgYXQgdGhlIGJhc2VsaW5lIG9mXHJcbiAgLy8gdGhlIHRleHRcIi5cclxuICBub2Rlcz86IFJlY29yZDxzdHJpbmcsIE5vZGU+O1xyXG5cclxuICAvLyBXaWxsIHJlcGxhY2UgbmV3bGluZXMgKGBcXG5gKSB3aXRoIDxicj4sIHNpbWlsYXIgdG8gdGhlIG9sZCBNdWx0aUxpbmVUZXh0IChkZWZhdWx0cyB0byBmYWxzZSlcclxuICByZXBsYWNlTmV3bGluZXM/OiBib29sZWFuO1xyXG5cclxuICAvLyBTZXRzIHRleHQgYWxpZ25tZW50IGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBsaW5lc1xyXG4gIGFsaWduPzogUmljaFRleHRBbGlnbjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgc3BhY2luZyBiZXR3ZWVuIGxpbmVzIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBsaW5lc1xyXG4gIGxlYWRpbmc/OiBudW1iZXI7XHJcblxyXG4gIC8vIFNldHMgd2lkdGggb2YgdGV4dCBiZWZvcmUgY3JlYXRpbmcgYSBuZXcgbGluZS5cclxuICAvLyBXaGVuIHNldCB0byAnc3RyZXRjaCcgY29udHJvbHMgd2hldGhlciBpdHMgV2lkdGhTaXphYmxlLiBJbiB0aGlzIGNhc2UgaXQgd2lsbCB1c2UgdGhlIHByZWZlcnJlZCB3aWR0aFxyXG4gIC8vIHRvIGRldGVybWluZSB0aGUgbGluZSB3cmFwLlxyXG4gIGxpbmVXcmFwPzogbnVtYmVyIHwgJ3N0cmV0Y2gnIHwgbnVsbDtcclxuXHJcbiAgLy8gU2V0cyBmb3J3YXJkaW5nIG9mIHRoZSBzdHJpbmdQcm9wZXJ0eSwgc2VlIHNldFN0cmluZ1Byb3BlcnR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gIHN0cmluZ1Byb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB8IG51bGw7XHJcblxyXG4gIHN0cmluZ1Byb3BlcnR5T3B0aW9ucz86IFByb3BlcnR5T3B0aW9uczxzdHJpbmc+O1xyXG5cclxuICAvLyBTZXRzIHRoZSBzdHJpbmcgdG8gYmUgZGlzcGxheWVkIGJ5IHRoaXMgTm9kZVxyXG4gIHN0cmluZz86IHN0cmluZyB8IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFJpY2hUZXh0T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgTm9kZU9wdGlvbnM7XHJcblxyXG5jb25zdCBERUZBVUxUX0ZPTlQgPSBuZXcgRm9udCgge1xyXG4gIHNpemU6IDIwXHJcbn0gKTtcclxuXHJcbi8vIFRhZ3MgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gYWNjZXNzaWJsZSBpbm5lckNvbnRlbnQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQzMFxyXG5jb25zdCBBQ0NFU1NJQkxFX1RBR1MgPSBbXHJcbiAgJ2InLCAnc3Ryb25nJywgJ2knLCAnZW0nLCAnc3ViJywgJ3N1cCcsICd1JywgJ3MnXHJcbl07XHJcblxyXG4vLyBXaGF0IHR5cGUgb2YgbGluZS1icmVhayBzaXR1YXRpb25zIHdlIGNhbiBiZSBpbiBkdXJpbmcgb3VyIHJlY3Vyc2l2ZSBwcm9jZXNzXHJcbmNvbnN0IExpbmVCcmVha1N0YXRlID0ge1xyXG4gIC8vIFRoZXJlIHdhcyBhIGxpbmUgYnJlYWssIGJ1dCBpdCB3YXMgYXQgdGhlIGVuZCBvZiB0aGUgZWxlbWVudCAob3Igd2FzIGEgPGJyPikuIFRoZSByZWxldmFudCBlbGVtZW50IGNhbiBiZSBmdWxseVxyXG4gIC8vIHJlbW92ZWQgZnJvbSB0aGUgdHJlZS5cclxuICBDT01QTEVURTogJ0NPTVBMRVRFJyxcclxuXHJcbiAgLy8gVGhlcmUgd2FzIGEgbGluZSBicmVhaywgYnV0IHRoZXJlIGlzIHNvbWUgY29udGVudCBsZWZ0IGluIHRoaXMgZWxlbWVudCBhZnRlciB0aGUgbGluZSBicmVhay4gRE8gTk9UIHJlbW92ZSBpdC5cclxuICBJTkNPTVBMRVRFOiAnSU5DT01QTEVURScsXHJcblxyXG4gIC8vIFRoZXJlIHdhcyBOTyBsaW5lIGJyZWFrXHJcbiAgTk9ORTogJ05PTkUnXHJcbn07XHJcblxyXG4vLyBXZSdsbCBzdG9yZSBhbiBhcnJheSBoZXJlIHRoYXQgd2lsbCByZWNvcmQgd2hpY2ggbGlua3Mvbm9kZXMgd2VyZSB1c2VkIGluIHRoZSBsYXN0IHJlYnVpbGQgKHNvIHdlIGNhbiBhc3NlcnQgb3V0IGlmXHJcbi8vIHRoZXJlIHdlcmUgc29tZSB0aGF0IHdlcmUgbm90IHVzZWQpLlxyXG5jb25zdCB1c2VkTGlua3M6IHN0cmluZ1tdID0gW107XHJcbmNvbnN0IHVzZWROb2Rlczogc3RyaW5nW10gPSBbXTtcclxuXHJcbi8vIGhpbWFsYXlhIGNvbnZlcnRzIGRhc2ggc2VwYXJhdGVkIENTUyB0byBjYW1lbCBjYXNlIC0gdXNlIENTUyBjb21wYXRpYmxlIHN0eWxlIHdpdGggZGFzaGVzLCBzZWUgYWJvdmUgZm9yIGV4YW1wbGVzXHJcbmNvbnN0IEZPTlRfU1RZTEVfTUFQID0ge1xyXG4gICdmb250LWZhbWlseSc6ICdmYW1pbHknLFxyXG4gICdmb250LXNpemUnOiAnc2l6ZScsXHJcbiAgJ2ZvbnQtc3RyZXRjaCc6ICdzdHJldGNoJyxcclxuICAnZm9udC1zdHlsZSc6ICdzdHlsZScsXHJcbiAgJ2ZvbnQtdmFyaWFudCc6ICd2YXJpYW50JyxcclxuICAnZm9udC13ZWlnaHQnOiAnd2VpZ2h0JyxcclxuICAnbGluZS1oZWlnaHQnOiAnbGluZUhlaWdodCdcclxufSBhcyBjb25zdDtcclxuXHJcbmNvbnN0IEZPTlRfU1RZTEVfS0VZUyA9IE9iamVjdC5rZXlzKCBGT05UX1NUWUxFX01BUCApIGFzICgga2V5b2YgdHlwZW9mIEZPTlRfU1RZTEVfTUFQIClbXTtcclxuY29uc3QgU1RZTEVfS0VZUyA9IFsgJ2NvbG9yJyBdLmNvbmNhdCggRk9OVF9TVFlMRV9LRVlTICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSaWNoVGV4dCBleHRlbmRzIFdpZHRoU2l6YWJsZSggTm9kZSApIHtcclxuXHJcbiAgLy8gVGhlIHN0cmluZyB0byBkaXNwbGF5LiBXZSdsbCBpbml0aWFsaXplIHRoaXMgYnkgbXV0YXRpbmcuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc3RyaW5nUHJvcGVydHk6IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8c3RyaW5nPjtcclxuXHJcbiAgcHJpdmF0ZSBfZm9udDogRm9udCB8IHN0cmluZyA9IERFRkFVTFRfRk9OVDtcclxuICBwcml2YXRlIF9ib3VuZHNNZXRob2Q6IFRleHRCb3VuZHNNZXRob2QgPSAnaHlicmlkJztcclxuICBwcml2YXRlIF9maWxsOiBUUGFpbnQgPSAnIzAwMDAwMCc7XHJcbiAgcHJpdmF0ZSBfc3Ryb2tlOiBUUGFpbnQgPSBudWxsO1xyXG4gIHByaXZhdGUgX2xpbmVXaWR0aCA9IDE7XHJcblxyXG4gIHByaXZhdGUgX3N1YlNjYWxlID0gMC43NTtcclxuICBwcml2YXRlIF9zdWJYU3BhY2luZyA9IDA7XHJcbiAgcHJpdmF0ZSBfc3ViWU9mZnNldCA9IDA7XHJcblxyXG4gIHByaXZhdGUgX3N1cFNjYWxlID0gMC43NTtcclxuICBwcml2YXRlIF9zdXBYU3BhY2luZyA9IDA7XHJcbiAgcHJpdmF0ZSBfc3VwWU9mZnNldCA9IDA7XHJcblxyXG4gIHByaXZhdGUgX2NhcEhlaWdodFNjYWxlID0gMC43NTtcclxuXHJcbiAgcHJpdmF0ZSBfdW5kZXJsaW5lTGluZVdpZHRoID0gMTtcclxuICBwcml2YXRlIF91bmRlcmxpbmVIZWlnaHRTY2FsZSA9IDAuMTU7XHJcblxyXG4gIHByaXZhdGUgX3N0cmlrZXRocm91Z2hMaW5lV2lkdGggPSAxO1xyXG4gIHByaXZhdGUgX3N0cmlrZXRocm91Z2hIZWlnaHRTY2FsZSA9IDAuMztcclxuXHJcbiAgcHJpdmF0ZSBfbGlua0ZpbGw6IFRQYWludCA9ICdyZ2IoMjcsMCwyNDEpJztcclxuXHJcbiAgcHJpdmF0ZSBfbGlua0V2ZW50c0hhbmRsZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gSWYgYW4gb2JqZWN0LCB2YWx1ZXMgYXJlIGVpdGhlciB7c3RyaW5nfSBvciB7ZnVuY3Rpb259XHJcbiAgcHJpdmF0ZSBfbGlua3M6IFJpY2hUZXh0TGlua3MgPSB7fTtcclxuXHJcbiAgcHJpdmF0ZSBfbm9kZXM6IFJlY29yZDxzdHJpbmcsIE5vZGU+ID0ge307XHJcblxyXG4gIHByaXZhdGUgX3JlcGxhY2VOZXdsaW5lcyA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX2FsaWduOiBSaWNoVGV4dEFsaWduID0gJ2xlZnQnO1xyXG4gIHByaXZhdGUgX2xlYWRpbmcgPSAwO1xyXG4gIHByaXZhdGUgX2xpbmVXcmFwOiBSZXF1aXJlZE9wdGlvbjxTZWxmT3B0aW9ucywgJ2xpbmVXcmFwJz4gPSBudWxsO1xyXG5cclxuICAvLyBXZSBuZWVkIHRvIGNvbnNvbGlkYXRlIGxpbmtzICh0aGF0IGNvdWxkIGJlIHNwbGl0IGFjcm9zcyBtdWx0aXBsZSBsaW5lcykgdW5kZXIgb25lIFwibGlua1wiIG5vZGUsIHNvIHdlIHRyYWNrIGNyZWF0ZWRcclxuICAvLyBsaW5rIGZyYWdtZW50cyBoZXJlIHNvIHRoZXkgY2FuIGdldCBwaWVjZWQgdG9nZXRoZXIgbGF0ZXIuXHJcbiAgcHJpdmF0ZSBfbGlua0l0ZW1zOiB7IGVsZW1lbnQ6IEhpbWFsYXlhTm9kZTsgbm9kZTogTm9kZTsgaHJlZjogUmljaFRleHRIcmVmIH1bXSA9IFtdO1xyXG5cclxuICAvLyBXaGV0aGVyIHNvbWV0aGluZyBoYXMgYmVlbiBhZGRlZCB0byB0aGlzIGxpbmUgeWV0LiBXZSBkb24ndCB3YW50IHRvIGluZmluaXRlLWxvb3Agb3V0IGlmIHNvbWV0aGluZyBpcyBsb25nZXIgdGhhblxyXG4gIC8vIG91ciBsaW5lV3JhcCwgc28gd2UnbGwgcGxhY2Ugb25lIGl0ZW0gb24gaXRzIG93biBvbiBhbiBvdGhlcndpc2UgZW1wdHkgbGluZS5cclxuICBwcml2YXRlIF9oYXNBZGRlZExlYWZUb0xpbmUgPSBmYWxzZTtcclxuXHJcbiAgLy8gTm9ybWFsIGxheW91dCBjb250YWluZXIgb2YgbGluZXMgKHNlcGFyYXRlLCBzbyB3ZSBjYW4gY2xlYXIgaXQgZWFzaWx5KVxyXG4gIHByaXZhdGUgbGluZUNvbnRhaW5lcjogTm9kZTtcclxuXHJcbiAgLy8gRm9yIGxpbmVXcmFwOnN0cmV0Y2gsIHdlJ2xsIG5lZWQgdG8gY29tcHV0ZSBhIG5ldyBtaW5pbXVtIHdpZHRoIGZvciB0aGUgUmljaFRleHQsIHNvIHRoZXNlIGNvbnRyb2xcclxuICAvLyAoYSkgd2hldGhlciB3ZSdyZSBjb21wdXRpbmcgdGhpcyAoaXQgZG9lcyBhIGxvdCBvZiB1bm5lY2Vzc2FyeSB3b3JrIG90aGVyd2lzZSBpZiB3ZSBkb24ndCBuZWVkIGl0KSwgYW5kIChiKVxyXG4gIC8vIHRoZSBhY3R1YWwgbWluaW11bVdpZHRoIHRoYXQgd2UnbGwgaGF2ZS5cclxuICBwcml2YXRlIG5lZWRQZW5kaW5nTWluaW11bVdpZHRoID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBwZW5kaW5nTWluaW11bVdpZHRoID0gMDtcclxuXHJcbiAgLy8gVGV4dCBhbmQgUmljaFRleHQgY3VycmVudGx5IHVzZSB0aGUgc2FtZSB0YW5kZW0gbmFtZSBmb3IgdGhlaXIgc3RyaW5nUHJvcGVydHkuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTVFJJTkdfUFJPUEVSVFlfVEFOREVNX05BTUUgPSBUZXh0LlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzdHJpbmc6IHN0cmluZyB8IG51bWJlciB8IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz4sIHByb3ZpZGVkT3B0aW9ucz86IFJpY2hUZXh0T3B0aW9ucyApIHtcclxuXHJcbiAgICAvLyBXZSBvbmx5IGZpbGwgaW4gc29tZSBkZWZhdWx0cywgc2luY2UgdGhlIG90aGVyIGRlZmF1bHRzIGFyZSBkZWZpbmVkIGJlbG93IChhbmQgbXV0YXRlIGlzIHJlbGllZCBvbilcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UmljaFRleHRPcHRpb25zLCBQaWNrPFNlbGZPcHRpb25zLCAnZmlsbCc+LCBOb2RlT3B0aW9ucz4oKSgge1xyXG4gICAgICBmaWxsOiAnIzAwMDAwMCcsXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdUZXh0JyxcclxuICAgICAgcGhldGlvVHlwZTogUmljaFRleHQuUmljaFRleHRJTyxcclxuICAgICAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgaWYgKCB0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc3RyaW5nID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgb3B0aW9ucy5zdHJpbmcgPSBzdHJpbmc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3B0aW9ucy5zdHJpbmdQcm9wZXJ0eSA9IHN0cmluZztcclxuICAgIH1cclxuXHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX3N0cmluZ1Byb3BlcnR5ID0gbmV3IFRpbnlGb3J3YXJkaW5nUHJvcGVydHkoICcnLCB0cnVlLCB0aGlzLm9uU3RyaW5nUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcblxyXG4gICAgdGhpcy5saW5lQ29udGFpbmVyID0gbmV3IE5vZGUoIHt9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLmxpbmVDb250YWluZXIgKTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplIHRvIGFuIGVtcHR5IHN0YXRlLCBzbyB3ZSBhcmUgaW1tZWRpYXRlbHkgdmFsaWQgKHNpbmNlIG5vdyB3ZSBuZWVkIHRvIGNyZWF0ZSBhbiBlbXB0eSBsZWFmIGV2ZW4gaWYgd2VcclxuICAgIC8vIGhhdmUgZW1wdHkgdGV4dCkuXHJcbiAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG5cclxuICAgIHRoaXMubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxhenlMaW5rKCAoKSA9PiB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpICk7XHJcblxyXG4gICAgdGhpcy5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciBzdHJpbmdQcm9wZXJ0eSBjaGFuZ2VzIHZhbHVlcy5cclxuICAgKi9cclxuICBwcml2YXRlIG9uU3RyaW5nUHJvcGVydHlDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGRvY3VtZW50YXRpb24gZm9yIE5vZGUuc2V0VmlzaWJsZVByb3BlcnR5LCBleGNlcHQgdGhpcyBpcyBmb3IgdGhlIHRleHQgc3RyaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTdHJpbmdQcm9wZXJ0eSggbmV3VGFyZ2V0OiBUUHJvcGVydHk8c3RyaW5nPiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3RyaW5nUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCwgdGhpcywgUmljaFRleHQuU1RSSU5HX1BST1BFUlRZX1RBTkRFTV9OQU1FICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN0cmluZ1Byb3BlcnR5KCBwcm9wZXJ0eTogVFByb3BlcnR5PHN0cmluZz4gfCBudWxsICkgeyB0aGlzLnNldFN0cmluZ1Byb3BlcnR5KCBwcm9wZXJ0eSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RyaW5nUHJvcGVydHkoKTogVFByb3BlcnR5PHN0cmluZz4geyByZXR1cm4gdGhpcy5nZXRTdHJpbmdQcm9wZXJ0eSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpa2UgTm9kZS5nZXRWaXNpYmxlUHJvcGVydHksIGJ1dCBmb3IgdGhlIHRleHQgc3RyaW5nLiBOb3RlIHRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBQcm9wZXJ0eSBwcm92aWRlZCBpblxyXG4gICAqIHNldFN0cmluZ1Byb3BlcnR5LiBUaHVzIGlzIHRoZSBuYXR1cmUgb2YgVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3RyaW5nUHJvcGVydHkoKTogVFByb3BlcnR5PHN0cmluZz4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3N0cmluZ1Byb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmljaFRleHQgc3VwcG9ydHMgYSBcInN0cmluZ1wiIHNlbGVjdGlvbiBtb2RlLCBpbiB3aGljaCBpdCB3aWxsIG1hcCB0byBpdHMgc3RyaW5nUHJvcGVydHkgKGlmIGFwcGxpY2FibGUpLCBvdGhlcndpc2UgaXNcclxuICAgKiB1c2VzIHRoZSBkZWZhdWx0IG1vdXNlLWhpdCB0YXJnZXQgZnJvbSB0aGUgc3VwZXJ0eXBlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCggZnJvbUxpbmtpbmcgPSBmYWxzZSApOiBQaGV0aW9PYmplY3QgfCAncGhldGlvTm90U2VsZWN0YWJsZScge1xyXG4gICAgcmV0dXJuIHBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eS52YWx1ZSA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgIHRoaXMuZ2V0U3RyaW5nUHJvcGVydHlQaGV0aW9Nb3VzZUhpdFRhcmdldCggZnJvbUxpbmtpbmcgKSA6XHJcbiAgICAgICAgICAgc3VwZXIuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFN0cmluZ1Byb3BlcnR5UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nID0gZmFsc2UgKTogUGhldGlvT2JqZWN0IHwgJ3BoZXRpb05vdFNlbGVjdGFibGUnIHtcclxuICAgIGNvbnN0IHRhcmdldFN0cmluZ1Byb3BlcnR5ID0gdGhpcy5fc3RyaW5nUHJvcGVydHkuZ2V0VGFyZ2V0UHJvcGVydHkoKTtcclxuXHJcbiAgICAvLyBFdmVuIGlmIHRoaXMgaXNuJ3QgUGhFVC1pTyBpbnN0cnVtZW50ZWQsIGl0IHN0aWxsIHF1YWxpZmllcyBhcyB0aGlzIFJpY2hUZXh0J3MgaGl0XHJcbiAgICByZXR1cm4gdGFyZ2V0U3RyaW5nUHJvcGVydHkgaW5zdGFuY2VvZiBQaGV0aW9PYmplY3QgP1xyXG4gICAgICAgICAgIHRhcmdldFN0cmluZ1Byb3BlcnR5LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCBmcm9tTGlua2luZyApIDpcclxuICAgICAgICAgICAncGhldGlvTm90U2VsZWN0YWJsZSc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZG9jdW1lbnRhdGlvbiBhbmQgY29tbWVudHMgaW4gTm9kZS5pbml0aWFsaXplUGhldGlvT2JqZWN0XHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGluaXRpYWxpemVQaGV0aW9PYmplY3QoIGJhc2VPcHRpb25zOiBQYXJ0aWFsPFBoZXRpb09iamVjdE9wdGlvbnM+LCBwcm92aWRlZE9wdGlvbnM6IFJpY2hUZXh0T3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFJpY2hUZXh0T3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgUmljaFRleHRPcHRpb25zPigpKCB7fSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gVHJhY2sgdGhpcywgc28gd2Ugb25seSBvdmVycmlkZSBvdXIgc3RyaW5nUHJvcGVydHkgb25jZS5cclxuICAgIGNvbnN0IHdhc0luc3RydW1lbnRlZCA9IHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKTtcclxuXHJcbiAgICBzdXBlci5pbml0aWFsaXplUGhldGlvT2JqZWN0KCBiYXNlT3B0aW9ucywgb3B0aW9ucyApO1xyXG5cclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiAhd2FzSW5zdHJ1bWVudGVkICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuXHJcbiAgICAgIHRoaXMuX3N0cmluZ1Byb3BlcnR5LmluaXRpYWxpemVQaGV0aW8oIHRoaXMsIFJpY2hUZXh0LlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRSwgKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgU3RyaW5nUHJvcGVydHkoIHRoaXMuc3RyaW5nLCBjb21iaW5lT3B0aW9uczxSaWNoVGV4dE9wdGlvbnM+KCB7XHJcblxyXG4gICAgICAgICAgLy8gYnkgZGVmYXVsdCwgdGV4dHMgc2hvdWxkIGJlIHJlYWRvbmx5LiBFZGl0YWJsZSB0ZXh0cyBtb3N0IGxpa2VseSBwYXNzIGluIGVkaXRhYmxlIFByb3BlcnRpZXMgZnJvbSBpMThuIG1vZGVsIFByb3BlcnRpZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTQ0M1xyXG4gICAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgICB0YW5kZW06IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggUmljaFRleHQuU1RSSU5HX1BST1BFUlRZX1RBTkRFTV9OQU1FICksXHJcbiAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnUHJvcGVydHkgZm9yIHRoZSBkaXNwbGF5ZWQgdGV4dCdcclxuICAgICAgICB9LCBvcHRpb25zLnN0cmluZ1Byb3BlcnR5T3B0aW9ucyApICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gY2FsbGVkLCB3aWxsIHJlYnVpbGQgdGhlIG5vZGUgc3RydWN0dXJlIGZvciB0aGlzIFJpY2hUZXh0XHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZWJ1aWxkUmljaFRleHQoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgY2xlYW5BcnJheSggdXNlZExpbmtzICk7XHJcbiAgICBhc3NlcnQgJiYgY2xlYW5BcnJheSggdXNlZE5vZGVzICk7XHJcblxyXG4gICAgY29uc3QgaGFzRHluYW1pY1dpZHRoID0gdGhpcy5fbGluZVdyYXAgPT09ICdzdHJldGNoJztcclxuXHJcbiAgICB0aGlzLndpZHRoU2l6YWJsZSA9IGhhc0R5bmFtaWNXaWR0aDtcclxuXHJcbiAgICB0aGlzLnBlbmRpbmdNaW5pbXVtV2lkdGggPSAwO1xyXG4gICAgdGhpcy5uZWVkUGVuZGluZ01pbmltdW1XaWR0aCA9IGhhc0R5bmFtaWNXaWR0aDtcclxuXHJcbiAgICAvLyBOT1RFOiBjYW4ndCB1c2UgaGFzRHluYW1pY1dpZHRoIGhlcmUsIHNpbmNlIFR5cGVTY3JpcHQgaXNuJ3QgaW5mZXJyaW5nIGl0IHlldFxyXG4gICAgY29uc3QgZWZmZWN0aXZlTGluZVdyYXAgPSB0aGlzLl9saW5lV3JhcCA9PT0gJ3N0cmV0Y2gnID8gdGhpcy5sb2NhbFByZWZlcnJlZFdpZHRoIDogdGhpcy5fbGluZVdyYXA7XHJcblxyXG4gICAgdGhpcy5mcmVlQ2hpbGRyZW5Ub1Bvb2woKTtcclxuXHJcbiAgICAvLyBCYWlsIGVhcmx5LCBwYXJ0aWN1bGFybHkgaWYgd2UgYXJlIGJlaW5nIGNvbnN0cnVjdGVkLlxyXG4gICAgaWYgKCB0aGlzLnN0cmluZyA9PT0gJycgKSB7XHJcbiAgICAgIHRoaXMuYXBwZW5kRW1wdHlMZWFmKCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCggYFJpY2hUZXh0IyR7dGhpcy5pZH0gcmVidWlsZGAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBUdXJuIGJpZGlyZWN0aW9uYWwgbWFya3MgaW50byBleHBsaWNpdCBlbGVtZW50cywgc28gdGhhdCB0aGUgbmVzdGluZyBpcyBhcHBsaWVkIGNvcnJlY3RseS5cclxuICAgIGxldCBtYXBwZWRUZXh0ID0gdGhpcy5zdHJpbmcucmVwbGFjZSggL1xcdTIwMmEvZywgJzxzcGFuIGRpcj1cImx0clwiPicgKVxyXG4gICAgICAucmVwbGFjZSggL1xcdTIwMmIvZywgJzxzcGFuIGRpcj1cInJ0bFwiPicgKVxyXG4gICAgICAucmVwbGFjZSggL1xcdTIwMmMvZywgJzwvc3Bhbj4nICk7XHJcblxyXG4gICAgLy8gT3B0aW9uYWwgcmVwbGFjZW1lbnQgb2YgbmV3bGluZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU0MlxyXG4gICAgaWYgKCB0aGlzLl9yZXBsYWNlTmV3bGluZXMgKSB7XHJcbiAgICAgIG1hcHBlZFRleHQgPSBtYXBwZWRUZXh0LnJlcGxhY2UoIC9cXG4vZywgJzxicj4nICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJvb3RFbGVtZW50czogSGltYWxheWFOb2RlW107XHJcblxyXG4gICAgLy8gU3RhcnQgYXBwZW5kaW5nIGFsbCB0b3AtbGV2ZWwgZWxlbWVudHNcclxuICAgIHRyeSB7XHJcbiAgICAgIHJvb3RFbGVtZW50cyA9IGhpbWFsYXlhVmFyLnBhcnNlKCBtYXBwZWRUZXh0ICk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgLy8gSWYgd2UgZXJyb3Igb3V0LCBkb24ndCBraWxsIHRoZSBzaW0uIEluc3RlYWQsIHJlcGxhY2UgdGhlIHN0cmluZyB3aXRoIHNvbWV0aGluZyB0aGF0IGxvb2tzIG9idmlvdXNseSBsaWtlIGFuXHJcbiAgICAgIC8vIGVycm9yLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzEzNjEgKHdlIGRvbid0IHdhbnQgdHJhbnNsYXRpb25zIHRvIGVycm9yIG91dCBvdXJcclxuICAgICAgLy8gYnVpbGQgcHJvY2VzcykuXHJcblxyXG4gICAgICByb290RWxlbWVudHMgPSBoaW1hbGF5YVZhci5wYXJzZSggJ0lOVkFMSUQgVFJBTlNMQVRJT04nICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2xlYXIgb3V0IGxpbmsgaXRlbXMsIGFzIHdlJ2xsIG5lZWQgdG8gcmVjb25zdHJ1Y3QgdGhlbSBsYXRlclxyXG4gICAgdGhpcy5fbGlua0l0ZW1zLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgY29uc3Qgd2lkdGhBdmFpbGFibGUgPSBlZmZlY3RpdmVMaW5lV3JhcCA9PT0gbnVsbCA/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA6IGVmZmVjdGl2ZUxpbmVXcmFwO1xyXG4gICAgY29uc3QgaXNSb290TFRSID0gdHJ1ZTtcclxuXHJcbiAgICBsZXQgY3VycmVudExpbmUgPSBSaWNoVGV4dEVsZW1lbnQucG9vbC5jcmVhdGUoIGlzUm9vdExUUiApO1xyXG4gICAgdGhpcy5faGFzQWRkZWRMZWFmVG9MaW5lID0gZmFsc2U7IC8vIG5vdGlmeSB0aGF0IGlmIG5vdGhpbmcgaGFzIGJlZW4gYWRkZWQsIHRoZSBmaXJzdCBsZWFmIGFsd2F5cyBnZXRzIGFkZGVkLlxyXG5cclxuICAgIC8vIEhpbWFsYXlhIGNhbiBnaXZlIHVzIG11bHRpcGxlIHRvcC1sZXZlbCBpdGVtcywgc28gd2UgbmVlZCB0byBpdGVyYXRlIG92ZXIgdGhvc2VcclxuICAgIHdoaWxlICggcm9vdEVsZW1lbnRzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZWxlbWVudCA9IHJvb3RFbGVtZW50c1sgMCBdO1xyXG5cclxuICAgICAgLy8gSG93IGxvbmcgb3VyIGN1cnJlbnQgbGluZSBpcyBhbHJlYWR5XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRMaW5lV2lkdGggPSBjdXJyZW50TGluZS5ib3VuZHMuaXNWYWxpZCgpID8gY3VycmVudExpbmUud2lkdGggOiAwO1xyXG5cclxuICAgICAgLy8gQWRkIHRoZSBlbGVtZW50IGluXHJcbiAgICAgIGNvbnN0IGxpbmVCcmVha1N0YXRlID0gdGhpcy5hcHBlbmRFbGVtZW50KCBjdXJyZW50TGluZSwgZWxlbWVudCwgdGhpcy5fZm9udCwgdGhpcy5fZmlsbCwgaXNSb290TFRSLCB3aWR0aEF2YWlsYWJsZSAtIGN1cnJlbnRMaW5lV2lkdGgsIDEgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cuUmljaFRleHQoIGBsaW5lQnJlYWtTdGF0ZTogJHtsaW5lQnJlYWtTdGF0ZX1gICk7XHJcblxyXG4gICAgICAvLyBJZiB0aGVyZSB3YXMgYSBsaW5lIGJyZWFrICh3ZSdsbCBuZWVkIHRvIHN3YXAgdG8gYSBuZXcgbGluZSBub2RlKVxyXG4gICAgICBpZiAoIGxpbmVCcmVha1N0YXRlICE9PSBMaW5lQnJlYWtTdGF0ZS5OT05FICkge1xyXG4gICAgICAgIC8vIEFkZCB0aGUgbGluZSBpZiBpdCB3b3Jrc1xyXG4gICAgICAgIGlmICggY3VycmVudExpbmUuYm91bmRzLmlzVmFsaWQoKSApIHtcclxuICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0KCAnQWRkaW5nIGxpbmUgZHVlIHRvIGxpbmVCcmVhaycgKTtcclxuICAgICAgICAgIHRoaXMuYXBwZW5kTGluZSggY3VycmVudExpbmUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlIGlmIGl0J3MgYSBibGFuayBsaW5lLCBhZGQgaW4gYSBzdHJ1dCAoPGJyPjxicj4gc2hvdWxkIHJlc3VsdCBpbiBhIGJsYW5rIGxpbmUpXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmFwcGVuZExpbmUoIFJpY2hUZXh0VmVydGljYWxTcGFjZXIucG9vbC5jcmVhdGUoIFJpY2hUZXh0VXRpbHMuc2NyYXRjaFRleHQuc2V0U3RyaW5nKCAnWCcgKS5zZXRGb250KCB0aGlzLl9mb250ICkuaGVpZ2h0ICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNldCB1cCBhIG5ldyBsaW5lXHJcbiAgICAgICAgY3VycmVudExpbmUgPSBSaWNoVGV4dEVsZW1lbnQucG9vbC5jcmVhdGUoIGlzUm9vdExUUiApO1xyXG4gICAgICAgIHRoaXMuX2hhc0FkZGVkTGVhZlRvTGluZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiBpdCdzIENPTVBMRVRFIG9yIE5PTkUsIHRoZW4gd2UgZnVsbHkgcHJvY2Vzc2VkIHRoZSBsaW5lXHJcbiAgICAgIGlmICggbGluZUJyZWFrU3RhdGUgIT09IExpbmVCcmVha1N0YXRlLklOQ09NUExFVEUgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cuUmljaFRleHQoICdGaW5pc2hlZCByb290IGVsZW1lbnQnICk7XHJcbiAgICAgICAgcm9vdEVsZW1lbnRzLnNwbGljZSggMCwgMSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT25seSBhZGQgdGhlIGZpbmFsIGxpbmUgaWYgaXQncyB2YWxpZCAod2UgZG9uJ3Qgd2FudCB0byBhZGQgdW5uZWNlc3NhcnkgcGFkZGluZyBhdCB0aGUgYm90dG9tKVxyXG4gICAgaWYgKCBjdXJyZW50TGluZS5ib3VuZHMuaXNWYWxpZCgpICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCggJ0FkZGluZyBmaW5hbCBsaW5lJyApO1xyXG4gICAgICB0aGlzLmFwcGVuZExpbmUoIGN1cnJlbnRMaW5lICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgcmVhY2hlZCBoZXJlIGFuZCBoYXZlIG5vIGNoaWxkcmVuLCB3ZSBwcm9iYWJseSByYW4gaW50byBhIGRlZ2VuZXJhdGUgXCJubyBsYXlvdXRcIiBjYXNlIGxpa2UgYCcgJ2AuIEFkZCBpblxyXG4gICAgLy8gdGhlIGVtcHR5IGxlYWYuXHJcbiAgICBpZiAoIHRoaXMubGluZUNvbnRhaW5lci5nZXRDaGlsZHJlbkNvdW50KCkgPT09IDAgKSB7XHJcbiAgICAgIHRoaXMuYXBwZW5kRW1wdHlMZWFmKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWxsIGxpbmVzIGFyZSBjb25zdHJ1Y3RlZCwgc28gd2UgY2FuIGFsaWduIHRoZW0gbm93XHJcbiAgICB0aGlzLmFsaWduTGluZXMoKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgcmVncm91cGluZyBvZiBsaW5rcyAoc28gdGhhdCBhbGwgZnJhZ21lbnRzIG9mIGEgbGluayBhY3Jvc3MgbXVsdGlwbGUgbGluZXMgYXJlIGNvbnRhaW5lZCB1bmRlciBhIHNpbmdsZVxyXG4gICAgLy8gYW5jZXN0b3IgdGhhdCBoYXMgbGlzdGVuZXJzIGFuZCBhMTF5KVxyXG4gICAgd2hpbGUgKCB0aGlzLl9saW5rSXRlbXMubGVuZ3RoICkge1xyXG4gICAgICAvLyBDbG9zZSBvdmVyIHRoZSBocmVmIGFuZCBvdGhlciByZWZlcmVuY2VzXHJcbiAgICAgICggKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxpbmtFbGVtZW50ID0gdGhpcy5fbGlua0l0ZW1zWyAwIF0uZWxlbWVudDtcclxuICAgICAgICBjb25zdCBocmVmID0gdGhpcy5fbGlua0l0ZW1zWyAwIF0uaHJlZjtcclxuICAgICAgICBsZXQgaTtcclxuXHJcbiAgICAgICAgLy8gRmluZCBhbGwgbm9kZXMgdGhhdCBhcmUgZm9yIHRoZSBzYW1lIGxpbmtcclxuICAgICAgICBjb25zdCBub2RlcyA9IFtdO1xyXG4gICAgICAgIGZvciAoIGkgPSB0aGlzLl9saW5rSXRlbXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fbGlua0l0ZW1zWyBpIF07XHJcbiAgICAgICAgICBpZiAoIGl0ZW0uZWxlbWVudCA9PT0gbGlua0VsZW1lbnQgKSB7XHJcbiAgICAgICAgICAgIG5vZGVzLnB1c2goIGl0ZW0ubm9kZSApO1xyXG4gICAgICAgICAgICB0aGlzLl9saW5rSXRlbXMuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBsaW5rUm9vdE5vZGUgPSBSaWNoVGV4dExpbmsucG9vbC5jcmVhdGUoIGxpbmtFbGVtZW50LmlubmVyQ29udGVudCwgaHJlZiApO1xyXG4gICAgICAgIHRoaXMubGluZUNvbnRhaW5lci5hZGRDaGlsZCggbGlua1Jvb3ROb2RlICk7XHJcblxyXG4gICAgICAgIC8vIERldGFjaCB0aGUgbm9kZSBmcm9tIGl0cyBsb2NhdGlvbiwgYWRqdXN0IGl0cyB0cmFuc2Zvcm0sIGFuZCByZWF0dGFjaCB1bmRlciB0aGUgbGluay4gVGhpcyBzaG91bGQga2VlcCBlYWNoXHJcbiAgICAgICAgLy8gZnJhZ21lbnQgaW4gdGhlIHNhbWUgcGxhY2UsIGJ1dCBjaGFuZ2VzIGl0cyBwYXJlbnQuXHJcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1sgaSBdO1xyXG4gICAgICAgICAgY29uc3QgbWF0cml4ID0gbm9kZS5nZXRVbmlxdWVUcmFpbFRvKCB0aGlzLmxpbmVDb250YWluZXIgKS5nZXRNYXRyaXgoKTtcclxuICAgICAgICAgIG5vZGUuZGV0YWNoKCk7XHJcbiAgICAgICAgICBub2RlLm1hdHJpeCA9IG1hdHJpeDtcclxuICAgICAgICAgIGxpbmtSb290Tm9kZS5hZGRDaGlsZCggbm9kZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2xlYXIgdGhlbSBvdXQgYWZ0ZXJ3YXJkcywgZm9yIG1lbW9yeSBwdXJwb3Nlc1xyXG4gICAgdGhpcy5fbGlua0l0ZW1zLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGlmICggdGhpcy5fbGlua3MgJiYgdGhpcy5fbGlua3MgIT09IHRydWUgKSB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIHRoaXMuX2xpbmtzICkuZm9yRWFjaCggbGluayA9PiB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYWxsb3dMaW5rc1Byb3BlcnR5LnZhbHVlICYmICFpc1N0cmluZ1Rlc3QgJiYgYXNzZXJ0KCB1c2VkTGlua3MuaW5jbHVkZXMoIGxpbmsgKSwgYFVudXNlZCBSaWNoVGV4dCBsaW5rOiAke2xpbmt9YCApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMuX25vZGVzICkge1xyXG4gICAgICAgIE9iamVjdC5rZXlzKCB0aGlzLl9ub2RlcyApLmZvckVhY2goIG5vZGUgPT4ge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFsbG93TGlua3NQcm9wZXJ0eS52YWx1ZSAmJiAhaXNTdHJpbmdUZXN0ICYmIGFzc2VydCggdXNlZE5vZGVzLmluY2x1ZGVzKCBub2RlICksIGBVbnVzZWQgUmljaFRleHQgbm9kZTogJHtub2RlfWAgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBOT1RFOiBJZiB0aGlzIGlzIGZhaWxpbmcgb3IgY2F1c2luZyBpbmZpbml0ZSBsb29wcyBpbiB0aGUgZnV0dXJlLCByZWZhY3RvciBSaWNoVGV4dCB0byB1c2UgYSBMYXlvdXRDb25zdHJhaW50LlxyXG4gICAgdGhpcy5sb2NhbE1pbmltdW1XaWR0aCA9IGhhc0R5bmFtaWNXaWR0aCA/IHRoaXMucGVuZGluZ01pbmltdW1XaWR0aCA6IHRoaXMubG9jYWxCb3VuZHMud2lkdGg7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbnMgXCJyZWN1cnNpdmVseSB0ZW1wb3JhcnkgZGlzcG9zZXNcIiB0aGUgY2hpbGRyZW4uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBmcmVlQ2hpbGRyZW5Ub1Bvb2woKTogdm9pZCB7XHJcbiAgICAvLyBDbGVhciBhbnkgZXhpc3RpbmcgbGluZXMgb3IgbGluayBmcmFnbWVudHMgKGhpZ2hlciBwZXJmb3JtYW5jZSwgYW5kIHJldHVybiB0aGVtIHRvIHBvb2xzIGFsc28pXHJcbiAgICB3aGlsZSAoIHRoaXMubGluZUNvbnRhaW5lci5fY2hpbGRyZW4ubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBjaGlsZCA9IHRoaXMubGluZUNvbnRhaW5lci5fY2hpbGRyZW5bIHRoaXMubGluZUNvbnRhaW5lci5fY2hpbGRyZW4ubGVuZ3RoIC0gMSBdIGFzIFJpY2hUZXh0Q2xlYW5hYmxlTm9kZTtcclxuICAgICAgdGhpcy5saW5lQ29udGFpbmVyLnJlbW92ZUNoaWxkKCBjaGlsZCApO1xyXG5cclxuICAgICAgY2hpbGQuY2xlYW4oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbGVhc2VzIHJlZmVyZW5jZXMuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmZyZWVDaGlsZHJlblRvUG9vbCgpO1xyXG5cclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLl9zdHJpbmdQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBlbmRzIGEgZmluaXNoZWQgbGluZSwgYXBwbHlpbmcgYW55IG5lY2Vzc2FyeSBsZWFkaW5nLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXBwZW5kTGluZSggbGluZU5vZGU6IFJpY2hUZXh0RWxlbWVudCB8IE5vZGUgKTogdm9pZCB7XHJcbiAgICAvLyBBcHBseSBsZWFkaW5nXHJcbiAgICBpZiAoIHRoaXMubGluZUNvbnRhaW5lci5ib3VuZHMuaXNWYWxpZCgpICkge1xyXG4gICAgICBsaW5lTm9kZS50b3AgPSB0aGlzLmxpbmVDb250YWluZXIuYm90dG9tICsgdGhpcy5fbGVhZGluZztcclxuXHJcbiAgICAgIC8vIFRoaXMgZW5zdXJlcyBSVEwgbGluZXMgd2lsbCBzdGlsbCBiZSBsYWlkIG91dCBwcm9wZXJseSB3aXRoIHRoZSBtYWluIG9yaWdpbiAoaGFuZGxlZCBieSBhbGlnbkxpbmVzIGxhdGVyKVxyXG4gICAgICBsaW5lTm9kZS5sZWZ0ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxpbmVDb250YWluZXIuYWRkQ2hpbGQoIGxpbmVOb2RlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB3ZSBlbmQgdXAgd2l0aCB0aGUgZXF1aXZhbGVudCBvZiBcIm5vXCIgY29udGVudCwgdG9zcyBpbiBhIGJhc2ljYWxseSBlbXB0eSBsZWFmIHNvIHRoYXQgd2UgZ2V0IHZhbGlkIGJvdW5kc1xyXG4gICAqICgwIHdpZHRoLCBjb3JyZWN0bHktcG9zaXRpb25lZCBoZWlnaHQpLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzc2OS5cclxuICAgKi9cclxuICBwcml2YXRlIGFwcGVuZEVtcHR5TGVhZigpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubGluZUNvbnRhaW5lci5nZXRDaGlsZHJlbkNvdW50KCkgPT09IDAgKTtcclxuXHJcbiAgICB0aGlzLmFwcGVuZExpbmUoIFJpY2hUZXh0TGVhZi5wb29sLmNyZWF0ZSggJycsIHRydWUsIHRoaXMuX2ZvbnQsIHRoaXMuX2JvdW5kc01ldGhvZCwgdGhpcy5fZmlsbCwgdGhpcy5fc3Ryb2tlLCB0aGlzLl9saW5lV2lkdGggKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxpZ25zIGFsbCBsaW5lcyBhdHRhY2hlZCB0byB0aGUgbGluZUNvbnRhaW5lci5cclxuICAgKi9cclxuICBwcml2YXRlIGFsaWduTGluZXMoKTogdm9pZCB7XHJcbiAgICAvLyBBbGwgbm9kZXMgd2lsbCBlaXRoZXIgc2hhcmUgYSAnbGVmdCcsICdjZW50ZXJYJyBvciAncmlnaHQnLlxyXG4gICAgY29uc3QgY29vcmRpbmF0ZU5hbWUgPSB0aGlzLl9hbGlnbiA9PT0gJ2NlbnRlcicgPyAnY2VudGVyWCcgOiB0aGlzLl9hbGlnbjtcclxuXHJcbiAgICBjb25zdCBpZGVhbCA9IHRoaXMubGluZUNvbnRhaW5lclsgY29vcmRpbmF0ZU5hbWUgXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubGluZUNvbnRhaW5lci5nZXRDaGlsZHJlbkNvdW50KCk7IGkrKyApIHtcclxuICAgICAgdGhpcy5saW5lQ29udGFpbmVyLmdldENoaWxkQXQoIGkgKVsgY29vcmRpbmF0ZU5hbWUgXSA9IGlkZWFsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFpbiByZWN1cnNpdmUgZnVuY3Rpb24gZm9yIGNvbnN0cnVjdGluZyB0aGUgUmljaFRleHQgTm9kZSB0cmVlLlxyXG4gICAqXHJcbiAgICogV2UnbGwgYWRkIGFueSByZWxldmFudCBjb250ZW50IHRvIHRoZSBjb250YWluZXJOb2RlLiBUaGUgZWxlbWVudCB3aWxsIGJlIG11dGF0ZWQgYXMgdGhpbmdzIGFyZSBhZGRlZCwgc28gdGhhdFxyXG4gICAqIHdoZW5ldmVyIGNvbnRlbnQgaXMgYWRkZWQgdG8gdGhlIE5vZGUgdHJlZSBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCB0cmVlLiBUaGlzIG1lYW5zIHdlIGNhbiBwYXVzZVxyXG4gICAqIHdoZW5ldmVyIChlLmcuIHdoZW4gYSBsaW5lLWJyZWFrIGlzIGVuY291bnRlcmVkKSBhbmQgdGhlIHJlc3Qgd2lsbCBiZSByZWFkeSBmb3IgcGFyc2luZyB0aGUgbmV4dCBsaW5lLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvbnRhaW5lck5vZGUgLSBUaGUgbm9kZSB3aGVyZSBjaGlsZCBlbGVtZW50cyBzaG91bGQgYmUgcGxhY2VkXHJcbiAgICogQHBhcmFtIGVsZW1lbnQgLSBTZWUgSGltYWxheWEncyBlbGVtZW50IHNwZWNpZmljYXRpb25cclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAoaHR0cHM6Ly9naXRodWIuY29tL2FuZHJlamV3c2tpL2hpbWFsYXlhL2Jsb2IvbWFzdGVyL3RleHQvYXN0LXNwZWMtdjAubWQpXHJcbiAgICogQHBhcmFtIGZvbnQgLSBUaGUgZm9udCB0byBhcHBseSBhdCB0aGlzIGxldmVsXHJcbiAgICogQHBhcmFtIGZpbGwgLSBGaWxsIHRvIGFwcGx5XHJcbiAgICogQHBhcmFtIGlzTFRSIC0gVHJ1ZSBpZiBMVFIsIGZhbHNlIGlmIFJUTCAoaGFuZGxlcyBSVEwgc3RyaW5ncyBwcm9wZXJseSlcclxuICAgKiBAcGFyYW0gd2lkdGhBdmFpbGFibGUgLSBIb3cgbXVjaCB3aWR0aCB3ZSBoYXZlIGF2YWlsYWJsZSBiZWZvcmUgZm9yY2luZyBhIGxpbmUgYnJlYWsgKGZvciBsaW5lV3JhcClcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgYSBsaW5lIGJyZWFrIHdhcyByZWFjaGVkXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhcHBlbmRFbGVtZW50KFxyXG4gICAgY29udGFpbmVyTm9kZTogUmljaFRleHRFbGVtZW50LFxyXG4gICAgZWxlbWVudDogSGltYWxheWFOb2RlLFxyXG4gICAgZm9udDogRm9udCB8IHN0cmluZyxcclxuICAgIGZpbGw6IFRQYWludCxcclxuICAgIGlzTFRSOiBib29sZWFuLFxyXG4gICAgd2lkdGhBdmFpbGFibGU6IG51bWJlcixcclxuICAgIGFwcGxpZWRTY2FsZTogbnVtYmVyXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGxldCBsaW5lQnJlYWtTdGF0ZSA9IExpbmVCcmVha1N0YXRlLk5PTkU7XHJcblxyXG4gICAgLy8gVGhlIG1haW4gTm9kZSBmb3IgdGhlIGVsZW1lbnQgdGhhdCB3ZSBhcmUgYWRkaW5nXHJcbiAgICBsZXQgbm9kZSE6IFJpY2hUZXh0TGVhZiB8IFJpY2hUZXh0Tm9kZSB8IFJpY2hUZXh0RWxlbWVudDtcclxuXHJcbiAgICAvLyBJZiB0aGlzIGNvbnRlbnQgZ2V0cyBhZGRlZCwgaXQgd2lsbCBuZWVkIHRvIGJlIHB1c2hlZCBvdmVyIGJ5IHRoaXMgYW1vdW50XHJcbiAgICBjb25zdCBjb250YWluZXJTcGFjaW5nID0gaXNMVFIgPyBjb250YWluZXJOb2RlLnJpZ2h0U3BhY2luZyA6IGNvbnRhaW5lck5vZGUubGVmdFNwYWNpbmc7XHJcblxyXG4gICAgLy8gQ29udGFpbmVyIHNwYWNpbmcgY3V0cyBpbnRvIG91ciBlZmZlY3RpdmUgYXZhaWxhYmxlIHdpZHRoXHJcbiAgICBjb25zdCB3aWR0aEF2YWlsYWJsZVdpdGhTcGFjaW5nID0gd2lkdGhBdmFpbGFibGUgLSBjb250YWluZXJTcGFjaW5nO1xyXG5cclxuICAgIC8vIElmIHdlJ3JlIGEgbGVhZlxyXG4gICAgaWYgKCBpc0hpbWFsYXlhVGV4dE5vZGUoIGVsZW1lbnQgKSApIHtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cuUmljaFRleHQoIGBhcHBlbmRpbmcgbGVhZjogJHtlbGVtZW50LmNvbnRlbnR9YCApO1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICBub2RlID0gUmljaFRleHRMZWFmLnBvb2wuY3JlYXRlKCBlbGVtZW50LmNvbnRlbnQsIGlzTFRSLCBmb250LCB0aGlzLl9ib3VuZHNNZXRob2QsIGZpbGwsIHRoaXMuX3N0cm9rZSwgdGhpcy5fbGluZVdpZHRoICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMubmVlZFBlbmRpbmdNaW5pbXVtV2lkdGggKSB7XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nTWluaW11bVdpZHRoID0gTWF0aC5tYXgoIHRoaXMucGVuZGluZ01pbmltdW1XaWR0aCwgTWF0aC5tYXgoIC4uLmdldExpbmVCcmVha1JhbmdlcyggZWxlbWVudC5jb250ZW50ICkubWFwKCByYW5nZSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBzdHJpbmcgPSBlbGVtZW50LmNvbnRlbnQuc2xpY2UoIHJhbmdlLm1pbiwgcmFuZ2UubWF4ICk7XHJcbiAgICAgICAgICBjb25zdCB0ZW1wb3JhcnlOb2RlID0gUmljaFRleHRMZWFmLnBvb2wuY3JlYXRlKCBzdHJpbmcsIGlzTFRSLCBmb250LCB0aGlzLl9ib3VuZHNNZXRob2QsIGZpbGwsIHRoaXMuX3N0cm9rZSwgdGhpcy5fbGluZVdpZHRoICk7XHJcbiAgICAgICAgICBjb25zdCBsb2NhbE1pbmludW1XaWR0aCA9IHRlbXBvcmFyeU5vZGUud2lkdGggKiBhcHBsaWVkU2NhbGU7XHJcbiAgICAgICAgICB0ZW1wb3JhcnlOb2RlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgIHJldHVybiBsb2NhbE1pbmludW1XaWR0aDtcclxuICAgICAgICB9ICkgKSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGUgd3JhcHBpbmcgaWYgcmVxdWlyZWQuIENvbnRhaW5lciBzcGFjaW5nIGN1dHMgaW50byBvdXIgYXZhaWxhYmxlIHdpZHRoXHJcbiAgICAgIGlmICggIW5vZGUuZml0c0luKCB3aWR0aEF2YWlsYWJsZVdpdGhTcGFjaW5nLCB0aGlzLl9oYXNBZGRlZExlYWZUb0xpbmUsIGlzTFRSICkgKSB7XHJcbiAgICAgICAgLy8gRGlkbid0IGZpdCwgbGV0cyBicmVhayBpbnRvIHdvcmRzIHRvIHNlZSB3aGF0IHdlIGNhbiBmaXQuIFdlJ2xsIGNyZWF0ZSByYW5nZXMgZm9yIGFsbCB0aGUgaW5kaXZpZHVhbFxyXG4gICAgICAgIC8vIGVsZW1lbnRzIHdlIGNvdWxkIHNwbGl0IHRoZSBsaW5lcyBpbnRvLiBJZiB3ZSBzcGxpdCBpbnRvIGRpZmZlcmVudCBsaW5lcywgd2UgY2FuIGlnbm9yZSB0aGUgY2hhcmFjdGVyc1xyXG4gICAgICAgIC8vIGluLWJldHdlZW4sIGhvd2V2ZXIgaWYgbm90LCB3ZSBuZWVkIHRvIGluY2x1ZGUgdGhlbS5cclxuICAgICAgICBjb25zdCByYW5nZXMgPSBnZXRMaW5lQnJlYWtSYW5nZXMoIGVsZW1lbnQuY29udGVudCApO1xyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IGEgZ3JvdXAgb2YgcmFuZ2VzIGludG8gYSBzdHJpbmcgKGdyYWIgdGhlIGNvbnRlbnQgZnJvbSB0aGUgc3RyaW5nKS5cclxuICAgICAgICBjb25zdCByYW5nZXNUb1N0cmluZyA9ICggcmFuZ2VzOiBSYW5nZVtdICk6IHN0cmluZyA9PiB7XHJcbiAgICAgICAgICBpZiAoIHJhbmdlcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudC5jb250ZW50LnNsaWNlKCByYW5nZXNbIDAgXS5taW4sIHJhbmdlc1sgcmFuZ2VzLmxlbmd0aCAtIDEgXS5tYXggKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCggYE92ZXJmbG93IGxlYWZBZGRlZDoke3RoaXMuX2hhc0FkZGVkTGVhZlRvTGluZX0sIHdvcmRzOiAke3Jhbmdlcy5sZW5ndGh9YCApO1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBuZWVkIHRvIGFkZCBzb21ldGhpbmcgKGFuZCB0aGVyZSBpcyBvbmx5IGEgc2luZ2xlIHdvcmQpLCB0aGVuIGFkZCBpdFxyXG4gICAgICAgIGlmICggdGhpcy5faGFzQWRkZWRMZWFmVG9MaW5lIHx8IHJhbmdlcy5sZW5ndGggPiAxICkge1xyXG4gICAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cuUmljaFRleHQoICdTa2lwcGluZyB3b3JkcycgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBza2lwcGVkUmFuZ2VzOiBSYW5nZVtdID0gW107XHJcbiAgICAgICAgICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgc2tpcHBlZFJhbmdlcy51bnNoaWZ0KCByYW5nZXMucG9wKCkhICk7IC8vIFdlIGRpZG4ndCBmaXQgd2l0aCB0aGUgbGFzdCBvbmUhXHJcblxyXG4gICAgICAgICAgLy8gS2VlcCBzaG9ydGVuaW5nIGJ5IHJlbW92aW5nIHdvcmRzIHVudGlsIGl0IGZpdHMgKG9yIGlmIHdlIE5FRUQgdG8gZml0IGl0KSBvciBpdCBkb2Vzbid0IGZpdC5cclxuICAgICAgICAgIHdoaWxlICggcmFuZ2VzLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgbm9kZS5jbGVhbigpOyAvLyBXZSdyZSB0b3NzaW5nIHRoZSBvbGQgb25lLCBzbyB3ZSdsbCBmcmVlIHVwIG1lbW9yeSBmb3IgdGhlIG5ldyBvbmVcclxuICAgICAgICAgICAgbm9kZSA9IFJpY2hUZXh0TGVhZi5wb29sLmNyZWF0ZSggcmFuZ2VzVG9TdHJpbmcoIHJhbmdlcyApLCBpc0xUUiwgZm9udCwgdGhpcy5fYm91bmRzTWV0aG9kLCBmaWxsLCB0aGlzLl9zdHJva2UsIHRoaXMuX2xpbmVXaWR0aCApO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZW4ndCBhZGRlZCBhbnl0aGluZyB0byB0aGUgbGluZSBBTkQgd2UgYXJlIGRvd24gdG8gdGhlIGZpcnN0IHdvcmQsIHdlIG5lZWQgdG8ganVzdCBhZGQgaXQuXHJcbiAgICAgICAgICAgIGlmICggIW5vZGUuZml0c0luKCB3aWR0aEF2YWlsYWJsZVdpdGhTcGFjaW5nLCB0aGlzLl9oYXNBZGRlZExlYWZUb0xpbmUsIGlzTFRSICkgJiZcclxuICAgICAgICAgICAgICAgICAoIHRoaXMuX2hhc0FkZGVkTGVhZlRvTGluZSB8fCByYW5nZXMubGVuZ3RoID4gMSApICkge1xyXG4gICAgICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0KCBgU2tpcHBpbmcgd29yZCAke3Jhbmdlc1RvU3RyaW5nKCBbIHJhbmdlc1sgcmFuZ2VzLmxlbmd0aCAtIDEgXSBdICl9YCApO1xyXG4gICAgICAgICAgICAgIHNraXBwZWRSYW5nZXMudW5zaGlmdCggcmFuZ2VzLnBvcCgpISApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0KCBgU3VjY2VzcyB3aXRoICR7cmFuZ2VzVG9TdHJpbmcoIHJhbmdlcyApfWAgKTtcclxuICAgICAgICAgICAgICBzdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIElmIHdlIGhhdmVuJ3QgYWRkZWQgYW55dGhpbmcgeWV0IHRvIHRoaXMgbGluZSwgd2UnbGwgcGVybWl0IHRoZSBvdmVyZmxvd1xyXG4gICAgICAgICAgaWYgKCBzdWNjZXNzICkge1xyXG4gICAgICAgICAgICBsaW5lQnJlYWtTdGF0ZSA9IExpbmVCcmVha1N0YXRlLklOQ09NUExFVEU7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY29udGVudCA9IHJhbmdlc1RvU3RyaW5nKCBza2lwcGVkUmFuZ2VzICk7XHJcbiAgICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0KCBgUmVtYWluaW5nIGNvbnRlbnQ6ICR7ZWxlbWVudC5jb250ZW50fWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBXZSB3b24ndCB1c2UgdGhpcyBvbmUsIHNvIHdlJ2xsIGZyZWUgaXQgYmFjayB0byB0aGUgcG9vbFxyXG4gICAgICAgICAgICBub2RlLmNsZWFuKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gTGluZUJyZWFrU3RhdGUuSU5DT01QTEVURTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2hhc0FkZGVkTGVhZlRvTGluZSA9IHRydWU7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH1cclxuICAgIC8vIE90aGVyd2lzZSBwcmVzdW1hYmx5IGFuIGVsZW1lbnQgd2l0aCBjb250ZW50XHJcbiAgICBlbHNlIGlmICggaXNIaW1hbGF5YUVsZW1lbnROb2RlKCBlbGVtZW50ICkgKSB7XHJcbiAgICAgIC8vIEJhaWwgb3V0IHF1aWNrbHkgZm9yIGEgbGluZSBicmVha1xyXG4gICAgICBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ2JyJyApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUmljaFRleHQgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCggJ21hbnVhbCBsaW5lIGJyZWFrJyApO1xyXG4gICAgICAgIHJldHVybiBMaW5lQnJlYWtTdGF0ZS5DT01QTEVURTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU3BhbiAoZGlyIGF0dHJpYnV0ZSkgLS0gd2UgbmVlZCB0aGUgTFRSL1JUTCBrbm93bGVkZ2UgYmVmb3JlIG1vc3Qgb3RoZXIgb3BlcmF0aW9uc1xyXG4gICAgICBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ3NwYW4nICkge1xyXG4gICAgICAgIGNvbnN0IGRpckF0dHJpYnV0ZVN0cmluZyA9IFJpY2hUZXh0VXRpbHMuaGltYWxheWFHZXRBdHRyaWJ1dGUoICdkaXInLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgIGlmICggZGlyQXR0cmlidXRlU3RyaW5nICkge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZGlyQXR0cmlidXRlU3RyaW5nID09PSAnbHRyJyB8fCBkaXJBdHRyaWJ1dGVTdHJpbmcgPT09ICdydGwnLFxyXG4gICAgICAgICAgICAnU3BhbiBkaXIgYXR0cmlidXRlcyBzaG91bGQgYmUgbHRyIG9yIHJ0bC4nICk7XHJcbiAgICAgICAgICBpc0xUUiA9IGRpckF0dHJpYnV0ZVN0cmluZyA9PT0gJ2x0cic7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGUgPG5vZGU+IHRhZ3MsIHdoaWNoIHNob3VsZCBub3QgaGF2ZSBjb250ZW50XHJcbiAgICAgIGlmICggZWxlbWVudC50YWdOYW1lID09PSAnbm9kZScgKSB7XHJcbiAgICAgICAgY29uc3QgcmVmZXJlbmNlZElkID0gUmljaFRleHRVdGlscy5oaW1hbGF5YUdldEF0dHJpYnV0ZSggJ2lkJywgZWxlbWVudCApO1xyXG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZWROb2RlID0gcmVmZXJlbmNlZElkID8gKCB0aGlzLl9ub2Rlc1sgcmVmZXJlbmNlZElkIF0gfHwgbnVsbCApIDogbnVsbDtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcmVmZXJlbmNlZE5vZGUsXHJcbiAgICAgICAgICByZWZlcmVuY2VkSWRcclxuICAgICAgICAgID8gYENvdWxkIG5vdCBmaW5kIGEgbWF0Y2hpbmcgaXRlbSBpbiBSaWNoVGV4dCdzIG5vZGVzIGZvciAke3JlZmVyZW5jZWRJZH0uIEl0IHNob3VsZCBiZSBwcm92aWRlZCBpbiB0aGUgbm9kZXMgb3B0aW9uYFxyXG4gICAgICAgICAgOiAnTm8gaWQgYXR0cmlidXRlIHByb3ZpZGVkIGZvciBhIGdpdmVuIDxub2RlPiBlbGVtZW50JyApO1xyXG4gICAgICAgIGlmICggcmVmZXJlbmNlZE5vZGUgKSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgdXNlZE5vZGVzLnB1c2goIHJlZmVyZW5jZWRJZCEgKTtcclxuICAgICAgICAgIG5vZGUgPSBSaWNoVGV4dE5vZGUucG9vbC5jcmVhdGUoIHJlZmVyZW5jZWROb2RlICk7XHJcblxyXG4gICAgICAgICAgaWYgKCB0aGlzLl9oYXNBZGRlZExlYWZUb0xpbmUgJiYgIW5vZGUuZml0c0luKCB3aWR0aEF2YWlsYWJsZVdpdGhTcGFjaW5nICkgKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGZpdCwgd2UnbGwgdG9zcyB0aGlzIG5vZGUgdG8gdGhlIHBvb2wgYW5kIGNyZWF0ZSBpdCBvbiB0aGUgbmV4dCBsaW5lXHJcbiAgICAgICAgICAgIG5vZGUuY2xlYW4oKTtcclxuICAgICAgICAgICAgcmV0dXJuIExpbmVCcmVha1N0YXRlLklOQ09NUExFVEU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3Qgbm9kZUFsaWduID0gUmljaFRleHRVdGlscy5oaW1hbGF5YUdldEF0dHJpYnV0ZSggJ2FsaWduJywgZWxlbWVudCApO1xyXG4gICAgICAgICAgaWYgKCBub2RlQWxpZ24gPT09ICdjZW50ZXInIHx8IG5vZGVBbGlnbiA9PT0gJ3RvcCcgfHwgbm9kZUFsaWduID09PSAnYm90dG9tJyApIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dEJvdW5kcyA9IFJpY2hUZXh0VXRpbHMuc2NyYXRjaFRleHQuc2V0U3RyaW5nKCAnVGVzdCcgKS5zZXRGb250KCBmb250ICkuYm91bmRzO1xyXG4gICAgICAgICAgICBpZiAoIG5vZGVBbGlnbiA9PT0gJ2NlbnRlcicgKSB7XHJcbiAgICAgICAgICAgICAgbm9kZS5jZW50ZXJZID0gdGV4dEJvdW5kcy5jZW50ZXJZO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBub2RlQWxpZ24gPT09ICd0b3AnICkge1xyXG4gICAgICAgICAgICAgIG5vZGUudG9wID0gdGV4dEJvdW5kcy50b3A7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIG5vZGVBbGlnbiA9PT0gJ2JvdHRvbScgKSB7XHJcbiAgICAgICAgICAgICAgbm9kZS5ib3R0b20gPSB0ZXh0Qm91bmRzLmJvdHRvbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIG5vZGUgaW4gb3VyIG1hcCwgd2UnbGwganVzdCBza2lwIGl0XHJcbiAgICAgICAgICByZXR1cm4gbGluZUJyZWFrU3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9oYXNBZGRlZExlYWZUb0xpbmUgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIElmIG5vdCBhIDxub2RlPiB0YWdcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbm9kZSA9IFJpY2hUZXh0RWxlbWVudC5wb29sLmNyZWF0ZSggaXNMVFIgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cuUmljaFRleHQoICdhcHBlbmRpbmcgZWxlbWVudCcgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlJpY2hUZXh0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgY29uc3Qgc3R5bGVBdHRyaWJ1dGVTdHJpbmcgPSBSaWNoVGV4dFV0aWxzLmhpbWFsYXlhR2V0QXR0cmlidXRlKCAnc3R5bGUnLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICBpZiAoIHN0eWxlQXR0cmlidXRlU3RyaW5nICkge1xyXG4gICAgICAgIGNvbnN0IGNzcyA9IFJpY2hUZXh0VXRpbHMuaGltYWxheWFTdHlsZVN0cmluZ1RvTWFwKCBzdHlsZUF0dHJpYnV0ZVN0cmluZyApO1xyXG4gICAgICAgIGFzc2VydCAmJiBPYmplY3Qua2V5cyggY3NzICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgICAgIGFzc2VydCEoIF8uaW5jbHVkZXMoIFNUWUxFX0tFWVMsIGtleSApLCAnU2VlIHN1cHBvcnRlZCBzdHlsZSBDU1Mga2V5cycgKTtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIC8vIEZpbGxcclxuICAgICAgICBpZiAoIGNzcy5jb2xvciApIHtcclxuICAgICAgICAgIGZpbGwgPSBuZXcgQ29sb3IoIGNzcy5jb2xvciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9udFxyXG4gICAgICAgIGNvbnN0IGZvbnRPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgRk9OVF9TVFlMRV9LRVlTLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3Qgc3R5bGVLZXkgPSBGT05UX1NUWUxFX0tFWVNbIGkgXTtcclxuICAgICAgICAgIGlmICggY3NzWyBzdHlsZUtleSBdICkge1xyXG4gICAgICAgICAgICBmb250T3B0aW9uc1sgRk9OVF9TVFlMRV9NQVBbIHN0eWxlS2V5IF0gXSA9IGNzc1sgc3R5bGVLZXkgXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9udCA9ICggdHlwZW9mIGZvbnQgPT09ICdzdHJpbmcnID8gRm9udC5mcm9tQ1NTKCBmb250ICkgOiBmb250ICkuY29weSggZm9udE9wdGlvbnMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQW5jaG9yIChsaW5rKVxyXG4gICAgICBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ2EnICkge1xyXG4gICAgICAgIGxldCBocmVmOiBSaWNoVGV4dEhyZWYgfCBudWxsID0gUmljaFRleHRVdGlscy5oaW1hbGF5YUdldEF0dHJpYnV0ZSggJ2hyZWYnLCBlbGVtZW50ICk7XHJcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxIcmVmID0gaHJlZjtcclxuXHJcbiAgICAgICAgLy8gVHJ5IGV4dHJhY3RpbmcgdGhlIGhyZWYgZnJvbSB0aGUgbGlua3Mgb2JqZWN0XHJcbiAgICAgICAgaWYgKCBocmVmICE9PSBudWxsICYmIHRoaXMuX2xpbmtzICE9PSB0cnVlICkge1xyXG4gICAgICAgICAgaWYgKCBocmVmLnN0YXJ0c1dpdGgoICd7eycgKSAmJiBocmVmLmluZGV4T2YoICd9fScgKSA9PT0gaHJlZi5sZW5ndGggLSAyICkge1xyXG4gICAgICAgICAgICBjb25zdCBsaW5rTmFtZSA9IGhyZWYuc2xpY2UoIDIsIC0yICk7XHJcbiAgICAgICAgICAgIGhyZWYgPSB0aGlzLl9saW5rc1sgbGlua05hbWUgXTtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIHVzZWRMaW5rcy5wdXNoKCBsaW5rTmFtZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGhyZWYgPSBudWxsO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWdub3JlIHRoaW5ncyBpZiB0aGVyZSBpcyBubyBtYXRjaGluZyBocmVmXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaHJlZixcclxuICAgICAgICAgIGBDb3VsZCBub3QgZmluZCBhIG1hdGNoaW5nIGl0ZW0gaW4gUmljaFRleHQncyBsaW5rcyBmb3IgJHtvcmlnaW5hbEhyZWZ9LiBJdCBzaG91bGQgYmUgcHJvdmlkZWQgaW4gdGhlIGxpbmtzIG9wdGlvbiwgb3IgbGlua3Mgc2hvdWxkIGJlIHR1cm5lZCB0byB0cnVlICh0byBhbGxvdyB0aGUgc3RyaW5nIHRvIGNyZWF0ZSBpdHMgb3duIHVybHNgICk7XHJcbiAgICAgICAgaWYgKCBocmVmICkge1xyXG4gICAgICAgICAgaWYgKCB0aGlzLl9saW5rRmlsbCAhPT0gbnVsbCApIHtcclxuICAgICAgICAgICAgZmlsbCA9IHRoaXMuX2xpbmtGaWxsOyAvLyBMaW5rIGNvbG9yXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBEb24ndCBvdmVyd3JpdGUgb25seSBpbm5lckNvbnRlbnRzIG9uY2UgdGhpbmdzIGhhdmUgYmVlbiBcInRvcm4gZG93blwiXHJcbiAgICAgICAgICBpZiAoICFlbGVtZW50LmlubmVyQ29udGVudCApIHtcclxuICAgICAgICAgICAgZWxlbWVudC5pbm5lckNvbnRlbnQgPSBSaWNoVGV4dC5oaW1hbGF5YUVsZW1lbnRUb0FjY2Vzc2libGVTdHJpbmcoIGVsZW1lbnQsIGlzTFRSICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gU3RvcmUgaW5mb3JtYXRpb24gYWJvdXQgaXQgZm9yIHRoZSBcInJlZ3JvdXAgbGlua3NcIiBzdGVwXHJcbiAgICAgICAgICB0aGlzLl9saW5rSXRlbXMucHVzaCgge1xyXG4gICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxyXG4gICAgICAgICAgICBub2RlOiBub2RlLFxyXG4gICAgICAgICAgICBocmVmOiBocmVmXHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIEJvbGRcclxuICAgICAgZWxzZSBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ2InIHx8IGVsZW1lbnQudGFnTmFtZSA9PT0gJ3N0cm9uZycgKSB7XHJcbiAgICAgICAgZm9udCA9ICggdHlwZW9mIGZvbnQgPT09ICdzdHJpbmcnID8gRm9udC5mcm9tQ1NTKCBmb250ICkgOiBmb250ICkuY29weSgge1xyXG4gICAgICAgICAgd2VpZ2h0OiAnYm9sZCdcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gSXRhbGljXHJcbiAgICAgIGVsc2UgaWYgKCBlbGVtZW50LnRhZ05hbWUgPT09ICdpJyB8fCBlbGVtZW50LnRhZ05hbWUgPT09ICdlbScgKSB7XHJcbiAgICAgICAgZm9udCA9ICggdHlwZW9mIGZvbnQgPT09ICdzdHJpbmcnID8gRm9udC5mcm9tQ1NTKCBmb250ICkgOiBmb250ICkuY29weSgge1xyXG4gICAgICAgICAgc3R5bGU6ICdpdGFsaWMnXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFN1YnNjcmlwdFxyXG4gICAgICBlbHNlIGlmICggZWxlbWVudC50YWdOYW1lID09PSAnc3ViJyApIHtcclxuICAgICAgICBub2RlLnNjYWxlKCB0aGlzLl9zdWJTY2FsZSApO1xyXG4gICAgICAgICggbm9kZSBhcyBSaWNoVGV4dEVsZW1lbnQgKS5hZGRFeHRyYUJlZm9yZVNwYWNpbmcoIHRoaXMuX3N1YlhTcGFjaW5nICk7XHJcbiAgICAgICAgbm9kZS55ICs9IHRoaXMuX3N1YllPZmZzZXQ7XHJcbiAgICAgIH1cclxuICAgICAgLy8gU3VwZXJzY3JpcHRcclxuICAgICAgZWxzZSBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ3N1cCcgKSB7XHJcbiAgICAgICAgbm9kZS5zY2FsZSggdGhpcy5fc3VwU2NhbGUgKTtcclxuICAgICAgICAoIG5vZGUgYXMgUmljaFRleHRFbGVtZW50ICkuYWRkRXh0cmFCZWZvcmVTcGFjaW5nKCB0aGlzLl9zdXBYU3BhY2luZyApO1xyXG4gICAgICAgIG5vZGUueSArPSB0aGlzLl9zdXBZT2Zmc2V0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSd2ZSBhZGRlZCBleHRyYSBzcGFjaW5nLCB3ZSdsbCBuZWVkIHRvIHN1YnRyYWN0IGl0IG9mZiBvZiBvdXIgYXZhaWxhYmxlIHdpZHRoXHJcbiAgICAgIGNvbnN0IHNjYWxlID0gbm9kZS5nZXRTY2FsZVZlY3RvcigpLng7XHJcblxyXG4gICAgICAvLyBQcm9jZXNzIGNoaWxkcmVuXHJcbiAgICAgIGlmICggZWxlbWVudC50YWdOYW1lICE9PSAnbm9kZScgKSB7XHJcbiAgICAgICAgd2hpbGUgKCBsaW5lQnJlYWtTdGF0ZSA9PT0gTGluZUJyZWFrU3RhdGUuTk9ORSAmJiBlbGVtZW50LmNoaWxkcmVuLmxlbmd0aCApIHtcclxuICAgICAgICAgIGNvbnN0IHdpZHRoQmVmb3JlID0gbm9kZS5ib3VuZHMuaXNWYWxpZCgpID8gbm9kZS53aWR0aCA6IDA7XHJcblxyXG4gICAgICAgICAgY29uc3QgY2hpbGRFbGVtZW50ID0gZWxlbWVudC5jaGlsZHJlblsgMCBdO1xyXG4gICAgICAgICAgbGluZUJyZWFrU3RhdGUgPSB0aGlzLmFwcGVuZEVsZW1lbnQoIG5vZGUgYXMgUmljaFRleHRFbGVtZW50LCBjaGlsZEVsZW1lbnQsIGZvbnQsIGZpbGwsIGlzTFRSLCB3aWR0aEF2YWlsYWJsZSAvIHNjYWxlLCBhcHBsaWVkU2NhbGUgKiBzY2FsZSApO1xyXG5cclxuICAgICAgICAgIC8vIGZvciBDT01QTEVURSBvciBOT05FLCB3ZSdsbCB3YW50IHRvIHJlbW92ZSB0aGUgY2hpbGRFbGVtZW50IGZyb20gdGhlIHRyZWUgKHdlIGZ1bGx5IHByb2Nlc3NlZCBpdClcclxuICAgICAgICAgIGlmICggbGluZUJyZWFrU3RhdGUgIT09IExpbmVCcmVha1N0YXRlLklOQ09NUExFVEUgKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2hpbGRyZW4uc3BsaWNlKCAwLCAxICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3Qgd2lkdGhBZnRlciA9IG5vZGUuYm91bmRzLmlzVmFsaWQoKSA/IG5vZGUud2lkdGggOiAwO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgYW1vdW50IG9mIHdpZHRoIHRha2VuIHVwIGJ5IHRoZSBjaGlsZFxyXG4gICAgICAgICAgd2lkdGhBdmFpbGFibGUgKz0gd2lkdGhCZWZvcmUgLSB3aWR0aEFmdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGxpbmUgYnJlYWsgYW5kIHRoZXJlIGFyZSBzdGlsbCBtb3JlIHRoaW5ncyB0byBwcm9jZXNzLCB3ZSBhcmUgaW5jb21wbGV0ZVxyXG4gICAgICAgIGlmICggbGluZUJyZWFrU3RhdGUgPT09IExpbmVCcmVha1N0YXRlLkNPTVBMRVRFICYmIGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoICkge1xyXG4gICAgICAgICAgbGluZUJyZWFrU3RhdGUgPSBMaW5lQnJlYWtTdGF0ZS5JTkNPTVBMRVRFO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU3Vic2NyaXB0IHBvc2l0aW9uaW5nXHJcbiAgICAgIGlmICggZWxlbWVudC50YWdOYW1lID09PSAnc3ViJyApIHtcclxuICAgICAgICBpZiAoIGlzRmluaXRlKCBub2RlLmhlaWdodCApICkge1xyXG4gICAgICAgICAgbm9kZS5jZW50ZXJZID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gU3VwZXJzY3JpcHQgcG9zaXRpb25pbmdcclxuICAgICAgZWxzZSBpZiAoIGVsZW1lbnQudGFnTmFtZSA9PT0gJ3N1cCcgKSB7XHJcbiAgICAgICAgaWYgKCBpc0Zpbml0ZSggbm9kZS5oZWlnaHQgKSApIHtcclxuICAgICAgICAgIG5vZGUuY2VudGVyWSA9IFJpY2hUZXh0VXRpbHMuc2NyYXRjaFRleHQuc2V0U3RyaW5nKCAnWCcgKS5zZXRGb250KCBmb250ICkudG9wICogdGhpcy5fY2FwSGVpZ2h0U2NhbGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIFVuZGVybGluZVxyXG4gICAgICBlbHNlIGlmICggZWxlbWVudC50YWdOYW1lID09PSAndScgKSB7XHJcbiAgICAgICAgY29uc3QgdW5kZXJsaW5lWSA9IC1ub2RlLnRvcCAqIHRoaXMuX3VuZGVybGluZUhlaWdodFNjYWxlO1xyXG4gICAgICAgIGlmICggaXNGaW5pdGUoIG5vZGUudG9wICkgKSB7XHJcbiAgICAgICAgICBub2RlLmFkZENoaWxkKCBuZXcgTGluZSggbm9kZS5sb2NhbExlZnQsIHVuZGVybGluZVksIG5vZGUubG9jYWxSaWdodCwgdW5kZXJsaW5lWSwge1xyXG4gICAgICAgICAgICBzdHJva2U6IGZpbGwsXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogdGhpcy5fdW5kZXJsaW5lTGluZVdpZHRoXHJcbiAgICAgICAgICB9ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gU3RyaWtldGhyb3VnaFxyXG4gICAgICBlbHNlIGlmICggZWxlbWVudC50YWdOYW1lID09PSAncycgKSB7XHJcbiAgICAgICAgY29uc3Qgc3RyaWtldGhyb3VnaFkgPSBub2RlLnRvcCAqIHRoaXMuX3N0cmlrZXRocm91Z2hIZWlnaHRTY2FsZTtcclxuICAgICAgICBpZiAoIGlzRmluaXRlKCBub2RlLnRvcCApICkge1xyXG4gICAgICAgICAgbm9kZS5hZGRDaGlsZCggbmV3IExpbmUoIG5vZGUubG9jYWxMZWZ0LCBzdHJpa2V0aHJvdWdoWSwgbm9kZS5sb2NhbFJpZ2h0LCBzdHJpa2V0aHJvdWdoWSwge1xyXG4gICAgICAgICAgICBzdHJva2U6IGZpbGwsXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogdGhpcy5fc3RyaWtldGhyb3VnaExpbmVXaWR0aFxyXG4gICAgICAgICAgfSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5SaWNoVGV4dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbm9kZSApIHtcclxuICAgICAgY29uc3Qgd2FzQWRkZWQgPSBjb250YWluZXJOb2RlLmFkZEVsZW1lbnQoIG5vZGUgKTtcclxuICAgICAgaWYgKCAhd2FzQWRkZWQgKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIGxpbmtJdGVtcyBpZiB3ZSBkaWRuJ3QgYWN0dWFsbHkgYWRkIGl0LlxyXG4gICAgICAgIHRoaXMuX2xpbmtJdGVtcyA9IHRoaXMuX2xpbmtJdGVtcy5maWx0ZXIoIGl0ZW0gPT4gaXRlbS5ub2RlICE9PSBub2RlICk7XHJcblxyXG4gICAgICAgIC8vIEFuZCBzaW5jZSB3ZSB3b24ndCBkaXNwb3NlIGl0IChzaW5jZSBpdCdzIG5vdCBhIGNoaWxkKSwgY2xlYW4gaXQgaGVyZVxyXG4gICAgICAgIG5vZGUuY2xlYW4oKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaW5lQnJlYWtTdGF0ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHN0cmluZyBkaXNwbGF5ZWQgYnkgb3VyIG5vZGUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBFbmNvZGluZyBIVE1MIGVudGl0aWVzIGlzIHJlcXVpcmVkLCBhbmQgbWFsZm9ybWVkIEhUTUwgaXMgbm90IGFjY2VwdGVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0cmluZyAtIFRoZSBzdHJpbmcgdG8gZGlzcGxheS4gSWYgaXQncyBhIG51bWJlciwgaXQgd2lsbCBiZSBjYXN0IHRvIGEgc3RyaW5nXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0cmluZyggc3RyaW5nOiBzdHJpbmcgfCBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzdHJpbmcgIT09IG51bGwgJiYgc3RyaW5nICE9PSB1bmRlZmluZWQsICdTdHJpbmcgc2hvdWxkIGJlIGRlZmluZWQgYW5kIG5vbi1udWxsLiBVc2UgdGhlIGVtcHR5IHN0cmluZyBpZiBuZWVkZWQuJyApO1xyXG5cclxuICAgIC8vIGNhc3QgaXQgdG8gYSBzdHJpbmcgKGZvciBudW1iZXJzLCBldGMuLCBhbmQgZG8gaXQgYmVmb3JlIHRoZSBjaGFuZ2UgZ3VhcmQgc28gd2UgZG9uJ3QgYWNjaWRlbnRhbGx5IHRyaWdnZXIgb24gbm9uLWNoYW5nZWQgc3RyaW5nKVxyXG4gICAgc3RyaW5nID0gYCR7c3RyaW5nfWA7XHJcblxyXG4gICAgdGhpcy5fc3RyaW5nUHJvcGVydHkuc2V0KCBzdHJpbmcgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3RyaW5nKCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyICkgeyB0aGlzLnNldFN0cmluZyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRTdHJpbmcoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdHJpbmcgZGlzcGxheWVkIGJ5IG91ciB0ZXh0IE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuX3N0cmluZ1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWV0aG9kIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgYm91bmRzIGZyb20gdGhlIHRleHQuIFNlZSBUZXh0LnNldEJvdW5kc01ldGhvZCBmb3IgZGV0YWlsc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRCb3VuZHNNZXRob2QoIG1ldGhvZDogVGV4dEJvdW5kc01ldGhvZCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1ldGhvZCA9PT0gJ2Zhc3QnIHx8IG1ldGhvZCA9PT0gJ2Zhc3RDYW52YXMnIHx8IG1ldGhvZCA9PT0gJ2FjY3VyYXRlJyB8fCBtZXRob2QgPT09ICdoeWJyaWQnLCAnVW5rbm93biBUZXh0IGJvdW5kc01ldGhvZCcgKTtcclxuICAgIGlmICggbWV0aG9kICE9PSB0aGlzLl9ib3VuZHNNZXRob2QgKSB7XHJcbiAgICAgIHRoaXMuX2JvdW5kc01ldGhvZCA9IG1ldGhvZDtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBib3VuZHNNZXRob2QoIHZhbHVlOiBUZXh0Qm91bmRzTWV0aG9kICkgeyB0aGlzLnNldEJvdW5kc01ldGhvZCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJvdW5kc01ldGhvZCgpOiBUZXh0Qm91bmRzTWV0aG9kIHsgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzTWV0aG9kKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBtZXRob2QgdG8gZXN0aW1hdGUgdGhlIGJvdW5kcyBvZiB0aGUgdGV4dC4gU2VlIHNldEJvdW5kc01ldGhvZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHNNZXRob2QoKTogVGV4dEJvdW5kc01ldGhvZCB7XHJcbiAgICByZXR1cm4gdGhpcy5fYm91bmRzTWV0aG9kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZm9udCBvZiBvdXIgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rm9udCggZm9udDogRm9udCB8IHN0cmluZyApOiB0aGlzIHtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2ZvbnQgIT09IGZvbnQgKSB7XHJcbiAgICAgIHRoaXMuX2ZvbnQgPSBmb250O1xyXG4gICAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGZvbnQoIHZhbHVlOiBGb250IHwgc3RyaW5nICkgeyB0aGlzLnNldEZvbnQoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBmb250KCk6IEZvbnQgfCBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRGb250KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBGb250XHJcbiAgICovXHJcbiAgcHVibGljIGdldEZvbnQoKTogRm9udCB8IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fZm9udDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGZpbGwgb2Ygb3VyIHRleHQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZpbGwoIGZpbGw6IFRQYWludCApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5fZmlsbCAhPT0gZmlsbCApIHtcclxuICAgICAgdGhpcy5fZmlsbCA9IGZpbGw7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZmlsbCggdmFsdWU6IFRQYWludCApIHsgdGhpcy5zZXRGaWxsKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZmlsbCgpOiBUUGFpbnQgeyByZXR1cm4gdGhpcy5nZXRGaWxsKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBmaWxsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRGaWxsKCk6IFRQYWludCB7XHJcbiAgICByZXR1cm4gdGhpcy5fZmlsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHN0cm9rZSBvZiBvdXIgdGV4dC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3Ryb2tlKCBzdHJva2U6IFRQYWludCApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5fc3Ryb2tlICE9PSBzdHJva2UgKSB7XHJcbiAgICAgIHRoaXMuX3N0cm9rZSA9IHN0cm9rZTtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdHJva2UoIHZhbHVlOiBUUGFpbnQgKSB7IHRoaXMuc2V0U3Ryb2tlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3Ryb2tlKCk6IFRQYWludCB7IHJldHVybiB0aGlzLmdldFN0cm9rZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3Ryb2tlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdHJva2UoKTogVFBhaW50IHtcclxuICAgIHJldHVybiB0aGlzLl9zdHJva2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsaW5lV2lkdGggb2Ygb3VyIHRleHQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldExpbmVXaWR0aCggbGluZVdpZHRoOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBpZiAoIHRoaXMuX2xpbmVXaWR0aCAhPT0gbGluZVdpZHRoICkge1xyXG4gICAgICB0aGlzLl9saW5lV2lkdGggPSBsaW5lV2lkdGg7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGluZVdpZHRoKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldExpbmVXaWR0aCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxpbmVXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRMaW5lV2lkdGgoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGxpbmVXaWR0aC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGluZVdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGluZVdpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc2NhbGUgKHJlbGF0aXZlIHRvIDEpIG9mIGFueSBzdHJpbmcgdW5kZXIgc3Vic2NyaXB0ICg8c3ViPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN1YlNjYWxlKCBzdWJTY2FsZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN1YlNjYWxlICkgJiYgc3ViU2NhbGUgPiAwICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9zdWJTY2FsZSAhPT0gc3ViU2NhbGUgKSB7XHJcbiAgICAgIHRoaXMuX3N1YlNjYWxlID0gc3ViU2NhbGU7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3ViU2NhbGUoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0U3ViU2NhbGUoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBzdWJTY2FsZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRTdWJTY2FsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNjYWxlIChyZWxhdGl2ZSB0byAxKSBvZiBhbnkgc3RyaW5nIHVuZGVyIHN1YnNjcmlwdCAoPHN1Yj4pIGVsZW1lbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdWJTY2FsZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3N1YlNjYWxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaG9yaXpvbnRhbCBzcGFjaW5nIGJlZm9yZSBhbnkgc3Vic2NyaXB0ICg8c3ViPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN1YlhTcGFjaW5nKCBzdWJYU3BhY2luZzogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN1YlhTcGFjaW5nICkgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3N1YlhTcGFjaW5nICE9PSBzdWJYU3BhY2luZyApIHtcclxuICAgICAgdGhpcy5fc3ViWFNwYWNpbmcgPSBzdWJYU3BhY2luZztcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdWJYU3BhY2luZyggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdWJYU3BhY2luZyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN1YlhTcGFjaW5nKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFN1YlhTcGFjaW5nKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaG9yaXpvbnRhbCBzcGFjaW5nIGJlZm9yZSBhbnkgc3Vic2NyaXB0ICg8c3ViPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN1YlhTcGFjaW5nKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3ViWFNwYWNpbmc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBhZGp1c3RtZW50IG9mZnNldCB0byB0aGUgdmVydGljYWwgcGxhY2VtZW50IG9mIGFueSBzdWJzY3JpcHQgKDxzdWI+KSBlbGVtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3ViWU9mZnNldCggc3ViWU9mZnNldDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN1YllPZmZzZXQgKSApO1xyXG5cclxuICAgIGlmICggdGhpcy5fc3ViWU9mZnNldCAhPT0gc3ViWU9mZnNldCApIHtcclxuICAgICAgdGhpcy5fc3ViWU9mZnNldCA9IHN1YllPZmZzZXQ7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3ViWU9mZnNldCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdWJZT2Zmc2V0KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3ViWU9mZnNldCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRTdWJZT2Zmc2V0KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYWRqdXN0bWVudCBvZmZzZXQgdG8gdGhlIHZlcnRpY2FsIHBsYWNlbWVudCBvZiBhbnkgc3Vic2NyaXB0ICg8c3ViPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN1YllPZmZzZXQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdWJZT2Zmc2V0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc2NhbGUgKHJlbGF0aXZlIHRvIDEpIG9mIGFueSBzdHJpbmcgdW5kZXIgc3VwZXJzY3JpcHQgKDxzdXA+KSBlbGVtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3VwU2NhbGUoIHN1cFNjYWxlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggc3VwU2NhbGUgKSAmJiBzdXBTY2FsZSA+IDAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3N1cFNjYWxlICE9PSBzdXBTY2FsZSApIHtcclxuICAgICAgdGhpcy5fc3VwU2NhbGUgPSBzdXBTY2FsZTtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdXBTY2FsZSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdXBTY2FsZSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN1cFNjYWxlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFN1cFNjYWxlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2NhbGUgKHJlbGF0aXZlIHRvIDEpIG9mIGFueSBzdHJpbmcgdW5kZXIgc3VwZXJzY3JpcHQgKDxzdXA+KSBlbGVtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3VwU2NhbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdXBTY2FsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGhvcml6b250YWwgc3BhY2luZyBiZWZvcmUgYW55IHN1cGVyc2NyaXB0ICg8c3VwPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN1cFhTcGFjaW5nKCBzdXBYU3BhY2luZzogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN1cFhTcGFjaW5nICkgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3N1cFhTcGFjaW5nICE9PSBzdXBYU3BhY2luZyApIHtcclxuICAgICAgdGhpcy5fc3VwWFNwYWNpbmcgPSBzdXBYU3BhY2luZztcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdXBYU3BhY2luZyggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdXBYU3BhY2luZyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN1cFhTcGFjaW5nKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFN1cFhTcGFjaW5nKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaG9yaXpvbnRhbCBzcGFjaW5nIGJlZm9yZSBhbnkgc3VwZXJzY3JpcHQgKDxzdXA+KSBlbGVtZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3VwWFNwYWNpbmcoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdXBYU3BhY2luZztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGFkanVzdG1lbnQgb2Zmc2V0IHRvIHRoZSB2ZXJ0aWNhbCBwbGFjZW1lbnQgb2YgYW55IHN1cGVyc2NyaXB0ICg8c3VwPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN1cFlPZmZzZXQoIHN1cFlPZmZzZXQ6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBzdXBZT2Zmc2V0ICkgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3N1cFlPZmZzZXQgIT09IHN1cFlPZmZzZXQgKSB7XHJcbiAgICAgIHRoaXMuX3N1cFlPZmZzZXQgPSBzdXBZT2Zmc2V0O1xyXG4gICAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN1cFlPZmZzZXQoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0U3VwWU9mZnNldCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN1cFlPZmZzZXQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0U3VwWU9mZnNldCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFkanVzdG1lbnQgb2Zmc2V0IHRvIHRoZSB2ZXJ0aWNhbCBwbGFjZW1lbnQgb2YgYW55IHN1cGVyc2NyaXB0ICg8c3VwPikgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN1cFlPZmZzZXQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdXBZT2Zmc2V0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZXhwZWN0ZWQgY2FwIGhlaWdodCAoYmFzZWxpbmUgdG8gdG9wIG9mIGNhcGl0YWwgbGV0dGVycykgYXMgYSBzY2FsZSBvZiB0aGUgZGV0ZWN0ZWQgZGlzdGFuY2UgZnJvbSB0aGVcclxuICAgKiBiYXNlbGluZSB0byB0aGUgdG9wIG9mIHRoZSB0ZXh0IGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q2FwSGVpZ2h0U2NhbGUoIGNhcEhlaWdodFNjYWxlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggY2FwSGVpZ2h0U2NhbGUgKSAmJiBjYXBIZWlnaHRTY2FsZSA+IDAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2NhcEhlaWdodFNjYWxlICE9PSBjYXBIZWlnaHRTY2FsZSApIHtcclxuICAgICAgdGhpcy5fY2FwSGVpZ2h0U2NhbGUgPSBjYXBIZWlnaHRTY2FsZTtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBjYXBIZWlnaHRTY2FsZSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRDYXBIZWlnaHRTY2FsZSggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNhcEhlaWdodFNjYWxlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldENhcEhlaWdodFNjYWxlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZXhwZWN0ZWQgY2FwIGhlaWdodCAoYmFzZWxpbmUgdG8gdG9wIG9mIGNhcGl0YWwgbGV0dGVycykgYXMgYSBzY2FsZSBvZiB0aGUgZGV0ZWN0ZWQgZGlzdGFuY2UgZnJvbSB0aGVcclxuICAgKiBiYXNlbGluZSB0byB0aGUgdG9wIG9mIHRoZSB0ZXh0IGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2FwSGVpZ2h0U2NhbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jYXBIZWlnaHRTY2FsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGxpbmVXaWR0aCBvZiB1bmRlcmxpbmUgbGluZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFVuZGVybGluZUxpbmVXaWR0aCggdW5kZXJsaW5lTGluZVdpZHRoOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggdW5kZXJsaW5lTGluZVdpZHRoICkgJiYgdW5kZXJsaW5lTGluZVdpZHRoID4gMCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fdW5kZXJsaW5lTGluZVdpZHRoICE9PSB1bmRlcmxpbmVMaW5lV2lkdGggKSB7XHJcbiAgICAgIHRoaXMuX3VuZGVybGluZUxpbmVXaWR0aCA9IHVuZGVybGluZUxpbmVXaWR0aDtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB1bmRlcmxpbmVMaW5lV2lkdGgoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0VW5kZXJsaW5lTGluZVdpZHRoKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdW5kZXJsaW5lTGluZVdpZHRoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFVuZGVybGluZUxpbmVXaWR0aCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxpbmVXaWR0aCBvZiB1bmRlcmxpbmUgbGluZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuZGVybGluZUxpbmVXaWR0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3VuZGVybGluZUxpbmVXaWR0aDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHVuZGVybGluZSBoZWlnaHQgYWRqdXN0bWVudCBhcyBhIHByb3BvcnRpb24gb2YgdGhlIGRldGVjdGVkIGRpc3RhbmNlIGZyb20gdGhlIGJhc2VsaW5lIHRvIHRoZSB0b3Agb2YgdGhlXHJcbiAgICogdGV4dCBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFVuZGVybGluZUhlaWdodFNjYWxlKCB1bmRlcmxpbmVIZWlnaHRTY2FsZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHVuZGVybGluZUhlaWdodFNjYWxlICkgJiYgdW5kZXJsaW5lSGVpZ2h0U2NhbGUgPiAwICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl91bmRlcmxpbmVIZWlnaHRTY2FsZSAhPT0gdW5kZXJsaW5lSGVpZ2h0U2NhbGUgKSB7XHJcbiAgICAgIHRoaXMuX3VuZGVybGluZUhlaWdodFNjYWxlID0gdW5kZXJsaW5lSGVpZ2h0U2NhbGU7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgdW5kZXJsaW5lSGVpZ2h0U2NhbGUoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0VW5kZXJsaW5lSGVpZ2h0U2NhbGUoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB1bmRlcmxpbmVIZWlnaHRTY2FsZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRVbmRlcmxpbmVIZWlnaHRTY2FsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVuZGVybGluZSBoZWlnaHQgYWRqdXN0bWVudCBhcyBhIHByb3BvcnRpb24gb2YgdGhlIGRldGVjdGVkIGRpc3RhbmNlIGZyb20gdGhlIGJhc2VsaW5lIHRvIHRoZSB0b3Agb2YgdGhlXHJcbiAgICogdGV4dCBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuZGVybGluZUhlaWdodFNjYWxlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdW5kZXJsaW5lSGVpZ2h0U2NhbGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsaW5lV2lkdGggb2Ygc3RyaWtldGhyb3VnaCBsaW5lcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3RyaWtldGhyb3VnaExpbmVXaWR0aCggc3RyaWtldGhyb3VnaExpbmVXaWR0aDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHN0cmlrZXRocm91Z2hMaW5lV2lkdGggKSAmJiBzdHJpa2V0aHJvdWdoTGluZVdpZHRoID4gMCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fc3RyaWtldGhyb3VnaExpbmVXaWR0aCAhPT0gc3RyaWtldGhyb3VnaExpbmVXaWR0aCApIHtcclxuICAgICAgdGhpcy5fc3RyaWtldGhyb3VnaExpbmVXaWR0aCA9IHN0cmlrZXRocm91Z2hMaW5lV2lkdGg7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3RyaWtldGhyb3VnaExpbmVXaWR0aCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRTdHJpa2V0aHJvdWdoTGluZVdpZHRoKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RyaWtldGhyb3VnaExpbmVXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRTdHJpa2V0aHJvdWdoTGluZVdpZHRoKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbGluZVdpZHRoIG9mIHN0cmlrZXRocm91Z2ggbGluZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0cmlrZXRocm91Z2hMaW5lV2lkdGgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdHJpa2V0aHJvdWdoTGluZVdpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc3RyaWtldGhyb3VnaCBoZWlnaHQgYWRqdXN0bWVudCBhcyBhIHByb3BvcnRpb24gb2YgdGhlIGRldGVjdGVkIGRpc3RhbmNlIGZyb20gdGhlIGJhc2VsaW5lIHRvIHRoZSB0b3Agb2YgdGhlXHJcbiAgICogdGV4dCBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0cmlrZXRocm91Z2hIZWlnaHRTY2FsZSggc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlICkgJiYgc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlID4gMCApO1xyXG5cclxuICAgIGlmICggdGhpcy5fc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlICE9PSBzdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUgKSB7XHJcbiAgICAgIHRoaXMuX3N0cmlrZXRocm91Z2hIZWlnaHRTY2FsZSA9IHN0cmlrZXRocm91Z2hIZWlnaHRTY2FsZTtcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0U3RyaWtldGhyb3VnaEhlaWdodFNjYWxlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RyaWtldGhyb3VnaEhlaWdodFNjYWxlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFN0cmlrZXRocm91Z2hIZWlnaHRTY2FsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHN0cmlrZXRocm91Z2ggaGVpZ2h0IGFkanVzdG1lbnQgYXMgYSBwcm9wb3J0aW9uIG9mIHRoZSBkZXRlY3RlZCBkaXN0YW5jZSBmcm9tIHRoZSBiYXNlbGluZSB0byB0aGUgdG9wIG9mIHRoZVxyXG4gICAqIHRleHQgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9zdHJpa2V0aHJvdWdoSGVpZ2h0U2NhbGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjb2xvciBvZiBsaW5rcy4gSWYgbnVsbCwgbm8gZmlsbCB3aWxsIGJlIG92ZXJyaWRkZW4uXHJcbiAgICovXHJcbiAgcHVibGljIHNldExpbmtGaWxsKCBsaW5rRmlsbDogVFBhaW50ICk6IHRoaXMge1xyXG4gICAgaWYgKCB0aGlzLl9saW5rRmlsbCAhPT0gbGlua0ZpbGwgKSB7XHJcbiAgICAgIHRoaXMuX2xpbmtGaWxsID0gbGlua0ZpbGw7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGlua0ZpbGwoIHZhbHVlOiBUUGFpbnQgKSB7IHRoaXMuc2V0TGlua0ZpbGwoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBsaW5rRmlsbCgpOiBUUGFpbnQgeyByZXR1cm4gdGhpcy5nZXRMaW5rRmlsbCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNvbG9yIG9mIGxpbmtzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMaW5rRmlsbCgpOiBUUGFpbnQge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xpbmtGaWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIGxpbmsgY2xpY2tzIHdpbGwgY2FsbCBldmVudC5oYW5kbGUoKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGlua0V2ZW50c0hhbmRsZWQoIGxpbmtFdmVudHNIYW5kbGVkOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgaWYgKCB0aGlzLl9saW5rRXZlbnRzSGFuZGxlZCAhPT0gbGlua0V2ZW50c0hhbmRsZWQgKSB7XHJcbiAgICAgIHRoaXMuX2xpbmtFdmVudHNIYW5kbGVkID0gbGlua0V2ZW50c0hhbmRsZWQ7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGlua0V2ZW50c0hhbmRsZWQoIHZhbHVlOiBib29sZWFuICkgeyB0aGlzLnNldExpbmtFdmVudHNIYW5kbGVkKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbGlua0V2ZW50c0hhbmRsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldExpbmtFdmVudHNIYW5kbGVkKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGxpbmsgZXZlbnRzIHdpbGwgYmUgaGFuZGxlZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGlua0V2ZW50c0hhbmRsZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGlua0V2ZW50c0hhbmRsZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0TGlua3MoIGxpbmtzOiBSaWNoVGV4dExpbmtzICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGlua3MgPT09IHRydWUgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBsaW5rcyApID09PSBPYmplY3QucHJvdG90eXBlICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9saW5rcyAhPT0gbGlua3MgKSB7XHJcbiAgICAgIHRoaXMuX2xpbmtzID0gbGlua3M7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciBsaW5rIGV2ZW50cyB3aWxsIGJlIGhhbmRsZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExpbmtzKCk6IFJpY2hUZXh0TGlua3Mge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xpbmtzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBsaW5rcyggdmFsdWU6IFJpY2hUZXh0TGlua3MgKSB7IHRoaXMuc2V0TGlua3MoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBsaW5rcygpOiBSaWNoVGV4dExpbmtzIHsgcmV0dXJuIHRoaXMuZ2V0TGlua3MoKTsgfVxyXG5cclxuICBwdWJsaWMgc2V0Tm9kZXMoIG5vZGVzOiBSZWNvcmQ8c3RyaW5nLCBOb2RlPiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIE9iamVjdC5nZXRQcm90b3R5cGVPZiggbm9kZXMgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbm9kZXMgIT09IG5vZGVzICkge1xyXG4gICAgICB0aGlzLl9ub2RlcyA9IG5vZGVzO1xyXG4gICAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldE5vZGVzKCk6IFJlY29yZDxzdHJpbmcsIE5vZGU+IHtcclxuICAgIHJldHVybiB0aGlzLl9ub2RlcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbm9kZXMoIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBOb2RlPiApIHsgdGhpcy5zZXROb2RlcyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG5vZGVzKCk6IFJlY29yZDxzdHJpbmcsIE5vZGU+IHsgcmV0dXJuIHRoaXMuZ2V0Tm9kZXMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgbmV3bGluZXMgYXJlIHJlcGxhY2VkIHdpdGggPGJyPlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSZXBsYWNlTmV3bGluZXMoIHJlcGxhY2VOZXdsaW5lczogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIGlmICggdGhpcy5fcmVwbGFjZU5ld2xpbmVzICE9PSByZXBsYWNlTmV3bGluZXMgKSB7XHJcbiAgICAgIHRoaXMuX3JlcGxhY2VOZXdsaW5lcyA9IHJlcGxhY2VOZXdsaW5lcztcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByZXBsYWNlTmV3bGluZXMoIHZhbHVlOiBib29sZWFuICkgeyB0aGlzLnNldFJlcGxhY2VOZXdsaW5lcyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJlcGxhY2VOZXdsaW5lcygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZ2V0UmVwbGFjZU5ld2xpbmVzKCk7IH1cclxuXHJcbiAgcHVibGljIGdldFJlcGxhY2VOZXdsaW5lcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9yZXBsYWNlTmV3bGluZXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBhbGlnbm1lbnQgb2YgdGV4dCAob25seSByZWxldmFudCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgbGluZXMpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRBbGlnbiggYWxpZ246IFJpY2hUZXh0QWxpZ24gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhbGlnbiA9PT0gJ2xlZnQnIHx8IGFsaWduID09PSAnY2VudGVyJyB8fCBhbGlnbiA9PT0gJ3JpZ2h0JyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fYWxpZ24gIT09IGFsaWduICkge1xyXG4gICAgICB0aGlzLl9hbGlnbiA9IGFsaWduO1xyXG4gICAgICB0aGlzLnJlYnVpbGRSaWNoVGV4dCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGFsaWduKCB2YWx1ZTogUmljaFRleHRBbGlnbiApIHsgdGhpcy5zZXRBbGlnbiggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFsaWduKCk6IFJpY2hUZXh0QWxpZ24geyByZXR1cm4gdGhpcy5nZXRBbGlnbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgYWxpZ25tZW50IG9mIHRoZSB0ZXh0IChvbmx5IHJlbGV2YW50IGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBsaW5lcykuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFsaWduKCk6IFJpY2hUZXh0QWxpZ24ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FsaWduO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbGVhZGluZyAoc3BhY2luZyBiZXR3ZWVuIGxpbmVzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMZWFkaW5nKCBsZWFkaW5nOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbGVhZGluZyApICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9sZWFkaW5nICE9PSBsZWFkaW5nICkge1xyXG4gICAgICB0aGlzLl9sZWFkaW5nID0gbGVhZGluZztcclxuICAgICAgdGhpcy5yZWJ1aWxkUmljaFRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBsZWFkaW5nKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldExlYWRpbmcoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBsZWFkaW5nKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldExlYWRpbmcoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsZWFkaW5nIChzcGFjaW5nIGJldHdlZW4gbGluZXMpXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlYWRpbmcoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9sZWFkaW5nO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbGluZSB3cmFwIHdpZHRoIGZvciB0aGUgdGV4dCAob3IgbnVsbCBpZiBub25lIGlzIGRlc2lyZWQpLiBMaW5lcyBsb25nZXIgdGhhbiB0aGlzIGxlbmd0aCB3aWxsIHdyYXBcclxuICAgKiBhdXRvbWF0aWNhbGx5IHRvIHRoZSBuZXh0IGxpbmUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbGluZVdyYXAgLSBJZiBpdCdzIGEgbnVtYmVyLCBpdCBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDAuXHJcbiAgICovXHJcbiAgcHVibGljIHNldExpbmVXcmFwKCBsaW5lV3JhcDogUmVxdWlyZWRPcHRpb248U2VsZk9wdGlvbnMsICdsaW5lV3JhcCc+ICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGluZVdyYXAgPT09IG51bGwgfHwgbGluZVdyYXAgPT09ICdzdHJldGNoJyB8fCAoIGlzRmluaXRlKCBsaW5lV3JhcCApICYmIGxpbmVXcmFwID4gMCApICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9saW5lV3JhcCAhPT0gbGluZVdyYXAgKSB7XHJcbiAgICAgIHRoaXMuX2xpbmVXcmFwID0gbGluZVdyYXA7XHJcbiAgICAgIHRoaXMucmVidWlsZFJpY2hUZXh0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGluZVdyYXAoIHZhbHVlOiBSZXF1aXJlZE9wdGlvbjxTZWxmT3B0aW9ucywgJ2xpbmVXcmFwJz4gKSB7IHRoaXMuc2V0TGluZVdyYXAoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBsaW5lV3JhcCgpOiBSZXF1aXJlZE9wdGlvbjxTZWxmT3B0aW9ucywgJ2xpbmVXcmFwJz4geyByZXR1cm4gdGhpcy5nZXRMaW5lV3JhcCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxpbmUgd3JhcCB3aWR0aC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGluZVdyYXAoKTogUmVxdWlyZWRPcHRpb248U2VsZk9wdGlvbnMsICdsaW5lV3JhcCc+IHtcclxuICAgIHJldHVybiB0aGlzLl9saW5lV3JhcDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBtdXRhdGUoIG9wdGlvbnM/OiBSaWNoVGV4dE9wdGlvbnMgKTogdGhpcyB7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgJiYgb3B0aW9ucyAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAnc3RyaW5nJyApICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoIFRleHQuU1RSSU5HX1BST1BFUlRZX05BTUUgKSAmJiBvcHRpb25zLnN0cmluZ1Byb3BlcnR5ICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnN0cmluZ1Byb3BlcnR5LnZhbHVlID09PSBvcHRpb25zLnN0cmluZywgJ0lmIGJvdGggc3RyaW5nIGFuZCBzdHJpbmdQcm9wZXJ0eSBhcmUgcHJvdmlkZWQsIHRoZW4gdmFsdWVzIHNob3VsZCBtYXRjaCcgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VwZXIubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgd3JhcHBlZCB2ZXJzaW9uIG9mIHRoZSBzdHJpbmcgd2l0aCBhIGZvbnQgc3BlY2lmaWVyIHRoYXQgdXNlcyB0aGUgZ2l2ZW4gZm9udCBvYmplY3QuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEb2VzIGFuIGFwcHJveGltYXRpb24gb2Ygc29tZSBmb250IHZhbHVlcyAodXNpbmcgPGI+IG9yIDxpPiksIGFuZCBjYW5ub3QgZm9yY2UgdGhlIGxhY2sgb2YgdGhvc2UgaWYgaXQgaXNcclxuICAgKiBpbmNsdWRlZCBpbiBib2xkL2l0YWxpYyBleHRlcmlvciB0YWdzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc3RyaW5nV2l0aEZvbnQoIHN0cjogc3RyaW5nLCBmb250OiBGb250ICk6IHN0cmluZyB7XHJcbiAgICAvLyBUT0RPOiBFUzYgc3RyaW5nIGludGVycG9sYXRpb24uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICByZXR1cm4gYCR7JzxzcGFuIHN0eWxlPVxcJycgK1xyXG4gICAgICAgICAgICdmb250LXN0eWxlOiAnfSR7Zm9udC5zdHlsZX07YCArXHJcbiAgICAgICAgICAgYGZvbnQtdmFyaWFudDogJHtmb250LnZhcmlhbnR9O2AgK1xyXG4gICAgICAgICAgIGBmb250LXdlaWdodDogJHtmb250LndlaWdodH07YCArXHJcbiAgICAgICAgICAgYGZvbnQtc3RyZXRjaDogJHtmb250LnN0cmV0Y2h9O2AgK1xyXG4gICAgICAgICAgIGBmb250LXNpemU6ICR7Zm9udC5zaXplfTtgICtcclxuICAgICAgICAgICBgZm9udC1mYW1pbHk6ICR7Zm9udC5mYW1pbHl9O2AgK1xyXG4gICAgICAgICAgIGBsaW5lLWhlaWdodDogJHtmb250LmxpbmVIZWlnaHR9O2AgK1xyXG4gICAgICAgICAgIGAnPiR7c3RyfTwvc3Bhbj5gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RyaW5naWZpZXMgYW4gSFRNTCBzdWJ0cmVlIGRlZmluZWQgYnkgdGhlIGdpdmVuIGVsZW1lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBoaW1hbGF5YUVsZW1lbnRUb1N0cmluZyggZWxlbWVudDogSGltYWxheWFOb2RlLCBpc0xUUjogYm9vbGVhbiApOiBzdHJpbmcge1xyXG4gICAgaWYgKCBpc0hpbWFsYXlhVGV4dE5vZGUoIGVsZW1lbnQgKSApIHtcclxuICAgICAgcmV0dXJuIFJpY2hUZXh0LmNvbnRlbnRUb1N0cmluZyggZWxlbWVudC5jb250ZW50LCBpc0xUUiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGlzSGltYWxheWFFbGVtZW50Tm9kZSggZWxlbWVudCApICkge1xyXG4gICAgICBjb25zdCBkaXJBdHRyaWJ1dGVTdHJpbmcgPSBSaWNoVGV4dFV0aWxzLmhpbWFsYXlhR2V0QXR0cmlidXRlKCAnZGlyJywgZWxlbWVudCApO1xyXG5cclxuICAgICAgaWYgKCBlbGVtZW50LnRhZ05hbWUgPT09ICdzcGFuJyAmJiBkaXJBdHRyaWJ1dGVTdHJpbmcgKSB7XHJcbiAgICAgICAgaXNMVFIgPSBkaXJBdHRyaWJ1dGVTdHJpbmcgPT09ICdsdHInO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBQcm9jZXNzIGNoaWxkcmVuXHJcbiAgICAgIHJldHVybiBlbGVtZW50LmNoaWxkcmVuLm1hcCggY2hpbGQgPT4gUmljaFRleHQuaGltYWxheWFFbGVtZW50VG9TdHJpbmcoIGNoaWxkLCBpc0xUUiApICkuam9pbiggJycgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdHJpbmdpZmllcyBhbiBIVE1MIHN1YnRyZWUgZGVmaW5lZCBieSB0aGUgZ2l2ZW4gZWxlbWVudCwgYnV0IHJlbW92aW5nIGNlcnRhaW4gdGFncyB0aGF0IHdlIGRvbid0IG5lZWQgZm9yXHJcbiAgICogYWNjZXNzaWJpbGl0eSAobGlrZSA8YT4sIDxzcGFuPiwgZXRjLiksIGFuZCBhZGRpbmcgaW4gdGFncyB3ZSBkbyB3YW50IChzZWUgQUNDRVNTSUJMRV9UQUdTKS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGhpbWFsYXlhRWxlbWVudFRvQWNjZXNzaWJsZVN0cmluZyggZWxlbWVudDogSGltYWxheWFOb2RlLCBpc0xUUjogYm9vbGVhbiApOiBzdHJpbmcge1xyXG4gICAgaWYgKCBpc0hpbWFsYXlhVGV4dE5vZGUoIGVsZW1lbnQgKSApIHtcclxuICAgICAgcmV0dXJuIFJpY2hUZXh0LmNvbnRlbnRUb1N0cmluZyggZWxlbWVudC5jb250ZW50LCBpc0xUUiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGlzSGltYWxheWFFbGVtZW50Tm9kZSggZWxlbWVudCApICkge1xyXG4gICAgICBjb25zdCBkaXJBdHRyaWJ1dGUgPSBSaWNoVGV4dFV0aWxzLmhpbWFsYXlhR2V0QXR0cmlidXRlKCAnZGlyJywgZWxlbWVudCApO1xyXG5cclxuICAgICAgaWYgKCBlbGVtZW50LnRhZ05hbWUgPT09ICdzcGFuJyAmJiBkaXJBdHRyaWJ1dGUgKSB7XHJcbiAgICAgICAgaXNMVFIgPSBkaXJBdHRyaWJ1dGUgPT09ICdsdHInO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBQcm9jZXNzIGNoaWxkcmVuXHJcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBlbGVtZW50LmNoaWxkcmVuLm1hcCggY2hpbGQgPT4gUmljaFRleHQuaGltYWxheWFFbGVtZW50VG9BY2Nlc3NpYmxlU3RyaW5nKCBjaGlsZCwgaXNMVFIgKSApLmpvaW4oICcnICk7XHJcblxyXG4gICAgICBpZiAoIF8uaW5jbHVkZXMoIEFDQ0VTU0lCTEVfVEFHUywgZWxlbWVudC50YWdOYW1lICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGA8JHtlbGVtZW50LnRhZ05hbWV9PiR7Y29udGVudH08LyR7ZWxlbWVudC50YWdOYW1lfT5gO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgdGhlIGVsZW1lbnQuY29udGVudCBmcm9tIGhpbWFsYXlhLCB1bmVzY2FwZXMgSFRNTCBlbnRpdGllcywgYW5kIGFwcGxpZXMgdGhlIHByb3BlciBkaXJlY3Rpb25hbCB0YWdzLlxyXG4gICAqXHJcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzMxNVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY29udGVudFRvU3RyaW5nKCBjb250ZW50OiBzdHJpbmcsIGlzTFRSOiBib29sZWFuICk6IHN0cmluZyB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gd2Ugc2hvdWxkIGdldCBhIHN0cmluZyBmcm9tIHRoaXNcclxuICAgIGNvbnN0IHVuZXNjYXBlZENvbnRlbnQ6IHN0cmluZyA9IGhlLmRlY29kZSggY29udGVudCApO1xyXG4gICAgcmV0dXJuIGlzTFRSID8gKCBgXFx1MjAyYSR7dW5lc2NhcGVkQ29udGVudH1cXHUyMDJjYCApIDogKCBgXFx1MjAyYiR7dW5lc2NhcGVkQ29udGVudH1cXHUyMDJjYCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBSaWNoVGV4dElPOiBJT1R5cGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgbm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW4gdGhlXHJcbiAqIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQgaW4uXHJcbiAqXHJcbiAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICovXHJcblJpY2hUZXh0LnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBSSUNIX1RFWFRfT1BUSU9OX0tFWVMuY29uY2F0KCBOb2RlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgKTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdSaWNoVGV4dCcsIFJpY2hUZXh0ICk7XHJcblxyXG5SaWNoVGV4dC5SaWNoVGV4dElPID0gbmV3IElPVHlwZSggJ1JpY2hUZXh0SU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBSaWNoVGV4dCxcclxuICBzdXBlcnR5cGU6IE5vZGUuTm9kZUlPLFxyXG4gIGRvY3VtZW50YXRpb246ICdUaGUgUGhFVC1pTyBUeXBlIGZvciB0aGUgc2NlbmVyeSBSaWNoVGV4dCBub2RlJ1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUEsT0FBT0EsY0FBYyxNQUFNLG9DQUFvQztBQUMvRCxPQUFPQyxzQkFBc0IsTUFBTSw0Q0FBNEM7QUFFL0UsT0FBT0MsTUFBTSxNQUFNLDhCQUE4QjtBQUNqRCxPQUFPQyxNQUFNLE1BQU0sb0NBQW9DO0FBQ3ZELFNBQVNDLGtCQUFrQixFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsa0JBQWtCLEVBQWdCQyxxQkFBcUIsRUFBRUMsa0JBQWtCLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFzQ0MsZUFBZSxFQUFFQyxZQUFZLEVBQUVDLFlBQVksRUFBRUMsWUFBWSxFQUFFQyxhQUFhLEVBQUVDLHNCQUFzQixFQUFFQyxPQUFPLEVBQUVDLElBQUksRUFBNEJDLFlBQVksUUFBUSxl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