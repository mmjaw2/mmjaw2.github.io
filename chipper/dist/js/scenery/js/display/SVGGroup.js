// Copyright 2014-2024, University of Colorado Boulder

/**
 * Poolable wrapper for SVG <group> elements. We store state and add listeners directly to the corresponding Node,
 * so that we can set dirty flags and smartly update only things that have changed. This takes a load off of SVGBlock.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import toSVGNumber from '../../../dot/js/toSVGNumber.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Poolable from '../../../phet-core/js/Poolable.js';
import { scenery, svgns } from '../imports.js';
let globalId = 1;
let clipGlobalId = 1;
class SVGGroup {
  /**
   * @mixes Poolable
   *
   * @param {SVGBlock} block
   * @param {Block} instance
   * @param {SVGGroup|null} parent
   */
  constructor(block, instance, parent) {
    // @public {string}
    this.id = `group${globalId++}`;
    this.initialize(block, instance, parent);
  }

  /**
   * @public
   *
   * @param {SVGBlock} block
   * @param {Block} instance
   * @param {SVGGroup|null} parent
   */
  initialize(block, instance, parent) {
    //OHTWO TODO: add collapsing groups! they can't have self drawables, transforms, filters, etc., and we probably shouldn't de-collapse groups https://github.com/phetsims/scenery/issues/1581

    sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`initializing ${this.toString()}`);

    // @public {SVGBlock|null} - Set to null when we're disposing, checked by other code.
    this.block = block;

    // @public {Instance|null} - Set to null when we're disposed.
    this.instance = instance;

    // @public {Node|null} - Set to null when we're disposed
    this.node = instance.trail.lastNode();

    // @public {SVGGroup|null}
    this.parent = parent;

    // @public {Array.<SVGGroup>}
    this.children = cleanArray(this.children);

    // @private {boolean}
    this.hasSelfDrawable = false;

    // @private {SVGSelfDrawable|null}
    this.selfDrawable = null;

    // @private {boolean} - general dirty flag (triggered on any other dirty event)
    this.dirty = true;

    // @private {boolean} - we won't listen for transform changes (or even want to set a transform) if our node is
    // beneath a transform root
    this.willApplyTransforms = this.block.transformRootInstance.trail.nodes.length < this.instance.trail.nodes.length;

    // @private {boolean} - we won't listen for filter changes (or set filters, like opacity or visibility) if our node
    // is beneath a filter root
    this.willApplyFilters = this.block.filterRootInstance.trail.nodes.length < this.instance.trail.nodes.length;

    // transform handling
    this.transformDirty = true;
    this.hasTransform = this.hasTransform !== undefined ? this.hasTransform : false; // persists across disposal
    this.transformDirtyListener = this.transformDirtyListener || this.markTransformDirty.bind(this);
    if (this.willApplyTransforms) {
      this.node.transformEmitter.addListener(this.transformDirtyListener);
    }

    // @private {boolean}
    this.filterDirty = true;
    this.visibilityDirty = true;
    this.clipDirty = true;

    // @private {SVGFilterElement|null} - lazily created
    this.filterElement = this.filterElement || null;

    // @private {boolean} - Whether we have an opacity attribute set on our SVG element (persists across disposal)
    this.hasOpacity = this.hasOpacity !== undefined ? this.hasOpacity : false;

    // @private {boolean} - Whether we have a filter element connected to our block (and that is being used with a filter
    // attribute). Since this needs to be cleaned up when we are disposed, this will be set to false when disposed
    // (with the associated attribute and defs reference cleaned up).
    this.hasFilter = false;
    this.clipDefinition = this.clipDefinition !== undefined ? this.clipDefinition : null; // persists across disposal
    this.clipPath = this.clipPath !== undefined ? this.clipPath : null; // persists across disposal
    this.filterChangeListener = this.filterChangeListener || this.onFilterChange.bind(this);
    this.visibilityDirtyListener = this.visibilityDirtyListener || this.onVisibleChange.bind(this);
    this.clipDirtyListener = this.clipDirtyListener || this.onClipChange.bind(this);
    this.node.visibleProperty.lazyLink(this.visibilityDirtyListener);
    if (this.willApplyFilters) {
      this.node.filterChangeEmitter.addListener(this.filterChangeListener);
    }
    //OHTWO TODO: remove clip workaround https://github.com/phetsims/scenery/issues/1581
    this.node.clipAreaProperty.lazyLink(this.clipDirtyListener);

    // for tracking the order of child groups, we use a flag and update (reorder) once per updateDisplay if necessary.
    this.orderDirty = true;
    this.orderDirtyListener = this.orderDirtyListener || this.markOrderDirty.bind(this);
    this.node.childrenChangedEmitter.addListener(this.orderDirtyListener);
    if (!this.svgGroup) {
      this.svgGroup = document.createElementNS(svgns, 'g');
    }
    this.instance.addSVGGroup(this);
    this.block.markDirtyGroup(this); // so we are marked and updated properly
  }

  /**
   * @private
   *
   * @param {SelfDrawable} drawable
   */
  addSelfDrawable(drawable) {
    this.selfDrawable = drawable;
    this.svgGroup.insertBefore(drawable.svgElement, this.children.length ? this.children[0].svgGroup : null);
    this.hasSelfDrawable = true;
  }

  /**
   * @private
   *
   * @param {SelfDrawable} drawable
   */
  removeSelfDrawable(drawable) {
    this.hasSelfDrawable = false;
    this.svgGroup.removeChild(drawable.svgElement);
    this.selfDrawable = null;
  }

  /**
   * @private
   *
   * @param {SVGGroup} group
   */
  addChildGroup(group) {
    this.markOrderDirty();
    group.parent = this;
    this.children.push(group);
    this.svgGroup.appendChild(group.svgGroup);
  }

  /**
   * @private
   *
   * @param {SVGGroup} group
   */
  removeChildGroup(group) {
    this.markOrderDirty();
    group.parent = null;
    this.children.splice(_.indexOf(this.children, group), 1);
    this.svgGroup.removeChild(group.svgGroup);
  }

  /**
   * @public
   */
  markDirty() {
    if (!this.dirty) {
      this.dirty = true;
      this.block.markDirtyGroup(this);
    }
  }

  /**
   * @public
   */
  markOrderDirty() {
    if (!this.orderDirty) {
      this.orderDirty = true;
      this.markDirty();
    }
  }

  /**
   * @public
   */
  markTransformDirty() {
    if (!this.transformDirty) {
      this.transformDirty = true;
      this.markDirty();
    }
  }

  /**
   * @private
   */
  onFilterChange() {
    if (!this.filterDirty) {
      this.filterDirty = true;
      this.markDirty();
    }
  }

  /**
   * @private
   */
  onVisibleChange() {
    if (!this.visibilityDirty) {
      this.visibilityDirty = true;
      this.markDirty();
    }
  }

  /**
   * @private
   */
  onClipChange() {
    if (!this.clipDirty) {
      this.clipDirty = true;
      this.markDirty();
    }
  }

  /**
   * @public
   */
  update() {
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`update: ${this.toString()}`);

    // we may have been disposed since being marked dirty on our block. we won't have a reference if we are disposed
    if (!this.block) {
      return;
    }
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.push();
    const svgGroup = this.svgGroup;
    this.dirty = false;
    if (this.transformDirty) {
      this.transformDirty = false;
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`transform update: ${this.toString()}`);
      if (this.willApplyTransforms) {
        const isIdentity = this.node.transform.isIdentity();
        if (!isIdentity) {
          this.hasTransform = true;
          svgGroup.setAttribute('transform', this.node.transform.getMatrix().getSVGTransform());
        } else if (this.hasTransform) {
          this.hasTransform = false;
          svgGroup.removeAttribute('transform');
        }
      } else {
        // we want no transforms if we won't be applying transforms
        if (this.hasTransform) {
          this.hasTransform = false;
          svgGroup.removeAttribute('transform');
        }
      }
    }
    if (this.visibilityDirty) {
      this.visibilityDirty = false;
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`visibility update: ${this.toString()}`);
      svgGroup.style.display = this.node.isVisible() ? '' : 'none';
    }

    // TODO: Check if we can leave opacity separate. If it gets applied "after" then we can have them separate https://github.com/phetsims/scenery/issues/1581
    if (this.filterDirty) {
      this.filterDirty = false;
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`filter update: ${this.toString()}`);
      const opacity = this.node.effectiveOpacity;
      if (this.willApplyFilters && opacity !== 1) {
        this.hasOpacity = true;
        svgGroup.setAttribute('opacity', opacity);
      } else if (this.hasOpacity) {
        this.hasOpacity = false;
        svgGroup.removeAttribute('opacity');
      }
      const needsFilter = this.willApplyFilters && this.node._filters.length;
      const filterId = `filter-${this.id}`;
      if (needsFilter) {
        // Lazy creation of the filter element (if we haven't already)
        if (!this.filterElement) {
          this.filterElement = document.createElementNS(svgns, 'filter');
          this.filterElement.setAttribute('id', filterId);
        }

        // Remove all children of the filter element if we're applying filters (if not, we won't have it attached)
        while (this.filterElement.firstChild) {
          this.filterElement.removeChild(this.filterElement.lastChild);
        }

        // Fill in elements into our filter
        let filterRegionPercentageIncrease = 50;
        let inName = 'SourceGraphic';
        const length = this.node._filters.length;
        for (let i = 0; i < length; i++) {
          const filter = this.node._filters[i];
          const resultName = i === length - 1 ? undefined : `e${i}`; // Last result should be undefined
          filter.applySVGFilter(this.filterElement, inName, resultName);
          filterRegionPercentageIncrease += filter.filterRegionPercentageIncrease;
          inName = resultName;
        }

        // Bleh, no good way to handle the filter region? https://drafts.fxtf.org/filter-effects/#filter-region
        // If we WANT to track things by their actual display size AND pad pixels, AND copy tons of things... we could
        // potentially use the userSpaceOnUse and pad the proper number of pixels. That sounds like an absolute pain, AND
        // a performance drain and abstraction break.
        const min = `-${toSVGNumber(filterRegionPercentageIncrease)}%`;
        const size = `${toSVGNumber(2 * filterRegionPercentageIncrease + 100)}%`;
        this.filterElement.setAttribute('x', min);
        this.filterElement.setAttribute('y', min);
        this.filterElement.setAttribute('width', size);
        this.filterElement.setAttribute('height', size);
      }
      if (needsFilter) {
        if (!this.hasFilter) {
          this.block.defs.appendChild(this.filterElement);
        }
        svgGroup.setAttribute('filter', `url(#${filterId})`);
        this.hasFilter = true;
      }
      if (this.hasFilter && !needsFilter) {
        svgGroup.removeAttribute('filter');
        this.hasFilter = false;
        this.block.defs.removeChild(this.filterElement);
      }
    }
    if (this.clipDirty) {
      this.clipDirty = false;
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`clip update: ${this.toString()}`);

      //OHTWO TODO: remove clip workaround (use this.willApplyFilters) https://github.com/phetsims/scenery/issues/1581
      if (this.node.clipArea) {
        if (!this.clipDefinition) {
          // Use monotonically-increasing and unique clip IDs, see https://github.com/phetsims/faradays-electromagnetic-lab/issues/89
          // There is no connection necessarily to the node, especially, since we can have different SVG representations
          // of a node, AND we pool the SVGGroups.
          const clipId = `clip${clipGlobalId++}`;
          this.clipDefinition = document.createElementNS(svgns, 'clipPath');
          this.clipDefinition.setAttribute('id', clipId);
          this.clipDefinition.setAttribute('clipPathUnits', 'userSpaceOnUse');
          this.block.defs.appendChild(this.clipDefinition); // TODO: method? evaluate with future usage of defs (not done yet) https://github.com/phetsims/scenery/issues/1581

          this.clipPath = document.createElementNS(svgns, 'path');
          this.clipDefinition.appendChild(this.clipPath);
          svgGroup.setAttribute('clip-path', `url(#${clipId})`);
        }
        this.clipPath.setAttribute('d', this.node.clipArea.getSVGPath());
      } else if (this.clipDefinition) {
        svgGroup.removeAttribute('clip-path');
        this.block.defs.removeChild(this.clipDefinition); // TODO: method? evaluate with future usage of defs (not done yet) https://github.com/phetsims/scenery/issues/1581

        // TODO: consider pooling these? https://github.com/phetsims/scenery/issues/1581
        this.clipDefinition = null;
        this.clipPath = null;
      }
    }
    if (this.orderDirty) {
      this.orderDirty = false;
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`order update: ${this.toString()}`);
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.push();

      // our instance should have the proper order of children. we check that way.
      let idx = this.children.length - 1;
      const instanceChildren = this.instance.children;
      // iterate backwards, since DOM's insertBefore makes forward iteration more complicated (no insertAfter)
      for (let i = instanceChildren.length - 1; i >= 0; i--) {
        const group = instanceChildren[i].lookupSVGGroup(this.block);
        if (group) {
          // ensure that the spot in our array (and in the DOM) at [idx] is correct
          if (this.children[idx] !== group) {
            // out of order, rearrange
            sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`group out of order: ${idx} for ${group.toString()}`);

            // in the DOM first (since we reference the children array to know what to insertBefore)
            // see http://stackoverflow.com/questions/9732624/how-to-swap-dom-child-nodes-in-javascript
            svgGroup.insertBefore(group.svgGroup, idx + 1 >= this.children.length ? null : this.children[idx + 1].svgGroup);

            // then in our children array
            const oldIndex = _.indexOf(this.children, group);
            assert && assert(oldIndex < idx, 'The item we are moving backwards to location [idx] should not have an index greater than that');
            this.children.splice(oldIndex, 1);
            this.children.splice(idx, 0, group);
          } else {
            sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`group in place: ${idx} for ${group.toString()}`);
          }

          // if there was a group for that instance, we move on to the next spot
          idx--;
        }
      }
      sceneryLog && sceneryLog.SVGGroup && sceneryLog.pop();
    }
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.pop();
  }

  /**
   * @private
   *
   * @returns {boolean}
   */
  isReleasable() {
    // if we have no parent, we are the rootGroup (the block is responsible for disposing that one)
    return !this.hasSelfDrawable && !this.children.length && this.parent;
  }

  /**
   * Releases references
   * @public
   */
  dispose() {
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.SVGGroup(`dispose ${this.toString()}`);
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.push();
    assert && assert(this.children.length === 0, 'Should be empty by now');
    if (this.hasFilter) {
      this.svgGroup.removeAttribute('filter');
      this.hasFilter = false;
      this.block.defs.removeChild(this.filterElement);
    }
    if (this.willApplyTransforms) {
      this.node.transformEmitter.removeListener(this.transformDirtyListener);
    }
    this.node.visibleProperty.unlink(this.visibilityDirtyListener);
    if (this.willApplyFilters) {
      this.node.filterChangeEmitter.removeListener(this.filterChangeListener);
    }
    //OHTWO TODO: remove clip workaround https://github.com/phetsims/scenery/issues/1581
    this.node.clipAreaProperty.unlink(this.clipDirtyListener);
    this.node.childrenChangedEmitter.removeListener(this.orderDirtyListener);

    // if our Instance has been disposed, it has already had the reference removed
    if (this.instance.active) {
      this.instance.removeSVGGroup(this);
    }

    // remove clipping, since it is defs-based (and we want to keep our defs block clean - could be another layer!)
    if (this.clipDefinition) {
      this.svgGroup.removeAttribute('clip-path');
      this.block.defs.removeChild(this.clipDefinition);
      this.clipDefinition = null;
      this.clipPath = null;
    }

    // clear references
    this.parent = null;
    this.block = null;
    this.instance = null;
    this.node = null;
    cleanArray(this.children);
    this.selfDrawable = null;

    // for now
    this.freeToPool();
    sceneryLog && sceneryLog.SVGGroup && sceneryLog.pop();
  }

  /**
   * Returns a string form of this object
   * @public
   *
   * @returns {string}
   */
  toString() {
    return `SVGGroup:${this.block.toString()}_${this.instance.toString()}`;
  }

  /**
   * @public
   *
   * @param {SVGBlock} block
   * @param {Drawable} drawable
   */
  static addDrawable(block, drawable) {
    assert && assert(drawable.instance, 'Instance is required for a drawable to be grouped correctly in SVG');
    const group = SVGGroup.ensureGroupsToInstance(block, drawable.instance);
    group.addSelfDrawable(drawable);
  }

  /**
   * @public
   *
   * @param {SVGBlock} block
   * @param {Drawable} drawable
   */
  static removeDrawable(block, drawable) {
    drawable.instance.lookupSVGGroup(block).removeSelfDrawable(drawable);
    SVGGroup.releaseGroupsToInstance(block, drawable.instance);
  }

  /**
   * @private
   *
   * @param {SVGBlock} block
   * @param {Instance} instance
   * @returns {SVGGroup}
   */
  static ensureGroupsToInstance(block, instance) {
    // TODO: assertions here https://github.com/phetsims/scenery/issues/1581

    let group = instance.lookupSVGGroup(block);
    if (!group) {
      assert && assert(instance !== block.rootGroup.instance, 'Making sure we do not walk past our rootGroup');
      const parentGroup = SVGGroup.ensureGroupsToInstance(block, instance.parent);
      group = SVGGroup.createFromPool(block, instance, parentGroup);
      parentGroup.addChildGroup(group);
    }
    return group;
  }

  /**
   * @private
   *
   * @param {SVGBlock} block
   * @param {Instance} instance
   */
  static releaseGroupsToInstance(block, instance) {
    const group = instance.lookupSVGGroup(block);
    if (group.isReleasable()) {
      const parentGroup = group.parent;
      parentGroup.removeChildGroup(group);
      SVGGroup.releaseGroupsToInstance(block, parentGroup.instance);
      group.dispose();
    }
  }
}
scenery.register('SVGGroup', SVGGroup);
Poolable.mixInto(SVGGroup);
export default SVGGroup;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1NWR051bWJlciIsImNsZWFuQXJyYXkiLCJQb29sYWJsZSIsInNjZW5lcnkiLCJzdmducyIsImdsb2JhbElkIiwiY2xpcEdsb2JhbElkIiwiU1ZHR3JvdXAiLCJjb25zdHJ1Y3RvciIsImJsb2NrIiwiaW5zdGFuY2UiLCJwYXJlbnQiLCJpZCIsImluaXRpYWxpemUiLCJzY2VuZXJ5TG9nIiwidG9TdHJpbmciLCJub2RlIiwidHJhaWwiLCJsYXN0Tm9kZSIsImNoaWxkcmVuIiwiaGFzU2VsZkRyYXdhYmxlIiwic2VsZkRyYXdhYmxlIiwiZGlydHkiLCJ3aWxsQXBwbHlUcmFuc2Zvcm1zIiwidHJhbnNmb3JtUm9vdEluc3RhbmNlIiwibm9kZXMiLCJsZW5ndGgiLCJ3aWxsQXBwbHlGaWx0ZXJzIiwiZmlsdGVyUm9vdEluc3RhbmNlIiwidHJhbnNmb3JtRGlydHkiLCJoYXNUcmFuc2Zvcm0iLCJ1bmRlZmluZWQiLCJ0cmFuc2Zvcm1EaXJ0eUxpc3RlbmVyIiwibWFya1RyYW5zZm9ybURpcnR5IiwiYmluZCIsInRyYW5zZm9ybUVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsImZpbHRlckRpcnR5IiwidmlzaWJpbGl0eURpcnR5IiwiY2xpcERpcnR5IiwiZmlsdGVyRWxlbWVudCIsImhhc09wYWNpdHkiLCJoYXNGaWx0ZXIiLCJjbGlwRGVmaW5pdGlvbiIsImNsaXBQYXRoIiwiZmlsdGVyQ2hhbmdlTGlzdGVuZXIiLCJvbkZpbHRlckNoYW5nZSIsInZpc2liaWxpdHlEaXJ0eUxpc3RlbmVyIiwib25WaXNpYmxlQ2hhbmdlIiwiY2xpcERpcnR5TGlzdGVuZXIiLCJvbkNsaXBDaGFuZ2UiLCJ2aXNpYmxlUHJvcGVydHkiLCJsYXp5TGluayIsImZpbHRlckNoYW5nZUVtaXR0ZXIiLCJjbGlwQXJlYVByb3BlcnR5Iiwib3JkZXJEaXJ0eSIsIm9yZGVyRGlydHlMaXN0ZW5lciIsIm1hcmtPcmRlckRpcnR5IiwiY2hpbGRyZW5DaGFuZ2VkRW1pdHRlciIsInN2Z0dyb3VwIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJhZGRTVkdHcm91cCIsIm1hcmtEaXJ0eUdyb3VwIiwiYWRkU2VsZkRyYXdhYmxlIiwiZHJhd2FibGUiLCJpbnNlcnRCZWZvcmUiLCJzdmdFbGVtZW50IiwicmVtb3ZlU2VsZkRyYXdhYmxlIiwicmVtb3ZlQ2hpbGQiLCJhZGRDaGlsZEdyb3VwIiwiZ3JvdXAiLCJwdXNoIiwiYXBwZW5kQ2hpbGQiLCJyZW1vdmVDaGlsZEdyb3VwIiwic3BsaWNlIiwiXyIsImluZGV4T2YiLCJtYXJrRGlydHkiLCJ1cGRhdGUiLCJpc0lkZW50aXR5IiwidHJhbnNmb3JtIiwic2V0QXR0cmlidXRlIiwiZ2V0TWF0cml4IiwiZ2V0U1ZHVHJhbnNmb3JtIiwicmVtb3ZlQXR0cmlidXRlIiwic3R5bGUiLCJkaXNwbGF5IiwiaXNWaXNpYmxlIiwib3BhY2l0eSIsImVmZmVjdGl2ZU9wYWNpdHkiLCJuZWVkc0ZpbHRlciIsIl9maWx0ZXJzIiwiZmlsdGVySWQiLCJmaXJzdENoaWxkIiwibGFzdENoaWxkIiwiZmlsdGVyUmVnaW9uUGVyY2VudGFnZUluY3JlYXNlIiwiaW5OYW1lIiwiaSIsImZpbHRlciIsInJlc3VsdE5hbWUiLCJhcHBseVNWR0ZpbHRlciIsIm1pbiIsInNpemUiLCJkZWZzIiwiY2xpcEFyZWEiLCJjbGlwSWQiLCJnZXRTVkdQYXRoIiwiaWR4IiwiaW5zdGFuY2VDaGlsZHJlbiIsImxvb2t1cFNWR0dyb3VwIiwib2xkSW5kZXgiLCJhc3NlcnQiLCJwb3AiLCJpc1JlbGVhc2FibGUiLCJkaXNwb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJ1bmxpbmsiLCJhY3RpdmUiLCJyZW1vdmVTVkdHcm91cCIsImZyZWVUb1Bvb2wiLCJhZGREcmF3YWJsZSIsImVuc3VyZUdyb3Vwc1RvSW5zdGFuY2UiLCJyZW1vdmVEcmF3YWJsZSIsInJlbGVhc2VHcm91cHNUb0luc3RhbmNlIiwicm9vdEdyb3VwIiwicGFyZW50R3JvdXAiLCJjcmVhdGVGcm9tUG9vbCIsInJlZ2lzdGVyIiwibWl4SW50byJdLCJzb3VyY2VzIjpbIlNWR0dyb3VwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFBvb2xhYmxlIHdyYXBwZXIgZm9yIFNWRyA8Z3JvdXA+IGVsZW1lbnRzLiBXZSBzdG9yZSBzdGF0ZSBhbmQgYWRkIGxpc3RlbmVycyBkaXJlY3RseSB0byB0aGUgY29ycmVzcG9uZGluZyBOb2RlLFxyXG4gKiBzbyB0aGF0IHdlIGNhbiBzZXQgZGlydHkgZmxhZ3MgYW5kIHNtYXJ0bHkgdXBkYXRlIG9ubHkgdGhpbmdzIHRoYXQgaGF2ZSBjaGFuZ2VkLiBUaGlzIHRha2VzIGEgbG9hZCBvZmYgb2YgU1ZHQmxvY2suXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgdG9TVkdOdW1iZXIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL3RvU1ZHTnVtYmVyLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgUG9vbGFibGUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2xhYmxlLmpzJztcclxuaW1wb3J0IHsgc2NlbmVyeSwgc3ZnbnMgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmxldCBnbG9iYWxJZCA9IDE7XHJcbmxldCBjbGlwR2xvYmFsSWQgPSAxO1xyXG5cclxuY2xhc3MgU1ZHR3JvdXAge1xyXG4gIC8qKlxyXG4gICAqIEBtaXhlcyBQb29sYWJsZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTVkdCbG9ja30gYmxvY2tcclxuICAgKiBAcGFyYW0ge0Jsb2NrfSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7U1ZHR3JvdXB8bnVsbH0gcGFyZW50XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIGJsb2NrLCBpbnN0YW5jZSwgcGFyZW50ICkge1xyXG4gICAgLy8gQHB1YmxpYyB7c3RyaW5nfVxyXG4gICAgdGhpcy5pZCA9IGBncm91cCR7Z2xvYmFsSWQrK31gO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZSggYmxvY2ssIGluc3RhbmNlLCBwYXJlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U1ZHQmxvY2t9IGJsb2NrXHJcbiAgICogQHBhcmFtIHtCbG9ja30gaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge1NWR0dyb3VwfG51bGx9IHBhcmVudFxyXG4gICAqL1xyXG4gIGluaXRpYWxpemUoIGJsb2NrLCBpbnN0YW5jZSwgcGFyZW50ICkge1xyXG4gICAgLy9PSFRXTyBUT0RPOiBhZGQgY29sbGFwc2luZyBncm91cHMhIHRoZXkgY2FuJ3QgaGF2ZSBzZWxmIGRyYXdhYmxlcywgdHJhbnNmb3JtcywgZmlsdGVycywgZXRjLiwgYW5kIHdlIHByb2JhYmx5IHNob3VsZG4ndCBkZS1jb2xsYXBzZSBncm91cHMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCggYGluaXRpYWxpemluZyAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7U1ZHQmxvY2t8bnVsbH0gLSBTZXQgdG8gbnVsbCB3aGVuIHdlJ3JlIGRpc3Bvc2luZywgY2hlY2tlZCBieSBvdGhlciBjb2RlLlxyXG4gICAgdGhpcy5ibG9jayA9IGJsb2NrO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0luc3RhbmNlfG51bGx9IC0gU2V0IHRvIG51bGwgd2hlbiB3ZSdyZSBkaXNwb3NlZC5cclxuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtOb2RlfG51bGx9IC0gU2V0IHRvIG51bGwgd2hlbiB3ZSdyZSBkaXNwb3NlZFxyXG4gICAgdGhpcy5ub2RlID0gaW5zdGFuY2UudHJhaWwubGFzdE5vZGUoKTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtTVkdHcm91cHxudWxsfVxyXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7QXJyYXkuPFNWR0dyb3VwPn1cclxuICAgIHRoaXMuY2hpbGRyZW4gPSBjbGVhbkFycmF5KCB0aGlzLmNoaWxkcmVuICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59XHJcbiAgICB0aGlzLmhhc1NlbGZEcmF3YWJsZSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtTVkdTZWxmRHJhd2FibGV8bnVsbH1cclxuICAgIHRoaXMuc2VsZkRyYXdhYmxlID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSBnZW5lcmFsIGRpcnR5IGZsYWcgKHRyaWdnZXJlZCBvbiBhbnkgb3RoZXIgZGlydHkgZXZlbnQpXHJcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSB3ZSB3b24ndCBsaXN0ZW4gZm9yIHRyYW5zZm9ybSBjaGFuZ2VzIChvciBldmVuIHdhbnQgdG8gc2V0IGEgdHJhbnNmb3JtKSBpZiBvdXIgbm9kZSBpc1xyXG4gICAgLy8gYmVuZWF0aCBhIHRyYW5zZm9ybSByb290XHJcbiAgICB0aGlzLndpbGxBcHBseVRyYW5zZm9ybXMgPSB0aGlzLmJsb2NrLnRyYW5zZm9ybVJvb3RJbnN0YW5jZS50cmFpbC5ub2Rlcy5sZW5ndGggPCB0aGlzLmluc3RhbmNlLnRyYWlsLm5vZGVzLmxlbmd0aDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSB3ZSB3b24ndCBsaXN0ZW4gZm9yIGZpbHRlciBjaGFuZ2VzIChvciBzZXQgZmlsdGVycywgbGlrZSBvcGFjaXR5IG9yIHZpc2liaWxpdHkpIGlmIG91ciBub2RlXHJcbiAgICAvLyBpcyBiZW5lYXRoIGEgZmlsdGVyIHJvb3RcclxuICAgIHRoaXMud2lsbEFwcGx5RmlsdGVycyA9IHRoaXMuYmxvY2suZmlsdGVyUm9vdEluc3RhbmNlLnRyYWlsLm5vZGVzLmxlbmd0aCA8IHRoaXMuaW5zdGFuY2UudHJhaWwubm9kZXMubGVuZ3RoO1xyXG5cclxuICAgIC8vIHRyYW5zZm9ybSBoYW5kbGluZ1xyXG4gICAgdGhpcy50cmFuc2Zvcm1EaXJ0eSA9IHRydWU7XHJcbiAgICB0aGlzLmhhc1RyYW5zZm9ybSA9IHRoaXMuaGFzVHJhbnNmb3JtICE9PSB1bmRlZmluZWQgPyB0aGlzLmhhc1RyYW5zZm9ybSA6IGZhbHNlOyAvLyBwZXJzaXN0cyBhY3Jvc3MgZGlzcG9zYWxcclxuICAgIHRoaXMudHJhbnNmb3JtRGlydHlMaXN0ZW5lciA9IHRoaXMudHJhbnNmb3JtRGlydHlMaXN0ZW5lciB8fCB0aGlzLm1hcmtUcmFuc2Zvcm1EaXJ0eS5iaW5kKCB0aGlzICk7XHJcbiAgICBpZiAoIHRoaXMud2lsbEFwcGx5VHJhbnNmb3JtcyApIHtcclxuICAgICAgdGhpcy5ub2RlLnRyYW5zZm9ybUVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtRGlydHlMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEBwcml2YXRlIHtib29sZWFufVxyXG4gICAgdGhpcy5maWx0ZXJEaXJ0eSA9IHRydWU7XHJcbiAgICB0aGlzLnZpc2liaWxpdHlEaXJ0eSA9IHRydWU7XHJcbiAgICB0aGlzLmNsaXBEaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge1NWR0ZpbHRlckVsZW1lbnR8bnVsbH0gLSBsYXppbHkgY3JlYXRlZFxyXG4gICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gdGhpcy5maWx0ZXJFbGVtZW50IHx8IG51bGw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gV2hldGhlciB3ZSBoYXZlIGFuIG9wYWNpdHkgYXR0cmlidXRlIHNldCBvbiBvdXIgU1ZHIGVsZW1lbnQgKHBlcnNpc3RzIGFjcm9zcyBkaXNwb3NhbClcclxuICAgIHRoaXMuaGFzT3BhY2l0eSA9IHRoaXMuaGFzT3BhY2l0eSAhPT0gdW5kZWZpbmVkID8gdGhpcy5oYXNPcGFjaXR5IDogZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gV2hldGhlciB3ZSBoYXZlIGEgZmlsdGVyIGVsZW1lbnQgY29ubmVjdGVkIHRvIG91ciBibG9jayAoYW5kIHRoYXQgaXMgYmVpbmcgdXNlZCB3aXRoIGEgZmlsdGVyXHJcbiAgICAvLyBhdHRyaWJ1dGUpLiBTaW5jZSB0aGlzIG5lZWRzIHRvIGJlIGNsZWFuZWQgdXAgd2hlbiB3ZSBhcmUgZGlzcG9zZWQsIHRoaXMgd2lsbCBiZSBzZXQgdG8gZmFsc2Ugd2hlbiBkaXNwb3NlZFxyXG4gICAgLy8gKHdpdGggdGhlIGFzc29jaWF0ZWQgYXR0cmlidXRlIGFuZCBkZWZzIHJlZmVyZW5jZSBjbGVhbmVkIHVwKS5cclxuICAgIHRoaXMuaGFzRmlsdGVyID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5jbGlwRGVmaW5pdGlvbiA9IHRoaXMuY2xpcERlZmluaXRpb24gIT09IHVuZGVmaW5lZCA/IHRoaXMuY2xpcERlZmluaXRpb24gOiBudWxsOyAvLyBwZXJzaXN0cyBhY3Jvc3MgZGlzcG9zYWxcclxuICAgIHRoaXMuY2xpcFBhdGggPSB0aGlzLmNsaXBQYXRoICE9PSB1bmRlZmluZWQgPyB0aGlzLmNsaXBQYXRoIDogbnVsbDsgLy8gcGVyc2lzdHMgYWNyb3NzIGRpc3Bvc2FsXHJcbiAgICB0aGlzLmZpbHRlckNoYW5nZUxpc3RlbmVyID0gdGhpcy5maWx0ZXJDaGFuZ2VMaXN0ZW5lciB8fCB0aGlzLm9uRmlsdGVyQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMudmlzaWJpbGl0eURpcnR5TGlzdGVuZXIgPSB0aGlzLnZpc2liaWxpdHlEaXJ0eUxpc3RlbmVyIHx8IHRoaXMub25WaXNpYmxlQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuY2xpcERpcnR5TGlzdGVuZXIgPSB0aGlzLmNsaXBEaXJ0eUxpc3RlbmVyIHx8IHRoaXMub25DbGlwQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMubm9kZS52aXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMudmlzaWJpbGl0eURpcnR5TGlzdGVuZXIgKTtcclxuICAgIGlmICggdGhpcy53aWxsQXBwbHlGaWx0ZXJzICkge1xyXG4gICAgICB0aGlzLm5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5maWx0ZXJDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgLy9PSFRXTyBUT0RPOiByZW1vdmUgY2xpcCB3b3JrYXJvdW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLm5vZGUuY2xpcEFyZWFQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5jbGlwRGlydHlMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIGZvciB0cmFja2luZyB0aGUgb3JkZXIgb2YgY2hpbGQgZ3JvdXBzLCB3ZSB1c2UgYSBmbGFnIGFuZCB1cGRhdGUgKHJlb3JkZXIpIG9uY2UgcGVyIHVwZGF0ZURpc3BsYXkgaWYgbmVjZXNzYXJ5LlxyXG4gICAgdGhpcy5vcmRlckRpcnR5ID0gdHJ1ZTtcclxuICAgIHRoaXMub3JkZXJEaXJ0eUxpc3RlbmVyID0gdGhpcy5vcmRlckRpcnR5TGlzdGVuZXIgfHwgdGhpcy5tYXJrT3JkZXJEaXJ0eS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLm5vZGUuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5vcmRlckRpcnR5TGlzdGVuZXIgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLnN2Z0dyb3VwICkge1xyXG4gICAgICB0aGlzLnN2Z0dyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ2cnICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pbnN0YW5jZS5hZGRTVkdHcm91cCggdGhpcyApO1xyXG5cclxuICAgIHRoaXMuYmxvY2subWFya0RpcnR5R3JvdXAoIHRoaXMgKTsgLy8gc28gd2UgYXJlIG1hcmtlZCBhbmQgdXBkYXRlZCBwcm9wZXJseVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2VsZkRyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIGFkZFNlbGZEcmF3YWJsZSggZHJhd2FibGUgKSB7XHJcbiAgICB0aGlzLnNlbGZEcmF3YWJsZSA9IGRyYXdhYmxlO1xyXG4gICAgdGhpcy5zdmdHcm91cC5pbnNlcnRCZWZvcmUoIGRyYXdhYmxlLnN2Z0VsZW1lbnQsIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID8gdGhpcy5jaGlsZHJlblsgMCBdLnN2Z0dyb3VwIDogbnVsbCApO1xyXG4gICAgdGhpcy5oYXNTZWxmRHJhd2FibGUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2VsZkRyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHJlbW92ZVNlbGZEcmF3YWJsZSggZHJhd2FibGUgKSB7XHJcbiAgICB0aGlzLmhhc1NlbGZEcmF3YWJsZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdmdHcm91cC5yZW1vdmVDaGlsZCggZHJhd2FibGUuc3ZnRWxlbWVudCApO1xyXG4gICAgdGhpcy5zZWxmRHJhd2FibGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U1ZHR3JvdXB9IGdyb3VwXHJcbiAgICovXHJcbiAgYWRkQ2hpbGRHcm91cCggZ3JvdXAgKSB7XHJcbiAgICB0aGlzLm1hcmtPcmRlckRpcnR5KCk7XHJcblxyXG4gICAgZ3JvdXAucGFyZW50ID0gdGhpcztcclxuICAgIHRoaXMuY2hpbGRyZW4ucHVzaCggZ3JvdXAgKTtcclxuICAgIHRoaXMuc3ZnR3JvdXAuYXBwZW5kQ2hpbGQoIGdyb3VwLnN2Z0dyb3VwICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTVkdHcm91cH0gZ3JvdXBcclxuICAgKi9cclxuICByZW1vdmVDaGlsZEdyb3VwKCBncm91cCApIHtcclxuICAgIHRoaXMubWFya09yZGVyRGlydHkoKTtcclxuXHJcbiAgICBncm91cC5wYXJlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoIF8uaW5kZXhPZiggdGhpcy5jaGlsZHJlbiwgZ3JvdXAgKSwgMSApO1xyXG4gICAgdGhpcy5zdmdHcm91cC5yZW1vdmVDaGlsZCggZ3JvdXAuc3ZnR3JvdXAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBtYXJrRGlydHkoKSB7XHJcbiAgICBpZiAoICF0aGlzLmRpcnR5ICkge1xyXG4gICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICAgIHRoaXMuYmxvY2subWFya0RpcnR5R3JvdXAoIHRoaXMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBtYXJrT3JkZXJEaXJ0eSgpIHtcclxuICAgIGlmICggIXRoaXMub3JkZXJEaXJ0eSApIHtcclxuICAgICAgdGhpcy5vcmRlckRpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBtYXJrVHJhbnNmb3JtRGlydHkoKSB7XHJcbiAgICBpZiAoICF0aGlzLnRyYW5zZm9ybURpcnR5ICkge1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgb25GaWx0ZXJDaGFuZ2UoKSB7XHJcbiAgICBpZiAoICF0aGlzLmZpbHRlckRpcnR5ICkge1xyXG4gICAgICB0aGlzLmZpbHRlckRpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgb25WaXNpYmxlQ2hhbmdlKCkge1xyXG4gICAgaWYgKCAhdGhpcy52aXNpYmlsaXR5RGlydHkgKSB7XHJcbiAgICAgIHRoaXMudmlzaWJpbGl0eURpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgb25DbGlwQ2hhbmdlKCkge1xyXG4gICAgaWYgKCAhdGhpcy5jbGlwRGlydHkgKSB7XHJcbiAgICAgIHRoaXMuY2xpcERpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICB1cGRhdGUoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCggYHVwZGF0ZTogJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIC8vIHdlIG1heSBoYXZlIGJlZW4gZGlzcG9zZWQgc2luY2UgYmVpbmcgbWFya2VkIGRpcnR5IG9uIG91ciBibG9jay4gd2Ugd29uJ3QgaGF2ZSBhIHJlZmVyZW5jZSBpZiB3ZSBhcmUgZGlzcG9zZWRcclxuICAgIGlmICggIXRoaXMuYmxvY2sgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgY29uc3Qgc3ZnR3JvdXAgPSB0aGlzLnN2Z0dyb3VwO1xyXG5cclxuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoIHRoaXMudHJhbnNmb3JtRGlydHkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwKCBgdHJhbnNmb3JtIHVwZGF0ZTogJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLndpbGxBcHBseVRyYW5zZm9ybXMgKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGlzSWRlbnRpdHkgPSB0aGlzLm5vZGUudHJhbnNmb3JtLmlzSWRlbnRpdHkoKTtcclxuXHJcbiAgICAgICAgaWYgKCAhaXNJZGVudGl0eSApIHtcclxuICAgICAgICAgIHRoaXMuaGFzVHJhbnNmb3JtID0gdHJ1ZTtcclxuICAgICAgICAgIHN2Z0dyb3VwLnNldEF0dHJpYnV0ZSggJ3RyYW5zZm9ybScsIHRoaXMubm9kZS50cmFuc2Zvcm0uZ2V0TWF0cml4KCkuZ2V0U1ZHVHJhbnNmb3JtKCkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaGFzVHJhbnNmb3JtICkge1xyXG4gICAgICAgICAgdGhpcy5oYXNUcmFuc2Zvcm0gPSBmYWxzZTtcclxuICAgICAgICAgIHN2Z0dyb3VwLnJlbW92ZUF0dHJpYnV0ZSggJ3RyYW5zZm9ybScgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gd2Ugd2FudCBubyB0cmFuc2Zvcm1zIGlmIHdlIHdvbid0IGJlIGFwcGx5aW5nIHRyYW5zZm9ybXNcclxuICAgICAgICBpZiAoIHRoaXMuaGFzVHJhbnNmb3JtICkge1xyXG4gICAgICAgICAgdGhpcy5oYXNUcmFuc2Zvcm0gPSBmYWxzZTtcclxuICAgICAgICAgIHN2Z0dyb3VwLnJlbW92ZUF0dHJpYnV0ZSggJ3RyYW5zZm9ybScgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMudmlzaWJpbGl0eURpcnR5ICkge1xyXG4gICAgICB0aGlzLnZpc2liaWxpdHlEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAoIGB2aXNpYmlsaXR5IHVwZGF0ZTogJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgc3ZnR3JvdXAuc3R5bGUuZGlzcGxheSA9IHRoaXMubm9kZS5pc1Zpc2libGUoKSA/ICcnIDogJ25vbmUnO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IENoZWNrIGlmIHdlIGNhbiBsZWF2ZSBvcGFjaXR5IHNlcGFyYXRlLiBJZiBpdCBnZXRzIGFwcGxpZWQgXCJhZnRlclwiIHRoZW4gd2UgY2FuIGhhdmUgdGhlbSBzZXBhcmF0ZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgaWYgKCB0aGlzLmZpbHRlckRpcnR5ICkge1xyXG4gICAgICB0aGlzLmZpbHRlckRpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCggYGZpbHRlciB1cGRhdGU6ICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAgIGNvbnN0IG9wYWNpdHkgPSB0aGlzLm5vZGUuZWZmZWN0aXZlT3BhY2l0eTtcclxuICAgICAgaWYgKCB0aGlzLndpbGxBcHBseUZpbHRlcnMgJiYgb3BhY2l0eSAhPT0gMSApIHtcclxuICAgICAgICB0aGlzLmhhc09wYWNpdHkgPSB0cnVlO1xyXG4gICAgICAgIHN2Z0dyb3VwLnNldEF0dHJpYnV0ZSggJ29wYWNpdHknLCBvcGFjaXR5ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuaGFzT3BhY2l0eSApIHtcclxuICAgICAgICB0aGlzLmhhc09wYWNpdHkgPSBmYWxzZTtcclxuICAgICAgICBzdmdHcm91cC5yZW1vdmVBdHRyaWJ1dGUoICdvcGFjaXR5JyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBuZWVkc0ZpbHRlciA9IHRoaXMud2lsbEFwcGx5RmlsdGVycyAmJiB0aGlzLm5vZGUuX2ZpbHRlcnMubGVuZ3RoO1xyXG4gICAgICBjb25zdCBmaWx0ZXJJZCA9IGBmaWx0ZXItJHt0aGlzLmlkfWA7XHJcblxyXG4gICAgICBpZiAoIG5lZWRzRmlsdGVyICkge1xyXG4gICAgICAgIC8vIExhenkgY3JlYXRpb24gb2YgdGhlIGZpbHRlciBlbGVtZW50IChpZiB3ZSBoYXZlbid0IGFscmVhZHkpXHJcbiAgICAgICAgaWYgKCAhdGhpcy5maWx0ZXJFbGVtZW50ICkge1xyXG4gICAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ2ZpbHRlcicgKTtcclxuICAgICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudC5zZXRBdHRyaWJ1dGUoICdpZCcsIGZpbHRlcklkICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIHRoZSBmaWx0ZXIgZWxlbWVudCBpZiB3ZSdyZSBhcHBseWluZyBmaWx0ZXJzIChpZiBub3QsIHdlIHdvbid0IGhhdmUgaXQgYXR0YWNoZWQpXHJcbiAgICAgICAgd2hpbGUgKCB0aGlzLmZpbHRlckVsZW1lbnQuZmlyc3RDaGlsZCApIHtcclxuICAgICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudC5yZW1vdmVDaGlsZCggdGhpcy5maWx0ZXJFbGVtZW50Lmxhc3RDaGlsZCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRmlsbCBpbiBlbGVtZW50cyBpbnRvIG91ciBmaWx0ZXJcclxuICAgICAgICBsZXQgZmlsdGVyUmVnaW9uUGVyY2VudGFnZUluY3JlYXNlID0gNTA7XHJcbiAgICAgICAgbGV0IGluTmFtZSA9ICdTb3VyY2VHcmFwaGljJztcclxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLm5vZGUuX2ZpbHRlcnMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5ub2RlLl9maWx0ZXJzWyBpIF07XHJcblxyXG4gICAgICAgICAgY29uc3QgcmVzdWx0TmFtZSA9IGkgPT09IGxlbmd0aCAtIDEgPyB1bmRlZmluZWQgOiBgZSR7aX1gOyAvLyBMYXN0IHJlc3VsdCBzaG91bGQgYmUgdW5kZWZpbmVkXHJcbiAgICAgICAgICBmaWx0ZXIuYXBwbHlTVkdGaWx0ZXIoIHRoaXMuZmlsdGVyRWxlbWVudCwgaW5OYW1lLCByZXN1bHROYW1lICk7XHJcbiAgICAgICAgICBmaWx0ZXJSZWdpb25QZXJjZW50YWdlSW5jcmVhc2UgKz0gZmlsdGVyLmZpbHRlclJlZ2lvblBlcmNlbnRhZ2VJbmNyZWFzZTtcclxuICAgICAgICAgIGluTmFtZSA9IHJlc3VsdE5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBCbGVoLCBubyBnb29kIHdheSB0byBoYW5kbGUgdGhlIGZpbHRlciByZWdpb24/IGh0dHBzOi8vZHJhZnRzLmZ4dGYub3JnL2ZpbHRlci1lZmZlY3RzLyNmaWx0ZXItcmVnaW9uXHJcbiAgICAgICAgLy8gSWYgd2UgV0FOVCB0byB0cmFjayB0aGluZ3MgYnkgdGhlaXIgYWN0dWFsIGRpc3BsYXkgc2l6ZSBBTkQgcGFkIHBpeGVscywgQU5EIGNvcHkgdG9ucyBvZiB0aGluZ3MuLi4gd2UgY291bGRcclxuICAgICAgICAvLyBwb3RlbnRpYWxseSB1c2UgdGhlIHVzZXJTcGFjZU9uVXNlIGFuZCBwYWQgdGhlIHByb3BlciBudW1iZXIgb2YgcGl4ZWxzLiBUaGF0IHNvdW5kcyBsaWtlIGFuIGFic29sdXRlIHBhaW4sIEFORFxyXG4gICAgICAgIC8vIGEgcGVyZm9ybWFuY2UgZHJhaW4gYW5kIGFic3RyYWN0aW9uIGJyZWFrLlxyXG4gICAgICAgIGNvbnN0IG1pbiA9IGAtJHt0b1NWR051bWJlciggZmlsdGVyUmVnaW9uUGVyY2VudGFnZUluY3JlYXNlICl9JWA7XHJcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGAke3RvU1ZHTnVtYmVyKCAyICogZmlsdGVyUmVnaW9uUGVyY2VudGFnZUluY3JlYXNlICsgMTAwICl9JWA7XHJcbiAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSggJ3gnLCBtaW4gKTtcclxuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQuc2V0QXR0cmlidXRlKCAneScsIG1pbiApO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudC5zZXRBdHRyaWJ1dGUoICd3aWR0aCcsIHNpemUgKTtcclxuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQuc2V0QXR0cmlidXRlKCAnaGVpZ2h0Jywgc2l6ZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG5lZWRzRmlsdGVyICkge1xyXG4gICAgICAgIGlmICggIXRoaXMuaGFzRmlsdGVyICkge1xyXG4gICAgICAgICAgdGhpcy5ibG9jay5kZWZzLmFwcGVuZENoaWxkKCB0aGlzLmZpbHRlckVsZW1lbnQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3ZnR3JvdXAuc2V0QXR0cmlidXRlKCAnZmlsdGVyJywgYHVybCgjJHtmaWx0ZXJJZH0pYCApO1xyXG4gICAgICAgIHRoaXMuaGFzRmlsdGVyID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMuaGFzRmlsdGVyICYmICFuZWVkc0ZpbHRlciApIHtcclxuICAgICAgICBzdmdHcm91cC5yZW1vdmVBdHRyaWJ1dGUoICdmaWx0ZXInICk7XHJcbiAgICAgICAgdGhpcy5oYXNGaWx0ZXIgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmJsb2NrLmRlZnMucmVtb3ZlQ2hpbGQoIHRoaXMuZmlsdGVyRWxlbWVudCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLmNsaXBEaXJ0eSApIHtcclxuICAgICAgdGhpcy5jbGlwRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwKCBgY2xpcCB1cGRhdGU6ICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAgIC8vT0hUV08gVE9ETzogcmVtb3ZlIGNsaXAgd29ya2Fyb3VuZCAodXNlIHRoaXMud2lsbEFwcGx5RmlsdGVycykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgaWYgKCB0aGlzLm5vZGUuY2xpcEFyZWEgKSB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5jbGlwRGVmaW5pdGlvbiApIHtcclxuICAgICAgICAgIC8vIFVzZSBtb25vdG9uaWNhbGx5LWluY3JlYXNpbmcgYW5kIHVuaXF1ZSBjbGlwIElEcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9mYXJhZGF5cy1lbGVjdHJvbWFnbmV0aWMtbGFiL2lzc3Vlcy84OVxyXG4gICAgICAgICAgLy8gVGhlcmUgaXMgbm8gY29ubmVjdGlvbiBuZWNlc3NhcmlseSB0byB0aGUgbm9kZSwgZXNwZWNpYWxseSwgc2luY2Ugd2UgY2FuIGhhdmUgZGlmZmVyZW50IFNWRyByZXByZXNlbnRhdGlvbnNcclxuICAgICAgICAgIC8vIG9mIGEgbm9kZSwgQU5EIHdlIHBvb2wgdGhlIFNWR0dyb3Vwcy5cclxuICAgICAgICAgIGNvbnN0IGNsaXBJZCA9IGBjbGlwJHtjbGlwR2xvYmFsSWQrK31gO1xyXG5cclxuICAgICAgICAgIHRoaXMuY2xpcERlZmluaXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoIHN2Z25zLCAnY2xpcFBhdGgnICk7XHJcbiAgICAgICAgICB0aGlzLmNsaXBEZWZpbml0aW9uLnNldEF0dHJpYnV0ZSggJ2lkJywgY2xpcElkICk7XHJcbiAgICAgICAgICB0aGlzLmNsaXBEZWZpbml0aW9uLnNldEF0dHJpYnV0ZSggJ2NsaXBQYXRoVW5pdHMnLCAndXNlclNwYWNlT25Vc2UnICk7XHJcbiAgICAgICAgICB0aGlzLmJsb2NrLmRlZnMuYXBwZW5kQ2hpbGQoIHRoaXMuY2xpcERlZmluaXRpb24gKTsgLy8gVE9ETzogbWV0aG9kPyBldmFsdWF0ZSB3aXRoIGZ1dHVyZSB1c2FnZSBvZiBkZWZzIChub3QgZG9uZSB5ZXQpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgICAgICAgdGhpcy5jbGlwUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdwYXRoJyApO1xyXG4gICAgICAgICAgdGhpcy5jbGlwRGVmaW5pdGlvbi5hcHBlbmRDaGlsZCggdGhpcy5jbGlwUGF0aCApO1xyXG5cclxuICAgICAgICAgIHN2Z0dyb3VwLnNldEF0dHJpYnV0ZSggJ2NsaXAtcGF0aCcsIGB1cmwoIyR7Y2xpcElkfSlgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNsaXBQYXRoLnNldEF0dHJpYnV0ZSggJ2QnLCB0aGlzLm5vZGUuY2xpcEFyZWEuZ2V0U1ZHUGF0aCgpICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuY2xpcERlZmluaXRpb24gKSB7XHJcbiAgICAgICAgc3ZnR3JvdXAucmVtb3ZlQXR0cmlidXRlKCAnY2xpcC1wYXRoJyApO1xyXG4gICAgICAgIHRoaXMuYmxvY2suZGVmcy5yZW1vdmVDaGlsZCggdGhpcy5jbGlwRGVmaW5pdGlvbiApOyAvLyBUT0RPOiBtZXRob2Q/IGV2YWx1YXRlIHdpdGggZnV0dXJlIHVzYWdlIG9mIGRlZnMgKG5vdCBkb25lIHlldCkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgcG9vbGluZyB0aGVzZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICB0aGlzLmNsaXBEZWZpbml0aW9uID0gbnVsbDtcclxuICAgICAgICB0aGlzLmNsaXBQYXRoID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5vcmRlckRpcnR5ICkge1xyXG4gICAgICB0aGlzLm9yZGVyRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwKCBgb3JkZXIgdXBkYXRlOiAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIC8vIG91ciBpbnN0YW5jZSBzaG91bGQgaGF2ZSB0aGUgcHJvcGVyIG9yZGVyIG9mIGNoaWxkcmVuLiB3ZSBjaGVjayB0aGF0IHdheS5cclxuICAgICAgbGV0IGlkeCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTtcclxuICAgICAgY29uc3QgaW5zdGFuY2VDaGlsZHJlbiA9IHRoaXMuaW5zdGFuY2UuY2hpbGRyZW47XHJcbiAgICAgIC8vIGl0ZXJhdGUgYmFja3dhcmRzLCBzaW5jZSBET00ncyBpbnNlcnRCZWZvcmUgbWFrZXMgZm9yd2FyZCBpdGVyYXRpb24gbW9yZSBjb21wbGljYXRlZCAobm8gaW5zZXJ0QWZ0ZXIpXHJcbiAgICAgIGZvciAoIGxldCBpID0gaW5zdGFuY2VDaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgICBjb25zdCBncm91cCA9IGluc3RhbmNlQ2hpbGRyZW5bIGkgXS5sb29rdXBTVkdHcm91cCggdGhpcy5ibG9jayApO1xyXG4gICAgICAgIGlmICggZ3JvdXAgKSB7XHJcbiAgICAgICAgICAvLyBlbnN1cmUgdGhhdCB0aGUgc3BvdCBpbiBvdXIgYXJyYXkgKGFuZCBpbiB0aGUgRE9NKSBhdCBbaWR4XSBpcyBjb3JyZWN0XHJcbiAgICAgICAgICBpZiAoIHRoaXMuY2hpbGRyZW5bIGlkeCBdICE9PSBncm91cCApIHtcclxuICAgICAgICAgICAgLy8gb3V0IG9mIG9yZGVyLCByZWFycmFuZ2VcclxuICAgICAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAoIGBncm91cCBvdXQgb2Ygb3JkZXI6ICR7aWR4fSBmb3IgJHtncm91cC50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGluIHRoZSBET00gZmlyc3QgKHNpbmNlIHdlIHJlZmVyZW5jZSB0aGUgY2hpbGRyZW4gYXJyYXkgdG8ga25vdyB3aGF0IHRvIGluc2VydEJlZm9yZSlcclxuICAgICAgICAgICAgLy8gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTczMjYyNC9ob3ctdG8tc3dhcC1kb20tY2hpbGQtbm9kZXMtaW4tamF2YXNjcmlwdFxyXG4gICAgICAgICAgICBzdmdHcm91cC5pbnNlcnRCZWZvcmUoIGdyb3VwLnN2Z0dyb3VwLCBpZHggKyAxID49IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID8gbnVsbCA6IHRoaXMuY2hpbGRyZW5bIGlkeCArIDEgXS5zdmdHcm91cCApO1xyXG5cclxuICAgICAgICAgICAgLy8gdGhlbiBpbiBvdXIgY2hpbGRyZW4gYXJyYXlcclxuICAgICAgICAgICAgY29uc3Qgb2xkSW5kZXggPSBfLmluZGV4T2YoIHRoaXMuY2hpbGRyZW4sIGdyb3VwICk7XHJcbiAgICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9sZEluZGV4IDwgaWR4LCAnVGhlIGl0ZW0gd2UgYXJlIG1vdmluZyBiYWNrd2FyZHMgdG8gbG9jYXRpb24gW2lkeF0gc2hvdWxkIG5vdCBoYXZlIGFuIGluZGV4IGdyZWF0ZXIgdGhhbiB0aGF0JyApO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZSggb2xkSW5kZXgsIDEgKTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoIGlkeCwgMCwgZ3JvdXAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCggYGdyb3VwIGluIHBsYWNlOiAke2lkeH0gZm9yICR7Z3JvdXAudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gaWYgdGhlcmUgd2FzIGEgZ3JvdXAgZm9yIHRoYXQgaW5zdGFuY2UsIHdlIG1vdmUgb24gdG8gdGhlIG5leHQgc3BvdFxyXG4gICAgICAgICAgaWR4LS07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBpc1JlbGVhc2FibGUoKSB7XHJcbiAgICAvLyBpZiB3ZSBoYXZlIG5vIHBhcmVudCwgd2UgYXJlIHRoZSByb290R3JvdXAgKHRoZSBibG9jayBpcyByZXNwb25zaWJsZSBmb3IgZGlzcG9zaW5nIHRoYXQgb25lKVxyXG4gICAgcmV0dXJuICF0aGlzLmhhc1NlbGZEcmF3YWJsZSAmJiAhdGhpcy5jaGlsZHJlbi5sZW5ndGggJiYgdGhpcy5wYXJlbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHR3JvdXAgJiYgc2NlbmVyeUxvZy5TVkdHcm91cCggYGRpc3Bvc2UgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09PSAwLCAnU2hvdWxkIGJlIGVtcHR5IGJ5IG5vdycgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuaGFzRmlsdGVyICkge1xyXG4gICAgICB0aGlzLnN2Z0dyb3VwLnJlbW92ZUF0dHJpYnV0ZSggJ2ZpbHRlcicgKTtcclxuICAgICAgdGhpcy5oYXNGaWx0ZXIgPSBmYWxzZTtcclxuICAgICAgdGhpcy5ibG9jay5kZWZzLnJlbW92ZUNoaWxkKCB0aGlzLmZpbHRlckVsZW1lbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMud2lsbEFwcGx5VHJhbnNmb3JtcyApIHtcclxuICAgICAgdGhpcy5ub2RlLnRyYW5zZm9ybUVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtRGlydHlMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ub2RlLnZpc2libGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMudmlzaWJpbGl0eURpcnR5TGlzdGVuZXIgKTtcclxuICAgIGlmICggdGhpcy53aWxsQXBwbHlGaWx0ZXJzICkge1xyXG4gICAgICB0aGlzLm5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5maWx0ZXJDaGFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgLy9PSFRXTyBUT0RPOiByZW1vdmUgY2xpcCB3b3JrYXJvdW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLm5vZGUuY2xpcEFyZWFQcm9wZXJ0eS51bmxpbmsoIHRoaXMuY2xpcERpcnR5TGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLm5vZGUuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5vcmRlckRpcnR5TGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBpZiBvdXIgSW5zdGFuY2UgaGFzIGJlZW4gZGlzcG9zZWQsIGl0IGhhcyBhbHJlYWR5IGhhZCB0aGUgcmVmZXJlbmNlIHJlbW92ZWRcclxuICAgIGlmICggdGhpcy5pbnN0YW5jZS5hY3RpdmUgKSB7XHJcbiAgICAgIHRoaXMuaW5zdGFuY2UucmVtb3ZlU1ZHR3JvdXAoIHRoaXMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZW1vdmUgY2xpcHBpbmcsIHNpbmNlIGl0IGlzIGRlZnMtYmFzZWQgKGFuZCB3ZSB3YW50IHRvIGtlZXAgb3VyIGRlZnMgYmxvY2sgY2xlYW4gLSBjb3VsZCBiZSBhbm90aGVyIGxheWVyISlcclxuICAgIGlmICggdGhpcy5jbGlwRGVmaW5pdGlvbiApIHtcclxuICAgICAgdGhpcy5zdmdHcm91cC5yZW1vdmVBdHRyaWJ1dGUoICdjbGlwLXBhdGgnICk7XHJcbiAgICAgIHRoaXMuYmxvY2suZGVmcy5yZW1vdmVDaGlsZCggdGhpcy5jbGlwRGVmaW5pdGlvbiApO1xyXG4gICAgICB0aGlzLmNsaXBEZWZpbml0aW9uID0gbnVsbDtcclxuICAgICAgdGhpcy5jbGlwUGF0aCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xlYXIgcmVmZXJlbmNlc1xyXG4gICAgdGhpcy5wYXJlbnQgPSBudWxsO1xyXG4gICAgdGhpcy5ibG9jayA9IG51bGw7XHJcbiAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcclxuICAgIHRoaXMubm9kZSA9IG51bGw7XHJcbiAgICBjbGVhbkFycmF5KCB0aGlzLmNoaWxkcmVuICk7XHJcbiAgICB0aGlzLnNlbGZEcmF3YWJsZSA9IG51bGw7XHJcblxyXG4gICAgLy8gZm9yIG5vd1xyXG4gICAgdGhpcy5mcmVlVG9Qb29sKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0dyb3VwICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvcm0gb2YgdGhpcyBvYmplY3RcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHRvU3RyaW5nKCkge1xyXG4gICAgcmV0dXJuIGBTVkdHcm91cDoke3RoaXMuYmxvY2sudG9TdHJpbmcoKX1fJHt0aGlzLmluc3RhbmNlLnRvU3RyaW5nKCl9YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U1ZHQmxvY2t9IGJsb2NrXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gZHJhd2FibGVcclxuICAgKi9cclxuICBzdGF0aWMgYWRkRHJhd2FibGUoIGJsb2NrLCBkcmF3YWJsZSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRyYXdhYmxlLmluc3RhbmNlLCAnSW5zdGFuY2UgaXMgcmVxdWlyZWQgZm9yIGEgZHJhd2FibGUgdG8gYmUgZ3JvdXBlZCBjb3JyZWN0bHkgaW4gU1ZHJyApO1xyXG5cclxuICAgIGNvbnN0IGdyb3VwID0gU1ZHR3JvdXAuZW5zdXJlR3JvdXBzVG9JbnN0YW5jZSggYmxvY2ssIGRyYXdhYmxlLmluc3RhbmNlICk7XHJcbiAgICBncm91cC5hZGRTZWxmRHJhd2FibGUoIGRyYXdhYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1NWR0Jsb2NrfSBibG9ja1xyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV9IGRyYXdhYmxlXHJcbiAgICovXHJcbiAgc3RhdGljIHJlbW92ZURyYXdhYmxlKCBibG9jaywgZHJhd2FibGUgKSB7XHJcbiAgICBkcmF3YWJsZS5pbnN0YW5jZS5sb29rdXBTVkdHcm91cCggYmxvY2sgKS5yZW1vdmVTZWxmRHJhd2FibGUoIGRyYXdhYmxlICk7XHJcblxyXG4gICAgU1ZHR3JvdXAucmVsZWFzZUdyb3Vwc1RvSW5zdGFuY2UoIGJsb2NrLCBkcmF3YWJsZS5pbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U1ZHQmxvY2t9IGJsb2NrXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gaW5zdGFuY2VcclxuICAgKiBAcmV0dXJucyB7U1ZHR3JvdXB9XHJcbiAgICovXHJcbiAgc3RhdGljIGVuc3VyZUdyb3Vwc1RvSW5zdGFuY2UoIGJsb2NrLCBpbnN0YW5jZSApIHtcclxuICAgIC8vIFRPRE86IGFzc2VydGlvbnMgaGVyZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIGxldCBncm91cCA9IGluc3RhbmNlLmxvb2t1cFNWR0dyb3VwKCBibG9jayApO1xyXG5cclxuICAgIGlmICggIWdyb3VwICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbnN0YW5jZSAhPT0gYmxvY2sucm9vdEdyb3VwLmluc3RhbmNlLCAnTWFraW5nIHN1cmUgd2UgZG8gbm90IHdhbGsgcGFzdCBvdXIgcm9vdEdyb3VwJyApO1xyXG5cclxuICAgICAgY29uc3QgcGFyZW50R3JvdXAgPSBTVkdHcm91cC5lbnN1cmVHcm91cHNUb0luc3RhbmNlKCBibG9jaywgaW5zdGFuY2UucGFyZW50ICk7XHJcblxyXG4gICAgICBncm91cCA9IFNWR0dyb3VwLmNyZWF0ZUZyb21Qb29sKCBibG9jaywgaW5zdGFuY2UsIHBhcmVudEdyb3VwICk7XHJcbiAgICAgIHBhcmVudEdyb3VwLmFkZENoaWxkR3JvdXAoIGdyb3VwICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdyb3VwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U1ZHQmxvY2t9IGJsb2NrXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gaW5zdGFuY2VcclxuICAgKi9cclxuICBzdGF0aWMgcmVsZWFzZUdyb3Vwc1RvSW5zdGFuY2UoIGJsb2NrLCBpbnN0YW5jZSApIHtcclxuICAgIGNvbnN0IGdyb3VwID0gaW5zdGFuY2UubG9va3VwU1ZHR3JvdXAoIGJsb2NrICk7XHJcblxyXG4gICAgaWYgKCBncm91cC5pc1JlbGVhc2FibGUoKSApIHtcclxuICAgICAgY29uc3QgcGFyZW50R3JvdXAgPSBncm91cC5wYXJlbnQ7XHJcbiAgICAgIHBhcmVudEdyb3VwLnJlbW92ZUNoaWxkR3JvdXAoIGdyb3VwICk7XHJcblxyXG4gICAgICBTVkdHcm91cC5yZWxlYXNlR3JvdXBzVG9JbnN0YW5jZSggYmxvY2ssIHBhcmVudEdyb3VwLmluc3RhbmNlICk7XHJcblxyXG4gICAgICBncm91cC5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnU1ZHR3JvdXAnLCBTVkdHcm91cCApO1xyXG5cclxuUG9vbGFibGUubWl4SW50byggU1ZHR3JvdXAgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNWR0dyb3VwOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSxnQ0FBZ0M7QUFDeEQsT0FBT0MsVUFBVSxNQUFNLHFDQUFxQztBQUM1RCxPQUFPQyxRQUFRLE1BQU0sbUNBQW1D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