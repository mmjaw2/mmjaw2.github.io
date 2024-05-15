// Copyright 2014-2022, University of Colorado Boulder

/**
 * Stitcher that rebuilds all of the blocks and reattaches drawables. Simple, but inefficient.
 *
 * Kept for now as a run-time comparison and baseline for the GreedyStitcher or any other more advanced (but
 * more error-prone) stitching process.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Renderer, scenery, Stitcher } from '../imports.js';
class RebuildStitcher extends Stitcher {
  /**
   * Main stitch entry point, called directly from the backbone or cache. We are modifying our backbone's blocks and
   * their attached drawables.
   * @public
   *
   * @param {BackboneDrawable} backbone
   * @param {Drawable|null} firstStitchDrawable
   * @param {Drawable|null} lastStitchDrawable
   * @param {Drawable|null} oldFirstStitchDrawable
   * @param {Drawable|null} oldLastStitchDrawable
   * @param {ChangeInterval} firstChangeInterval
   * @param {ChangeInterval} lastChangeInterval
   */
  stitch(backbone, firstDrawable, lastDrawable, oldFirstDrawable, oldLastDrawable, firstChangeInterval, lastChangeInterval) {
    this.initialize(backbone, firstDrawable, lastDrawable, oldFirstDrawable, oldLastDrawable, firstChangeInterval, lastChangeInterval);
    for (let d = backbone.previousFirstDrawable; d !== null; d = d.oldNextDrawable) {
      this.notePendingRemoval(d);
      if (d === backbone.previousLastDrawable) {
        break;
      }
    }
    this.recordBackboneBoundaries();
    this.removeAllBlocks();
    let currentBlock = null;
    let currentRenderer = 0;
    let firstDrawableForBlock = null;

    // linked-list iteration inclusively from firstDrawable to lastDrawable
    for (let drawable = firstDrawable; drawable !== null; drawable = drawable.nextDrawable) {
      // if we need to switch to a new block, create it
      if (!currentBlock || drawable.renderer !== currentRenderer) {
        if (currentBlock) {
          this.notifyInterval(currentBlock, firstDrawableForBlock, drawable.previousDrawable);
        }
        currentRenderer = drawable.renderer;
        currentBlock = this.createBlock(currentRenderer, drawable);
        if (Renderer.isDOM(currentRenderer)) {
          currentRenderer = 0;
        }
        this.appendBlock(currentBlock);
        firstDrawableForBlock = drawable;
      }
      this.notePendingAddition(drawable, currentBlock);

      // don't cause an infinite loop!
      if (drawable === lastDrawable) {
        break;
      }
    }
    if (currentBlock) {
      this.notifyInterval(currentBlock, firstDrawableForBlock, lastDrawable);
    }
    this.reindex();
    this.clean();
  }
}
scenery.register('RebuildStitcher', RebuildStitcher);
export default RebuildStitcher;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZW5kZXJlciIsInNjZW5lcnkiLCJTdGl0Y2hlciIsIlJlYnVpbGRTdGl0Y2hlciIsInN0aXRjaCIsImJhY2tib25lIiwiZmlyc3REcmF3YWJsZSIsImxhc3REcmF3YWJsZSIsIm9sZEZpcnN0RHJhd2FibGUiLCJvbGRMYXN0RHJhd2FibGUiLCJmaXJzdENoYW5nZUludGVydmFsIiwibGFzdENoYW5nZUludGVydmFsIiwiaW5pdGlhbGl6ZSIsImQiLCJwcmV2aW91c0ZpcnN0RHJhd2FibGUiLCJvbGROZXh0RHJhd2FibGUiLCJub3RlUGVuZGluZ1JlbW92YWwiLCJwcmV2aW91c0xhc3REcmF3YWJsZSIsInJlY29yZEJhY2tib25lQm91bmRhcmllcyIsInJlbW92ZUFsbEJsb2NrcyIsImN1cnJlbnRCbG9jayIsImN1cnJlbnRSZW5kZXJlciIsImZpcnN0RHJhd2FibGVGb3JCbG9jayIsImRyYXdhYmxlIiwibmV4dERyYXdhYmxlIiwicmVuZGVyZXIiLCJub3RpZnlJbnRlcnZhbCIsInByZXZpb3VzRHJhd2FibGUiLCJjcmVhdGVCbG9jayIsImlzRE9NIiwiYXBwZW5kQmxvY2siLCJub3RlUGVuZGluZ0FkZGl0aW9uIiwicmVpbmRleCIsImNsZWFuIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJSZWJ1aWxkU3RpdGNoZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3RpdGNoZXIgdGhhdCByZWJ1aWxkcyBhbGwgb2YgdGhlIGJsb2NrcyBhbmQgcmVhdHRhY2hlcyBkcmF3YWJsZXMuIFNpbXBsZSwgYnV0IGluZWZmaWNpZW50LlxyXG4gKlxyXG4gKiBLZXB0IGZvciBub3cgYXMgYSBydW4tdGltZSBjb21wYXJpc29uIGFuZCBiYXNlbGluZSBmb3IgdGhlIEdyZWVkeVN0aXRjaGVyIG9yIGFueSBvdGhlciBtb3JlIGFkdmFuY2VkIChidXRcclxuICogbW9yZSBlcnJvci1wcm9uZSkgc3RpdGNoaW5nIHByb2Nlc3MuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgeyBSZW5kZXJlciwgc2NlbmVyeSwgU3RpdGNoZXIgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmNsYXNzIFJlYnVpbGRTdGl0Y2hlciBleHRlbmRzIFN0aXRjaGVyIHtcclxuICAvKipcclxuICAgKiBNYWluIHN0aXRjaCBlbnRyeSBwb2ludCwgY2FsbGVkIGRpcmVjdGx5IGZyb20gdGhlIGJhY2tib25lIG9yIGNhY2hlLiBXZSBhcmUgbW9kaWZ5aW5nIG91ciBiYWNrYm9uZSdzIGJsb2NrcyBhbmRcclxuICAgKiB0aGVpciBhdHRhY2hlZCBkcmF3YWJsZXMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtCYWNrYm9uZURyYXdhYmxlfSBiYWNrYm9uZVxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV8bnVsbH0gZmlyc3RTdGl0Y2hEcmF3YWJsZVxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV8bnVsbH0gbGFzdFN0aXRjaERyYXdhYmxlXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZXxudWxsfSBvbGRGaXJzdFN0aXRjaERyYXdhYmxlXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZXxudWxsfSBvbGRMYXN0U3RpdGNoRHJhd2FibGVcclxuICAgKiBAcGFyYW0ge0NoYW5nZUludGVydmFsfSBmaXJzdENoYW5nZUludGVydmFsXHJcbiAgICogQHBhcmFtIHtDaGFuZ2VJbnRlcnZhbH0gbGFzdENoYW5nZUludGVydmFsXHJcbiAgICovXHJcbiAgc3RpdGNoKCBiYWNrYm9uZSwgZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlLCBvbGRGaXJzdERyYXdhYmxlLCBvbGRMYXN0RHJhd2FibGUsIGZpcnN0Q2hhbmdlSW50ZXJ2YWwsIGxhc3RDaGFuZ2VJbnRlcnZhbCApIHtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZSggYmFja2JvbmUsIGZpcnN0RHJhd2FibGUsIGxhc3REcmF3YWJsZSwgb2xkRmlyc3REcmF3YWJsZSwgb2xkTGFzdERyYXdhYmxlLCBmaXJzdENoYW5nZUludGVydmFsLCBsYXN0Q2hhbmdlSW50ZXJ2YWwgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgZCA9IGJhY2tib25lLnByZXZpb3VzRmlyc3REcmF3YWJsZTsgZCAhPT0gbnVsbDsgZCA9IGQub2xkTmV4dERyYXdhYmxlICkge1xyXG4gICAgICB0aGlzLm5vdGVQZW5kaW5nUmVtb3ZhbCggZCApO1xyXG4gICAgICBpZiAoIGQgPT09IGJhY2tib25lLnByZXZpb3VzTGFzdERyYXdhYmxlICkgeyBicmVhazsgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucmVjb3JkQmFja2JvbmVCb3VuZGFyaWVzKCk7XHJcblxyXG4gICAgdGhpcy5yZW1vdmVBbGxCbG9ja3MoKTtcclxuXHJcbiAgICBsZXQgY3VycmVudEJsb2NrID0gbnVsbDtcclxuICAgIGxldCBjdXJyZW50UmVuZGVyZXIgPSAwO1xyXG4gICAgbGV0IGZpcnN0RHJhd2FibGVGb3JCbG9jayA9IG51bGw7XHJcblxyXG4gICAgLy8gbGlua2VkLWxpc3QgaXRlcmF0aW9uIGluY2x1c2l2ZWx5IGZyb20gZmlyc3REcmF3YWJsZSB0byBsYXN0RHJhd2FibGVcclxuICAgIGZvciAoIGxldCBkcmF3YWJsZSA9IGZpcnN0RHJhd2FibGU7IGRyYXdhYmxlICE9PSBudWxsOyBkcmF3YWJsZSA9IGRyYXdhYmxlLm5leHREcmF3YWJsZSApIHtcclxuXHJcbiAgICAgIC8vIGlmIHdlIG5lZWQgdG8gc3dpdGNoIHRvIGEgbmV3IGJsb2NrLCBjcmVhdGUgaXRcclxuICAgICAgaWYgKCAhY3VycmVudEJsb2NrIHx8IGRyYXdhYmxlLnJlbmRlcmVyICE9PSBjdXJyZW50UmVuZGVyZXIgKSB7XHJcbiAgICAgICAgaWYgKCBjdXJyZW50QmxvY2sgKSB7XHJcbiAgICAgICAgICB0aGlzLm5vdGlmeUludGVydmFsKCBjdXJyZW50QmxvY2ssIGZpcnN0RHJhd2FibGVGb3JCbG9jaywgZHJhd2FibGUucHJldmlvdXNEcmF3YWJsZSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudFJlbmRlcmVyID0gZHJhd2FibGUucmVuZGVyZXI7XHJcblxyXG4gICAgICAgIGN1cnJlbnRCbG9jayA9IHRoaXMuY3JlYXRlQmxvY2soIGN1cnJlbnRSZW5kZXJlciwgZHJhd2FibGUgKTtcclxuICAgICAgICBpZiAoIFJlbmRlcmVyLmlzRE9NKCBjdXJyZW50UmVuZGVyZXIgKSApIHtcclxuICAgICAgICAgIGN1cnJlbnRSZW5kZXJlciA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZEJsb2NrKCBjdXJyZW50QmxvY2sgKTtcclxuXHJcbiAgICAgICAgZmlyc3REcmF3YWJsZUZvckJsb2NrID0gZHJhd2FibGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMubm90ZVBlbmRpbmdBZGRpdGlvbiggZHJhd2FibGUsIGN1cnJlbnRCbG9jayApO1xyXG5cclxuICAgICAgLy8gZG9uJ3QgY2F1c2UgYW4gaW5maW5pdGUgbG9vcCFcclxuICAgICAgaWYgKCBkcmF3YWJsZSA9PT0gbGFzdERyYXdhYmxlICkgeyBicmVhazsgfVxyXG4gICAgfVxyXG4gICAgaWYgKCBjdXJyZW50QmxvY2sgKSB7XHJcbiAgICAgIHRoaXMubm90aWZ5SW50ZXJ2YWwoIGN1cnJlbnRCbG9jaywgZmlyc3REcmF3YWJsZUZvckJsb2NrLCBsYXN0RHJhd2FibGUgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJlaW5kZXgoKTtcclxuXHJcbiAgICB0aGlzLmNsZWFuKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUmVidWlsZFN0aXRjaGVyJywgUmVidWlsZFN0aXRjaGVyICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBSZWJ1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