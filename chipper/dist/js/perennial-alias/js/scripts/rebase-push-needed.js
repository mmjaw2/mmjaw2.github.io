// Copyright 2021, University of Colorado Boulder

/**
 * Rebases and pushes repos that are ahead of origin, with consolidated status/error output.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('../common/execute');
const getActiveRepos = require('../common/getActiveRepos');
const gitIsClean = require('../common/gitIsClean');
const gitPullRebase = require('../common/gitPullRebase');
const gitPush = require('../common/gitPush');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
winston.default.transports.console.level = 'error';

// ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
const red = '\u001b[31m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
const repos = getActiveRepos();
const data = {};
let ok = true;
const rebasePushNeeded = async repo => {
  data[repo] = '';
  try {
    const symbolicRef = (await execute('git', ['symbolic-ref', '-q', 'HEAD'], `../${repo}`)).trim();
    const branch = symbolicRef.replace('refs/heads/', '');
    const trackShort = branch ? (await execute('git', ['for-each-ref', '--format=%(push:trackshort)', symbolicRef], `../${repo}`)).trim() : '';

    // If it's ahead at all
    if (trackShort.includes('>')) {
      if (await gitIsClean(repo)) {
        await gitPullRebase(repo);
      } else {
        data[repo] += `${red}${repo} not clean, skipping pull${reset}\n`;
      }
      if (branch) {
        await gitPush(repo, branch);
        data[repo] += `${green}${repo} pushed\n`;
      } else {
        data[repo] += `${red}${repo} no branch, skipping push${reset}\n`;
        ok = false;
      }
    }
  } catch (e) {
    data[repo] += `${repo} ERROR: ${e}\n`;
    ok = false;
  }
};
(async () => {
  await Promise.all(repos.map(repo => rebasePushNeeded(repo)));
  repos.forEach(repo => {
    process.stdout.write(data[repo]);
  });
  console.log(`\n${ok ? green : red}-----=====] finished [=====-----${reset}\n`);
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdldEFjdGl2ZVJlcG9zIiwiZ2l0SXNDbGVhbiIsImdpdFB1bGxSZWJhc2UiLCJnaXRQdXNoIiwid2luc3RvbiIsImRlZmF1bHQiLCJ0cmFuc3BvcnRzIiwiY29uc29sZSIsImxldmVsIiwicmVkIiwiZ3JlZW4iLCJyZXNldCIsInJlcG9zIiwiZGF0YSIsIm9rIiwicmViYXNlUHVzaE5lZWRlZCIsInJlcG8iLCJzeW1ib2xpY1JlZiIsInRyaW0iLCJicmFuY2giLCJyZXBsYWNlIiwidHJhY2tTaG9ydCIsImluY2x1ZGVzIiwiZSIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJmb3JFYWNoIiwicHJvY2VzcyIsInN0ZG91dCIsIndyaXRlIiwibG9nIl0sInNvdXJjZXMiOlsicmViYXNlLXB1c2gtbmVlZGVkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZWJhc2VzIGFuZCBwdXNoZXMgcmVwb3MgdGhhdCBhcmUgYWhlYWQgb2Ygb3JpZ2luLCB3aXRoIGNvbnNvbGlkYXRlZCBzdGF0dXMvZXJyb3Igb3V0cHV0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgZ2V0QWN0aXZlUmVwb3MgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dldEFjdGl2ZVJlcG9zJyApO1xyXG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRJc0NsZWFuJyApO1xyXG5jb25zdCBnaXRQdWxsUmViYXNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRQdWxsUmViYXNlJyApO1xyXG5jb25zdCBnaXRQdXNoID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRQdXNoJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG53aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbi8vIEFOU0kgZXNjYXBlIHNlcXVlbmNlcyB0byBtb3ZlIHRvIHRoZSByaWdodCAoaW4gdGhlIHNhbWUgbGluZSkgb3IgdG8gYXBwbHkgb3IgcmVzZXQgY29sb3JzXHJcbmNvbnN0IHJlZCA9ICdcXHUwMDFiWzMxbSc7XHJcbmNvbnN0IGdyZWVuID0gJ1xcdTAwMWJbMzJtJztcclxuY29uc3QgcmVzZXQgPSAnXFx1MDAxYlswbSc7XHJcblxyXG5jb25zdCByZXBvcyA9IGdldEFjdGl2ZVJlcG9zKCk7XHJcbmNvbnN0IGRhdGEgPSB7fTtcclxubGV0IG9rID0gdHJ1ZTtcclxuXHJcbmNvbnN0IHJlYmFzZVB1c2hOZWVkZWQgPSBhc3luYyByZXBvID0+IHtcclxuICBkYXRhWyByZXBvIF0gPSAnJztcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHN5bWJvbGljUmVmID0gKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnc3ltYm9saWMtcmVmJywgJy1xJywgJ0hFQUQnIF0sIGAuLi8ke3JlcG99YCApICkudHJpbSgpO1xyXG4gICAgY29uc3QgYnJhbmNoID0gc3ltYm9saWNSZWYucmVwbGFjZSggJ3JlZnMvaGVhZHMvJywgJycgKTtcclxuICAgIGNvbnN0IHRyYWNrU2hvcnQgPSBicmFuY2ggPyAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdmb3ItZWFjaC1yZWYnLCAnLS1mb3JtYXQ9JShwdXNoOnRyYWNrc2hvcnQpJywgc3ltYm9saWNSZWYgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCkgOiAnJztcclxuXHJcbiAgICAvLyBJZiBpdCdzIGFoZWFkIGF0IGFsbFxyXG4gICAgaWYgKCB0cmFja1Nob3J0LmluY2x1ZGVzKCAnPicgKSApIHtcclxuICAgICAgaWYgKCBhd2FpdCBnaXRJc0NsZWFuKCByZXBvICkgKSB7XHJcbiAgICAgICAgYXdhaXQgZ2l0UHVsbFJlYmFzZSggcmVwbyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGRhdGFbIHJlcG8gXSArPSBgJHtyZWR9JHtyZXBvfSBub3QgY2xlYW4sIHNraXBwaW5nIHB1bGwke3Jlc2V0fVxcbmA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggYnJhbmNoICkge1xyXG4gICAgICAgIGF3YWl0IGdpdFB1c2goIHJlcG8sIGJyYW5jaCApO1xyXG4gICAgICAgIGRhdGFbIHJlcG8gXSArPSBgJHtncmVlbn0ke3JlcG99IHB1c2hlZFxcbmA7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZGF0YVsgcmVwbyBdICs9IGAke3JlZH0ke3JlcG99IG5vIGJyYW5jaCwgc2tpcHBpbmcgcHVzaCR7cmVzZXR9XFxuYDtcclxuICAgICAgICBvayA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgZGF0YVsgcmVwbyBdICs9IGAke3JlcG99IEVSUk9SOiAke2V9XFxuYDtcclxuICAgIG9rID0gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuKCBhc3luYyAoKSA9PiB7XHJcbiAgYXdhaXQgUHJvbWlzZS5hbGwoIHJlcG9zLm1hcCggcmVwbyA9PiByZWJhc2VQdXNoTmVlZGVkKCByZXBvICkgKSApO1xyXG5cclxuICByZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKCBkYXRhWyByZXBvIF0gKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnNvbGUubG9nKCBgXFxuJHtvayA/IGdyZWVuIDogcmVkfS0tLS0tPT09PT1dIGZpbmlzaGVkIFs9PT09PS0tLS0tJHtyZXNldH1cXG5gICk7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7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