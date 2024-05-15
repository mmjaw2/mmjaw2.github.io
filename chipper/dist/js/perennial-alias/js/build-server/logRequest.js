// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

module.exports = function logRequest(req, type, winston) {
  // log the request, which is useful for debugging
  let requestBodyString = '';
  for (const key in req[type]) {
    if (req[type].hasOwnProperty(key)) {
      requestBodyString += `${key}:${JSON.stringify(req[type][key])}\n`;
    }
  }
  winston.log('info', `deploy request received, original URL = ${req.protocol}://${req.get('host')}${req.originalUrl}\n${requestBodyString}`);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibG9nUmVxdWVzdCIsInJlcSIsInR5cGUiLCJ3aW5zdG9uIiwicmVxdWVzdEJvZHlTdHJpbmciLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsIkpTT04iLCJzdHJpbmdpZnkiLCJsb2ciLCJwcm90b2NvbCIsImdldCIsIm9yaWdpbmFsVXJsIl0sInNvdXJjZXMiOlsibG9nUmVxdWVzdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsb2dSZXF1ZXN0KCByZXEsIHR5cGUsIHdpbnN0b24gKSB7XHJcbiAgLy8gbG9nIHRoZSByZXF1ZXN0LCB3aGljaCBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZ1xyXG4gIGxldCByZXF1ZXN0Qm9keVN0cmluZyA9ICcnO1xyXG4gIGZvciAoIGNvbnN0IGtleSBpbiByZXFbIHR5cGUgXSApIHtcclxuICAgIGlmICggcmVxWyB0eXBlIF0uaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICByZXF1ZXN0Qm9keVN0cmluZyArPSBgJHtrZXl9OiR7SlNPTi5zdHJpbmdpZnkoIHJlcVsgdHlwZSBdWyBrZXkgXSApfVxcbmA7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHdpbnN0b24ubG9nKFxyXG4gICAgJ2luZm8nLFxyXG4gICAgYGRlcGxveSByZXF1ZXN0IHJlY2VpdmVkLCBvcmlnaW5hbCBVUkwgPSAke3JlcS5wcm90b2NvbH06Ly8ke3JlcS5nZXQoICdob3N0JyApfSR7cmVxLm9yaWdpbmFsVXJsfVxcbiR7cmVxdWVzdEJvZHlTdHJpbmd9YFxyXG4gICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBOztBQUVBQSxNQUFNLENBQUNDLE9BQU8sR0FBRyxTQUFTQyxVQUFVQSxDQUFFQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFHO0VBQ3pEO0VBQ0EsSUFBSUMsaUJBQWlCLEdBQUcsRUFBRTtFQUMxQixLQUFNLE1BQU1DLEdBQUcsSUFBSUosR0FBRyxDQUFFQyxJQUFJLENBQUUsRUFBRztJQUMvQixJQUFLRCxHQUFHLENBQUVDLElBQUksQ0FBRSxDQUFDSSxjQUFjLENBQUVELEdBQUksQ0FBQyxFQUFHO01BQ3ZDRCxpQkFBaUIsSUFBSyxHQUFFQyxHQUFJLElBQUdFLElBQUksQ0FBQ0MsU0FBUyxDQUFFUCxHQUFHLENBQUVDLElBQUksQ0FBRSxDQUFFRyxHQUFHLENBQUcsQ0FBRSxJQUFHO0lBQ3pFO0VBQ0Y7RUFDQUYsT0FBTyxDQUFDTSxHQUFHLENBQ1QsTUFBTSxFQUNMLDJDQUEwQ1IsR0FBRyxDQUFDUyxRQUFTLE1BQUtULEdBQUcsQ0FBQ1UsR0FBRyxDQUFFLE1BQU8sQ0FBRSxHQUFFVixHQUFHLENBQUNXLFdBQVksS0FBSVIsaUJBQWtCLEVBQ3pILENBQUM7QUFDSCxDQUFDIiwiaWdub3JlTGlzdCI6W119