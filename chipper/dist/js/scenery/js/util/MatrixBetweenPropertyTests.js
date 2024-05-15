// Copyright 2023-2024, University of Colorado Boulder

/**
 * QUnit tests for MatrixBetweenProperty
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Matrix3 from '../../../dot/js/Matrix3.js';
import { MatrixBetweenProperty, Node } from '../imports.js';
QUnit.module('MatrixBetweenProperty');
QUnit.test('MatrixBetweenProperty connectivity', assert => {
  const a = new Node();
  const b = new Node();
  const c = new Node();
  const x = new Node();
  const y = new Node();
  const matrixBetweenProperty = new MatrixBetweenProperty(x, y);
  const checkMatrix = (matrix, message) => {
    const propMatrix = matrixBetweenProperty.value;
    assert.ok(propMatrix === matrix || matrix && propMatrix && matrix.equals(propMatrix), message);
  };
  checkMatrix(null, 'no connection at all');

  // a -> x
  a.addChild(x);
  checkMatrix(null, 'no connection at all');

  //   x
  //  /
  // a
  //  \
  //   y
  a.addChild(y);
  checkMatrix(Matrix3.IDENTITY, 'connected, identity');

  // b    x
  //  \  /
  //   a
  //  /  \
  // c    y
  b.addChild(a);
  c.addChild(a);
  checkMatrix(Matrix3.IDENTITY, 'ignores DAG below, identity');

  // b -> x
  //  \  /
  //   a
  //  /  \
  // c -> y
  b.addChild(x);
  c.addChild(y);
  checkMatrix(null, 'DAGs (cax/bax/bx, so null');

  // b -> x
  //  \
  //   a
  //  /  \
  // c -> y
  a.removeChild(x);
  checkMatrix(Matrix3.IDENTITY, 'ignores DAG from C, since it is not reachable to x, identity');

  // b
  //  \
  //   a
  //  /  \
  // c -> y
  //  \
  //   x
  b.removeChild(x);
  c.addChild(x);
  checkMatrix(null, 'DAG cay/cy, so null');

  // b
  //  \
  //   a
  //  /  \
  // c -> y -> x
  c.removeChild(x);
  y.addChild(x);
  checkMatrix(Matrix3.IDENTITY, 'direct child OK');

  //   a
  //  /  \
  // c -> y -> b -> x
  b.removeChild(a);
  y.removeChild(x);
  b.addChild(x);
  y.addChild(b);
  checkMatrix(Matrix3.IDENTITY, 'ancestor OK');

  //   a------
  //     \    \
  // c -> y -> b -> x
  c.removeChild(a);
  a.addChild(b);
  checkMatrix(null, 'DAG aybx/abx, null');

  //         a
  //          \
  // c -> y -> b -> x
  a.removeChild(y);
  checkMatrix(Matrix3.IDENTITY, 'back to normal');
  matrixBetweenProperty.dispose();
});
QUnit.test('MatrixBetweenProperty transforms (local)', assert => {
  const a = new Node();
  const b = new Node();
  const x = new Node();
  const y = new Node();
  const matrixBetweenProperty = new MatrixBetweenProperty(x, y);
  const checkMatrix = (matrix, message) => {
    const propMatrix = matrixBetweenProperty.value;
    assert.ok(propMatrix === matrix || matrix && propMatrix && matrix.equals(propMatrix), `message expected\n${matrix}\n\ngot\n${propMatrix}`);
  };
  checkMatrix(null, 'no connection at all');

  //   x
  //  /
  // a
  //  \
  //   y
  a.addChild(x);
  a.addChild(y);
  checkMatrix(Matrix3.IDENTITY, 'connected, identity');

  //   x (x:50)
  //  /
  // a
  //  \
  //   y
  x.x = 50;
  checkMatrix(Matrix3.rowMajor(1, 0, 50, 0, 1, 0, 0, 0, 1), 'connected, 50 translation');

  //   x (x:50)
  //  /
  // a
  //  \
  //   y (scale:2)
  y.scale(2);
  checkMatrix(Matrix3.rowMajor(0.5, 0, 25, 0, 0.5, 0, 0, 0, 1), 'connected, 50 translation + 2 scale');

  //   x (x:50)
  //  /
  // a (x:-50)
  //  \
  //   y (scale:2)
  a.x = -50;
  checkMatrix(Matrix3.rowMajor(0.5, 0, 25, 0, 0.5, 0, 0, 0, 1), 'parent translation should not affect things');

  //     x (x:50)
  //    /
  //   a (x:-50)
  //  /
  // b
  //  \
  //   y (scale:2)
  a.removeChild(y);
  b.addChild(a);
  b.addChild(y);
  checkMatrix(Matrix3.rowMajor(0.5, 0, 0, 0, 0.5, 0, 0, 0, 1), 'now 50 and -50 cancel each other out');

  //     x (x:50)
  //    /
  //   a (x:-50, y:10)
  //  /
  // b
  //  \
  //   y (scale:2)
  a.y = 10;
  checkMatrix(Matrix3.rowMajor(0.5, 0, 0, 0, 0.5, 5, 0, 0, 1), 'adjusting transform on an ancestor');

  //       x (x:50)
  //      /
  //     a (x:-50, y:10)
  //    /
  //   b
  //  /
  // y (scale:2)
  b.removeChild(y);
  y.addChild(b);
  checkMatrix(Matrix3.rowMajor(1, 0, 0, 0, 1, 10, 0, 0, 1), 'swapping to no common root, instead an ancestor (ignores y transform)');

  //       y (scale:2)
  //      /
  //     x (x:50)
  //    /
  //   a (x:-50, y:10)
  //  /
  // b
  y.removeChild(b);
  x.addChild(y);
  checkMatrix(Matrix3.rowMajor(0.5, 0, 0, 0, 0.5, 0, 0, 0, 1), 'swapping order');
});
QUnit.test('MatrixBetweenProperty transforms (parent)', assert => {
  const a = new Node();
  const b = new Node();
  const x = new Node();
  const y = new Node();
  const matrixBetweenProperty = new MatrixBetweenProperty(x, y, {
    fromCoordinateFrame: 'parent',
    toCoordinateFrame: 'parent'
  });
  const checkMatrix = (matrix, message) => {
    const propMatrix = matrixBetweenProperty.value;
    assert.ok(propMatrix === matrix || matrix && propMatrix && matrix.equals(propMatrix), `${message} expected\n${matrix}\n\ngot\n${propMatrix}`);
  };
  checkMatrix(null, 'no connection at all');

  //   x
  //  /
  // a
  //  \
  //   y
  a.addChild(x);
  a.addChild(y);
  checkMatrix(Matrix3.IDENTITY, 'connected, identity');

  //   x (x:50)
  //  /
  // a
  //  \
  //   y
  x.x = 50;
  checkMatrix(Matrix3.IDENTITY, 'x/y transforms do not matter #1');

  //   x (x:50)
  //  /
  // a
  //  \
  //   y (scale:2)
  y.scale(2);
  checkMatrix(Matrix3.IDENTITY, 'x/y transforms do not matter #2');

  //   x (x:50)
  //  /
  // a (x:-50)
  //  \
  //   y (scale:2)
  a.x = -50;
  checkMatrix(Matrix3.IDENTITY, 'x/y transforms do not matter #3');

  //     x (x:50)
  //    /
  //   a (x:-50)
  //  /
  // b
  //  \
  //   y (scale:2)
  a.removeChild(y);
  b.addChild(a);
  b.addChild(y);
  checkMatrix(Matrix3.rowMajor(1, 0, -50, 0, 1, 0, 0, 0, 1), 'now the -50 applies');

  //     x (x:50)
  //    /
  //   a (x:-50, y:10)
  //  /
  // b
  //  \
  //   y (scale:2)
  a.y = 10;
  checkMatrix(Matrix3.rowMajor(1, 0, -50, 0, 1, 10, 0, 0, 1), 'adjusting transform on an ancestor');

  //       x (x:50)
  //      /
  //     a (x:-50, y:10)
  //    /
  //   b
  //  /
  // y (scale:2)
  b.removeChild(y);
  y.addChild(b);
  checkMatrix(Matrix3.rowMajor(2, 0, -100, 0, 2, 20, 0, 0, 1), 'swapping to no common root, instead an ancestor');

  //       y (scale:2)
  //      /
  //     x (x:50)
  //    /
  //   a (x:-50, y:10)
  //  /
  // b
  y.removeChild(b);
  x.addChild(y);
  checkMatrix(Matrix3.rowMajor(1, 0, -50, 0, 1, 0, 0, 0, 1), 'swapping order');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXgzIiwiTWF0cml4QmV0d2VlblByb3BlcnR5IiwiTm9kZSIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsImEiLCJiIiwiYyIsIngiLCJ5IiwibWF0cml4QmV0d2VlblByb3BlcnR5IiwiY2hlY2tNYXRyaXgiLCJtYXRyaXgiLCJtZXNzYWdlIiwicHJvcE1hdHJpeCIsInZhbHVlIiwib2siLCJlcXVhbHMiLCJhZGRDaGlsZCIsIklERU5USVRZIiwicmVtb3ZlQ2hpbGQiLCJkaXNwb3NlIiwicm93TWFqb3IiLCJzY2FsZSIsImZyb21Db29yZGluYXRlRnJhbWUiLCJ0b0Nvb3JkaW5hdGVGcmFtZSJdLCJzb3VyY2VzIjpbIk1hdHJpeEJldHdlZW5Qcm9wZXJ0eVRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBNYXRyaXhCZXR3ZWVuUHJvcGVydHlcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IHsgTWF0cml4QmV0d2VlblByb3BlcnR5LCBOb2RlIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdNYXRyaXhCZXR3ZWVuUHJvcGVydHknICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnTWF0cml4QmV0d2VlblByb3BlcnR5IGNvbm5lY3Rpdml0eScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGMgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IHggPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IHkgPSBuZXcgTm9kZSgpO1xyXG5cclxuICBjb25zdCBtYXRyaXhCZXR3ZWVuUHJvcGVydHkgPSBuZXcgTWF0cml4QmV0d2VlblByb3BlcnR5KCB4LCB5ICk7XHJcblxyXG4gIGNvbnN0IGNoZWNrTWF0cml4ID0gKCBtYXRyaXg6IE1hdHJpeDMgfCBudWxsLCBtZXNzYWdlOiBzdHJpbmcgKSA9PiB7XHJcbiAgICBjb25zdCBwcm9wTWF0cml4ID0gbWF0cml4QmV0d2VlblByb3BlcnR5LnZhbHVlO1xyXG4gICAgYXNzZXJ0Lm9rKCBwcm9wTWF0cml4ID09PSBtYXRyaXggfHwgKCBtYXRyaXggJiYgcHJvcE1hdHJpeCAmJiBtYXRyaXguZXF1YWxzKCBwcm9wTWF0cml4ICkgKSwgbWVzc2FnZSApO1xyXG4gIH07XHJcblxyXG4gIGNoZWNrTWF0cml4KCBudWxsLCAnbm8gY29ubmVjdGlvbiBhdCBhbGwnICk7XHJcblxyXG4gIC8vIGEgLT4geFxyXG4gIGEuYWRkQ2hpbGQoIHggKTtcclxuICBjaGVja01hdHJpeCggbnVsbCwgJ25vIGNvbm5lY3Rpb24gYXQgYWxsJyApO1xyXG5cclxuICAvLyAgIHhcclxuICAvLyAgL1xyXG4gIC8vIGFcclxuICAvLyAgXFxcclxuICAvLyAgIHlcclxuICBhLmFkZENoaWxkKCB5ICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMuSURFTlRJVFksICdjb25uZWN0ZWQsIGlkZW50aXR5JyApO1xyXG5cclxuICAvLyBiICAgIHhcclxuICAvLyAgXFwgIC9cclxuICAvLyAgIGFcclxuICAvLyAgLyAgXFxcclxuICAvLyBjICAgIHlcclxuICBiLmFkZENoaWxkKCBhICk7XHJcbiAgYy5hZGRDaGlsZCggYSApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLklERU5USVRZLCAnaWdub3JlcyBEQUcgYmVsb3csIGlkZW50aXR5JyApO1xyXG5cclxuICAvLyBiIC0+IHhcclxuICAvLyAgXFwgIC9cclxuICAvLyAgIGFcclxuICAvLyAgLyAgXFxcclxuICAvLyBjIC0+IHlcclxuICBiLmFkZENoaWxkKCB4ICk7XHJcbiAgYy5hZGRDaGlsZCggeSApO1xyXG4gIGNoZWNrTWF0cml4KCBudWxsLCAnREFHcyAoY2F4L2JheC9ieCwgc28gbnVsbCcgKTtcclxuXHJcbiAgLy8gYiAtPiB4XHJcbiAgLy8gIFxcXHJcbiAgLy8gICBhXHJcbiAgLy8gIC8gIFxcXHJcbiAgLy8gYyAtPiB5XHJcbiAgYS5yZW1vdmVDaGlsZCggeCApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLklERU5USVRZLCAnaWdub3JlcyBEQUcgZnJvbSBDLCBzaW5jZSBpdCBpcyBub3QgcmVhY2hhYmxlIHRvIHgsIGlkZW50aXR5JyApO1xyXG5cclxuICAvLyBiXHJcbiAgLy8gIFxcXHJcbiAgLy8gICBhXHJcbiAgLy8gIC8gIFxcXHJcbiAgLy8gYyAtPiB5XHJcbiAgLy8gIFxcXHJcbiAgLy8gICB4XHJcbiAgYi5yZW1vdmVDaGlsZCggeCApO1xyXG4gIGMuYWRkQ2hpbGQoIHggKTtcclxuICBjaGVja01hdHJpeCggbnVsbCwgJ0RBRyBjYXkvY3ksIHNvIG51bGwnICk7XHJcblxyXG4gIC8vIGJcclxuICAvLyAgXFxcclxuICAvLyAgIGFcclxuICAvLyAgLyAgXFxcclxuICAvLyBjIC0+IHkgLT4geFxyXG4gIGMucmVtb3ZlQ2hpbGQoIHggKTtcclxuICB5LmFkZENoaWxkKCB4ICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMuSURFTlRJVFksICdkaXJlY3QgY2hpbGQgT0snICk7XHJcblxyXG4gIC8vICAgYVxyXG4gIC8vICAvICBcXFxyXG4gIC8vIGMgLT4geSAtPiBiIC0+IHhcclxuICBiLnJlbW92ZUNoaWxkKCBhICk7XHJcbiAgeS5yZW1vdmVDaGlsZCggeCApO1xyXG4gIGIuYWRkQ2hpbGQoIHggKTtcclxuICB5LmFkZENoaWxkKCBiICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMuSURFTlRJVFksICdhbmNlc3RvciBPSycgKTtcclxuXHJcbiAgLy8gICBhLS0tLS0tXHJcbiAgLy8gICAgIFxcICAgIFxcXHJcbiAgLy8gYyAtPiB5IC0+IGIgLT4geFxyXG4gIGMucmVtb3ZlQ2hpbGQoIGEgKTtcclxuICBhLmFkZENoaWxkKCBiICk7XHJcbiAgY2hlY2tNYXRyaXgoIG51bGwsICdEQUcgYXlieC9hYngsIG51bGwnICk7XHJcblxyXG4gIC8vICAgICAgICAgYVxyXG4gIC8vICAgICAgICAgIFxcXHJcbiAgLy8gYyAtPiB5IC0+IGIgLT4geFxyXG4gIGEucmVtb3ZlQ2hpbGQoIHkgKTtcclxuICBjaGVja01hdHJpeCggTWF0cml4My5JREVOVElUWSwgJ2JhY2sgdG8gbm9ybWFsJyApO1xyXG5cclxuICBtYXRyaXhCZXR3ZWVuUHJvcGVydHkuZGlzcG9zZSgpO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnTWF0cml4QmV0d2VlblByb3BlcnR5IHRyYW5zZm9ybXMgKGxvY2FsKScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IGEgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IGIgPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IHggPSBuZXcgTm9kZSgpO1xyXG4gIGNvbnN0IHkgPSBuZXcgTm9kZSgpO1xyXG5cclxuICBjb25zdCBtYXRyaXhCZXR3ZWVuUHJvcGVydHkgPSBuZXcgTWF0cml4QmV0d2VlblByb3BlcnR5KCB4LCB5ICk7XHJcblxyXG4gIGNvbnN0IGNoZWNrTWF0cml4ID0gKCBtYXRyaXg6IE1hdHJpeDMgfCBudWxsLCBtZXNzYWdlOiBzdHJpbmcgKSA9PiB7XHJcbiAgICBjb25zdCBwcm9wTWF0cml4ID0gbWF0cml4QmV0d2VlblByb3BlcnR5LnZhbHVlO1xyXG4gICAgYXNzZXJ0Lm9rKCBwcm9wTWF0cml4ID09PSBtYXRyaXggfHwgKCBtYXRyaXggJiYgcHJvcE1hdHJpeCAmJiBtYXRyaXguZXF1YWxzKCBwcm9wTWF0cml4ICkgKSwgYG1lc3NhZ2UgZXhwZWN0ZWRcXG4ke21hdHJpeH1cXG5cXG5nb3RcXG4ke3Byb3BNYXRyaXh9YCApO1xyXG4gIH07XHJcblxyXG4gIGNoZWNrTWF0cml4KCBudWxsLCAnbm8gY29ubmVjdGlvbiBhdCBhbGwnICk7XHJcblxyXG4gIC8vICAgeFxyXG4gIC8vICAvXHJcbiAgLy8gYVxyXG4gIC8vICBcXFxyXG4gIC8vICAgeVxyXG4gIGEuYWRkQ2hpbGQoIHggKTtcclxuICBhLmFkZENoaWxkKCB5ICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMuSURFTlRJVFksICdjb25uZWN0ZWQsIGlkZW50aXR5JyApO1xyXG5cclxuICAvLyAgIHggKHg6NTApXHJcbiAgLy8gIC9cclxuICAvLyBhXHJcbiAgLy8gIFxcXHJcbiAgLy8gICB5XHJcbiAgeC54ID0gNTA7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMucm93TWFqb3IoXHJcbiAgICAxLCAwLCA1MCxcclxuICAgIDAsIDEsIDAsXHJcbiAgICAwLCAwLCAxXHJcbiAgKSwgJ2Nvbm5lY3RlZCwgNTAgdHJhbnNsYXRpb24nICk7XHJcblxyXG4gIC8vICAgeCAoeDo1MClcclxuICAvLyAgL1xyXG4gIC8vIGFcclxuICAvLyAgXFxcclxuICAvLyAgIHkgKHNjYWxlOjIpXHJcbiAgeS5zY2FsZSggMiApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLnJvd01ham9yKFxyXG4gICAgMC41LCAwLCAyNSxcclxuICAgIDAsIDAuNSwgMCxcclxuICAgIDAsIDAsIDFcclxuICApLCAnY29ubmVjdGVkLCA1MCB0cmFuc2xhdGlvbiArIDIgc2NhbGUnICk7XHJcblxyXG4gIC8vICAgeCAoeDo1MClcclxuICAvLyAgL1xyXG4gIC8vIGEgKHg6LTUwKVxyXG4gIC8vICBcXFxyXG4gIC8vICAgeSAoc2NhbGU6MilcclxuICBhLnggPSAtNTA7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMucm93TWFqb3IoXHJcbiAgICAwLjUsIDAsIDI1LFxyXG4gICAgMCwgMC41LCAwLFxyXG4gICAgMCwgMCwgMVxyXG4gICksICdwYXJlbnQgdHJhbnNsYXRpb24gc2hvdWxkIG5vdCBhZmZlY3QgdGhpbmdzJyApO1xyXG5cclxuICAvLyAgICAgeCAoeDo1MClcclxuICAvLyAgICAvXHJcbiAgLy8gICBhICh4Oi01MClcclxuICAvLyAgL1xyXG4gIC8vIGJcclxuICAvLyAgXFxcclxuICAvLyAgIHkgKHNjYWxlOjIpXHJcbiAgYS5yZW1vdmVDaGlsZCggeSApO1xyXG4gIGIuYWRkQ2hpbGQoIGEgKTtcclxuICBiLmFkZENoaWxkKCB5ICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMucm93TWFqb3IoXHJcbiAgICAwLjUsIDAsIDAsXHJcbiAgICAwLCAwLjUsIDAsXHJcbiAgICAwLCAwLCAxXHJcbiAgKSwgJ25vdyA1MCBhbmQgLTUwIGNhbmNlbCBlYWNoIG90aGVyIG91dCcgKTtcclxuXHJcbiAgLy8gICAgIHggKHg6NTApXHJcbiAgLy8gICAgL1xyXG4gIC8vICAgYSAoeDotNTAsIHk6MTApXHJcbiAgLy8gIC9cclxuICAvLyBiXHJcbiAgLy8gIFxcXHJcbiAgLy8gICB5IChzY2FsZToyKVxyXG4gIGEueSA9IDEwO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLnJvd01ham9yKFxyXG4gICAgMC41LCAwLCAwLFxyXG4gICAgMCwgMC41LCA1LFxyXG4gICAgMCwgMCwgMVxyXG4gICksICdhZGp1c3RpbmcgdHJhbnNmb3JtIG9uIGFuIGFuY2VzdG9yJyApO1xyXG5cclxuICAvLyAgICAgICB4ICh4OjUwKVxyXG4gIC8vICAgICAgL1xyXG4gIC8vICAgICBhICh4Oi01MCwgeToxMClcclxuICAvLyAgICAvXHJcbiAgLy8gICBiXHJcbiAgLy8gIC9cclxuICAvLyB5IChzY2FsZToyKVxyXG4gIGIucmVtb3ZlQ2hpbGQoIHkgKTtcclxuICB5LmFkZENoaWxkKCBiICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMucm93TWFqb3IoXHJcbiAgICAxLCAwLCAwLFxyXG4gICAgMCwgMSwgMTAsXHJcbiAgICAwLCAwLCAxXHJcbiAgKSwgJ3N3YXBwaW5nIHRvIG5vIGNvbW1vbiByb290LCBpbnN0ZWFkIGFuIGFuY2VzdG9yIChpZ25vcmVzIHkgdHJhbnNmb3JtKScgKTtcclxuXHJcbiAgLy8gICAgICAgeSAoc2NhbGU6MilcclxuICAvLyAgICAgIC9cclxuICAvLyAgICAgeCAoeDo1MClcclxuICAvLyAgICAvXHJcbiAgLy8gICBhICh4Oi01MCwgeToxMClcclxuICAvLyAgL1xyXG4gIC8vIGJcclxuICB5LnJlbW92ZUNoaWxkKCBiICk7XHJcbiAgeC5hZGRDaGlsZCggeSApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLnJvd01ham9yKFxyXG4gICAgMC41LCAwLCAwLFxyXG4gICAgMCwgMC41LCAwLFxyXG4gICAgMCwgMCwgMVxyXG4gICksICdzd2FwcGluZyBvcmRlcicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ01hdHJpeEJldHdlZW5Qcm9wZXJ0eSB0cmFuc2Zvcm1zIChwYXJlbnQpJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgYSA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgYiA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgeCA9IG5ldyBOb2RlKCk7XHJcbiAgY29uc3QgeSA9IG5ldyBOb2RlKCk7XHJcblxyXG4gIGNvbnN0IG1hdHJpeEJldHdlZW5Qcm9wZXJ0eSA9IG5ldyBNYXRyaXhCZXR3ZWVuUHJvcGVydHkoIHgsIHksIHtcclxuICAgIGZyb21Db29yZGluYXRlRnJhbWU6ICdwYXJlbnQnLFxyXG4gICAgdG9Db29yZGluYXRlRnJhbWU6ICdwYXJlbnQnXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBjaGVja01hdHJpeCA9ICggbWF0cml4OiBNYXRyaXgzIHwgbnVsbCwgbWVzc2FnZTogc3RyaW5nICkgPT4ge1xyXG4gICAgY29uc3QgcHJvcE1hdHJpeCA9IG1hdHJpeEJldHdlZW5Qcm9wZXJ0eS52YWx1ZTtcclxuICAgIGFzc2VydC5vayggcHJvcE1hdHJpeCA9PT0gbWF0cml4IHx8ICggbWF0cml4ICYmIHByb3BNYXRyaXggJiYgbWF0cml4LmVxdWFscyggcHJvcE1hdHJpeCApICksIGAke21lc3NhZ2V9IGV4cGVjdGVkXFxuJHttYXRyaXh9XFxuXFxuZ290XFxuJHtwcm9wTWF0cml4fWAgKTtcclxuICB9O1xyXG5cclxuICBjaGVja01hdHJpeCggbnVsbCwgJ25vIGNvbm5lY3Rpb24gYXQgYWxsJyApO1xyXG5cclxuICAvLyAgIHhcclxuICAvLyAgL1xyXG4gIC8vIGFcclxuICAvLyAgXFxcclxuICAvLyAgIHlcclxuICBhLmFkZENoaWxkKCB4ICk7XHJcbiAgYS5hZGRDaGlsZCggeSApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLklERU5USVRZLCAnY29ubmVjdGVkLCBpZGVudGl0eScgKTtcclxuXHJcbiAgLy8gICB4ICh4OjUwKVxyXG4gIC8vICAvXHJcbiAgLy8gYVxyXG4gIC8vICBcXFxyXG4gIC8vICAgeVxyXG4gIHgueCA9IDUwO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLklERU5USVRZLCAneC95IHRyYW5zZm9ybXMgZG8gbm90IG1hdHRlciAjMScgKTtcclxuXHJcbiAgLy8gICB4ICh4OjUwKVxyXG4gIC8vICAvXHJcbiAgLy8gYVxyXG4gIC8vICBcXFxyXG4gIC8vICAgeSAoc2NhbGU6MilcclxuICB5LnNjYWxlKCAyICk7XHJcbiAgY2hlY2tNYXRyaXgoIE1hdHJpeDMuSURFTlRJVFksICd4L3kgdHJhbnNmb3JtcyBkbyBub3QgbWF0dGVyICMyJyApO1xyXG5cclxuICAvLyAgIHggKHg6NTApXHJcbiAgLy8gIC9cclxuICAvLyBhICh4Oi01MClcclxuICAvLyAgXFxcclxuICAvLyAgIHkgKHNjYWxlOjIpXHJcbiAgYS54ID0gLTUwO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLklERU5USVRZLCAneC95IHRyYW5zZm9ybXMgZG8gbm90IG1hdHRlciAjMycgKTtcclxuXHJcbiAgLy8gICAgIHggKHg6NTApXHJcbiAgLy8gICAgL1xyXG4gIC8vICAgYSAoeDotNTApXHJcbiAgLy8gIC9cclxuICAvLyBiXHJcbiAgLy8gIFxcXHJcbiAgLy8gICB5IChzY2FsZToyKVxyXG4gIGEucmVtb3ZlQ2hpbGQoIHkgKTtcclxuICBiLmFkZENoaWxkKCBhICk7XHJcbiAgYi5hZGRDaGlsZCggeSApO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLnJvd01ham9yKFxyXG4gICAgMSwgMCwgLTUwLFxyXG4gICAgMCwgMSwgMCxcclxuICAgIDAsIDAsIDFcclxuICApLCAnbm93IHRoZSAtNTAgYXBwbGllcycgKTtcclxuXHJcbiAgLy8gICAgIHggKHg6NTApXHJcbiAgLy8gICAgL1xyXG4gIC8vICAgYSAoeDotNTAsIHk6MTApXHJcbiAgLy8gIC9cclxuICAvLyBiXHJcbiAgLy8gIFxcXHJcbiAgLy8gICB5IChzY2FsZToyKVxyXG4gIGEueSA9IDEwO1xyXG4gIGNoZWNrTWF0cml4KCBNYXRyaXgzLnJvd01ham9yKFxyXG4gICAgMSwgMCwgLTUwLFxyXG4gICAgMCwgMSwgMTAsXHJcbiAgICAwLCAwLCAxXHJcbiAgKSwgJ2FkanVzdGluZyB0cmFuc2Zvcm0gb24gYW4gYW5jZXN0b3InICk7XHJcblxyXG4gIC8vICAgICAgIHggKHg6NTApXHJcbiAgLy8gICAgICAvXHJcbiAgLy8gICAgIGEgKHg6LTUwLCB5OjEwKVxyXG4gIC8vICAgIC9cclxuICAvLyAgIGJcclxuICAvLyAgL1xyXG4gIC8vIHkgKHNjYWxlOjIpXHJcbiAgYi5yZW1vdmVDaGlsZCggeSApO1xyXG4gIHkuYWRkQ2hpbGQoIGIgKTtcclxuICBjaGVja01hdHJpeCggTWF0cml4My5yb3dNYWpvcihcclxuICAgIDIsIDAsIC0xMDAsXHJcbiAgICAwLCAyLCAyMCxcclxuICAgIDAsIDAsIDFcclxuICApLCAnc3dhcHBpbmcgdG8gbm8gY29tbW9uIHJvb3QsIGluc3RlYWQgYW4gYW5jZXN0b3InICk7XHJcblxyXG4gIC8vICAgICAgIHkgKHNjYWxlOjIpXHJcbiAgLy8gICAgICAvXHJcbiAgLy8gICAgIHggKHg6NTApXHJcbiAgLy8gICAgL1xyXG4gIC8vICAgYSAoeDotNTAsIHk6MTApXHJcbiAgLy8gIC9cclxuICAvLyBiXHJcbiAgeS5yZW1vdmVDaGlsZCggYiApO1xyXG4gIHguYWRkQ2hpbGQoIHkgKTtcclxuICBjaGVja01hdHJpeCggTWF0cml4My5yb3dNYWpvcihcclxuICAgIDEsIDAsIC01MCxcclxuICAgIDAsIDEsIDAsXHJcbiAgICAwLCAwLCAxXHJcbiAgKSwgJ3N3YXBwaW5nIG9yZGVyJyApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsU0FBU0MscUJBQXFCLEVBQUVDLElBQUksUUFBUSxlQUFlO0FBRTNEQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSx1QkFBd0IsQ0FBQztBQUV2Q0QsS0FBSyxDQUFDRSxJQUFJLENBQUUsb0NBQW9DLEVBQUVDLE1BQU0sSUFBSTtFQUUxRCxNQUFNQyxDQUFDLEdBQUcsSUFBSUwsSUFBSSxDQUFDLENBQUM7RUFDcEIsTUFBTU0sQ0FBQyxHQUFHLElBQUlOLElBQUksQ0FBQyxDQUFDO0VBQ3BCLE1BQU1PLENBQUMsR0FBRyxJQUFJUCxJQUFJLENBQUMsQ0FBQztFQUNwQixNQUFNUSxDQUFDLEdBQUcsSUFBSVIsSUFBSSxDQUFDLENBQUM7RUFDcEIsTUFBTVMsQ0FBQyxHQUFHLElBQUlULElBQUksQ0FBQyxDQUFDO0VBRXBCLE1BQU1VLHFCQUFxQixHQUFHLElBQUlYLHFCQUFxQixDQUFFUyxDQUFDLEVBQUVDLENBQUUsQ0FBQztFQUUvRCxNQUFNRSxXQUFXLEdBQUdBLENBQUVDLE1BQXNCLEVBQUVDLE9BQWUsS0FBTTtJQUNqRSxNQUFNQyxVQUFVLEdBQUdKLHFCQUFxQixDQUFDSyxLQUFLO0lBQzlDWCxNQUFNLENBQUNZLEVBQUUsQ0FBRUYsVUFBVSxLQUFLRixNQUFNLElBQU1BLE1BQU0sSUFBSUUsVUFBVSxJQUFJRixNQUFNLENBQUNLLE1BQU0sQ0FBRUgsVUFBVyxDQUFHLEVBQUVELE9BQVEsQ0FBQztFQUN4RyxDQUFDO0VB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