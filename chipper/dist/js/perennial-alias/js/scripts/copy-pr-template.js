// Copyright 2023, University of Colorado Boulder

/**
 * Copy the pull request template to the core set of common repos.
 * This script is meant to be run in the root of the PhET project
 * directory.
 *
 * @author Liam Mulhall <liammulh@gmail.com>
 */

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

// eslint-disable-next-line default-import-match-filename
import coreCommonRepos from './core-common-repos.js';
import { join, dirname } from 'node:path';
import { cwd, chdir } from 'node:process';
const pathToPrTemplate = join(cwd(), 'community', '.github', 'pull_request_template.md');
for (const repo of coreCommonRepos) {
  const dest = join(cwd(), repo, '.github', 'pull_request_template.md');
  const destDir = dirname(dest);
  const destDirDoesNotExist = !existsSync(destDir);
  if (destDirDoesNotExist) {
    mkdirSync(destDir, {
      recursive: true
    });
  }
  copyFileSync(pathToPrTemplate, dest);
  chdir(repo);
  const commitMessage = '"automated commit from phetsims/community; adding PR template, see https://github.com/phetsims/community/issues/9"';
  const commands = ['git pull origin main', 'git add .github', `git commit --message ${commitMessage} --no-verify`, 'git push origin main'];
  for (const command of commands) {
    console.log(`executing command: ${command}`);
    execSync(command);
  }
  console.log('going back one directory');
  chdir('..');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjU3luYyIsImNvcHlGaWxlU3luYyIsImV4aXN0c1N5bmMiLCJta2RpclN5bmMiLCJjb3JlQ29tbW9uUmVwb3MiLCJqb2luIiwiZGlybmFtZSIsImN3ZCIsImNoZGlyIiwicGF0aFRvUHJUZW1wbGF0ZSIsInJlcG8iLCJkZXN0IiwiZGVzdERpciIsImRlc3REaXJEb2VzTm90RXhpc3QiLCJyZWN1cnNpdmUiLCJjb21taXRNZXNzYWdlIiwiY29tbWFuZHMiLCJjb21tYW5kIiwiY29uc29sZSIsImxvZyJdLCJzb3VyY2VzIjpbImNvcHktcHItdGVtcGxhdGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvcHkgdGhlIHB1bGwgcmVxdWVzdCB0ZW1wbGF0ZSB0byB0aGUgY29yZSBzZXQgb2YgY29tbW9uIHJlcG9zLlxyXG4gKiBUaGlzIHNjcmlwdCBpcyBtZWFudCB0byBiZSBydW4gaW4gdGhlIHJvb3Qgb2YgdGhlIFBoRVQgcHJvamVjdFxyXG4gKiBkaXJlY3RvcnkuXHJcbiAqXHJcbiAqIEBhdXRob3IgTGlhbSBNdWxoYWxsIDxsaWFtbXVsaEBnbWFpbC5jb20+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdub2RlOmNoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIGV4aXN0c1N5bmMsIG1rZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xyXG5cclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGRlZmF1bHQtaW1wb3J0LW1hdGNoLWZpbGVuYW1lXHJcbmltcG9ydCBjb3JlQ29tbW9uUmVwb3MgZnJvbSAnLi9jb3JlLWNvbW1vbi1yZXBvcy5qcyc7XHJcbmltcG9ydCB7IGpvaW4sIGRpcm5hbWUgfSBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgeyBjd2QsIGNoZGlyIH0gZnJvbSAnbm9kZTpwcm9jZXNzJztcclxuXHJcbmNvbnN0IHBhdGhUb1ByVGVtcGxhdGUgPSBqb2luKCBjd2QoKSwgJ2NvbW11bml0eScsICcuZ2l0aHViJywgJ3B1bGxfcmVxdWVzdF90ZW1wbGF0ZS5tZCcgKTtcclxuXHJcbmZvciAoIGNvbnN0IHJlcG8gb2YgY29yZUNvbW1vblJlcG9zICkge1xyXG4gIGNvbnN0IGRlc3QgPSBqb2luKCBjd2QoKSwgcmVwbywgJy5naXRodWInLCAncHVsbF9yZXF1ZXN0X3RlbXBsYXRlLm1kJyApO1xyXG4gIGNvbnN0IGRlc3REaXIgPSBkaXJuYW1lKCBkZXN0ICk7XHJcbiAgY29uc3QgZGVzdERpckRvZXNOb3RFeGlzdCA9ICFleGlzdHNTeW5jKCBkZXN0RGlyICk7XHJcbiAgaWYgKCBkZXN0RGlyRG9lc05vdEV4aXN0ICkge1xyXG4gICAgbWtkaXJTeW5jKCBkZXN0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9ICk7XHJcbiAgfVxyXG4gIGNvcHlGaWxlU3luYyggcGF0aFRvUHJUZW1wbGF0ZSwgZGVzdCApO1xyXG4gIGNoZGlyKCByZXBvICk7XHJcbiAgY29uc3QgY29tbWl0TWVzc2FnZSA9ICdcImF1dG9tYXRlZCBjb21taXQgZnJvbSBwaGV0c2ltcy9jb21tdW5pdHk7IGFkZGluZyBQUiB0ZW1wbGF0ZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jb21tdW5pdHkvaXNzdWVzLzlcIic7XHJcbiAgY29uc3QgY29tbWFuZHMgPSBbXHJcbiAgICAnZ2l0IHB1bGwgb3JpZ2luIG1haW4nLFxyXG4gICAgJ2dpdCBhZGQgLmdpdGh1YicsXHJcbiAgICBgZ2l0IGNvbW1pdCAtLW1lc3NhZ2UgJHtjb21taXRNZXNzYWdlfSAtLW5vLXZlcmlmeWAsXHJcbiAgICAnZ2l0IHB1c2ggb3JpZ2luIG1haW4nXHJcbiAgXTtcclxuICBmb3IgKCBjb25zdCBjb21tYW5kIG9mIGNvbW1hbmRzICkge1xyXG4gICAgY29uc29sZS5sb2coIGBleGVjdXRpbmcgY29tbWFuZDogJHtjb21tYW5kfWAgKTtcclxuICAgIGV4ZWNTeW5jKCBjb21tYW5kICk7XHJcbiAgfVxyXG4gIGNvbnNvbGUubG9nKCAnZ29pbmcgYmFjayBvbmUgZGlyZWN0b3J5JyApO1xyXG4gIGNoZGlyKCAnLi4nICk7XHJcbn0iXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLFFBQVEsUUFBUSxvQkFBb0I7QUFDN0MsU0FBU0MsWUFBWSxFQUFFQyxVQUFVLEVBQUVDLFNBQVMsUUFBUSxTQUFTOztBQUU3RDtBQUNBLE9BQU9DLGVBQWUsTUFBTSx3QkFBd0I7QUFDcEQsU0FBU0MsSUFBSSxFQUFFQyxPQUFPLFFBQVEsV0FBVztBQUN6QyxTQUFTQyxHQUFHLEVBQUVDLEtBQUssUUFBUSxjQUFjO0FBRXpDLE1BQU1DLGdCQUFnQixHQUFHSixJQUFJLENBQUVFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSwwQkFBMkIsQ0FBQztBQUUxRixLQUFNLE1BQU1HLElBQUksSUFBSU4sZUFBZSxFQUFHO0VBQ3BDLE1BQU1PLElBQUksR0FBR04sSUFBSSxDQUFFRSxHQUFHLENBQUMsQ0FBQyxFQUFFRyxJQUFJLEVBQUUsU0FBUyxFQUFFLDBCQUEyQixDQUFDO0VBQ3ZFLE1BQU1FLE9BQU8sR0FBR04sT0FBTyxDQUFFSyxJQUFLLENBQUM7RUFDL0IsTUFBTUUsbUJBQW1CLEdBQUcsQ0FBQ1gsVUFBVSxDQUFFVSxPQUFRLENBQUM7RUFDbEQsSUFBS0MsbUJBQW1CLEVBQUc7SUFDekJWLFNBQVMsQ0FBRVMsT0FBTyxFQUFFO01BQUVFLFNBQVMsRUFBRTtJQUFLLENBQUUsQ0FBQztFQUMzQztFQUNBYixZQUFZLENBQUVRLGdCQUFnQixFQUFFRSxJQUFLLENBQUM7RUFDdENILEtBQUssQ0FBRUUsSUFBSyxDQUFDO0VBQ2IsTUFBTUssYUFBYSxHQUFHLG9IQUFvSDtFQUMxSSxNQUFNQyxRQUFRLEdBQUcsQ0FDZixzQkFBc0IsRUFDdEIsaUJBQWlCLEVBQ2hCLHdCQUF1QkQsYUFBYyxjQUFhLEVBQ25ELHNCQUFzQixDQUN2QjtFQUNELEtBQU0sTUFBTUUsT0FBTyxJQUFJRCxRQUFRLEVBQUc7SUFDaENFLE9BQU8sQ0FBQ0MsR0FBRyxDQUFHLHNCQUFxQkYsT0FBUSxFQUFFLENBQUM7SUFDOUNqQixRQUFRLENBQUVpQixPQUFRLENBQUM7RUFDckI7RUFDQUMsT0FBTyxDQUFDQyxHQUFHLENBQUUsMEJBQTJCLENBQUM7RUFDekNYLEtBQUssQ0FBRSxJQUFLLENBQUM7QUFDZiIsImlnbm9yZUxpc3QiOltdfQ==