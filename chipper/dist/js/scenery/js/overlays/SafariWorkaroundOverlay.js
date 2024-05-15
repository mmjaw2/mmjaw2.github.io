// Copyright 2022-2024, University of Colorado Boulder

/**
 * Tricks Safari into forcing SVG rendering, see https://github.com/phetsims/geometric-optics-basics/issues/31
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import dotRandom from '../../../dot/js/dotRandom.js';
import { scenery, svgns } from '../imports.js';
export default class SafariWorkaroundOverlay {
  constructor(display) {
    this.display = display;

    // Create an SVG element that will be in front
    const svg = document.createElementNS(svgns, 'svg');
    this.domElement = svg;
    svg.style.position = 'absolute';
    svg.setAttribute('class', 'safari-workaround');
    svg.style.top = '0';
    svg.style.left = '0';
    // @ts-expect-error
    svg.style['pointer-events'] = 'none';

    // Make sure it covers our full size
    display.sizeProperty.link(dimension => {
      svg.setAttribute('width', '' + dimension.width);
      svg.setAttribute('height', '' + dimension.height);
      svg.style.clip = `rect(0px,${dimension.width}px,${dimension.height}px,0px)`;
    });
    this.rect = document.createElementNS(svgns, 'rect');
    svg.appendChild(this.rect);
    this.update();
  }
  update() {
    const random = dotRandom.nextDouble();

    // Position the rectangle to take up the full display width/height EXCEPT for being eroded by a random
    // less-than-pixel amount.
    this.rect.setAttribute('x', '' + random);
    this.rect.setAttribute('y', '' + random);
    this.rect.setAttribute('style', 'fill: rgba(255,200,100,0); stroke: none;');
    if (this.display.width) {
      this.rect.setAttribute('width', '' + (this.display.width - random * 2));
    }
    if (this.display.height) {
      this.rect.setAttribute('height', '' + (this.display.height - random * 2));
    }
  }
}
scenery.register('SafariWorkaroundOverlay', SafariWorkaroundOverlay);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkb3RSYW5kb20iLCJzY2VuZXJ5Iiwic3ZnbnMiLCJTYWZhcmlXb3JrYXJvdW5kT3ZlcmxheSIsImNvbnN0cnVjdG9yIiwiZGlzcGxheSIsInN2ZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwiZG9tRWxlbWVudCIsInN0eWxlIiwicG9zaXRpb24iLCJzZXRBdHRyaWJ1dGUiLCJ0b3AiLCJsZWZ0Iiwic2l6ZVByb3BlcnR5IiwibGluayIsImRpbWVuc2lvbiIsIndpZHRoIiwiaGVpZ2h0IiwiY2xpcCIsInJlY3QiLCJhcHBlbmRDaGlsZCIsInVwZGF0ZSIsInJhbmRvbSIsIm5leHREb3VibGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNhZmFyaVdvcmthcm91bmRPdmVybGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRyaWNrcyBTYWZhcmkgaW50byBmb3JjaW5nIFNWRyByZW5kZXJpbmcsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZ2VvbWV0cmljLW9wdGljcy1iYXNpY3MvaXNzdWVzLzMxXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgZG90UmFuZG9tIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9kb3RSYW5kb20uanMnO1xyXG5pbXBvcnQgeyBEaXNwbGF5LCBzY2VuZXJ5LCBzdmducywgVE92ZXJsYXkgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNhZmFyaVdvcmthcm91bmRPdmVybGF5IGltcGxlbWVudHMgVE92ZXJsYXkge1xyXG5cclxuICBwdWJsaWMgZG9tRWxlbWVudDogU1ZHRWxlbWVudDtcclxuICBwcml2YXRlIHJlY3Q6IFNWR1BhdGhFbGVtZW50O1xyXG4gIHByaXZhdGUgZGlzcGxheTogRGlzcGxheTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBkaXNwbGF5OiBEaXNwbGF5ICkge1xyXG5cclxuICAgIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIFNWRyBlbGVtZW50IHRoYXQgd2lsbCBiZSBpbiBmcm9udFxyXG4gICAgY29uc3Qgc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ3N2ZycgKTtcclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IHN2ZztcclxuICAgIHN2Zy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICBzdmcuc2V0QXR0cmlidXRlKCAnY2xhc3MnLCAnc2FmYXJpLXdvcmthcm91bmQnICk7XHJcbiAgICBzdmcuc3R5bGUudG9wID0gJzAnO1xyXG4gICAgc3ZnLnN0eWxlLmxlZnQgPSAnMCc7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBzdmcuc3R5bGVbICdwb2ludGVyLWV2ZW50cycgXSA9ICdub25lJztcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgaXQgY292ZXJzIG91ciBmdWxsIHNpemVcclxuICAgIGRpc3BsYXkuc2l6ZVByb3BlcnR5LmxpbmsoIGRpbWVuc2lvbiA9PiB7XHJcbiAgICAgIHN2Zy5zZXRBdHRyaWJ1dGUoICd3aWR0aCcsICcnICsgZGltZW5zaW9uLndpZHRoICk7XHJcbiAgICAgIHN2Zy5zZXRBdHRyaWJ1dGUoICdoZWlnaHQnLCAnJyArIGRpbWVuc2lvbi5oZWlnaHQgKTtcclxuICAgICAgc3ZnLnN0eWxlLmNsaXAgPSBgcmVjdCgwcHgsJHtkaW1lbnNpb24ud2lkdGh9cHgsJHtkaW1lbnNpb24uaGVpZ2h0fXB4LDBweClgO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMucmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdyZWN0JyApO1xyXG5cclxuICAgIHN2Zy5hcHBlbmRDaGlsZCggdGhpcy5yZWN0ICk7XHJcblxyXG4gICAgdGhpcy51cGRhdGUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XHJcbiAgICBjb25zdCByYW5kb20gPSBkb3RSYW5kb20ubmV4dERvdWJsZSgpO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSByZWN0YW5nbGUgdG8gdGFrZSB1cCB0aGUgZnVsbCBkaXNwbGF5IHdpZHRoL2hlaWdodCBFWENFUFQgZm9yIGJlaW5nIGVyb2RlZCBieSBhIHJhbmRvbVxyXG4gICAgLy8gbGVzcy10aGFuLXBpeGVsIGFtb3VudC5cclxuICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGUoICd4JywgJycgKyByYW5kb20gKTtcclxuICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGUoICd5JywgJycgKyByYW5kb20gKTtcclxuICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGUoICdzdHlsZScsICdmaWxsOiByZ2JhKDI1NSwyMDAsMTAwLDApOyBzdHJva2U6IG5vbmU7JyApO1xyXG4gICAgaWYgKCB0aGlzLmRpc3BsYXkud2lkdGggKSB7XHJcbiAgICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGUoICd3aWR0aCcsICcnICsgKCB0aGlzLmRpc3BsYXkud2lkdGggLSByYW5kb20gKiAyICkgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5kaXNwbGF5LmhlaWdodCApIHtcclxuICAgICAgdGhpcy5yZWN0LnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsICcnICsgKCB0aGlzLmRpc3BsYXkuaGVpZ2h0IC0gcmFuZG9tICogMiApICk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnU2FmYXJpV29ya2Fyb3VuZE92ZXJsYXknLCBTYWZhcmlXb3JrYXJvdW5kT3ZlcmxheSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxTQUFTLE1BQU0sOEJB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