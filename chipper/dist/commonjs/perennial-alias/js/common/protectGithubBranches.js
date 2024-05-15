"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
// Copyright 2021, University of Colorado Boulder

/**
 * Sets branch protection rules for the provided list of repositories. The default branch protection rules prevent
 * deletion of the branch. There are other things you can do with branch protection rules but we decided not to
 * apply them at this time. See https://github.com/phetsims/special-ops/issues/197 for more information.
 *
 * See https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput for documentation
 * of what you can do with protection rules.
 *
 * If rules for the protected patterns already exist they will be deleted and replaced so they can be easily updated.
 *
 * USAGE:
 * protectGithubBranches.protectBranches( [ "my-first-repo", "my-second-repo" ] );
 *
 * of
 *
 * protectGithubBranches.clearBranchProtections( [ "my-first-repo", "my-second-repo" ] );
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

var https = require('https');
var buildLocal = require('./buildLocal');

// protects main, and all branche used in production deploys
var BRANCH_NAME_PATTERNS = ['main', '*[0-9].[0-9]*'];

// Options for the https request to the github graphql server
var options = {
  hostname: 'api.github.com',
  path: '/graphql',
  method: 'POST',
  headers: {
    Authorization: "Bearer ".concat(buildLocal.developerGithubAccessToken),
    'Content-Type': 'application/json',
    'user-agent': 'node.js'
  }
};

/**
 * Creates the GraphQL query string to get the existing branch protection rules for the provided repo name under
 * the phetsims project.
 *
 * @param {string} repositoryName
 * @returns {string}
 */
var createBranchProtectionRuleQueryData = function createBranchProtectionRuleQueryData(repositoryName) {
  return createQueryData("query BranchProtectionRule {\n    repository(owner: \"phetsims\", name: \"".concat(repositoryName, "\") { \n      branchProtectionRules(first: 100) { \n        nodes {\n          # pattern for the rule \n          pattern,\n          \n          # uniqueID for the rule assigned by github, required to request deletion\n          id\n        }\n      }\n    } }"));
};

/**
 * Gets the GraphQL query string that will delete an existing branch protection rule. Use
 * createBranchProtectionRuleQueryData to get the unique IDs for each rule.
 *
 * @param ruleId
 * @returns {string}
 */
var createDeleteBranchProtectionRuleMutationData = function createDeleteBranchProtectionRuleMutationData(ruleId) {
  return createQueryData("mutation {\n    deleteBranchProtectionRule(input:{branchProtectionRuleId: \"".concat(ruleId, "\"} ) {\n      clientMutationId\n    }\n  }"));
};

/**
 * Creates the data string that requests the creation of a new github branch protection rule using a GraphQL query and
 * sent with an HTTPS request. The default rule prevents branch deletion. There are other things that can be
 * constrained or protected for the branch, but we decided not to apply anything else at this time.
 * See https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput for list
 * of things you can do with rules.
 *
 * @param {string} repositoryId - Unique ID for the repo, see createRepositoryIdQueryData()
 * @param {string} namePattern - pattern for the rule, all branches matching with fnmatch will be protected
 * @returns {string}
 */
var createRepositoryRuleMutationData = function createRepositoryRuleMutationData(repositoryId, namePattern) {
  return createQueryData("mutation {\n    createBranchProtectionRule(input: {\n      pattern: \"".concat(namePattern, "\",\n      allowsDeletions: false,\n  \n      repositoryId: \"").concat(repositoryId, "\"\n    } )\n    \n    # I think this specifies the data returned after the server receives the mutation request, not used but required\n    # to send the mutation\n    {\n      branchProtectionRule {\n        pattern\n      }\n    }\n    }"));
};

/**
 * Creates the data string that requests the unique ID of a github repository using a GraphQL query sent with an
 * HTTPS request.
 *
 * @param {string} repositoryName - Name of the phetsims repository
 * @returns {string}
 */
var createRepositoryIdQueryData = function createRepositoryIdQueryData(repositoryName) {
  return createQueryData("query { repository(owner: \"phetsims\", name: \"".concat(repositoryName, "\") { id } }"));
};

/**
 * Wraps a query string with additional formatting so that it can be used in a GraphQL query sent with https.
 *
 * @param {string} queryString
 * @returns {string}
 */
var createQueryData = function createQueryData(queryString) {
  return JSON.stringify({
    query: queryString
  });
};

/**
 * Gets an error message from a JSON response. Just grabs the first error message if there are multiple.
 * @param jsonResponse - JSON response object from github. Errors are in a .errors array.
 * @returns {*|string}
 */
var getErrorMessage = function getErrorMessage(jsonResponse) {
  if (jsonResponse.errors) {
    return jsonResponse.errors[0].message;
  } else {
    return 'No data returned';
  }
};

/**
 * Returns the unique ID of the provided phetsims repository.
 * @param {string} repositoryName
 * @returns {Promise<string>}
 */
function getRepositoryId(_x) {
  return _getRepositoryId.apply(this, arguments);
}
/**
 * Returns an array of objects, one for each existing branch protection rule for the repository, that has
 * the protection rule pattern and the unique ID for the rule assigned by github.
 *
 * @param {string} repositoryName
 * @returns {Promise<*[]>} - array of nodes with key value pairs of { "pattern": string, "id": string }
 */
function _getRepositoryId() {
  _getRepositoryId = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(repositoryName) {
    var handleJSONResponse;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          handleJSONResponse = function handleJSONResponse(jsonResponse) {
            if (!jsonResponse.data || jsonResponse.data.repository === null) {
              throw new Error("".concat(getErrorMessage(jsonResponse), " Make sure developerGithubAccessToken in build-local.json may be incorrect or expired."));
            }
            return jsonResponse.data.repository.id;
          };
          return _context.abrupt("return", sendPromisedHttpsRequest(createRepositoryIdQueryData(repositoryName), handleJSONResponse));
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _getRepositoryId.apply(this, arguments);
}
function getExistingBranchProtectionRules(_x2) {
  return _getExistingBranchProtectionRules.apply(this, arguments);
}
/**
 * Creates the protection rule for all branches matching the namePattern for the phetsims repository with the provided
 * unique ID assigned by github.
 *
 * @param {string} repositoryId - unique ID for the repository, use getRepositoryId to get this
 * @param {string} namePattern - The pattern for the rule using fnmatch
 * @returns {Promise<Object>}
 */
function _getExistingBranchProtectionRules() {
  _getExistingBranchProtectionRules = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(repositoryName) {
    var handleJSONResponse;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          handleJSONResponse = function handleJSONResponse(jsonResponse) {
            if (jsonResponse.errors) {
              throw new Error(getErrorMessage(jsonResponse));
            }
            if (!jsonResponse.data) {
              throw new Error("No data returned by getExistingBranchProtectionRules for repo ".concat(repositoryName));
            }
            return jsonResponse.data.repository.branchProtectionRules.nodes;
          };
          return _context2.abrupt("return", sendPromisedHttpsRequest(createBranchProtectionRuleQueryData(repositoryName), handleJSONResponse));
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _getExistingBranchProtectionRules.apply(this, arguments);
}
function writeProtectionRule(_x3, _x4) {
  return _writeProtectionRule.apply(this, arguments);
}
/**
 * Deletes an existing rule. We assume that that by running this we want to overwrite the existing rule.
 *
 * @param {string} ruleId
 * @param {string} namePattern
 * @param {string} repositoryName
 * @returns {Promise<Object>}
 */
function _writeProtectionRule() {
  _writeProtectionRule = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(repositoryId, namePattern) {
    var handleJSONResponse;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          handleJSONResponse = function handleJSONResponse(jsonResponse) {
            if (jsonResponse.errors) {
              throw new Error(getErrorMessage(jsonResponse));
            }
          };
          return _context3.abrupt("return", sendPromisedHttpsRequest(createRepositoryRuleMutationData(repositoryId, namePattern), handleJSONResponse));
        case 2:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _writeProtectionRule.apply(this, arguments);
}
function deleteExistingProtectionRule(_x5, _x6, _x7) {
  return _deleteExistingProtectionRule.apply(this, arguments);
}
/**
 * An async function that will delete all existing rules that match the provided namePattern for the repository.
 * Wrapped in a Promise so we can wait to write new rules until the existing rules are removed. If you try to
 * write over an existing rule without removing it github will respond with an error.
 *
 * @param {*[]} rules
 * @param {string} namePattern
 * @param {string} repositoryName
 * @returns {Promise<unknown[]>}
 */
function _deleteExistingProtectionRule() {
  _deleteExistingProtectionRule = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(ruleId, namePattern, repositoryName) {
    var handleJSONResponse;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          handleJSONResponse = function handleJSONResponse(jsonResponse) {
            if (jsonResponse.errors) {
              throw new Error(getErrorMessage(jsonResponse));
            } else {
              console.log("Deleted existing branch protection rule ".concat(namePattern, " for repo ").concat(repositoryName));
            }
          };
          return _context4.abrupt("return", sendPromisedHttpsRequest(createDeleteBranchProtectionRuleMutationData(ruleId), handleJSONResponse));
        case 2:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _deleteExistingProtectionRule.apply(this, arguments);
}
function deleteMatchingProtectionRules(_x8, _x9, _x10) {
  return _deleteMatchingProtectionRules.apply(this, arguments);
}
/**
 * Sends a request to github's GraphQL server to query or mutate repository data.
 *
 * @param {string} queryData - the string sent with https
 * @param {function(Object)} handle - handles the JSON response from github
 * @returns {Promise<unknown>}
 */
function _deleteMatchingProtectionRules() {
  _deleteMatchingProtectionRules = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(rules, namePattern, repositoryName) {
    var promises;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          promises = [];
          rules.forEach(function (rule) {
            // only delete rules that match the new pattern we want to protect
            if (rule.pattern === namePattern) {
              promises.push(deleteExistingProtectionRule(rule.id, namePattern, repositoryName));
            }
          });
          return _context5.abrupt("return", Promise.all(promises));
        case 3:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return _deleteMatchingProtectionRules.apply(this, arguments);
}
function sendPromisedHttpsRequest(_x11, _x12) {
  return _sendPromisedHttpsRequest.apply(this, arguments);
}
/**
 * Clear protections for the branches that PhET wants to protect.
 */
function _sendPromisedHttpsRequest() {
  _sendPromisedHttpsRequest = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(queryData, handle) {
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          return _context6.abrupt("return", new Promise(function (resolve, reject) {
            var request = https.request(options, function (response) {
              var responseBody = '';
              response.on('data', function (d) {
                responseBody += d;
              });
              response.on('end', function () {
                var jsonResponse = JSON.parse(responseBody);
                try {
                  var resolveValue = handle(jsonResponse);
                  resolve(resolveValue);
                } catch (error) {
                  reject(error);
                }
              });
            });
            request.on('error', function (error) {
              console.error(error);
            });
            request.write(queryData);
            request.end();
          }));
        case 1:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return _sendPromisedHttpsRequest.apply(this, arguments);
}
function clearBranchProtections(_x13) {
  return _clearBranchProtections.apply(this, arguments);
}
/**
 * Apply branch protection rules to prodcution branches (main, release branches).
 */
function _clearBranchProtections() {
  _clearBranchProtections = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(repositories) {
    var _iterator, _step, repositoryName, _iterator2, _step2, namePattern, branchProtectionRules;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _iterator = _createForOfIteratorHelper(repositories);
          _context7.prev = 1;
          _iterator.s();
        case 3:
          if ((_step = _iterator.n()).done) {
            _context7.next = 33;
            break;
          }
          repositoryName = _step.value;
          _iterator2 = _createForOfIteratorHelper(BRANCH_NAME_PATTERNS);
          _context7.prev = 6;
          _iterator2.s();
        case 8:
          if ((_step2 = _iterator2.n()).done) {
            _context7.next = 23;
            break;
          }
          namePattern = _step2.value;
          _context7.prev = 10;
          _context7.next = 13;
          return getExistingBranchProtectionRules(repositoryName);
        case 13:
          branchProtectionRules = _context7.sent;
          _context7.next = 16;
          return deleteMatchingProtectionRules(branchProtectionRules, namePattern, repositoryName);
        case 16:
          _context7.next = 21;
          break;
        case 18:
          _context7.prev = 18;
          _context7.t0 = _context7["catch"](10);
          console.log("Error clearing github protection rule ".concat(namePattern, " for ").concat(repositoryName));
        case 21:
          _context7.next = 8;
          break;
        case 23:
          _context7.next = 28;
          break;
        case 25:
          _context7.prev = 25;
          _context7.t1 = _context7["catch"](6);
          _iterator2.e(_context7.t1);
        case 28:
          _context7.prev = 28;
          _iterator2.f();
          return _context7.finish(28);
        case 31:
          _context7.next = 3;
          break;
        case 33:
          _context7.next = 38;
          break;
        case 35:
          _context7.prev = 35;
          _context7.t2 = _context7["catch"](1);
          _iterator.e(_context7.t2);
        case 38:
          _context7.prev = 38;
          _iterator.f();
          return _context7.finish(38);
        case 41:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[1, 35, 38, 41], [6, 25, 28, 31], [10, 18]]);
  }));
  return _clearBranchProtections.apply(this, arguments);
}
function protectBranches(_x14) {
  return _protectBranches.apply(this, arguments);
}
function _protectBranches() {
  _protectBranches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(repositories) {
    var cleanedRepositories, _iterator3, _step3, repositoryName, repositoryId, _iterator4, _step4, namePattern;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          // remove any trailing '/' from the repository names, which may have been added by auto complete
          cleanedRepositories = repositories.map(function (repository) {
            return repository.replace(/\/$/, '');
          }); // if the rule for the protected branch already exists, delete it - we assume that running this again means we
          // want to update rules for each namePattern
          _context8.next = 3;
          return clearBranchProtections(cleanedRepositories);
        case 3:
          _iterator3 = _createForOfIteratorHelper(cleanedRepositories);
          _context8.prev = 4;
          _iterator3.s();
        case 6:
          if ((_step3 = _iterator3.n()).done) {
            _context8.next = 39;
            break;
          }
          repositoryName = _step3.value;
          _context8.next = 10;
          return getRepositoryId(repositoryName);
        case 10:
          repositoryId = _context8.sent;
          _iterator4 = _createForOfIteratorHelper(BRANCH_NAME_PATTERNS);
          _context8.prev = 12;
          _iterator4.s();
        case 14:
          if ((_step4 = _iterator4.n()).done) {
            _context8.next = 29;
            break;
          }
          namePattern = _step4.value;
          _context8.prev = 16;
          _context8.next = 19;
          return writeProtectionRule(repositoryId, namePattern);
        case 19:
          console.log("".concat(namePattern, " protection rule set for ").concat(repositoryName));
          _context8.next = 27;
          break;
        case 22:
          _context8.prev = 22;
          _context8.t0 = _context8["catch"](16);
          console.log("Error writing ".concat(namePattern, " rule for repo ").concat(repositoryName, ":"));
          console.log(_context8.t0);
          console.log('\n');
        case 27:
          _context8.next = 14;
          break;
        case 29:
          _context8.next = 34;
          break;
        case 31:
          _context8.prev = 31;
          _context8.t1 = _context8["catch"](12);
          _iterator4.e(_context8.t1);
        case 34:
          _context8.prev = 34;
          _iterator4.f();
          return _context8.finish(34);
        case 37:
          _context8.next = 6;
          break;
        case 39:
          _context8.next = 44;
          break;
        case 41:
          _context8.prev = 41;
          _context8.t2 = _context8["catch"](4);
          _iterator3.e(_context8.t2);
        case 44:
          _context8.prev = 44;
          _iterator3.f();
          return _context8.finish(44);
        case 47:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[4, 41, 44, 47], [12, 31, 34, 37], [16, 22]]);
  }));
  return _protectBranches.apply(this, arguments);
}
module.exports = {
  protectBranches: protectBranches,
  clearBranchProtections: clearBranchProtections
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsImh0dHBzIiwicmVxdWlyZSIsImJ1aWxkTG9jYWwiLCJCUkFOQ0hfTkFNRV9QQVRURVJOUyIsIm9wdGlvbnMiLCJob3N0bmFtZSIsInBhdGgiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImNvbmNhdCIsImRldmVsb3BlckdpdGh1YkFjY2Vzc1Rva2VuIiwiY3JlYXRlQnJhbmNoUHJvdGVjdGlvblJ1bGVRdWVyeURhdGEiLCJyZXBvc2l0b3J5TmFtZSIsImNyZWF0ZVF1ZXJ5RGF0YSIsImNyZWF0ZURlbGV0ZUJyYW5jaFByb3RlY3Rpb25SdWxlTXV0YXRpb25EYXRhIiwicnVsZUlkIiwiY3JlYXRlUmVwb3NpdG9yeVJ1bGVNdXRhdGlvbkRhdGEiLCJyZXBvc2l0b3J5SWQiLCJuYW1lUGF0dGVybiIsImNyZWF0ZVJlcG9zaXRvcnlJZFF1ZXJ5RGF0YSIsInF1ZXJ5U3RyaW5nIiwiSlNPTiIsInN0cmluZ2lmeSIsInF1ZXJ5IiwiZ2V0RXJyb3JNZXNzYWdlIiwianNvblJlc3BvbnNlIiwiZXJyb3JzIiwibWVzc2FnZSIsImdldFJlcG9zaXRvcnlJZCIsIl94IiwiX2dldFJlcG9zaXRvcnlJZCIsIl9jYWxsZWUiLCJoYW5kbGVKU09OUmVzcG9uc2UiLCJfY2FsbGVlJCIsIl9jb250ZXh0IiwiZGF0YSIsInJlcG9zaXRvcnkiLCJpZCIsInNlbmRQcm9taXNlZEh0dHBzUmVxdWVzdCIsImdldEV4aXN0aW5nQnJhbmNoUHJvdGVjdGlvblJ1bGVzIiwiX3gyIiwiX2dldEV4aXN0aW5nQnJhbmNoUHJvdGVjdGlvblJ1bGVzIiwiX2NhbGxlZTIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJicmFuY2hQcm90ZWN0aW9uUnVsZXMiLCJub2RlcyIsIndyaXRlUHJvdGVjdGlvblJ1bGUiLCJfeDMiLCJfeDQiLCJfd3JpdGVQcm90ZWN0aW9uUnVsZSIsIl9jYWxsZWUzIiwiX2NhbGxlZTMkIiwiX2NvbnRleHQzIiwiZGVsZXRlRXhpc3RpbmdQcm90ZWN0aW9uUnVsZSIsIl94NSIsIl94NiIsIl94NyIsIl9kZWxldGVFeGlzdGluZ1Byb3RlY3Rpb25SdWxlIiwiX2NhbGxlZTQiLCJfY2FsbGVlNCQiLCJfY29udGV4dDQiLCJjb25zb2xlIiwibG9nIiwiZGVsZXRlTWF0Y2hpbmdQcm90ZWN0aW9uUnVsZXMiLCJfeDgiLCJfeDkiLCJfeDEwIiwiX2RlbGV0ZU1hdGNoaW5nUHJvdGVjdGlvblJ1bGVzIiwiX2NhbGxlZTUiLCJydWxlcyIsInByb21pc2VzIiwiX2NhbGxlZTUkIiwiX2NvbnRleHQ1IiwicnVsZSIsInBhdHRlcm4iLCJhbGwiLCJfeDExIiwiX3gxMiIsIl9zZW5kUHJvbWlzZWRIdHRwc1JlcXVlc3QiLCJfY2FsbGVlNiIsInF1ZXJ5RGF0YSIsIl9jYWxsZWU2JCIsIl9jb250ZXh0NiIsInJlcXVlc3QiLCJyZXNwb25zZSIsInJlc3BvbnNlQm9keSIsIm9uIiwicGFyc2UiLCJyZXNvbHZlVmFsdWUiLCJ3cml0ZSIsImVuZCIsImNsZWFyQnJhbmNoUHJvdGVjdGlvbnMiLCJfeDEzIiwiX2NsZWFyQnJhbmNoUHJvdGVjdGlvbnMiLCJfY2FsbGVlNyIsInJlcG9zaXRvcmllcyIsIl9pdGVyYXRvciIsIl9zdGVwIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsIl9jYWxsZWU3JCIsIl9jb250ZXh0NyIsIl9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyIiwidDAiLCJ0MSIsInQyIiwicHJvdGVjdEJyYW5jaGVzIiwiX3gxNCIsIl9wcm90ZWN0QnJhbmNoZXMiLCJfY2FsbGVlOCIsImNsZWFuZWRSZXBvc2l0b3JpZXMiLCJfaXRlcmF0b3IzIiwiX3N0ZXAzIiwiX2l0ZXJhdG9yNCIsIl9zdGVwNCIsIl9jYWxsZWU4JCIsIl9jb250ZXh0OCIsIm1hcCIsInJlcGxhY2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsicHJvdGVjdEdpdGh1YkJyYW5jaGVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGJyYW5jaCBwcm90ZWN0aW9uIHJ1bGVzIGZvciB0aGUgcHJvdmlkZWQgbGlzdCBvZiByZXBvc2l0b3JpZXMuIFRoZSBkZWZhdWx0IGJyYW5jaCBwcm90ZWN0aW9uIHJ1bGVzIHByZXZlbnRcclxuICogZGVsZXRpb24gb2YgdGhlIGJyYW5jaC4gVGhlcmUgYXJlIG90aGVyIHRoaW5ncyB5b3UgY2FuIGRvIHdpdGggYnJhbmNoIHByb3RlY3Rpb24gcnVsZXMgYnV0IHdlIGRlY2lkZWQgbm90IHRvXHJcbiAqIGFwcGx5IHRoZW0gYXQgdGhpcyB0aW1lLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NwZWNpYWwtb3BzL2lzc3Vlcy8xOTcgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAqXHJcbiAqIFNlZSBodHRwczovL2RvY3MuZ2l0aHViLmNvbS9lbi9ncmFwaHFsL3JlZmVyZW5jZS9pbnB1dC1vYmplY3RzI2NyZWF0ZWJyYW5jaHByb3RlY3Rpb25ydWxlaW5wdXQgZm9yIGRvY3VtZW50YXRpb25cclxuICogb2Ygd2hhdCB5b3UgY2FuIGRvIHdpdGggcHJvdGVjdGlvbiBydWxlcy5cclxuICpcclxuICogSWYgcnVsZXMgZm9yIHRoZSBwcm90ZWN0ZWQgcGF0dGVybnMgYWxyZWFkeSBleGlzdCB0aGV5IHdpbGwgYmUgZGVsZXRlZCBhbmQgcmVwbGFjZWQgc28gdGhleSBjYW4gYmUgZWFzaWx5IHVwZGF0ZWQuXHJcbiAqXHJcbiAqIFVTQUdFOlxyXG4gKiBwcm90ZWN0R2l0aHViQnJhbmNoZXMucHJvdGVjdEJyYW5jaGVzKCBbIFwibXktZmlyc3QtcmVwb1wiLCBcIm15LXNlY29uZC1yZXBvXCIgXSApO1xyXG4gKlxyXG4gKiBvZlxyXG4gKlxyXG4gKiBwcm90ZWN0R2l0aHViQnJhbmNoZXMuY2xlYXJCcmFuY2hQcm90ZWN0aW9ucyggWyBcIm15LWZpcnN0LXJlcG9cIiwgXCJteS1zZWNvbmQtcmVwb1wiIF0gKTtcclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgaHR0cHMgPSByZXF1aXJlKCAnaHR0cHMnICk7XHJcbmNvbnN0IGJ1aWxkTG9jYWwgPSByZXF1aXJlKCAnLi9idWlsZExvY2FsJyApO1xyXG5cclxuLy8gcHJvdGVjdHMgbWFpbiwgYW5kIGFsbCBicmFuY2hlIHVzZWQgaW4gcHJvZHVjdGlvbiBkZXBsb3lzXHJcbmNvbnN0IEJSQU5DSF9OQU1FX1BBVFRFUk5TID0gWyAnbWFpbicsICcqWzAtOV0uWzAtOV0qJyBdO1xyXG5cclxuLy8gT3B0aW9ucyBmb3IgdGhlIGh0dHBzIHJlcXVlc3QgdG8gdGhlIGdpdGh1YiBncmFwaHFsIHNlcnZlclxyXG5jb25zdCBvcHRpb25zID0ge1xyXG4gIGhvc3RuYW1lOiAnYXBpLmdpdGh1Yi5jb20nLFxyXG4gIHBhdGg6ICcvZ3JhcGhxbCcsXHJcbiAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgaGVhZGVyczoge1xyXG4gICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2J1aWxkTG9jYWwuZGV2ZWxvcGVyR2l0aHViQWNjZXNzVG9rZW59YCxcclxuICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAndXNlci1hZ2VudCc6ICdub2RlLmpzJ1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBHcmFwaFFMIHF1ZXJ5IHN0cmluZyB0byBnZXQgdGhlIGV4aXN0aW5nIGJyYW5jaCBwcm90ZWN0aW9uIHJ1bGVzIGZvciB0aGUgcHJvdmlkZWQgcmVwbyBuYW1lIHVuZGVyXHJcbiAqIHRoZSBwaGV0c2ltcyBwcm9qZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb3NpdG9yeU5hbWVcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcbmNvbnN0IGNyZWF0ZUJyYW5jaFByb3RlY3Rpb25SdWxlUXVlcnlEYXRhID0gcmVwb3NpdG9yeU5hbWUgPT4ge1xyXG4gIHJldHVybiBjcmVhdGVRdWVyeURhdGEoIGBxdWVyeSBCcmFuY2hQcm90ZWN0aW9uUnVsZSB7XHJcbiAgICByZXBvc2l0b3J5KG93bmVyOiBcInBoZXRzaW1zXCIsIG5hbWU6IFwiJHtyZXBvc2l0b3J5TmFtZX1cIikgeyBcclxuICAgICAgYnJhbmNoUHJvdGVjdGlvblJ1bGVzKGZpcnN0OiAxMDApIHsgXHJcbiAgICAgICAgbm9kZXMge1xyXG4gICAgICAgICAgIyBwYXR0ZXJuIGZvciB0aGUgcnVsZSBcclxuICAgICAgICAgIHBhdHRlcm4sXHJcbiAgICAgICAgICBcclxuICAgICAgICAgICMgdW5pcXVlSUQgZm9yIHRoZSBydWxlIGFzc2lnbmVkIGJ5IGdpdGh1YiwgcmVxdWlyZWQgdG8gcmVxdWVzdCBkZWxldGlvblxyXG4gICAgICAgICAgaWRcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gfWBcclxuICApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIEdyYXBoUUwgcXVlcnkgc3RyaW5nIHRoYXQgd2lsbCBkZWxldGUgYW4gZXhpc3RpbmcgYnJhbmNoIHByb3RlY3Rpb24gcnVsZS4gVXNlXHJcbiAqIGNyZWF0ZUJyYW5jaFByb3RlY3Rpb25SdWxlUXVlcnlEYXRhIHRvIGdldCB0aGUgdW5pcXVlIElEcyBmb3IgZWFjaCBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0gcnVsZUlkXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBjcmVhdGVEZWxldGVCcmFuY2hQcm90ZWN0aW9uUnVsZU11dGF0aW9uRGF0YSA9IHJ1bGVJZCA9PiB7XHJcbiAgcmV0dXJuIGNyZWF0ZVF1ZXJ5RGF0YSggYG11dGF0aW9uIHtcclxuICAgIGRlbGV0ZUJyYW5jaFByb3RlY3Rpb25SdWxlKGlucHV0OnticmFuY2hQcm90ZWN0aW9uUnVsZUlkOiBcIiR7cnVsZUlkfVwifSApIHtcclxuICAgICAgY2xpZW50TXV0YXRpb25JZFxyXG4gICAgfVxyXG4gIH1gICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgZGF0YSBzdHJpbmcgdGhhdCByZXF1ZXN0cyB0aGUgY3JlYXRpb24gb2YgYSBuZXcgZ2l0aHViIGJyYW5jaCBwcm90ZWN0aW9uIHJ1bGUgdXNpbmcgYSBHcmFwaFFMIHF1ZXJ5IGFuZFxyXG4gKiBzZW50IHdpdGggYW4gSFRUUFMgcmVxdWVzdC4gVGhlIGRlZmF1bHQgcnVsZSBwcmV2ZW50cyBicmFuY2ggZGVsZXRpb24uIFRoZXJlIGFyZSBvdGhlciB0aGluZ3MgdGhhdCBjYW4gYmVcclxuICogY29uc3RyYWluZWQgb3IgcHJvdGVjdGVkIGZvciB0aGUgYnJhbmNoLCBidXQgd2UgZGVjaWRlZCBub3QgdG8gYXBwbHkgYW55dGhpbmcgZWxzZSBhdCB0aGlzIHRpbWUuXHJcbiAqIFNlZSBodHRwczovL2RvY3MuZ2l0aHViLmNvbS9lbi9ncmFwaHFsL3JlZmVyZW5jZS9pbnB1dC1vYmplY3RzI2NyZWF0ZWJyYW5jaHByb3RlY3Rpb25ydWxlaW5wdXQgZm9yIGxpc3RcclxuICogb2YgdGhpbmdzIHlvdSBjYW4gZG8gd2l0aCBydWxlcy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlJZCAtIFVuaXF1ZSBJRCBmb3IgdGhlIHJlcG8sIHNlZSBjcmVhdGVSZXBvc2l0b3J5SWRRdWVyeURhdGEoKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVBhdHRlcm4gLSBwYXR0ZXJuIGZvciB0aGUgcnVsZSwgYWxsIGJyYW5jaGVzIG1hdGNoaW5nIHdpdGggZm5tYXRjaCB3aWxsIGJlIHByb3RlY3RlZFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVwb3NpdG9yeVJ1bGVNdXRhdGlvbkRhdGEgPSAoIHJlcG9zaXRvcnlJZCwgbmFtZVBhdHRlcm4gKSA9PiB7XHJcbiAgcmV0dXJuIGNyZWF0ZVF1ZXJ5RGF0YSggYG11dGF0aW9uIHtcclxuICAgIGNyZWF0ZUJyYW5jaFByb3RlY3Rpb25SdWxlKGlucHV0OiB7XHJcbiAgICAgIHBhdHRlcm46IFwiJHtuYW1lUGF0dGVybn1cIixcclxuICAgICAgYWxsb3dzRGVsZXRpb25zOiBmYWxzZSxcclxuICBcclxuICAgICAgcmVwb3NpdG9yeUlkOiBcIiR7cmVwb3NpdG9yeUlkfVwiXHJcbiAgICB9IClcclxuICAgIFxyXG4gICAgIyBJIHRoaW5rIHRoaXMgc3BlY2lmaWVzIHRoZSBkYXRhIHJldHVybmVkIGFmdGVyIHRoZSBzZXJ2ZXIgcmVjZWl2ZXMgdGhlIG11dGF0aW9uIHJlcXVlc3QsIG5vdCB1c2VkIGJ1dCByZXF1aXJlZFxyXG4gICAgIyB0byBzZW5kIHRoZSBtdXRhdGlvblxyXG4gICAge1xyXG4gICAgICBicmFuY2hQcm90ZWN0aW9uUnVsZSB7XHJcbiAgICAgICAgcGF0dGVyblxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB9YCApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGRhdGEgc3RyaW5nIHRoYXQgcmVxdWVzdHMgdGhlIHVuaXF1ZSBJRCBvZiBhIGdpdGh1YiByZXBvc2l0b3J5IHVzaW5nIGEgR3JhcGhRTCBxdWVyeSBzZW50IHdpdGggYW5cclxuICogSFRUUFMgcmVxdWVzdC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlOYW1lIC0gTmFtZSBvZiB0aGUgcGhldHNpbXMgcmVwb3NpdG9yeVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVwb3NpdG9yeUlkUXVlcnlEYXRhID0gcmVwb3NpdG9yeU5hbWUgPT4ge1xyXG4gIHJldHVybiBjcmVhdGVRdWVyeURhdGEoIGBxdWVyeSB7IHJlcG9zaXRvcnkob3duZXI6IFwicGhldHNpbXNcIiwgbmFtZTogXCIke3JlcG9zaXRvcnlOYW1lfVwiKSB7IGlkIH0gfWAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcmFwcyBhIHF1ZXJ5IHN0cmluZyB3aXRoIGFkZGl0aW9uYWwgZm9ybWF0dGluZyBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGluIGEgR3JhcGhRTCBxdWVyeSBzZW50IHdpdGggaHR0cHMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeVN0cmluZ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgY3JlYXRlUXVlcnlEYXRhID0gcXVlcnlTdHJpbmcgPT4ge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSgge1xyXG4gICAgcXVlcnk6IHF1ZXJ5U3RyaW5nXHJcbiAgfSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYW4gZXJyb3IgbWVzc2FnZSBmcm9tIGEgSlNPTiByZXNwb25zZS4gSnVzdCBncmFicyB0aGUgZmlyc3QgZXJyb3IgbWVzc2FnZSBpZiB0aGVyZSBhcmUgbXVsdGlwbGUuXHJcbiAqIEBwYXJhbSBqc29uUmVzcG9uc2UgLSBKU09OIHJlc3BvbnNlIG9iamVjdCBmcm9tIGdpdGh1Yi4gRXJyb3JzIGFyZSBpbiBhIC5lcnJvcnMgYXJyYXkuXHJcbiAqIEByZXR1cm5zIHsqfHN0cmluZ31cclxuICovXHJcbmNvbnN0IGdldEVycm9yTWVzc2FnZSA9IGpzb25SZXNwb25zZSA9PiB7XHJcbiAgaWYgKCBqc29uUmVzcG9uc2UuZXJyb3JzICkge1xyXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZS5lcnJvcnNbIDAgXS5tZXNzYWdlO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiAnTm8gZGF0YSByZXR1cm5lZCc7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHVuaXF1ZSBJRCBvZiB0aGUgcHJvdmlkZWQgcGhldHNpbXMgcmVwb3NpdG9yeS5cclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlOYW1lXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBnZXRSZXBvc2l0b3J5SWQoIHJlcG9zaXRvcnlOYW1lICkge1xyXG4gIGNvbnN0IGhhbmRsZUpTT05SZXNwb25zZSA9IGpzb25SZXNwb25zZSA9PiB7XHJcbiAgICBpZiAoICFqc29uUmVzcG9uc2UuZGF0YSB8fCBqc29uUmVzcG9uc2UuZGF0YS5yZXBvc2l0b3J5ID09PSBudWxsICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGAke2dldEVycm9yTWVzc2FnZSgganNvblJlc3BvbnNlICl9IE1ha2Ugc3VyZSBkZXZlbG9wZXJHaXRodWJBY2Nlc3NUb2tlbiBpbiBidWlsZC1sb2NhbC5qc29uIG1heSBiZSBpbmNvcnJlY3Qgb3IgZXhwaXJlZC5gICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZS5kYXRhLnJlcG9zaXRvcnkuaWQ7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNlbmRQcm9taXNlZEh0dHBzUmVxdWVzdCggY3JlYXRlUmVwb3NpdG9yeUlkUXVlcnlEYXRhKCByZXBvc2l0b3J5TmFtZSApLCBoYW5kbGVKU09OUmVzcG9uc2UgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cywgb25lIGZvciBlYWNoIGV4aXN0aW5nIGJyYW5jaCBwcm90ZWN0aW9uIHJ1bGUgZm9yIHRoZSByZXBvc2l0b3J5LCB0aGF0IGhhc1xyXG4gKiB0aGUgcHJvdGVjdGlvbiBydWxlIHBhdHRlcm4gYW5kIHRoZSB1bmlxdWUgSUQgZm9yIHRoZSBydWxlIGFzc2lnbmVkIGJ5IGdpdGh1Yi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlOYW1lXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPCpbXT59IC0gYXJyYXkgb2Ygbm9kZXMgd2l0aCBrZXkgdmFsdWUgcGFpcnMgb2YgeyBcInBhdHRlcm5cIjogc3RyaW5nLCBcImlkXCI6IHN0cmluZyB9XHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBnZXRFeGlzdGluZ0JyYW5jaFByb3RlY3Rpb25SdWxlcyggcmVwb3NpdG9yeU5hbWUgKSB7XHJcbiAgY29uc3QgaGFuZGxlSlNPTlJlc3BvbnNlID0ganNvblJlc3BvbnNlID0+IHtcclxuICAgIGlmICgganNvblJlc3BvbnNlLmVycm9ycyApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBnZXRFcnJvck1lc3NhZ2UoIGpzb25SZXNwb25zZSApICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFqc29uUmVzcG9uc2UuZGF0YSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgTm8gZGF0YSByZXR1cm5lZCBieSBnZXRFeGlzdGluZ0JyYW5jaFByb3RlY3Rpb25SdWxlcyBmb3IgcmVwbyAke3JlcG9zaXRvcnlOYW1lfWAgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBqc29uUmVzcG9uc2UuZGF0YS5yZXBvc2l0b3J5LmJyYW5jaFByb3RlY3Rpb25SdWxlcy5ub2RlcztcclxuICB9O1xyXG5cclxuICByZXR1cm4gc2VuZFByb21pc2VkSHR0cHNSZXF1ZXN0KCBjcmVhdGVCcmFuY2hQcm90ZWN0aW9uUnVsZVF1ZXJ5RGF0YSggcmVwb3NpdG9yeU5hbWUgKSwgaGFuZGxlSlNPTlJlc3BvbnNlICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBwcm90ZWN0aW9uIHJ1bGUgZm9yIGFsbCBicmFuY2hlcyBtYXRjaGluZyB0aGUgbmFtZVBhdHRlcm4gZm9yIHRoZSBwaGV0c2ltcyByZXBvc2l0b3J5IHdpdGggdGhlIHByb3ZpZGVkXHJcbiAqIHVuaXF1ZSBJRCBhc3NpZ25lZCBieSBnaXRodWIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvc2l0b3J5SWQgLSB1bmlxdWUgSUQgZm9yIHRoZSByZXBvc2l0b3J5LCB1c2UgZ2V0UmVwb3NpdG9yeUlkIHRvIGdldCB0aGlzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lUGF0dGVybiAtIFRoZSBwYXR0ZXJuIGZvciB0aGUgcnVsZSB1c2luZyBmbm1hdGNoXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59XHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiB3cml0ZVByb3RlY3Rpb25SdWxlKCByZXBvc2l0b3J5SWQsIG5hbWVQYXR0ZXJuICkge1xyXG4gIGNvbnN0IGhhbmRsZUpTT05SZXNwb25zZSA9IGpzb25SZXNwb25zZSA9PiB7XHJcbiAgICBpZiAoIGpzb25SZXNwb25zZS5lcnJvcnMgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggZ2V0RXJyb3JNZXNzYWdlKCBqc29uUmVzcG9uc2UgKSApO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgcmV0dXJuIHNlbmRQcm9taXNlZEh0dHBzUmVxdWVzdCggY3JlYXRlUmVwb3NpdG9yeVJ1bGVNdXRhdGlvbkRhdGEoIHJlcG9zaXRvcnlJZCwgbmFtZVBhdHRlcm4gKSwgaGFuZGxlSlNPTlJlc3BvbnNlICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWxldGVzIGFuIGV4aXN0aW5nIHJ1bGUuIFdlIGFzc3VtZSB0aGF0IHRoYXQgYnkgcnVubmluZyB0aGlzIHdlIHdhbnQgdG8gb3ZlcndyaXRlIHRoZSBleGlzdGluZyBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcnVsZUlkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lUGF0dGVyblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb3NpdG9yeU5hbWVcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0Pn1cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUV4aXN0aW5nUHJvdGVjdGlvblJ1bGUoIHJ1bGVJZCwgbmFtZVBhdHRlcm4sIHJlcG9zaXRvcnlOYW1lICkge1xyXG4gIGNvbnN0IGhhbmRsZUpTT05SZXNwb25zZSA9IGpzb25SZXNwb25zZSA9PiB7XHJcbiAgICBpZiAoIGpzb25SZXNwb25zZS5lcnJvcnMgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggZ2V0RXJyb3JNZXNzYWdlKCBqc29uUmVzcG9uc2UgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgRGVsZXRlZCBleGlzdGluZyBicmFuY2ggcHJvdGVjdGlvbiBydWxlICR7bmFtZVBhdHRlcm59IGZvciByZXBvICR7cmVwb3NpdG9yeU5hbWV9YCApO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgcmV0dXJuIHNlbmRQcm9taXNlZEh0dHBzUmVxdWVzdCggY3JlYXRlRGVsZXRlQnJhbmNoUHJvdGVjdGlvblJ1bGVNdXRhdGlvbkRhdGEoIHJ1bGVJZCApLCBoYW5kbGVKU09OUmVzcG9uc2UgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgd2lsbCBkZWxldGUgYWxsIGV4aXN0aW5nIHJ1bGVzIHRoYXQgbWF0Y2ggdGhlIHByb3ZpZGVkIG5hbWVQYXR0ZXJuIGZvciB0aGUgcmVwb3NpdG9yeS5cclxuICogV3JhcHBlZCBpbiBhIFByb21pc2Ugc28gd2UgY2FuIHdhaXQgdG8gd3JpdGUgbmV3IHJ1bGVzIHVudGlsIHRoZSBleGlzdGluZyBydWxlcyBhcmUgcmVtb3ZlZC4gSWYgeW91IHRyeSB0b1xyXG4gKiB3cml0ZSBvdmVyIGFuIGV4aXN0aW5nIHJ1bGUgd2l0aG91dCByZW1vdmluZyBpdCBnaXRodWIgd2lsbCByZXNwb25kIHdpdGggYW4gZXJyb3IuXHJcbiAqXHJcbiAqIEBwYXJhbSB7KltdfSBydWxlc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVBhdHRlcm5cclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlOYW1lXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHVua25vd25bXT59XHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBkZWxldGVNYXRjaGluZ1Byb3RlY3Rpb25SdWxlcyggcnVsZXMsIG5hbWVQYXR0ZXJuLCByZXBvc2l0b3J5TmFtZSApIHtcclxuXHJcbiAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuICBydWxlcy5mb3JFYWNoKCBydWxlID0+IHtcclxuXHJcbiAgICAvLyBvbmx5IGRlbGV0ZSBydWxlcyB0aGF0IG1hdGNoIHRoZSBuZXcgcGF0dGVybiB3ZSB3YW50IHRvIHByb3RlY3RcclxuICAgIGlmICggcnVsZS5wYXR0ZXJuID09PSBuYW1lUGF0dGVybiApIHtcclxuICAgICAgcHJvbWlzZXMucHVzaCggZGVsZXRlRXhpc3RpbmdQcm90ZWN0aW9uUnVsZSggcnVsZS5pZCwgbmFtZVBhdHRlcm4sIHJlcG9zaXRvcnlOYW1lICkgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbCggcHJvbWlzZXMgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgcmVxdWVzdCB0byBnaXRodWIncyBHcmFwaFFMIHNlcnZlciB0byBxdWVyeSBvciBtdXRhdGUgcmVwb3NpdG9yeSBkYXRhLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnlEYXRhIC0gdGhlIHN0cmluZyBzZW50IHdpdGggaHR0cHNcclxuICogQHBhcmFtIHtmdW5jdGlvbihPYmplY3QpfSBoYW5kbGUgLSBoYW5kbGVzIHRoZSBKU09OIHJlc3BvbnNlIGZyb20gZ2l0aHViXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHVua25vd24+fVxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gc2VuZFByb21pc2VkSHR0cHNSZXF1ZXN0KCBxdWVyeURhdGEsIGhhbmRsZSApIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG4gICAgY29uc3QgcmVxdWVzdCA9IGh0dHBzLnJlcXVlc3QoIG9wdGlvbnMsIHJlc3BvbnNlID0+IHtcclxuICAgICAgbGV0IHJlc3BvbnNlQm9keSA9ICcnO1xyXG5cclxuICAgICAgcmVzcG9uc2Uub24oICdkYXRhJywgZCA9PiB7XHJcbiAgICAgICAgcmVzcG9uc2VCb2R5ICs9IGQ7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJlc3BvbnNlLm9uKCAnZW5kJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGpzb25SZXNwb25zZSA9IEpTT04ucGFyc2UoIHJlc3BvbnNlQm9keSApO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gaGFuZGxlKCBqc29uUmVzcG9uc2UgKTtcclxuICAgICAgICAgIHJlc29sdmUoIHJlc29sdmVWYWx1ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZXJyb3IgKSB7XHJcbiAgICAgICAgICByZWplY3QoIGVycm9yICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmVxdWVzdC5vbiggJ2Vycm9yJywgZXJyb3IgPT4ge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCBlcnJvciApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHJlcXVlc3Qud3JpdGUoIHF1ZXJ5RGF0YSApO1xyXG4gICAgcmVxdWVzdC5lbmQoKTtcclxuICB9ICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGVhciBwcm90ZWN0aW9ucyBmb3IgdGhlIGJyYW5jaGVzIHRoYXQgUGhFVCB3YW50cyB0byBwcm90ZWN0LlxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gY2xlYXJCcmFuY2hQcm90ZWN0aW9ucyggcmVwb3NpdG9yaWVzICkge1xyXG4gIGZvciAoIGNvbnN0IHJlcG9zaXRvcnlOYW1lIG9mIHJlcG9zaXRvcmllcyApIHtcclxuICAgIGZvciAoIGNvbnN0IG5hbWVQYXR0ZXJuIG9mIEJSQU5DSF9OQU1FX1BBVFRFUk5TICkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGJyYW5jaFByb3RlY3Rpb25SdWxlcyA9IGF3YWl0IGdldEV4aXN0aW5nQnJhbmNoUHJvdGVjdGlvblJ1bGVzKCByZXBvc2l0b3J5TmFtZSApO1xyXG4gICAgICAgIGF3YWl0IGRlbGV0ZU1hdGNoaW5nUHJvdGVjdGlvblJ1bGVzKCBicmFuY2hQcm90ZWN0aW9uUnVsZXMsIG5hbWVQYXR0ZXJuLCByZXBvc2l0b3J5TmFtZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYEVycm9yIGNsZWFyaW5nIGdpdGh1YiBwcm90ZWN0aW9uIHJ1bGUgJHtuYW1lUGF0dGVybn0gZm9yICR7cmVwb3NpdG9yeU5hbWV9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQXBwbHkgYnJhbmNoIHByb3RlY3Rpb24gcnVsZXMgdG8gcHJvZGN1dGlvbiBicmFuY2hlcyAobWFpbiwgcmVsZWFzZSBicmFuY2hlcykuXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBwcm90ZWN0QnJhbmNoZXMoIHJlcG9zaXRvcmllcyApIHtcclxuXHJcbiAgLy8gcmVtb3ZlIGFueSB0cmFpbGluZyAnLycgZnJvbSB0aGUgcmVwb3NpdG9yeSBuYW1lcywgd2hpY2ggbWF5IGhhdmUgYmVlbiBhZGRlZCBieSBhdXRvIGNvbXBsZXRlXHJcbiAgY29uc3QgY2xlYW5lZFJlcG9zaXRvcmllcyA9IHJlcG9zaXRvcmllcy5tYXAoIHJlcG9zaXRvcnkgPT4gcmVwb3NpdG9yeS5yZXBsYWNlKCAvXFwvJC8sICcnICkgKTtcclxuXHJcbiAgLy8gaWYgdGhlIHJ1bGUgZm9yIHRoZSBwcm90ZWN0ZWQgYnJhbmNoIGFscmVhZHkgZXhpc3RzLCBkZWxldGUgaXQgLSB3ZSBhc3N1bWUgdGhhdCBydW5uaW5nIHRoaXMgYWdhaW4gbWVhbnMgd2VcclxuICAvLyB3YW50IHRvIHVwZGF0ZSBydWxlcyBmb3IgZWFjaCBuYW1lUGF0dGVyblxyXG4gIGF3YWl0IGNsZWFyQnJhbmNoUHJvdGVjdGlvbnMoIGNsZWFuZWRSZXBvc2l0b3JpZXMgKTtcclxuXHJcbiAgZm9yICggY29uc3QgcmVwb3NpdG9yeU5hbWUgb2YgY2xlYW5lZFJlcG9zaXRvcmllcyApIHtcclxuXHJcbiAgICAvLyBnZXQgdGhlIHVuaXF1ZSBJRCBmb3IgZWFjaCByZXBvc2l0b3J5XHJcbiAgICBjb25zdCByZXBvc2l0b3J5SWQgPSBhd2FpdCBnZXRSZXBvc2l0b3J5SWQoIHJlcG9zaXRvcnlOYW1lICk7XHJcblxyXG4gICAgZm9yICggY29uc3QgbmFtZVBhdHRlcm4gb2YgQlJBTkNIX05BTUVfUEFUVEVSTlMgKSB7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHdyaXRlUHJvdGVjdGlvblJ1bGUoIHJlcG9zaXRvcnlJZCwgbmFtZVBhdHRlcm4gKTtcclxuICAgICAgICBjb25zb2xlLmxvZyggYCR7bmFtZVBhdHRlcm59IHByb3RlY3Rpb24gcnVsZSBzZXQgZm9yICR7cmVwb3NpdG9yeU5hbWV9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYEVycm9yIHdyaXRpbmcgJHtuYW1lUGF0dGVybn0gcnVsZSBmb3IgcmVwbyAke3JlcG9zaXRvcnlOYW1lfTpgICk7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGVycm9yICk7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdcXG4nICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIHByb3RlY3RCcmFuY2hlczogcHJvdGVjdEJyYW5jaGVzLFxyXG4gIGNsZWFyQnJhbmNoUHJvdGVjdGlv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