// Copyright 2022-2023, University of Colorado Boulder

/**
 * Cache the results of processes so that they don't need to be re-run if there have been no changes.
 * For instance, this can speed up tsc, lint and unit tests. This also streamlines the precommit hooks
 * by avoiding duplicated work.
 *
 * The CacheLayer only works if the watch process is checking for changed files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const fs = require('fs');
const readCacheLayerJSON = () => {
  try {
    return JSON.parse(fs.readFileSync('../chipper/dist/cache-layer.json'));
  } catch (e) {
    return {};
  }
};
const LATEST_CHANGE_TIMESTAMP_KEY = 'latestChangeTimestamp';
const writeFileAsJSON = json => {
  fs.writeFileSync('../chipper/dist/cache-layer.json', JSON.stringify(json, null, 2));
};
module.exports = {
  // When the watch process exits, invalidate the caches until the watch process resumes
  clearLastChangedTimestamp() {
    const json = readCacheLayerJSON();
    delete json[LATEST_CHANGE_TIMESTAMP_KEY];
    writeFileAsJSON(json);
  },
  // Invalidate caches when a relevant file changes
  updateLastChangedTimestamp() {
    const json = readCacheLayerJSON();
    json[LATEST_CHANGE_TIMESTAMP_KEY] = Date.now();
    writeFileAsJSON(json);
  },
  // When a process succeeds, save the timestamp
  onSuccess(keyName) {
    const json = readCacheLayerJSON();
    json.cache = json.cache || {};
    json.cache[keyName] = Date.now();
    writeFileAsJSON(json);
  },
  // Check whether we need to re-run a process
  isCacheStale(keyName) {
    return !this.isCacheSafe(keyName);
  },
  /**
   * @param {string} keyName
   * @returns {boolean} - true if a cache hit
   */
  isCacheSafe(keyName) {
    const json = readCacheLayerJSON();
    const time = json.cache && json.cache[keyName];
    const lastChanged = json[LATEST_CHANGE_TIMESTAMP_KEY];
    if (typeof time === 'number' && typeof lastChanged === 'number' && lastChanged < time) {
      return true;
    } else {
      return false;
    }
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJyZWFkQ2FjaGVMYXllckpTT04iLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJlIiwiTEFURVNUX0NIQU5HRV9USU1FU1RBTVBfS0VZIiwid3JpdGVGaWxlQXNKU09OIiwianNvbiIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJtb2R1bGUiLCJleHBvcnRzIiwiY2xlYXJMYXN0Q2hhbmdlZFRpbWVzdGFtcCIsInVwZGF0ZUxhc3RDaGFuZ2VkVGltZXN0YW1wIiwiRGF0ZSIsIm5vdyIsIm9uU3VjY2VzcyIsImtleU5hbWUiLCJjYWNoZSIsImlzQ2FjaGVTdGFsZSIsImlzQ2FjaGVTYWZlIiwidGltZSIsImxhc3RDaGFuZ2VkIl0sInNvdXJjZXMiOlsiQ2FjaGVMYXllci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDYWNoZSB0aGUgcmVzdWx0cyBvZiBwcm9jZXNzZXMgc28gdGhhdCB0aGV5IGRvbid0IG5lZWQgdG8gYmUgcmUtcnVuIGlmIHRoZXJlIGhhdmUgYmVlbiBubyBjaGFuZ2VzLlxyXG4gKiBGb3IgaW5zdGFuY2UsIHRoaXMgY2FuIHNwZWVkIHVwIHRzYywgbGludCBhbmQgdW5pdCB0ZXN0cy4gVGhpcyBhbHNvIHN0cmVhbWxpbmVzIHRoZSBwcmVjb21taXQgaG9va3NcclxuICogYnkgYXZvaWRpbmcgZHVwbGljYXRlZCB3b3JrLlxyXG4gKlxyXG4gKiBUaGUgQ2FjaGVMYXllciBvbmx5IHdvcmtzIGlmIHRoZSB3YXRjaCBwcm9jZXNzIGlzIGNoZWNraW5nIGZvciBjaGFuZ2VkIGZpbGVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuY29uc3QgcmVhZENhY2hlTGF5ZXJKU09OID0gKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCAnLi4vY2hpcHBlci9kaXN0L2NhY2hlLWxheWVyLmpzb24nICkgKTtcclxuICB9XHJcbiAgY2F0Y2goIGUgKSB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgTEFURVNUX0NIQU5HRV9USU1FU1RBTVBfS0VZID0gJ2xhdGVzdENoYW5nZVRpbWVzdGFtcCc7XHJcblxyXG5jb25zdCB3cml0ZUZpbGVBc0pTT04gPSBqc29uID0+IHtcclxuICBmcy53cml0ZUZpbGVTeW5jKCAnLi4vY2hpcHBlci9kaXN0L2NhY2hlLWxheWVyLmpzb24nLCBKU09OLnN0cmluZ2lmeSgganNvbiwgbnVsbCwgMiApICk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgLy8gV2hlbiB0aGUgd2F0Y2ggcHJvY2VzcyBleGl0cywgaW52YWxpZGF0ZSB0aGUgY2FjaGVzIHVudGlsIHRoZSB3YXRjaCBwcm9jZXNzIHJlc3VtZXNcclxuICBjbGVhckxhc3RDaGFuZ2VkVGltZXN0YW1wKCkge1xyXG4gICAgY29uc3QganNvbiA9IHJlYWRDYWNoZUxheWVySlNPTigpO1xyXG4gICAgZGVsZXRlIGpzb25bIExBVEVTVF9DSEFOR0VfVElNRVNUQU1QX0tFWSBdO1xyXG4gICAgd3JpdGVGaWxlQXNKU09OKCBqc29uICk7XHJcbiAgfSxcclxuXHJcbiAgLy8gSW52YWxpZGF0ZSBjYWNoZXMgd2hlbiBhIHJlbGV2YW50IGZpbGUgY2hhbmdlc1xyXG4gIHVwZGF0ZUxhc3RDaGFuZ2VkVGltZXN0YW1wKCkge1xyXG4gICAgY29uc3QganNvbiA9IHJlYWRDYWNoZUxheWVySlNPTigpO1xyXG4gICAganNvblsgTEFURVNUX0NIQU5HRV9USU1FU1RBTVBfS0VZIF0gPSBEYXRlLm5vdygpO1xyXG4gICAgd3JpdGVGaWxlQXNKU09OKCBqc29uICk7XHJcbiAgfSxcclxuXHJcbiAgLy8gV2hlbiBhIHByb2Nlc3Mgc3VjY2VlZHMsIHNhdmUgdGhlIHRpbWVzdGFtcFxyXG4gIG9uU3VjY2Vzcygga2V5TmFtZSApIHtcclxuICAgIGNvbnN0IGpzb24gPSByZWFkQ2FjaGVMYXllckpTT04oKTtcclxuICAgIGpzb24uY2FjaGUgPSBqc29uLmNhY2hlIHx8IHt9O1xyXG4gICAganNvbi5jYWNoZVsga2V5TmFtZSBdID0gRGF0ZS5ub3coKTtcclxuICAgIHdyaXRlRmlsZUFzSlNPTigganNvbiApO1xyXG4gIH0sXHJcblxyXG4gIC8vIENoZWNrIHdoZXRoZXIgd2UgbmVlZCB0byByZS1ydW4gYSBwcm9jZXNzXHJcbiAgaXNDYWNoZVN0YWxlKCBrZXlOYW1lICkge1xyXG4gICAgcmV0dXJuICF0aGlzLmlzQ2FjaGVTYWZlKCBrZXlOYW1lICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleU5hbWVcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSB0cnVlIGlmIGEgY2FjaGUgaGl0XHJcbiAgICovXHJcbiAgaXNDYWNoZVNhZmUoIGtleU5hbWUgKSB7XHJcbiAgICBjb25zdCBqc29uID0gcmVhZENhY2hlTGF5ZXJKU09OKCk7XHJcbiAgICBjb25zdCB0aW1lID0ganNvbi5jYWNoZSAmJiBqc29uLmNhY2hlWyBrZXlOYW1lIF07XHJcbiAgICBjb25zdCBsYXN0Q2hhbmdlZCA9IGpzb25bIExBVEVTVF9DSEFOR0VfVElNRVNUQU1QX0tFWSBdO1xyXG4gICAgaWYgKCB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGxhc3RDaGFuZ2VkID09PSAnbnVtYmVyJyAmJiBsYXN0Q2hhbmdlZCA8IHRpbWUgKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbn07Il0sIm1hcHBpbmdz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