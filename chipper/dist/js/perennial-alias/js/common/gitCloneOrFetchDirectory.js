// Copyright 2023, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const fs = require('fs');
const execute = require('./execute');
const gitCloneDirectory = require('./gitCloneDirectory');
module.exports = async function gitCloneOrFetchDirectory(repo, directory) {
  const repoPwd = `${directory}/${repo}`;
  if (!fs.existsSync(`${directory}/${repo}`)) {
    await gitCloneDirectory(repo, directory);
  } else {
    await execute('git', ['fetch'], repoPwd);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJleGVjdXRlIiwiZ2l0Q2xvbmVEaXJlY3RvcnkiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwicmVwbyIsImRpcmVjdG9yeSIsInJlcG9Qd2QiLCJleGlzdHNTeW5jIl0sInNvdXJjZXMiOlsiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLy8gQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcblxyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBnaXRDbG9uZURpcmVjdG9yeSA9IHJlcXVpcmUoICcuL2dpdENsb25lRGlyZWN0b3J5JyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBnaXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnkoIHJlcG8sIGRpcmVjdG9yeSApIHtcclxuICBjb25zdCByZXBvUHdkID0gYCR7ZGlyZWN0b3J5fS8ke3JlcG99YDtcclxuXHJcbiAgaWYgKCAhZnMuZXhpc3RzU3luYyggYCR7ZGlyZWN0b3J5fS8ke3JlcG99YCApICkge1xyXG4gICAgYXdhaXQgZ2l0Q2xvbmVEaXJlY3RvcnkoIHJlcG8sIGRpcmVjdG9yeSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdmZXRjaCcgXSwgcmVwb1B3ZCApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7O0FBR0EsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxNQUFNRSxpQkFBaUIsR0FBR0YsT0FBTyxDQUFFLHFCQUFzQixDQUFDO0FBRTFERyxNQUFNLENBQUNDLE9BQU8sR0FBRyxlQUFlQyx3QkFBd0JBLENBQUVDLElBQUksRUFBRUMsU0FBUyxFQUFHO0VBQzFFLE1BQU1DLE9BQU8sR0FBSSxHQUFFRCxTQUFVLElBQUdELElBQUssRUFBQztFQUV0QyxJQUFLLENBQUNQLEVBQUUsQ0FBQ1UsVUFBVSxDQUFHLEdBQUVGLFNBQVUsSUFBR0QsSUFBSyxFQUFFLENBQUMsRUFBRztJQUM5QyxNQUFNSixpQkFBaUIsQ0FBRUksSUFBSSxFQUFFQyxTQUFVLENBQUM7RUFDNUMsQ0FBQyxNQUNJO0lBQ0gsTUFBTU4sT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLE9BQU8sQ0FBRSxFQUFFTyxPQUFRLENBQUM7RUFDOUM7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119