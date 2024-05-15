// Copyright 2019-2022, University of Colorado Boulder

/**
 * A GaugeNode with a NumberDisplay located in the center bottom half of the GaugeNode to
 * display the numerical value. The NumberDisplay can be hidden but is visible by default.
 *
 * @author Jesse Greenberg
 */

import Vector2 from '../../dot/js/Vector2.js';
import optionize from '../../phet-core/js/optionize.js';
import GaugeNode from './GaugeNode.js';
import NumberDisplay from './NumberDisplay.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';

// constants
const DEFAULT_FONT = new PhetFont(16);
export default class ValueGaugeNode extends GaugeNode {
  constructor(valueProperty, label, range, providedOptions) {
    const options = optionize()({
      // SelfOptions
      numberDisplayOptions: {
        textOptions: {
          font: DEFAULT_FONT
        },
        backgroundStroke: 'black',
        align: 'center',
        cornerRadius: 5
      }
    }, providedOptions);
    super(valueProperty, label, range, options);
    this._numberDisplayVisible = true;
    this.numberDisplay = new NumberDisplay(valueProperty, range, options.numberDisplayOptions);
    this.addChild(this.numberDisplay);
    assert && assert(this.numberDisplay.matrix.translation.equals(Vector2.ZERO), 'NumberDisplay translation options are not allowed. ValueGaugeNode positions the NumberDisplay');
    this.numberDisplay.center = new Vector2(0, this.radius / 2);
  }

  /**
   * Sets the visibility of the gauge's NumberDisplay.
   */
  setNumberDisplayVisible(visible) {
    if (visible !== this._numberDisplayVisible) {
      this._numberDisplayVisible = visible;
      this.numberDisplay.visible = visible;
    }
  }
  set numberDisplayVisible(visible) {
    this.setNumberDisplayVisible(visible);
  }
  get numberDisplayVisible() {
    return this.getNumberDisplayVisible();
  }

  /**
   * Gets the visibility of the gauge's NumberDisplay.
   */
  getNumberDisplayVisible() {
    return this._numberDisplayVisible;
  }
  dispose() {
    this.numberDisplay.dispose();
    super.dispose();
  }
}
sceneryPhet.register('ValueGaugeNode', ValueGaugeNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwib3B0aW9uaXplIiwiR2F1Z2VOb2RlIiwiTnVtYmVyRGlzcGxheSIsIlBoZXRGb250Iiwic2NlbmVyeVBoZXQiLCJERUZBVUxUX0ZPTlQiLCJWYWx1ZUdhdWdlTm9kZSIsImNvbnN0cnVjdG9yIiwidmFsdWVQcm9wZXJ0eSIsImxhYmVsIiwicmFuZ2UiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJ0ZXh0T3B0aW9ucyIsImZvbnQiLCJiYWNrZ3JvdW5kU3Ryb2tlIiwiYWxpZ24iLCJjb3JuZXJSYWRpdXMiLCJfbnVtYmVyRGlzcGxheVZpc2libGUiLCJudW1iZXJEaXNwbGF5IiwiYWRkQ2hpbGQiLCJhc3NlcnQiLCJtYXRyaXgiLCJ0cmFuc2xhdGlvbiIsImVxdWFscyIsIlpFUk8iLCJjZW50ZXIiLCJyYWRpdXMiLCJzZXROdW1iZXJEaXNwbGF5VmlzaWJsZSIsInZpc2libGUiLCJudW1iZXJEaXNwbGF5VmlzaWJsZSIsImdldE51bWJlckRpc3BsYXlWaXNpYmxlIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiVmFsdWVHYXVnZU5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBHYXVnZU5vZGUgd2l0aCBhIE51bWJlckRpc3BsYXkgbG9jYXRlZCBpbiB0aGUgY2VudGVyIGJvdHRvbSBoYWxmIG9mIHRoZSBHYXVnZU5vZGUgdG9cclxuICogZGlzcGxheSB0aGUgbnVtZXJpY2FsIHZhbHVlLiBUaGUgTnVtYmVyRGlzcGxheSBjYW4gYmUgaGlkZGVuIGJ1dCBpcyB2aXNpYmxlIGJ5IGRlZmF1bHQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnXHJcbiAqL1xyXG5cclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgR2F1Z2VOb2RlLCB7IEdhdWdlTm9kZU9wdGlvbnMgfSBmcm9tICcuL0dhdWdlTm9kZS5qcyc7XHJcbmltcG9ydCBOdW1iZXJEaXNwbGF5LCB7IE51bWJlckRpc3BsYXlPcHRpb25zIH0gZnJvbSAnLi9OdW1iZXJEaXNwbGF5LmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4vUGhldEZvbnQuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgREVGQVVMVF9GT05UID0gbmV3IFBoZXRGb250KCAxNiApO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgdG8gdGhlIE51bWJlckRpc3BsYXlcclxuICBudW1iZXJEaXNwbGF5T3B0aW9ucz86IE51bWJlckRpc3BsYXlPcHRpb25zO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgVmFsdWVHYXVnZU5vZGVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBHYXVnZU5vZGVPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmFsdWVHYXVnZU5vZGUgZXh0ZW5kcyBHYXVnZU5vZGUge1xyXG5cclxuICBwcml2YXRlIF9udW1iZXJEaXNwbGF5VmlzaWJsZTogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG51bWJlckRpc3BsYXk6IE51bWJlckRpc3BsYXk7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdmFsdWVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPiwgbGFiZWw6IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz4sIHJhbmdlOiBSYW5nZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IFZhbHVlR2F1Z2VOb2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFZhbHVlR2F1Z2VOb2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIEdhdWdlTm9kZU9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcbiAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgIGZvbnQ6IERFRkFVTFRfRk9OVFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmFja2dyb3VuZFN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgY29ybmVyUmFkaXVzOiA1XHJcbiAgICAgIH1cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCB2YWx1ZVByb3BlcnR5LCBsYWJlbCwgcmFuZ2UsIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLl9udW1iZXJEaXNwbGF5VmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5udW1iZXJEaXNwbGF5ID0gbmV3IE51bWJlckRpc3BsYXkoIHZhbHVlUHJvcGVydHksIHJhbmdlLCBvcHRpb25zLm51bWJlckRpc3BsYXlPcHRpb25zICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLm51bWJlckRpc3BsYXkgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLm51bWJlckRpc3BsYXkubWF0cml4LnRyYW5zbGF0aW9uLmVxdWFscyggVmVjdG9yMi5aRVJPICksXHJcbiAgICAgICdOdW1iZXJEaXNwbGF5IHRyYW5zbGF0aW9uIG9wdGlvbnMgYXJlIG5vdCBhbGxvd2VkLiBWYWx1ZUdhdWdlTm9kZSBwb3NpdGlvbnMgdGhlIE51bWJlckRpc3BsYXknICk7XHJcbiAgICB0aGlzLm51bWJlckRpc3BsYXkuY2VudGVyID0gbmV3IFZlY3RvcjIoIDAsIHRoaXMucmFkaXVzIC8gMiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgZ2F1Z2UncyBOdW1iZXJEaXNwbGF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXROdW1iZXJEaXNwbGF5VmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggdmlzaWJsZSAhPT0gdGhpcy5fbnVtYmVyRGlzcGxheVZpc2libGUgKSB7XHJcbiAgICAgIHRoaXMuX251bWJlckRpc3BsYXlWaXNpYmxlID0gdmlzaWJsZTtcclxuICAgICAgdGhpcy5udW1iZXJEaXNwbGF5LnZpc2libGUgPSB2aXNpYmxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBudW1iZXJEaXNwbGF5VmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApIHsgdGhpcy5zZXROdW1iZXJEaXNwbGF5VmlzaWJsZSggdmlzaWJsZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbnVtYmVyRGlzcGxheVZpc2libGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldE51bWJlckRpc3BsYXlWaXNpYmxlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgZ2F1Z2UncyBOdW1iZXJEaXNwbGF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROdW1iZXJEaXNwbGF5VmlzaWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9udW1iZXJEaXNwbGF5VmlzaWJsZTtcclxuICB9XHJcblxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMubnVtYmVyRGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1ZhbHVlR2F1Z2VOb2RlJywgVmFsdWVHYXVnZU5vZGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxPQUFPQSxPQUFPLE1BQU0seUJBQXlCO0FBQzdDLE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsT0FBT0MsU0FBUyxNQUE0QixnQkFBZ0I7QUFDNUQsT0FBT0MsYUFBYSxNQUFnQyxvQkFBb0I7QUFDeEUsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjs7QUFFMUM7QUFDQSxNQUFNQyxZQUFZLEdBQUcsSUFBSUYsUUFBUSxDQUFFLEVBQUcsQ0FBQztBQVV2QyxlQUFlLE1BQU1HLGNBQWMsU0FBU0wsU0FBUyxDQUFDO0VBSzdDTSxXQUFXQSxDQUFFQyxhQUF3QyxFQUFFQyxLQUFnQyxFQUFFQyxLQUFZLEVBQ3hGQyxlQUF1QyxFQUFHO0lBRTVELE1BQU1DLE9BQU8sR0FBR1osU0FBUyxDQUF1RCxDQUFDLENBQUU7TUFFakY7TUFDQWEsb0JBQW9CLEVBQUU7UUFDcEJDLFdBQVcsRUFBRTtVQUNYQyxJQUFJLEVBQUVWO1FBQ1IsQ0FBQztRQUNEVyxnQkFBZ0IsRUFBRSxPQUFPO1FBQ3pCQyxLQUFLLEVBQUUsUUFBUTtRQUNmQyxZQUFZLEVBQUU7TUFDaEI7SUFDRixDQUFDLEVBQUVQLGVBQWdCLENBQUM7SUFFcEIsS0FBSyxDQUFFSCxhQUFhLEVBQUVDLEtBQUssRUFBRUMsS0FBSyxFQUFFRSxPQUFRLENBQUM7SUFFN0MsSUFBSSxDQUFDTyxxQkFBcUIsR0FBRyxJQUFJO0lBRWpDLElBQUksQ0FBQ0MsYUFBYSxHQUFHLElBQUlsQixhQUFhLENBQUVNLGFBQWEsRUFBRUUsS0FBSyxFQUFFRSxPQUFPLENBQUNDLG9CQUFxQixDQUFDO0lBQzVGLElBQUksQ0FBQ1EsUUFBUSxDQUFFLElBQUksQ0FBQ0QsYUFBYyxDQUFDO0lBRW5DRSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNGLGFBQWEsQ0FBQ0csTUFBTSxDQUFDQyxXQUFXLENBQUNDLE1BQU0sQ0FBRTFCLE9BQU8sQ0FBQzJCLElBQUssQ0FBQyxFQUM1RSwrRkFBZ0csQ0FBQztJQUNuRyxJQUFJLENBQUNOLGFBQWEsQ0FBQ08sTUFBTSxHQUFHLElBQUk1QixPQUFPLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQzZCLE1BQU0sR0FBRyxDQUFFLENBQUM7RUFDL0Q7O0VBRUE7QUFDRjtBQUNBO0VBQ1NDLHVCQUF1QkEsQ0FBRUMsT0FBZ0IsRUFBUztJQUN2RCxJQUFLQSxPQUFPLEtBQUssSUFBSSxDQUFDWCxxQkFBcUIsRUFBRztNQUM1QyxJQUFJLENBQUNBLHFCQUFxQixHQUFHVyxPQUFPO01BQ3BDLElBQUksQ0FBQ1YsYUFBYSxDQUFDVSxPQUFPLEdBQUdBLE9BQU87SUFDdEM7RUFDRjtFQUVBLElBQVdDLG9CQUFvQkEsQ0FBRUQsT0FBZ0IsRUFBRztJQUFFLElBQUksQ0FBQ0QsdUJBQXVCLENBQUVDLE9BQVEsQ0FBQztFQUFFO0VBRS9GLElBQVdDLG9CQUFvQkEsQ0FBQSxFQUFZO0lBQUUsT0FBTyxJQUFJLENBQUNDLHVCQUF1QixDQUFDLENBQUM7RUFBRTs7RUFFcEY7QUFDRjtBQUNBO0VBQ1NBLHVCQUF1QkEsQ0FBQSxFQUFZO0lBQ3hDLE9BQU8sSUFBSSxDQUFDYixxQkFBcUI7RUFDbkM7RUFHZ0JjLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNiLGFBQWEsQ0FBQ2EsT0FBTyxDQUFDLENBQUM7SUFDNUIsS0FBSyxDQUFDQSxPQUFPLENBQUMsQ0FBQztFQUNqQjtBQUNGO0FBRUE3QixXQUFXLENBQUM4QixRQUFRLENBQUUsZ0JBQWdCLEVBQUU1QixjQUFlLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=