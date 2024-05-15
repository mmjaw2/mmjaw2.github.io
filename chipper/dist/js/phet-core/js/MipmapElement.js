// Copyright 2022, University of Colorado Boulder

import phetCore from './phetCore.js';
import asyncLoader from './asyncLoader.js';

/**
 * Size and raster data for levels in a mipmap.  See also type Mipmap in Imageable.ts.  Defined in phet-core instead of
 * scenery because it is loaded upstream and should not have any downstream dependencies such as scenery.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default class MipmapElement {
  constructor(width, height, url) {
    this.width = width;
    this.height = height;
    this.url = url;
    this.img = new Image(); // eslint-disable-line no-html-constructors
    const unlock = asyncLoader.createLock(this.img);
    this.img.onload = unlock;
    this.img.src = this.url; // trigger the loading of the image for its level
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d');

    // TODO: https://github.com/phetsims/chipper/issues/1218 Could likely be moved to prototype, but would also need a
    // rendered: boolean flag, and there are other usages in scenery that would require adjustment
    this.updateCanvas = () => {
      if (this.img.complete && (typeof this.img.naturalWidth === 'undefined' || this.img.naturalWidth > 0)) {
        context.drawImage(this.img, 0, 0);
        delete this.updateCanvas;
      }
    };
  }
}
phetCore.register('MipmapElement', MipmapElement);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImFzeW5jTG9hZGVyIiwiTWlwbWFwRWxlbWVudCIsImNvbnN0cnVjdG9yIiwid2lkdGgiLCJoZWlnaHQiLCJ1cmwiLCJpbWciLCJJbWFnZSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJvbmxvYWQiLCJzcmMiLCJjYW52YXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsInVwZGF0ZUNhbnZhcyIsImNvbXBsZXRlIiwibmF0dXJhbFdpZHRoIiwiZHJhd0ltYWdlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJNaXBtYXBFbGVtZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJy4vYXN5bmNMb2FkZXIuanMnO1xyXG5cclxuLyoqXHJcbiAqIFNpemUgYW5kIHJhc3RlciBkYXRhIGZvciBsZXZlbHMgaW4gYSBtaXBtYXAuICBTZWUgYWxzbyB0eXBlIE1pcG1hcCBpbiBJbWFnZWFibGUudHMuICBEZWZpbmVkIGluIHBoZXQtY29yZSBpbnN0ZWFkIG9mXHJcbiAqIHNjZW5lcnkgYmVjYXVzZSBpdCBpcyBsb2FkZWQgdXBzdHJlYW0gYW5kIHNob3VsZCBub3QgaGF2ZSBhbnkgZG93bnN0cmVhbSBkZXBlbmRlbmNpZXMgc3VjaCBhcyBzY2VuZXJ5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWlwbWFwRWxlbWVudCB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHdpZHRoOiBudW1iZXI7XHJcbiAgcHVibGljIHJlYWRvbmx5IGhlaWdodDogbnVtYmVyO1xyXG4gIHB1YmxpYyByZWFkb25seSB1cmw6IHN0cmluZztcclxuICBwdWJsaWMgcmVhZG9ubHkgaW1nOiBIVE1MSW1hZ2VFbGVtZW50O1xyXG4gIHB1YmxpYyByZWFkb25seSBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xyXG4gIHB1YmxpYyB1cGRhdGVDYW52YXM/OiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCB1cmw6IHN0cmluZyApIHtcclxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgdGhpcy51cmwgPSB1cmw7XHJcblxyXG4gICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1odG1sLWNvbnN0cnVjdG9yc1xyXG4gICAgY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggdGhpcy5pbWcgKTtcclxuICAgIHRoaXMuaW1nLm9ubG9hZCA9IHVubG9jaztcclxuICAgIHRoaXMuaW1nLnNyYyA9IHRoaXMudXJsOyAvLyB0cmlnZ2VyIHRoZSBsb2FkaW5nIG9mIHRoZSBpbWFnZSBmb3IgaXRzIGxldmVsXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMud2lkdGg7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcclxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG5cclxuICAgIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMjE4IENvdWxkIGxpa2VseSBiZSBtb3ZlZCB0byBwcm90b3R5cGUsIGJ1dCB3b3VsZCBhbHNvIG5lZWQgYVxyXG4gICAgLy8gcmVuZGVyZWQ6IGJvb2xlYW4gZmxhZywgYW5kIHRoZXJlIGFyZSBvdGhlciB1c2FnZXMgaW4gc2NlbmVyeSB0aGF0IHdvdWxkIHJlcXVpcmUgYWRqdXN0bWVudFxyXG4gICAgdGhpcy51cGRhdGVDYW52YXMgPSAoKSA9PiB7XHJcbiAgICAgIGlmICggdGhpcy5pbWcuY29tcGxldGUgJiYgKCB0eXBlb2YgdGhpcy5pbWcubmF0dXJhbFdpZHRoID09PSAndW5kZWZpbmVkJyB8fCB0aGlzLmltZy5uYXR1cmFsV2lkdGggPiAwICkgKSB7XHJcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoIHRoaXMuaW1nLCAwLCAwICk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMudXBkYXRlQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdNaXBtYXBFbGVtZW50JywgTWlwbWFwRWxlbWVudCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsT0FBT0EsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjs7QUFFMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxNQUFNQyxhQUFhLENBQUM7RUFRMUJDLFdBQVdBLENBQUVDLEtBQWEsRUFBRUMsTUFBYyxFQUFFQyxHQUFXLEVBQUc7SUFDL0QsSUFBSSxDQUFDRixLQUFLLEdBQUdBLEtBQUs7SUFDbEIsSUFBSSxDQUFDQyxNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDQyxHQUFHLEdBQUdBLEdBQUc7SUFFZCxJQUFJLENBQUNDLEdBQUcsR0FBRyxJQUFJQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsTUFBTUMsTUFBTSxHQUFHUixXQUFXLENBQUNTLFVBQVUsQ0FBRSxJQUFJLENBQUNILEdBQUksQ0FBQztJQUNqRCxJQUFJLENBQUNBLEdBQUcsQ0FBQ0ksTUFBTSxHQUFHRixNQUFNO0lBQ3hCLElBQUksQ0FBQ0YsR0FBRyxDQUFDSyxHQUFHLEdBQUcsSUFBSSxDQUFDTixHQUFHLENBQUMsQ0FBQztJQUN6QixJQUFJLENBQUNPLE1BQU0sR0FBR0MsUUFBUSxDQUFDQyxhQUFhLENBQUUsUUFBUyxDQUFDO0lBQ2hELElBQUksQ0FBQ0YsTUFBTSxDQUFDVCxLQUFLLEdBQUcsSUFBSSxDQUFDQSxLQUFLO0lBQzlCLElBQUksQ0FBQ1MsTUFBTSxDQUFDUixNQUFNLEdBQUcsSUFBSSxDQUFDQSxNQUFNO0lBQ2hDLE1BQU1XLE9BQU8sR0FBRyxJQUFJLENBQUNILE1BQU0sQ0FBQ0ksVUFBVSxDQUFFLElBQUssQ0FBRTs7SUFFL0M7SUFDQTtJQUNBLElBQUksQ0FBQ0MsWUFBWSxHQUFHLE1BQU07TUFDeEIsSUFBSyxJQUFJLENBQUNYLEdBQUcsQ0FBQ1ksUUFBUSxLQUFNLE9BQU8sSUFBSSxDQUFDWixHQUFHLENBQUNhLFlBQVksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDYixHQUFHLENBQUNhLFlBQVksR0FBRyxDQUFDLENBQUUsRUFBRztRQUN4R0osT0FBTyxDQUFDSyxTQUFTLENBQUUsSUFBSSxDQUFDZCxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUNuQyxPQUFPLElBQUksQ0FBQ1csWUFBWTtNQUMxQjtJQUNGLENBQUM7RUFDSDtBQUNGO0FBRUFsQixRQUFRLENBQUNzQixRQUFRLENBQUUsZUFBZSxFQUFFcEIsYUFBYyxDQUFDIiwiaWdub3JlTGlzdCI6W119