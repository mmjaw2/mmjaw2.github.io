// Copyright 2017-2023, University of Colorado Boulder

/**
 * Utilities for creating and manipulating the unique identifiers assigned to instrumented PhET-iO instances, aka
 * phetioIDs.
 *
 * Many of these functions' jsdoc is rendered and visible publicly to PhET-iO client. Those sections should be
 * marked, see top level comment in PhetioClient.js about private vs public documentation
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
(function () {
  // define the phetio global
  window.phetio = window.phetio || {};

  // constants
  const SEPARATOR = '.';
  const GROUP_SEPARATOR = '_';
  const INTER_TERM_SEPARATOR = '-';
  const GENERAL_COMPONENT_NAME = 'general';
  const GLOBAL_COMPONENT_NAME = 'global';
  const HOME_SCREEN_COMPONENT_NAME = 'homeScreen';
  const MODEL_COMPONENT_NAME = 'model';
  const VIEW_COMPONENT_NAME = 'view';
  const COLORS_COMPONENT_NAME = 'colors';
  const STRINGS_COMPONENT_NAME = 'strings';
  const CONTROLLER_COMPONENT_NAME = 'controller';
  const SCREEN_COMPONENT_NAME = 'Screen';
  const ARCHETYPE = 'archetype';
  const CAPSULE_SUFFIX = 'Capsule';

  /**
   * Helpful methods for manipulating phetioIDs. Used to minimize the amount of duplicated logic specific to the string
   * structure of the phetioID. Available in the main PhET-iO js import.
   * @namespace
   */
  window.phetio.PhetioIDUtils = {
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Appends a component to an existing phetioID to create a new unique phetioID for the component.
     * @example
     * append( 'myScreen.myControlPanel', 'myComboBox' )
     * -->  'myScreen.myControlPanel.myComboBox'
     * @public
     * @param {string} phetioID - the ID of the PhET-iO Element
     * @param {string|string[]} componentNames - the name or list of names to append to the ID
     * @returns {string} - the appended phetioID
     */
    append: function (phetioID, ...componentNames) {
      componentNames.forEach(componentName => {
        assert && assert(componentName.indexOf(SEPARATOR) === -1, `separator appears in componentName: ${componentName}`);
        if (componentName === '') {
          return;
        }
        const separator = phetioID === '' ? '' : SEPARATOR;
        phetioID += separator + componentName;
      });
      return phetioID;
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Given a phetioID for a PhET-iO Element, get the part of that ID that pertains to the component (basically the
     * tail piece).
     * @example
     * getComponentName( 'myScreen.myControlPanel.myComboBox' )
     * -->  'myComboBox'
     * @public
     * @param {string} phetioID - the ID of the PhET-iO Element
     * @returns {string} - the component name
     */
    getComponentName: function (phetioID) {
      assert && assert(phetioID.length > 0);
      const indexOfLastSeparator = phetioID.lastIndexOf(SEPARATOR);
      if (indexOfLastSeparator === -1) {
        return phetioID;
      } else {
        return phetioID.substring(indexOfLastSeparator + 1, phetioID.length);
      }
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Given a phetioID for a PhET-iO Element, get the phetioID of the parent component.
     * @example
     * getParentID( 'myScreen.myControlPanel.myComboBox' )
     * -->  'myScreen.myControlPanel'
     * @public
     * @param {string} phetioID - the ID of the PhET-iO Element
     * @returns {string|null} - the phetioID of the parent, or null if there is no parent
     */
    getParentID: function (phetioID) {
      const indexOfLastSeparator = phetioID.lastIndexOf(SEPARATOR);
      return indexOfLastSeparator === -1 ? null : phetioID.substring(0, indexOfLastSeparator);
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Given a phetioID for an instrumented object, get a string that can be used to assign an ID to a DOM element
     * @param {string} phetioID - the ID of the PhET-iO Element
     * @returns {string}
     * @public
     * @deprecated
     */
    getDOMElementID: function (phetioID) {
      return `phetioID:${phetioID}`;
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Get the screen id from the phetioID.
     * @example
     * getScreenID( 'sim.myScreen.model.property' )
     * --> sim.myScreen
     * getScreenID( 'sim.myScreen' )
     * --> sim.myScreen
     * getScreenID( 'sim.general.activeProperty' )
     * --> null
     * @param {string} phetioID
     * @returns {string|null} - null if there is no screen component name in the phetioID
     */
    getScreenID: function (phetioID) {
      const screenIDParts = [];
      const phetioIDParts = phetioID.split(SEPARATOR);
      for (let i = 0; i < phetioIDParts.length; i++) {
        const componentPart = phetioIDParts[i];
        screenIDParts.push(componentPart);
        const indexOfScreenMarker = componentPart.indexOf(SCREEN_COMPONENT_NAME);
        if (indexOfScreenMarker > 0 && indexOfScreenMarker + SCREEN_COMPONENT_NAME.length === componentPart.length) {
          // endsWith proxy
          return screenIDParts.join(SEPARATOR);
        }
      }
      return null;
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Get the index number from the component name of the component name provided.
     * @param {string} componentName
     * @returns {number}
     * @example
     * getGroupElementIndex( 'particle_1' )
     * --> 1
     * @public
     */
    getGroupElementIndex: function (componentName) {
      assert && assert(componentName.indexOf(window.phetio.PhetioIDUtils.GROUP_SEPARATOR) >= 0, 'component name for phetioID should have group element syntax');
      return Number(componentName.split(window.phetio.PhetioIDUtils.GROUP_SEPARATOR)[1]);
    },
    /**
     * Returns true if the potential ancestor is indeed an ancestor of the potential descendant, but not the same phetioID
     * @param {string} potentialAncestorPhetioID
     * @param {string} potentialDescendantPhetioID
     * @returns {boolean}
     * @public
     */
    isAncestor: function (potentialAncestorPhetioID, potentialDescendantPhetioID) {
      const ancestorComponents = potentialAncestorPhetioID.split(SEPARATOR);
      const descendantComponents = potentialDescendantPhetioID.split(SEPARATOR);
      for (let i = 0; i < ancestorComponents.length; i++) {
        if (ancestorComponents[i] !== descendantComponents[i]) {
          return false;
        }
      }

      // not the same child
      return potentialDescendantPhetioID !== potentialAncestorPhetioID;
    },
    /**
     * Converts a given phetioID to one where all dynamic element terms (i.e. ones with an underscore, like battery_4)
     * are replaced with the term 'archetype'. This helps when looking up the archetype phetioID or metadata for a given
     * dynamic element. Also support INTER_TERM_SEPARATOR delimited parts, like 'sim.screen1.myObject.term1-and-term2-battery_4-term4-etc'.
     *
     * See unit tests and examples in PhetioIDUtilsTests.ts.
     * @param {string} phetioID
     * @returns {string}
     */
    getArchetypalPhetioID: function (phetioID) {
      const phetioIDParts = phetioID.split(SEPARATOR);
      for (let i = 0; i < phetioIDParts.length; i++) {
        const term = phetioIDParts[i];
        if (term.endsWith(CAPSULE_SUFFIX) && i < phetioIDParts.length - 1) {
          phetioIDParts[i + 1] = ARCHETYPE;
          i++;
        } else {
          const mappedInnerTerms = term.split(INTER_TERM_SEPARATOR).map(term => term.includes(GROUP_SEPARATOR) ? ARCHETYPE : term);
          phetioIDParts[i] = mappedInnerTerms.join(INTER_TERM_SEPARATOR);
        }
      }
      return phetioIDParts.join(SEPARATOR);
    },
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The separator used to piece together a phet-io ID.
     * @type {string}
     * @constant
     * @public
     */
    SEPARATOR: SEPARATOR,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The separator used to specify the count of a element in a group.
     * @type {string}
     * @constant
     * @public
     */
    GROUP_SEPARATOR: GROUP_SEPARATOR,
    /**
     * The separator used to specify terms in a phetioID that is used by another phetioID. For example:
     *
     * sim.general.view.sim-global-otherID
     *
     * @type {string}
     * @constant
     * @public
     */
    INTER_TERM_SEPARATOR: INTER_TERM_SEPARATOR,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for the id section that holds phet-io elements general to all simulations.
     * @type {string}
     * @constant
     * @public
     */
    GENERAL_COMPONENT_NAME: GENERAL_COMPONENT_NAME,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for the id section that holds simulation specific elements that don't belong in a screen.
     * @type {string}
     * @constant
     * @public
     */
    GLOBAL_COMPONENT_NAME: GLOBAL_COMPONENT_NAME,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for the id section that holds the home screen.
     * @type {string}
     * @constant
     * @public
     */
    HOME_SCREEN_COMPONENT_NAME: HOME_SCREEN_COMPONENT_NAME,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for an id section that holds model specific elements.
     * @type {string}
     * @constant
     * @public
     */
    MODEL_COMPONENT_NAME: MODEL_COMPONENT_NAME,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for an id section that holds view specific elements.
     * @type {string}
     * @constant
     * @public
     */
    VIEW_COMPONENT_NAME: VIEW_COMPONENT_NAME,
    // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The component name for an id section that holds controller specific elements.
     * @type {string}
     * @constant
     * @public
     */
    CONTROLLER_COMPONENT_NAME: CONTROLLER_COMPONENT_NAME,
    /**
     * The component name for a section that holds colors
     * @type {string}
     * @constant
     * @public
     */
    COLORS_COMPONENT_NAME: COLORS_COMPONENT_NAME,
    /**
     * The component name for a section that holds strings
     * @type {string}
     * @constant
     * @public
     */
    STRINGS_COMPONENT_NAME: STRINGS_COMPONENT_NAME,
    /**
     * The component name for a dynamic element archetype
     * @type {string}
     * @constant
     * @public
     */
    ARCHETYPE: ARCHETYPE,
    /**
     * The component name suffix for the container (parent) of a dynamic element that doesn't have an '_' in it.
     * @type {string}
     * @constant
     * @public
     */
    CAPSULE_SUFFIX: CAPSULE_SUFFIX
  };
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3aW5kb3ciLCJwaGV0aW8iLCJTRVBBUkFUT1IiLCJHUk9VUF9TRVBBUkFUT1IiLCJJTlRFUl9URVJNX1NFUEFSQVRPUiIsIkdFTkVSQUxfQ09NUE9ORU5UX05BTUUiLCJHTE9CQUxfQ09NUE9ORU5UX05BTUUiLCJIT01FX1NDUkVFTl9DT01QT05FTlRfTkFNRSIsIk1PREVMX0NPTVBPTkVOVF9OQU1FIiwiVklFV19DT01QT05FTlRfTkFNRSIsIkNPTE9SU19DT01QT05FTlRfTkFNRSIsIlNUUklOR1NfQ09NUE9ORU5UX05BTUUiLCJDT05UUk9MTEVSX0NPTVBPTkVOVF9OQU1FIiwiU0NSRUVOX0NPTVBPTkVOVF9OQU1FIiwiQVJDSEVUWVBFIiwiQ0FQU1VMRV9TVUZGSVgiLCJQaGV0aW9JRFV0aWxzIiwiYXBwZW5kIiwicGhldGlvSUQiLCJjb21wb25lbnROYW1lcyIsImZvckVhY2giLCJjb21wb25lbnROYW1lIiwiYXNzZXJ0IiwiaW5kZXhPZiIsInNlcGFyYXRvciIsImdldENvbXBvbmVudE5hbWUiLCJsZW5ndGgiLCJpbmRleE9mTGFzdFNlcGFyYXRvciIsImxhc3RJbmRleE9mIiwic3Vic3RyaW5nIiwiZ2V0UGFyZW50SUQiLCJnZXRET01FbGVtZW50SUQiLCJnZXRTY3JlZW5JRCIsInNjcmVlbklEUGFydHMiLCJwaGV0aW9JRFBhcnRzIiwic3BsaXQiLCJpIiwiY29tcG9uZW50UGFydCIsInB1c2giLCJpbmRleE9mU2NyZWVuTWFya2VyIiwiam9pbiIsImdldEdyb3VwRWxlbWVudEluZGV4IiwiTnVtYmVyIiwiaXNBbmNlc3RvciIsInBvdGVudGlhbEFuY2VzdG9yUGhldGlvSUQiLCJwb3RlbnRpYWxEZXNjZW5kYW50UGhldGlvSUQiLCJhbmNlc3RvckNvbXBvbmVudHMiLCJkZXNjZW5kYW50Q29tcG9uZW50cyIsImdldEFyY2hldHlwYWxQaGV0aW9JRCIsInRlcm0iLCJlbmRzV2l0aCIsIm1hcHBlZElubmVyVGVybXMiLCJtYXAiLCJpbmNsdWRlcyJdLCJzb3VyY2VzIjpbIlBoZXRpb0lEVXRpbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVXRpbGl0aWVzIGZvciBjcmVhdGluZyBhbmQgbWFuaXB1bGF0aW5nIHRoZSB1bmlxdWUgaWRlbnRpZmllcnMgYXNzaWduZWQgdG8gaW5zdHJ1bWVudGVkIFBoRVQtaU8gaW5zdGFuY2VzLCBha2FcclxuICogcGhldGlvSURzLlxyXG4gKlxyXG4gKiBNYW55IG9mIHRoZXNlIGZ1bmN0aW9ucycganNkb2MgaXMgcmVuZGVyZWQgYW5kIHZpc2libGUgcHVibGljbHkgdG8gUGhFVC1pTyBjbGllbnQuIFRob3NlIHNlY3Rpb25zIHNob3VsZCBiZVxyXG4gKiBtYXJrZWQsIHNlZSB0b3AgbGV2ZWwgY29tbWVudCBpbiBQaGV0aW9DbGllbnQuanMgYWJvdXQgcHJpdmF0ZSB2cyBwdWJsaWMgZG9jdW1lbnRhdGlvblxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuKCBmdW5jdGlvbigpIHtcclxuXHJcblxyXG4gIC8vIGRlZmluZSB0aGUgcGhldGlvIGdsb2JhbFxyXG4gIHdpbmRvdy5waGV0aW8gPSB3aW5kb3cucGhldGlvIHx8IHt9O1xyXG5cclxuICAvLyBjb25zdGFudHNcclxuICBjb25zdCBTRVBBUkFUT1IgPSAnLic7XHJcbiAgY29uc3QgR1JPVVBfU0VQQVJBVE9SID0gJ18nO1xyXG4gIGNvbnN0IElOVEVSX1RFUk1fU0VQQVJBVE9SID0gJy0nO1xyXG4gIGNvbnN0IEdFTkVSQUxfQ09NUE9ORU5UX05BTUUgPSAnZ2VuZXJhbCc7XHJcbiAgY29uc3QgR0xPQkFMX0NPTVBPTkVOVF9OQU1FID0gJ2dsb2JhbCc7XHJcbiAgY29uc3QgSE9NRV9TQ1JFRU5fQ09NUE9ORU5UX05BTUUgPSAnaG9tZVNjcmVlbic7XHJcbiAgY29uc3QgTU9ERUxfQ09NUE9ORU5UX05BTUUgPSAnbW9kZWwnO1xyXG4gIGNvbnN0IFZJRVdfQ09NUE9ORU5UX05BTUUgPSAndmlldyc7XHJcbiAgY29uc3QgQ09MT1JTX0NPTVBPTkVOVF9OQU1FID0gJ2NvbG9ycyc7XHJcbiAgY29uc3QgU1RSSU5HU19DT01QT05FTlRfTkFNRSA9ICdzdHJpbmdzJztcclxuICBjb25zdCBDT05UUk9MTEVSX0NPTVBPTkVOVF9OQU1FID0gJ2NvbnRyb2xsZXInO1xyXG4gIGNvbnN0IFNDUkVFTl9DT01QT05FTlRfTkFNRSA9ICdTY3JlZW4nO1xyXG4gIGNvbnN0IEFSQ0hFVFlQRSA9ICdhcmNoZXR5cGUnO1xyXG4gIGNvbnN0IENBUFNVTEVfU1VGRklYID0gJ0NhcHN1bGUnO1xyXG5cclxuICAvKipcclxuICAgKiBIZWxwZnVsIG1ldGhvZHMgZm9yIG1hbmlwdWxhdGluZyBwaGV0aW9JRHMuIFVzZWQgdG8gbWluaW1pemUgdGhlIGFtb3VudCBvZiBkdXBsaWNhdGVkIGxvZ2ljIHNwZWNpZmljIHRvIHRoZSBzdHJpbmdcclxuICAgKiBzdHJ1Y3R1cmUgb2YgdGhlIHBoZXRpb0lELiBBdmFpbGFibGUgaW4gdGhlIG1haW4gUGhFVC1pTyBqcyBpbXBvcnQuXHJcbiAgICogQG5hbWVzcGFjZVxyXG4gICAqL1xyXG4gIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscyA9IHtcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8qKlxyXG4gICAgICogQXBwZW5kcyBhIGNvbXBvbmVudCB0byBhbiBleGlzdGluZyBwaGV0aW9JRCB0byBjcmVhdGUgYSBuZXcgdW5pcXVlIHBoZXRpb0lEIGZvciB0aGUgY29tcG9uZW50LlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGFwcGVuZCggJ215U2NyZWVuLm15Q29udHJvbFBhbmVsJywgJ215Q29tYm9Cb3gnIClcclxuICAgICAqIC0tPiAgJ215U2NyZWVuLm15Q29udHJvbFBhbmVsLm15Q29tYm9Cb3gnXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGhldGlvSUQgLSB0aGUgSUQgb2YgdGhlIFBoRVQtaU8gRWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IGNvbXBvbmVudE5hbWVzIC0gdGhlIG5hbWUgb3IgbGlzdCBvZiBuYW1lcyB0byBhcHBlbmQgdG8gdGhlIElEXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIHRoZSBhcHBlbmRlZCBwaGV0aW9JRFxyXG4gICAgICovXHJcbiAgICBhcHBlbmQ6IGZ1bmN0aW9uKCBwaGV0aW9JRCwgLi4uY29tcG9uZW50TmFtZXMgKSB7XHJcbiAgICAgIGNvbXBvbmVudE5hbWVzLmZvckVhY2goIGNvbXBvbmVudE5hbWUgPT4ge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbXBvbmVudE5hbWUuaW5kZXhPZiggU0VQQVJBVE9SICkgPT09IC0xLCBgc2VwYXJhdG9yIGFwcGVhcnMgaW4gY29tcG9uZW50TmFtZTogJHtjb21wb25lbnROYW1lfWAgKTtcclxuICAgICAgICBpZiAoIGNvbXBvbmVudE5hbWUgPT09ICcnICkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSBwaGV0aW9JRCA9PT0gJycgPyAnJyA6IFNFUEFSQVRPUjtcclxuICAgICAgICBwaGV0aW9JRCArPSBzZXBhcmF0b3IgKyBjb21wb25lbnROYW1lO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHJldHVybiBwaGV0aW9JRDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6IFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgcGhldGlvSUQgZm9yIGEgUGhFVC1pTyBFbGVtZW50LCBnZXQgdGhlIHBhcnQgb2YgdGhhdCBJRCB0aGF0IHBlcnRhaW5zIHRvIHRoZSBjb21wb25lbnQgKGJhc2ljYWxseSB0aGVcclxuICAgICAqIHRhaWwgcGllY2UpLlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGdldENvbXBvbmVudE5hbWUoICdteVNjcmVlbi5teUNvbnRyb2xQYW5lbC5teUNvbWJvQm94JyApXHJcbiAgICAgKiAtLT4gICdteUNvbWJvQm94J1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBoZXRpb0lEIC0gdGhlIElEIG9mIHRoZSBQaEVULWlPIEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gdGhlIGNvbXBvbmVudCBuYW1lXHJcbiAgICAgKi9cclxuICAgIGdldENvbXBvbmVudE5hbWU6IGZ1bmN0aW9uKCBwaGV0aW9JRCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGhldGlvSUQubGVuZ3RoID4gMCApO1xyXG4gICAgICBjb25zdCBpbmRleE9mTGFzdFNlcGFyYXRvciA9IHBoZXRpb0lELmxhc3RJbmRleE9mKCBTRVBBUkFUT1IgKTtcclxuICAgICAgaWYgKCBpbmRleE9mTGFzdFNlcGFyYXRvciA9PT0gLTEgKSB7XHJcbiAgICAgICAgcmV0dXJuIHBoZXRpb0lEO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBwaGV0aW9JRC5zdWJzdHJpbmcoIGluZGV4T2ZMYXN0U2VwYXJhdG9yICsgMSwgcGhldGlvSUQubGVuZ3RoICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6IFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgcGhldGlvSUQgZm9yIGEgUGhFVC1pTyBFbGVtZW50LCBnZXQgdGhlIHBoZXRpb0lEIG9mIHRoZSBwYXJlbnQgY29tcG9uZW50LlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGdldFBhcmVudElEKCAnbXlTY3JlZW4ubXlDb250cm9sUGFuZWwubXlDb21ib0JveCcgKVxyXG4gICAgICogLS0+ICAnbXlTY3JlZW4ubXlDb250cm9sUGFuZWwnXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGhldGlvSUQgLSB0aGUgSUQgb2YgdGhlIFBoRVQtaU8gRWxlbWVudFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfSAtIHRoZSBwaGV0aW9JRCBvZiB0aGUgcGFyZW50LCBvciBudWxsIGlmIHRoZXJlIGlzIG5vIHBhcmVudFxyXG4gICAgICovXHJcbiAgICBnZXRQYXJlbnRJRDogZnVuY3Rpb24oIHBoZXRpb0lEICkge1xyXG4gICAgICBjb25zdCBpbmRleE9mTGFzdFNlcGFyYXRvciA9IHBoZXRpb0lELmxhc3RJbmRleE9mKCBTRVBBUkFUT1IgKTtcclxuICAgICAgcmV0dXJuIGluZGV4T2ZMYXN0U2VwYXJhdG9yID09PSAtMSA/IG51bGwgOiBwaGV0aW9JRC5zdWJzdHJpbmcoIDAsIGluZGV4T2ZMYXN0U2VwYXJhdG9yICk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIHBoZXRpb0lEIGZvciBhbiBpbnN0cnVtZW50ZWQgb2JqZWN0LCBnZXQgYSBzdHJpbmcgdGhhdCBjYW4gYmUgdXNlZCB0byBhc3NpZ24gYW4gSUQgdG8gYSBET00gZWxlbWVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBoZXRpb0lEIC0gdGhlIElEIG9mIHRoZSBQaEVULWlPIEVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAZGVwcmVjYXRlZFxyXG4gICAgICovXHJcbiAgICBnZXRET01FbGVtZW50SUQ6IGZ1bmN0aW9uKCBwaGV0aW9JRCApIHtcclxuICAgICAgcmV0dXJuIGBwaGV0aW9JRDoke3BoZXRpb0lEfWA7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHNjcmVlbiBpZCBmcm9tIHRoZSBwaGV0aW9JRC5cclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBnZXRTY3JlZW5JRCggJ3NpbS5teVNjcmVlbi5tb2RlbC5wcm9wZXJ0eScgKVxyXG4gICAgICogLS0+IHNpbS5teVNjcmVlblxyXG4gICAgICogZ2V0U2NyZWVuSUQoICdzaW0ubXlTY3JlZW4nIClcclxuICAgICAqIC0tPiBzaW0ubXlTY3JlZW5cclxuICAgICAqIGdldFNjcmVlbklEKCAnc2ltLmdlbmVyYWwuYWN0aXZlUHJvcGVydHknIClcclxuICAgICAqIC0tPiBudWxsXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGhldGlvSURcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH0gLSBudWxsIGlmIHRoZXJlIGlzIG5vIHNjcmVlbiBjb21wb25lbnQgbmFtZSBpbiB0aGUgcGhldGlvSURcclxuICAgICAqL1xyXG4gICAgZ2V0U2NyZWVuSUQ6IGZ1bmN0aW9uKCBwaGV0aW9JRCApIHtcclxuICAgICAgY29uc3Qgc2NyZWVuSURQYXJ0cyA9IFtdO1xyXG4gICAgICBjb25zdCBwaGV0aW9JRFBhcnRzID0gcGhldGlvSUQuc3BsaXQoIFNFUEFSQVRPUiApO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBwaGV0aW9JRFBhcnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhcnQgPSBwaGV0aW9JRFBhcnRzWyBpIF07XHJcbiAgICAgICAgc2NyZWVuSURQYXJ0cy5wdXNoKCBjb21wb25lbnRQYXJ0ICk7XHJcbiAgICAgICAgY29uc3QgaW5kZXhPZlNjcmVlbk1hcmtlciA9IGNvbXBvbmVudFBhcnQuaW5kZXhPZiggU0NSRUVOX0NPTVBPTkVOVF9OQU1FICk7XHJcbiAgICAgICAgaWYgKCBpbmRleE9mU2NyZWVuTWFya2VyID4gMCAmJiBpbmRleE9mU2NyZWVuTWFya2VyICsgU0NSRUVOX0NPTVBPTkVOVF9OQU1FLmxlbmd0aCA9PT0gY29tcG9uZW50UGFydC5sZW5ndGggKSB7IC8vIGVuZHNXaXRoIHByb3h5XHJcbiAgICAgICAgICByZXR1cm4gc2NyZWVuSURQYXJ0cy5qb2luKCBTRVBBUkFUT1IgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIGluZGV4IG51bWJlciBmcm9tIHRoZSBjb21wb25lbnQgbmFtZSBvZiB0aGUgY29tcG9uZW50IG5hbWUgcHJvdmlkZWQuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50TmFtZVxyXG4gICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBnZXRHcm91cEVsZW1lbnRJbmRleCggJ3BhcnRpY2xlXzEnIClcclxuICAgICAqIC0tPiAxXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGdldEdyb3VwRWxlbWVudEluZGV4OiBmdW5jdGlvbiggY29tcG9uZW50TmFtZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY29tcG9uZW50TmFtZS5pbmRleE9mKCB3aW5kb3cucGhldGlvLlBoZXRpb0lEVXRpbHMuR1JPVVBfU0VQQVJBVE9SICkgPj0gMCxcclxuICAgICAgICAnY29tcG9uZW50IG5hbWUgZm9yIHBoZXRpb0lEIHNob3VsZCBoYXZlIGdyb3VwIGVsZW1lbnQgc3ludGF4JyApO1xyXG4gICAgICByZXR1cm4gTnVtYmVyKCBjb21wb25lbnROYW1lLnNwbGl0KCB3aW5kb3cucGhldGlvLlBoZXRpb0lEVXRpbHMuR1JPVVBfU0VQQVJBVE9SIClbIDEgXSApO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcG90ZW50aWFsIGFuY2VzdG9yIGlzIGluZGVlZCBhbiBhbmNlc3RvciBvZiB0aGUgcG90ZW50aWFsIGRlc2NlbmRhbnQsIGJ1dCBub3QgdGhlIHNhbWUgcGhldGlvSURcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwb3RlbnRpYWxBbmNlc3RvclBoZXRpb0lEXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcG90ZW50aWFsRGVzY2VuZGFudFBoZXRpb0lEXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgaXNBbmNlc3RvcjogZnVuY3Rpb24oIHBvdGVudGlhbEFuY2VzdG9yUGhldGlvSUQsIHBvdGVudGlhbERlc2NlbmRhbnRQaGV0aW9JRCApIHtcclxuICAgICAgY29uc3QgYW5jZXN0b3JDb21wb25lbnRzID0gcG90ZW50aWFsQW5jZXN0b3JQaGV0aW9JRC5zcGxpdCggU0VQQVJBVE9SICk7XHJcbiAgICAgIGNvbnN0IGRlc2NlbmRhbnRDb21wb25lbnRzID0gcG90ZW50aWFsRGVzY2VuZGFudFBoZXRpb0lELnNwbGl0KCBTRVBBUkFUT1IgKTtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYW5jZXN0b3JDb21wb25lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGlmICggYW5jZXN0b3JDb21wb25lbnRzWyBpIF0gIT09IGRlc2NlbmRhbnRDb21wb25lbnRzWyBpIF0gKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBub3QgdGhlIHNhbWUgY2hpbGRcclxuICAgICAgcmV0dXJuIHBvdGVudGlhbERlc2NlbmRhbnRQaGV0aW9JRCAhPT0gcG90ZW50aWFsQW5jZXN0b3JQaGV0aW9JRDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBhIGdpdmVuIHBoZXRpb0lEIHRvIG9uZSB3aGVyZSBhbGwgZHluYW1pYyBlbGVtZW50IHRlcm1zIChpLmUuIG9uZXMgd2l0aCBhbiB1bmRlcnNjb3JlLCBsaWtlIGJhdHRlcnlfNClcclxuICAgICAqIGFyZSByZXBsYWNlZCB3aXRoIHRoZSB0ZXJtICdhcmNoZXR5cGUnLiBUaGlzIGhlbHBzIHdoZW4gbG9va2luZyB1cCB0aGUgYXJjaGV0eXBlIHBoZXRpb0lEIG9yIG1ldGFkYXRhIGZvciBhIGdpdmVuXHJcbiAgICAgKiBkeW5hbWljIGVsZW1lbnQuIEFsc28gc3VwcG9ydCBJTlRFUl9URVJNX1NFUEFSQVRPUiBkZWxpbWl0ZWQgcGFydHMsIGxpa2UgJ3NpbS5zY3JlZW4xLm15T2JqZWN0LnRlcm0xLWFuZC10ZXJtMi1iYXR0ZXJ5XzQtdGVybTQtZXRjJy5cclxuICAgICAqXHJcbiAgICAgKiBTZWUgdW5pdCB0ZXN0cyBhbmQgZXhhbXBsZXMgaW4gUGhldGlvSURVdGlsc1Rlc3RzLnRzLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBoZXRpb0lEXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRBcmNoZXR5cGFsUGhldGlvSUQ6IGZ1bmN0aW9uKCBwaGV0aW9JRCApIHtcclxuICAgICAgY29uc3QgcGhldGlvSURQYXJ0cyA9IHBoZXRpb0lELnNwbGl0KCBTRVBBUkFUT1IgKTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBoZXRpb0lEUGFydHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgdGVybSA9IHBoZXRpb0lEUGFydHNbIGkgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0ZXJtLmVuZHNXaXRoKCBDQVBTVUxFX1NVRkZJWCApICYmIGkgPCBwaGV0aW9JRFBhcnRzLmxlbmd0aCAtIDEgKSB7XHJcbiAgICAgICAgICBwaGV0aW9JRFBhcnRzWyBpICsgMSBdID0gQVJDSEVUWVBFO1xyXG4gICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IG1hcHBlZElubmVyVGVybXMgPSB0ZXJtLnNwbGl0KCBJTlRFUl9URVJNX1NFUEFSQVRPUiApLm1hcCggdGVybSA9PiB0ZXJtLmluY2x1ZGVzKCBHUk9VUF9TRVBBUkFUT1IgKSA/IEFSQ0hFVFlQRSA6IHRlcm0gKTtcclxuICAgICAgICAgIHBoZXRpb0lEUGFydHNbIGkgXSA9IG1hcHBlZElubmVyVGVybXMuam9pbiggSU5URVJfVEVSTV9TRVBBUkFUT1IgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHBoZXRpb0lEUGFydHMuam9pbiggU0VQQVJBVE9SICk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgc2VwYXJhdG9yIHVzZWQgdG8gcGllY2UgdG9nZXRoZXIgYSBwaGV0LWlvIElELlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBTRVBBUkFUT1I6IFNFUEFSQVRPUixcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHNlcGFyYXRvciB1c2VkIHRvIHNwZWNpZnkgdGhlIGNvdW50IG9mIGEgZWxlbWVudCBpbiBhIGdyb3VwLlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBHUk9VUF9TRVBBUkFUT1I6IEdST1VQX1NFUEFSQVRPUixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBzZXBhcmF0b3IgdXNlZCB0byBzcGVjaWZ5IHRlcm1zIGluIGEgcGhldGlvSUQgdGhhdCBpcyB1c2VkIGJ5IGFub3RoZXIgcGhldGlvSUQuIEZvciBleGFtcGxlOlxyXG4gICAgICpcclxuICAgICAqIHNpbS5nZW5lcmFsLnZpZXcuc2ltLWdsb2JhbC1vdGhlcklEXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBJTlRFUl9URVJNX1NFUEFSQVRPUjogSU5URVJfVEVSTV9TRVBBUkFUT1IsXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6IFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb21wb25lbnQgbmFtZSBmb3IgdGhlIGlkIHNlY3Rpb24gdGhhdCBob2xkcyBwaGV0LWlvIGVsZW1lbnRzIGdlbmVyYWwgdG8gYWxsIHNpbXVsYXRpb25zLlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBHRU5FUkFMX0NPTVBPTkVOVF9OQU1FOiBHRU5FUkFMX0NPTVBPTkVOVF9OQU1FLFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29tcG9uZW50IG5hbWUgZm9yIHRoZSBpZCBzZWN0aW9uIHRoYXQgaG9sZHMgc2ltdWxhdGlvbiBzcGVjaWZpYyBlbGVtZW50cyB0aGF0IGRvbid0IGJlbG9uZyBpbiBhIHNjcmVlbi5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKiBAY29uc3RhbnRcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgR0xPQkFMX0NPTVBPTkVOVF9OQU1FOiBHTE9CQUxfQ09NUE9ORU5UX05BTUUsXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6IFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb21wb25lbnQgbmFtZSBmb3IgdGhlIGlkIHNlY3Rpb24gdGhhdCBob2xkcyB0aGUgaG9tZSBzY3JlZW4uXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQGNvbnN0YW50XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIEhPTUVfU0NSRUVOX0NPTVBPTkVOVF9OQU1FOiBIT01FX1NDUkVFTl9DT01QT05FTlRfTkFNRSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbXBvbmVudCBuYW1lIGZvciBhbiBpZCBzZWN0aW9uIHRoYXQgaG9sZHMgbW9kZWwgc3BlY2lmaWMgZWxlbWVudHMuXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQGNvbnN0YW50XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIE1PREVMX0NPTVBPTkVOVF9OQU1FOiBNT0RFTF9DT01QT05FTlRfTkFNRSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbXBvbmVudCBuYW1lIGZvciBhbiBpZCBzZWN0aW9uIHRoYXQgaG9sZHMgdmlldyBzcGVjaWZpYyBlbGVtZW50cy5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKiBAY29uc3RhbnRcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgVklFV19DT01QT05FTlRfTkFNRTogVklFV19DT01QT05FTlRfTkFNRSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbXBvbmVudCBuYW1lIGZvciBhbiBpZCBzZWN0aW9uIHRoYXQgaG9sZHMgY29udHJvbGxlciBzcGVjaWZpYyBlbGVtZW50cy5cclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKiBAY29uc3RhbnRcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgQ09OVFJPTExFUl9DT01QT05FTlRfTkFNRTogQ09OVFJPTExFUl9DT01QT05FTlRfTkFNRSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb21wb25lbnQgbmFtZSBmb3IgYSBzZWN0aW9uIHRoYXQgaG9sZHMgY29sb3JzXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQGNvbnN0YW50XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIENPTE9SU19DT01QT05FTlRfTkFNRTogQ09MT1JTX0NPTVBPTkVOVF9OQU1FLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbXBvbmVudCBuYW1lIGZvciBhIHNlY3Rpb24gdGhhdCBob2xkcyBzdHJpbmdzXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQGNvbnN0YW50XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIFNUUklOR1NfQ09NUE9ORU5UX05BTUU6IFNUUklOR1NfQ09NUE9ORU5UX05BTUUsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29tcG9uZW50IG5hbWUgZm9yIGEgZHluYW1pYyBlbGVtZW50IGFyY2hldHlwZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBBUkNIRVRZUEU6IEFSQ0hFVFlQRSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb21wb25lbnQgbmFtZSBzdWZmaXggZm9yIHRoZSBjb250YWluZXIgKHBhcmVudCkgb2YgYSBkeW5hbWljIGVsZW1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgYW4gJ18nIGluIGl0LlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBjb25zdGFudFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBDQVBTVUxFX1NVRkZJWDogQ0FQU1VMRV9TVUZGSVhcclxuICB9O1xyXG59ICkoKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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ZCxLQUFLLENBQUUvQixvQkFBcUIsQ0FBQyxDQUFDZ0QsR0FBRyxDQUFFSCxJQUFJLElBQUlBLElBQUksQ0FBQ0ksUUFBUSxDQUFFbEQsZUFBZ0IsQ0FBQyxHQUFHVyxTQUFTLEdBQUdtQyxJQUFLLENBQUM7VUFDOUhmLGFBQWEsQ0FBRUUsQ0FBQyxDQUFFLEdBQUdlLGdCQUFnQixDQUFDWCxJQUFJLENBQUVwQyxvQkFBcUIsQ0FBQztRQUNwRTtNQUNGO01BQ0EsT0FBTzhCLGFBQWEsQ0FBQ00sSUFBSSxDQUFFdEMsU0FBVSxDQUFDO0lBQ3hDLENBQUM7SUFFRDtJQUNBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQSxTQUFTLEVBQUVBLFNBQVM7SUFFcEI7SUFDQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSUMsZUFBZSxFQUFFQSxlQUFlO0lBRWhDO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQyxvQkFBb0IsRUFBRUEsb0JBQW9CO0lBRTFDO0lBQ0E7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0lDLHNCQUFzQixFQUFFQSxzQkFBc0I7SUFFOUM7SUFDQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSUMscUJBQXFCLEVBQUVBLHFCQUFxQjtJQUU1QztJQUNBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQywwQkFBMEIsRUFBRUEsMEJBQTBCO0lBRXREO0lBQ0E7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0lDLG9CQUFvQixFQUFFQSxvQkFBb0I7SUFFMUM7SUFDQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSUMsbUJBQW1CLEVBQUVBLG1CQUFtQjtJQUV4QztJQUNBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJRyx5QkFBeUIsRUFBRUEseUJBQXlCO0lBRXBEO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJRixxQkFBcUIsRUFBRUEscUJBQXFCO0lBRTVDO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQyxzQkFBc0IsRUFBRUEsc0JBQXNCO0lBRTlDO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJRyxTQUFTLEVBQUVBLFNBQVM7SUFFcEI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0lDLGNBQWMsRUFBRUE7RUFDbEIsQ0FBQztBQUNILENBQUMsRUFBRyxDQUFDIiwiaWdub3JlTGlzdCI6W119