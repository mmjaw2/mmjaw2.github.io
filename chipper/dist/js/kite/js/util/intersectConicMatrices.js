// Copyright 2023-2024, University of Colorado Boulder

/**
 * Handles intersections of conic sections (based on their matrix representations).
 *
 * Modelled off of https://math.stackexchange.com/questions/425366/finding-intersection-of-an-ellipse-with-another-ellipse-when-both-are-rotated/425412#425412
 *
 * Should be in the form specified by https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections, i.e. given
 *
 * Q(x,y) = Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0
 *
 * The matrix should be in the form:
 *
 * [ A, B/2, D/2 ]
 * [ B/2, C, E/2 ]
 * [ D/2, E/2, F ]
 *
 * In this file, we often handle matrices of complex values. They are typically 3x3 and stored in row-major order, thus:
 *
 * [ A, B, C ]
 * [ D, E, F ]
 * [ G, H, I ]
 *
 * will be stored as [ A, B, C, D, E, F, G, H, I ].
 *
 * If something is noted as a "line", it is a homogeneous-coordinate form in complex numbers, e.g. an array
 * [ a, b, c ] represents the line ax + by + c = 0.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import SingularValueDecomposition from '../../../dot/js/SingularValueDecomposition.js';
import Matrix from '../../../dot/js/Matrix.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { kite } from '../imports.js';
import Complex from '../../../dot/js/Complex.js';
import Ray2 from '../../../dot/js/Ray2.js';
import Vector4 from '../../../dot/js/Vector4.js';

// Determinant of a 2x2 matrix
const getDet2 = (a, b, c, d) => {
  return a.times(d).minus(b.times(c));
};
const getDeterminant = matrix => {
  const m00 = matrix[0];
  const m01 = matrix[1];
  const m02 = matrix[2];
  const m10 = matrix[3];
  const m11 = matrix[4];
  const m12 = matrix[5];
  const m20 = matrix[6];
  const m21 = matrix[7];
  const m22 = matrix[8];
  return m00.times(m11).times(m22).plus(m01.times(m12).times(m20)).plus(m02.times(m10).times(m21)).minus(m02.times(m11).times(m20)).minus(m01.times(m10).times(m22)).minus(m00.times(m12).times(m21));
};

// Adjugate of a 3x3 matrix in row-major order
const getAdjugateMatrix = matrix => {
  const m11 = matrix[0];
  const m12 = matrix[1];
  const m13 = matrix[2];
  const m21 = matrix[3];
  const m22 = matrix[4];
  const m23 = matrix[5];
  const m31 = matrix[6];
  const m32 = matrix[7];
  const m33 = matrix[8];
  return [getDet2(m22, m23, m32, m33), getDet2(m12, m13, m32, m33).negate(), getDet2(m12, m13, m22, m23), getDet2(m21, m23, m31, m33).negate(), getDet2(m11, m13, m31, m33), getDet2(m11, m13, m21, m23).negate(), getDet2(m21, m22, m31, m32), getDet2(m11, m12, m31, m32).negate(), getDet2(m11, m12, m21, m22)];
};

// NOTE: Do we need to invert the imaginary parts here? Complex transpose...?
const getTranspose = matrix => {
  return [matrix[0], matrix[3], matrix[6], matrix[1], matrix[4], matrix[7], matrix[2], matrix[5], matrix[8]];
};

// If checkLast=false, we won't provide rows that have a zero in the first two entries
const getNonzeroRow = (matrix, checkLast = false) => {
  return _.sortBy([matrix.slice(0, 3), matrix.slice(3, 6), matrix.slice(6, 9)], row => {
    return -(row[0].magnitude + row[1].magnitude + (checkLast ? row[2].magnitude : 0));
  })[0];
};

// If checkLast=false, we won't provide columns that have a zero in the first two entries
const getNonzeroColumn = (matrix, checkLast = false) => {
  return getNonzeroRow(getTranspose(matrix), checkLast);
};
const getAntiSymmetricMatrix = matrix => {
  const adjugate = getAdjugateMatrix(matrix);
  const nonzeroRow = getNonzeroRow(adjugate);
  return [Complex.ZERO, nonzeroRow[2], nonzeroRow[1].negated(), nonzeroRow[2].negated(), Complex.ZERO, nonzeroRow[0], nonzeroRow[1], nonzeroRow[0].negated(), Complex.ZERO];
};
const computeAlpha = (degenerateConicMatrix, antiSymmetricMatrix) => {
  // Can use an arbitrary 2x2 minor to compute, since we want:
  // rank( degenerateConicMatrix + alpha * antiSymmetricMatrix ) = 1

  // ( d00 + alpha * a00 ) * q = ( d01 + alpha * a01 )
  // ( d10 + alpha * a10 ) * q = ( d11 + alpha * a11 )
  // ( d01 + alpha * a01 ) / ( d00 + alpha * a00 ) = ( d11 + alpha * a11 ) / ( d10 + alpha * a10 )
  // ( d01 + alpha * a01 ) * ( d10 + alpha * a10 ) - ( d00 + alpha * a00 ) * ( d11 + alpha * a11 ) = 0
  // ( a01 * a10 - a00 * a11 ) alpha^2 + d01 * d10 - d00 * d11 + alpha (-a11 * d00 + a10 * d01 + a01 * d10 - a00 * d11 )
  // ( a01 * a10 - a00 * a11 ) alpha^2 + (-a11 * d00 + a10 * d01 + a01 * d10 - a00 * d11 ) alpha + (d01 * d10 - d00 * d11)
  const d00 = degenerateConicMatrix[0];
  const d01 = degenerateConicMatrix[1];
  const d10 = degenerateConicMatrix[3];
  const d11 = degenerateConicMatrix[4];
  const a00 = antiSymmetricMatrix[0];
  const a01 = antiSymmetricMatrix[1];
  const a10 = antiSymmetricMatrix[3];
  const a11 = antiSymmetricMatrix[4];

  // TODO: less garbage creation https://github.com/phetsims/kite/issues/97
  const A = a01.times(a10).minus(a00.times(a11));
  const B = a11.negated().times(d00).plus(a10.times(d01)).plus(a01.times(d10)).minus(a00.times(d11));
  const C = d01.times(d10).minus(d00.times(d11));
  const roots = Complex.solveQuadraticRoots(A, B, C);

  // If there are roots, pick the first one
  return roots === null ? null : roots[0];
};
const getRank1DegenerateConicMatrix = matrix => {
  const antiSymmetricMatrix = getAntiSymmetricMatrix(matrix);
  const alpha = computeAlpha(matrix, antiSymmetricMatrix);
  if (alpha === null) {
    // already in proper form, adding the antiSymmetricMatrix in any linear combination will still be rank 1
    return matrix;
  } else {
    return [matrix[0].plus(alpha.times(antiSymmetricMatrix[0])), matrix[1].plus(alpha.times(antiSymmetricMatrix[1])), matrix[2].plus(alpha.times(antiSymmetricMatrix[2])), matrix[3].plus(alpha.times(antiSymmetricMatrix[3])), matrix[4].plus(alpha.times(antiSymmetricMatrix[4])), matrix[5].plus(alpha.times(antiSymmetricMatrix[5])), matrix[6].plus(alpha.times(antiSymmetricMatrix[6])), matrix[7].plus(alpha.times(antiSymmetricMatrix[7])), matrix[8].plus(alpha.times(antiSymmetricMatrix[8]))];
  }
};

/**
 * A degenerate conic is essentially a product of two lines, e.g. (Px + Qy + C)(Sx + Ty + U) = 0 (where everything is
 * complex valued in this case). Each line is topologically equivalent to a plane.
 */
const getRealIntersectionsForDegenerateConic = matrix => {
  // TODO: check whether we are symmetric. https://github.com/phetsims/kite/issues/97
  const result = [];
  // Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0 (complex valued)
  const A = matrix[0];
  const B = matrix[1].times(Complex.real(2));
  const C = matrix[4];
  const D = matrix[2].times(Complex.real(2));
  const E = matrix[5].times(Complex.real(2));
  const F = matrix[8];

  // const ev = ( x: Complex, y: Complex ) => {
  //   return A.times( x ).times( x )
  //     .plus( B.times( x ).times( y ) )
  //     .plus( C.times( y ).times( y ) )
  //     .plus( D.times( x ) )
  //     .plus( E.times( y ) )
  //     .plus( F );
  // };

  // We'll now find (ideally) two solutions for the conic, such that they are each on one of the lines
  let solutions = [];
  const alpha = new Complex(-2.51653525696959, 1.52928502844020); // randomly chosen
  // first try picking an x and solve for multiple y (x=alpha)
  // (C)y^2 + (B*alpha + E)y + (A*alpha^2 + D*alpha + F) = 0
  const xAlphaA = C;
  const xAlphaB = B.times(alpha).plus(E);
  const xAlphaC = A.times(alpha).times(alpha).plus(D.times(alpha)).plus(F);
  const xAlphaRoots = Complex.solveQuadraticRoots(xAlphaA, xAlphaB, xAlphaC);
  if (xAlphaRoots && xAlphaRoots.length >= 2) {
    solutions = [[alpha, xAlphaRoots[0]], [alpha, xAlphaRoots[1]]];
  } else {
    // Now try y=alpha
    // (A)x^2 + (B*alpha + D)x + (C*alpha^2 + E*alpha + F) = 0
    const yAlphaA = A;
    const yAlphaB = B.times(alpha).plus(D);
    const yAlphaC = C.times(alpha).times(alpha).plus(E.times(alpha)).plus(F);
    const yAlphaRoots = Complex.solveQuadraticRoots(yAlphaA, yAlphaB, yAlphaC);
    if (yAlphaRoots && yAlphaRoots.length >= 2) {
      solutions = [[yAlphaRoots[0], alpha], [yAlphaRoots[1], alpha]];
    } else {
      // Select only one root if we have it, we might have a double line
      if (xAlphaRoots && xAlphaRoots.length === 1) {
        solutions = [[alpha, xAlphaRoots[0]]];
      } else if (yAlphaRoots && yAlphaRoots.length === 1) {
        solutions = [[yAlphaRoots[0], alpha]];
      } else {
        throw new Error('Implement more advanced initialization to find two solutions');
      }
    }
  }
  solutions.forEach(solution => {
    // Here, we'll be breaking out the complex x,y into quads of: [ realX, realY, imaginaryX, imaginaryY ] denoted as
    // [ rx, ry, ix, iy ].

    /**
     * Broken case:
      A
      Complex {real: -2.3062816034702394e-7, imaginary: -0.000050001623100918746}
      B
      Complex {real: 0, imaginary: 0}
      C
      Complex {real: -2.3062816034702394e-7, imaginary: -0.000050001623100918746}
      D
      Complex {real: -0.009907748735827226, imaginary: 0.0200006492403675}
      E
      Complex {real: 0.00009225126416367857, imaginary: 0.0200006492403675}
      F
      Complex {real: 1.9838810287765227, imaginary: -3.5001136170643123}
         real: 200.0025, 100   and 200.0025, 300    are better solutions, but obviously could be refined
     */

    const rx = solution[0].real;
    const ry = solution[1].real;
    const ix = solution[0].imaginary;
    const iy = solution[1].imaginary;
    const rA = A.real;
    const rB = B.real;
    const rC = C.real;
    const rD = D.real;
    const rE = E.real;
    const iA = A.imaginary;
    const iB = B.imaginary;
    const iC = C.imaginary;
    const iD = D.imaginary;
    const iE = E.imaginary;
    // rx, ry, ix, iy

    const realGradient = new Vector4(-2 * iA * ix - iB * iy + rD + 2 * rA * rx + rB * ry, -iB * ix - 2 * iC * iy + rE + rB * rx + 2 * rC * ry, -iD - 2 * ix * rA - iy * rB - 2 * iA * rx - iB * ry, -iE - ix * rB - 2 * iy * rC - iB * rx - 2 * iC * ry);

    // [ number, number, number, number ]
    const imaginaryGradient = new Vector4(iD + 2 * ix * rA + iy * rB + 2 * iA * rx + iB * ry, iE + ix * rB + 2 * iy * rC + iB * rx + 2 * iC * ry, -2 * iA * ix - iB * iy + rD + 2 * rA * rx + rB * ry, -iB * ix - 2 * iC * iy + rE + rB * rx + 2 * rC * ry);
    const randomPointA = new Vector4(6.1951068548253, -1.1592689503860, 0.1602918829294, 3.205818692048202);
    const randomPointB = new Vector4(-5.420628549296924, -15.2069583028685, 0.1595906020488680, 5.10688288040682);
    const proj = (v, u) => {
      return u.timesScalar(v.dot(u) / u.dot(u));
    };

    // Gram-Schmidt orthogonalization to get a nice basis
    const basisRealGradient = realGradient;
    const basisImaginaryGradient = imaginaryGradient.minus(proj(imaginaryGradient, basisRealGradient));
    const basisPlane0 = randomPointA.minus(proj(randomPointA, basisRealGradient)).minus(proj(randomPointA, basisImaginaryGradient));
    const basisPlane1 = randomPointB.minus(proj(randomPointB, basisRealGradient)).minus(proj(randomPointB, basisImaginaryGradient)).minus(proj(randomPointB, basisPlane0));

    // Our basis in the exclusively-imaginary plane
    const basisMatrix = new Matrix(2, 2, [basisPlane0.z, basisPlane1.z, basisPlane0.w, basisPlane1.w]);
    const singularValues = new SingularValueDecomposition(basisMatrix).getSingularValues();
    let realSolution = null;
    if (Math.abs(ix) < 1e-10 && Math.abs(iy) < 1e-10) {
      realSolution = new Vector2(rx, ry);
    } else {
      // iP + t * iB0 + u * iB1 = 0, if we can find t,u where (P + t * B0 + u * B1) is real
      //
      // [ iB0x IB1x ] [ t ] = [ -iPx ]
      // [ iB0y IB1y ] [ u ]   [ -iPy ]

      if (Math.abs(singularValues[1]) > 1e-10) {
        // rank 2
        const tu = basisMatrix.solve(new Matrix(2, 1, [-ix, -iy])).extractVector2(0);
        realSolution = new Vector2(rx + tu.x * basisPlane0.z + tu.y * basisPlane1.z, ry + tu.x * basisPlane0.w + tu.y * basisPlane1.w);
      } else if (Math.abs(singularValues[0]) > 1e-10) {
        // rank 1 - columns are multiples of each other, one possibly (0,0)

        // For imaginary bases (we'll use them potentially multiple times if we have a rank 1 matrix
        const largestBasis = Math.abs(basisPlane0.z) + Math.abs(basisPlane0.w) > Math.abs(basisPlane1.z) + Math.abs(basisPlane1.w) ? basisPlane0 : basisPlane1;
        const largestBasisImaginaryVector = new Vector2(largestBasis.z, largestBasis.w);
        const t = new Vector2(ix, iy).dot(largestBasisImaginaryVector) / largestBasisImaginaryVector.dot(largestBasisImaginaryVector);
        const potentialSolution = new Vector4(rx, ry, ix, iy).minus(largestBasis.timesScalar(t));
        if (Math.abs(potentialSolution.z) < 1e-8 && Math.abs(potentialSolution.w) < 1e-8) {
          realSolution = new Vector2(potentialSolution.x, potentialSolution.y);
        }
      } else {
        // rank 0 AND our solution is NOT real, then there is no solution
        realSolution = null;
      }
      if (realSolution) {
        // We need to check if we have a line of solutions now!
        if (Math.abs(singularValues[1]) > 1e-10) {
          // rank 2
          // Our solution is the only solution (no linear combination of basis vectors besides our current solution
          // that would be real)
          result.push(realSolution);
        } else if (Math.abs(singularValues[0]) > 1e-10) {
          // rank 1
          // Our bases are a multiple of each other. We need to find a linear combination of them that is real, then
          // every multiple of that will be a solution (line). If either is (0,0), we will use that one, so check that
          // first
          // TODO: can we deduplicate this with code above? https://github.com/phetsims/kite/issues/97
          const zeroLarger = Math.abs(basisPlane0.z) + Math.abs(basisPlane0.w) > Math.abs(basisPlane1.z) + Math.abs(basisPlane1.w);
          const smallestBasis = zeroLarger ? basisPlane1 : basisPlane0;
          const largestBasis = zeroLarger ? basisPlane0 : basisPlane1;

          // Find the largest component, so if we have a zero x or y in both our bases, it will work out fine
          const xLarger = Math.abs(largestBasis.z) > Math.abs(largestBasis.w);

          // largestBasis * t = smallestBasis, supports smallestBasis=(0,0)
          const t = xLarger ? smallestBasis.z / largestBasis.z : smallestBasis.w / largestBasis.w;
          const direction4 = largestBasis.timesScalar(t).minus(smallestBasis);

          // Should be unconditionally a non-zero direction, otherwise they wouldn't be basis vectors
          result.push(new Ray2(realSolution, new Vector2(direction4.x, direction4.y).normalized()));
        } else {
          // rank 0
          // THEY ARE ALL SOLUTIONS, we're on the real plane. That isn't useful to us, so we don't add any results
        }
      }
    }
  });
  return result;
};
const getLinesForDegenerateConic = matrix => {
  const rank1DegenerateConicMatrix = getRank1DegenerateConicMatrix(matrix);
  return [getNonzeroRow(rank1DegenerateConicMatrix), getNonzeroColumn(rank1DegenerateConicMatrix)];
};
const lineIntersect = (line1, line2) => {
  // line1: a1 * x + b1 * y + c1 = 0
  // line2: a2 * x + b2 * y + c2 = 0
  // y = ( -a1 * x - c1 ) / b1
  // y = ( -a2 * x - c2 ) / b2
  // ( -a1 * x - c1 ) / b1 = ( -a2 * x - c2 ) / b2
  // ( -a1 * x - c1 ) * b2 = ( -a2 * x - c2 ) * b1

  // x = ( b2 * c1 - b1 * c2 ) / ( a2 * b1 - a1 * b2 );

  const a1 = line1[0];
  const b1 = line1[1];
  const c1 = line1[2];
  const a2 = line2[0];
  const b2 = line2[1];
  const c2 = line2[2];
  const determinant = a2.times(b1).minus(a1.times(b2));
  if (determinant.equalsEpsilon(Complex.ZERO, 1e-8)) {
    return null;
  } else {
    const x = b2.times(c1).minus(b1.times(c2)).dividedBy(determinant);
    let y;
    if (!b1.equalsEpsilon(Complex.ZERO, 1e-8)) {
      y = a1.negated().times(x).minus(c1).dividedBy(b1); // Use our first line
    } else if (!b2.equalsEpsilon(Complex.ZERO, 1e-8)) {
      y = a2.negated().times(x).minus(c2).dividedBy(b2); // Use our second line
    } else {
      return null;
    }

    // TODO: epsilon evaluation? https://github.com/phetsims/kite/issues/97
    if (Math.abs(x.imaginary) < 1e-8 && Math.abs(y.imaginary) < 1e-8) {
      return new Vector2(x.real, y.real);
    } else {
      return null;
    }
  }
};
// NOTE: Assumes these matrices are NOT degenerate (will only be tested for circles/ellipses)
const intersectConicMatrices = (a, b) => {
  // Modeled off of

  // compute C = lambda * A + B, where lambda is chosen so that det(C) = 0
  // NOTE: This assumes we don't have degenerate conic matrices

  // det(C) = c00 * c11 * c22 + c01 * c12 * c20 + c02 * c10 * c21 - c02 * c11 * c20 - c01 * c10 * c22 - c00 * c12 * c21
  // c00 = a00 * lambda + b00
  // c01 = a01 * lambda + b01
  // c02 = a02 * lambda + b02
  // c10 = a10 * lambda + b10
  // c11 = a11 * lambda + b11
  // c12 = a12 * lambda + b12
  // c20 = a20 * lambda + b20
  // c21 = a21 * lambda + b21
  // c22 = a22 * lambda + b22

  // A lambda^3 + B lambda^2 + C lambda + D = 0

  const a00 = a.m00();
  const a01 = a.m01();
  const a02 = a.m02();
  const a10 = a.m10();
  const a11 = a.m11();
  const a12 = a.m12();
  const a20 = a.m20();
  const a21 = a.m21();
  const a22 = a.m22();
  const b00 = b.m00();
  const b01 = b.m01();
  const b02 = b.m02();
  const b10 = b.m10();
  const b11 = b.m11();
  const b12 = b.m12();
  const b20 = b.m20();
  const b21 = b.m21();
  const b22 = b.m22();
  const A = -a02 * a11 * a20 + a01 * a12 * a20 + a02 * a10 * a21 - a00 * a12 * a21 - a01 * a10 * a22 + a00 * a11 * a22;
  const B = -a10 * a22 * b01 + a10 * a21 * b02 + a02 * a21 * b10 - a01 * a22 * b10 - a02 * a20 * b11 + a00 * a22 * b11 + a01 * a20 * b12 - a00 * a21 * b12 + a02 * a10 * b21 + a12 * (-a21 * b00 + a20 * b01 + a01 * b20 - a00 * b21) - a01 * a10 * b22 + a11 * (a22 * b00 - a20 * b02 - a02 * b20 + a00 * b22);
  const C = -a22 * b01 * b10 + a21 * b02 * b10 + a22 * b00 * b11 - a20 * b02 * b11 - a21 * b00 * b12 + a20 * b01 * b12 + a12 * b01 * b20 - a11 * b02 * b20 - a02 * b11 * b20 + a01 * b12 * b20 - a12 * b00 * b21 + a10 * b02 * b21 + a02 * b10 * b21 - a00 * b12 * b21 + a11 * b00 * b22 - a10 * b01 * b22 - a01 * b10 * b22 + a00 * b11 * b22;
  const D = -b02 * b11 * b20 + b01 * b12 * b20 + b02 * b10 * b21 - b00 * b12 * b21 - b01 * b10 * b22 + b00 * b11 * b22;

  // NOTE: we don't have a discriminant threshold right now
  const potentialLambdas = Complex.solveCubicRoots(Complex.real(A), Complex.real(B), Complex.real(C), Complex.real(D));
  if (!potentialLambdas || potentialLambdas.length === 0) {
    // Probably overlapping, infinite intersections
    return {
      degenerateConicMatrices: [],
      intersectionCollections: [],
      points: [],
      lines: []
    };
  }
  const uniqueLambdas = _.uniqWith(potentialLambdas, (a, b) => a.equals(b));
  const degenerateConicMatrices = uniqueLambdas.map(lambda => {
    return [Complex.real(a00).multiply(lambda).add(Complex.real(b00)), Complex.real(a01).multiply(lambda).add(Complex.real(b01)), Complex.real(a02).multiply(lambda).add(Complex.real(b02)), Complex.real(a10).multiply(lambda).add(Complex.real(b10)), Complex.real(a11).multiply(lambda).add(Complex.real(b11)), Complex.real(a12).multiply(lambda).add(Complex.real(b12)), Complex.real(a20).multiply(lambda).add(Complex.real(b20)), Complex.real(a21).multiply(lambda).add(Complex.real(b21)), Complex.real(a22).multiply(lambda).add(Complex.real(b22))];
  });
  console.log('determinant magnitudes', degenerateConicMatrices.map(m => getDeterminant(m).magnitude));
  const result = [];
  const lineCollections = degenerateConicMatrices.map(getLinesForDegenerateConic);
  console.log(lineCollections);
  const intersectionCollections = degenerateConicMatrices.map(getRealIntersectionsForDegenerateConic);
  console.log(intersectionCollections);
  for (let i = 0; i < lineCollections.length; i++) {
    const lines0 = lineCollections[i];

    // We need to handle a case where two conics are touching at a tangent point
    const selfIntersection = lineIntersect(lines0[0], lines0[1]);
    if (selfIntersection) {
      result.push(selfIntersection);
    }
    for (let j = i + 1; j < lineCollections.length; j++) {
      const lines1 = lineCollections[j];
      const candidates = [lineIntersect(lines0[0], lines1[0]), lineIntersect(lines0[0], lines1[1]), lineIntersect(lines0[1], lines1[0]), lineIntersect(lines0[1], lines1[1])];
      for (let k = 0; k < 4; k++) {
        const candidate = candidates[k];
        if (candidate) {
          result.push(candidate);
        }
      }
    }
  }
  return {
    points: result,
    degenerateConicMatrices: degenerateConicMatrices,
    lines: _.flatten(lineCollections),
    intersectionCollections: intersectionCollections
  };
};
export default intersectConicMatrices;
kite.register('intersectConicMatrices', intersectConicMatrices);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbiIsIk1hdHJpeCIsIlZlY3RvcjIiLCJraXRlIiwiQ29tcGxleCIsIlJheTIiLCJWZWN0b3I0IiwiZ2V0RGV0MiIsImEiLCJiIiwiYyIsImQiLCJ0aW1lcyIsIm1pbnVzIiwiZ2V0RGV0ZXJtaW5hbnQiLCJtYXRyaXgiLCJtMDAiLCJtMDEiLCJtMDIiLCJtMTAiLCJtMTEiLCJtMTIiLCJtMjAiLCJtMjEiLCJtMjIiLCJwbHVzIiwiZ2V0QWRqdWdhdGVNYXRyaXgiLCJtMTMiLCJtMjMiLCJtMzEiLCJtMzIiLCJtMzMiLCJuZWdhdGUiLCJnZXRUcmFuc3Bvc2UiLCJnZXROb256ZXJvUm93IiwiY2hlY2tMYXN0IiwiXyIsInNvcnRCeSIsInNsaWNlIiwicm93IiwibWFnbml0dWRlIiwiZ2V0Tm9uemVyb0NvbHVtbiIsImdldEFudGlTeW1tZXRyaWNNYXRyaXgiLCJhZGp1Z2F0ZSIsIm5vbnplcm9Sb3ciLCJaRVJPIiwibmVnYXRlZCIsImNvbXB1dGVBbHBoYSIsImRlZ2VuZXJhdGVDb25pY01hdHJpeCIsImFudGlTeW1tZXRyaWNNYXRyaXgiLCJkMDAiLCJkMDEiLCJkMTAiLCJkMTEiLCJhMDAiLCJhMDEiLCJhMTAiLCJhMTEiLCJBIiwiQiIsIkMiLCJyb290cyIsInNvbHZlUXVhZHJhdGljUm9vdHMiLCJnZXRSYW5rMURlZ2VuZXJhdGVDb25pY01hdHJpeCIsImFscGhhIiwiZ2V0UmVhbEludGVyc2VjdGlvbnNGb3JEZWdlbmVyYXRlQ29uaWMiLCJyZXN1bHQiLCJyZWFsIiwiRCIsIkUiLCJGIiwic29sdXRpb25zIiwieEFscGhhQSIsInhBbHBoYUIiLCJ4QWxwaGFDIiwieEFscGhhUm9vdHMiLCJsZW5ndGgiLCJ5QWxwaGFBIiwieUFscGhhQiIsInlBbHBoYUMiLCJ5QWxwaGFSb290cyIsIkVycm9yIiwiZm9yRWFjaCIsInNvbHV0aW9uIiwicngiLCJyeSIsIml4IiwiaW1hZ2luYXJ5IiwiaXkiLCJyQSIsInJCIiwickMiLCJyRCIsInJFIiwiaUEiLCJpQiIsImlDIiwiaUQiLCJpRSIsInJlYWxHcmFkaWVudCIsImltYWdpbmFyeUdyYWRpZW50IiwicmFuZG9tUG9pbnRBIiwicmFuZG9tUG9pbnRCIiwicHJvaiIsInYiLCJ1IiwidGltZXNTY2FsYXIiLCJkb3QiLCJiYXNpc1JlYWxHcmFkaWVudCIsImJhc2lzSW1hZ2luYXJ5R3JhZGllbnQiLCJiYXNpc1BsYW5lMCIsImJhc2lzUGxhbmUxIiwiYmFzaXNNYXRyaXgiLCJ6IiwidyIsInNpbmd1bGFyVmFsdWVzIiwiZ2V0U2luZ3VsYXJWYWx1ZXMiLCJyZWFsU29sdXRpb24iLCJNYXRoIiwiYWJzIiwidHUiLCJzb2x2ZSIsImV4dHJhY3RWZWN0b3IyIiwieCIsInkiLCJsYXJnZXN0QmFzaXMiLCJsYXJnZXN0QmFzaXNJbWFnaW5hcnlWZWN0b3IiLCJ0IiwicG90ZW50aWFsU29sdXRpb24iLCJwdXNoIiwiemVyb0xhcmdlciIsInNtYWxsZXN0QmFzaXMiLCJ4TGFyZ2VyIiwiZGlyZWN0aW9uNCIsIm5vcm1hbGl6ZWQiLCJnZXRMaW5lc0ZvckRlZ2VuZXJhdGVDb25pYyIsInJhbmsxRGVnZW5lcmF0ZUNvbmljTWF0cml4IiwibGluZUludGVyc2VjdCIsImxpbmUxIiwibGluZTIiLCJhMSIsImIxIiwiYzEiLCJhMiIsImIyIiwiYzIiLCJkZXRlcm1pbmFudCIsImVxdWFsc0Vwc2lsb24iLCJkaXZpZGVkQnkiLCJpbnRlcnNlY3RDb25pY01hdHJpY2VzIiwiYTAyIiwiYTEyIiwiYTIwIiwiYTIxIiwiYTIyIiwiYjAwIiwiYjAxIiwiYjAyIiwiYjEwIiwiYjExIiwiYjEyIiwiYjIwIiwiYjIxIiwiYjIyIiwicG90ZW50aWFsTGFtYmRhcyIsInNvbHZlQ3ViaWNSb290cyIsImRlZ2VuZXJhdGVDb25pY01hdHJpY2VzIiwiaW50ZXJzZWN0aW9uQ29sbGVjdGlvbnMiLCJwb2ludHMiLCJsaW5lcyIsInVuaXF1ZUxhbWJkYXMiLCJ1bmlxV2l0aCIsImVxdWFscyIsIm1hcCIsImxhbWJkYSIsIm11bHRpcGx5IiwiYWRkIiwiY29uc29sZSIsImxvZyIsIm0iLCJsaW5lQ29sbGVjdGlvbnMiLCJpIiwibGluZXMwIiwic2VsZkludGVyc2VjdGlvbiIsImoiLCJsaW5lczEiLCJjYW5kaWRhdGVzIiwiayIsImNhbmRpZGF0ZSIsImZsYXR0ZW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbImludGVyc2VjdENvbmljTWF0cmljZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSGFuZGxlcyBpbnRlcnNlY3Rpb25zIG9mIGNvbmljIHNlY3Rpb25zIChiYXNlZCBvbiB0aGVpciBtYXRyaXggcmVwcmVzZW50YXRpb25zKS5cclxuICpcclxuICogTW9kZWxsZWQgb2ZmIG9mIGh0dHBzOi8vbWF0aC5zdGFja2V4Y2hhbmdlLmNvbS9xdWVzdGlvbnMvNDI1MzY2L2ZpbmRpbmctaW50ZXJzZWN0aW9uLW9mLWFuLWVsbGlwc2Utd2l0aC1hbm90aGVyLWVsbGlwc2Utd2hlbi1ib3RoLWFyZS1yb3RhdGVkLzQyNTQxMiM0MjU0MTJcclxuICpcclxuICogU2hvdWxkIGJlIGluIHRoZSBmb3JtIHNwZWNpZmllZCBieSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NYXRyaXhfcmVwcmVzZW50YXRpb25fb2ZfY29uaWNfc2VjdGlvbnMsIGkuZS4gZ2l2ZW5cclxuICpcclxuICogUSh4LHkpID0gQXheMiArIEJ4eSArIEN5XjIgKyBEeCArIEV5ICsgRiA9IDBcclxuICpcclxuICogVGhlIG1hdHJpeCBzaG91bGQgYmUgaW4gdGhlIGZvcm06XHJcbiAqXHJcbiAqIFsgQSwgQi8yLCBELzIgXVxyXG4gKiBbIEIvMiwgQywgRS8yIF1cclxuICogWyBELzIsIEUvMiwgRiBdXHJcbiAqXHJcbiAqIEluIHRoaXMgZmlsZSwgd2Ugb2Z0ZW4gaGFuZGxlIG1hdHJpY2VzIG9mIGNvbXBsZXggdmFsdWVzLiBUaGV5IGFyZSB0eXBpY2FsbHkgM3gzIGFuZCBzdG9yZWQgaW4gcm93LW1ham9yIG9yZGVyLCB0aHVzOlxyXG4gKlxyXG4gKiBbIEEsIEIsIEMgXVxyXG4gKiBbIEQsIEUsIEYgXVxyXG4gKiBbIEcsIEgsIEkgXVxyXG4gKlxyXG4gKiB3aWxsIGJlIHN0b3JlZCBhcyBbIEEsIEIsIEMsIEQsIEUsIEYsIEcsIEgsIEkgXS5cclxuICpcclxuICogSWYgc29tZXRoaW5nIGlzIG5vdGVkIGFzIGEgXCJsaW5lXCIsIGl0IGlzIGEgaG9tb2dlbmVvdXMtY29vcmRpbmF0ZSBmb3JtIGluIGNvbXBsZXggbnVtYmVycywgZS5nLiBhbiBhcnJheVxyXG4gKiBbIGEsIGIsIGMgXSByZXByZXNlbnRzIHRoZSBsaW5lIGF4ICsgYnkgKyBjID0gMC5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbiBmcm9tICcuLi8uLi8uLi9kb3QvanMvU2luZ3VsYXJWYWx1ZURlY29tcG9zaXRpb24uanMnO1xyXG5pbXBvcnQgTWF0cml4IGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXguanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsga2l0ZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQ29tcGxleCBmcm9tICcuLi8uLi8uLi9kb3QvanMvQ29tcGxleC5qcyc7XHJcbmltcG9ydCBSYXkyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9SYXkyLmpzJztcclxuaW1wb3J0IFZlY3RvcjQgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjQuanMnO1xyXG5cclxuLy8gRGV0ZXJtaW5hbnQgb2YgYSAyeDIgbWF0cml4XHJcbmNvbnN0IGdldERldDIgPSAoIGE6IENvbXBsZXgsIGI6IENvbXBsZXgsIGM6IENvbXBsZXgsIGQ6IENvbXBsZXggKSA9PiB7XHJcbiAgcmV0dXJuIGEudGltZXMoIGQgKS5taW51cyggYi50aW1lcyggYyApICk7XHJcbn07XHJcblxyXG5jb25zdCBnZXREZXRlcm1pbmFudCA9ICggbWF0cml4OiBDb21wbGV4W10gKTogQ29tcGxleCA9PiB7XHJcbiAgY29uc3QgbTAwID0gbWF0cml4WyAwIF07XHJcbiAgY29uc3QgbTAxID0gbWF0cml4WyAxIF07XHJcbiAgY29uc3QgbTAyID0gbWF0cml4WyAyIF07XHJcbiAgY29uc3QgbTEwID0gbWF0cml4WyAzIF07XHJcbiAgY29uc3QgbTExID0gbWF0cml4WyA0IF07XHJcbiAgY29uc3QgbTEyID0gbWF0cml4WyA1IF07XHJcbiAgY29uc3QgbTIwID0gbWF0cml4WyA2IF07XHJcbiAgY29uc3QgbTIxID0gbWF0cml4WyA3IF07XHJcbiAgY29uc3QgbTIyID0gbWF0cml4WyA4IF07XHJcblxyXG4gIHJldHVybiAoIG0wMC50aW1lcyggbTExICkudGltZXMoIG0yMiApICkucGx1cyggbTAxLnRpbWVzKCBtMTIgKS50aW1lcyggbTIwICkgKS5wbHVzKCBtMDIudGltZXMoIG0xMCApLnRpbWVzKCBtMjEgKSApLm1pbnVzKCBtMDIudGltZXMoIG0xMSApLnRpbWVzKCBtMjAgKSApLm1pbnVzKCBtMDEudGltZXMoIG0xMCApLnRpbWVzKCBtMjIgKSApLm1pbnVzKCBtMDAudGltZXMoIG0xMiApLnRpbWVzKCBtMjEgKSApO1xyXG59O1xyXG5cclxuLy8gQWRqdWdhdGUgb2YgYSAzeDMgbWF0cml4IGluIHJvdy1tYWpvciBvcmRlclxyXG5jb25zdCBnZXRBZGp1Z2F0ZU1hdHJpeCA9ICggbWF0cml4OiBDb21wbGV4W10gKTogQ29tcGxleFtdID0+IHtcclxuICBjb25zdCBtMTEgPSBtYXRyaXhbIDAgXTtcclxuICBjb25zdCBtMTIgPSBtYXRyaXhbIDEgXTtcclxuICBjb25zdCBtMTMgPSBtYXRyaXhbIDIgXTtcclxuICBjb25zdCBtMjEgPSBtYXRyaXhbIDMgXTtcclxuICBjb25zdCBtMjIgPSBtYXRyaXhbIDQgXTtcclxuICBjb25zdCBtMjMgPSBtYXRyaXhbIDUgXTtcclxuICBjb25zdCBtMzEgPSBtYXRyaXhbIDYgXTtcclxuICBjb25zdCBtMzIgPSBtYXRyaXhbIDcgXTtcclxuICBjb25zdCBtMzMgPSBtYXRyaXhbIDggXTtcclxuXHJcbiAgcmV0dXJuIFtcclxuICAgIGdldERldDIoIG0yMiwgbTIzLCBtMzIsIG0zMyApLFxyXG4gICAgZ2V0RGV0MiggbTEyLCBtMTMsIG0zMiwgbTMzICkubmVnYXRlKCksXHJcbiAgICBnZXREZXQyKCBtMTIsIG0xMywgbTIyLCBtMjMgKSxcclxuICAgIGdldERldDIoIG0yMSwgbTIzLCBtMzEsIG0zMyApLm5lZ2F0ZSgpLFxyXG4gICAgZ2V0RGV0MiggbTExLCBtMTMsIG0zMSwgbTMzICksXHJcbiAgICBnZXREZXQyKCBtMTEsIG0xMywgbTIxLCBtMjMgKS5uZWdhdGUoKSxcclxuICAgIGdldERldDIoIG0yMSwgbTIyLCBtMzEsIG0zMiApLFxyXG4gICAgZ2V0RGV0MiggbTExLCBtMTIsIG0zMSwgbTMyICkubmVnYXRlKCksXHJcbiAgICBnZXREZXQyKCBtMTEsIG0xMiwgbTIxLCBtMjIgKVxyXG4gIF07XHJcbn07XHJcblxyXG4vLyBOT1RFOiBEbyB3ZSBuZWVkIHRvIGludmVydCB0aGUgaW1hZ2luYXJ5IHBhcnRzIGhlcmU/IENvbXBsZXggdHJhbnNwb3NlLi4uP1xyXG5jb25zdCBnZXRUcmFuc3Bvc2UgPSAoIG1hdHJpeDogQ29tcGxleFtdICk6IENvbXBsZXhbXSA9PiB7XHJcbiAgcmV0dXJuIFtcclxuICAgIG1hdHJpeFsgMCBdLCBtYXRyaXhbIDMgXSwgbWF0cml4WyA2IF0sXHJcbiAgICBtYXRyaXhbIDEgXSwgbWF0cml4WyA0IF0sIG1hdHJpeFsgNyBdLFxyXG4gICAgbWF0cml4WyAyIF0sIG1hdHJpeFsgNSBdLCBtYXRyaXhbIDggXVxyXG4gIF07XHJcbn07XHJcblxyXG4vLyBJZiBjaGVja0xhc3Q9ZmFsc2UsIHdlIHdvbid0IHByb3ZpZGUgcm93cyB0aGF0IGhhdmUgYSB6ZXJvIGluIHRoZSBmaXJzdCB0d28gZW50cmllc1xyXG5jb25zdCBnZXROb256ZXJvUm93ID0gKCBtYXRyaXg6IENvbXBsZXhbXSwgY2hlY2tMYXN0ID0gZmFsc2UgKTogQ29tcGxleFtdID0+IHtcclxuICByZXR1cm4gXy5zb3J0QnkoIFsgbWF0cml4LnNsaWNlKCAwLCAzICksIG1hdHJpeC5zbGljZSggMywgNiApLCBtYXRyaXguc2xpY2UoIDYsIDkgKSBdLCByb3cgPT4ge1xyXG4gICAgcmV0dXJuIC0oIHJvd1sgMCBdLm1hZ25pdHVkZSArIHJvd1sgMSBdLm1hZ25pdHVkZSArICggY2hlY2tMYXN0ID8gcm93WyAyIF0ubWFnbml0dWRlIDogMCApICk7XHJcbiAgfSApWyAwIF07XHJcbn07XHJcblxyXG4vLyBJZiBjaGVja0xhc3Q9ZmFsc2UsIHdlIHdvbid0IHByb3ZpZGUgY29sdW1ucyB0aGF0IGhhdmUgYSB6ZXJvIGluIHRoZSBmaXJzdCB0d28gZW50cmllc1xyXG5jb25zdCBnZXROb256ZXJvQ29sdW1uID0gKCBtYXRyaXg6IENvbXBsZXhbXSwgY2hlY2tMYXN0ID0gZmFsc2UgKTogQ29tcGxleFtdID0+IHtcclxuICByZXR1cm4gZ2V0Tm9uemVyb1JvdyggZ2V0VHJhbnNwb3NlKCBtYXRyaXggKSwgY2hlY2tMYXN0ICk7XHJcbn07XHJcblxyXG5jb25zdCBnZXRBbnRpU3ltbWV0cmljTWF0cml4ID0gKCBtYXRyaXg6IENvbXBsZXhbXSApID0+IHtcclxuICBjb25zdCBhZGp1Z2F0ZSA9IGdldEFkanVnYXRlTWF0cml4KCBtYXRyaXggKTtcclxuICBjb25zdCBub256ZXJvUm93ID0gZ2V0Tm9uemVyb1JvdyggYWRqdWdhdGUgKTtcclxuICByZXR1cm4gW1xyXG4gICAgQ29tcGxleC5aRVJPLCBub256ZXJvUm93WyAyIF0sIG5vbnplcm9Sb3dbIDEgXS5uZWdhdGVkKCksXHJcbiAgICBub256ZXJvUm93WyAyIF0ubmVnYXRlZCgpLCBDb21wbGV4LlpFUk8sIG5vbnplcm9Sb3dbIDAgXSxcclxuICAgIG5vbnplcm9Sb3dbIDEgXSwgbm9uemVyb1Jvd1sgMCBdLm5lZ2F0ZWQoKSwgQ29tcGxleC5aRVJPXHJcbiAgXTtcclxufTtcclxuXHJcbmNvbnN0IGNvbXB1dGVBbHBoYSA9ICggZGVnZW5lcmF0ZUNvbmljTWF0cml4OiBDb21wbGV4W10sIGFudGlTeW1tZXRyaWNNYXRyaXg6IENvbXBsZXhbXSApOiBDb21wbGV4IHwgbnVsbCA9PiB7XHJcbiAgLy8gQ2FuIHVzZSBhbiBhcmJpdHJhcnkgMngyIG1pbm9yIHRvIGNvbXB1dGUsIHNpbmNlIHdlIHdhbnQ6XHJcbiAgLy8gcmFuayggZGVnZW5lcmF0ZUNvbmljTWF0cml4ICsgYWxwaGEgKiBhbnRpU3ltbWV0cmljTWF0cml4ICkgPSAxXHJcblxyXG4gIC8vICggZDAwICsgYWxwaGEgKiBhMDAgKSAqIHEgPSAoIGQwMSArIGFscGhhICogYTAxIClcclxuICAvLyAoIGQxMCArIGFscGhhICogYTEwICkgKiBxID0gKCBkMTEgKyBhbHBoYSAqIGExMSApXHJcbiAgLy8gKCBkMDEgKyBhbHBoYSAqIGEwMSApIC8gKCBkMDAgKyBhbHBoYSAqIGEwMCApID0gKCBkMTEgKyBhbHBoYSAqIGExMSApIC8gKCBkMTAgKyBhbHBoYSAqIGExMCApXHJcbiAgLy8gKCBkMDEgKyBhbHBoYSAqIGEwMSApICogKCBkMTAgKyBhbHBoYSAqIGExMCApIC0gKCBkMDAgKyBhbHBoYSAqIGEwMCApICogKCBkMTEgKyBhbHBoYSAqIGExMSApID0gMFxyXG4gIC8vICggYTAxICogYTEwIC0gYTAwICogYTExICkgYWxwaGFeMiArIGQwMSAqIGQxMCAtIGQwMCAqIGQxMSArIGFscGhhICgtYTExICogZDAwICsgYTEwICogZDAxICsgYTAxICogZDEwIC0gYTAwICogZDExIClcclxuICAvLyAoIGEwMSAqIGExMCAtIGEwMCAqIGExMSApIGFscGhhXjIgKyAoLWExMSAqIGQwMCArIGExMCAqIGQwMSArIGEwMSAqIGQxMCAtIGEwMCAqIGQxMSApIGFscGhhICsgKGQwMSAqIGQxMCAtIGQwMCAqIGQxMSlcclxuICBjb25zdCBkMDAgPSBkZWdlbmVyYXRlQ29uaWNNYXRyaXhbIDAgXTtcclxuICBjb25zdCBkMDEgPSBkZWdlbmVyYXRlQ29uaWNNYXRyaXhbIDEgXTtcclxuICBjb25zdCBkMTAgPSBkZWdlbmVyYXRlQ29uaWNNYXRyaXhbIDMgXTtcclxuICBjb25zdCBkMTEgPSBkZWdlbmVyYXRlQ29uaWNNYXRyaXhbIDQgXTtcclxuICBjb25zdCBhMDAgPSBhbnRpU3ltbWV0cmljTWF0cml4WyAwIF07XHJcbiAgY29uc3QgYTAxID0gYW50aVN5bW1ldHJpY01hdHJpeFsgMSBdO1xyXG4gIGNvbnN0IGExMCA9IGFudGlTeW1tZXRyaWNNYXRyaXhbIDMgXTtcclxuICBjb25zdCBhMTEgPSBhbnRpU3ltbWV0cmljTWF0cml4WyA0IF07XHJcblxyXG4gIC8vIFRPRE86IGxlc3MgZ2FyYmFnZSBjcmVhdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvOTdcclxuICBjb25zdCBBID0gYTAxLnRpbWVzKCBhMTAgKS5taW51cyggYTAwLnRpbWVzKCBhMTEgKSApO1xyXG4gIGNvbnN0IEIgPSBhMTEubmVnYXRlZCgpLnRpbWVzKCBkMDAgKS5wbHVzKCBhMTAudGltZXMoIGQwMSApICkucGx1cyggYTAxLnRpbWVzKCBkMTAgKSApLm1pbnVzKCBhMDAudGltZXMoIGQxMSApICk7XHJcbiAgY29uc3QgQyA9IGQwMS50aW1lcyggZDEwICkubWludXMoIGQwMC50aW1lcyggZDExICkgKTtcclxuXHJcbiAgY29uc3Qgcm9vdHMgPSBDb21wbGV4LnNvbHZlUXVhZHJhdGljUm9vdHMoIEEsIEIsIEMgKTtcclxuXHJcbiAgLy8gSWYgdGhlcmUgYXJlIHJvb3RzLCBwaWNrIHRoZSBmaXJzdCBvbmVcclxuICByZXR1cm4gcm9vdHMgPT09IG51bGwgPyBudWxsIDogcm9vdHNbIDAgXTtcclxufTtcclxuXHJcbmNvbnN0IGdldFJhbmsxRGVnZW5lcmF0ZUNvbmljTWF0cml4ID0gKCBtYXRyaXg6IENvbXBsZXhbXSApID0+IHtcclxuICBjb25zdCBhbnRpU3ltbWV0cmljTWF0cml4ID0gZ2V0QW50aVN5bW1ldHJpY01hdHJpeCggbWF0cml4ICk7XHJcbiAgY29uc3QgYWxwaGEgPSBjb21wdXRlQWxwaGEoIG1hdHJpeCwgYW50aVN5bW1ldHJpY01hdHJpeCApO1xyXG4gIGlmICggYWxwaGEgPT09IG51bGwgKSB7XHJcbiAgICAvLyBhbHJlYWR5IGluIHByb3BlciBmb3JtLCBhZGRpbmcgdGhlIGFudGlTeW1tZXRyaWNNYXRyaXggaW4gYW55IGxpbmVhciBjb21iaW5hdGlvbiB3aWxsIHN0aWxsIGJlIHJhbmsgMVxyXG4gICAgcmV0dXJuIG1hdHJpeDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICBtYXRyaXhbIDAgXS5wbHVzKCBhbHBoYS50aW1lcyggYW50aVN5bW1ldHJpY01hdHJpeFsgMCBdICkgKSxcclxuICAgICAgbWF0cml4WyAxIF0ucGx1cyggYWxwaGEudGltZXMoIGFudGlTeW1tZXRyaWNNYXRyaXhbIDEgXSApICksXHJcbiAgICAgIG1hdHJpeFsgMiBdLnBsdXMoIGFscGhhLnRpbWVzKCBhbnRpU3ltbWV0cmljTWF0cml4WyAyIF0gKSApLFxyXG4gICAgICBtYXRyaXhbIDMgXS5wbHVzKCBhbHBoYS50aW1lcyggYW50aVN5bW1ldHJpY01hdHJpeFsgMyBdICkgKSxcclxuICAgICAgbWF0cml4WyA0IF0ucGx1cyggYWxwaGEudGltZXMoIGFudGlTeW1tZXRyaWNNYXRyaXhbIDQgXSApICksXHJcbiAgICAgIG1hdHJpeFsgNSBdLnBsdXMoIGFscGhhLnRpbWVzKCBhbnRpU3ltbWV0cmljTWF0cml4WyA1IF0gKSApLFxyXG4gICAgICBtYXRyaXhbIDYgXS5wbHVzKCBhbHBoYS50aW1lcyggYW50aVN5bW1ldHJpY01hdHJpeFsgNiBdICkgKSxcclxuICAgICAgbWF0cml4WyA3IF0ucGx1cyggYWxwaGEudGltZXMoIGFudGlTeW1tZXRyaWNNYXRyaXhbIDcgXSApICksXHJcbiAgICAgIG1hdHJpeFsgOCBdLnBsdXMoIGFscGhhLnRpbWVzKCBhbnRpU3ltbWV0cmljTWF0cml4WyA4IF0gKSApXHJcbiAgICBdO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBIGRlZ2VuZXJhdGUgY29uaWMgaXMgZXNzZW50aWFsbHkgYSBwcm9kdWN0IG9mIHR3byBsaW5lcywgZS5nLiAoUHggKyBReSArIEMpKFN4ICsgVHkgKyBVKSA9IDAgKHdoZXJlIGV2ZXJ5dGhpbmcgaXNcclxuICogY29tcGxleCB2YWx1ZWQgaW4gdGhpcyBjYXNlKS4gRWFjaCBsaW5lIGlzIHRvcG9sb2dpY2FsbHkgZXF1aXZhbGVudCB0byBhIHBsYW5lLlxyXG4gKi9cclxuY29uc3QgZ2V0UmVhbEludGVyc2VjdGlvbnNGb3JEZWdlbmVyYXRlQ29uaWMgPSAoIG1hdHJpeDogQ29tcGxleFtdICk6ICggVmVjdG9yMiB8IFJheTIgKVtdID0+IHtcclxuICAvLyBUT0RPOiBjaGVjayB3aGV0aGVyIHdlIGFyZSBzeW1tZXRyaWMuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy85N1xyXG4gIGNvbnN0IHJlc3VsdDogKCBWZWN0b3IyIHwgUmF5MiApW10gPSBbXTtcclxuXHJcbiAgdHlwZSBDb21wbGV4WFkgPSBbIENvbXBsZXgsIENvbXBsZXggXTtcclxuXHJcbiAgLy8gQXheMiArIEJ4eSArIEN5XjIgKyBEeCArIEV5ICsgRiA9IDAgKGNvbXBsZXggdmFsdWVkKVxyXG4gIGNvbnN0IEEgPSBtYXRyaXhbIDAgXTtcclxuICBjb25zdCBCID0gbWF0cml4WyAxIF0udGltZXMoIENvbXBsZXgucmVhbCggMiApICk7XHJcbiAgY29uc3QgQyA9IG1hdHJpeFsgNCBdO1xyXG4gIGNvbnN0IEQgPSBtYXRyaXhbIDIgXS50aW1lcyggQ29tcGxleC5yZWFsKCAyICkgKTtcclxuICBjb25zdCBFID0gbWF0cml4WyA1IF0udGltZXMoIENvbXBsZXgucmVhbCggMiApICk7XHJcbiAgY29uc3QgRiA9IG1hdHJpeFsgOCBdO1xyXG5cclxuICAvLyBjb25zdCBldiA9ICggeDogQ29tcGxleCwgeTogQ29tcGxleCApID0+IHtcclxuICAvLyAgIHJldHVybiBBLnRpbWVzKCB4ICkudGltZXMoIHggKVxyXG4gIC8vICAgICAucGx1cyggQi50aW1lcyggeCApLnRpbWVzKCB5ICkgKVxyXG4gIC8vICAgICAucGx1cyggQy50aW1lcyggeSApLnRpbWVzKCB5ICkgKVxyXG4gIC8vICAgICAucGx1cyggRC50aW1lcyggeCApIClcclxuICAvLyAgICAgLnBsdXMoIEUudGltZXMoIHkgKSApXHJcbiAgLy8gICAgIC5wbHVzKCBGICk7XHJcbiAgLy8gfTtcclxuXHJcbiAgLy8gV2UnbGwgbm93IGZpbmQgKGlkZWFsbHkpIHR3byBzb2x1dGlvbnMgZm9yIHRoZSBjb25pYywgc3VjaCB0aGF0IHRoZXkgYXJlIGVhY2ggb24gb25lIG9mIHRoZSBsaW5lc1xyXG4gIGxldCBzb2x1dGlvbnM6IENvbXBsZXhYWVtdID0gW107XHJcbiAgY29uc3QgYWxwaGEgPSBuZXcgQ29tcGxleCggLTIuNTE2NTM1MjU2OTY5NTksIDEuNTI5Mjg1MDI4NDQwMjAgKTsgLy8gcmFuZG9tbHkgY2hvc2VuXHJcbiAgLy8gZmlyc3QgdHJ5IHBpY2tpbmcgYW4geCBhbmQgc29sdmUgZm9yIG11bHRpcGxlIHkgKHg9YWxwaGEpXHJcbiAgLy8gKEMpeV4yICsgKEIqYWxwaGEgKyBFKXkgKyAoQSphbHBoYV4yICsgRCphbHBoYSArIEYpID0gMFxyXG4gIGNvbnN0IHhBbHBoYUEgPSBDO1xyXG4gIGNvbnN0IHhBbHBoYUIgPSBCLnRpbWVzKCBhbHBoYSApLnBsdXMoIEUgKTtcclxuICBjb25zdCB4QWxwaGFDID0gQS50aW1lcyggYWxwaGEgKS50aW1lcyggYWxwaGEgKS5wbHVzKCBELnRpbWVzKCBhbHBoYSApICkucGx1cyggRiApO1xyXG4gIGNvbnN0IHhBbHBoYVJvb3RzID0gQ29tcGxleC5zb2x2ZVF1YWRyYXRpY1Jvb3RzKCB4QWxwaGFBLCB4QWxwaGFCLCB4QWxwaGFDICk7XHJcbiAgaWYgKCB4QWxwaGFSb290cyAmJiB4QWxwaGFSb290cy5sZW5ndGggPj0gMiApIHtcclxuICAgIHNvbHV0aW9ucyA9IFtcclxuICAgICAgWyBhbHBoYSwgeEFscGhhUm9vdHNbIDAgXSBdLFxyXG4gICAgICBbIGFscGhhLCB4QWxwaGFSb290c1sgMSBdIF1cclxuICAgIF07XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgLy8gTm93IHRyeSB5PWFscGhhXHJcbiAgICAvLyAoQSl4XjIgKyAoQiphbHBoYSArIEQpeCArIChDKmFscGhhXjIgKyBFKmFscGhhICsgRikgPSAwXHJcbiAgICBjb25zdCB5QWxwaGFBID0gQTtcclxuICAgIGNvbnN0IHlBbHBoYUIgPSBCLnRpbWVzKCBhbHBoYSApLnBsdXMoIEQgKTtcclxuICAgIGNvbnN0IHlBbHBoYUMgPSBDLnRpbWVzKCBhbHBoYSApLnRpbWVzKCBhbHBoYSApLnBsdXMoIEUudGltZXMoIGFscGhhICkgKS5wbHVzKCBGICk7XHJcbiAgICBjb25zdCB5QWxwaGFSb290cyA9IENvbXBsZXguc29sdmVRdWFkcmF0aWNSb290cyggeUFscGhhQSwgeUFscGhhQiwgeUFscGhhQyApO1xyXG4gICAgaWYgKCB5QWxwaGFSb290cyAmJiB5QWxwaGFSb290cy5sZW5ndGggPj0gMiApIHtcclxuICAgICAgc29sdXRpb25zID0gW1xyXG4gICAgICAgIFsgeUFscGhhUm9vdHNbIDAgXSwgYWxwaGEgXSxcclxuICAgICAgICBbIHlBbHBoYVJvb3RzWyAxIF0sIGFscGhhIF1cclxuICAgICAgXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBTZWxlY3Qgb25seSBvbmUgcm9vdCBpZiB3ZSBoYXZlIGl0LCB3ZSBtaWdodCBoYXZlIGEgZG91YmxlIGxpbmVcclxuICAgICAgaWYgKCB4QWxwaGFSb290cyAmJiB4QWxwaGFSb290cy5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgICAgc29sdXRpb25zID0gW1xyXG4gICAgICAgICAgWyBhbHBoYSwgeEFscGhhUm9vdHNbIDAgXSBdXHJcbiAgICAgICAgXTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggeUFscGhhUm9vdHMgJiYgeUFscGhhUm9vdHMubGVuZ3RoID09PSAxICkge1xyXG4gICAgICAgIHNvbHV0aW9ucyA9IFtcclxuICAgICAgICAgIFsgeUFscGhhUm9vdHNbIDAgXSwgYWxwaGEgXVxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnSW1wbGVtZW50IG1vcmUgYWR2YW5jZWQgaW5pdGlhbGl6YXRpb24gdG8gZmluZCB0d28gc29sdXRpb25zJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzb2x1dGlvbnMuZm9yRWFjaCggKCBzb2x1dGlvbjogQ29tcGxleFhZICkgPT4ge1xyXG4gICAgLy8gSGVyZSwgd2UnbGwgYmUgYnJlYWtpbmcgb3V0IHRoZSBjb21wbGV4IHgseSBpbnRvIHF1YWRzIG9mOiBbIHJlYWxYLCByZWFsWSwgaW1hZ2luYXJ5WCwgaW1hZ2luYXJ5WSBdIGRlbm90ZWQgYXNcclxuICAgIC8vIFsgcngsIHJ5LCBpeCwgaXkgXS5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJyb2tlbiBjYXNlOlxyXG4gICAgICBBXHJcbiAgICAgIENvbXBsZXgge3JlYWw6IC0yLjMwNjI4MTYwMzQ3MDIzOTRlLTcsIGltYWdpbmFyeTogLTAuMDAwMDUwMDAxNjIzMTAwOTE4NzQ2fVxyXG4gICAgICBCXHJcbiAgICAgIENvbXBsZXgge3JlYWw6IDAsIGltYWdpbmFyeTogMH1cclxuICAgICAgQ1xyXG4gICAgICBDb21wbGV4IHtyZWFsOiAtMi4zMDYyODE2MDM0NzAyMzk0ZS03LCBpbWFnaW5hcnk6IC0wLjAwMDA1MDAwMTYyMzEwMDkxODc0Nn1cclxuICAgICAgRFxyXG4gICAgICBDb21wbGV4IHtyZWFsOiAtMC4wMDk5MDc3NDg3MzU4MjcyMjYsIGltYWdpbmFyeTogMC4wMjAwMDA2NDkyNDAzNjc1fVxyXG4gICAgICBFXHJcbiAgICAgIENvbXBsZXgge3JlYWw6IDAuMDAwMDkyMjUxMjY0MTYzNjc4NTcsIGltYWdpbmFyeTogMC4wMjAwMDA2NDkyNDAzNjc1fVxyXG4gICAgICBGXHJcbiAgICAgIENvbXBsZXgge3JlYWw6IDEuOTgzODgxMDI4Nzc2NTIyNywgaW1hZ2luYXJ5OiAtMy41MDAxMTM2MTcwNjQzMTIzfVxyXG5cclxuXHJcbiAgICAgcmVhbDogMjAwLjAwMjUsIDEwMCAgIGFuZCAyMDAuMDAyNSwgMzAwICAgIGFyZSBiZXR0ZXIgc29sdXRpb25zLCBidXQgb2J2aW91c2x5IGNvdWxkIGJlIHJlZmluZWRcclxuICAgICAqL1xyXG5cclxuICAgIGNvbnN0IHJ4ID0gc29sdXRpb25bIDAgXS5yZWFsO1xyXG4gICAgY29uc3QgcnkgPSBzb2x1dGlvblsgMSBdLnJlYWw7XHJcbiAgICBjb25zdCBpeCA9IHNvbHV0aW9uWyAwIF0uaW1hZ2luYXJ5O1xyXG4gICAgY29uc3QgaXkgPSBzb2x1dGlvblsgMSBdLmltYWdpbmFyeTtcclxuICAgIGNvbnN0IHJBID0gQS5yZWFsO1xyXG4gICAgY29uc3QgckIgPSBCLnJlYWw7XHJcbiAgICBjb25zdCByQyA9IEMucmVhbDtcclxuICAgIGNvbnN0IHJEID0gRC5yZWFsO1xyXG4gICAgY29uc3QgckUgPSBFLnJlYWw7XHJcbiAgICBjb25zdCBpQSA9IEEuaW1hZ2luYXJ5O1xyXG4gICAgY29uc3QgaUIgPSBCLmltYWdpbmFyeTtcclxuICAgIGNvbnN0IGlDID0gQy5pbWFnaW5hcnk7XHJcbiAgICBjb25zdCBpRCA9IEQuaW1hZ2luYXJ5O1xyXG4gICAgY29uc3QgaUUgPSBFLmltYWdpbmFyeTtcclxuXHJcbiAgICB0eXBlIEV4cGFuZGVkUmVhbFhZID0gVmVjdG9yNDsgLy8gcngsIHJ5LCBpeCwgaXlcclxuXHJcbiAgICBjb25zdCByZWFsR3JhZGllbnQ6IEV4cGFuZGVkUmVhbFhZID0gbmV3IFZlY3RvcjQoXHJcbiAgICAgIC0yICogaUEgKiBpeCAtIGlCICogaXkgKyByRCArIDIgKiByQSAqIHJ4ICsgckIgKiByeSxcclxuICAgICAgLWlCICogaXggLSAyICogaUMgKiBpeSArIHJFICsgckIgKiByeCArIDIgKiByQyAqIHJ5LFxyXG4gICAgICAtaUQgLSAyICogaXggKiByQSAtIGl5ICogckIgLSAyICogaUEgKiByeCAtIGlCICogcnksXHJcbiAgICAgIC1pRSAtIGl4ICogckIgLSAyICogaXkgKiByQyAtIGlCICogcnggLSAyICogaUMgKiByeVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBbIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciBdXHJcbiAgICBjb25zdCBpbWFnaW5hcnlHcmFkaWVudDogRXhwYW5kZWRSZWFsWFkgPSBuZXcgVmVjdG9yNChcclxuICAgICAgaUQgKyAyICogaXggKiByQSArIGl5ICogckIgKyAyICogaUEgKiByeCArIGlCICogcnksXHJcbiAgICAgIGlFICsgaXggKiByQiArIDIgKiBpeSAqIHJDICsgaUIgKiByeCArIDIgKiBpQyAqIHJ5LFxyXG4gICAgICAtMiAqIGlBICogaXggLSBpQiAqIGl5ICsgckQgKyAyICogckEgKiByeCArIHJCICogcnksXHJcbiAgICAgIC1pQiAqIGl4IC0gMiAqIGlDICogaXkgKyByRSArIHJCICogcnggKyAyICogckMgKiByeVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCByYW5kb21Qb2ludEE6IEV4cGFuZGVkUmVhbFhZID0gbmV3IFZlY3RvcjQoXHJcbiAgICAgIDYuMTk1MTA2ODU0ODI1MyxcclxuICAgICAgLTEuMTU5MjY4OTUwMzg2MCxcclxuICAgICAgMC4xNjAyOTE4ODI5Mjk0LFxyXG4gICAgICAzLjIwNTgxODY5MjA0ODIwMlxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCByYW5kb21Qb2ludEI6IEV4cGFuZGVkUmVhbFhZID0gbmV3IFZlY3RvcjQoXHJcbiAgICAgIC01LjQyMDYyODU0OTI5NjkyNCxcclxuICAgICAgLTE1LjIwNjk1ODMwMjg2ODUsXHJcbiAgICAgIDAuMTU5NTkwNjAyMDQ4ODY4MCxcclxuICAgICAgNS4xMDY4ODI4ODA0MDY4MlxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBwcm9qID0gKCB2OiBFeHBhbmRlZFJlYWxYWSwgdTogRXhwYW5kZWRSZWFsWFkgKSA9PiB7XHJcbiAgICAgIHJldHVybiB1LnRpbWVzU2NhbGFyKCB2LmRvdCggdSApIC8gdS5kb3QoIHUgKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBHcmFtLVNjaG1pZHQgb3J0aG9nb25hbGl6YXRpb24gdG8gZ2V0IGEgbmljZSBiYXNpc1xyXG4gICAgY29uc3QgYmFzaXNSZWFsR3JhZGllbnQgPSByZWFsR3JhZGllbnQ7XHJcbiAgICBjb25zdCBiYXNpc0ltYWdpbmFyeUdyYWRpZW50ID0gaW1hZ2luYXJ5R3JhZGllbnRcclxuICAgICAgLm1pbnVzKCBwcm9qKCBpbWFnaW5hcnlHcmFkaWVudCwgYmFzaXNSZWFsR3JhZGllbnQgKSApO1xyXG4gICAgY29uc3QgYmFzaXNQbGFuZTAgPSByYW5kb21Qb2ludEFcclxuICAgICAgLm1pbnVzKCBwcm9qKCByYW5kb21Qb2ludEEsIGJhc2lzUmVhbEdyYWRpZW50ICkgKVxyXG4gICAgICAubWludXMoIHByb2ooIHJhbmRvbVBvaW50QSwgYmFzaXNJbWFnaW5hcnlHcmFkaWVudCApICk7XHJcbiAgICBjb25zdCBiYXNpc1BsYW5lMSA9IHJhbmRvbVBvaW50QlxyXG4gICAgICAubWludXMoIHByb2ooIHJhbmRvbVBvaW50QiwgYmFzaXNSZWFsR3JhZGllbnQgKSApXHJcbiAgICAgIC5taW51cyggcHJvaiggcmFuZG9tUG9pbnRCLCBiYXNpc0ltYWdpbmFyeUdyYWRpZW50ICkgKVxyXG4gICAgICAubWludXMoIHByb2ooIHJhbmRvbVBvaW50QiwgYmFzaXNQbGFuZTAgKSApO1xyXG5cclxuICAgIC8vIE91ciBiYXNpcyBpbiB0aGUgZXhjbHVzaXZlbHktaW1hZ2luYXJ5IHBsYW5lXHJcbiAgICBjb25zdCBiYXNpc01hdHJpeCA9IG5ldyBNYXRyaXgoIDIsIDIsIFtcclxuICAgICAgYmFzaXNQbGFuZTAueiwgYmFzaXNQbGFuZTEueixcclxuICAgICAgYmFzaXNQbGFuZTAudywgYmFzaXNQbGFuZTEud1xyXG4gICAgXSApO1xyXG4gICAgY29uc3Qgc2luZ3VsYXJWYWx1ZXMgPSBuZXcgU2luZ3VsYXJWYWx1ZURlY29tcG9zaXRpb24oIGJhc2lzTWF0cml4ICkuZ2V0U2luZ3VsYXJWYWx1ZXMoKTtcclxuXHJcbiAgICBsZXQgcmVhbFNvbHV0aW9uOiBWZWN0b3IyIHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIE1hdGguYWJzKCBpeCApIDwgMWUtMTAgJiYgTWF0aC5hYnMoIGl5ICkgPCAxZS0xMCApIHtcclxuXHJcbiAgICAgIHJlYWxTb2x1dGlvbiA9IG5ldyBWZWN0b3IyKCByeCwgcnkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBpUCArIHQgKiBpQjAgKyB1ICogaUIxID0gMCwgaWYgd2UgY2FuIGZpbmQgdCx1IHdoZXJlIChQICsgdCAqIEIwICsgdSAqIEIxKSBpcyByZWFsXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFsgaUIweCBJQjF4IF0gWyB0IF0gPSBbIC1pUHggXVxyXG4gICAgICAvLyBbIGlCMHkgSUIxeSBdIFsgdSBdICAgWyAtaVB5IF1cclxuXHJcbiAgICAgIGlmICggTWF0aC5hYnMoIHNpbmd1bGFyVmFsdWVzWyAxIF0gKSA+IDFlLTEwICkge1xyXG4gICAgICAgIC8vIHJhbmsgMlxyXG4gICAgICAgIGNvbnN0IHR1ID0gYmFzaXNNYXRyaXguc29sdmUoIG5ldyBNYXRyaXgoIDIsIDEsIFsgLWl4LCAtaXkgXSApICkuZXh0cmFjdFZlY3RvcjIoIDAgKTtcclxuICAgICAgICByZWFsU29sdXRpb24gPSBuZXcgVmVjdG9yMihcclxuICAgICAgICAgIHJ4ICsgdHUueCAqIGJhc2lzUGxhbmUwLnogKyB0dS55ICogYmFzaXNQbGFuZTEueixcclxuICAgICAgICAgIHJ5ICsgdHUueCAqIGJhc2lzUGxhbmUwLncgKyB0dS55ICogYmFzaXNQbGFuZTEud1xyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIE1hdGguYWJzKCBzaW5ndWxhclZhbHVlc1sgMCBdICkgPiAxZS0xMCApIHtcclxuICAgICAgICAvLyByYW5rIDEgLSBjb2x1bW5zIGFyZSBtdWx0aXBsZXMgb2YgZWFjaCBvdGhlciwgb25lIHBvc3NpYmx5ICgwLDApXHJcblxyXG4gICAgICAgIC8vIEZvciBpbWFnaW5hcnkgYmFzZXMgKHdlJ2xsIHVzZSB0aGVtIHBvdGVudGlhbGx5IG11bHRpcGxlIHRpbWVzIGlmIHdlIGhhdmUgYSByYW5rIDEgbWF0cml4XHJcbiAgICAgICAgY29uc3QgbGFyZ2VzdEJhc2lzID0gTWF0aC5hYnMoIGJhc2lzUGxhbmUwLnogKSArIE1hdGguYWJzKCBiYXNpc1BsYW5lMC53ICkgPiBNYXRoLmFicyggYmFzaXNQbGFuZTEueiApICsgTWF0aC5hYnMoIGJhc2lzUGxhbmUxLncgKSA/IGJhc2lzUGxhbmUwIDogYmFzaXNQbGFuZTE7XHJcbiAgICAgICAgY29uc3QgbGFyZ2VzdEJhc2lzSW1hZ2luYXJ5VmVjdG9yID0gbmV3IFZlY3RvcjIoIGxhcmdlc3RCYXNpcy56LCBsYXJnZXN0QmFzaXMudyApO1xyXG5cclxuICAgICAgICBjb25zdCB0ID0gbmV3IFZlY3RvcjIoIGl4LCBpeSApLmRvdCggbGFyZ2VzdEJhc2lzSW1hZ2luYXJ5VmVjdG9yICkgLyBsYXJnZXN0QmFzaXNJbWFnaW5hcnlWZWN0b3IuZG90KCBsYXJnZXN0QmFzaXNJbWFnaW5hcnlWZWN0b3IgKTtcclxuICAgICAgICBjb25zdCBwb3RlbnRpYWxTb2x1dGlvbiA9IG5ldyBWZWN0b3I0KCByeCwgcnksIGl4LCBpeSApLm1pbnVzKCBsYXJnZXN0QmFzaXMudGltZXNTY2FsYXIoIHQgKSApO1xyXG4gICAgICAgIGlmICggTWF0aC5hYnMoIHBvdGVudGlhbFNvbHV0aW9uLnogKSA8IDFlLTggJiYgTWF0aC5hYnMoIHBvdGVudGlhbFNvbHV0aW9uLncgKSA8IDFlLTggKSB7XHJcbiAgICAgICAgICByZWFsU29sdXRpb24gPSBuZXcgVmVjdG9yMiggcG90ZW50aWFsU29sdXRpb24ueCwgcG90ZW50aWFsU29sdXRpb24ueSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyByYW5rIDAgQU5EIG91ciBzb2x1dGlvbiBpcyBOT1QgcmVhbCwgdGhlbiB0aGVyZSBpcyBubyBzb2x1dGlvblxyXG4gICAgICAgIHJlYWxTb2x1dGlvbiA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVhbFNvbHV0aW9uICkge1xyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gY2hlY2sgaWYgd2UgaGF2ZSBhIGxpbmUgb2Ygc29sdXRpb25zIG5vdyFcclxuICAgICAgICBpZiAoIE1hdGguYWJzKCBzaW5ndWxhclZhbHVlc1sgMSBdICkgPiAxZS0xMCApIHtcclxuICAgICAgICAgIC8vIHJhbmsgMlxyXG4gICAgICAgICAgLy8gT3VyIHNvbHV0aW9uIGlzIHRoZSBvbmx5IHNvbHV0aW9uIChubyBsaW5lYXIgY29tYmluYXRpb24gb2YgYmFzaXMgdmVjdG9ycyBiZXNpZGVzIG91ciBjdXJyZW50IHNvbHV0aW9uXHJcbiAgICAgICAgICAvLyB0aGF0IHdvdWxkIGJlIHJlYWwpXHJcbiAgICAgICAgICByZXN1bHQucHVzaCggcmVhbFNvbHV0aW9uICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBNYXRoLmFicyggc2luZ3VsYXJWYWx1ZXNbIDAgXSApID4gMWUtMTAgKSB7XHJcbiAgICAgICAgICAvLyByYW5rIDFcclxuICAgICAgICAgIC8vIE91ciBiYXNlcyBhcmUgYSBtdWx0aXBsZSBvZiBlYWNoIG90aGVyLiBXZSBuZWVkIHRvIGZpbmQgYSBsaW5lYXIgY29tYmluYXRpb24gb2YgdGhlbSB0aGF0IGlzIHJlYWwsIHRoZW5cclxuICAgICAgICAgIC8vIGV2ZXJ5IG11bHRpcGxlIG9mIHRoYXQgd2lsbCBiZSBhIHNvbHV0aW9uIChsaW5lKS4gSWYgZWl0aGVyIGlzICgwLDApLCB3ZSB3aWxsIHVzZSB0aGF0IG9uZSwgc28gY2hlY2sgdGhhdFxyXG4gICAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICAgIC8vIFRPRE86IGNhbiB3ZSBkZWR1cGxpY2F0ZSB0aGlzIHdpdGggY29kZSBhYm92ZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk3XHJcbiAgICAgICAgICBjb25zdCB6ZXJvTGFyZ2VyID0gTWF0aC5hYnMoIGJhc2lzUGxhbmUwLnogKSArIE1hdGguYWJzKCBiYXNpc1BsYW5lMC53ICkgPiBNYXRoLmFicyggYmFzaXNQbGFuZTEueiApICsgTWF0aC5hYnMoIGJhc2lzUGxhbmUxLncgKTtcclxuICAgICAgICAgIGNvbnN0IHNtYWxsZXN0QmFzaXMgPSB6ZXJvTGFyZ2VyID8gYmFzaXNQbGFuZTEgOiBiYXNpc1BsYW5lMDtcclxuICAgICAgICAgIGNvbnN0IGxhcmdlc3RCYXNpcyA9IHplcm9MYXJnZXIgPyBiYXNpc1BsYW5lMCA6IGJhc2lzUGxhbmUxO1xyXG5cclxuICAgICAgICAgIC8vIEZpbmQgdGhlIGxhcmdlc3QgY29tcG9uZW50LCBzbyBpZiB3ZSBoYXZlIGEgemVybyB4IG9yIHkgaW4gYm90aCBvdXIgYmFzZXMsIGl0IHdpbGwgd29yayBvdXQgZmluZVxyXG4gICAgICAgICAgY29uc3QgeExhcmdlciA9IE1hdGguYWJzKCBsYXJnZXN0QmFzaXMueiApID4gTWF0aC5hYnMoIGxhcmdlc3RCYXNpcy53ICk7XHJcblxyXG4gICAgICAgICAgLy8gbGFyZ2VzdEJhc2lzICogdCA9IHNtYWxsZXN0QmFzaXMsIHN1cHBvcnRzIHNtYWxsZXN0QmFzaXM9KDAsMClcclxuICAgICAgICAgIGNvbnN0IHQgPSB4TGFyZ2VyID8gKCBzbWFsbGVzdEJhc2lzLnogLyBsYXJnZXN0QmFzaXMueiApIDogKCBzbWFsbGVzdEJhc2lzLncgLyBsYXJnZXN0QmFzaXMudyApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbjQgPSBsYXJnZXN0QmFzaXMudGltZXNTY2FsYXIoIHQgKS5taW51cyggc21hbGxlc3RCYXNpcyApO1xyXG5cclxuICAgICAgICAgIC8vIFNob3VsZCBiZSB1bmNvbmRpdGlvbmFsbHkgYSBub24temVybyBkaXJlY3Rpb24sIG90aGVyd2lzZSB0aGV5IHdvdWxkbid0IGJlIGJhc2lzIHZlY3RvcnNcclxuICAgICAgICAgIHJlc3VsdC5wdXNoKCBuZXcgUmF5MiggcmVhbFNvbHV0aW9uLCBuZXcgVmVjdG9yMiggZGlyZWN0aW9uNC54LCBkaXJlY3Rpb240LnkgKS5ub3JtYWxpemVkKCkgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIHJhbmsgMFxyXG4gICAgICAgICAgLy8gVEhFWSBBUkUgQUxMIFNPTFVUSU9OUywgd2UncmUgb24gdGhlIHJlYWwgcGxhbmUuIFRoYXQgaXNuJ3QgdXNlZnVsIHRvIHVzLCBzbyB3ZSBkb24ndCBhZGQgYW55IHJlc3VsdHNcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5jb25zdCBnZXRMaW5lc0ZvckRlZ2VuZXJhdGVDb25pYyA9ICggbWF0cml4OiBDb21wbGV4W10gKTogQ29tcGxleFtdW10gPT4ge1xyXG4gIGNvbnN0IHJhbmsxRGVnZW5lcmF0ZUNvbmljTWF0cml4ID0gZ2V0UmFuazFEZWdlbmVyYXRlQ29uaWNNYXRyaXgoIG1hdHJpeCApO1xyXG4gIHJldHVybiBbXHJcbiAgICBnZXROb256ZXJvUm93KCByYW5rMURlZ2VuZXJhdGVDb25pY01hdHJpeCApLFxyXG4gICAgZ2V0Tm9uemVyb0NvbHVtbiggcmFuazFEZWdlbmVyYXRlQ29uaWNNYXRyaXggKVxyXG4gIF07XHJcbn07XHJcblxyXG5jb25zdCBsaW5lSW50ZXJzZWN0ID0gKCBsaW5lMTogQ29tcGxleFtdLCBsaW5lMjogQ29tcGxleFtdICk6IFZlY3RvcjIgfCBudWxsID0+IHtcclxuICAvLyBsaW5lMTogYTEgKiB4ICsgYjEgKiB5ICsgYzEgPSAwXHJcbiAgLy8gbGluZTI6IGEyICogeCArIGIyICogeSArIGMyID0gMFxyXG4gIC8vIHkgPSAoIC1hMSAqIHggLSBjMSApIC8gYjFcclxuICAvLyB5ID0gKCAtYTIgKiB4IC0gYzIgKSAvIGIyXHJcbiAgLy8gKCAtYTEgKiB4IC0gYzEgKSAvIGIxID0gKCAtYTIgKiB4IC0gYzIgKSAvIGIyXHJcbiAgLy8gKCAtYTEgKiB4IC0gYzEgKSAqIGIyID0gKCAtYTIgKiB4IC0gYzIgKSAqIGIxXHJcblxyXG4gIC8vIHggPSAoIGIyICogYzEgLSBiMSAqIGMyICkgLyAoIGEyICogYjEgLSBhMSAqIGIyICk7XHJcblxyXG4gIGNvbnN0IGExID0gbGluZTFbIDAgXTtcclxuICBjb25zdCBiMSA9IGxpbmUxWyAxIF07XHJcbiAgY29uc3QgYzEgPSBsaW5lMVsgMiBdO1xyXG4gIGNvbnN0IGEyID0gbGluZTJbIDAgXTtcclxuICBjb25zdCBiMiA9IGxpbmUyWyAxIF07XHJcbiAgY29uc3QgYzIgPSBsaW5lMlsgMiBdO1xyXG5cclxuICBjb25zdCBkZXRlcm1pbmFudCA9IGEyLnRpbWVzKCBiMSApLm1pbnVzKCBhMS50aW1lcyggYjIgKSApO1xyXG4gIGlmICggZGV0ZXJtaW5hbnQuZXF1YWxzRXBzaWxvbiggQ29tcGxleC5aRVJPLCAxZS04ICkgKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBjb25zdCB4ID0gYjIudGltZXMoIGMxICkubWludXMoIGIxLnRpbWVzKCBjMiApICkuZGl2aWRlZEJ5KCBkZXRlcm1pbmFudCApO1xyXG5cclxuICAgIGxldCB5O1xyXG4gICAgaWYgKCAhYjEuZXF1YWxzRXBzaWxvbiggQ29tcGxleC5aRVJPLCAxZS04ICkgKSB7XHJcbiAgICAgIHkgPSBhMS5uZWdhdGVkKCkudGltZXMoIHggKS5taW51cyggYzEgKS5kaXZpZGVkQnkoIGIxICk7IC8vIFVzZSBvdXIgZmlyc3QgbGluZVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoICFiMi5lcXVhbHNFcHNpbG9uKCBDb21wbGV4LlpFUk8sIDFlLTggKSApIHtcclxuICAgICAgeSA9IGEyLm5lZ2F0ZWQoKS50aW1lcyggeCApLm1pbnVzKCBjMiApLmRpdmlkZWRCeSggYjIgKTsgLy8gVXNlIG91ciBzZWNvbmQgbGluZVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IGVwc2lsb24gZXZhbHVhdGlvbj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk3XHJcbiAgICBpZiAoIE1hdGguYWJzKCB4LmltYWdpbmFyeSApIDwgMWUtOCAmJiBNYXRoLmFicyggeS5pbWFnaW5hcnkgKSA8IDFlLTggKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVmVjdG9yMiggeC5yZWFsLCB5LnJlYWwgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG50eXBlIENvbmljTWF0cml4SW50ZXJzZWN0aW9ucyA9IHtcclxuICBwb2ludHM6IFZlY3RvcjJbXTtcclxuICBkZWdlbmVyYXRlQ29uaWNNYXRyaWNlczogQ29tcGxleFtdW107XHJcbiAgbGluZXM6IENvbXBsZXhbXVtdO1xyXG4gIGludGVyc2VjdGlvbkNvbGxlY3Rpb25zOiAoIFZlY3RvcjIgfCBSYXkyIClbXVtdO1xyXG59O1xyXG5cclxuLy8gTk9URTogQXNzdW1lcyB0aGVzZSBtYXRyaWNlcyBhcmUgTk9UIGRlZ2VuZXJhdGUgKHdpbGwgb25seSBiZSB0ZXN0ZWQgZm9yIGNpcmNsZXMvZWxsaXBzZXMpXHJcbmNvbnN0IGludGVyc2VjdENvbmljTWF0cmljZXMgPSAoIGE6IE1hdHJpeDMsIGI6IE1hdHJpeDMgKTogQ29uaWNNYXRyaXhJbnRlcnNlY3Rpb25zID0+IHtcclxuICAvLyBNb2RlbGVkIG9mZiBvZlxyXG5cclxuICAvLyBjb21wdXRlIEMgPSBsYW1iZGEgKiBBICsgQiwgd2hlcmUgbGFtYmRhIGlzIGNob3NlbiBzbyB0aGF0IGRldChDKSA9IDBcclxuICAvLyBOT1RFOiBUaGlzIGFzc3VtZXMgd2UgZG9uJ3QgaGF2ZSBkZWdlbmVyYXRlIGNvbmljIG1hdHJpY2VzXHJcblxyXG4gIC8vIGRldChDKSA9IGMwMCAqIGMxMSAqIGMyMiArIGMwMSAqIGMxMiAqIGMyMCArIGMwMiAqIGMxMCAqIGMyMSAtIGMwMiAqIGMxMSAqIGMyMCAtIGMwMSAqIGMxMCAqIGMyMiAtIGMwMCAqIGMxMiAqIGMyMVxyXG4gIC8vIGMwMCA9IGEwMCAqIGxhbWJkYSArIGIwMFxyXG4gIC8vIGMwMSA9IGEwMSAqIGxhbWJkYSArIGIwMVxyXG4gIC8vIGMwMiA9IGEwMiAqIGxhbWJkYSArIGIwMlxyXG4gIC8vIGMxMCA9IGExMCAqIGxhbWJkYSArIGIxMFxyXG4gIC8vIGMxMSA9IGExMSAqIGxhbWJkYSArIGIxMVxyXG4gIC8vIGMxMiA9IGExMiAqIGxhbWJkYSArIGIxMlxyXG4gIC8vIGMyMCA9IGEyMCAqIGxhbWJkYSArIGIyMFxyXG4gIC8vIGMyMSA9IGEyMSAqIGxhbWJkYSArIGIyMVxyXG4gIC8vIGMyMiA9IGEyMiAqIGxhbWJkYSArIGIyMlxyXG5cclxuICAvLyBBIGxhbWJkYV4zICsgQiBsYW1iZGFeMiArIEMgbGFtYmRhICsgRCA9IDBcclxuXHJcbiAgY29uc3QgYTAwID0gYS5tMDAoKTtcclxuICBjb25zdCBhMDEgPSBhLm0wMSgpO1xyXG4gIGNvbnN0IGEwMiA9IGEubTAyKCk7XHJcbiAgY29uc3QgYTEwID0gYS5tMTAoKTtcclxuICBjb25zdCBhMTEgPSBhLm0xMSgpO1xyXG4gIGNvbnN0IGExMiA9IGEubTEyKCk7XHJcbiAgY29uc3QgYTIwID0gYS5tMjAoKTtcclxuICBjb25zdCBhMjEgPSBhLm0yMSgpO1xyXG4gIGNvbnN0IGEyMiA9IGEubTIyKCk7XHJcbiAgY29uc3QgYjAwID0gYi5tMDAoKTtcclxuICBjb25zdCBiMDEgPSBiLm0wMSgpO1xyXG4gIGNvbnN0IGIwMiA9IGIubTAyKCk7XHJcbiAgY29uc3QgYjEwID0gYi5tMTAoKTtcclxuICBjb25zdCBiMTEgPSBiLm0xMSgpO1xyXG4gIGNvbnN0IGIxMiA9IGIubTEyKCk7XHJcbiAgY29uc3QgYjIwID0gYi5tMjAoKTtcclxuICBjb25zdCBiMjEgPSBiLm0yMSgpO1xyXG4gIGNvbnN0IGIyMiA9IGIubTIyKCk7XHJcblxyXG4gIGNvbnN0IEEgPSAtYTAyICogYTExICogYTIwICsgYTAxICogYTEyICogYTIwICsgYTAyICogYTEwICogYTIxIC0gYTAwICogYTEyICogYTIxIC0gYTAxICogYTEwICogYTIyICsgYTAwICogYTExICogYTIyO1xyXG4gIGNvbnN0IEIgPSAtYTEwICogYTIyICogYjAxICsgYTEwICogYTIxICogYjAyICsgYTAyICogYTIxICogYjEwIC0gYTAxICogYTIyICogYjEwIC0gYTAyICogYTIwICogYjExICsgYTAwICogYTIyICogYjExICsgYTAxICogYTIwICogYjEyIC0gYTAwICogYTIxICogYjEyICsgYTAyICogYTEwICogYjIxICsgYTEyICogKCAtYTIxICogYjAwICsgYTIwICogYjAxICsgYTAxICogYjIwIC0gYTAwICogYjIxICkgLSBhMDEgKiBhMTAgKiBiMjIgKyBhMTEgKiAoIGEyMiAqIGIwMCAtIGEyMCAqIGIwMiAtIGEwMiAqIGIyMCArIGEwMCAqIGIyMiApO1xyXG4gIGNvbnN0IEMgPSAtYTIyICogYjAxICogYjEwICsgYTIxICogYjAyICogYjEwICsgYTIyICogYjAwICogYjExIC0gYTIwICogYjAyICogYjExIC0gYTIxICogYjAwICogYjEyICsgYTIwICogYjAxICogYjEyICsgYTEyICogYjAxICogYjIwIC0gYTExICogYjAyICogYjIwIC0gYTAyICogYjExICogYjIwICsgYTAxICogYjEyICogYjIwIC0gYTEyICogYjAwICogYjIxICsgYTEwICogYjAyICogYjIxICsgYTAyICogYjEwICogYjIxIC0gYTAwICogYjEyICogYjIxICsgYTExICogYjAwICogYjIyIC0gYTEwICogYjAxICogYjIyIC0gYTAxICogYjEwICogYjIyICsgYTAwICogYjExICogYjIyO1xyXG4gIGNvbnN0IEQgPSAtYjAyICogYjExICogYjIwICsgYjAxICogYjEyICogYjIwICsgYjAyICogYjEwICogYjIxIC0gYjAwICogYjEyICogYjIxIC0gYjAxICogYjEwICogYjIyICsgYjAwICogYjExICogYjIyO1xyXG5cclxuICAvLyBOT1RFOiB3ZSBkb24ndCBoYXZlIGEgZGlzY3JpbWluYW50IHRocmVzaG9sZCByaWdodCBub3dcclxuICBjb25zdCBwb3RlbnRpYWxMYW1iZGFzID0gQ29tcGxleC5zb2x2ZUN1YmljUm9vdHMoIENvbXBsZXgucmVhbCggQSApLCBDb21wbGV4LnJlYWwoIEIgKSwgQ29tcGxleC5yZWFsKCBDICksIENvbXBsZXgucmVhbCggRCApICk7XHJcblxyXG4gIGlmICggIXBvdGVudGlhbExhbWJkYXMgfHwgcG90ZW50aWFsTGFtYmRhcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAvLyBQcm9iYWJseSBvdmVybGFwcGluZywgaW5maW5pdGUgaW50ZXJzZWN0aW9uc1xyXG4gICAgcmV0dXJuIHsgZGVnZW5lcmF0ZUNvbmljTWF0cmljZXM6IFtdLCBpbnRlcnNlY3Rpb25Db2xsZWN0aW9uczogW10sIHBvaW50czogW10sIGxpbmVzOiBbXSB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdW5pcXVlTGFtYmRhcyA9IF8udW5pcVdpdGgoIHBvdGVudGlhbExhbWJkYXMsICggYSwgYiApID0+IGEuZXF1YWxzKCBiICkgKTtcclxuXHJcbiAgY29uc3QgZGVnZW5lcmF0ZUNvbmljTWF0cmljZXMgPSB1bmlxdWVMYW1iZGFzLm1hcCggbGFtYmRhID0+IHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIENvbXBsZXgucmVhbCggYTAwICkubXVsdGlwbHkoIGxhbWJkYSApLmFkZCggQ29tcGxleC5yZWFsKCBiMDAgKSApLFxyXG4gICAgICBDb21wbGV4LnJlYWwoIGEwMSApLm11bHRpcGx5KCBsYW1iZGEgKS5hZGQoIENvbXBsZXgucmVhbCggYjAxICkgKSxcclxuICAgICAgQ29tcGxleC5yZWFsKCBhMDIgKS5tdWx0aXBseSggbGFtYmRhICkuYWRkKCBDb21wbGV4LnJlYWwoIGIwMiApICksXHJcbiAgICAgIENvbXBsZXgucmVhbCggYTEwICkubXVsdGlwbHkoIGxhbWJkYSApLmFkZCggQ29tcGxleC5yZWFsKCBiMTAgKSApLFxyXG4gICAgICBDb21wbGV4LnJlYWwoIGExMSApLm11bHRpcGx5KCBsYW1iZGEgKS5hZGQoIENvbXBsZXgucmVhbCggYjExICkgKSxcclxuICAgICAgQ29tcGxleC5yZWFsKCBhMTIgKS5tdWx0aXBseSggbGFtYmRhICkuYWRkKCBDb21wbGV4LnJlYWwoIGIxMiApICksXHJcbiAgICAgIENvbXBsZXgucmVhbCggYTIwICkubXVsdGlwbHkoIGxhbWJkYSApLmFkZCggQ29tcGxleC5yZWFsKCBiMjAgKSApLFxyXG4gICAgICBDb21wbGV4LnJlYWwoIGEyMSApLm11bHRpcGx5KCBsYW1iZGEgKS5hZGQoIENvbXBsZXgucmVhbCggYjIxICkgKSxcclxuICAgICAgQ29tcGxleC5yZWFsKCBhMjIgKS5tdWx0aXBseSggbGFtYmRhICkuYWRkKCBDb21wbGV4LnJlYWwoIGIyMiApIClcclxuICAgIF07XHJcbiAgfSApO1xyXG5cclxuICBjb25zb2xlLmxvZyggJ2RldGVybWluYW50IG1hZ25pdHVkZXMnLCBkZWdlbmVyYXRlQ29uaWNNYXRyaWNlcy5tYXAoIG0gPT4gZ2V0RGV0ZXJtaW5hbnQoIG0gKS5tYWduaXR1ZGUgKSApO1xyXG5cclxuICBjb25zdCByZXN1bHQ6IFZlY3RvcjJbXSA9IFtdO1xyXG4gIGNvbnN0IGxpbmVDb2xsZWN0aW9ucyA9IGRlZ2VuZXJhdGVDb25pY01hdHJpY2VzLm1hcCggZ2V0TGluZXNGb3JEZWdlbmVyYXRlQ29uaWMgKTtcclxuICBjb25zb2xlLmxvZyggbGluZUNvbGxlY3Rpb25zICk7XHJcblxyXG4gIGNvbnN0IGludGVyc2VjdGlvbkNvbGxlY3Rpb25zID0gZGVnZW5lcmF0ZUNvbmljTWF0cmljZXMubWFwKCBnZXRSZWFsSW50ZXJzZWN0aW9uc0ZvckRlZ2VuZXJhdGVDb25pYyApO1xyXG4gIGNvbnNvbGUubG9nKCBpbnRlcnNlY3Rpb25Db2xsZWN0aW9ucyApO1xyXG5cclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaW5lQ29sbGVjdGlvbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBjb25zdCBsaW5lczAgPSBsaW5lQ29sbGVjdGlvbnNbIGkgXTtcclxuXHJcbiAgICAvLyBXZSBuZWVkIHRvIGhhbmRsZSBhIGNhc2Ugd2hlcmUgdHdvIGNvbmljcyBhcmUgdG91Y2hpbmcgYXQgYSB0YW5nZW50IHBvaW50XHJcbiAgICBjb25zdCBzZWxmSW50ZXJzZWN0aW9uID0gbGluZUludGVyc2VjdCggbGluZXMwWyAwIF0sIGxpbmVzMFsgMSBdICk7XHJcbiAgICBpZiAoIHNlbGZJbnRlcnNlY3Rpb24gKSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKCBzZWxmSW50ZXJzZWN0aW9uICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGogPSBpICsgMTsgaiA8IGxpbmVDb2xsZWN0aW9ucy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgY29uc3QgbGluZXMxID0gbGluZUNvbGxlY3Rpb25zWyBqIF07XHJcblxyXG4gICAgICBjb25zdCBjYW5kaWRhdGVzID0gW1xyXG4gICAgICAgIGxpbmVJbnRlcnNlY3QoIGxpbmVzMFsgMCBdLCBsaW5lczFbIDAgXSApLFxyXG4gICAgICAgIGxpbmVJbnRlcnNlY3QoIGxpbmVzMFsgMCBdLCBsaW5lczFbIDEgXSApLFxyXG4gICAgICAgIGxpbmVJbnRlcnNlY3QoIGxpbmVzMFsgMSBdLCBsaW5lczFbIDAgXSApLFxyXG4gICAgICAgIGxpbmVJbnRlcnNlY3QoIGxpbmVzMFsgMSBdLCBsaW5lczFbIDEgXSApXHJcbiAgICAgIF07XHJcblxyXG4gICAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCA0OyBrKysgKSB7XHJcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gY2FuZGlkYXRlc1sgayBdO1xyXG4gICAgICAgIGlmICggY2FuZGlkYXRlICkge1xyXG4gICAgICAgICAgcmVzdWx0LnB1c2goIGNhbmRpZGF0ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBvaW50czogcmVzdWx0LFxyXG4gICAgZGVnZW5lcmF0ZUNvbmljTWF0cmljZXM6IGRlZ2VuZXJhdGVDb25pY01hdHJpY2VzLFxyXG4gICAgbGluZXM6IF8uZmxhdHRlbiggbGluZUNvbGxlY3Rpb25zICksXHJcbiAgICBpbnRlcnNlY3Rpb25Db2xsZWN0aW9uczogaW50ZXJzZWN0aW9uQ29sbGVjdGlvbnNcclxuICB9O1xyXG59O1xyXG5leHBvcnQgZGVmYXVsdCBpbnRlcnNlY3RDb25pY01hdHJpY2VzO1xyXG5cclxua2l0ZS5yZWdpc3RlciggJ2ludGVyc2VjdENvbmljTWF0cmljZXMnLCBpbnRlcnNlY3RDb25pY01hdHJpY2VzICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSwwQkFBMEIsTUFBTSwrQ0FBK0M7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