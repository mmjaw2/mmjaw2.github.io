// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for Carousel
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Carousel from '../../Carousel.js';
import RectangularPushButton from '../../buttons/RectangularPushButton.js';
import { Circle, Font, Node, Rectangle, Text, VBox } from '../../../../scenery/js/imports.js';
const FONT = new Font({
  size: 20
});
export default function demoCarousel(layoutBounds) {
  // create items
  const colors = ['red', 'blue', 'green', 'yellow', 'pink', 'white', 'orange', 'magenta', 'purple', 'pink'];
  const vItems = [];
  const hItems = [];
  colors.forEach(color => {
    vItems.push({
      createNode: () => new Rectangle(0, 0, 60, 60, {
        fill: color,
        stroke: 'black'
      })
    });
    hItems.push({
      createNode: () => new Circle(30, {
        fill: color,
        stroke: 'black'
      })
    });
  });

  // vertical carousel
  const vCarousel = new Carousel(vItems, {
    orientation: 'vertical',
    separatorsVisible: true,
    buttonOptions: {
      touchAreaXDilation: 5,
      touchAreaYDilation: 15,
      mouseAreaXDilation: 2,
      mouseAreaYDilation: 7
    }
  });

  // horizontal carousel
  const hCarousel = new Carousel(hItems, {
    orientation: 'horizontal',
    separatorsVisible: true,
    buttonOptions: {
      touchAreaXDilation: 15,
      touchAreaYDilation: 5,
      mouseAreaXDilation: 7,
      mouseAreaYDilation: 2
    },
    centerX: vCarousel.centerX,
    top: vCarousel.bottom + 50
  });

  // button that scrolls the horizontal carousel to a specific item
  const itemIndex = 4;
  const hScrollToItemButton = new RectangularPushButton({
    content: new Text(`scroll to item ${itemIndex}`, {
      font: FONT
    }),
    listener: () => hCarousel.scrollToItem(hItems[itemIndex])
  });

  // button that sets the horizontal carousel to a specific page number
  const pageNumber = 0;
  const hScrollToPageButton = new RectangularPushButton({
    content: new Text(`scroll to page ${pageNumber}`, {
      font: FONT
    }),
    listener: () => hCarousel.pageNumberProperty.set(pageNumber)
  });

  // group the buttons
  const buttonGroup = new VBox({
    children: [hScrollToItemButton, hScrollToPageButton],
    align: 'left',
    spacing: 7,
    left: hCarousel.right + 30,
    centerY: hCarousel.centerY
  });
  return new Node({
    children: [vCarousel, hCarousel, buttonGroup],
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDYXJvdXNlbCIsIlJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiIsIkNpcmNsZSIsIkZvbnQiLCJOb2RlIiwiUmVjdGFuZ2xlIiwiVGV4dCIsIlZCb3giLCJGT05UIiwic2l6ZSIsImRlbW9DYXJvdXNlbCIsImxheW91dEJvdW5kcyIsImNvbG9ycyIsInZJdGVtcyIsImhJdGVtcyIsImZvckVhY2giLCJjb2xvciIsInB1c2giLCJjcmVhdGVOb2RlIiwiZmlsbCIsInN0cm9rZSIsInZDYXJvdXNlbCIsIm9yaWVudGF0aW9uIiwic2VwYXJhdG9yc1Zpc2libGUiLCJidXR0b25PcHRpb25zIiwidG91Y2hBcmVhWERpbGF0aW9uIiwidG91Y2hBcmVhWURpbGF0aW9uIiwibW91c2VBcmVhWERpbGF0aW9uIiwibW91c2VBcmVhWURpbGF0aW9uIiwiaENhcm91c2VsIiwiY2VudGVyWCIsInRvcCIsImJvdHRvbSIsIml0ZW1JbmRleCIsImhTY3JvbGxUb0l0ZW1CdXR0b24iLCJjb250ZW50IiwiZm9udCIsImxpc3RlbmVyIiwic2Nyb2xsVG9JdGVtIiwicGFnZU51bWJlciIsImhTY3JvbGxUb1BhZ2VCdXR0b24iLCJwYWdlTnVtYmVyUHJvcGVydHkiLCJzZXQiLCJidXR0b25Hcm91cCIsImNoaWxkcmVuIiwiYWxpZ24iLCJzcGFjaW5nIiwibGVmdCIsInJpZ2h0IiwiY2VudGVyWSIsImNlbnRlciJdLCJzb3VyY2VzIjpbImRlbW9DYXJvdXNlbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEZW1vIGZvciBDYXJvdXNlbFxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBDYXJvdXNlbCwgeyBDYXJvdXNlbEl0ZW0gfSBmcm9tICcuLi8uLi9DYXJvdXNlbC5qcyc7XHJcbmltcG9ydCBSZWN0YW5ndWxhclB1c2hCdXR0b24gZnJvbSAnLi4vLi4vYnV0dG9ucy9SZWN0YW5ndWxhclB1c2hCdXR0b24uanMnO1xyXG5pbXBvcnQgeyBDaXJjbGUsIEZvbnQsIE5vZGUsIFJlY3RhbmdsZSwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuXHJcbmNvbnN0IEZPTlQgPSBuZXcgRm9udCggeyBzaXplOiAyMCB9ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZW1vQ2Fyb3VzZWwoIGxheW91dEJvdW5kczogQm91bmRzMiApOiBOb2RlIHtcclxuXHJcbiAgLy8gY3JlYXRlIGl0ZW1zXHJcbiAgY29uc3QgY29sb3JzID0gWyAncmVkJywgJ2JsdWUnLCAnZ3JlZW4nLCAneWVsbG93JywgJ3BpbmsnLCAnd2hpdGUnLCAnb3JhbmdlJywgJ21hZ2VudGEnLCAncHVycGxlJywgJ3BpbmsnIF07XHJcbiAgY29uc3Qgdkl0ZW1zOiBDYXJvdXNlbEl0ZW1bXSA9IFtdO1xyXG4gIGNvbnN0IGhJdGVtczogQ2Fyb3VzZWxJdGVtW10gPSBbXTtcclxuICBjb2xvcnMuZm9yRWFjaCggY29sb3IgPT4ge1xyXG4gICAgdkl0ZW1zLnB1c2goIHsgY3JlYXRlTm9kZTogKCkgPT4gbmV3IFJlY3RhbmdsZSggMCwgMCwgNjAsIDYwLCB7IGZpbGw6IGNvbG9yLCBzdHJva2U6ICdibGFjaycgfSApIH0gKTtcclxuICAgIGhJdGVtcy5wdXNoKCB7IGNyZWF0ZU5vZGU6ICgpID0+IG5ldyBDaXJjbGUoIDMwLCB7IGZpbGw6IGNvbG9yLCBzdHJva2U6ICdibGFjaycgfSApIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIC8vIHZlcnRpY2FsIGNhcm91c2VsXHJcbiAgY29uc3QgdkNhcm91c2VsID0gbmV3IENhcm91c2VsKCB2SXRlbXMsIHtcclxuICAgIG9yaWVudGF0aW9uOiAndmVydGljYWwnLFxyXG4gICAgc2VwYXJhdG9yc1Zpc2libGU6IHRydWUsXHJcbiAgICBidXR0b25PcHRpb25zOiB7XHJcbiAgICAgIHRvdWNoQXJlYVhEaWxhdGlvbjogNSxcclxuICAgICAgdG91Y2hBcmVhWURpbGF0aW9uOiAxNSxcclxuICAgICAgbW91c2VBcmVhWERpbGF0aW9uOiAyLFxyXG4gICAgICBtb3VzZUFyZWFZRGlsYXRpb246IDdcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIGhvcml6b250YWwgY2Fyb3VzZWxcclxuICBjb25zdCBoQ2Fyb3VzZWwgPSBuZXcgQ2Fyb3VzZWwoIGhJdGVtcywge1xyXG4gICAgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyxcclxuICAgIHNlcGFyYXRvcnNWaXNpYmxlOiB0cnVlLFxyXG4gICAgYnV0dG9uT3B0aW9uczoge1xyXG4gICAgICB0b3VjaEFyZWFYRGlsYXRpb246IDE1LFxyXG4gICAgICB0b3VjaEFyZWFZRGlsYXRpb246IDUsXHJcbiAgICAgIG1vdXNlQXJlYVhEaWxhdGlvbjogNyxcclxuICAgICAgbW91c2VBcmVhWURpbGF0aW9uOiAyXHJcbiAgICB9LFxyXG4gICAgY2VudGVyWDogdkNhcm91c2VsLmNlbnRlclgsXHJcbiAgICB0b3A6IHZDYXJvdXNlbC5ib3R0b20gKyA1MFxyXG4gIH0gKTtcclxuXHJcbiAgLy8gYnV0dG9uIHRoYXQgc2Nyb2xscyB0aGUgaG9yaXpvbnRhbCBjYXJvdXNlbCB0byBhIHNwZWNpZmljIGl0ZW1cclxuICBjb25zdCBpdGVtSW5kZXggPSA0O1xyXG4gIGNvbnN0IGhTY3JvbGxUb0l0ZW1CdXR0b24gPSBuZXcgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uKCB7XHJcbiAgICBjb250ZW50OiBuZXcgVGV4dCggYHNjcm9sbCB0byBpdGVtICR7aXRlbUluZGV4fWAsIHsgZm9udDogRk9OVCB9ICksXHJcbiAgICBsaXN0ZW5lcjogKCkgPT4gaENhcm91c2VsLnNjcm9sbFRvSXRlbSggaEl0ZW1zWyBpdGVtSW5kZXggXSApXHJcbiAgfSApO1xyXG5cclxuICAvLyBidXR0b24gdGhhdCBzZXRzIHRoZSBob3Jpem9udGFsIGNhcm91c2VsIHRvIGEgc3BlY2lmaWMgcGFnZSBudW1iZXJcclxuICBjb25zdCBwYWdlTnVtYmVyID0gMDtcclxuICBjb25zdCBoU2Nyb2xsVG9QYWdlQnV0dG9uID0gbmV3IFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbigge1xyXG4gICAgY29udGVudDogbmV3IFRleHQoIGBzY3JvbGwgdG8gcGFnZSAke3BhZ2VOdW1iZXJ9YCwgeyBmb250OiBGT05UIH0gKSxcclxuICAgIGxpc3RlbmVyOiAoKSA9PiBoQ2Fyb3VzZWwucGFnZU51bWJlclByb3BlcnR5LnNldCggcGFnZU51bWJlciApXHJcbiAgfSApO1xyXG5cclxuICAvLyBncm91cCB0aGUgYnV0dG9uc1xyXG4gIGNvbnN0IGJ1dHRvbkdyb3VwID0gbmV3IFZCb3goIHtcclxuICAgIGNoaWxkcmVuOiBbIGhTY3JvbGxUb0l0ZW1CdXR0b24sIGhTY3JvbGxUb1BhZ2VCdXR0b24gXSxcclxuICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICBzcGFjaW5nOiA3LFxyXG4gICAgbGVmdDogaENhcm91c2VsLnJpZ2h0ICsgMzAsXHJcbiAgICBjZW50ZXJZOiBoQ2Fyb3VzZWwuY2VudGVyWVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICBjaGlsZHJlbjogWyB2Q2Fyb3VzZWwsIGhDYXJvdXNlbCwgYnV0dG9uR3JvdXAgXSxcclxuICAgIGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlclxyXG4gIH0gKTtcclxufSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQXdCLG1CQUFtQjtBQUMxRCxPQUFPQyxxQkFBcUIsTUFBTSx3Q0FBd0M7QUFDMUUsU0FBU0MsTUFBTSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsU0FBUyxFQUFF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