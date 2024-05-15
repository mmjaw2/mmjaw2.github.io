// Copyright 2017-2024, University of Colorado Boulder

/**
 * Complex.js tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Complex from './Complex.js';
QUnit.module('Complex');
function approximateComplexEquals(assert, a, b, msg) {
  const epsilon = 0.00001;
  assert.ok(a.equalsEpsilon(b, epsilon), `${msg} expected: ${b.toString()}, result: ${a.toString()}`);
}
QUnit.test('Basic', assert => {
  const c = new Complex(2, 3);
  assert.equal(c.real, 2, 'real');
  assert.equal(c.imaginary, 3, 'imaginary');
  assert.equal(c.conjugated().real, 2, 'real conjugated');
  assert.equal(c.conjugated().imaginary, -3, 'imaginary conjugated');
});
QUnit.test('Multiplication', assert => {
  approximateComplexEquals(assert, new Complex(2, 3).times(new Complex(7, -13)), new Complex(53, -5), 'Multiplication');
});
QUnit.test('Division', assert => {
  approximateComplexEquals(assert, new Complex(2, 3).dividedBy(new Complex(7, -13)), new Complex(-25 / 218, 47 / 218), 'Division');
});
QUnit.test('Canceling', assert => {
  const a = new Complex(2, -3);
  const b = new Complex(7, 13);
  approximateComplexEquals(assert, a.times(b).dividedBy(b), a, 'Canceling');
});
QUnit.test('Square root', assert => {
  approximateComplexEquals(assert, new Complex(3, 4).sqrtOf(), new Complex(2, 1), 'Division');
  approximateComplexEquals(assert, new Complex(3, -4).sqrtOf(), new Complex(2, -1), 'Division');
  const c = new Complex(2.5, -7.1);
  approximateComplexEquals(assert, c.sqrtOf().times(c.sqrtOf()), c);
  const cc = c.plus(c);
  new Complex(cc.x, cc.y).sqrtOf();
});
QUnit.test('Exponentiation', assert => {
  approximateComplexEquals(assert, new Complex(2, -3).exponentiated(), new Complex(-7.31511, -1.04274), 'Exponentiation');
});
QUnit.test('Cos of', assert => {
  const a = new Complex(1, 1);
  const b = new Complex(0.8337300251311491, -0.9888977057628651);
  approximateComplexEquals(assert, a.cosOf(), b, 'Cos Of');
});
QUnit.test('Sin of', assert => {
  const a = new Complex(1, 1);
  const b = new Complex(1.29845758, 0.634963914);
  approximateComplexEquals(assert, a.sinOf(), b, 'Sin Of');
});
QUnit.test('getCubeRoots', assert => {
  const actual = new Complex(0, 8).getCubeRoots();
  const expected = [new Complex(Math.sqrt(3), 1), new Complex(-Math.sqrt(3), 1), new Complex(0, -2)];
  approximateComplexEquals(assert, expected[0], actual[0], 'root 1');
  approximateComplexEquals(assert, expected[1], actual[1], 'root 2');
  approximateComplexEquals(assert, expected[2], actual[2], 'root 3');
});
QUnit.test('linear roots', assert => {
  approximateComplexEquals(assert, Complex.real(-2), Complex.solveLinearRoots(Complex.real(3), Complex.real(6))[0], '3x + 6 = 0  //  x=-2');
  approximateComplexEquals(assert, new Complex(-2, -1), Complex.solveLinearRoots(Complex.real(3), new Complex(6, 3))[0], '3x + 6 + 3i = 0  //  x=-2-i');
  approximateComplexEquals(assert, Complex.real(-3), Complex.solveLinearRoots(new Complex(2, 1), new Complex(6, 3))[0], '(2 + i)x + 6 + 3i = 0  //  x=-3');
});
QUnit.test('quadratic roots 0', assert => {
  const roots0 = Complex.solveQuadraticRoots(Complex.real(1), Complex.real(-3), Complex.real(2));
  const roots0_0 = Complex.real(2);
  const roots0_1 = Complex.real(1);
  approximateComplexEquals(assert, roots0[0], roots0_0, 'x^2 - 3x + 2 = 0  //  x=2 case');
  approximateComplexEquals(assert, roots0[1], roots0_1, 'x^2 - 3x + 2 = 0  //  x=1 case');
});
QUnit.test('quadratic roots 1', assert => {
  const roots1 = Complex.solveQuadraticRoots(Complex.real(2), Complex.real(8), Complex.real(8));
  const roots1_x = Complex.real(-2);
  approximateComplexEquals(assert, roots1[0], roots1_x, '8x^2 + 8x + 2 = 0  //  x=-2 case (first)');
  approximateComplexEquals(assert, roots1[1], roots1_x, '8x^2 + 8x + 2 = 0  //  x=-2 case (second)');
});
QUnit.test('quadratic roots 2', assert => {
  const roots2 = Complex.solveQuadraticRoots(Complex.real(1), Complex.real(0), Complex.real(-2));
  const roots2_0 = Complex.real(Math.sqrt(2));
  const roots2_1 = Complex.real(-Math.sqrt(2));
  approximateComplexEquals(assert, roots2[0], roots2_0, 'x^2 - 2 = 0  //  x=sqrt(2) case');
  approximateComplexEquals(assert, roots2[1], roots2_1, 'x^2 - 2 = 0  //  x=-sqrt(2) case');
});
QUnit.test('quadratic roots 3', assert => {
  const roots3 = Complex.solveQuadraticRoots(Complex.real(1), Complex.real(-2), Complex.real(2));
  const roots3_0 = new Complex(1, 1);
  const roots3_1 = new Complex(1, -1);
  approximateComplexEquals(assert, roots3[0], roots3_0, 'x^2 - 2x + 2 = 0  //  x=1+i case');
  approximateComplexEquals(assert, roots3[1], roots3_1, 'x^2 - 2x + 2 = 0  //  x=1-i case');
});
QUnit.test('quadratic roots 4', assert => {
  const roots4 = Complex.solveQuadraticRoots(Complex.real(1), new Complex(-3, -2), new Complex(1, 3));
  const roots4_0 = new Complex(2, 1);
  const roots4_1 = new Complex(1, 1);
  approximateComplexEquals(assert, roots4[0], roots4_0, '(1 + 3i)x^2 + (-3 - 2i)x + 1 = 0  //  x=2+i case');
  approximateComplexEquals(assert, roots4[1], roots4_1, '(1 + 3i)x^2 + (-3 - 2i)x + 1 = 0  //  x=1+i case');
});
QUnit.test('cubic roots 0', assert => {
  const roots = Complex.solveCubicRoots(Complex.real(1), Complex.real(-6), Complex.real(11), Complex.real(-6));
  const roots_0 = Complex.real(1);
  const roots_1 = Complex.real(3);
  const roots_2 = Complex.real(2);
  approximateComplexEquals(assert, roots[0], roots_0, 'x^3 - 6x^2 + 11x - 6 = 0  //  x=1 case');
  approximateComplexEquals(assert, roots[1], roots_1, 'x^3 - 6x^2 + 11x - 6 = 0  //  x=3 case');
  approximateComplexEquals(assert, roots[2], roots_2, 'x^3 - 6x^2 + 11x - 6 = 0  //  x=2 case');
});
QUnit.test('cubic roots 1', assert => {
  const roots = Complex.solveCubicRoots(Complex.real(1), Complex.real(0), Complex.real(0), Complex.real(-8));
  const roots_0 = new Complex(-1, -Math.sqrt(3));
  const roots_1 = Complex.real(2);
  const roots_2 = new Complex(-1, Math.sqrt(3));
  approximateComplexEquals(assert, roots[0], roots_0, 'x^3 - 8 = 0  //  x=-1-sqrt(3)i case');
  approximateComplexEquals(assert, roots[1], roots_1, 'x^3 - 8 = 0  //  x=2 case');
  approximateComplexEquals(assert, roots[2], roots_2, 'x^3 - 8 = 0  //  x=-1+sqrt(3)i case');
});
QUnit.test('cubic roots 2', assert => {
  const roots = Complex.solveCubicRoots(Complex.real(2), Complex.real(8), Complex.real(8), Complex.real(0));
  const roots_0 = Complex.real(0);
  const roots_1 = Complex.real(-2);
  const roots_2 = Complex.real(-2);
  approximateComplexEquals(assert, roots[0], roots_0, '2x^3 + 8x^2 + 8x = 0  //  x=0');
  approximateComplexEquals(assert, roots[1], roots_1, '2x^3 + 8x^2 + 8x = 0  //  x=-2 case');
  approximateComplexEquals(assert, roots[2], roots_2, '2x^3 + 8x^2 + 8x = 0  //  x=-2 case');
});
QUnit.test('cubic roots 3', assert => {
  const roots = Complex.solveCubicRoots(Complex.real(1), Complex.real(1), Complex.real(1), Complex.real(1));
  const roots_0 = Complex.real(-1);
  const roots_1 = new Complex(0, -1);
  const roots_2 = new Complex(0, 1);
  approximateComplexEquals(assert, roots[0], roots_0, 'x^3 + x^2 + x + 1 = 0  //  x=-1');
  approximateComplexEquals(assert, roots[1], roots_1, 'x^3 + x^2 + x + 1 = 0  //  x=-i case');
  approximateComplexEquals(assert, roots[2], roots_2, 'x^3 + x^2 + x + 1 = 0  //  x=i case');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDb21wbGV4IiwiUVVuaXQiLCJtb2R1bGUiLCJhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMiLCJhc3NlcnQiLCJhIiwiYiIsIm1zZyIsImVwc2lsb24iLCJvayIsImVxdWFsc0Vwc2lsb24iLCJ0b1N0cmluZyIsInRlc3QiLCJjIiwiZXF1YWwiLCJyZWFsIiwiaW1hZ2luYXJ5IiwiY29uanVnYXRlZCIsInRpbWVzIiwiZGl2aWRlZEJ5Iiwic3FydE9mIiwiY2MiLCJwbHVzIiwieCIsInkiLCJleHBvbmVudGlhdGVkIiwiY29zT2YiLCJzaW5PZiIsImFjdHVhbCIsImdldEN1YmVSb290cyIsImV4cGVjdGVkIiwiTWF0aCIsInNxcnQiLCJzb2x2ZUxpbmVhclJvb3RzIiwicm9vdHMwIiwic29sdmVRdWFkcmF0aWNSb290cyIsInJvb3RzMF8wIiwicm9vdHMwXzEiLCJyb290czEiLCJyb290czFfeCIsInJvb3RzMiIsInJvb3RzMl8wIiwicm9vdHMyXzEiLCJyb290czMiLCJyb290czNfMCIsInJvb3RzM18xIiwicm9vdHM0Iiwicm9vdHM0XzAiLCJyb290czRfMSIsInJvb3RzIiwic29sdmVDdWJpY1Jvb3RzIiwicm9vdHNfMCIsInJvb3RzXzEiLCJyb290c18yIl0sInNvdXJjZXMiOlsiQ29tcGxleFRlc3RzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbXBsZXguanMgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQ29tcGxleCBmcm9tICcuL0NvbXBsZXguanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnQ29tcGxleCcgKTtcclxuXHJcbmZ1bmN0aW9uIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCBhLCBiLCBtc2cgKSB7XHJcbiAgY29uc3QgZXBzaWxvbiA9IDAuMDAwMDE7XHJcbiAgYXNzZXJ0Lm9rKCBhLmVxdWFsc0Vwc2lsb24oIGIsIGVwc2lsb24gKSwgYCR7bXNnfSBleHBlY3RlZDogJHtiLnRvU3RyaW5nKCl9LCByZXN1bHQ6ICR7YS50b1N0cmluZygpfWAgKTtcclxufVxyXG5cclxuUVVuaXQudGVzdCggJ0Jhc2ljJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBjID0gbmV3IENvbXBsZXgoIDIsIDMgKTtcclxuICBhc3NlcnQuZXF1YWwoIGMucmVhbCwgMiwgJ3JlYWwnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjLmltYWdpbmFyeSwgMywgJ2ltYWdpbmFyeScgKTtcclxuICBhc3NlcnQuZXF1YWwoIGMuY29uanVnYXRlZCgpLnJlYWwsIDIsICdyZWFsIGNvbmp1Z2F0ZWQnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjLmNvbmp1Z2F0ZWQoKS5pbWFnaW5hcnksIC0zLCAnaW1hZ2luYXJ5IGNvbmp1Z2F0ZWQnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdNdWx0aXBsaWNhdGlvbicsIGFzc2VydCA9PiB7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIG5ldyBDb21wbGV4KCAyLCAzICkudGltZXMoIG5ldyBDb21wbGV4KCA3LCAtMTMgKSApLCBuZXcgQ29tcGxleCggNTMsIC01ICksICdNdWx0aXBsaWNhdGlvbicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0RpdmlzaW9uJywgYXNzZXJ0ID0+IHtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgbmV3IENvbXBsZXgoIDIsIDMgKS5kaXZpZGVkQnkoIG5ldyBDb21wbGV4KCA3LCAtMTMgKSApLCBuZXcgQ29tcGxleCggLTI1IC8gMjE4LCA0NyAvIDIxOCApLCAnRGl2aXNpb24nICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdDYW5jZWxpbmcnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGEgPSBuZXcgQ29tcGxleCggMiwgLTMgKTtcclxuICBjb25zdCBiID0gbmV3IENvbXBsZXgoIDcsIDEzICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIGEudGltZXMoIGIgKS5kaXZpZGVkQnkoIGIgKSwgYSwgJ0NhbmNlbGluZycgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1NxdWFyZSByb290JywgYXNzZXJ0ID0+IHtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgbmV3IENvbXBsZXgoIDMsIDQgKS5zcXJ0T2YoKSwgbmV3IENvbXBsZXgoIDIsIDEgKSwgJ0RpdmlzaW9uJyApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCBuZXcgQ29tcGxleCggMywgLTQgKS5zcXJ0T2YoKSwgbmV3IENvbXBsZXgoIDIsIC0xICksICdEaXZpc2lvbicgKTtcclxuXHJcbiAgY29uc3QgYyA9IG5ldyBDb21wbGV4KCAyLjUsIC03LjEgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgYy5zcXJ0T2YoKS50aW1lcyggYy5zcXJ0T2YoKSApLCBjICk7XHJcblxyXG4gIGNvbnN0IGNjID0gYy5wbHVzKCBjICk7XHJcbiAgbmV3IENvbXBsZXgoIGNjLngsIGNjLnkgKS5zcXJ0T2YoKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0V4cG9uZW50aWF0aW9uJywgYXNzZXJ0ID0+IHtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgbmV3IENvbXBsZXgoIDIsIC0zICkuZXhwb25lbnRpYXRlZCgpLCBuZXcgQ29tcGxleCggLTcuMzE1MTEsIC0xLjA0Mjc0ICksICdFeHBvbmVudGlhdGlvbicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0NvcyBvZicsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYSA9IG5ldyBDb21wbGV4KCAxLCAxICk7XHJcbiAgY29uc3QgYiA9IG5ldyBDb21wbGV4KCAwLjgzMzczMDAyNTEzMTE0OTEsIC0wLjk4ODg5NzcwNTc2Mjg2NTEgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgYS5jb3NPZigpLCBiLCAnQ29zIE9mJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnU2luIG9mJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhID0gbmV3IENvbXBsZXgoIDEsIDEgKTtcclxuICBjb25zdCBiID0gbmV3IENvbXBsZXgoIDEuMjk4NDU3NTgsIDAuNjM0OTYzOTE0ICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIGEuc2luT2YoKSwgYiwgJ1NpbiBPZicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2dldEN1YmVSb290cycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYWN0dWFsID0gbmV3IENvbXBsZXgoIDAsIDggKS5nZXRDdWJlUm9vdHMoKTtcclxuICBjb25zdCBleHBlY3RlZCA9IFtcclxuICAgIG5ldyBDb21wbGV4KCBNYXRoLnNxcnQoIDMgKSwgMSApLFxyXG4gICAgbmV3IENvbXBsZXgoIC1NYXRoLnNxcnQoIDMgKSwgMSApLFxyXG4gICAgbmV3IENvbXBsZXgoIDAsIC0yIClcclxuICBdO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCBleHBlY3RlZFsgMCBdLCBhY3R1YWxbIDAgXSwgJ3Jvb3QgMScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgZXhwZWN0ZWRbIDEgXSwgYWN0dWFsWyAxIF0sICdyb290IDInICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIGV4cGVjdGVkWyAyIF0sIGFjdHVhbFsgMiBdLCAncm9vdCAzJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnbGluZWFyIHJvb3RzJywgYXNzZXJ0ID0+IHtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgQ29tcGxleC5yZWFsKCAtMiApLCBDb21wbGV4LnNvbHZlTGluZWFyUm9vdHMoIENvbXBsZXgucmVhbCggMyApLCBDb21wbGV4LnJlYWwoIDYgKSApWyAwIF0sICczeCArIDYgPSAwICAvLyAgeD0tMicgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgbmV3IENvbXBsZXgoIC0yLCAtMSApLCBDb21wbGV4LnNvbHZlTGluZWFyUm9vdHMoIENvbXBsZXgucmVhbCggMyApLCBuZXcgQ29tcGxleCggNiwgMyApIClbIDAgXSwgJzN4ICsgNiArIDNpID0gMCAgLy8gIHg9LTItaScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgQ29tcGxleC5yZWFsKCAtMyApLCBDb21wbGV4LnNvbHZlTGluZWFyUm9vdHMoIG5ldyBDb21wbGV4KCAyLCAxICksIG5ldyBDb21wbGV4KCA2LCAzICkgKVsgMCBdLCAnKDIgKyBpKXggKyA2ICsgM2kgPSAwICAvLyAgeD0tMycgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3F1YWRyYXRpYyByb290cyAwJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290czAgPSBDb21wbGV4LnNvbHZlUXVhZHJhdGljUm9vdHMoIENvbXBsZXgucmVhbCggMSApLCBDb21wbGV4LnJlYWwoIC0zICksIENvbXBsZXgucmVhbCggMiApICk7XHJcbiAgY29uc3Qgcm9vdHMwXzAgPSBDb21wbGV4LnJlYWwoIDIgKTtcclxuICBjb25zdCByb290czBfMSA9IENvbXBsZXgucmVhbCggMSApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290czBbIDAgXSwgcm9vdHMwXzAsICd4XjIgLSAzeCArIDIgPSAwICAvLyAgeD0yIGNhc2UnICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzMFsgMSBdLCByb290czBfMSwgJ3heMiAtIDN4ICsgMiA9IDAgIC8vICB4PTEgY2FzZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3F1YWRyYXRpYyByb290cyAxJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290czEgPSBDb21wbGV4LnNvbHZlUXVhZHJhdGljUm9vdHMoIENvbXBsZXgucmVhbCggMiApLCBDb21wbGV4LnJlYWwoIDggKSwgQ29tcGxleC5yZWFsKCA4ICkgKTtcclxuICBjb25zdCByb290czFfeCA9IENvbXBsZXgucmVhbCggLTIgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHMxWyAwIF0sIHJvb3RzMV94LCAnOHheMiArIDh4ICsgMiA9IDAgIC8vICB4PS0yIGNhc2UgKGZpcnN0KScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHMxWyAxIF0sIHJvb3RzMV94LCAnOHheMiArIDh4ICsgMiA9IDAgIC8vICB4PS0yIGNhc2UgKHNlY29uZCknICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdxdWFkcmF0aWMgcm9vdHMgMicsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgcm9vdHMyID0gQ29tcGxleC5zb2x2ZVF1YWRyYXRpY1Jvb3RzKCBDb21wbGV4LnJlYWwoIDEgKSwgQ29tcGxleC5yZWFsKCAwICksIENvbXBsZXgucmVhbCggLTIgKSApO1xyXG4gIGNvbnN0IHJvb3RzMl8wID0gQ29tcGxleC5yZWFsKCBNYXRoLnNxcnQoIDIgKSApO1xyXG4gIGNvbnN0IHJvb3RzMl8xID0gQ29tcGxleC5yZWFsKCAtTWF0aC5zcXJ0KCAyICkgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHMyWyAwIF0sIHJvb3RzMl8wLCAneF4yIC0gMiA9IDAgIC8vICB4PXNxcnQoMikgY2FzZScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHMyWyAxIF0sIHJvb3RzMl8xLCAneF4yIC0gMiA9IDAgIC8vICB4PS1zcXJ0KDIpIGNhc2UnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdxdWFkcmF0aWMgcm9vdHMgMycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgcm9vdHMzID0gQ29tcGxleC5zb2x2ZVF1YWRyYXRpY1Jvb3RzKCBDb21wbGV4LnJlYWwoIDEgKSwgQ29tcGxleC5yZWFsKCAtMiApLCBDb21wbGV4LnJlYWwoIDIgKSApO1xyXG4gIGNvbnN0IHJvb3RzM18wID0gbmV3IENvbXBsZXgoIDEsIDEgKTtcclxuICBjb25zdCByb290czNfMSA9IG5ldyBDb21wbGV4KCAxLCAtMSApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290czNbIDAgXSwgcm9vdHMzXzAsICd4XjIgLSAyeCArIDIgPSAwICAvLyAgeD0xK2kgY2FzZScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHMzWyAxIF0sIHJvb3RzM18xLCAneF4yIC0gMnggKyAyID0gMCAgLy8gIHg9MS1pIGNhc2UnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdxdWFkcmF0aWMgcm9vdHMgNCcsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgcm9vdHM0ID0gQ29tcGxleC5zb2x2ZVF1YWRyYXRpY1Jvb3RzKCBDb21wbGV4LnJlYWwoIDEgKSwgbmV3IENvbXBsZXgoIC0zLCAtMiApLCBuZXcgQ29tcGxleCggMSwgMyApICk7XHJcbiAgY29uc3Qgcm9vdHM0XzAgPSBuZXcgQ29tcGxleCggMiwgMSApO1xyXG4gIGNvbnN0IHJvb3RzNF8xID0gbmV3IENvbXBsZXgoIDEsIDEgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHM0WyAwIF0sIHJvb3RzNF8wLCAnKDEgKyAzaSl4XjIgKyAoLTMgLSAyaSl4ICsgMSA9IDAgIC8vICB4PTIraSBjYXNlJyApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290czRbIDEgXSwgcm9vdHM0XzEsICcoMSArIDNpKXheMiArICgtMyAtIDJpKXggKyAxID0gMCAgLy8gIHg9MStpIGNhc2UnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdjdWJpYyByb290cyAwJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCByb290cyA9IENvbXBsZXguc29sdmVDdWJpY1Jvb3RzKCBDb21wbGV4LnJlYWwoIDEgKSwgQ29tcGxleC5yZWFsKCAtNiApLCBDb21wbGV4LnJlYWwoIDExICksIENvbXBsZXgucmVhbCggLTYgKSApO1xyXG4gIGNvbnN0IHJvb3RzXzAgPSBDb21wbGV4LnJlYWwoIDEgKTtcclxuICBjb25zdCByb290c18xID0gQ29tcGxleC5yZWFsKCAzICk7XHJcbiAgY29uc3Qgcm9vdHNfMiA9IENvbXBsZXgucmVhbCggMiApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290c1sgMCBdLCByb290c18wLCAneF4zIC0gNnheMiArIDExeCAtIDYgPSAwICAvLyAgeD0xIGNhc2UnICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzWyAxIF0sIHJvb3RzXzEsICd4XjMgLSA2eF4yICsgMTF4IC0gNiA9IDAgIC8vICB4PTMgY2FzZScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHNbIDIgXSwgcm9vdHNfMiwgJ3heMyAtIDZ4XjIgKyAxMXggLSA2ID0gMCAgLy8gIHg9MiBjYXNlJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnY3ViaWMgcm9vdHMgMScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgcm9vdHMgPSBDb21wbGV4LnNvbHZlQ3ViaWNSb290cyggQ29tcGxleC5yZWFsKCAxICksIENvbXBsZXgucmVhbCggMCApLCBDb21wbGV4LnJlYWwoIDAgKSwgQ29tcGxleC5yZWFsKCAtOCApICk7XHJcbiAgY29uc3Qgcm9vdHNfMCA9IG5ldyBDb21wbGV4KCAtMSwgLU1hdGguc3FydCggMyApICk7XHJcbiAgY29uc3Qgcm9vdHNfMSA9IENvbXBsZXgucmVhbCggMiApO1xyXG4gIGNvbnN0IHJvb3RzXzIgPSBuZXcgQ29tcGxleCggLTEsIE1hdGguc3FydCggMyApICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzWyAwIF0sIHJvb3RzXzAsICd4XjMgLSA4ID0gMCAgLy8gIHg9LTEtc3FydCgzKWkgY2FzZScgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHNbIDEgXSwgcm9vdHNfMSwgJ3heMyAtIDggPSAwICAvLyAgeD0yIGNhc2UnICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzWyAyIF0sIHJvb3RzXzIsICd4XjMgLSA4ID0gMCAgLy8gIHg9LTErc3FydCgzKWkgY2FzZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2N1YmljIHJvb3RzIDInLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHJvb3RzID0gQ29tcGxleC5zb2x2ZUN1YmljUm9vdHMoIENvbXBsZXgucmVhbCggMiApLCBDb21wbGV4LnJlYWwoIDggKSwgQ29tcGxleC5yZWFsKCA4ICksIENvbXBsZXgucmVhbCggMCApICk7XHJcbiAgY29uc3Qgcm9vdHNfMCA9IENvbXBsZXgucmVhbCggMCApO1xyXG4gIGNvbnN0IHJvb3RzXzEgPSBDb21wbGV4LnJlYWwoIC0yICk7XHJcbiAgY29uc3Qgcm9vdHNfMiA9IENvbXBsZXgucmVhbCggLTIgKTtcclxuICBhcHByb3hpbWF0ZUNvbXBsZXhFcXVhbHMoIGFzc2VydCwgcm9vdHNbIDAgXSwgcm9vdHNfMCwgJzJ4XjMgKyA4eF4yICsgOHggPSAwICAvLyAgeD0wJyApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290c1sgMSBdLCByb290c18xLCAnMnheMyArIDh4XjIgKyA4eCA9IDAgIC8vICB4PS0yIGNhc2UnICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzWyAyIF0sIHJvb3RzXzIsICcyeF4zICsgOHheMiArIDh4ID0gMCAgLy8gIHg9LTIgY2FzZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2N1YmljIHJvb3RzIDMnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHJvb3RzID0gQ29tcGxleC5zb2x2ZUN1YmljUm9vdHMoIENvbXBsZXgucmVhbCggMSApLCBDb21wbGV4LnJlYWwoIDEgKSwgQ29tcGxleC5yZWFsKCAxICksIENvbXBsZXgucmVhbCggMSApICk7XHJcbiAgY29uc3Qgcm9vdHNfMCA9IENvbXBsZXgucmVhbCggLTEgKTtcclxuICBjb25zdCByb290c18xID0gbmV3IENvbXBsZXgoIDAsIC0xICk7XHJcbiAgY29uc3Qgcm9vdHNfMiA9IG5ldyBDb21wbGV4KCAwLCAxICk7XHJcbiAgYXBwcm94aW1hdGVDb21wbGV4RXF1YWxzKCBhc3NlcnQsIHJvb3RzWyAwIF0sIHJvb3RzXzAsICd4XjMgKyB4XjIgKyB4ICsgMSA9IDAgIC8vICB4PS0xJyApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290c1sgMSBdLCByb290c18xLCAneF4zICsgeF4yICsgeCArIDEgPSAwICAvLyAgeD0taSBjYXNlJyApO1xyXG4gIGFwcHJveGltYXRlQ29tcGxleEVxdWFscyggYXNzZXJ0LCByb290c1sgMiBdLCByb290c18yLCAneF4zICsgeF4yICsgeCArIDEgPSAwICAvLyAgeD1pIGNhc2UnICk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxPQUFPLE1BQU0sY0FBYztBQUVsQ0MsS0FBSyxDQUFDQyxNQUFNLENBQUUsU0FBVSxDQUFDO0FBRXpC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