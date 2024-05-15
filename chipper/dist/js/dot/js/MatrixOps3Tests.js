// Copyright 2017-2022, University of Colorado Boulder

/**
 * Bounds2 tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import MatrixOps3 from './MatrixOps3.js';
QUnit.module('MatrixOps3');
function approxEqual(assert, a, b, msg) {
  assert.ok(Math.abs(a - b) < 0.0001, msg);
}
function approxEqualArray(assert, arr, barr, msg) {
  for (let i = 0; i < arr.length; i++) {
    approxEqual(assert, arr[i], barr[i], `${msg}: index ${i}`);
  }
}
QUnit.test('3x3 mults', assert => {
  const a = new MatrixOps3.Array([1, 2, 7, 5, 2, 6, -1, -5, 4]); // a:= {{1, 2, 7}, {5, 2, 6}, {-1, -5, 4}}
  const b = new MatrixOps3.Array([4, 3, 1, -7, 2, -1, -1, 0, -2]); // b:= {{4, 3, 1}, {-7, 2, -1}, {-1, 0, -2}}
  const c = new MatrixOps3.Array(9);
  MatrixOps3.mult3(a, b, c);
  approxEqualArray(assert, c, [-17, 7, -15, 0, 19, -9, 27, -13, -4], 'mult3');
  MatrixOps3.mult3LeftTranspose(a, b, c);
  approxEqualArray(assert, c, [-30, 13, -2, -1, 10, 10, -18, 33, -7], 'mult3LeftTranspose');
  MatrixOps3.mult3RightTranspose(a, b, c);
  approxEqualArray(assert, c, [17, -10, -15, 32, -37, -17, -15, -7, -7], 'mult3RightTranspose');
  MatrixOps3.mult3BothTranspose(a, b, c);
  approxEqualArray(assert, c, [18, 4, 1, 9, -5, 8, 50, -41, -15], 'mult3BothTranspose');
});
QUnit.test('optimized Givens rotation equivalence', assert => {
  const a = new MatrixOps3.Array([1, 2, 7, 5, 2, 6, -1, -5, 4]);
  const normal = new MatrixOps3.Array(9);
  const accel = new MatrixOps3.Array(9);
  const givens = new MatrixOps3.Array(9);
  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  MatrixOps3.set3(a, normal);
  MatrixOps3.set3(a, accel);
  approxEqualArray(assert, normal, accel, 'sanity check 1');
  approxEqualArray(assert, a, accel, 'sanity check 2');

  // left mult 0,1
  MatrixOps3.setGivens3(givens, cos, sin, 0, 1);
  MatrixOps3.mult3(givens, normal, normal);
  MatrixOps3.preMult3Givens(accel, cos, sin, 0, 1);
  approxEqualArray(assert, normal, accel, 'left mult 0,1');

  // left mult 0,2
  MatrixOps3.setGivens3(givens, cos, sin, 0, 2);
  MatrixOps3.mult3(givens, normal, normal);
  MatrixOps3.preMult3Givens(accel, cos, sin, 0, 2);
  approxEqualArray(assert, normal, accel, 'left mult 0,2');

  // left mult 1,2
  MatrixOps3.setGivens3(givens, cos, sin, 1, 2);
  MatrixOps3.mult3(givens, normal, normal);
  MatrixOps3.preMult3Givens(accel, cos, sin, 1, 2);
  approxEqualArray(assert, normal, accel, 'left mult 1,2');

  // right mult 0,1
  MatrixOps3.setGivens3(givens, cos, sin, 0, 1);
  MatrixOps3.mult3RightTranspose(normal, givens, normal);
  MatrixOps3.postMult3Givens(accel, cos, sin, 0, 1);
  approxEqualArray(assert, normal, accel, 'right mult 0,1');

  // right mult 0,2
  MatrixOps3.setGivens3(givens, cos, sin, 0, 2);
  MatrixOps3.mult3RightTranspose(normal, givens, normal);
  MatrixOps3.postMult3Givens(accel, cos, sin, 0, 2);
  approxEqualArray(assert, normal, accel, 'right mult 0,2');

  // right mult 1,2
  MatrixOps3.setGivens3(givens, cos, sin, 1, 2);
  MatrixOps3.mult3RightTranspose(normal, givens, normal);
  MatrixOps3.postMult3Givens(accel, cos, sin, 1, 2);
  approxEqualArray(assert, normal, accel, 'right mult 1,2');
});
QUnit.test('SVD', assert => {
  const a = new MatrixOps3.Array([1, 2, 7, 5, 2, 6, -1, -5, 4]);
  const u = new MatrixOps3.Array(9);
  const sigma = new MatrixOps3.Array(9);
  const v = new MatrixOps3.Array(9);
  MatrixOps3.svd3(a, 20, u, sigma, v);
  const c = new MatrixOps3.Array(9);

  // c = U * Sigma * V^T
  MatrixOps3.mult3(u, sigma, c);
  MatrixOps3.mult3RightTranspose(c, v, c);
  approxEqualArray(assert, a, c, 'SVD composes');
  approxEqualArray(assert, sigma, [sigma[0], 0, 0, 0, sigma[4], 0, 0, 0, sigma[8]], 'Diagonal matrix should be diagonal');
  MatrixOps3.mult3RightTranspose(u, u, c);
  approxEqualArray(assert, c, [1, 0, 0, 0, 1, 0, 0, 0, 1], 'U should be unitary');
  MatrixOps3.mult3RightTranspose(v, v, c);
  approxEqualArray(assert, c, [1, 0, 0, 0, 1, 0, 0, 0, 1], 'V should be unitary');
  approxEqual(assert, MatrixOps3.det3(u), 1, 'U should be a rotation matrix with the current customs');
  approxEqual(assert, MatrixOps3.det3(v), 1, 'V should be a rotation matrix with the current customs');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXhPcHMzIiwiUVVuaXQiLCJtb2R1bGUiLCJhcHByb3hFcXVhbCIsImFzc2VydCIsImEiLCJiIiwibXNnIiwib2siLCJNYXRoIiwiYWJzIiwiYXBwcm94RXF1YWxBcnJheSIsImFyciIsImJhcnIiLCJpIiwibGVuZ3RoIiwidGVzdCIsIkFycmF5IiwiYyIsIm11bHQzIiwibXVsdDNMZWZ0VHJhbnNwb3NlIiwibXVsdDNSaWdodFRyYW5zcG9zZSIsIm11bHQzQm90aFRyYW5zcG9zZSIsIm5vcm1hbCIsImFjY2VsIiwiZ2l2ZW5zIiwiY29zIiwiUEkiLCJzaW4iLCJzZXQzIiwic2V0R2l2ZW5zMyIsInByZU11bHQzR2l2ZW5zIiwicG9zdE11bHQzR2l2ZW5zIiwidSIsInNpZ21hIiwidiIsInN2ZDMiLCJkZXQzIl0sInNvdXJjZXMiOlsiTWF0cml4T3BzM1Rlc3RzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJvdW5kczIgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgTWF0cml4T3BzMyBmcm9tICcuL01hdHJpeE9wczMuanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnTWF0cml4T3BzMycgKTtcclxuXHJcbmZ1bmN0aW9uIGFwcHJveEVxdWFsKCBhc3NlcnQsIGEsIGIsIG1zZyApIHtcclxuICBhc3NlcnQub2soIE1hdGguYWJzKCBhIC0gYiApIDwgMC4wMDAxLCBtc2cgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwcm94RXF1YWxBcnJheSggYXNzZXJ0LCBhcnIsIGJhcnIsIG1zZyApIHtcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBhcHByb3hFcXVhbCggYXNzZXJ0LCBhcnJbIGkgXSwgYmFyclsgaSBdLCBgJHttc2d9OiBpbmRleCAke2l9YCApO1xyXG4gIH1cclxufVxyXG5cclxuIFxyXG5RVW5pdC50ZXN0KCAnM3gzIG11bHRzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhID0gbmV3IE1hdHJpeE9wczMuQXJyYXkoIFsgMSwgMiwgNywgNSwgMiwgNiwgLTEsIC01LCA0IF0gKTsgLy8gYTo9IHt7MSwgMiwgN30sIHs1LCAyLCA2fSwgey0xLCAtNSwgNH19XHJcbiAgY29uc3QgYiA9IG5ldyBNYXRyaXhPcHMzLkFycmF5KCBbIDQsIDMsIDEsIC03LCAyLCAtMSwgLTEsIDAsIC0yIF0gKTsgLy8gYjo9IHt7NCwgMywgMX0sIHstNywgMiwgLTF9LCB7LTEsIDAsIC0yfX1cclxuICBjb25zdCBjID0gbmV3IE1hdHJpeE9wczMuQXJyYXkoIDkgKTtcclxuXHJcbiAgTWF0cml4T3BzMy5tdWx0MyggYSwgYiwgYyApO1xyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgYywgWyAtMTcsIDcsIC0xNSwgMCwgMTksIC05LCAyNywgLTEzLCAtNCBdLCAnbXVsdDMnICk7XHJcblxyXG4gIE1hdHJpeE9wczMubXVsdDNMZWZ0VHJhbnNwb3NlKCBhLCBiLCBjICk7XHJcbiAgYXBwcm94RXF1YWxBcnJheSggYXNzZXJ0LCBjLCBbIC0zMCwgMTMsIC0yLCAtMSwgMTAsIDEwLCAtMTgsIDMzLCAtNyBdLCAnbXVsdDNMZWZ0VHJhbnNwb3NlJyApO1xyXG4gIE1hdHJpeE9wczMubXVsdDNSaWdodFRyYW5zcG9zZSggYSwgYiwgYyApO1xyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgYywgWyAxNywgLTEwLCAtMTUsIDMyLCAtMzcsIC0xNywgLTE1LCAtNywgLTcgXSwgJ211bHQzUmlnaHRUcmFuc3Bvc2UnICk7XHJcbiAgTWF0cml4T3BzMy5tdWx0M0JvdGhUcmFuc3Bvc2UoIGEsIGIsIGMgKTtcclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIGMsIFsgMTgsIDQsIDEsIDksIC01LCA4LCA1MCwgLTQxLCAtMTUgXSwgJ211bHQzQm90aFRyYW5zcG9zZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ29wdGltaXplZCBHaXZlbnMgcm90YXRpb24gZXF1aXZhbGVuY2UnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGEgPSBuZXcgTWF0cml4T3BzMy5BcnJheSggWyAxLCAyLCA3LCA1LCAyLCA2LCAtMSwgLTUsIDQgXSApO1xyXG4gIGNvbnN0IG5vcm1hbCA9IG5ldyBNYXRyaXhPcHMzLkFycmF5KCA5ICk7XHJcbiAgY29uc3QgYWNjZWwgPSBuZXcgTWF0cml4T3BzMy5BcnJheSggOSApO1xyXG4gIGNvbnN0IGdpdmVucyA9IG5ldyBNYXRyaXhPcHMzLkFycmF5KCA5ICk7XHJcblxyXG4gIGNvbnN0IGNvcyA9IE1hdGguY29zKCBNYXRoLlBJIC8gNiApO1xyXG4gIGNvbnN0IHNpbiA9IE1hdGguc2luKCBNYXRoLlBJIC8gNiApO1xyXG5cclxuICBNYXRyaXhPcHMzLnNldDMoIGEsIG5vcm1hbCApO1xyXG4gIE1hdHJpeE9wczMuc2V0MyggYSwgYWNjZWwgKTtcclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIG5vcm1hbCwgYWNjZWwsICdzYW5pdHkgY2hlY2sgMScgKTtcclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIGEsIGFjY2VsLCAnc2FuaXR5IGNoZWNrIDInICk7XHJcblxyXG4gIC8vIGxlZnQgbXVsdCAwLDFcclxuICBNYXRyaXhPcHMzLnNldEdpdmVuczMoIGdpdmVucywgY29zLCBzaW4sIDAsIDEgKTtcclxuICBNYXRyaXhPcHMzLm11bHQzKCBnaXZlbnMsIG5vcm1hbCwgbm9ybWFsICk7XHJcbiAgTWF0cml4T3BzMy5wcmVNdWx0M0dpdmVucyggYWNjZWwsIGNvcywgc2luLCAwLCAxICk7XHJcbiAgYXBwcm94RXF1YWxBcnJheSggYXNzZXJ0LCBub3JtYWwsIGFjY2VsLCAnbGVmdCBtdWx0IDAsMScgKTtcclxuXHJcbiAgLy8gbGVmdCBtdWx0IDAsMlxyXG4gIE1hdHJpeE9wczMuc2V0R2l2ZW5zMyggZ2l2ZW5zLCBjb3MsIHNpbiwgMCwgMiApO1xyXG4gIE1hdHJpeE9wczMubXVsdDMoIGdpdmVucywgbm9ybWFsLCBub3JtYWwgKTtcclxuICBNYXRyaXhPcHMzLnByZU11bHQzR2l2ZW5zKCBhY2NlbCwgY29zLCBzaW4sIDAsIDIgKTtcclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIG5vcm1hbCwgYWNjZWwsICdsZWZ0IG11bHQgMCwyJyApO1xyXG5cclxuICAvLyBsZWZ0IG11bHQgMSwyXHJcbiAgTWF0cml4T3BzMy5zZXRHaXZlbnMzKCBnaXZlbnMsIGNvcywgc2luLCAxLCAyICk7XHJcbiAgTWF0cml4T3BzMy5tdWx0MyggZ2l2ZW5zLCBub3JtYWwsIG5vcm1hbCApO1xyXG4gIE1hdHJpeE9wczMucHJlTXVsdDNHaXZlbnMoIGFjY2VsLCBjb3MsIHNpbiwgMSwgMiApO1xyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgbm9ybWFsLCBhY2NlbCwgJ2xlZnQgbXVsdCAxLDInICk7XHJcblxyXG4gIC8vIHJpZ2h0IG11bHQgMCwxXHJcbiAgTWF0cml4T3BzMy5zZXRHaXZlbnMzKCBnaXZlbnMsIGNvcywgc2luLCAwLCAxICk7XHJcbiAgTWF0cml4T3BzMy5tdWx0M1JpZ2h0VHJhbnNwb3NlKCBub3JtYWwsIGdpdmVucywgbm9ybWFsICk7XHJcbiAgTWF0cml4T3BzMy5wb3N0TXVsdDNHaXZlbnMoIGFjY2VsLCBjb3MsIHNpbiwgMCwgMSApO1xyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgbm9ybWFsLCBhY2NlbCwgJ3JpZ2h0IG11bHQgMCwxJyApO1xyXG5cclxuICAvLyByaWdodCBtdWx0IDAsMlxyXG4gIE1hdHJpeE9wczMuc2V0R2l2ZW5zMyggZ2l2ZW5zLCBjb3MsIHNpbiwgMCwgMiApO1xyXG4gIE1hdHJpeE9wczMubXVsdDNSaWdodFRyYW5zcG9zZSggbm9ybWFsLCBnaXZlbnMsIG5vcm1hbCApO1xyXG4gIE1hdHJpeE9wczMucG9zdE11bHQzR2l2ZW5zKCBhY2NlbCwgY29zLCBzaW4sIDAsIDIgKTtcclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIG5vcm1hbCwgYWNjZWwsICdyaWdodCBtdWx0IDAsMicgKTtcclxuXHJcbiAgLy8gcmlnaHQgbXVsdCAxLDJcclxuICBNYXRyaXhPcHMzLnNldEdpdmVuczMoIGdpdmVucywgY29zLCBzaW4sIDEsIDIgKTtcclxuICBNYXRyaXhPcHMzLm11bHQzUmlnaHRUcmFuc3Bvc2UoIG5vcm1hbCwgZ2l2ZW5zLCBub3JtYWwgKTtcclxuICBNYXRyaXhPcHMzLnBvc3RNdWx0M0dpdmVucyggYWNjZWwsIGNvcywgc2luLCAxLCAyICk7XHJcbiAgYXBwcm94RXF1YWxBcnJheSggYXNzZXJ0LCBub3JtYWwsIGFjY2VsLCAncmlnaHQgbXVsdCAxLDInICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdTVkQnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGEgPSBuZXcgTWF0cml4T3BzMy5BcnJheSggWyAxLCAyLCA3LCA1LCAyLCA2LCAtMSwgLTUsIDQgXSApO1xyXG4gIGNvbnN0IHUgPSBuZXcgTWF0cml4T3BzMy5BcnJheSggOSApO1xyXG4gIGNvbnN0IHNpZ21hID0gbmV3IE1hdHJpeE9wczMuQXJyYXkoIDkgKTtcclxuICBjb25zdCB2ID0gbmV3IE1hdHJpeE9wczMuQXJyYXkoIDkgKTtcclxuXHJcbiAgTWF0cml4T3BzMy5zdmQzKCBhLCAyMCwgdSwgc2lnbWEsIHYgKTtcclxuXHJcbiAgY29uc3QgYyA9IG5ldyBNYXRyaXhPcHMzLkFycmF5KCA5ICk7XHJcblxyXG4gIC8vIGMgPSBVICogU2lnbWEgKiBWXlRcclxuICBNYXRyaXhPcHMzLm11bHQzKCB1LCBzaWdtYSwgYyApO1xyXG4gIE1hdHJpeE9wczMubXVsdDNSaWdodFRyYW5zcG9zZSggYywgdiwgYyApO1xyXG5cclxuICBhcHByb3hFcXVhbEFycmF5KCBhc3NlcnQsIGEsIGMsICdTVkQgY29tcG9zZXMnICk7XHJcblxyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgc2lnbWEsIFsgc2lnbWFbIDAgXSwgMCwgMCwgMCwgc2lnbWFbIDQgXSwgMCwgMCwgMCwgc2lnbWFbIDggXSBdLCAnRGlhZ29uYWwgbWF0cml4IHNob3VsZCBiZSBkaWFnb25hbCcgKTtcclxuXHJcbiAgTWF0cml4T3BzMy5tdWx0M1JpZ2h0VHJhbnNwb3NlKCB1LCB1LCBjICk7XHJcbiAgYXBwcm94RXF1YWxBcnJheSggYXNzZXJ0LCBjLCBbIDEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEgXSwgJ1Ugc2hvdWxkIGJlIHVuaXRhcnknICk7XHJcblxyXG4gIE1hdHJpeE9wczMubXVsdDNSaWdodFRyYW5zcG9zZSggdiwgdiwgYyApO1xyXG4gIGFwcHJveEVxdWFsQXJyYXkoIGFzc2VydCwgYywgWyAxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxIF0sICdWIHNob3VsZCBiZSB1bml0YXJ5JyApO1xyXG5cclxuICBhcHByb3hFcXVhbCggYXNzZXJ0LCBNYXRyaXhPcHMzLmRldDMoIHUgKSwgMSwgJ1Ugc2hvdWxkIGJlIGEgcm90YXRpb24gbWF0cml4IHdpdGggdGhlIGN1cnJlbnQgY3VzdG9tcycgKTtcclxuICBhcHByb3hFcXVhbCggYXNzZXJ0LCBNYXRyaXhPcHMzLmRldDMoIHYgKSwgMSwgJ1Ygc2hvdWxkIGJlIGEgcm90YXRpb24gbWF0cml4IHdpdGggdGhlIGN1cnJlbnQgY3VzdG9tcycgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFVBQVUsTUFBTSxpQkFBaUI7QUFFeENDLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLFlBQWEsQ0FBQztBQUU1QixTQUFTQyxXQUFXQSxDQUFFQyxNQUFNLEVBQUVDLENBQUMsRUFBRUMsQ0FBQyxF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QUFFLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDL0M1QixVQUFVLENBQUNtQixLQUFLLENBQUVNLE1BQU0sRUFBRUYsTUFBTSxFQUFFQSxNQUFPLENBQUM7RUFDMUN2QixVQUFVLENBQUMrQixjQUFjLENBQUVQLEtBQUssRUFBRUUsR0FBRyxFQUFFRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztFQUNsRGpCLGdCQUFnQixDQUFFUCxNQUFNLEVBQUVtQixNQUFNLEVBQUVDLEtBQUssRUFBRSxlQUFnQixDQUFDOztFQUUxRDtFQUNBeEIsVUFBVSxDQUFDOEIsVUFBVSxDQUFFTCxNQUFNLEVBQUVDLEdBQUcsRUFBRUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDL0M1QixVQUFVLENBQUNtQixLQUFLLENBQUVNLE1BQU0sRUFBRUYsTUFBTSxFQUFFQSxNQUFPLENBQUM7RUFDMUN2QixVQUFVLENBQUMrQixjQUFjLENBQUVQLEtBQUssRUFBRUUsR0FBRyxFQUFFRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztFQUNsRGpCLGdCQUFnQixDQUFFUCxNQUFNLEVBQUVtQixNQUFNLEVBQUVDLEtBQUssRUFBRSxlQUFnQixDQUFDOztFQUUxRDtFQUNBeEIsVUFBVSxDQUFDOEIsVUFBVSxDQUFFTCxNQUFNLEVBQUVDLEdBQUcsRUFBRUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDL0M1QixVQUFVLENBQUNtQixLQUFLLENBQUVNLE1BQU0sRUFBRUYsTUFBTSxFQUFFQSxNQUFPLENBQUM7RUFDMUN2QixVQUFVLENBQUMrQixjQUFjLENBQUVQLEtBQUssRUFBRUUsR0FBRyxFQUFFRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztFQUNsRGpCLGdCQUFnQixDQUFFUCxNQUFNLEVBQUVtQixNQUFNLEVBQUVDLEtBQUssRUFBRSxlQUFnQixDQUFDOztFQUUxRDtFQUNBeEIsVUFBVSxDQUFDOEIsVUFBVSxDQUFFTCxNQUFNLEVBQUVDLEdBQUcsRUFBRUUsR0FBRyxF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