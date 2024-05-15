/* eslint-disable */
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '../../tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '../../tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '../../tambo/js/phetAudioContext.js';
const soundURI = 'data:audio/mpeg;base64,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';
const soundByteArray = base64SoundToByteArray(phetAudioContext, soundURI);
const unlock = asyncLoader.createLock(soundURI);
const wrappedAudioBuffer = new WrappedAudioBuffer();

// safe way to unlock
let unlocked = false;
const safeUnlock = () => {
  if (!unlocked) {
    unlock();
    unlocked = true;
  }
};
const onDecodeSuccess = decodedAudio => {
  if (wrappedAudioBuffer.audioBufferProperty.value === null) {
    wrappedAudioBuffer.audioBufferProperty.set(decodedAudio);
    safeUnlock();
  }
};
const onDecodeError = decodeError => {
  console.warn('decode of audio data failed, using stubbed sound, error: ' + decodeError);
  wrappedAudioBuffer.audioBufferProperty.set(phetAudioContext.createBuffer(1, 1, phetAudioContext.sampleRate));
  safeUnlock();
};
const decodePromise = phetAudioContext.decodeAudioData(soundByteArray.buffer, onDecodeSuccess, onDecodeError);
if (decodePromise) {
  decodePromise.then(decodedAudio => {
    if (wrappedAudioBuffer.audioBufferProperty.value === null) {
      wrappedAudioBuffer.audioBufferProperty.set(decodedAudio);
      safeUnlock();
    }
  }).catch(e => {
    console.warn('promise rejection caught for audio decode, error = ' + e);
    safeUnlock();
  });
}
export default wrappedAudioBuffer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbInNlbGVjdGlvbkFycGVnZ2lvMDAxX21wMy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgYXN5bmNMb2FkZXIgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FzeW5jTG9hZGVyLmpzJztcclxuaW1wb3J0IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkgZnJvbSAnLi4vLi4vdGFtYm8vanMvYmFzZTY0U291bmRUb0J5dGVBcnJheS5qcyc7XHJcbmltcG9ydCBXcmFwcGVkQXVkaW9CdWZmZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvV3JhcHBlZEF1ZGlvQnVmZmVyLmpzJztcclxuaW1wb3J0IHBoZXRBdWRpb0NvbnRleHQgZnJvbSAnLi4vLi4vdGFtYm8vanMvcGhldEF1ZGlvQ29udGV4dC5qcyc7XHJcblxyXG5jb25zdCBzb3VuZFVSSSA9ICdkYXRhOmF1ZGlvL21wZWc7YmFzZTY0LC8vc3d4QUFDQldRWkJNQ05JbEVLanVRT25zQUNBWU5TdUNUVEt3Q2ZIeVJjVkZUVHNRZ2NJNkMvVHpKcjllbzQ4NStUcU9GSENCK0ozeTkrcHlCUHlBQkpBRkZJYWtpdGxWd1h3RklMV0srTEdlaENHVTUzUExnckFPSllFMEU4SzZNL1h4MFRuL3prZk4vTXpUWEN1cjZabSt1WHV2Zi84b0Q3Ly8vSWNIUEtlSjJVU3laYktZOGxIQ1ZsREFjcGxoeUJvYmNIUldraGNwTXovL3N5eEF5QUNxeS9PaG02QUFFUkNxa0RPUEFBU3pReGNvRjBtQjBBSFhBRWh6SStjSms4V1FGQ1lLQkErZWFhemZEbHlJa0hTYmR5NXRLYW1LZi85UjlST0gydCtuOVI5Wi8zZmRuVy9wK0NheVRBQmdSVk1DbHhaQmdNd25MaTJPaHM0S2F6QWdVTjNvb1FoWXUwdTlTVVNTUW54VGliWGEyMjd0ODdzelFyUmZhbmczOWZPNG9KUWIrVEtOYXF2WU9zWExkQ2tCcXRPUnRJQnYvN01zUURnQWhvTDJOZGd3QXhEQWJwQ2I0d3lIRm1HMy94Y1VSZkxmb0ExY00wbExTNWZHSlpFM2ZESDZZZ0p3SUZqSnN3MFBtQ2Fnc0lheDU4Nkx3Z2ZFREVCak9FT1hoTzYwUVJHbnlGQkVlK3dncGR6ak5GUVZXTWFBTWk2c2FpbFFvTDBHVzJDSWNWSmVFcGVTa2NLbm1ybnRTb2lXTUNsUThCeEVQYThGVEwvRHBaRExYb1RLMDNQV1NzdjZrQ1YzcHF0QUFjYmpjcllBRC8rekxFQkFBSU9IdHJwNWh3Y1FhZDZxV2tpVlk0eUFCV0ZIZHFBNkZlQi9GekRWcGNESWRJNHhzQzhFbldVUGZSQ2FRUkk4V2tRazBydzA5QzRST2FWLzNnaW1BS0RnTUUrSHlDdVU1TndBRmxwa0NVdzdGR2xTVnVCZzhCRWtPMG5NTS9NY3dhcUxDcHRDczBLajhjVUJtQzFkcUlwYzNWdVVyTmRpcTByTXJUSm02T3JmK2dJVjZrTi9nLy93clZBTXRNQVM2UXVzK1NBNDZELy9zd3hBWUNTSXhET014MHhTa0dCK1NaejJpUU0rU1ROb0F1TnY2UUpndUQrbERqSUtBaVhDMEtReHVROXdKS2pyVlJ5NjAxR0U4RmhQNzAzaVVWZnpmaXUvSEg1VGZPOEtDdk9xR2lSaFRJbEFZaUNBTkZKZ0l2R0RaZVlGZEZwaXhFUG1GbFhLWWhqUmhrRUtnbUJxR29iU3FaTklBQllOQUx4a2s3UFNuTGVQSTV5NWx1T2lWM3JQZnR0eXdPQUpNRndnaUdSd1NhS0doMS8vc3l4QWFEQ0VSQkZnNS9oSUVRaUNSTnZ4U3FGK21RS0hKNWxQb0JVWkVReGZHSUJpckJ2dG9lT1liS0FWbkpneWFIQndHU0ljVGlJT2wrMWIzcWhpdDNkbDI1TmgyNDNDK0hHMGxRcGluY01Bb3FLQlJCTWw0REhtYmtNMHNIZzFzM1lURlBVWE53dEZJd2t3dFRBSUF5Qm9CNWN4Tk5sRHR3L09VL09FZkR6ZlZUK3YvYi9zdW8yZi9SNUNxSnRjUURtQkJoanBtYkp3R2FUZi83TXNRSEE4Y0FQeHdOKzJTZzJJZ2pRYjlva0FnWk9Ba1IyREdsR2FCRDJmTVNJUmplQlJuVXFScFJTWktMR0dBWWtCTm1ra014ckgvL0MvLy9IVkFsTFFjQkdGQUpsWThidE9tWXVkaWFYUWloMU9uQUFWUlkvMUVLekZ1REFQV3ZOVUlBUjhJQ0licWFPUkc1M3YvOXp2Lzl6dFZBSkFnaGFhQWdDaFpoQlVaTFBtSllzcVlEQWxacHRJM21DWXZrWmU1dzVoU2hISDF1YWFULyt6TEVFNE9IVkNrZVRmc2tvT2dJSXdXdkNLaGhDb0JtY3lxelRPcXpYLy8vK3ovbzE0RmZleHlXdExwUWVNWUhPR2lNaGduTXlwd2RqVmpkOE1oZEVJOUhReGpGSkFQRmd4UllFb2FBWlJhWEE0OE56RlhuVnVELy8vLy8vK3o3S2xvRUhoWXdrK1FCUkNWa2xjWUVTd1JrU2h0bWY1R2VZWXFyNXhncGxHRDZGeWFIUUpUQ3dTYzdER3R3L09YM1d5bi8vLy9WMWY5UDc5SUgvL3N3eEIwQ0J4d3JFaTM3SklEVmhTT3BqdVNTU2lBQXNYNVpMM0lVSE0waksyQ2pINFRqT2l2RExpMlQ3QkRESDRKempJQlJLUHpMWUduYm1MS01oMDBmKzcvLy8vLy9hbW9BQUFBV2dDc0VVV29kY3BuS0FZd09DRXkzS0VEV3diNzBHWVNDa2E5UTM1ZzdBYkhVcUF4ZzdrUS9HS1MzckkvLy8xK2ovOVZyMnYyZmYrdVBQdXRBdWVCQ2hqY3BrQjdwbFlOSjMwZmhrWjZCLy9zeXhDa0RCNEFyRmE3N0NBRHFoV0ZCcnVTUXdYVTVrQ05SeVFtT1FYZFhNN05CZXBySjcvLy8vMVc5VkhTRUZ6VnBGcXFacFZJbVpRQUFEY2lJQVEzbFZwb3FtZWFDdHBvVUFIeDc4YTNpaCs2U1FPTE1vNnE1ellQb3JlYk9sU252SGpwR24rcHYwZmQ3S2RyVjJXV3haTlhWT1pTbUpOSkJvZ2F0K0g5cFpzcE1KZ1F2NW9Pc1FBQ3NEc1FGTUxtUVRtZi8vLy9xN3h1b2dQLzdNc1F4ZzBkY0p4Rk9kd2dRM1FSaFFiNjh5RlhESDNNT0tlc2c0VkxvSENqeU5xckdtdXh4dVlvRERJTjJNOWpRd0xuRE9Vak9haFBDQ1JFcko4dHRBdEhlRmYvLy8vaERZS3ZZeFRadDRvTVFCSnhqSU1qSElKdERSTkpPenpPY2thbmpQM3d5b09OcHJ6SFZZOWliRlFobzhHVU55N3JuOC8vKy9ydmJPL1JqUE1aRTNWaUUwUlhvcFdjRWxFNngyS3QxcWlBQUFGS01JUUQvK3pMRVBBUEhPQ1VJRG5jSUFOb2dJTUd3Q2lreFpIY2JDU1FqV3BOd1NZSG5DSVhRTGFzbXJNa2oyRDcvK29aK2p0amE1SmJncVBGUXZjNFlDSWdROXNjRUtLNkFEeXo0UnJHS0RXNldXaG9GS3VuRW15UzlzV0tNK3o5WmxDMVFyVVZQZHY3OUppa2tYRkxubDZYSkZNT1ZpSUFLSlRjQUkwVGlXb1lBcERCakVRUkpwdkZrSzVYVU1HS1I5SDYyYkRuRStta0toMkpRT1RTNS8vc3d4RWVBUnRnZkM2RG5Rb0MyZ3lIa0VPQUttYlpMSmFUYlFBLy9jaUk4SWdhRFJHSFNja0lzcUFqemVvRlFWQlVGUVduc3FDdmlKL09rdFFkLzVWWUtnci80TEV4QlRVVXpMams1TGpPcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXEvL3N5eEZpQVJmd1pDNENGZ0ZDc0FHQmtBWXdDcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcWc9PSc7XHJcbmNvbnN0IHNvdW5kQnl0ZUFycmF5ID0gYmFzZTY0U291bmRUb0J5dGVBcnJheSggcGhldEF1ZGlvQ29udGV4dCwgc291bmRVUkkgKTtcclxuY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggc291bmRVUkkgKTtcclxuY29uc3Qgd3JhcHBlZEF1ZGlvQnVmZmVyID0gbmV3IFdyYXBwZWRBdWRpb0J1ZmZlcigpO1xyXG5cclxuLy8gc2FmZSB3YXkgdG8gdW5sb2NrXHJcbmxldCB1bmxvY2tlZCA9IGZhbHNlO1xyXG5jb25zdCBzYWZlVW5sb2NrID0gKCkgPT4ge1xyXG4gIGlmICggIXVubG9ja2VkICkge1xyXG4gICAgdW5sb2NrKCk7XHJcbiAgICB1bmxvY2tlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3Qgb25EZWNvZGVTdWNjZXNzID0gZGVjb2RlZEF1ZGlvID0+IHtcclxuICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBkZWNvZGVkQXVkaW8gKTtcclxuICAgIHNhZmVVbmxvY2soKTtcclxuICB9XHJcbn07XHJcbmNvbnN0IG9uRGVjb2RlRXJyb3IgPSBkZWNvZGVFcnJvciA9PiB7XHJcbiAgY29uc29sZS53YXJuKCAnZGVjb2RlIG9mIGF1ZGlvIGRhdGEgZmFpbGVkLCB1c2luZyBzdHViYmVkIHNvdW5kLCBlcnJvcjogJyArIGRlY29kZUVycm9yICk7XHJcbiAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBwaGV0QXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgMSwgcGhldEF1ZGlvQ29udGV4dC5zYW1wbGVSYXRlICkgKTtcclxuICBzYWZlVW5sb2NrKCk7XHJcbn07XHJcbmNvbnN0IGRlY29kZVByb21pc2UgPSBwaGV0QXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YSggc291bmRCeXRlQXJyYXkuYnVmZmVyLCBvbkRlY29kZVN1Y2Nlc3MsIG9uRGVjb2RlRXJyb3IgKTtcclxuaWYgKCBkZWNvZGVQcm9taXNlICkge1xyXG4gIGRlY29kZVByb21pc2VcclxuICAgIC50aGVuKCBkZWNvZGVkQXVkaW8gPT4ge1xyXG4gICAgICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICAgICAgc2FmZVVubG9jaygpO1xyXG4gICAgICB9XHJcbiAgICB9IClcclxuICAgIC5jYXRjaCggZSA9PiB7XHJcbiAgICAgIGNvbnNvbGUud2FybiggJ3Byb21pc2UgcmVqZWN0aW9uIGNhdWdodCBmb3IgYXVkaW8gZGVjb2RlLCBlcnJvciA9ICcgKyBlICk7XHJcbiAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgIH0gKTtcclxufVxyXG5leHBvcnQgZGVmYXVsdCB3cmFwcGVkQXVkaW9CdWZmZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLE9BQU9BLFdBQVcsTUFBTSxtQ0FBbUM7QUFDM0QsT0FBT0Msc0JBQXNCLE1BQU0sMENBQTBDO0FBQzdFLE9BQU9DLGtCQUFrQixNQUFNLHNDQUFzQztBQUNyRSxPQUFPQyxnQkFBZ0IsTUFBTSxvQ0FBb0M7QUFFakUsTUFBTUMsUUFBUSxHQUFHLHk0RkFBeTRGO0FBQzE1RixNQUFNQyxjQUFjLEdBQUdKLHNCQUFzQixDQUFFRSxnQkFBZ0IsRUFBRUMsUUFBUyxDQUFDO0FBQzNFLE1BQU1FLE1BQU0sR0FBR04sV0FBVyxDQUFDTyxVQUFVLENBQUVILFFBQVMsQ0FBQztBQUNqRCxNQUFNSSxrQkFBa0IsR0FBRyxJQUFJTixrQkFBa0IsQ0FBQyxDQUFDOztBQUVuRDtBQUNBLElBQUlPLFFBQVEsR0FBRyxLQUFLO0FBQ3BCLE1BQU1DLFVBQVUsR0FBR0EsQ0FBQSxLQUFNO0VBQ3ZCLElBQUssQ0FBQ0QsUUFBUSxFQUFHO0lBQ2ZILE1BQU0sQ0FBQyxDQUFDO0lBQ1JHLFFBQVEsR0FBRyxJQUFJO0VBQ2pCO0FBQ0YsQ0FBQztBQUVELE1BQU1FLGVBQWUsR0FBR0MsWUFBWSxJQUFJO0VBQ3RDLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztJQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztJQUMxREYsVUFBVSxDQUFDLENBQUM7RUFDZDtBQUNGLENBQUM7QUFDRCxNQUFNTSxhQUFhLEdBQUdDLFdBQVcsSUFBSTtFQUNuQ0MsT0FBTyxDQUFDQyxJQUFJLENBQUUsMkRBQTJELEdBQUdGLFdBQVksQ0FBQztFQUN6RlQsa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVaLGdCQUFnQixDQUFDaUIsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVqQixnQkFBZ0IsQ0FBQ2tCLFVBQVcsQ0FBRSxDQUFDO0VBQ2hIWCxVQUFVLENBQUMsQ0FBQztBQUNkLENBQUM7QUFDRCxNQUFNWSxhQUFhLEdBQUduQixnQkFBZ0IsQ0FBQ29CLGVBQWUsQ0FBRWxCLGNBQWMsQ0FBQ21CLE1BQU0sRUFBRWIsZUFBZSxFQUFFSyxhQUFjLENBQUM7QUFDL0csSUFBS00sYUFBYSxFQUFHO0VBQ25CQSxhQUFhLENBQ1ZHLElBQUksQ0FBRWIsWUFBWSxJQUFJO0lBQ3JCLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztNQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztNQUMxREYsVUFBVSxDQUFDLENBQUM7SUFDZDtFQUNGLENBQUUsQ0FBQyxDQUNGZ0IsS0FBSyxDQUFFQyxDQUFDLElBQUk7SUFDWFQsT0FBTyxDQUFDQyxJQUFJLENBQUUscURBQXFELEdBQUdRLENBQUUsQ0FBQztJQUN6RWpCLFVBQVUsQ0FBQyxDQUFDO0VBQ2QsQ0FBRSxDQUFDO0FBQ1A7QUFDQSxlQUFlRixrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=