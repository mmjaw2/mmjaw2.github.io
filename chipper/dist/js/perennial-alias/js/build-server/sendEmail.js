// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const constants = require('./constants');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const nodemailer = require('nodemailer');

// configure email server
let transporter;
if (constants.BUILD_SERVER_CONFIG.emailUsername && constants.BUILD_SERVER_CONFIG.emailPassword && constants.BUILD_SERVER_CONFIG.emailTo) {
  transporter = nodemailer.createTransport({
    auth: {
      user: constants.BUILD_SERVER_CONFIG.emailUsername,
      pass: constants.BUILD_SERVER_CONFIG.emailPassword
    },
    host: constants.BUILD_SERVER_CONFIG.emailServer,
    port: 587,
    tls: {
      ciphers: 'SSLv3'
    }
  });
} else {
  winston.log('warn', 'failed to set up email server, missing one or more of the following fields in build-local.json:\n' + 'emailUsername, emailPassword, emailTo');
}

/**
 * Send an email. Used to notify developers if a build fails
 * @param subject
 * @param text
 * @param emailParameter - recipient defined per request
 * @param emailParameterOnly - if true send the email only to the passed in email, not to the default list as well
 */
module.exports = async function sendEmail(subject, text, emailParameter, emailParameterOnly) {
  if (transporter) {
    let emailTo = constants.BUILD_SERVER_CONFIG.emailTo;
    if (emailParameter) {
      if (emailParameterOnly) {
        emailTo = emailParameter;
      } else {
        emailTo += `, ${emailParameter}`;
      }
    }

    // don't send an email if no email is given
    if (emailParameterOnly && !emailParameter) {
      return;
    }
    try {
      const emailResult = await transporter.sendMail({
        from: `"PhET Mail" <${constants.BUILD_SERVER_CONFIG.emailUsername}>`,
        to: emailTo,
        subject: subject,
        text: text.replace(/([^\r])\n/g, '$1\r\n') // Replace LF with CRLF, bare line feeds are rejected by some email clients,
      });
      winston.info(`sent email: ${emailTo}, ${subject}, ${emailResult.messageId}, ${emailResult.response}`);
    } catch (err) {
      let errorString = typeof err === 'string' ? err : JSON.stringify(err);
      errorString = errorString.replace(constants.BUILD_SERVER_CONFIG.emailPassword, '***PASSWORD REDACTED***');
      winston.error(`error when attempted to send email, err = ${errorString}`);
    }
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zdGFudHMiLCJyZXF1aXJlIiwid2luc3RvbiIsIm5vZGVtYWlsZXIiLCJ0cmFuc3BvcnRlciIsIkJVSUxEX1NFUlZFUl9DT05GSUciLCJlbWFpbFVzZXJuYW1lIiwiZW1haWxQYXNzd29yZCIsImVtYWlsVG8iLCJjcmVhdGVUcmFuc3BvcnQiLCJhdXRoIiwidXNlciIsInBhc3MiLCJob3N0IiwiZW1haWxTZXJ2ZXIiLCJwb3J0IiwidGxzIiwiY2lwaGVycyIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJzZW5kRW1haWwiLCJzdWJqZWN0IiwidGV4dCIsImVtYWlsUGFyYW1ldGVyIiwiZW1haWxQYXJhbWV0ZXJPbmx5IiwiZW1haWxSZXN1bHQiLCJzZW5kTWFpbCIsImZyb20iLCJ0byIsInJlcGxhY2UiLCJpbmZvIiwibWVzc2FnZUlkIiwicmVzcG9uc2UiLCJlcnIiLCJlcnJvclN0cmluZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJlcnJvciJdLCJzb3VyY2VzIjpbInNlbmRFbWFpbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG5cclxuXHJcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5jb25zdCBub2RlbWFpbGVyID0gcmVxdWlyZSggJ25vZGVtYWlsZXInICk7XHJcblxyXG4vLyBjb25maWd1cmUgZW1haWwgc2VydmVyXHJcbmxldCB0cmFuc3BvcnRlcjtcclxuaWYgKCBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5lbWFpbFVzZXJuYW1lICYmIGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsUGFzc3dvcmQgJiYgY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuZW1haWxUbyApIHtcclxuICB0cmFuc3BvcnRlciA9IG5vZGVtYWlsZXIuY3JlYXRlVHJhbnNwb3J0KCB7XHJcbiAgICBhdXRoOiB7XHJcbiAgICAgIHVzZXI6IGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsVXNlcm5hbWUsXHJcbiAgICAgIHBhc3M6IGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsUGFzc3dvcmRcclxuICAgIH0sXHJcbiAgICBob3N0OiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5lbWFpbFNlcnZlcixcclxuICAgIHBvcnQ6IDU4NyxcclxuICAgIHRsczoge1xyXG4gICAgICBjaXBoZXJzOiAnU1NMdjMnXHJcbiAgICB9XHJcbiAgfSApO1xyXG59XHJcbmVsc2Uge1xyXG4gIHdpbnN0b24ubG9nKCAnd2FybicsICdmYWlsZWQgdG8gc2V0IHVwIGVtYWlsIHNlcnZlciwgbWlzc2luZyBvbmUgb3IgbW9yZSBvZiB0aGUgZm9sbG93aW5nIGZpZWxkcyBpbiBidWlsZC1sb2NhbC5qc29uOlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICdlbWFpbFVzZXJuYW1lLCBlbWFpbFBhc3N3b3JkLCBlbWFpbFRvJyApO1xyXG59XHJcblxyXG4vKipcclxuICogU2VuZCBhbiBlbWFpbC4gVXNlZCB0byBub3RpZnkgZGV2ZWxvcGVycyBpZiBhIGJ1aWxkIGZhaWxzXHJcbiAqIEBwYXJhbSBzdWJqZWN0XHJcbiAqIEBwYXJhbSB0ZXh0XHJcbiAqIEBwYXJhbSBlbWFpbFBhcmFtZXRlciAtIHJlY2lwaWVudCBkZWZpbmVkIHBlciByZXF1ZXN0XHJcbiAqIEBwYXJhbSBlbWFpbFBhcmFtZXRlck9ubHkgLSBpZiB0cnVlIHNlbmQgdGhlIGVtYWlsIG9ubHkgdG8gdGhlIHBhc3NlZCBpbiBlbWFpbCwgbm90IHRvIHRoZSBkZWZhdWx0IGxpc3QgYXMgd2VsbFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBzZW5kRW1haWwoIHN1YmplY3QsIHRleHQsIGVtYWlsUGFyYW1ldGVyLCBlbWFpbFBhcmFtZXRlck9ubHkgKSB7XHJcbiAgaWYgKCB0cmFuc3BvcnRlciApIHtcclxuICAgIGxldCBlbWFpbFRvID0gY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuZW1haWxUbztcclxuXHJcbiAgICBpZiAoIGVtYWlsUGFyYW1ldGVyICkge1xyXG4gICAgICBpZiAoIGVtYWlsUGFyYW1ldGVyT25seSApIHtcclxuICAgICAgICBlbWFpbFRvID0gZW1haWxQYXJhbWV0ZXI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZW1haWxUbyArPSAoIGAsICR7ZW1haWxQYXJhbWV0ZXJ9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9uJ3Qgc2VuZCBhbiBlbWFpbCBpZiBubyBlbWFpbCBpcyBnaXZlblxyXG4gICAgaWYgKCBlbWFpbFBhcmFtZXRlck9ubHkgJiYgIWVtYWlsUGFyYW1ldGVyICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCgge1xyXG4gICAgICAgIGZyb206IGBcIlBoRVQgTWFpbFwiIDwke2NvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsVXNlcm5hbWV9PmAsXHJcbiAgICAgICAgdG86IGVtYWlsVG8sXHJcbiAgICAgICAgc3ViamVjdDogc3ViamVjdCxcclxuICAgICAgICB0ZXh0OiB0ZXh0LnJlcGxhY2UoIC8oW15cXHJdKVxcbi9nLCAnJDFcXHJcXG4nICkgLy8gUmVwbGFjZSBMRiB3aXRoIENSTEYsIGJhcmUgbGluZSBmZWVkcyBhcmUgcmVqZWN0ZWQgYnkgc29tZSBlbWFpbCBjbGllbnRzLFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICB3aW5zdG9uLmluZm8oIGBzZW50IGVtYWlsOiAke2VtYWlsVG99LCAke3N1YmplY3R9LCAke2VtYWlsUmVzdWx0Lm1lc3NhZ2VJZH0sICR7ZW1haWxSZXN1bHQucmVzcG9uc2V9YCApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGVyciApIHtcclxuICAgICAgbGV0IGVycm9yU3RyaW5nID0gdHlwZW9mIGVyciA9PT0gJ3N0cmluZycgPyBlcnIgOiBKU09OLnN0cmluZ2lmeSggZXJyICk7XHJcbiAgICAgIGVycm9yU3RyaW5nID0gZXJyb3JTdHJpbmcucmVwbGFjZSggY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuZW1haWxQYXNzd29yZCwgJyoqKlBBU1NXT1JEIFJFREFDVEVEKioqJyApO1xyXG4gICAgICB3aW5zdG9uLmVycm9yKCBgZXJyb3Igd2hlbiBhdHRlbXB0ZWQgdG8gc2VuZCBlbWFpbCwgZXJyID0gJHtlcnJvclN0cmluZ31gICk7XHJcbiAgICB9XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFHQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDO0FBQ3BDLE1BQU1FLFVBQVUsR0FBR0YsT0FBTyxDQUFFLFlBQWEsQ0FBQzs7QUFFMUM7QUFDQSxJQUFJRyxXQUFXO0FBQ2YsSUFBS0osU0FBUyxDQUFDSyxtQkFBbUIsQ0FBQ0MsYUFBYSxJQUFJTixTQUFTLENBQUNLLG1CQUFtQixDQUFDRSxhQUFhLElBQUlQLFNBQVMsQ0FBQ0ssbUJBQW1CLENBQUNHLE9BQU8sRUFBRztFQUN6SUosV0FBVyxHQUFHRCxVQUFVLENBQUNNLGVBQWUsQ0FBRTtJQUN4Q0MsSUFBSSxFQUFFO01BQ0pDLElBQUksRUFBRVgsU0FBUyxDQUFDSyxtQkFBbUIsQ0FBQ0MsYUFBYTtNQUNqRE0sSUFBSSxFQUFFWixTQUFTLENBQUNLLG1CQUFtQixDQUFDRTtJQUN0QyxDQUFDO0lBQ0RNLElBQUksRUFBRWIsU0FBUyxDQUFDSyxtQkFBbUIsQ0FBQ1MsV0FBVztJQUMvQ0MsSUFBSSxFQUFFLEdBQUc7SUFDVEMsR0FBRyxFQUFFO01BQ0hDLE9BQU8sRUFBRTtJQUNYO0VBQ0YsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyxNQUNJO0VBQ0hmLE9BQU8sQ0FBQ2dCLEdBQUcsQ0FBRSxNQUFNLEVBQUUsbUdBQW1HLEdBQ25HLHVDQUF3QyxDQUFDO0FBQ2hFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLGVBQWVDLFNBQVNBLENBQUVDLE9BQU8sRUFBRUMsSUFBSSxFQUFFQyxjQUFjLEVBQUVDLGtCQUFrQixFQUFHO0VBQzdGLElBQUtyQixXQUFXLEVBQUc7SUFDakIsSUFBSUksT0FBTyxHQUFHUixTQUFTLENBQUNLLG1CQUFtQixDQUFDRyxPQUFPO0lBRW5ELElBQUtnQixjQUFjLEVBQUc7TUFDcEIsSUFBS0Msa0JBQWtCLEVBQUc7UUFDeEJqQixPQUFPLEdBQUdnQixjQUFjO01BQzFCLENBQUMsTUFDSTtRQUNIaEIsT0FBTyxJQUFPLEtBQUlnQixjQUFlLEVBQUc7TUFDdEM7SUFDRjs7SUFFQTtJQUNBLElBQUtDLGtCQUFrQixJQUFJLENBQUNELGNBQWMsRUFBRztNQUMzQztJQUNGO0lBRUEsSUFBSTtNQUNGLE1BQU1FLFdBQVcsR0FBRyxNQUFNdEIsV0FBVyxDQUFDdUIsUUFBUSxDQUFFO1FBQzlDQyxJQUFJLEVBQUcsZ0JBQWU1QixTQUFTLENBQUNLLG1CQUFtQixDQUFDQyxhQUFjLEdBQUU7UUFDcEV1QixFQUFFLEVBQUVyQixPQUFPO1FBQ1hjLE9BQU8sRUFBRUEsT0FBTztRQUNoQkMsSUFBSSxFQUFFQSxJQUFJLENBQUNPLE9BQU8sQ0FBRSxZQUFZLEVBQUUsUUFBUyxDQUFDLENBQUM7TUFDL0MsQ0FBRSxDQUFDO01BRUg1QixPQUFPLENBQUM2QixJQUFJLENBQUcsZUFBY3ZCLE9BQVEsS0FBSWMsT0FBUSxLQUFJSSxXQUFXLENBQUNNLFNBQVUsS0FBSU4sV0FBVyxDQUFDTyxRQUFTLEVBQUUsQ0FBQztJQUN6RyxDQUFDLENBQ0QsT0FBT0MsR0FBRyxFQUFHO01BQ1gsSUFBSUMsV0FBVyxHQUFHLE9BQU9ELEdBQUcsS0FBSyxRQUFRLEdBQUdBLEdBQUcsR0FBR0UsSUFBSSxDQUFDQyxTQUFTLENBQUVILEdBQUksQ0FBQztNQUN2RUMsV0FBVyxHQUFHQSxXQUFXLENBQUNMLE9BQU8sQ0FBRTlCLFNBQVMsQ0FBQ0ssbUJBQW1CLENBQUNFLGFBQWEsRUFBRSx5QkFBMEIsQ0FBQztNQUMzR0wsT0FBTyxDQUFDb0MsS0FBSyxDQUFHLDZDQUE0Q0gsV0FBWSxFQUFFLENBQUM7SUFDN0U7RUFDRjtBQUNGLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=