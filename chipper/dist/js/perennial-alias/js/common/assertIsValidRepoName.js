// Copyright 2021, University of Colorado Boulder

/**
 * Fails with an assertion if the string is not a valid repo name. See https://github.com/phetsims/chipper/issues/1034.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const assert = require('assert');

/**
 * Fails with an assertion if the string is not a valid repo name. See https://github.com/phetsims/chipper/issues/1034.
 *
 * @param {string} repo
 */
const assertIsValidRepoName = repo => {
  assert(typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test(repo), 'repo name should be composed of lowercase a-z characters, optionally with dashes used as separators');
};
module.exports = assertIsValidRepoName;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiYXNzZXJ0SXNWYWxpZFJlcG9OYW1lIiwicmVwbyIsInRlc3QiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiYXNzZXJ0SXNWYWxpZFJlcG9OYW1lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBGYWlscyB3aXRoIGFuIGFzc2VydGlvbiBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhIHZhbGlkIHJlcG8gbmFtZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMDM0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbi8qKlxyXG4gKiBGYWlscyB3aXRoIGFuIGFzc2VydGlvbiBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhIHZhbGlkIHJlcG8gbmFtZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMDM0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKi9cclxuY29uc3QgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lID0gcmVwbyA9PiB7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycgJiYgL15bYS16XSsoLVthLXpdKykqJC91LnRlc3QoIHJlcG8gKSwgJ3JlcG8gbmFtZSBzaG91bGQgYmUgY29tcG9zZWQgb2YgbG93ZXJjYXNlIGEteiBjaGFyYWN0ZXJzLCBvcHRpb25hbGx5IHdpdGggZGFzaGVzIHVzZWQgYXMgc2VwYXJhdG9ycycgKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXNzZXJ0SXNWYWxpZFJlcG9OYW1lOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxxQkFBcUIsR0FBR0MsSUFBSSxJQUFJO0VBQ3BDSCxNQUFNLENBQUUsT0FBT0csSUFBSSxLQUFLLFFBQVEsSUFBSSxxQkFBcUIsQ0FBQ0MsSUFBSSxDQUFFRCxJQUFLLENBQUMsRUFBRSxxR0FBc0csQ0FBQztBQUNqTCxDQUFDO0FBRURFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHSixxQkFBcUIiLCJpZ25vcmVMaXN0IjpbXX0=