/*
 *  big.js v6.2.1
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2022 Michael Mclaughlin
 *  https://github.com/MikeMcl/big.js/LICENCE.md
 */

/************************************** EDITABLE DEFAULTS *****************************************/

// The default values below must be integers within the stated ranges.

/*
 * The maximum number of decimal places (DP) of the results of operations involving division:
 * div and sqrt, and pow with negative exponents.
 */
var DP = 20,
  // 0 to MAX_DP

  /*
   * The rounding mode (RM) used when rounding to the above decimal places.
   *
   *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
   *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
   *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
   *  3  Away from zero.                                  (ROUND_UP)
   */
  RM = 1,
  // 0, 1, 2 or 3

  // The maximum value of DP and Big.DP.
  MAX_DP = 1E6,
  // 0 to 1000000

  // The maximum magnitude of the exponent argument to the pow method.
  MAX_POWER = 1E6,
  // 1 to 1000000

  /*
   * The negative exponent (NE) at and beneath which toString returns exponential notation.
   * (JavaScript numbers: -7)
   * -1000000 is the minimum recommended exponent value of a Big.
   */
  NE = -7,
  // 0 to -1000000

  /*
   * The positive exponent (PE) at and above which toString returns exponential notation.
   * (JavaScript numbers: 21)
   * 1000000 is the maximum recommended exponent value of a Big, but this limit is not enforced.
   */
  PE = 21,
  // 0 to 1000000

  /*
   * When true, an error will be thrown if a primitive number is passed to the Big constructor,
   * or if valueOf is called, or if toNumber is called on a Big which cannot be converted to a
   * primitive number without a loss of precision.
   */
  STRICT = false,
  // true or false

  /**************************************************************************************************/

  // Error messages.
  NAME = '[big.js] ',
  INVALID = NAME + 'Invalid ',
  INVALID_DP = INVALID + 'decimal places',
  INVALID_RM = INVALID + 'rounding mode',
  DIV_BY_ZERO = NAME + 'Division by zero',
  // The shared prototype object.
  P = {},
  UNDEFINED = void 0,
  NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

/*
 * Create and return a Big constructor.
 */
function _Big_() {
  /*
   * The Big constructor and exported function.
   * Create and return a new instance of a Big number object.
   *
   * n {number|string|Big} A numeric value.
   */
  function Big(n) {
    var x = this;

    // Enable constructor usage without new.
    if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

    // Duplicate.
    if (n instanceof Big) {
      x.s = n.s;
      x.e = n.e;
      x.c = n.c.slice();
    } else {
      if (typeof n !== 'string') {
        if (Big.strict === true && typeof n !== 'bigint') {
          throw TypeError(INVALID + 'value');
        }

        // Minus zero?
        n = n === 0 && 1 / n < 0 ? '-0' : String(n);
      }
      parse(x, n);
    }

    // Retain a reference to this Big constructor.
    // Shadow Big.prototype.constructor which points to Object.
    x.constructor = Big;
  }
  Big.prototype = P;
  Big.DP = DP;
  Big.RM = RM;
  Big.NE = NE;
  Big.PE = PE;
  Big.strict = STRICT;
  Big.roundDown = 0;
  Big.roundHalfUp = 1;
  Big.roundHalfEven = 2;
  Big.roundUp = 3;
  return Big;
}

/*
 * Parse the number or string value passed to a Big constructor.
 *
 * x {Big} A Big number instance.
 * n {number|string} A numeric value.
 */
function parse(x, n) {
  var e, i, nl;
  if (!NUMERIC.test(n)) {
    throw Error(INVALID + 'number');
  }

  // Determine sign.
  x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

  // Decimal point?
  if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

  // Exponential form?
  if ((i = n.search(/e/i)) > 0) {
    // Determine exponent.
    if (e < 0) e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {
    // Integer.
    e = n.length;
  }
  nl = n.length;

  // Determine leading zeros.
  for (i = 0; i < nl && n.charAt(i) == '0';) ++i;
  if (i == nl) {
    // Zero.
    x.c = [x.e = 0];
  } else {
    // Determine trailing zeros.
    for (; nl > 0 && n.charAt(--nl) == '0';);
    x.e = e - i - 1;
    x.c = [];

    // Convert string to array of digits without leading/trailing zeros.
    for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
  }
  return x;
}

/*
 * Round Big x to a maximum of sd significant digits using rounding mode rm.
 *
 * x {Big} The Big to round.
 * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
 * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 * [more] {boolean} Whether the result of division was truncated.
 */
function round(x, sd, rm, more) {
  var xc = x.c;
  if (rm === UNDEFINED) rm = x.constructor.RM;
  if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
    throw Error(INVALID_RM);
  }
  if (sd < 1) {
    more = rm === 3 && (more || !!xc[0]) || sd === 0 && (rm === 1 && xc[0] >= 5 || rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED)));
    xc.length = 1;
    if (more) {
      // 1, 0.1, 0.01, 0.001, 0.0001 etc.
      x.e = x.e - sd + 1;
      xc[0] = 1;
    } else {
      // Zero.
      xc[0] = x.e = 0;
    }
  } else if (sd < xc.length) {
    // xc[sd] is the digit after the digit that may be rounded up.
    more = rm === 1 && xc[sd] >= 5 || rm === 2 && (xc[sd] > 5 || xc[sd] === 5 && (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) || rm === 3 && (more || !!xc[0]);

    // Remove any digits after the required precision.
    xc.length = sd;

    // Round up?
    if (more) {
      // Rounding up may mean the previous digit has to be rounded up.
      for (; ++xc[--sd] > 9;) {
        xc[sd] = 0;
        if (sd === 0) {
          ++x.e;
          xc.unshift(1);
          break;
        }
      }
    }

    // Remove trailing zeros.
    for (sd = xc.length; !xc[--sd];) xc.pop();
  }
  return x;
}

/*
 * Return a string representing the value of Big x in normal or exponential notation.
 * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
 */
function stringify(x, doExponential, isNonzero) {
  var e = x.e,
    s = x.c.join(''),
    n = s.length;

  // Exponential notation?
  if (doExponential) {
    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
  } else if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) {
      for (e -= n; e--;) s += '0';
    } else if (e < n) {
      s = s.slice(0, e) + '.' + s.slice(e);
    }
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }
  return x.s < 0 && isNonzero ? '-' + s : s;
}

// Prototype/instance methods

/*
 * Return a new Big whose value is the absolute value of this Big.
 */
P.abs = function () {
  var x = new this.constructor(this);
  x.s = 1;
  return x;
};

/*
 * Return 1 if the value of this Big is greater than the value of Big y,
 *       -1 if the value of this Big is less than the value of Big y, or
 *        0 if they have the same value.
 */
P.cmp = function (y) {
  var isneg,
    x = this,
    xc = x.c,
    yc = (y = new x.constructor(y)).c,
    i = x.s,
    j = y.s,
    k = x.e,
    l = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

  // Signs differ?
  if (i != j) return i;
  isneg = i < 0;

  // Compare exponents.
  if (k != l) return k > l ^ isneg ? 1 : -1;
  j = (k = xc.length) < (l = yc.length) ? k : l;

  // Compare digit by digit.
  for (i = -1; ++i < j;) {
    if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
  }

  // Compare lengths.
  return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};

/*
 * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
 * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.div = function (y) {
  var x = this,
    Big = x.constructor,
    a = x.c,
    // dividend
    b = (y = new Big(y)).c,
    // divisor
    k = x.s == y.s ? 1 : -1,
    dp = Big.DP;
  if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }

  // Divisor is zero?
  if (!b[0]) {
    throw Error(DIV_BY_ZERO);
  }

  // Dividend is 0? Return +-0.
  if (!a[0]) {
    y.s = k;
    y.c = [y.e = 0];
    return y;
  }
  var bl,
    bt,
    n,
    cmp,
    ri,
    bz = b.slice(),
    ai = bl = b.length,
    al = a.length,
    r = a.slice(0, bl),
    // remainder
    rl = r.length,
    q = y,
    // quotient
    qc = q.c = [],
    qi = 0,
    p = dp + (q.e = x.e - y.e) + 1; // precision of the result

  q.s = k;
  k = p < 0 ? 0 : p;

  // Create version of divisor with leading zero.
  bz.unshift(0);

  // Add zeros to make remainder as long as divisor.
  for (; rl++ < bl;) r.push(0);
  do {
    // n is how many times the divisor goes into current remainder.
    for (n = 0; n < 10; n++) {
      // Compare divisor and remainder.
      if (bl != (rl = r.length)) {
        cmp = bl > rl ? 1 : -1;
      } else {
        for (ri = -1, cmp = 0; ++ri < bl;) {
          if (b[ri] != r[ri]) {
            cmp = b[ri] > r[ri] ? 1 : -1;
            break;
          }
        }
      }

      // If divisor < remainder, subtract divisor from remainder.
      if (cmp < 0) {
        // Remainder can't be more than 1 digit longer than divisor.
        // Equalise lengths using divisor with extra leading zero?
        for (bt = rl == bl ? b : bz; rl;) {
          if (r[--rl] < bt[rl]) {
            ri = rl;
            for (; ri && !r[--ri];) r[ri] = 9;
            --r[ri];
            r[rl] += 10;
          }
          r[rl] -= bt[rl];
        }
        for (; !r[0];) r.shift();
      } else {
        break;
      }
    }

    // Add the digit n to the result array.
    qc[qi++] = cmp ? n : ++n;

    // Update the remainder.
    if (r[0] && cmp) r[rl] = a[ai] || 0;else r = [a[ai]];
  } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

  // Leading zero? Do not remove if result is simply zero (qi == 1).
  if (!qc[0] && qi != 1) {
    // There can't be more than one zero.
    qc.shift();
    q.e--;
    p--;
  }

  // Round?
  if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);
  return q;
};

/*
 * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
 */
P.eq = function (y) {
  return this.cmp(y) === 0;
};

/*
 * Return true if the value of this Big is greater than the value of Big y, otherwise return
 * false.
 */
P.gt = function (y) {
  return this.cmp(y) > 0;
};

/*
 * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
 * return false.
 */
P.gte = function (y) {
  return this.cmp(y) > -1;
};

/*
 * Return true if the value of this Big is less than the value of Big y, otherwise return false.
 */
P.lt = function (y) {
  return this.cmp(y) < 0;
};

/*
 * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
 * return false.
 */
P.lte = function (y) {
  return this.cmp(y) < 1;
};

/*
 * Return a new Big whose value is the value of this Big minus the value of Big y.
 */
P.minus = P.sub = function (y) {
  var i,
    j,
    t,
    xlty,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  // Signs differ?
  if (a != b) {
    y.s = -b;
    return x.plus(y);
  }
  var xc = x.c.slice(),
    xe = x.e,
    yc = y.c,
    ye = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (yc[0]) {
      y.s = -b;
    } else if (xc[0]) {
      y = new Big(x);
    } else {
      y.s = 1;
    }
    return y;
  }

  // Determine which is the bigger number. Prepend zeros to equalise exponents.
  if (a = xe - ye) {
    if (xlty = a < 0) {
      a = -a;
      t = xc;
    } else {
      ye = xe;
      t = yc;
    }
    t.reverse();
    for (b = a; b--;) t.push(0);
    t.reverse();
  } else {
    // Exponents equal. Check digit by digit.
    j = ((xlty = xc.length < yc.length) ? xc : yc).length;
    for (a = b = 0; b < j; b++) {
      if (xc[b] != yc[b]) {
        xlty = xc[b] < yc[b];
        break;
      }
    }
  }

  // x < y? Point xc to the array of the bigger number.
  if (xlty) {
    t = xc;
    xc = yc;
    yc = t;
    y.s = -y.s;
  }

  /*
   * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
   * needs to start at yc.length.
   */
  if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

  // Subtract yc from xc.
  for (b = i; j > a;) {
    if (xc[--j] < yc[j]) {
      for (i = j; i && !xc[--i];) xc[i] = 9;
      --xc[i];
      xc[j] += 10;
    }
    xc[j] -= yc[j];
  }

  // Remove trailing zeros.
  for (; xc[--b] === 0;) xc.pop();

  // Remove leading zeros and adjust exponent accordingly.
  for (; xc[0] === 0;) {
    xc.shift();
    --ye;
  }
  if (!xc[0]) {
    // n - n = +0
    y.s = 1;

    // Result must be zero.
    xc = [ye = 0];
  }
  y.c = xc;
  y.e = ye;
  return y;
};

/*
 * Return a new Big whose value is the value of this Big modulo the value of Big y.
 */
P.mod = function (y) {
  var ygtx,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;
  if (!y.c[0]) {
    throw Error(DIV_BY_ZERO);
  }
  x.s = y.s = 1;
  ygtx = y.cmp(x) == 1;
  x.s = a;
  y.s = b;
  if (ygtx) return new Big(x);
  a = Big.DP;
  b = Big.RM;
  Big.DP = Big.RM = 0;
  x = x.div(y);
  Big.DP = a;
  Big.RM = b;
  return this.minus(x.times(y));
};

/*
 * Return a new Big whose value is the value of this Big negated.
 */
P.neg = function () {
  var x = new this.constructor(this);
  x.s = -x.s;
  return x;
};

/*
 * Return a new Big whose value is the value of this Big plus the value of Big y.
 */
P.plus = P.add = function (y) {
  var e,
    k,
    t,
    x = this,
    Big = x.constructor;
  y = new Big(y);

  // Signs differ?
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }
  var xe = x.e,
    xc = x.c,
    ye = y.e,
    yc = y.c;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (!yc[0]) {
      if (xc[0]) {
        y = new Big(x);
      } else {
        y.s = x.s;
      }
    }
    return y;
  }
  xc = xc.slice();

  // Prepend zeros to equalise exponents.
  // Note: reverse faster than unshifts.
  if (e = xe - ye) {
    if (e > 0) {
      ye = xe;
      t = yc;
    } else {
      e = -e;
      t = xc;
    }
    t.reverse();
    for (; e--;) t.push(0);
    t.reverse();
  }

  // Point xc to the longer array.
  if (xc.length - yc.length < 0) {
    t = yc;
    yc = xc;
    xc = t;
  }
  e = yc.length;

  // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
  for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;

  // No need to check for zero, as +x + +y != 0 && -x + -y != 0

  if (k) {
    xc.unshift(k);
    ++ye;
  }

  // Remove trailing zeros.
  for (e = xc.length; xc[--e] === 0;) xc.pop();
  y.c = xc;
  y.e = ye;
  return y;
};

/*
 * Return a Big whose value is the value of this Big raised to the power n.
 * If n is negative, round to a maximum of Big.DP decimal places using rounding
 * mode Big.RM.
 *
 * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P.pow = function (n) {
  var x = this,
    one = new x.constructor('1'),
    y = one,
    isneg = n < 0;
  if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
    throw Error(INVALID + 'exponent');
  }
  if (isneg) n = -n;
  for (;;) {
    if (n & 1) y = y.times(x);
    n >>= 1;
    if (!n) break;
    x = x.times(x);
  }
  return isneg ? one.div(y) : y;
};

/*
 * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
 * significant digits using rounding mode rm, or Big.RM if rm is not specified.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.prec = function (sd, rm) {
  if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
    throw Error(INVALID + 'precision');
  }
  return round(new this.constructor(this), sd, rm);
};

/*
 * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
 * using rounding mode rm, or Big.RM if rm is not specified.
 * If dp is negative, round to an integer which is a multiple of 10**-dp.
 * If dp is not specified, round to 0 decimal places.
 *
 * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.round = function (dp, rm) {
  if (dp === UNDEFINED) dp = 0;else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }
  return round(new this.constructor(this), dp + this.e + 1, rm);
};

/*
 * Return a new Big whose value is the square root of the value of this Big, rounded, if
 * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.sqrt = function () {
  var r,
    c,
    t,
    x = this,
    Big = x.constructor,
    s = x.s,
    e = x.e,
    half = new Big('0.5');

  // Zero?
  if (!x.c[0]) return new Big(x);

  // Negative?
  if (s < 0) {
    throw Error(NAME + 'No square root');
  }

  // Estimate.
  s = Math.sqrt(x + '');

  // Math.sqrt underflow/overflow?
  // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
  if (s === 0 || s === 1 / 0) {
    c = x.c.join('');
    if (!(c.length + e & 1)) c += '0';
    s = Math.sqrt(c);
    e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
    r = new Big((s == 1 / 0 ? '5e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
  } else {
    r = new Big(s + '');
  }
  e = r.e + (Big.DP += 4);

  // Newton-Raphson iteration.
  do {
    t = r;
    r = half.times(t.plus(x.div(t)));
  } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));
  return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
};

/*
 * Return a new Big whose value is the value of this Big times the value of Big y.
 */
P.times = P.mul = function (y) {
  var c,
    x = this,
    Big = x.constructor,
    xc = x.c,
    yc = (y = new Big(y)).c,
    a = xc.length,
    b = yc.length,
    i = x.e,
    j = y.e;

  // Determine sign of result.
  y.s = x.s == y.s ? 1 : -1;

  // Return signed 0 if either 0.
  if (!xc[0] || !yc[0]) {
    y.c = [y.e = 0];
    return y;
  }

  // Initialise exponent of result as x.e + y.e.
  y.e = i + j;

  // If array xc has fewer digits than yc, swap xc and yc, and lengths.
  if (a < b) {
    c = xc;
    xc = yc;
    yc = c;
    j = a;
    a = b;
    b = j;
  }

  // Initialise coefficient array of result with zeros.
  for (c = new Array(j = a + b); j--;) c[j] = 0;

  // Multiply.

  // i is initially xc.length.
  for (i = b; i--;) {
    b = 0;

    // a is yc.length.
    for (j = a + i; j > i;) {
      // Current sum of products at this digit position, plus carry.
      b = c[j] + yc[i] * xc[j - i - 1] + b;
      c[j--] = b % 10;

      // carry
      b = b / 10 | 0;
    }
    c[j] = b;
  }

  // Increment result exponent if there is a final carry, otherwise remove leading zero.
  if (b) ++y.e;else c.shift();

  // Remove trailing zeros.
  for (i = c.length; !c[--i];) c.pop();
  y.c = c;
  return y;
};

/*
 * Return a string representing the value of this Big in exponential notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toExponential = function (dp, rm) {
  var x = this,
    n = x.c[0];
  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), ++dp, rm);
    for (; x.c.length < dp;) x.c.push(0);
  }
  return stringify(x, true, !!n);
};

/*
 * Return a string representing the value of this Big in normal notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 *
 * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
 * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
 */
P.toFixed = function (dp, rm) {
  var x = this,
    n = x.c[0];
  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), dp + x.e + 1, rm);

    // x.e may have changed if the value is rounded up.
    for (dp = dp + x.e + 1; x.c.length < dp;) x.c.push(0);
  }
  return stringify(x, false, !!n);
};

/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Omit the sign for negative zero.
 */
P[Symbol.for('nodejs.util.inspect.custom')] = P.toJSON = P.toString = function () {
  var x = this,
    Big = x.constructor;
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
};

/*
 * Return the value of this Big as a primitve number.
 */
P.toNumber = function () {
  var n = Number(stringify(this, true, true));
  if (this.constructor.strict === true && !this.eq(n.toString())) {
    throw Error(NAME + 'Imprecise conversion');
  }
  return n;
};

/*
 * Return a string representing the value of this Big rounded to sd significant digits using
 * rounding mode rm, or Big.RM if rm is not specified.
 * Use exponential notation if sd is less than the number of digits necessary to represent
 * the integer part of the value in normal notation.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toPrecision = function (sd, rm) {
  var x = this,
    Big = x.constructor,
    n = x.c[0];
  if (sd !== UNDEFINED) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + 'precision');
    }
    x = round(new Big(x), sd, rm);
    for (; x.c.length < sd;) x.c.push(0);
  }
  return stringify(x, sd <= x.e || x.e <= Big.NE || x.e >= Big.PE, !!n);
};

/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Include the sign for negative zero.
 */
P.valueOf = function () {
  var x = this,
    Big = x.constructor;
  if (Big.strict === true) {
    throw Error(NAME + 'valueOf disallowed');
  }
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
};

// Export

export var Big = _Big_();

/// <reference types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts" />
export default Big;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEUCIsIlJNIiwiTUFYX0RQIiwiTUFYX1BPV0VSIiwiTkUiLCJQRSIsIlNUUklDVCIsIk5BTUUiLCJJTlZBTElEIiwiSU5WQUxJRF9EUCIsIklOVkFMSURfUk0iLCJESVZfQllfWkVSTyIsIlAiLCJVTkRFRklORUQiLCJOVU1FUklDIiwiX0JpZ18iLCJCaWciLCJuIiwieCIsInMiLCJlIiwiYyIsInNsaWNlIiwic3RyaWN0IiwiVHlwZUVycm9yIiwiU3RyaW5nIiwicGFyc2UiLCJjb25zdHJ1Y3RvciIsInByb3RvdHlwZSIsInJvdW5kRG93biIsInJvdW5kSGFsZlVwIiwicm91bmRIYWxmRXZlbiIsInJvdW5kVXAiLCJpIiwibmwiLCJ0ZXN0IiwiRXJyb3IiLCJjaGFyQXQiLCJpbmRleE9mIiwicmVwbGFjZSIsInNlYXJjaCIsInN1YnN0cmluZyIsImxlbmd0aCIsInJvdW5kIiwic2QiLCJybSIsIm1vcmUiLCJ4YyIsInVuc2hpZnQiLCJwb3AiLCJzdHJpbmdpZnkiLCJkb0V4cG9uZW50aWFsIiwiaXNOb256ZXJvIiwiam9pbiIsImFicyIsImNtcCIsInkiLCJpc25lZyIsInljIiwiaiIsImsiLCJsIiwiZGl2IiwiYSIsImIiLCJkcCIsImJsIiwiYnQiLCJyaSIsImJ6IiwiYWkiLCJhbCIsInIiLCJybCIsInEiLCJxYyIsInFpIiwicCIsInB1c2giLCJzaGlmdCIsImVxIiwiZ3QiLCJndGUiLCJsdCIsImx0ZSIsIm1pbnVzIiwic3ViIiwidCIsInhsdHkiLCJwbHVzIiwieGUiLCJ5ZSIsInJldmVyc2UiLCJtb2QiLCJ5Z3R4IiwidGltZXMiLCJuZWciLCJhZGQiLCJwb3ciLCJvbmUiLCJwcmVjIiwic3FydCIsImhhbGYiLCJNYXRoIiwidG9FeHBvbmVudGlhbCIsIm11bCIsIkFycmF5IiwidG9GaXhlZCIsIlN5bWJvbCIsImZvciIsInRvSlNPTiIsInRvU3RyaW5nIiwidG9OdW1iZXIiLCJOdW1iZXIiLCJ0b1ByZWNpc2lvbiIsInZhbHVlT2YiXSwic291cmNlcyI6WyJiaWctNi4yLjEubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqICBiaWcuanMgdjYuMi4xXHJcbiAqICBBIHNtYWxsLCBmYXN0LCBlYXN5LXRvLXVzZSBsaWJyYXJ5IGZvciBhcmJpdHJhcnktcHJlY2lzaW9uIGRlY2ltYWwgYXJpdGhtZXRpYy5cclxuICogIENvcHlyaWdodCAoYykgMjAyMiBNaWNoYWVsIE1jbGF1Z2hsaW5cclxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZy5qcy9MSUNFTkNFLm1kXHJcbiAqL1xyXG5cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBFRElUQUJMRSBERUZBVUxUUyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gIC8vIFRoZSBkZWZhdWx0IHZhbHVlcyBiZWxvdyBtdXN0IGJlIGludGVnZXJzIHdpdGhpbiB0aGUgc3RhdGVkIHJhbmdlcy5cclxuXHJcbiAgLypcclxuICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgKERQKSBvZiB0aGUgcmVzdWx0cyBvZiBvcGVyYXRpb25zIGludm9sdmluZyBkaXZpc2lvbjpcclxuICAgKiBkaXYgYW5kIHNxcnQsIGFuZCBwb3cgd2l0aCBuZWdhdGl2ZSBleHBvbmVudHMuXHJcbiAgICovXHJcbnZhciBEUCA9IDIwLCAgICAgICAgICAvLyAwIHRvIE1BWF9EUFxyXG5cclxuICAvKlxyXG4gICAqIFRoZSByb3VuZGluZyBtb2RlIChSTSkgdXNlZCB3aGVuIHJvdW5kaW5nIHRvIHRoZSBhYm92ZSBkZWNpbWFsIHBsYWNlcy5cclxuICAgKlxyXG4gICAqICAwICBUb3dhcmRzIHplcm8gKGkuZS4gdHJ1bmNhdGUsIG5vIHJvdW5kaW5nKS4gICAgICAgKFJPVU5EX0RPV04pXHJcbiAgICogIDEgIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgcm91bmQgdXAuICAoUk9VTkRfSEFMRl9VUClcclxuICAgKiAgMiAgVG8gbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0byBldmVuLiAgIChST1VORF9IQUxGX0VWRU4pXHJcbiAgICogIDMgIEF3YXkgZnJvbSB6ZXJvLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoUk9VTkRfVVApXHJcbiAgICovXHJcbiAgUk0gPSAxLCAgICAgICAgICAgICAvLyAwLCAxLCAyIG9yIDNcclxuXHJcbiAgLy8gVGhlIG1heGltdW0gdmFsdWUgb2YgRFAgYW5kIEJpZy5EUC5cclxuICBNQVhfRFAgPSAxRTYsICAgICAgIC8vIDAgdG8gMTAwMDAwMFxyXG5cclxuICAvLyBUaGUgbWF4aW11bSBtYWduaXR1ZGUgb2YgdGhlIGV4cG9uZW50IGFyZ3VtZW50IHRvIHRoZSBwb3cgbWV0aG9kLlxyXG4gIE1BWF9QT1dFUiA9IDFFNiwgICAgLy8gMSB0byAxMDAwMDAwXHJcblxyXG4gIC8qXHJcbiAgICogVGhlIG5lZ2F0aXZlIGV4cG9uZW50IChORSkgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgKiAoSmF2YVNjcmlwdCBudW1iZXJzOiAtNylcclxuICAgKiAtMTAwMDAwMCBpcyB0aGUgbWluaW11bSByZWNvbW1lbmRlZCBleHBvbmVudCB2YWx1ZSBvZiBhIEJpZy5cclxuICAgKi9cclxuICBORSA9IC03LCAgICAgICAgICAgIC8vIDAgdG8gLTEwMDAwMDBcclxuXHJcbiAgLypcclxuICAgKiBUaGUgcG9zaXRpdmUgZXhwb25lbnQgKFBFKSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgKiAoSmF2YVNjcmlwdCBudW1iZXJzOiAyMSlcclxuICAgKiAxMDAwMDAwIGlzIHRoZSBtYXhpbXVtIHJlY29tbWVuZGVkIGV4cG9uZW50IHZhbHVlIG9mIGEgQmlnLCBidXQgdGhpcyBsaW1pdCBpcyBub3QgZW5mb3JjZWQuXHJcbiAgICovXHJcbiAgUEUgPSAyMSwgICAgICAgICAgICAvLyAwIHRvIDEwMDAwMDBcclxuXHJcbiAgLypcclxuICAgKiBXaGVuIHRydWUsIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIGlmIGEgcHJpbWl0aXZlIG51bWJlciBpcyBwYXNzZWQgdG8gdGhlIEJpZyBjb25zdHJ1Y3RvcixcclxuICAgKiBvciBpZiB2YWx1ZU9mIGlzIGNhbGxlZCwgb3IgaWYgdG9OdW1iZXIgaXMgY2FsbGVkIG9uIGEgQmlnIHdoaWNoIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gYVxyXG4gICAqIHByaW1pdGl2ZSBudW1iZXIgd2l0aG91dCBhIGxvc3Mgb2YgcHJlY2lzaW9uLlxyXG4gICAqL1xyXG4gIFNUUklDVCA9IGZhbHNlLCAgICAgLy8gdHJ1ZSBvciBmYWxzZVxyXG5cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gIC8vIEVycm9yIG1lc3NhZ2VzLlxyXG4gIE5BTUUgPSAnW2JpZy5qc10gJyxcclxuICBJTlZBTElEID0gTkFNRSArICdJbnZhbGlkICcsXHJcbiAgSU5WQUxJRF9EUCA9IElOVkFMSUQgKyAnZGVjaW1hbCBwbGFjZXMnLFxyXG4gIElOVkFMSURfUk0gPSBJTlZBTElEICsgJ3JvdW5kaW5nIG1vZGUnLFxyXG4gIERJVl9CWV9aRVJPID0gTkFNRSArICdEaXZpc2lvbiBieSB6ZXJvJyxcclxuXHJcbiAgLy8gVGhlIHNoYXJlZCBwcm90b3R5cGUgb2JqZWN0LlxyXG4gIFAgPSB7fSxcclxuICBVTkRFRklORUQgPSB2b2lkIDAsXHJcbiAgTlVNRVJJQyA9IC9eLT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/JC9pO1xyXG5cclxuXHJcbi8qXHJcbiAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgQmlnIGNvbnN0cnVjdG9yLlxyXG4gKi9cclxuZnVuY3Rpb24gX0JpZ18oKSB7XHJcblxyXG4gIC8qXHJcbiAgICogVGhlIEJpZyBjb25zdHJ1Y3RvciBhbmQgZXhwb3J0ZWQgZnVuY3Rpb24uXHJcbiAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgaW5zdGFuY2Ugb2YgYSBCaWcgbnVtYmVyIG9iamVjdC5cclxuICAgKlxyXG4gICAqIG4ge251bWJlcnxzdHJpbmd8QmlnfSBBIG51bWVyaWMgdmFsdWUuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gQmlnKG4pIHtcclxuICAgIHZhciB4ID0gdGhpcztcclxuXHJcbiAgICAvLyBFbmFibGUgY29uc3RydWN0b3IgdXNhZ2Ugd2l0aG91dCBuZXcuXHJcbiAgICBpZiAoISh4IGluc3RhbmNlb2YgQmlnKSkgcmV0dXJuIG4gPT09IFVOREVGSU5FRCA/IF9CaWdfKCkgOiBuZXcgQmlnKG4pO1xyXG5cclxuICAgIC8vIER1cGxpY2F0ZS5cclxuICAgIGlmIChuIGluc3RhbmNlb2YgQmlnKSB7XHJcbiAgICAgIHgucyA9IG4ucztcclxuICAgICAgeC5lID0gbi5lO1xyXG4gICAgICB4LmMgPSBuLmMuc2xpY2UoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgbiAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBpZiAoQmlnLnN0cmljdCA9PT0gdHJ1ZSAmJiB0eXBlb2YgbiAhPT0gJ2JpZ2ludCcpIHtcclxuICAgICAgICAgIHRocm93IFR5cGVFcnJvcihJTlZBTElEICsgJ3ZhbHVlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNaW51cyB6ZXJvP1xyXG4gICAgICAgIG4gPSBuID09PSAwICYmIDEgLyBuIDwgMCA/ICctMCcgOiBTdHJpbmcobik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhcnNlKHgsIG4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldGFpbiBhIHJlZmVyZW5jZSB0byB0aGlzIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgIC8vIFNoYWRvdyBCaWcucHJvdG90eXBlLmNvbnN0cnVjdG9yIHdoaWNoIHBvaW50cyB0byBPYmplY3QuXHJcbiAgICB4LmNvbnN0cnVjdG9yID0gQmlnO1xyXG4gIH1cclxuXHJcbiAgQmlnLnByb3RvdHlwZSA9IFA7XHJcbiAgQmlnLkRQID0gRFA7XHJcbiAgQmlnLlJNID0gUk07XHJcbiAgQmlnLk5FID0gTkU7XHJcbiAgQmlnLlBFID0gUEU7XHJcbiAgQmlnLnN0cmljdCA9IFNUUklDVDtcclxuICBCaWcucm91bmREb3duID0gMDtcclxuICBCaWcucm91bmRIYWxmVXAgPSAxO1xyXG4gIEJpZy5yb3VuZEhhbGZFdmVuID0gMjtcclxuICBCaWcucm91bmRVcCA9IDM7XHJcblxyXG4gIHJldHVybiBCaWc7XHJcbn1cclxuXHJcblxyXG4vKlxyXG4gKiBQYXJzZSB0aGUgbnVtYmVyIG9yIHN0cmluZyB2YWx1ZSBwYXNzZWQgdG8gYSBCaWcgY29uc3RydWN0b3IuXHJcbiAqXHJcbiAqIHgge0JpZ30gQSBCaWcgbnVtYmVyIGluc3RhbmNlLlxyXG4gKiBuIHtudW1iZXJ8c3RyaW5nfSBBIG51bWVyaWMgdmFsdWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBwYXJzZSh4LCBuKSB7XHJcbiAgdmFyIGUsIGksIG5sO1xyXG5cclxuICBpZiAoIU5VTUVSSUMudGVzdChuKSkge1xyXG4gICAgdGhyb3cgRXJyb3IoSU5WQUxJRCArICdudW1iZXInKTtcclxuICB9XHJcblxyXG4gIC8vIERldGVybWluZSBzaWduLlxyXG4gIHgucyA9IG4uY2hhckF0KDApID09ICctJyA/IChuID0gbi5zbGljZSgxKSwgLTEpIDogMTtcclxuXHJcbiAgLy8gRGVjaW1hbCBwb2ludD9cclxuICBpZiAoKGUgPSBuLmluZGV4T2YoJy4nKSkgPiAtMSkgbiA9IG4ucmVwbGFjZSgnLicsICcnKTtcclxuXHJcbiAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICBpZiAoKGkgPSBuLnNlYXJjaCgvZS9pKSkgPiAwKSB7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgaWYgKGUgPCAwKSBlID0gaTtcclxuICAgIGUgKz0gK24uc2xpY2UoaSArIDEpO1xyXG4gICAgbiA9IG4uc3Vic3RyaW5nKDAsIGkpO1xyXG4gIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAvLyBJbnRlZ2VyLlxyXG4gICAgZSA9IG4ubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgbmwgPSBuLmxlbmd0aDtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lIGxlYWRpbmcgemVyb3MuXHJcbiAgZm9yIChpID0gMDsgaSA8IG5sICYmIG4uY2hhckF0KGkpID09ICcwJzspICsraTtcclxuXHJcbiAgaWYgKGkgPT0gbmwpIHtcclxuXHJcbiAgICAvLyBaZXJvLlxyXG4gICAgeC5jID0gW3guZSA9IDBdO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yICg7IG5sID4gMCAmJiBuLmNoYXJBdCgtLW5sKSA9PSAnMCc7KTtcclxuICAgIHguZSA9IGUgLSBpIC0gMTtcclxuICAgIHguYyA9IFtdO1xyXG5cclxuICAgIC8vIENvbnZlcnQgc3RyaW5nIHRvIGFycmF5IG9mIGRpZ2l0cyB3aXRob3V0IGxlYWRpbmcvdHJhaWxpbmcgemVyb3MuXHJcbiAgICBmb3IgKGUgPSAwOyBpIDw9IG5sOykgeC5jW2UrK10gPSArbi5jaGFyQXQoaSsrKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB4O1xyXG59XHJcblxyXG5cclxuLypcclxuICogUm91bmQgQmlnIHggdG8gYSBtYXhpbXVtIG9mIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gKlxyXG4gKiB4IHtCaWd9IFRoZSBCaWcgdG8gcm91bmQuXHJcbiAqIHNkIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gKiBybSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlOiAwIChkb3duKSwgMSAoaGFsZi11cCksIDIgKGhhbGYtZXZlbikgb3IgMyAodXApLlxyXG4gKiBbbW9yZV0ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlc3VsdCBvZiBkaXZpc2lvbiB3YXMgdHJ1bmNhdGVkLlxyXG4gKi9cclxuZnVuY3Rpb24gcm91bmQoeCwgc2QsIHJtLCBtb3JlKSB7XHJcbiAgdmFyIHhjID0geC5jO1xyXG5cclxuICBpZiAocm0gPT09IFVOREVGSU5FRCkgcm0gPSB4LmNvbnN0cnVjdG9yLlJNO1xyXG4gIGlmIChybSAhPT0gMCAmJiBybSAhPT0gMSAmJiBybSAhPT0gMiAmJiBybSAhPT0gMykge1xyXG4gICAgdGhyb3cgRXJyb3IoSU5WQUxJRF9STSk7XHJcbiAgfVxyXG5cclxuICBpZiAoc2QgPCAxKSB7XHJcbiAgICBtb3JlID1cclxuICAgICAgcm0gPT09IDMgJiYgKG1vcmUgfHwgISF4Y1swXSkgfHwgc2QgPT09IDAgJiYgKFxyXG4gICAgICBybSA9PT0gMSAmJiB4Y1swXSA+PSA1IHx8XHJcbiAgICAgIHJtID09PSAyICYmICh4Y1swXSA+IDUgfHwgeGNbMF0gPT09IDUgJiYgKG1vcmUgfHwgeGNbMV0gIT09IFVOREVGSU5FRCkpXHJcbiAgICApO1xyXG5cclxuICAgIHhjLmxlbmd0aCA9IDE7XHJcblxyXG4gICAgaWYgKG1vcmUpIHtcclxuXHJcbiAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgIHguZSA9IHguZSAtIHNkICsgMTtcclxuICAgICAgeGNbMF0gPSAxO1xyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFplcm8uXHJcbiAgICAgIHhjWzBdID0geC5lID0gMDtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHNkIDwgeGMubGVuZ3RoKSB7XHJcblxyXG4gICAgLy8geGNbc2RdIGlzIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgIG1vcmUgPVxyXG4gICAgICBybSA9PT0gMSAmJiB4Y1tzZF0gPj0gNSB8fFxyXG4gICAgICBybSA9PT0gMiAmJiAoeGNbc2RdID4gNSB8fCB4Y1tzZF0gPT09IDUgJiZcclxuICAgICAgICAobW9yZSB8fCB4Y1tzZCArIDFdICE9PSBVTkRFRklORUQgfHwgeGNbc2QgLSAxXSAmIDEpKSB8fFxyXG4gICAgICBybSA9PT0gMyAmJiAobW9yZSB8fCAhIXhjWzBdKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgYW55IGRpZ2l0cyBhZnRlciB0aGUgcmVxdWlyZWQgcHJlY2lzaW9uLlxyXG4gICAgeGMubGVuZ3RoID0gc2Q7XHJcblxyXG4gICAgLy8gUm91bmQgdXA/XHJcbiAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgLy8gUm91bmRpbmcgdXAgbWF5IG1lYW4gdGhlIHByZXZpb3VzIGRpZ2l0IGhhcyB0byBiZSByb3VuZGVkIHVwLlxyXG4gICAgICBmb3IgKDsgKyt4Y1stLXNkXSA+IDk7KSB7XHJcbiAgICAgICAgeGNbc2RdID0gMDtcclxuICAgICAgICBpZiAoc2QgPT09IDApIHtcclxuICAgICAgICAgICsreC5lO1xyXG4gICAgICAgICAgeGMudW5zaGlmdCgxKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgIGZvciAoc2QgPSB4Yy5sZW5ndGg7ICF4Y1stLXNkXTspIHhjLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHg7XHJcbn1cclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiBCaWcgeCBpbiBub3JtYWwgb3IgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAqIEhhbmRsZXMgUC50b0V4cG9uZW50aWFsLCBQLnRvRml4ZWQsIFAudG9KU09OLCBQLnRvUHJlY2lzaW9uLCBQLnRvU3RyaW5nIGFuZCBQLnZhbHVlT2YuXHJcbiAqL1xyXG5mdW5jdGlvbiBzdHJpbmdpZnkoeCwgZG9FeHBvbmVudGlhbCwgaXNOb256ZXJvKSB7XHJcbiAgdmFyIGUgPSB4LmUsXHJcbiAgICBzID0geC5jLmpvaW4oJycpLFxyXG4gICAgbiA9IHMubGVuZ3RoO1xyXG5cclxuICAvLyBFeHBvbmVudGlhbCBub3RhdGlvbj9cclxuICBpZiAoZG9FeHBvbmVudGlhbCkge1xyXG4gICAgcyA9IHMuY2hhckF0KDApICsgKG4gPiAxID8gJy4nICsgcy5zbGljZSgxKSA6ICcnKSArIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuXHJcbiAgLy8gTm9ybWFsIG5vdGF0aW9uLlxyXG4gIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuICAgIGZvciAoOyArK2U7KSBzID0gJzAnICsgcztcclxuICAgIHMgPSAnMC4nICsgcztcclxuICB9IGVsc2UgaWYgKGUgPiAwKSB7XHJcbiAgICBpZiAoKytlID4gbikge1xyXG4gICAgICBmb3IgKGUgLT0gbjsgZS0tOykgcyArPSAnMCc7XHJcbiAgICB9IGVsc2UgaWYgKGUgPCBuKSB7XHJcbiAgICAgIHMgPSBzLnNsaWNlKDAsIGUpICsgJy4nICsgcy5zbGljZShlKTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKG4gPiAxKSB7XHJcbiAgICBzID0gcy5jaGFyQXQoMCkgKyAnLicgKyBzLnNsaWNlKDEpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHgucyA8IDAgJiYgaXNOb256ZXJvID8gJy0nICsgcyA6IHM7XHJcbn1cclxuXHJcblxyXG4vLyBQcm90b3R5cGUvaW5zdGFuY2UgbWV0aG9kc1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoaXMgQmlnLlxyXG4gKi9cclxuUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHggPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKTtcclxuICB4LnMgPSAxO1xyXG4gIHJldHVybiB4O1xyXG59O1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gKiAgICAgICAtMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3JcclxuICogICAgICAgIDAgaWYgdGhleSBoYXZlIHRoZSBzYW1lIHZhbHVlLlxyXG4gKi9cclxuUC5jbXAgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHZhciBpc25lZyxcclxuICAgIHggPSB0aGlzLFxyXG4gICAgeGMgPSB4LmMsXHJcbiAgICB5YyA9ICh5ID0gbmV3IHguY29uc3RydWN0b3IoeSkpLmMsXHJcbiAgICBpID0geC5zLFxyXG4gICAgaiA9IHkucyxcclxuICAgIGsgPSB4LmUsXHJcbiAgICBsID0geS5lO1xyXG5cclxuICAvLyBFaXRoZXIgemVybz9cclxuICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkgcmV0dXJuICF4Y1swXSA/ICF5Y1swXSA/IDAgOiAtaiA6IGk7XHJcblxyXG4gIC8vIFNpZ25zIGRpZmZlcj9cclxuICBpZiAoaSAhPSBqKSByZXR1cm4gaTtcclxuXHJcbiAgaXNuZWcgPSBpIDwgMDtcclxuXHJcbiAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgaWYgKGsgIT0gbCkgcmV0dXJuIGsgPiBsIF4gaXNuZWcgPyAxIDogLTE7XHJcblxyXG4gIGogPSAoayA9IHhjLmxlbmd0aCkgPCAobCA9IHljLmxlbmd0aCkgPyBrIDogbDtcclxuXHJcbiAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICBmb3IgKGkgPSAtMTsgKytpIDwgajspIHtcclxuICAgIGlmICh4Y1tpXSAhPSB5Y1tpXSkgcmV0dXJuIHhjW2ldID4geWNbaV0gXiBpc25lZyA/IDEgOiAtMTtcclxuICB9XHJcblxyXG4gIC8vIENvbXBhcmUgbGVuZ3Rocy5cclxuICByZXR1cm4gayA9PSBsID8gMCA6IGsgPiBsIF4gaXNuZWcgPyAxIDogLTE7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgZGl2aWRlZCBieSB0aGUgdmFsdWUgb2YgQmlnIHksIHJvdW5kZWQsXHJcbiAqIGlmIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICovXHJcblAuZGl2ID0gZnVuY3Rpb24gKHkpIHtcclxuICB2YXIgeCA9IHRoaXMsXHJcbiAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgYSA9IHguYywgICAgICAgICAgICAgICAgICAvLyBkaXZpZGVuZFxyXG4gICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkuYywgICAvLyBkaXZpc29yXHJcbiAgICBrID0geC5zID09IHkucyA/IDEgOiAtMSxcclxuICAgIGRwID0gQmlnLkRQO1xyXG5cclxuICBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuICB9XHJcblxyXG4gIC8vIERpdmlzb3IgaXMgemVybz9cclxuICBpZiAoIWJbMF0pIHtcclxuICAgIHRocm93IEVycm9yKERJVl9CWV9aRVJPKTtcclxuICB9XHJcblxyXG4gIC8vIERpdmlkZW5kIGlzIDA/IFJldHVybiArLTAuXHJcbiAgaWYgKCFhWzBdKSB7XHJcbiAgICB5LnMgPSBrO1xyXG4gICAgeS5jID0gW3kuZSA9IDBdO1xyXG4gICAgcmV0dXJuIHk7XHJcbiAgfVxyXG5cclxuICB2YXIgYmwsIGJ0LCBuLCBjbXAsIHJpLFxyXG4gICAgYnogPSBiLnNsaWNlKCksXHJcbiAgICBhaSA9IGJsID0gYi5sZW5ndGgsXHJcbiAgICBhbCA9IGEubGVuZ3RoLFxyXG4gICAgciA9IGEuc2xpY2UoMCwgYmwpLCAgIC8vIHJlbWFpbmRlclxyXG4gICAgcmwgPSByLmxlbmd0aCxcclxuICAgIHEgPSB5LCAgICAgICAgICAgICAgICAvLyBxdW90aWVudFxyXG4gICAgcWMgPSBxLmMgPSBbXSxcclxuICAgIHFpID0gMCxcclxuICAgIHAgPSBkcCArIChxLmUgPSB4LmUgLSB5LmUpICsgMTsgICAgLy8gcHJlY2lzaW9uIG9mIHRoZSByZXN1bHRcclxuXHJcbiAgcS5zID0gaztcclxuICBrID0gcCA8IDAgPyAwIDogcDtcclxuXHJcbiAgLy8gQ3JlYXRlIHZlcnNpb24gb2YgZGl2aXNvciB3aXRoIGxlYWRpbmcgemVyby5cclxuICBiei51bnNoaWZ0KDApO1xyXG5cclxuICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gIGZvciAoOyBybCsrIDwgYmw7KSByLnB1c2goMCk7XHJcblxyXG4gIGRvIHtcclxuXHJcbiAgICAvLyBuIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgIGZvciAobiA9IDA7IG4gPCAxMDsgbisrKSB7XHJcblxyXG4gICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgaWYgKGJsICE9IChybCA9IHIubGVuZ3RoKSkge1xyXG4gICAgICAgIGNtcCA9IGJsID4gcmwgPyAxIDogLTE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChyaSA9IC0xLCBjbXAgPSAwOyArK3JpIDwgYmw7KSB7XHJcbiAgICAgICAgICBpZiAoYltyaV0gIT0gcltyaV0pIHtcclxuICAgICAgICAgICAgY21wID0gYltyaV0gPiByW3JpXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLCBzdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLlxyXG4gICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAvLyBSZW1haW5kZXIgY2FuJ3QgYmUgbW9yZSB0aGFuIDEgZGlnaXQgbG9uZ2VyIHRoYW4gZGl2aXNvci5cclxuICAgICAgICAvLyBFcXVhbGlzZSBsZW5ndGhzIHVzaW5nIGRpdmlzb3Igd2l0aCBleHRyYSBsZWFkaW5nIHplcm8/XHJcbiAgICAgICAgZm9yIChidCA9IHJsID09IGJsID8gYiA6IGJ6OyBybDspIHtcclxuICAgICAgICAgIGlmIChyWy0tcmxdIDwgYnRbcmxdKSB7XHJcbiAgICAgICAgICAgIHJpID0gcmw7XHJcbiAgICAgICAgICAgIGZvciAoOyByaSAmJiAhclstLXJpXTspIHJbcmldID0gOTtcclxuICAgICAgICAgICAgLS1yW3JpXTtcclxuICAgICAgICAgICAgcltybF0gKz0gMTA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByW3JsXSAtPSBidFtybF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKDsgIXJbMF07KSByLnNoaWZ0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdGhlIGRpZ2l0IG4gdG8gdGhlIHJlc3VsdCBhcnJheS5cclxuICAgIHFjW3FpKytdID0gY21wID8gbiA6ICsrbjtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgIGlmIChyWzBdICYmIGNtcCkgcltybF0gPSBhW2FpXSB8fCAwO1xyXG4gICAgZWxzZSByID0gW2FbYWldXTtcclxuXHJcbiAgfSB3aGlsZSAoKGFpKysgPCBhbCB8fCByWzBdICE9PSBVTkRFRklORUQpICYmIGstLSk7XHJcblxyXG4gIC8vIExlYWRpbmcgemVybz8gRG8gbm90IHJlbW92ZSBpZiByZXN1bHQgaXMgc2ltcGx5IHplcm8gKHFpID09IDEpLlxyXG4gIGlmICghcWNbMF0gJiYgcWkgIT0gMSkge1xyXG5cclxuICAgIC8vIFRoZXJlIGNhbid0IGJlIG1vcmUgdGhhbiBvbmUgemVyby5cclxuICAgIHFjLnNoaWZ0KCk7XHJcbiAgICBxLmUtLTtcclxuICAgIHAtLTtcclxuICB9XHJcblxyXG4gIC8vIFJvdW5kP1xyXG4gIGlmIChxaSA+IHApIHJvdW5kKHEsIHAsIEJpZy5STSwgclswXSAhPT0gVU5ERUZJTkVEKTtcclxuXHJcbiAgcmV0dXJuIHE7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICovXHJcblAuZXEgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHJldHVybiB0aGlzLmNtcCh5KSA9PT0gMDtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3RoZXJ3aXNlIHJldHVyblxyXG4gKiBmYWxzZS5cclxuICovXHJcblAuZ3QgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHJldHVybiB0aGlzLmNtcCh5KSA+IDA7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWUgb2YgQmlnIHksIG90aGVyd2lzZVxyXG4gKiByZXR1cm4gZmFsc2UuXHJcbiAqL1xyXG5QLmd0ZSA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgcmV0dXJuIHRoaXMuY21wKHkpID4gLTE7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAqL1xyXG5QLmx0ID0gZnVuY3Rpb24gKHkpIHtcclxuICByZXR1cm4gdGhpcy5jbXAoeSkgPCAwO1xyXG59O1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2VcclxuICogcmV0dXJuIGZhbHNlLlxyXG4gKi9cclxuUC5sdGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHJldHVybiB0aGlzLmNtcCh5KSA8IDE7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgbWludXMgdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gKi9cclxuUC5taW51cyA9IFAuc3ViID0gZnVuY3Rpb24gKHkpIHtcclxuICB2YXIgaSwgaiwgdCwgeGx0eSxcclxuICAgIHggPSB0aGlzLFxyXG4gICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgIGEgPSB4LnMsXHJcbiAgICBiID0gKHkgPSBuZXcgQmlnKHkpKS5zO1xyXG5cclxuICAvLyBTaWducyBkaWZmZXI/XHJcbiAgaWYgKGEgIT0gYikge1xyXG4gICAgeS5zID0gLWI7XHJcbiAgICByZXR1cm4geC5wbHVzKHkpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHhjID0geC5jLnNsaWNlKCksXHJcbiAgICB4ZSA9IHguZSxcclxuICAgIHljID0geS5jLFxyXG4gICAgeWUgPSB5LmU7XHJcblxyXG4gIC8vIEVpdGhlciB6ZXJvP1xyXG4gIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcbiAgICBpZiAoeWNbMF0pIHtcclxuICAgICAgeS5zID0gLWI7XHJcbiAgICB9IGVsc2UgaWYgKHhjWzBdKSB7XHJcbiAgICAgIHkgPSBuZXcgQmlnKHgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeS5zID0gMTtcclxuICAgIH1cclxuICAgIHJldHVybiB5O1xyXG4gIH1cclxuXHJcbiAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlzIHRoZSBiaWdnZXIgbnVtYmVyLiBQcmVwZW5kIHplcm9zIHRvIGVxdWFsaXNlIGV4cG9uZW50cy5cclxuICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICBpZiAoeGx0eSA9IGEgPCAwKSB7XHJcbiAgICAgIGEgPSAtYTtcclxuICAgICAgdCA9IHhjO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeWUgPSB4ZTtcclxuICAgICAgdCA9IHljO1xyXG4gICAgfVxyXG5cclxuICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgZm9yIChiID0gYTsgYi0tOykgdC5wdXNoKDApO1xyXG4gICAgdC5yZXZlcnNlKCk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgaiA9ICgoeGx0eSA9IHhjLmxlbmd0aCA8IHljLmxlbmd0aCkgPyB4YyA6IHljKS5sZW5ndGg7XHJcblxyXG4gICAgZm9yIChhID0gYiA9IDA7IGIgPCBqOyBiKyspIHtcclxuICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgeGx0eSA9IHhjW2JdIDwgeWNbYl07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgaWYgKHhsdHkpIHtcclxuICAgIHQgPSB4YztcclxuICAgIHhjID0geWM7XHJcbiAgICB5YyA9IHQ7XHJcbiAgICB5LnMgPSAteS5zO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci4gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlciBhcyBzdWJ0cmFjdGlvbiBvbmx5XHJcbiAgICogbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAqL1xyXG4gIGlmICgoYiA9IChqID0geWMubGVuZ3RoKSAtIChpID0geGMubGVuZ3RoKSkgPiAwKSBmb3IgKDsgYi0tOykgeGNbaSsrXSA9IDA7XHJcblxyXG4gIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgZm9yIChiID0gaTsgaiA+IGE7KSB7XHJcbiAgICBpZiAoeGNbLS1qXSA8IHljW2pdKSB7XHJcbiAgICAgIGZvciAoaSA9IGo7IGkgJiYgIXhjWy0taV07KSB4Y1tpXSA9IDk7XHJcbiAgICAgIC0teGNbaV07XHJcbiAgICAgIHhjW2pdICs9IDEwO1xyXG4gICAgfVxyXG5cclxuICAgIHhjW2pdIC09IHljW2pdO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gIGZvciAoOyB4Y1stLWJdID09PSAwOykgeGMucG9wKCk7XHJcblxyXG4gIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgZm9yICg7IHhjWzBdID09PSAwOykge1xyXG4gICAgeGMuc2hpZnQoKTtcclxuICAgIC0teWU7XHJcbiAgfVxyXG5cclxuICBpZiAoIXhjWzBdKSB7XHJcblxyXG4gICAgLy8gbiAtIG4gPSArMFxyXG4gICAgeS5zID0gMTtcclxuXHJcbiAgICAvLyBSZXN1bHQgbXVzdCBiZSB6ZXJvLlxyXG4gICAgeGMgPSBbeWUgPSAwXTtcclxuICB9XHJcblxyXG4gIHkuYyA9IHhjO1xyXG4gIHkuZSA9IHllO1xyXG5cclxuICByZXR1cm4geTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtb2R1bG8gdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gKi9cclxuUC5tb2QgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHZhciB5Z3R4LFxyXG4gICAgeCA9IHRoaXMsXHJcbiAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgYSA9IHgucyxcclxuICAgIGIgPSAoeSA9IG5ldyBCaWcoeSkpLnM7XHJcblxyXG4gIGlmICgheS5jWzBdKSB7XHJcbiAgICB0aHJvdyBFcnJvcihESVZfQllfWkVSTyk7XHJcbiAgfVxyXG5cclxuICB4LnMgPSB5LnMgPSAxO1xyXG4gIHlndHggPSB5LmNtcCh4KSA9PSAxO1xyXG4gIHgucyA9IGE7XHJcbiAgeS5zID0gYjtcclxuXHJcbiAgaWYgKHlndHgpIHJldHVybiBuZXcgQmlnKHgpO1xyXG5cclxuICBhID0gQmlnLkRQO1xyXG4gIGIgPSBCaWcuUk07XHJcbiAgQmlnLkRQID0gQmlnLlJNID0gMDtcclxuICB4ID0geC5kaXYoeSk7XHJcbiAgQmlnLkRQID0gYTtcclxuICBCaWcuUk0gPSBiO1xyXG5cclxuICByZXR1cm4gdGhpcy5taW51cyh4LnRpbWVzKHkpKTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBuZWdhdGVkLlxyXG4gKi9cclxuUC5uZWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHggPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKTtcclxuICB4LnMgPSAteC5zO1xyXG4gIHJldHVybiB4O1xyXG59O1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHBsdXMgdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gKi9cclxuUC5wbHVzID0gUC5hZGQgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHZhciBlLCBrLCB0LFxyXG4gICAgeCA9IHRoaXMsXHJcbiAgICBCaWcgPSB4LmNvbnN0cnVjdG9yO1xyXG5cclxuICB5ID0gbmV3IEJpZyh5KTtcclxuXHJcbiAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gIGlmICh4LnMgIT0geS5zKSB7XHJcbiAgICB5LnMgPSAteS5zO1xyXG4gICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgfVxyXG5cclxuICB2YXIgeGUgPSB4LmUsXHJcbiAgICB4YyA9IHguYyxcclxuICAgIHllID0geS5lLFxyXG4gICAgeWMgPSB5LmM7XHJcblxyXG4gIC8vIEVpdGhlciB6ZXJvP1xyXG4gIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcbiAgICBpZiAoIXljWzBdKSB7XHJcbiAgICAgIGlmICh4Y1swXSkge1xyXG4gICAgICAgIHkgPSBuZXcgQmlnKHgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHkucyA9IHgucztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHk7XHJcbiAgfVxyXG5cclxuICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gIC8vIE5vdGU6IHJldmVyc2UgZmFzdGVyIHRoYW4gdW5zaGlmdHMuXHJcbiAgaWYgKGUgPSB4ZSAtIHllKSB7XHJcbiAgICBpZiAoZSA+IDApIHtcclxuICAgICAgeWUgPSB4ZTtcclxuICAgICAgdCA9IHljO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZSA9IC1lO1xyXG4gICAgICB0ID0geGM7XHJcbiAgICB9XHJcblxyXG4gICAgdC5yZXZlcnNlKCk7XHJcbiAgICBmb3IgKDsgZS0tOykgdC5wdXNoKDApO1xyXG4gICAgdC5yZXZlcnNlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LlxyXG4gIGlmICh4Yy5sZW5ndGggLSB5Yy5sZW5ndGggPCAwKSB7XHJcbiAgICB0ID0geWM7XHJcbiAgICB5YyA9IHhjO1xyXG4gICAgeGMgPSB0O1xyXG4gIH1cclxuXHJcbiAgZSA9IHljLmxlbmd0aDtcclxuXHJcbiAgLy8gT25seSBzdGFydCBhZGRpbmcgYXQgeWMubGVuZ3RoIC0gMSBhcyB0aGUgZnVydGhlciBkaWdpdHMgb2YgeGMgY2FuIGJlIGxlZnQgYXMgdGhleSBhcmUuXHJcbiAgZm9yIChrID0gMDsgZTsgeGNbZV0gJT0gMTApIGsgPSAoeGNbLS1lXSA9IHhjW2VdICsgeWNbZV0gKyBrKSAvIDEwIHwgMDtcclxuXHJcbiAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG5cclxuICBpZiAoaykge1xyXG4gICAgeGMudW5zaGlmdChrKTtcclxuICAgICsreWU7XHJcbiAgfVxyXG5cclxuICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgZm9yIChlID0geGMubGVuZ3RoOyB4Y1stLWVdID09PSAwOykgeGMucG9wKCk7XHJcblxyXG4gIHkuYyA9IHhjO1xyXG4gIHkuZSA9IHllO1xyXG5cclxuICByZXR1cm4geTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJhaXNlZCB0byB0aGUgcG93ZXIgbi5cclxuICogSWYgbiBpcyBuZWdhdGl2ZSwgcm91bmQgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZ1xyXG4gKiBtb2RlIEJpZy5STS5cclxuICpcclxuICogbiB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1BPV0VSIHRvIE1BWF9QT1dFUiBpbmNsdXNpdmUuXHJcbiAqL1xyXG5QLnBvdyA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgdmFyIHggPSB0aGlzLFxyXG4gICAgb25lID0gbmV3IHguY29uc3RydWN0b3IoJzEnKSxcclxuICAgIHkgPSBvbmUsXHJcbiAgICBpc25lZyA9IG4gPCAwO1xyXG5cclxuICBpZiAobiAhPT0gfn5uIHx8IG4gPCAtTUFYX1BPV0VSIHx8IG4gPiBNQVhfUE9XRVIpIHtcclxuICAgIHRocm93IEVycm9yKElOVkFMSUQgKyAnZXhwb25lbnQnKTtcclxuICB9XHJcblxyXG4gIGlmIChpc25lZykgbiA9IC1uO1xyXG5cclxuICBmb3IgKDs7KSB7XHJcbiAgICBpZiAobiAmIDEpIHkgPSB5LnRpbWVzKHgpO1xyXG4gICAgbiA+Pj0gMTtcclxuICAgIGlmICghbikgYnJlYWs7XHJcbiAgICB4ID0geC50aW1lcyh4KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBpc25lZyA/IG9uZS5kaXYoeSkgOiB5O1xyXG59O1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gYSBtYXhpbXVtIHByZWNpc2lvbiBvZiBzZFxyXG4gKiBzaWduaWZpY2FudCBkaWdpdHMgdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgQmlnLlJNIGlmIHJtIGlzIG5vdCBzcGVjaWZpZWQuXHJcbiAqXHJcbiAqIHNkIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMSB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gKiBybT8ge251bWJlcn0gUm91bmRpbmcgbW9kZTogMCAoZG93biksIDEgKGhhbGYtdXApLCAyIChoYWxmLWV2ZW4pIG9yIDMgKHVwKS5cclxuICovXHJcblAucHJlYyA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICBpZiAoc2QgIT09IH5+c2QgfHwgc2QgPCAxIHx8IHNkID4gTUFYX0RQKSB7XHJcbiAgICB0aHJvdyBFcnJvcihJTlZBTElEICsgJ3ByZWNpc2lvbicpO1xyXG4gIH1cclxuICByZXR1cm4gcm91bmQobmV3IHRoaXMuY29uc3RydWN0b3IodGhpcyksIHNkLCBybSk7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcm91bmRlZCB0byBhIG1heGltdW0gb2YgZHAgZGVjaW1hbCBwbGFjZXNcclxuICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgQmlnLlJNIGlmIHJtIGlzIG5vdCBzcGVjaWZpZWQuXHJcbiAqIElmIGRwIGlzIG5lZ2F0aXZlLCByb3VuZCB0byBhbiBpbnRlZ2VyIHdoaWNoIGlzIGEgbXVsdGlwbGUgb2YgMTAqKi1kcC5cclxuICogSWYgZHAgaXMgbm90IHNwZWNpZmllZCwgcm91bmQgdG8gMCBkZWNpbWFsIHBsYWNlcy5cclxuICpcclxuICogZHA/IHtudW1iZXJ9IEludGVnZXIsIC1NQVhfRFAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICogcm0/IHtudW1iZXJ9IFJvdW5kaW5nIG1vZGU6IDAgKGRvd24pLCAxIChoYWxmLXVwKSwgMiAoaGFsZi1ldmVuKSBvciAzICh1cCkuXHJcbiAqL1xyXG5QLnJvdW5kID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gIGlmIChkcCA9PT0gVU5ERUZJTkVEKSBkcCA9IDA7XHJcbiAgZWxzZSBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAtTUFYX0RQIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuICB9XHJcbiAgcmV0dXJuIHJvdW5kKG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMpLCBkcCArIHRoaXMuZSArIDEsIHJtKTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcsIHJvdW5kZWQsIGlmXHJcbiAqIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICovXHJcblAuc3FydCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgciwgYywgdCxcclxuICAgIHggPSB0aGlzLFxyXG4gICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgIHMgPSB4LnMsXHJcbiAgICBlID0geC5lLFxyXG4gICAgaGFsZiA9IG5ldyBCaWcoJzAuNScpO1xyXG5cclxuICAvLyBaZXJvP1xyXG4gIGlmICgheC5jWzBdKSByZXR1cm4gbmV3IEJpZyh4KTtcclxuXHJcbiAgLy8gTmVnYXRpdmU/XHJcbiAgaWYgKHMgPCAwKSB7XHJcbiAgICB0aHJvdyBFcnJvcihOQU1FICsgJ05vIHNxdWFyZSByb290Jyk7XHJcbiAgfVxyXG5cclxuICAvLyBFc3RpbWF0ZS5cclxuICBzID0gTWF0aC5zcXJ0KHggKyAnJyk7XHJcblxyXG4gIC8vIE1hdGguc3FydCB1bmRlcmZsb3cvb3ZlcmZsb3c/XHJcbiAgLy8gUmUtZXN0aW1hdGU6IHBhc3MgeCBjb2VmZmljaWVudCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIHJlc3VsdCBleHBvbmVudC5cclxuICBpZiAocyA9PT0gMCB8fCBzID09PSAxIC8gMCkge1xyXG4gICAgYyA9IHguYy5qb2luKCcnKTtcclxuICAgIGlmICghKGMubGVuZ3RoICsgZSAmIDEpKSBjICs9ICcwJztcclxuICAgIHMgPSBNYXRoLnNxcnQoYyk7XHJcbiAgICBlID0gKChlICsgMSkgLyAyIHwgMCkgLSAoZSA8IDAgfHwgZSAmIDEpO1xyXG4gICAgciA9IG5ldyBCaWcoKHMgPT0gMSAvIDAgPyAnNWUnIDogKHMgPSBzLnRvRXhwb25lbnRpYWwoKSkuc2xpY2UoMCwgcy5pbmRleE9mKCdlJykgKyAxKSkgKyBlKTtcclxuICB9IGVsc2Uge1xyXG4gICAgciA9IG5ldyBCaWcocyArICcnKTtcclxuICB9XHJcblxyXG4gIGUgPSByLmUgKyAoQmlnLkRQICs9IDQpO1xyXG5cclxuICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgZG8ge1xyXG4gICAgdCA9IHI7XHJcbiAgICByID0gaGFsZi50aW1lcyh0LnBsdXMoeC5kaXYodCkpKTtcclxuICB9IHdoaWxlICh0LmMuc2xpY2UoMCwgZSkuam9pbignJykgIT09IHIuYy5zbGljZSgwLCBlKS5qb2luKCcnKSk7XHJcblxyXG4gIHJldHVybiByb3VuZChyLCAoQmlnLkRQIC09IDQpICsgci5lICsgMSwgQmlnLlJNKTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyB0aW1lcyB0aGUgdmFsdWUgb2YgQmlnIHkuXHJcbiAqL1xyXG5QLnRpbWVzID0gUC5tdWwgPSBmdW5jdGlvbiAoeSkge1xyXG4gIHZhciBjLFxyXG4gICAgeCA9IHRoaXMsXHJcbiAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgeGMgPSB4LmMsXHJcbiAgICB5YyA9ICh5ID0gbmV3IEJpZyh5KSkuYyxcclxuICAgIGEgPSB4Yy5sZW5ndGgsXHJcbiAgICBiID0geWMubGVuZ3RoLFxyXG4gICAgaSA9IHguZSxcclxuICAgIGogPSB5LmU7XHJcblxyXG4gIC8vIERldGVybWluZSBzaWduIG9mIHJlc3VsdC5cclxuICB5LnMgPSB4LnMgPT0geS5zID8gMSA6IC0xO1xyXG5cclxuICAvLyBSZXR1cm4gc2lnbmVkIDAgaWYgZWl0aGVyIDAuXHJcbiAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuICAgIHkuYyA9IFt5LmUgPSAwXTtcclxuICAgIHJldHVybiB5O1xyXG4gIH1cclxuXHJcbiAgLy8gSW5pdGlhbGlzZSBleHBvbmVudCBvZiByZXN1bHQgYXMgeC5lICsgeS5lLlxyXG4gIHkuZSA9IGkgKyBqO1xyXG5cclxuICAvLyBJZiBhcnJheSB4YyBoYXMgZmV3ZXIgZGlnaXRzIHRoYW4geWMsIHN3YXAgeGMgYW5kIHljLCBhbmQgbGVuZ3Rocy5cclxuICBpZiAoYSA8IGIpIHtcclxuICAgIGMgPSB4YztcclxuICAgIHhjID0geWM7XHJcbiAgICB5YyA9IGM7XHJcbiAgICBqID0gYTtcclxuICAgIGEgPSBiO1xyXG4gICAgYiA9IGo7XHJcbiAgfVxyXG5cclxuICAvLyBJbml0aWFsaXNlIGNvZWZmaWNpZW50IGFycmF5IG9mIHJlc3VsdCB3aXRoIHplcm9zLlxyXG4gIGZvciAoYyA9IG5ldyBBcnJheShqID0gYSArIGIpOyBqLS07KSBjW2pdID0gMDtcclxuXHJcbiAgLy8gTXVsdGlwbHkuXHJcblxyXG4gIC8vIGkgaXMgaW5pdGlhbGx5IHhjLmxlbmd0aC5cclxuICBmb3IgKGkgPSBiOyBpLS07KSB7XHJcbiAgICBiID0gMDtcclxuXHJcbiAgICAvLyBhIGlzIHljLmxlbmd0aC5cclxuICAgIGZvciAoaiA9IGEgKyBpOyBqID4gaTspIHtcclxuXHJcbiAgICAgIC8vIEN1cnJlbnQgc3VtIG9mIHByb2R1Y3RzIGF0IHRoaXMgZGlnaXQgcG9zaXRpb24sIHBsdXMgY2FycnkuXHJcbiAgICAgIGIgPSBjW2pdICsgeWNbaV0gKiB4Y1tqIC0gaSAtIDFdICsgYjtcclxuICAgICAgY1tqLS1dID0gYiAlIDEwO1xyXG5cclxuICAgICAgLy8gY2FycnlcclxuICAgICAgYiA9IGIgLyAxMCB8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgY1tqXSA9IGI7XHJcbiAgfVxyXG5cclxuICAvLyBJbmNyZW1lbnQgcmVzdWx0IGV4cG9uZW50IGlmIHRoZXJlIGlzIGEgZmluYWwgY2FycnksIG90aGVyd2lzZSByZW1vdmUgbGVhZGluZyB6ZXJvLlxyXG4gIGlmIChiKSArK3kuZTtcclxuICBlbHNlIGMuc2hpZnQoKTtcclxuXHJcbiAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gIGZvciAoaSA9IGMubGVuZ3RoOyAhY1stLWldOykgYy5wb3AoKTtcclxuICB5LmMgPSBjO1xyXG5cclxuICByZXR1cm4geTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpbiBleHBvbmVudGlhbCBub3RhdGlvbiByb3VuZGVkIHRvIGRwIGZpeGVkXHJcbiAqIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIEJpZy5STSBpZiBybSBpcyBub3Qgc3BlY2lmaWVkLlxyXG4gKlxyXG4gKiBkcD8ge251bWJlcn0gRGVjaW1hbCBwbGFjZXM6IGludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICogcm0/IHtudW1iZXJ9IFJvdW5kaW5nIG1vZGU6IDAgKGRvd24pLCAxIChoYWxmLXVwKSwgMiAoaGFsZi1ldmVuKSBvciAzICh1cCkuXHJcbiAqL1xyXG5QLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgdmFyIHggPSB0aGlzLFxyXG4gICAgbiA9IHguY1swXTtcclxuXHJcbiAgaWYgKGRwICE9PSBVTkRFRklORUQpIHtcclxuICAgIGlmIChkcCAhPT0gfn5kcCB8fCBkcCA8IDAgfHwgZHAgPiBNQVhfRFApIHtcclxuICAgICAgdGhyb3cgRXJyb3IoSU5WQUxJRF9EUCk7XHJcbiAgICB9XHJcbiAgICB4ID0gcm91bmQobmV3IHguY29uc3RydWN0b3IoeCksICsrZHAsIHJtKTtcclxuICAgIGZvciAoOyB4LmMubGVuZ3RoIDwgZHA7KSB4LmMucHVzaCgwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzdHJpbmdpZnkoeCwgdHJ1ZSwgISFuKTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpbiBub3JtYWwgbm90YXRpb24gcm91bmRlZCB0byBkcCBmaXhlZFxyXG4gKiBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBCaWcuUk0gaWYgcm0gaXMgbm90IHNwZWNpZmllZC5cclxuICpcclxuICogZHA/IHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzOiBpbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAqIHJtPyB7bnVtYmVyfSBSb3VuZGluZyBtb2RlOiAwIChkb3duKSwgMSAoaGFsZi11cCksIDIgKGhhbGYtZXZlbikgb3IgMyAodXApLlxyXG4gKlxyXG4gKiAoLTApLnRvRml4ZWQoMCkgaXMgJzAnLCBidXQgKC0wLjEpLnRvRml4ZWQoMCkgaXMgJy0wJy5cclxuICogKC0wKS50b0ZpeGVkKDEpIGlzICcwLjAnLCBidXQgKC0wLjAxKS50b0ZpeGVkKDEpIGlzICctMC4wJy5cclxuICovXHJcblAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICB2YXIgeCA9IHRoaXMsXHJcbiAgICBuID0geC5jWzBdO1xyXG5cclxuICBpZiAoZHAgIT09IFVOREVGSU5FRCkge1xyXG4gICAgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuICAgIH1cclxuICAgIHggPSByb3VuZChuZXcgeC5jb25zdHJ1Y3Rvcih4KSwgZHAgKyB4LmUgKyAxLCBybSk7XHJcblxyXG4gICAgLy8geC5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdGhlIHZhbHVlIGlzIHJvdW5kZWQgdXAuXHJcbiAgICBmb3IgKGRwID0gZHAgKyB4LmUgKyAxOyB4LmMubGVuZ3RoIDwgZHA7KSB4LmMucHVzaCgwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzdHJpbmdpZnkoeCwgZmFsc2UsICEhbik7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcuXHJcbiAqIFJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGlzIEJpZyBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBncmVhdGVyIHRoYW5cclxuICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAqIE9taXQgdGhlIHNpZ24gZm9yIG5lZ2F0aXZlIHplcm8uXHJcbiAqL1xyXG5QW1N5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJyldID0gUC50b0pTT04gPSBQLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB4ID0gdGhpcyxcclxuICAgIEJpZyA9IHguY29uc3RydWN0b3I7XHJcbiAgcmV0dXJuIHN0cmluZ2lmeSh4LCB4LmUgPD0gQmlnLk5FIHx8IHguZSA+PSBCaWcuUEUsICEheC5jWzBdKTtcclxufTtcclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGFzIGEgcHJpbWl0dmUgbnVtYmVyLlxyXG4gKi9cclxuUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgbiA9IE51bWJlcihzdHJpbmdpZnkodGhpcywgdHJ1ZSwgdHJ1ZSkpO1xyXG4gIGlmICh0aGlzLmNvbnN0cnVjdG9yLnN0cmljdCA9PT0gdHJ1ZSAmJiAhdGhpcy5lcShuLnRvU3RyaW5nKCkpKSB7XHJcbiAgICB0aHJvdyBFcnJvcihOQU1FICsgJ0ltcHJlY2lzZSBjb252ZXJzaW9uJyk7XHJcbiAgfVxyXG4gIHJldHVybiBuO1xyXG59O1xyXG5cclxuXHJcbi8qXHJcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nXHJcbiAqIHJvdW5kaW5nIG1vZGUgcm0sIG9yIEJpZy5STSBpZiBybSBpcyBub3Qgc3BlY2lmaWVkLlxyXG4gKiBVc2UgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgc2QgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzIG5lY2Vzc2FyeSB0byByZXByZXNlbnRcclxuICogdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gbm9ybWFsIG5vdGF0aW9uLlxyXG4gKlxyXG4gKiBzZCB7bnVtYmVyfSBTaWduaWZpY2FudCBkaWdpdHM6IGludGVnZXIsIDEgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICogcm0/IHtudW1iZXJ9IFJvdW5kaW5nIG1vZGU6IDAgKGRvd24pLCAxIChoYWxmLXVwKSwgMiAoaGFsZi1ldmVuKSBvciAzICh1cCkuXHJcbiAqL1xyXG5QLnRvUHJlY2lzaW9uID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gIHZhciB4ID0gdGhpcyxcclxuICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICBuID0geC5jWzBdO1xyXG5cclxuICBpZiAoc2QgIT09IFVOREVGSU5FRCkge1xyXG4gICAgaWYgKHNkICE9PSB+fnNkIHx8IHNkIDwgMSB8fCBzZCA+IE1BWF9EUCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihJTlZBTElEICsgJ3ByZWNpc2lvbicpO1xyXG4gICAgfVxyXG4gICAgeCA9IHJvdW5kKG5ldyBCaWcoeCksIHNkLCBybSk7XHJcbiAgICBmb3IgKDsgeC5jLmxlbmd0aCA8IHNkOykgeC5jLnB1c2goMCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gc3RyaW5naWZ5KHgsIHNkIDw9IHguZSB8fCB4LmUgPD0gQmlnLk5FIHx8IHguZSA+PSBCaWcuUEUsICEhbik7XHJcbn07XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcuXHJcbiAqIFJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGlzIEJpZyBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBncmVhdGVyIHRoYW5cclxuICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAqIEluY2x1ZGUgdGhlIHNpZ24gZm9yIG5lZ2F0aXZlIHplcm8uXHJcbiAqL1xyXG5QLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHggPSB0aGlzLFxyXG4gICAgQmlnID0geC5jb25zdHJ1Y3RvcjtcclxuICBpZiAoQmlnLnN0cmljdCA9PT0gdHJ1ZSkge1xyXG4gICAgdGhyb3cgRXJyb3IoTkFNRSArICd2YWx1ZU9mIGRpc2FsbG93ZWQnKTtcclxuICB9XHJcbiAgcmV0dXJuIHN0cmluZ2lmeSh4LCB4LmUgPD0gQmlnLk5FIHx8IHguZSA+PSBCaWcuUEUsIHRydWUpO1xyXG59O1xyXG5cclxuXHJcbi8vIEV4cG9ydFxyXG5cclxuXHJcbmV4cG9ydCB2YXIgQmlnID0gX0JpZ18oKTtcclxuXHJcbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0RlZmluaXRlbHlUeXBlZC9EZWZpbml0ZWx5VHlwZWQvbWFzdGVyL3R5cGVzL2JpZy5qcy9pbmRleC5kLnRzXCIgLz5cclxuZXhwb3J0IGRlZmF1bHQgQmlnO1xyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTs7QUFHRTs7QUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBLElBQUlBLEVBQUUsR0FBRyxFQUFFO0VBQVc7O0VBRXBCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsRUFBRSxHQUFHLENBQUM7RUFBYzs7RUFFcEI7RUFDQUMsTUFBTSxHQUFHLEdBQUc7RUFBUTs7RUFFcEI7RUFDQUMsU0FBUyxHQUFHLEdBQUc7RUFBSzs7RUFFcEI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQWE7O0VBRXBCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsRUFBRSxHQUFHLEVBQUU7RUFBYTs7RUFFcEI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxNQUFNLEdBQUcsS0FBSztFQUFNOztFQUd0Qjs7RUFHRTtFQUNBQyxJQUFJLEdBQUcsV0FBVztFQUNsQkMsT0FBTyxHQUFHRCxJQUFJLEdBQUcsVUFBVTtFQUMzQkUsVUFBVSxHQUFHRCxPQUFPLEdBQUcsZ0JBQWdCO0VBQ3ZDRSxVQUFVLEdBQUdGLE9BQU8sR0FBRyxlQUFlO0VBQ3RDRyxXQUFXLEdBQUdKLElBQUksR0FBRyxrQkFBa0I7RUFFdkM7RUFDQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNOQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0VBQ2xCQyxPQUFPLEdBQUcsc0NBQXNDOztBQUdsRDtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxLQUFLQSxDQUFBLEVB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