// Copyright 2021, University of Colorado Boulder
// this is a file that runs in node
// it compares all the dependencies from one project to another project.
// Assumes you have a clean working copy, in case you are checking out shas
// @author Sam Reid (PhET Interactive Simulations)

// import fs
const fs = require('fs');
// import assert
const assert = require('assert');

// Parse the command line arguments
const args = process.argv.slice(2);

// The first command line argument is the first project for comparison
const project1 = args[0];

// The second command line argument is the second project for comparison
const project2 = args[1];

// Assert that both project one and project to are defined
assert(project1, 'project1 is not defined');
assert(project2, 'project2 is not defined');
function loadDependenciesForProject(project) {
  // If project contains a #, Then the first part is the directories and the second part is the branch name
  const directory = project.split('@')[0];

  // Get the branch or SHA name
  const target = project.split('@')[1];

  // Print the project one directories and project one branch
  //   console.log( 'project1Directories', directory );
  //   console.log( 'project1Branch', target );

  // If there is a branch name specified, fork and execute a command that will check out that branch in that directories
  if (target) {
    const command = `git -C ${directory} checkout ${target}`;
    // console.log( 'command', command );
    require('child_process').execSync(command);
  }

  // Load dependencies.json from relative path one and parse it as JSON
  const dependencies = JSON.parse(fs.readFileSync(`${directory}/dependencies.json`));
  return dependencies;
}
const dependencies1 = loadDependenciesForProject(project1);
const dependencies2 = loadDependenciesForProject(project2);
const allKeys = [...Object.keys(dependencies1), ...Object.keys(dependencies2)].filter(repo => repo !== 'comment');
const issues = new Set();
let commitCount = 0;

// Iterate over the keys they have in common
allKeys.forEach(repo => {
  // If the key is in dependencies two
  if (dependencies1[repo] && dependencies2[repo]) {
    // Print the key and the version
    // console.log( `${repo} ${dependencies1[ repo ].sha} ${dependencies2[ repo ].sha}` );

    // If the shas are the same, print a message to the console that the shas are the same
    if (dependencies1[repo].sha === dependencies2[repo].sha) {
      console.log(`# ${repo}`);
      console.log('SHAs are the same');
      console.log();
    } else {
      // We know the shas are different, and we want to compare them using `git log --oneline --ancestry-path`
      const command = `git -C ../${repo} log --oneline --ancestry-path ${dependencies1[repo].sha}..${dependencies2[repo].sha}`;

      // Run that command synchronously
      const buffer = require('child_process').execSync(command);

      // Convert the buffer to a string and print it out
      console.log(`# ${repo}`);
      const bufferString = buffer.toString();
      console.log(bufferString);

      // Split the buffer string into lines
      const lines = bufferString.split('\n');
      console.log(lines.length);
      lines.forEach(line => {
        // If the line contains https://github.com/phetsims/ then add it to the set.
        if (line.includes('https://github.com/phetsims/') && !line.includes('Merge branch \'main\'')) {
          // Find the URL in line using a regular expression
          const url = line.substring(line.indexOf('https://github.com/phetsims/'));
          issues.add(url);
        }
        if (line.trim().length > 0) {
          commitCount++;
        }
      });
    }
  } else {
    console.log(`# ${repo}`);
    console.log(`Did not appear in both dependencies. project1=${dependencies1[repo]}, project2=${dependencies2[repo]}`);
    console.log();
  }
});
console.log('Discovered issues');
console.log(Array.from(issues).sort().join('\n'));
console.log(`${commitCount} commits referenced ${issues.size} separate issues`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJhc3NlcnQiLCJhcmdzIiwicHJvY2VzcyIsImFyZ3YiLCJzbGljZSIsInByb2plY3QxIiwicHJvamVjdDIiLCJsb2FkRGVwZW5kZW5jaWVzRm9yUHJvamVjdCIsInByb2plY3QiLCJkaXJlY3RvcnkiLCJzcGxpdCIsInRhcmdldCIsImNvbW1hbmQiLCJleGVjU3luYyIsImRlcGVuZGVuY2llcyIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImRlcGVuZGVuY2llczEiLCJkZXBlbmRlbmNpZXMyIiwiYWxsS2V5cyIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJyZXBvIiwiaXNzdWVzIiwiU2V0IiwiY29tbWl0Q291bnQiLCJmb3JFYWNoIiwic2hhIiwiY29uc29sZSIsImxvZyIsImJ1ZmZlciIsImJ1ZmZlclN0cmluZyIsInRvU3RyaW5nIiwibGluZXMiLCJsZW5ndGgiLCJsaW5lIiwiaW5jbHVkZXMiLCJ1cmwiLCJzdWJzdHJpbmciLCJpbmRleE9mIiwiYWRkIiwidHJpbSIsIkFycmF5IiwiZnJvbSIsInNvcnQiLCJqb2luIiwic2l6ZSJdLCJzb3VyY2VzIjpbImNvbXBhcmUtZGVwZW5kZW5jaWVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLy8gdGhpcyBpcyBhIGZpbGUgdGhhdCBydW5zIGluIG5vZGVcclxuLy8gaXQgY29tcGFyZXMgYWxsIHRoZSBkZXBlbmRlbmNpZXMgZnJvbSBvbmUgcHJvamVjdCB0byBhbm90aGVyIHByb2plY3QuXHJcbi8vIEFzc3VtZXMgeW91IGhhdmUgYSBjbGVhbiB3b3JraW5nIGNvcHksIGluIGNhc2UgeW91IGFyZSBjaGVja2luZyBvdXQgc2hhc1xyXG4vLyBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG5cclxuLy8gaW1wb3J0IGZzXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG4vLyBpbXBvcnQgYXNzZXJ0XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcblxyXG4vLyBQYXJzZSB0aGUgY29tbWFuZCBsaW5lIGFyZ3VtZW50c1xyXG5jb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XHJcblxyXG4vLyBUaGUgZmlyc3QgY29tbWFuZCBsaW5lIGFyZ3VtZW50IGlzIHRoZSBmaXJzdCBwcm9qZWN0IGZvciBjb21wYXJpc29uXHJcbmNvbnN0IHByb2plY3QxID0gYXJnc1sgMCBdO1xyXG5cclxuLy8gVGhlIHNlY29uZCBjb21tYW5kIGxpbmUgYXJndW1lbnQgaXMgdGhlIHNlY29uZCBwcm9qZWN0IGZvciBjb21wYXJpc29uXHJcbmNvbnN0IHByb2plY3QyID0gYXJnc1sgMSBdO1xyXG5cclxuLy8gQXNzZXJ0IHRoYXQgYm90aCBwcm9qZWN0IG9uZSBhbmQgcHJvamVjdCB0byBhcmUgZGVmaW5lZFxyXG5hc3NlcnQoIHByb2plY3QxLCAncHJvamVjdDEgaXMgbm90IGRlZmluZWQnICk7XHJcbmFzc2VydCggcHJvamVjdDIsICdwcm9qZWN0MiBpcyBub3QgZGVmaW5lZCcgKTtcclxuXHJcbmZ1bmN0aW9uIGxvYWREZXBlbmRlbmNpZXNGb3JQcm9qZWN0KCBwcm9qZWN0ICkge1xyXG5cclxuLy8gSWYgcHJvamVjdCBjb250YWlucyBhICMsIFRoZW4gdGhlIGZpcnN0IHBhcnQgaXMgdGhlIGRpcmVjdG9yaWVzIGFuZCB0aGUgc2Vjb25kIHBhcnQgaXMgdGhlIGJyYW5jaCBuYW1lXHJcbiAgY29uc3QgZGlyZWN0b3J5ID0gcHJvamVjdC5zcGxpdCggJ0AnIClbIDAgXTtcclxuXHJcbi8vIEdldCB0aGUgYnJhbmNoIG9yIFNIQSBuYW1lXHJcbiAgY29uc3QgdGFyZ2V0ID0gcHJvamVjdC5zcGxpdCggJ0AnIClbIDEgXTtcclxuXHJcbi8vIFByaW50IHRoZSBwcm9qZWN0IG9uZSBkaXJlY3RvcmllcyBhbmQgcHJvamVjdCBvbmUgYnJhbmNoXHJcbi8vICAgY29uc29sZS5sb2coICdwcm9qZWN0MURpcmVjdG9yaWVzJywgZGlyZWN0b3J5ICk7XHJcbi8vICAgY29uc29sZS5sb2coICdwcm9qZWN0MUJyYW5jaCcsIHRhcmdldCApO1xyXG5cclxuLy8gSWYgdGhlcmUgaXMgYSBicmFuY2ggbmFtZSBzcGVjaWZpZWQsIGZvcmsgYW5kIGV4ZWN1dGUgYSBjb21tYW5kIHRoYXQgd2lsbCBjaGVjayBvdXQgdGhhdCBicmFuY2ggaW4gdGhhdCBkaXJlY3Rvcmllc1xyXG4gIGlmICggdGFyZ2V0ICkge1xyXG4gICAgY29uc3QgY29tbWFuZCA9IGBnaXQgLUMgJHtkaXJlY3Rvcnl9IGNoZWNrb3V0ICR7dGFyZ2V0fWA7XHJcbiAgICAvLyBjb25zb2xlLmxvZyggJ2NvbW1hbmQnLCBjb21tYW5kICk7XHJcbiAgICByZXF1aXJlKCAnY2hpbGRfcHJvY2VzcycgKS5leGVjU3luYyggY29tbWFuZCApO1xyXG4gIH1cclxuXHJcbi8vIExvYWQgZGVwZW5kZW5jaWVzLmpzb24gZnJvbSByZWxhdGl2ZSBwYXRoIG9uZSBhbmQgcGFyc2UgaXQgYXMgSlNPTlxyXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYCR7ZGlyZWN0b3J5fS9kZXBlbmRlbmNpZXMuanNvbmAgKSApO1xyXG5cclxuICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG59XHJcblxyXG5jb25zdCBkZXBlbmRlbmNpZXMxID0gbG9hZERlcGVuZGVuY2llc0ZvclByb2plY3QoIHByb2plY3QxICk7XHJcbmNvbnN0IGRlcGVuZGVuY2llczIgPSBsb2FkRGVwZW5kZW5jaWVzRm9yUHJvamVjdCggcHJvamVjdDIgKTtcclxuXHJcbmNvbnN0IGFsbEtleXMgPSBbIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMxICksIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMyICkgXS5maWx0ZXIoIHJlcG8gPT4gcmVwbyAhPT0gJ2NvbW1lbnQnICk7XHJcblxyXG5jb25zdCBpc3N1ZXMgPSBuZXcgU2V0KCk7XHJcbmxldCBjb21taXRDb3VudCA9IDA7XHJcblxyXG4vLyBJdGVyYXRlIG92ZXIgdGhlIGtleXMgdGhleSBoYXZlIGluIGNvbW1vblxyXG5hbGxLZXlzLmZvckVhY2goIHJlcG8gPT4ge1xyXG5cclxuICAvLyBJZiB0aGUga2V5IGlzIGluIGRlcGVuZGVuY2llcyB0d29cclxuICBpZiAoIGRlcGVuZGVuY2llczFbIHJlcG8gXSAmJiBkZXBlbmRlbmNpZXMyWyByZXBvIF0gKSB7XHJcblxyXG4gICAgLy8gUHJpbnQgdGhlIGtleSBhbmQgdGhlIHZlcnNpb25cclxuICAgIC8vIGNvbnNvbGUubG9nKCBgJHtyZXBvfSAke2RlcGVuZGVuY2llczFbIHJlcG8gXS5zaGF9ICR7ZGVwZW5kZW5jaWVzMlsgcmVwbyBdLnNoYX1gICk7XHJcblxyXG4gICAgLy8gSWYgdGhlIHNoYXMgYXJlIHRoZSBzYW1lLCBwcmludCBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgdGhhdCB0aGUgc2hhcyBhcmUgdGhlIHNhbWVcclxuICAgIGlmICggZGVwZW5kZW5jaWVzMVsgcmVwbyBdLnNoYSA9PT0gZGVwZW5kZW5jaWVzMlsgcmVwbyBdLnNoYSApIHtcclxuICAgICAgY29uc29sZS5sb2coIGAjICR7cmVwb31gICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCAnU0hBcyBhcmUgdGhlIHNhbWUnICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFdlIGtub3cgdGhlIHNoYXMgYXJlIGRpZmZlcmVudCwgYW5kIHdlIHdhbnQgdG8gY29tcGFyZSB0aGVtIHVzaW5nIGBnaXQgbG9nIC0tb25lbGluZSAtLWFuY2VzdHJ5LXBhdGhgXHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgZ2l0IC1DIC4uLyR7cmVwb30gbG9nIC0tb25lbGluZSAtLWFuY2VzdHJ5LXBhdGggJHtkZXBlbmRlbmNpZXMxWyByZXBvIF0uc2hhfS4uJHtkZXBlbmRlbmNpZXMyWyByZXBvIF0uc2hhfWA7XHJcblxyXG4gICAgICAvLyBSdW4gdGhhdCBjb21tYW5kIHN5bmNocm9ub3VzbHlcclxuICAgICAgY29uc3QgYnVmZmVyID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICkuZXhlY1N5bmMoIGNvbW1hbmQgKTtcclxuXHJcbiAgICAgIC8vIENvbnZlcnQgdGhlIGJ1ZmZlciB0byBhIHN0cmluZyBhbmQgcHJpbnQgaXQgb3V0XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgIyAke3JlcG99YCApO1xyXG4gICAgICBjb25zdCBidWZmZXJTdHJpbmcgPSBidWZmZXIudG9TdHJpbmcoKTtcclxuICAgICAgY29uc29sZS5sb2coIGJ1ZmZlclN0cmluZyApO1xyXG5cclxuICAgICAgLy8gU3BsaXQgdGhlIGJ1ZmZlciBzdHJpbmcgaW50byBsaW5lc1xyXG4gICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlclN0cmluZy5zcGxpdCggJ1xcbicgKTtcclxuICAgICAgY29uc29sZS5sb2coIGxpbmVzLmxlbmd0aCApO1xyXG4gICAgICBsaW5lcy5mb3JFYWNoKCBsaW5lID0+IHtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIGxpbmUgY29udGFpbnMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyB0aGVuIGFkZCBpdCB0byB0aGUgc2V0LlxyXG4gICAgICAgIGlmICggbGluZS5pbmNsdWRlcyggJ2h0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8nICkgJiYgIWxpbmUuaW5jbHVkZXMoICdNZXJnZSBicmFuY2ggXFwnbWFpblxcJycgKSApIHtcclxuXHJcbiAgICAgICAgICAvLyBGaW5kIHRoZSBVUkwgaW4gbGluZSB1c2luZyBhIHJlZ3VsYXIgZXhwcmVzc2lvblxyXG4gICAgICAgICAgY29uc3QgdXJsID0gbGluZS5zdWJzdHJpbmcoIGxpbmUuaW5kZXhPZiggJ2h0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8nICkgKTtcclxuXHJcbiAgICAgICAgICBpc3N1ZXMuYWRkKCB1cmwgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggbGluZS50cmltKCkubGVuZ3RoID4gMCApIHtcclxuICAgICAgICAgIGNvbW1pdENvdW50Kys7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc29sZS5sb2coIGAjICR7cmVwb31gICk7XHJcbiAgICBjb25zb2xlLmxvZyggYERpZCBub3QgYXBwZWFyIGluIGJvdGggZGVwZW5kZW5jaWVzLiBwcm9qZWN0MT0ke2RlcGVuZGVuY2llczFbIHJlcG8gXX0sIHByb2plY3QyPSR7ZGVwZW5kZW5jaWVzMlsgcmVwbyBdfWAgKTtcclxuICAgIGNvbnNvbGUubG9nKCk7XHJcbiAgfVxyXG59ICk7XHJcblxyXG5jb25zb2xlLmxvZyggJ0Rpc2NvdmVyZWQgaXNzdWVzJyApO1xyXG5jb25zb2xlLmxvZyggQXJyYXkuZnJvbSggaXNzdWVzICkuc29ydCgpLmpvaW4oICdcXG4nICkgKTtcclxuXHJcbmNvbnNvbGUubG9nKCBgJHtjb21taXRDb3VudH0gY29tbWl0cyByZWZlcmVuY2VkICR7aXNzdWVzLnNpemV9IHNlcGFyYXRlIGlzc3Vlc2AgKTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUI7QUFDQSxNQUFNQyxNQUFNLEdBQUdELE9BQU8sQ0FBRSxRQUFTLENBQUM7O0FBRWxDO0FBQ0EsTUFBTUUsSUFBSSxHQUFHQyxPQUFPLENBQUNDLElBQUksQ0FBQ0MsS0FBSyxDQUFFLENBQUUsQ0FBQzs7QUFFcEM7QUFDQSxNQUFNQyxRQUFRLEdBQUdKLElBQUksQ0FBRSxDQUFDLENBQUU7O0FBRTFCO0FBQ0EsTUFBTUssUUFBUSxHQUFHTCxJQUFJLENBQUUsQ0FBQyxDQUFFOztBQUUxQjtBQUNBRCxNQUFNLENB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