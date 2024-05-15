// Copyright 2022-2023, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.  Avoids the overhead of grunt and Gruntfile.js for speed.
 *
 * Should only be run when developing in main, because when dependency shas are checked out for one sim,
 * they will likely be inconsistent for other repos which would cause failures for processes like type checking.
 * This means when running maintenance release steps, you may need to run git commands with --no-verify.
 *
 * Timing data is streamed through phetTimingLog, please see that file for how to see the results live and/or afterwards.
 *
 * USAGE:
 * cd ${repo}
 * node ../chipper/js/scripts/hook-pre-commit.js
 *
 * OPTIONS:
 * --console: outputs information to the console for debugging
 *
 * See also phet-info/git-template-dir/hooks/pre-commit for how this is used in precommit hooks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const path = require('path');
const execute = require('../../../perennial-alias/js/common/execute');
const phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
(async () => {
  // Identify the current repo
  const repo = process.cwd().split(path.sep).pop();
  const precommitSuccess = await phetTimingLog.startAsync(`hook-pre-commit repo="${repo}"`, async () => {
    // Console logging via --console
    const commandLineArguments = process.argv.slice(2);
    const outputToConsole = commandLineArguments.includes('--console');
    outputToConsole && console.log('repo:', repo);
    const promises = ['lint', 'report-media', 'tsc', 'qunit', 'phet-io-api-compare'].map(task => {
      return phetTimingLog.startAsync(task, async () => {
        const results = await execute('node', ['../chipper/js/scripts/hook-pre-commit-task.js', `--command=${task}`, `--repo=${repo}`, outputToConsole ? '--console' : ''], '../chipper', {
          errors: 'resolve'
        });
        results.stdout && results.stdout.trim().length > 0 && console.log(results.stdout);
        results.stderr && results.stderr.trim().length > 0 && console.log(results.stderr);
        if (results.code === 0) {
          return 0;
        } else {
          let message = 'Task failed: ' + task;
          if (results.stdout && results.stdout.trim().length > 0) {
            message = message + ', ' + results.stdout;
          }
          if (results.stderr && results.stderr.trim().length > 0) {
            message = message + ', ' + results.stderr;
          }
          throw new Error(message);
        }
      }, {
        depth: 1
      });
    });
    try {
      await Promise.all(promises);
      console.log('All tasks succeeded');
      return true;
    } catch (e) {
      // Exit as soon as any one promise fails
      // Each task is responsible for outputting its error to the console, so the console should already
      // be showing the error by now
      return false;
    }
  });

  // generatePhetioMacroAPI is preventing exit for unknown reasons, so manually exit here
  phetTimingLog.close(() => process.exit(precommitSuccess ? 0 : 1));
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsImV4ZWN1dGUiLCJwaGV0VGltaW5nTG9nIiwicmVwbyIsInByb2Nlc3MiLCJjd2QiLCJzcGxpdCIsInNlcCIsInBvcCIsInByZWNvbW1pdFN1Y2Nlc3MiLCJzdGFydEFzeW5jIiwiY29tbWFuZExpbmVBcmd1bWVudHMiLCJhcmd2Iiwic2xpY2UiLCJvdXRwdXRUb0NvbnNvbGUiLCJpbmNsdWRlcyIsImNvbnNvbGUiLCJsb2ciLCJwcm9taXNlcyIsIm1hcCIsInRhc2siLCJyZXN1bHRzIiwiZXJyb3JzIiwic3Rkb3V0IiwidHJpbSIsImxlbmd0aCIsInN0ZGVyciIsImNvZGUiLCJtZXNzYWdlIiwiRXJyb3IiLCJkZXB0aCIsIlByb21pc2UiLCJhbGwiLCJlIiwiY2xvc2UiLCJleGl0Il0sInNvdXJjZXMiOlsiaG9vay1wcmUtY29tbWl0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJ1bnMgdGFza3MgZm9yIHByZS1jb21taXQsIGluY2x1ZGluZyBsaW50IGFuZCBxdW5pdCB0ZXN0aW5nLiAgQXZvaWRzIHRoZSBvdmVyaGVhZCBvZiBncnVudCBhbmQgR3J1bnRmaWxlLmpzIGZvciBzcGVlZC5cclxuICpcclxuICogU2hvdWxkIG9ubHkgYmUgcnVuIHdoZW4gZGV2ZWxvcGluZyBpbiBtYWluLCBiZWNhdXNlIHdoZW4gZGVwZW5kZW5jeSBzaGFzIGFyZSBjaGVja2VkIG91dCBmb3Igb25lIHNpbSxcclxuICogdGhleSB3aWxsIGxpa2VseSBiZSBpbmNvbnNpc3RlbnQgZm9yIG90aGVyIHJlcG9zIHdoaWNoIHdvdWxkIGNhdXNlIGZhaWx1cmVzIGZvciBwcm9jZXNzZXMgbGlrZSB0eXBlIGNoZWNraW5nLlxyXG4gKiBUaGlzIG1lYW5zIHdoZW4gcnVubmluZyBtYWludGVuYW5jZSByZWxlYXNlIHN0ZXBzLCB5b3UgbWF5IG5lZWQgdG8gcnVuIGdpdCBjb21tYW5kcyB3aXRoIC0tbm8tdmVyaWZ5LlxyXG4gKlxyXG4gKiBUaW1pbmcgZGF0YSBpcyBzdHJlYW1lZCB0aHJvdWdoIHBoZXRUaW1pbmdMb2csIHBsZWFzZSBzZWUgdGhhdCBmaWxlIGZvciBob3cgdG8gc2VlIHRoZSByZXN1bHRzIGxpdmUgYW5kL29yIGFmdGVyd2FyZHMuXHJcbiAqXHJcbiAqIFVTQUdFOlxyXG4gKiBjZCAke3JlcG99XHJcbiAqIG5vZGUgLi4vY2hpcHBlci9qcy9zY3JpcHRzL2hvb2stcHJlLWNvbW1pdC5qc1xyXG4gKlxyXG4gKiBPUFRJT05TOlxyXG4gKiAtLWNvbnNvbGU6IG91dHB1dHMgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnNvbGUgZm9yIGRlYnVnZ2luZ1xyXG4gKlxyXG4gKiBTZWUgYWxzbyBwaGV0LWluZm8vZ2l0LXRlbXBsYXRlLWRpci9ob29rcy9wcmUtY29tbWl0IGZvciBob3cgdGhpcyBpcyB1c2VkIGluIHByZWNvbW1pdCBob29rcy5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9leGVjdXRlJyApO1xyXG5jb25zdCBwaGV0VGltaW5nTG9nID0gcmVxdWlyZSggJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vcGhldFRpbWluZ0xvZycgKTtcclxuXHJcbiggYXN5bmMgKCkgPT4ge1xyXG5cclxuICAvLyBJZGVudGlmeSB0aGUgY3VycmVudCByZXBvXHJcbiAgY29uc3QgcmVwbyA9IHByb2Nlc3MuY3dkKCkuc3BsaXQoIHBhdGguc2VwICkucG9wKCk7XHJcblxyXG4gIGNvbnN0IHByZWNvbW1pdFN1Y2Nlc3MgPSBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoIGBob29rLXByZS1jb21taXQgcmVwbz1cIiR7cmVwb31cImAsIGFzeW5jICgpID0+IHtcclxuXHJcbiAgICAvLyBDb25zb2xlIGxvZ2dpbmcgdmlhIC0tY29uc29sZVxyXG4gICAgY29uc3QgY29tbWFuZExpbmVBcmd1bWVudHMgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoIDIgKTtcclxuICAgIGNvbnN0IG91dHB1dFRvQ29uc29sZSA9IGNvbW1hbmRMaW5lQXJndW1lbnRzLmluY2x1ZGVzKCAnLS1jb25zb2xlJyApO1xyXG4gICAgb3V0cHV0VG9Db25zb2xlICYmIGNvbnNvbGUubG9nKCAncmVwbzonLCByZXBvICk7XHJcblxyXG4gICAgY29uc3QgcHJvbWlzZXMgPSBbICdsaW50JywgJ3JlcG9ydC1tZWRpYScsICd0c2MnLCAncXVuaXQnLCAncGhldC1pby1hcGktY29tcGFyZScgXS5tYXAoIHRhc2sgPT4ge1xyXG4gICAgICByZXR1cm4gcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCB0YXNrLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IGV4ZWN1dGUoICdub2RlJywgW1xyXG4gICAgICAgICAgJy4uL2NoaXBwZXIvanMvc2NyaXB0cy9ob29rLXByZS1jb21taXQtdGFzay5qcycsXHJcbiAgICAgICAgICBgLS1jb21tYW5kPSR7dGFza31gLFxyXG4gICAgICAgICAgYC0tcmVwbz0ke3JlcG99YCxcclxuICAgICAgICAgIG91dHB1dFRvQ29uc29sZSA/ICctLWNvbnNvbGUnIDogJycgXSwgJy4uL2NoaXBwZXInLCB7XHJcbiAgICAgICAgICBlcnJvcnM6ICdyZXNvbHZlJ1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgICByZXN1bHRzLnN0ZG91dCAmJiByZXN1bHRzLnN0ZG91dC50cmltKCkubGVuZ3RoID4gMCAmJiBjb25zb2xlLmxvZyggcmVzdWx0cy5zdGRvdXQgKTtcclxuICAgICAgICByZXN1bHRzLnN0ZGVyciAmJiByZXN1bHRzLnN0ZGVyci50cmltKCkubGVuZ3RoID4gMCAmJiBjb25zb2xlLmxvZyggcmVzdWx0cy5zdGRlcnIgKTtcclxuXHJcbiAgICAgICAgaWYgKCByZXN1bHRzLmNvZGUgPT09IDAgKSB7XHJcbiAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBsZXQgbWVzc2FnZSA9ICdUYXNrIGZhaWxlZDogJyArIHRhc2s7XHJcbiAgICAgICAgICBpZiAoIHJlc3VsdHMuc3Rkb3V0ICYmIHJlc3VsdHMuc3Rkb3V0LnRyaW0oKS5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSArICcsICcgKyByZXN1bHRzLnN0ZG91dDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggcmVzdWx0cy5zdGRlcnIgJiYgcmVzdWx0cy5zdGRlcnIudHJpbSgpLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgJywgJyArIHJlc3VsdHMuc3RkZXJyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBtZXNzYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB7XHJcbiAgICAgICAgZGVwdGg6IDFcclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKCBwcm9taXNlcyApO1xyXG4gICAgICBjb25zb2xlLmxvZyggJ0FsbCB0YXNrcyBzdWNjZWVkZWQnICk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcblxyXG4gICAgICAvLyBFeGl0IGFzIHNvb24gYXMgYW55IG9uZSBwcm9taXNlIGZhaWxzXHJcbiAgICAgIC8vIEVhY2ggdGFzayBpcyByZXNwb25zaWJsZSBmb3Igb3V0cHV0dGluZyBpdHMgZXJyb3IgdG8gdGhlIGNvbnNvbGUsIHNvIHRoZSBjb25zb2xlIHNob3VsZCBhbHJlYWR5XHJcbiAgICAgIC8vIGJlIHNob3dpbmcgdGhlIGVycm9yIGJ5IG5vd1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJIGlzIHByZXZlbnRpbmcgZXhpdCBmb3IgdW5rbm93biByZWFzb25zLCBzbyBtYW51YWxseSBleGl0IGhlcmVcclxuICBwaGV0VGltaW5nTG9nLmNsb3NlKCAoKSA9PiBwcm9jZXNzLmV4aXQoIHByZWNvbW1pdFN1Y2Nlc3MgPyAwIDogMSApICk7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxJQUFJLEdBQUdDLE9BQU8sQ0FBRSxNQUFPLENBQUM7QUFDOUIsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsNENBQTZDLENBQUM7QUFDdkUsTUFBTUUsYUFBYSxHQUFHRixPQUFPLENBQUUsa0RBQW1ELENBQUM7QUFFbkYsQ0FBRSxZQUFZO0VBRVo7RUFDQSxNQUFNRyxJQUFJLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFFUCxJQUFJLENBQUNRLEdBQUksQ0FBQyxDQUFDQyxHQUFHLENBQUMsQ0FBQztFQUVsRCxNQUFNQyxnQkFBZ0IsR0FBRyxNQUFNUCxhQUFhLENBQUNRLFVBQVUsQ0FBRyx5QkFBd0JQLElBQUssR0FBRSxFQUFFLFlBQVk7SUFFckc7SUFDQSxNQUFNUSxvQkFBb0IsR0FBR1AsT0FBTyxDQUFDUSxJQUFJLENBQUNDLEtBQUssQ0FBRSxDQUFFLENBQUM7SUFDcEQsTUFBTUMsZUFBZSxHQUFHSCxvQkFBb0IsQ0FBQ0ksUUFBUSxDQUFFLFdBQVksQ0FBQztJQUNwRUQsZUFBZSxJQUFJ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