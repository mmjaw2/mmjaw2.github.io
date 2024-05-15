// Copyright 2021, University of Colorado Boulder

/**
 * Continuously running Studio fuzzing for testing
 *
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const puppeteerLoad = require('../common/puppeteerLoad');
const withServer = require('../common/withServer');
const path = require('path');
(async () => {
  while (true) {
    // eslint-disable-line no-constant-condition
    let studioFuzz = null;
    console.log('starting new fuzz');
    try {
      await withServer(async port => {
        const url = `http://localhost:${port}/studio/index.html?sim=states-of-matter&phetioElementsDisplay=all&fuzz`;
        await puppeteerLoad(url, {
          waitAfterLoad: 10000,
          allowedTimeToLoad: 120000,
          gotoTimeout: 120000,
          launchOptions: {
            // With this flag, temp files are written to /tmp/ on bayes, which caused https://github.com/phetsims/aqua/issues/145
            // /dev/shm/ is much bigger
            ignoreDefaultArgs: ['--disable-dev-shm-usage'],
            // Command line arguments passed to the chrome instance,
            args: ['--enable-precise-memory-info',
            // To prevent filling up `/tmp`, see https://github.com/phetsims/aqua/issues/145
            `--user-data-dir=${path.normalize(`${process.cwd()}/../tmp/puppeteerUserData/`)}`]
          }
        });
      });
    } catch (e) {
      studioFuzz = e;
    }
    console.log(studioFuzz);
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwdXBwZXRlZXJMb2FkIiwicmVxdWlyZSIsIndpdGhTZXJ2ZXIiLCJwYXRoIiwic3R1ZGlvRnV6eiIsImNvbnNvbGUiLCJsb2ciLCJwb3J0IiwidXJsIiwid2FpdEFmdGVyTG9hZCIsImFsbG93ZWRUaW1lVG9Mb2FkIiwiZ290b1RpbWVvdXQiLCJsYXVuY2hPcHRpb25zIiwiaWdub3JlRGVmYXVsdEFyZ3MiLCJhcmdzIiwibm9ybWFsaXplIiwicHJvY2VzcyIsImN3ZCIsImUiXSwic291cmNlcyI6WyJzdHVkaW8tZnV6ei5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29udGludW91c2x5IHJ1bm5pbmcgU3R1ZGlvIGZ1enppbmcgZm9yIHRlc3RpbmdcclxuICpcclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgcHVwcGV0ZWVyTG9hZCA9IHJlcXVpcmUoICcuLi9jb21tb24vcHVwcGV0ZWVyTG9hZCcgKTtcclxuY29uc3Qgd2l0aFNlcnZlciA9IHJlcXVpcmUoICcuLi9jb21tb24vd2l0aFNlcnZlcicgKTtcclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoICdwYXRoJyApO1xyXG5cclxuKCBhc3luYyAoKSA9PiB7XHJcblxyXG4gIHdoaWxlICggdHJ1ZSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cclxuICAgIGxldCBzdHVkaW9GdXp6ID0gbnVsbDtcclxuXHJcbiAgICBjb25zb2xlLmxvZyggJ3N0YXJ0aW5nIG5ldyBmdXp6JyApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHdpdGhTZXJ2ZXIoIGFzeW5jIHBvcnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vc3R1ZGlvL2luZGV4Lmh0bWw/c2ltPXN0YXRlcy1vZi1tYXR0ZXImcGhldGlvRWxlbWVudHNEaXNwbGF5PWFsbCZmdXp6YDtcclxuICAgICAgICBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwsIHtcclxuICAgICAgICAgIHdhaXRBZnRlckxvYWQ6IDEwMDAwLFxyXG4gICAgICAgICAgYWxsb3dlZFRpbWVUb0xvYWQ6IDEyMDAwMCxcclxuICAgICAgICAgIGdvdG9UaW1lb3V0OiAxMjAwMDAsXHJcbiAgICAgICAgICBsYXVuY2hPcHRpb25zOiB7XHJcblxyXG4gICAgICAgICAgICAvLyBXaXRoIHRoaXMgZmxhZywgdGVtcCBmaWxlcyBhcmUgd3JpdHRlbiB0byAvdG1wLyBvbiBiYXllcywgd2hpY2ggY2F1c2VkIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hcXVhL2lzc3Vlcy8xNDVcclxuICAgICAgICAgICAgLy8gL2Rldi9zaG0vIGlzIG11Y2ggYmlnZ2VyXHJcbiAgICAgICAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbICctLWRpc2FibGUtZGV2LXNobS11c2FnZScgXSxcclxuXHJcbiAgICAgICAgICAgIC8vIENvbW1hbmQgbGluZSBhcmd1bWVudHMgcGFzc2VkIHRvIHRoZSBjaHJvbWUgaW5zdGFuY2UsXHJcbiAgICAgICAgICAgIGFyZ3M6IFtcclxuICAgICAgICAgICAgICAnLS1lbmFibGUtcHJlY2lzZS1tZW1vcnktaW5mbycsXHJcblxyXG4gICAgICAgICAgICAgIC8vIFRvIHByZXZlbnQgZmlsbGluZyB1cCBgL3RtcGAsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXF1YS9pc3N1ZXMvMTQ1XHJcbiAgICAgICAgICAgICAgYC0tdXNlci1kYXRhLWRpcj0ke3BhdGgubm9ybWFsaXplKCBgJHtwcm9jZXNzLmN3ZCgpfS8uLi90bXAvcHVwcGV0ZWVyVXNlckRhdGEvYCApfWBcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgIHN0dWRpb0Z1enogPSBlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCBzdHVkaW9GdXp6ICk7XHJcbiAgfVxyXG59ICkoKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBRSx5QkFBMEIsQ0FBQztBQUMxRCxNQUFNQyxVQUFVLEdBQUdELE9BQU8sQ0FBRSxzQkFBdUIsQ0FBQztBQUNwRCxNQUFNRSxJQUFJLEdBQUdGLE9BQU8sQ0FBRSxNQUFPLENBQUM7QUFFOUIsQ0FBRSxZQUFZO0VBRVosT0FBUSxJQUFJLEVBQUc7SUFBRTtJQUNmLElBQUlHLFVBQVUsR0FBRyxJQUFJO0lBRXJCQyxPQUFPLENBQUNDLEdBQUcsQ0FBRSxtQkFBb0IsQ0FBQztJQUVsQyxJQUFJO01BQ0YsTUFBTUosVUFBVSxDQUFFLE1BQU1LLElBQUksSUFBSTtRQUM5QixNQUFNQyxHQUFHLEdBQUksb0JBQW1CRCxJQUFLLHdFQUF1RTtRQUM1RyxNQUFNUCxhQUFhLENBQUVRLEdBQUcsRUFBRTtVQUN4QkMsYUFBYSxFQUFFLEtBQUs7VUFDcEJDLGlCQUFpQixFQUFFLE1BQU07VUFDekJDLFdBQVcsRUFBRSxNQUFNO1VBQ25CQyxhQUFhLEVBQUU7WUFFYjtZQUNBO1lBQ0FDLGlCQUFpQixFQUFFLENBQUUseUJBQXlCLENBQUU7WUFFaEQ7WUFDQUMsSUFBSSxFQUFFLENBQ0osOEJBQThCO1lBRTlCO1lBQ0MsbUJBQWtCWCxJQUFJLENBQUNZLFNBQVMsQ0FBRyxHQUFFQyxPQUFPLENBQUNDLEdBQUcsQ0FBQyxDQUFFLDRCQUE0QixDQUFFLEVBQUM7VUFFdkY7UUFDRixDQUFFLENBQUM7TUFDTCxDQUFFLENBQUM7SUFDTCxDQUFDLENBQ0QsT0FBT0MsQ0FBQyxFQUFHO01BQ1RkLFVBQVUsR0FBR2MsQ0FBQztJQUNoQjtJQUVBYixPQUFPLENBQUNDLEdBQUcsQ0FBRUYsVUFBVyxDQUFDO0VBQzNCO0FBQ0YsQ0FBQyxFQUFHLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=