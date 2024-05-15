// Copyright 2017-2023, University of Colorado Boulder

/**
 * Bounds2 tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Matrix3, { m3 } from './Matrix3.js';
import Ray2 from './Ray2.js';
import Transform3 from './Transform3.js';
import Vector2 from './Vector2.js';
QUnit.module('Transform3');
const epsilon = 1e-7;
function approximateEqual(assert, a, b, msg) {
  assert.ok(Math.abs(a - b) < epsilon, `${msg} expected: ${b}, got: ${a}`);
}
function approximateRayEqual(assert, a, b, msg) {
  assert.ok(a.position.equalsEpsilon(b.position, 0.00001) && a.direction.equalsEpsilon(b.direction, 0.00001), `${msg} expected: ${b.toString()}, got: ${a.toString()}`);
}
QUnit.test('Ray2 transforms', assert => {
  const transform = new Transform3(m3(0, -2, 5, 3, 0, 8, 0, 0, 1));
  const ray = new Ray2(new Vector2(2, 7), new Vector2(-5, 2).normalized());
  const tray = transform.transformRay2(ray);
  const iray = transform.inverseRay2(ray);
  const backOffset = transform.inversePosition2(tray.pointAtDistance(1));
  const backPos = transform.inversePosition2(tray.position);
  assert.ok(ray.direction.equalsEpsilon(backOffset.minus(backPos).normalized(), 0.00001), 'transformRay2 ray linearity');
  const forwardOffset = transform.transformPosition2(iray.pointAtDistance(1));
  const forwardPos = transform.transformPosition2(iray.position);
  assert.ok(ray.direction.equalsEpsilon(forwardOffset.minus(forwardPos).normalized(), 0.00001), 'inverseRay2 ray linearity');
  approximateRayEqual(assert, transform.inverseRay2(transform.transformRay2(ray)), ray, 'inverse correctness');
});
QUnit.test('Transform x/y', assert => {
  const t = new Transform3(m3(2, 0, 10, 0, 3, 1, 0, 0, 1));
  assert.equal(t.transformX(5), 20);
  assert.equal(t.transformY(5), 16);
  assert.equal(t.inverseX(20), 5);
  assert.equal(t.inverseY(16), 5);
  const t2 = new Transform3(Matrix3.rotation2(Math.PI / 6));
  window.assert && assert.throws(() => {
    t2.transformX(5);
  });
  window.assert && assert.throws(() => {
    t2.transformY(5);
  });
});
QUnit.test('Transform delta', assert => {
  const t1 = new Transform3(m3(2, 1, 0, -2, 5, 0, 0, 0, 1));
  const t2 = new Transform3(m3(2, 1, 52, -2, 5, -61, 0, 0, 1));
  assert.ok(t1.transformDelta2(Vector2.ZERO).equalsEpsilon(Vector2.ZERO, 1e-7), 'ensuring linearity at 0, no translation');
  assert.ok(t2.transformDelta2(Vector2.ZERO).equalsEpsilon(Vector2.ZERO, 1e-7), 'ensuring linearity at 0, with translation');
  assert.ok(t1.transformDelta2(new Vector2(2, -3)).equalsEpsilon(new Vector2(1, -19), 1e-7), 'basic delta check, no translation');
  assert.ok(t2.transformDelta2(new Vector2(2, -3)).equalsEpsilon(new Vector2(1, -19), 1e-7), 'basic delta check, with translation');
  const v = new Vector2(-71, 27);
  assert.ok(t1.inverseDelta2(t1.transformDelta2(v)).equalsEpsilon(v, 1e-7), 'inverse check, no translation');
  assert.ok(t2.inverseDelta2(t2.transformDelta2(v)).equalsEpsilon(v, 1e-7), 'inverse check, with translation');
});
QUnit.test('Transform delta x/y', assert => {
  const t = new Transform3(m3(2, 0, 52, 0, 5, -61, 0, 0, 1));
  approximateEqual(assert, t.transformDeltaX(1), 2, 'deltaX');
  approximateEqual(assert, t.transformDeltaY(1), 5, 'deltaY');
  approximateEqual(assert, t.transformDeltaX(71), t.transformDelta2(new Vector2(71, 27)).x, 'deltaX check vs transformDelta');
  approximateEqual(assert, t.transformDeltaY(27), t.transformDelta2(new Vector2(71, 27)).y, 'deltaY check vs transformDelta');
  const v = new Vector2(-71, 27);
  approximateEqual(assert, t.inverseDeltaX(t.transformDeltaX(v.x)), v.x, 'inverse check X');
  approximateEqual(assert, t.inverseDeltaY(t.transformDeltaY(v.y)), v.y, 'inverse check Y');
});
QUnit.test('Transform setMatrix ensuring matrix instance equivalence', assert => {
  const t = new Transform3();
  const m = t.getMatrix();
  t.setMatrix(m3(1, 2, 3, 4, 5, 6, 7, 8, 9));
  assert.equal(t.getMatrix(), m);
  assert.equal(t.getMatrix().m00(), 1);
  assert.equal(t.getMatrix().m01(), 2);
  t.setMatrix(m3(9, 8, 7, 6, 5, 4, 3, 2, 1));
  assert.equal(t.getMatrix(), m);
  assert.equal(t.getMatrix().m00(), 9);
  assert.equal(t.getMatrix().m01(), 8);
});
QUnit.test('Transform event firing', assert => {
  const t = new Transform3();
  let count = 0;
  t.changeEmitter.addListener(assert => {
    count += 1;
  });
  assert.equal(count, 0);
  t.setMatrix(Matrix3.rotation2(Math.PI / 2));
  assert.equal(count, 1);
  t.prepend(Matrix3.rotation2(Math.PI / 2));
  assert.equal(count, 2);
  t.prependTranslation(1, 2);
  assert.equal(count, 3);
  t.append(Matrix3.rotation2(Math.PI / 2));
  assert.equal(count, 4);
});
QUnit.test('Transform inverse validation', assert => {
  const t = new Transform3();
  assert.ok(t.transformPosition2(new Vector2(2, 4)).equals(new Vector2(2, 4)));
  assert.ok(t.inversePosition2(new Vector2(2, 4)).equals(new Vector2(2, 4)));
  t.getMatrix().setToScale(4, 2);
  t.invalidate();
  assert.ok(t.transformPosition2(new Vector2(2, 4)).equals(new Vector2(8, 8)));
  assert.ok(t.inversePosition2(new Vector2(2, 4)).equals(new Vector2(0.5, 2)));
  t.append(Matrix3.rotation2(Math.PI / 2));
  assert.ok(t.transformPosition2(new Vector2(2, 4)).equalsEpsilon(new Vector2(-16, 4), epsilon));
  assert.ok(t.inversePosition2(new Vector2(2, 4)).equalsEpsilon(new Vector2(2, -0.5), epsilon));
});
QUnit.test('transform creation and setting', assert => {
  const t = new Transform3();
  t.append(Matrix3.rotation2(Math.PI));
  assert.ok(true, 'so we have at least 1 test in this set');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXgzIiwibTMiLCJSYXkyIiwiVHJhbnNmb3JtMyIsIlZlY3RvcjIiLCJRVW5pdCIsIm1vZHVsZSIsImVwc2lsb24iLCJhcHByb3hpbWF0ZUVxdWFsIiwiYXNzZXJ0IiwiYSIsImIiLCJtc2ciLCJvayIsIk1hdGgiLCJhYnMiLCJhcHByb3hpbWF0ZVJheUVxdWFsIiwicG9zaXRpb24iLCJlcXVhbHNFcHNpbG9uIiwiZGlyZWN0aW9uIiwidG9TdHJpbmciLCJ0ZXN0IiwidHJhbnNmb3JtIiwicmF5Iiwibm9ybWFsaXplZCIsInRyYXkiLCJ0cmFuc2Zvcm1SYXkyIiwiaXJheSIsImludmVyc2VSYXkyIiwiYmFja09mZnNldCIsImludmVyc2VQb3NpdGlvbjIiLCJwb2ludEF0RGlzdGFuY2UiLCJiYWNrUG9zIiwibWludXMiLCJmb3J3YXJkT2Zmc2V0IiwidHJhbnNmb3JtUG9zaXRpb24yIiwiZm9yd2FyZFBvcyIsInQiLCJlcXVhbCIsInRyYW5zZm9ybVgiLCJ0cmFuc2Zvcm1ZIiwiaW52ZXJzZVgiLCJpbnZlcnNlWSIsInQyIiwicm90YXRpb24yIiwiUEkiLCJ3aW5kb3ciLCJ0aHJvd3MiLCJ0MSIsInRyYW5zZm9ybURlbHRhMiIsIlpFUk8iLCJ2IiwiaW52ZXJzZURlbHRhMiIsInRyYW5zZm9ybURlbHRhWCIsInRyYW5zZm9ybURlbHRhWSIsIngiLCJ5IiwiaW52ZXJzZURlbHRhWCIsImludmVyc2VEZWx0YVkiLCJtIiwiZ2V0TWF0cml4Iiwic2V0TWF0cml4IiwibTAwIiwibTAxIiwiY291bnQiLCJjaGFuZ2VFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJwcmVwZW5kIiwicHJlcGVuZFRyYW5zbGF0aW9uIiwiYXBwZW5kIiwiZXF1YWxzIiwic2V0VG9TY2FsZSIsImludmFsaWRhdGUiXSwic291cmNlcyI6WyJUcmFuc2Zvcm0zVGVzdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQm91bmRzMiB0ZXN0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBNYXRyaXgzLCB7IG0zIH0gZnJvbSAnLi9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFJheTIgZnJvbSAnLi9SYXkyLmpzJztcclxuaW1wb3J0IFRyYW5zZm9ybTMgZnJvbSAnLi9UcmFuc2Zvcm0zLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi9WZWN0b3IyLmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ1RyYW5zZm9ybTMnICk7XHJcblxyXG5jb25zdCBlcHNpbG9uID0gMWUtNztcclxuXHJcbmZ1bmN0aW9uIGFwcHJveGltYXRlRXF1YWwoIGFzc2VydCwgYSwgYiwgbXNnICkge1xyXG4gIGFzc2VydC5vayggTWF0aC5hYnMoIGEgLSBiICkgPCBlcHNpbG9uLCBgJHttc2d9IGV4cGVjdGVkOiAke2J9LCBnb3Q6ICR7YX1gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcHJveGltYXRlUmF5RXF1YWwoIGFzc2VydCwgYSwgYiwgbXNnICkge1xyXG4gIGFzc2VydC5vayggYS5wb3NpdGlvbi5lcXVhbHNFcHNpbG9uKCBiLnBvc2l0aW9uLCAwLjAwMDAxICkgJiYgYS5kaXJlY3Rpb24uZXF1YWxzRXBzaWxvbiggYi5kaXJlY3Rpb24sIDAuMDAwMDEgKSwgYCR7bXNnfSBleHBlY3RlZDogJHtiLnRvU3RyaW5nKCl9LCBnb3Q6ICR7YS50b1N0cmluZygpfWAgKTtcclxufVxyXG5cclxuUVVuaXQudGVzdCggJ1JheTIgdHJhbnNmb3JtcycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybTMoIG0zKCAwLCAtMiwgNSwgMywgMCwgOCwgMCwgMCwgMSApICk7XHJcbiAgY29uc3QgcmF5ID0gbmV3IFJheTIoIG5ldyBWZWN0b3IyKCAyLCA3ICksIG5ldyBWZWN0b3IyKCAtNSwgMiApLm5vcm1hbGl6ZWQoKSApO1xyXG5cclxuICBjb25zdCB0cmF5ID0gdHJhbnNmb3JtLnRyYW5zZm9ybVJheTIoIHJheSApO1xyXG4gIGNvbnN0IGlyYXkgPSB0cmFuc2Zvcm0uaW52ZXJzZVJheTIoIHJheSApO1xyXG5cclxuICBjb25zdCBiYWNrT2Zmc2V0ID0gdHJhbnNmb3JtLmludmVyc2VQb3NpdGlvbjIoIHRyYXkucG9pbnRBdERpc3RhbmNlKCAxICkgKTtcclxuICBjb25zdCBiYWNrUG9zID0gdHJhbnNmb3JtLmludmVyc2VQb3NpdGlvbjIoIHRyYXkucG9zaXRpb24gKTtcclxuICBhc3NlcnQub2soIHJheS5kaXJlY3Rpb24uZXF1YWxzRXBzaWxvbiggYmFja09mZnNldC5taW51cyggYmFja1BvcyApLm5vcm1hbGl6ZWQoKSwgMC4wMDAwMSApLCAndHJhbnNmb3JtUmF5MiByYXkgbGluZWFyaXR5JyApO1xyXG5cclxuICBjb25zdCBmb3J3YXJkT2Zmc2V0ID0gdHJhbnNmb3JtLnRyYW5zZm9ybVBvc2l0aW9uMiggaXJheS5wb2ludEF0RGlzdGFuY2UoIDEgKSApO1xyXG4gIGNvbnN0IGZvcndhcmRQb3MgPSB0cmFuc2Zvcm0udHJhbnNmb3JtUG9zaXRpb24yKCBpcmF5LnBvc2l0aW9uICk7XHJcbiAgYXNzZXJ0Lm9rKCByYXkuZGlyZWN0aW9uLmVxdWFsc0Vwc2lsb24oIGZvcndhcmRPZmZzZXQubWludXMoIGZvcndhcmRQb3MgKS5ub3JtYWxpemVkKCksIDAuMDAwMDEgKSwgJ2ludmVyc2VSYXkyIHJheSBsaW5lYXJpdHknICk7XHJcblxyXG4gIGFwcHJveGltYXRlUmF5RXF1YWwoIGFzc2VydCwgdHJhbnNmb3JtLmludmVyc2VSYXkyKCB0cmFuc2Zvcm0udHJhbnNmb3JtUmF5MiggcmF5ICkgKSwgcmF5LCAnaW52ZXJzZSBjb3JyZWN0bmVzcycgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RyYW5zZm9ybSB4L3knLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHQgPSBuZXcgVHJhbnNmb3JtMyggbTMoIDIsIDAsIDEwLCAwLCAzLCAxLCAwLCAwLCAxICkgKTtcclxuICBhc3NlcnQuZXF1YWwoIHQudHJhbnNmb3JtWCggNSApLCAyMCApO1xyXG4gIGFzc2VydC5lcXVhbCggdC50cmFuc2Zvcm1ZKCA1ICksIDE2ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0LmludmVyc2VYKCAyMCApLCA1ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0LmludmVyc2VZKCAxNiApLCA1ICk7XHJcblxyXG4gIGNvbnN0IHQyID0gbmV3IFRyYW5zZm9ybTMoIE1hdHJpeDMucm90YXRpb24yKCBNYXRoLlBJIC8gNiApICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICB0Mi50cmFuc2Zvcm1YKCA1ICk7XHJcbiAgfSApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgdDIudHJhbnNmb3JtWSggNSApO1xyXG4gIH0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RyYW5zZm9ybSBkZWx0YScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgdDEgPSBuZXcgVHJhbnNmb3JtMyggbTMoIDIsIDEsIDAsIC0yLCA1LCAwLCAwLCAwLCAxICkgKTtcclxuICBjb25zdCB0MiA9IG5ldyBUcmFuc2Zvcm0zKCBtMyggMiwgMSwgNTIsIC0yLCA1LCAtNjEsIDAsIDAsIDEgKSApO1xyXG5cclxuICBhc3NlcnQub2soIHQxLnRyYW5zZm9ybURlbHRhMiggVmVjdG9yMi5aRVJPICkuZXF1YWxzRXBzaWxvbiggVmVjdG9yMi5aRVJPLCAxZS03ICksICdlbnN1cmluZyBsaW5lYXJpdHkgYXQgMCwgbm8gdHJhbnNsYXRpb24nICk7XHJcbiAgYXNzZXJ0Lm9rKCB0Mi50cmFuc2Zvcm1EZWx0YTIoIFZlY3RvcjIuWkVSTyApLmVxdWFsc0Vwc2lsb24oIFZlY3RvcjIuWkVSTywgMWUtNyApLCAnZW5zdXJpbmcgbGluZWFyaXR5IGF0IDAsIHdpdGggdHJhbnNsYXRpb24nICk7XHJcblxyXG4gIGFzc2VydC5vayggdDEudHJhbnNmb3JtRGVsdGEyKCBuZXcgVmVjdG9yMiggMiwgLTMgKSApLmVxdWFsc0Vwc2lsb24oIG5ldyBWZWN0b3IyKCAxLCAtMTkgKSwgMWUtNyApLCAnYmFzaWMgZGVsdGEgY2hlY2ssIG5vIHRyYW5zbGF0aW9uJyApO1xyXG4gIGFzc2VydC5vayggdDIudHJhbnNmb3JtRGVsdGEyKCBuZXcgVmVjdG9yMiggMiwgLTMgKSApLmVxdWFsc0Vwc2lsb24oIG5ldyBWZWN0b3IyKCAxLCAtMTkgKSwgMWUtNyApLCAnYmFzaWMgZGVsdGEgY2hlY2ssIHdpdGggdHJhbnNsYXRpb24nICk7XHJcblxyXG4gIGNvbnN0IHYgPSBuZXcgVmVjdG9yMiggLTcxLCAyNyApO1xyXG4gIGFzc2VydC5vayggdDEuaW52ZXJzZURlbHRhMiggdDEudHJhbnNmb3JtRGVsdGEyKCB2ICkgKS5lcXVhbHNFcHNpbG9uKCB2LCAxZS03ICksICdpbnZlcnNlIGNoZWNrLCBubyB0cmFuc2xhdGlvbicgKTtcclxuICBhc3NlcnQub2soIHQyLmludmVyc2VEZWx0YTIoIHQyLnRyYW5zZm9ybURlbHRhMiggdiApICkuZXF1YWxzRXBzaWxvbiggdiwgMWUtNyApLCAnaW52ZXJzZSBjaGVjaywgd2l0aCB0cmFuc2xhdGlvbicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RyYW5zZm9ybSBkZWx0YSB4L3knLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHQgPSBuZXcgVHJhbnNmb3JtMyggbTMoIDIsIDAsIDUyLCAwLCA1LCAtNjEsIDAsIDAsIDEgKSApO1xyXG5cclxuICBhcHByb3hpbWF0ZUVxdWFsKCBhc3NlcnQsIHQudHJhbnNmb3JtRGVsdGFYKCAxICksIDIsICdkZWx0YVgnICk7XHJcbiAgYXBwcm94aW1hdGVFcXVhbCggYXNzZXJ0LCB0LnRyYW5zZm9ybURlbHRhWSggMSApLCA1LCAnZGVsdGFZJyApO1xyXG5cclxuICBhcHByb3hpbWF0ZUVxdWFsKCBhc3NlcnQsIHQudHJhbnNmb3JtRGVsdGFYKCA3MSApLCB0LnRyYW5zZm9ybURlbHRhMiggbmV3IFZlY3RvcjIoIDcxLCAyNyApICkueCwgJ2RlbHRhWCBjaGVjayB2cyB0cmFuc2Zvcm1EZWx0YScgKTtcclxuICBhcHByb3hpbWF0ZUVxdWFsKCBhc3NlcnQsIHQudHJhbnNmb3JtRGVsdGFZKCAyNyApLCB0LnRyYW5zZm9ybURlbHRhMiggbmV3IFZlY3RvcjIoIDcxLCAyNyApICkueSwgJ2RlbHRhWSBjaGVjayB2cyB0cmFuc2Zvcm1EZWx0YScgKTtcclxuXHJcbiAgY29uc3QgdiA9IG5ldyBWZWN0b3IyKCAtNzEsIDI3ICk7XHJcbiAgYXBwcm94aW1hdGVFcXVhbCggYXNzZXJ0LCB0LmludmVyc2VEZWx0YVgoIHQudHJhbnNmb3JtRGVsdGFYKCB2LnggKSApLCB2LngsICdpbnZlcnNlIGNoZWNrIFgnICk7XHJcbiAgYXBwcm94aW1hdGVFcXVhbCggYXNzZXJ0LCB0LmludmVyc2VEZWx0YVkoIHQudHJhbnNmb3JtRGVsdGFZKCB2LnkgKSApLCB2LnksICdpbnZlcnNlIGNoZWNrIFknICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUcmFuc2Zvcm0gc2V0TWF0cml4IGVuc3VyaW5nIG1hdHJpeCBpbnN0YW5jZSBlcXVpdmFsZW5jZScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgdCA9IG5ldyBUcmFuc2Zvcm0zKCk7XHJcblxyXG4gIGNvbnN0IG0gPSB0LmdldE1hdHJpeCgpO1xyXG5cclxuICB0LnNldE1hdHJpeCggbTMoIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDkgKSApO1xyXG4gIGFzc2VydC5lcXVhbCggdC5nZXRNYXRyaXgoKSwgbSApO1xyXG4gIGFzc2VydC5lcXVhbCggdC5nZXRNYXRyaXgoKS5tMDAoKSwgMSApO1xyXG4gIGFzc2VydC5lcXVhbCggdC5nZXRNYXRyaXgoKS5tMDEoKSwgMiApO1xyXG4gIHQuc2V0TWF0cml4KCBtMyggOSwgOCwgNywgNiwgNSwgNCwgMywgMiwgMSApICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0LmdldE1hdHJpeCgpLCBtICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0LmdldE1hdHJpeCgpLm0wMCgpLCA5ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0LmdldE1hdHJpeCgpLm0wMSgpLCA4ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUcmFuc2Zvcm0gZXZlbnQgZmlyaW5nJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCB0ID0gbmV3IFRyYW5zZm9ybTMoKTtcclxuXHJcbiAgbGV0IGNvdW50ID0gMDtcclxuXHJcbiAgdC5jaGFuZ2VFbWl0dGVyLmFkZExpc3RlbmVyKCBhc3NlcnQgPT4geyBjb3VudCArPSAxOyB9ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjb3VudCwgMCApO1xyXG4gIHQuc2V0TWF0cml4KCBNYXRyaXgzLnJvdGF0aW9uMiggTWF0aC5QSSAvIDIgKSApO1xyXG4gIGFzc2VydC5lcXVhbCggY291bnQsIDEgKTtcclxuICB0LnByZXBlbmQoIE1hdHJpeDMucm90YXRpb24yKCBNYXRoLlBJIC8gMiApICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjb3VudCwgMiApO1xyXG4gIHQucHJlcGVuZFRyYW5zbGF0aW9uKCAxLCAyICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjb3VudCwgMyApO1xyXG4gIHQuYXBwZW5kKCBNYXRyaXgzLnJvdGF0aW9uMiggTWF0aC5QSSAvIDIgKSApO1xyXG4gIGFzc2VydC5lcXVhbCggY291bnQsIDQgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RyYW5zZm9ybSBpbnZlcnNlIHZhbGlkYXRpb24nLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHQgPSBuZXcgVHJhbnNmb3JtMygpO1xyXG5cclxuICBhc3NlcnQub2soIHQudHJhbnNmb3JtUG9zaXRpb24yKCBuZXcgVmVjdG9yMiggMiwgNCApICkuZXF1YWxzKCBuZXcgVmVjdG9yMiggMiwgNCApICkgKTtcclxuICBhc3NlcnQub2soIHQuaW52ZXJzZVBvc2l0aW9uMiggbmV3IFZlY3RvcjIoIDIsIDQgKSApLmVxdWFscyggbmV3IFZlY3RvcjIoIDIsIDQgKSApICk7XHJcbiAgdC5nZXRNYXRyaXgoKS5zZXRUb1NjYWxlKCA0LCAyICk7XHJcbiAgdC5pbnZhbGlkYXRlKCk7XHJcbiAgYXNzZXJ0Lm9rKCB0LnRyYW5zZm9ybVBvc2l0aW9uMiggbmV3IFZlY3RvcjIoIDIsIDQgKSApLmVxdWFscyggbmV3IFZlY3RvcjIoIDgsIDggKSApICk7XHJcbiAgYXNzZXJ0Lm9rKCB0LmludmVyc2VQb3NpdGlvbjIoIG5ldyBWZWN0b3IyKCAyLCA0ICkgKS5lcXVhbHMoIG5ldyBWZWN0b3IyKCAwLjUsIDIgKSApICk7XHJcbiAgdC5hcHBlbmQoIE1hdHJpeDMucm90YXRpb24yKCBNYXRoLlBJIC8gMiApICk7XHJcbiAgYXNzZXJ0Lm9rKCB0LnRyYW5zZm9ybVBvc2l0aW9uMiggbmV3IFZlY3RvcjIoIDIsIDQgKSApLmVxdWFsc0Vwc2lsb24oIG5ldyBWZWN0b3IyKCAtMTYsIDQgKSwgZXBzaWxvbiApICk7XHJcbiAgYXNzZXJ0Lm9rKCB0LmludmVyc2VQb3NpdGlvbjIoIG5ldyBWZWN0b3IyKCAyLCA0ICkgKS5lcXVhbHNFcHNpbG9uKCBuZXcgVmVjdG9yMiggMiwgLTAuNSApLCBlcHNpbG9uICkgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3RyYW5zZm9ybSBjcmVhdGlvbiBhbmQgc2V0dGluZycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgdCA9IG5ldyBUcmFuc2Zvcm0zKCk7XHJcbiAgdC5hcHBlbmQoIE1hdHJpeDMucm90YXRpb24yKCBNYXRoLlBJICkgKTtcclxuICBhc3NlcnQub2soIHRydWUsICdzbyB3ZSBoYXZlIGF0IGxlYXN0IDEgdGVzdCBpbiB0aGlzIHNldCcgKTtcclxufSApOyJdLCJt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U0FBUyxDQUFDLENBQUM7RUFFdkJ2QixDQUFDLENBQUN3QixTQUFTLENBQUU1RCxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUUsQ0FBQztFQUM5Q1EsTUFBTSxDQUFDNkIsS0FBSyxDQUFFRCxDQUFDLENBQUN1QixTQUFTLENBQUMsQ0FBQyxFQUFFRCxDQUFFLENBQUM7RUFDaENsRCxNQUFNLENBQUM2QixLQUFLLENBQUVELENBQUMsQ0FBQ3VCLFNBQVMsQ0FBQyxDQUFDLENBQUNFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ3RDckQsTUFBTSxDQUFDNkIsS0FBSyxDQUFFRCxDQUFDLENBQUN1QixTQUFTLENBQUMsQ0FBQyxDQUFDRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUUsQ0FBQztFQUN0QzFCLENBQUMsQ0FBQ3dCLFNBQVMsQ0FBRTVELEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBRSxDQUFDO0VBQzlDUSxNQUFNLENBQUM2QixLQUFLLENBQUVELENBQUMsQ0FBQ3VCLFNBQVMsQ0FBQyxDQUFDLEVBQUVELENBQUUsQ0FBQztFQUNoQ2xELE1BQU0sQ0FBQzZCLEtBQUssQ0FBRUQsQ0FBQyxDQUFDdUIsU0FBUyxDQUFDLENBQUMsQ0FBQ0UsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDdENyRCxNQUFNLENBQUM2QixLQUFLLENBQUVELENBQUMsQ0FBQ3VCLFNBQVMsQ0FBQyxDQUFDLENBQUNHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQ3hDLENBQUUsQ0FBQztBQUVIMUQsS0FBSyxDQUFDZ0IsSUFBSSxDQUFFLHdCQUF3QixFQUFFWixNQUFNLElBQUk7RUFDOUMsTUFBTTRCLENBQUMsR0FB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