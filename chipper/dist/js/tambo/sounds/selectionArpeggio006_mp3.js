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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbInNlbGVjdGlvbkFycGVnZ2lvMDA2X21wMy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgYXN5bmNMb2FkZXIgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FzeW5jTG9hZGVyLmpzJztcclxuaW1wb3J0IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkgZnJvbSAnLi4vLi4vdGFtYm8vanMvYmFzZTY0U291bmRUb0J5dGVBcnJheS5qcyc7XHJcbmltcG9ydCBXcmFwcGVkQXVkaW9CdWZmZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvV3JhcHBlZEF1ZGlvQnVmZmVyLmpzJztcclxuaW1wb3J0IHBoZXRBdWRpb0NvbnRleHQgZnJvbSAnLi4vLi4vdGFtYm8vanMvcGhldEF1ZGlvQ29udGV4dC5qcyc7XHJcblxyXG5jb25zdCBzb3VuZFVSSSA9ICdkYXRhOmF1ZGlvL21wZWc7YmFzZTY0LC8vc3d4QUFEUmlnNi9rQ013SkQvaktOQ252QUFLNENIZVZsSFFJUGNQVXJRaTJkbktORGp5QVdiY0xWR1FKelp3UVkxNmdRT0FoSmwvUGtQNWQ4dmtNb1V5WWdVNnRXaVRoSXpDTlUvanhQc1RRY1pwbHZRNDBRVlpSQldVVzFCRHplNmtYS3VDUGdxMGUvZ1FYT0JuVjdzYlB2Zi93OG12bkluL3kvaUIzNGZBWi8vTGdncXJNN2NXaU13b00yWEkzWGxEc1JvNWVvVFVSbWMvL3N5eEFxQUNkaTlPaG5JQUFFWWpDakRPSkFBaVR0UGVReDhJRkVDY2p5c0xmQUN3b0pNVFluOHZsUVVBUlI2cGZRYWZHWVNxZjM2YVp1WmsvLys2YVNDaTUvMWVhRnc0VWQvbDI2L290R0ZsTzlaaFlGSVRSQ2ZBdTJpc0ZuaGg2RlJtYVZVWmdnQUR3TURBRTArTkVRQ3RBd0psQzVkQ0ZrYlpCQ0tWM0dwVTNXeHIvNnR3VWZhaGhWWmF5VXlabW1QUnkwQWcxQUExMTJtc3YvN01zUUVBQWgwUjB6ZHQ0QXBCZ1pwWlAyWW5KVk5IVGVNaXNBTXpIQXY1cmdpbThRZ0ttQzkyOWNadXJSQjJJZW1qcVZyRkRaSThhdG9kSTJwRHdaUU5DYnlaN05BOWczbW5wUWxpRDRNcVlBQUJlOGhGWmxKUkN3RkF4dm1Nc0dEb3BneEFWU0RaNUVaTy9nT3NZUWNtUWxiUndWUVdJR1IxS3hqd0RZU1doaHRPUnFuMWxSWTlGWlpUYmFYK2pUMHF0MkFMYmR0dFFBQW9Dci8rekxFQlFBSHlGbDNyRDBqZVNjYXFlV3pDZDQwRVRDVXE2REdSaDl1Um9aQ1pFT01NMURLWHpRVkdCOGRXMUNjY2lzOEtpcmpXdEs0MWtYL3Rra01HdEVQZE95VnlxZC9LQUFWV21RSmlHMmtKbHg1V1VDeXBpd0thWSttUUR4MkJHcFpEalM0ZWpNRHhnVWlmQVluVUdvM0dIbllYN3NxSXVoRmpHTVN5dWhyVlZlemZOTHkrTlZQemFGNkNqTDRlVWkxQUE3YTIydGdBR2lwLy9zd3hBVUFDS1JWY2FmaExMRDRCV3BsblpqV25aT1pHTWtLV0VXTjRjY2dKczlINStHWTRJQXdjb1FCVTBUcVhpOWpPbkRGZ3FjUG9ZQ29xd1dnc3JqVVFXTEJvRzNHakFxWld3TXRiL1c0QUxUVlNCajErWWFwWDJNaUFmREFyS3F1QnZwRmNValY4eDRjTVRwQThFd0NCUUdJeUo2RUFhQUlUZWJyUmU2aDQ4eFVNSi9yZEcrdTMvZnF6dFZJQUFCdWY4QUNGODZRSWx4Qi8vc3l4QWFBQ09CaFg0Tmg1WGtSQmlxd3pTU25Sb1FNSkxtT2lPZEREbFF4eUkrTVFTb1RyVDRWK1JCWEdxampKTGlubDgvRmVvRkdxSE4yOWhTeVhwZnpSb0lURDlJK2s2Qjd3azdDK2pDQUFBbGYyZ1pnN2g0K1VBRUNIamhxeE5ncnVSUUFBU0wrU0JEbHEyMm1iWkY5ZEsxQjJRMTJKTExzWUtIWlhVeGROd0tYZUtvZTZGb203MWJmdDMrZC9uZi9WU3dBQUE3SktBQUJiUC83TXNRRWdFZkFYMDJuNkdWNDZJWW1ZYzc1RHFZS05xTE1kb2hnVTRnRUdOalhJMDNqRmJBRytKVkozZENnOE1TeVh0Um9nWXo0cHMrZ0luWXFJaldPb2ErYmx4Tnc0VUZiRUFBYkhMOFVjZHRBTUR6VFZiSnBXZlJ2aG9PK0hYNU1tSG9tQWo0ak5FYmpHb0p6U2VCbkpoRkF3Q2N2T1ZBQ29HZW1ZcmcyUWtVYjlTb0FBQ2lBbWpRYUdSQ0NHUlVCczRTWm5JcUFSbE52eHNULyt6TEVEQUJHcERNM0EyK2ljT1VGNW5HK2ROVENNaTRDQTBVR0U1NkcxN0VtRDRLTU5mcE9rbUNaaXp5ejFrT2Y5Z0lBQUFNRERlRTIranRpSUdNMTZqQ0J3eG5HREIwVE0ySkF4VUdUV2FoRThvWmxhNTIrMWhpbURaZ1lBUmNBdFdMQmF5U2ZCTUIvOGpVRUFCamdGRExITEYza1VRem9YNUZGaVlJSjREUEpnWUlrbTlOakJVeFFxenBvZWdjUHFlYmMxRGxtT3JMc1JWSDMvL3N3eEJpQVJ3QXhOU3p6cHJEV0JpYm9EWEFtNnYvLy8vOXY2QkFBSWtBRlNicU5WRkpLTEprb2dFV0hhVnBwbU9vT1loRUpneFFHbUgyQkFRb0cxOWtnMEJudmtGOE02TzMvLy8vLys2aitoU0FBQUFhQlFBa0JaT3k3WmpUV1BHWnZvT1pMR0h4ajRHS2pZR2tOOXpPNDQ5WktRV0xjT0FoU2hEdXJtR3F1aFpQK3IvLy8vMWY2ZW9BQUJ3SUdnQURoRlZkb3dHQTBjMDRsLy9zeXhDVUFCeWd4SzZEdm95RHJoZVZvSE94T0lRVTZFa0FvRVlGakhla2dXenp2djR3WVBhSkNGN0N3UzVzOFpTci9JZi9wNnRUNEJaZjBmK24zcWtBQURBREFLenFRMnFnWURJR0JneG9NRVdITTNZMkF3QVlWc2daSGdrSEVJZFRLK1lrQVVDZ0xTL1F3RGdXZjhFN3YvLy8vMWRIK3o2NjlYNlcweEF5T3VoNWVtTUtXWW9EWitJMW1OZ1FZVXBKQVlNZ1lNNHpCb2podW1QLzdNc1F1Z01jNExTRWc3NkVnNVlZaVFjOWhTRWlBNFVBT3F5QlJZWkpFYXprQ3lmLy8vLy85TnZUVmlCZzhrWGlZbTVobG9aQmZBU0NNM1kxYkRLSm9PVEJveDZ6emVQY01JaWNBQUpJaEVjSUhMRktPeDMvLy8vLys3ZDNOczZyT1hBQWdBRElGQUZyUU5WTUFud2dwTmxHeklUQSs4Y01CQVFUVG5tQXBrQnFjUEdtR0RRZ1BZR3NBbkZNaXN4Ly8vby85MWY5eDNUUlY5Mi8vK3pMRU9JSUcyRE1TQWUrQ3dPa0ZvblF0OUdBQUFBcEkwUUdEWkRzUmN4eWtCTHpvTFFBMU1Tc0hBcGdWZWJFS2lGb1B0U1FVSlF6VE82eWFSY2ZYYkZzd2hYOTcxWGF2NzIvdjJlci9sQURBeVltRVJjSW1nT3RHaG9BeENmd1NtcVlsTWh4S0FSTTJ1WUx4dVEva1Bxd3puYS8vLy8vMllqdUljc1ZZRzUzNlJoSnN1OVFJaXdWNGdBZUJZb1FhaUVZMWxWM0dSaVVWbUE2Yy8vc3d4RVFDaDJBdkUwRHJZdERiaGVHa3ZXeVE4amt3WkE4cmtraU8vLy8vN20xWXpTMXd4b3N1ZzhOQVpJaUtyV0NUSkFRbXdpOE1kc3B6Tk1LZ2tQQTF6ak1nS0xqaEI4ZHh0OXMwei8vLy90OVM4aHBjeXFmRlN3YmZCeElkR0MwczhIVWtnYk1QUUJJRTVuYWFxT2NpNVNFeUtaMklVRGlUdjdQLzlYNjZ0WklPdE9EeGlVQUJGeGdSQzV3SkVRUmNEd3RHQXdoTFpuUHgvL3N5eEU2RFIwUXJDQ0RuWXdDL2hXREFER1JnNWFjaUMrU1VSS0p3OGdkYytjK3YvLy83ZFgvKy90VlJyVmpWU2pCVlZWVW95NmlmV05BSUNBaFg0WlZWWTNRclZVeEJUVVV6TGprNUxqTlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVmYvN01zUmRnY1lJSVFhZ0JlQlF5NlJlZ01BT0tGVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVT0nO1xyXG5jb25zdCBzb3VuZEJ5dGVBcnJheSA9IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkoIHBoZXRBdWRpb0NvbnRleHQsIHNvdW5kVVJJICk7XHJcbmNvbnN0IHVubG9jayA9IGFzeW5jTG9hZGVyLmNyZWF0ZUxvY2soIHNvdW5kVVJJICk7XHJcbmNvbnN0IHdyYXBwZWRBdWRpb0J1ZmZlciA9IG5ldyBXcmFwcGVkQXVkaW9CdWZmZXIoKTtcclxuXHJcbi8vIHNhZmUgd2F5IHRvIHVubG9ja1xyXG5sZXQgdW5sb2NrZWQgPSBmYWxzZTtcclxuY29uc3Qgc2FmZVVubG9jayA9ICgpID0+IHtcclxuICBpZiAoICF1bmxvY2tlZCApIHtcclxuICAgIHVubG9jaygpO1xyXG4gICAgdW5sb2NrZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IG9uRGVjb2RlU3VjY2VzcyA9IGRlY29kZWRBdWRpbyA9PiB7XHJcbiAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICBzYWZlVW5sb2NrKCk7XHJcbiAgfVxyXG59O1xyXG5jb25zdCBvbkRlY29kZUVycm9yID0gZGVjb2RlRXJyb3IgPT4ge1xyXG4gIGNvbnNvbGUud2FybiggJ2RlY29kZSBvZiBhdWRpbyBkYXRhIGZhaWxlZCwgdXNpbmcgc3R1YmJlZCBzb3VuZCwgZXJyb3I6ICcgKyBkZWNvZGVFcnJvciApO1xyXG4gIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggcGhldEF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDEsIHBoZXRBdWRpb0NvbnRleHQuc2FtcGxlUmF0ZSApICk7XHJcbiAgc2FmZVVubG9jaygpO1xyXG59O1xyXG5jb25zdCBkZWNvZGVQcm9taXNlID0gcGhldEF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoIHNvdW5kQnl0ZUFycmF5LmJ1ZmZlciwgb25EZWNvZGVTdWNjZXNzLCBvbkRlY29kZUVycm9yICk7XHJcbmlmICggZGVjb2RlUHJvbWlzZSApIHtcclxuICBkZWNvZGVQcm9taXNlXHJcbiAgICAudGhlbiggZGVjb2RlZEF1ZGlvID0+IHtcclxuICAgICAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgICAgICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIGRlY29kZWRBdWRpbyApO1xyXG4gICAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgICAgfVxyXG4gICAgfSApXHJcbiAgICAuY2F0Y2goIGUgPT4ge1xyXG4gICAgICBjb25zb2xlLndhcm4oICdwcm9taXNlIHJlamVjdGlvbiBjYXVnaHQgZm9yIGF1ZGlvIGRlY29kZSwgZXJyb3IgPSAnICsgZSApO1xyXG4gICAgICBzYWZlVW5sb2NrKCk7XHJcbiAgICB9ICk7XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgd3JhcHBlZEF1ZGlvQnVmZmVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxPQUFPQSxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLHNCQUFzQixNQUFNLDBDQUEwQztBQUM3RSxPQUFPQyxrQkFBa0IsTUFBTSxzQ0FBc0M7QUFDckUsT0FBT0MsZ0JBQWdCLE1BQU0sb0NBQW9DO0FBRWpFLE1BQU1DLFFBQVEsR0FBRyx5bEdBQXlsRztBQUMxbUcsTUFBTUMsY0FBYyxHQUFHSixzQkFBc0IsQ0FBRUUsZ0JBQWdCLEVBQUVDLFFBQVMsQ0FBQztBQUMzRSxNQUFNRSxNQUFNLEdBQUdOLFdBQVcsQ0FBQ08sVUFBVSxDQUFFSCxRQUFTLENBQUM7QUFDakQsTUFBTUksa0JBQWtCLEdBQUcsSUFBSU4sa0JBQWtCLENBQUMsQ0FBQzs7QUFFbkQ7QUFDQSxJQUFJTyxRQUFRLEdBQUcsS0FBSztBQUNwQixNQUFNQyxVQUFVLEdBQUdBLENBQUEsS0FBTTtFQUN2QixJQUFLLENBQUNELFFBQVEsRUFBRztJQUNmSCxNQUFNLENBQUMsQ0FBQztJQUNSRyxRQUFRLEdBQUcsSUFBSTtFQUNqQjtBQUNGLENBQUM7QUFFRCxNQUFNRSxlQUFlLEdBQUdDLFlBQVksSUFBSTtFQUN0QyxJQUFLSixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNDLEtBQUssS0FBSyxJQUFJLEVBQUc7SUFDM0ROLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFSCxZQUFhLENBQUM7SUFDMURGLFVBQVUsQ0FBQyxDQUFDO0VBQ2Q7QUFDRixDQUFDO0FBQ0QsTUFBTU0sYUFBYSxHQUFHQyxXQUFXLElBQUk7RUFDbkNDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFFLDJEQUEyRCxHQUFHRixXQUFZLENBQUM7RUFDekZULGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFWixnQkFBZ0IsQ0FBQ2lCLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFakIsZ0JBQWdCLENBQUNrQixVQUFXLENBQUUsQ0FBQztFQUNoSFgsVUFBVSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBQ0QsTUFBTVksYUFBYSxHQUFHbkIsZ0JBQWdCLENBQUNvQixlQUFlLENBQUVsQixjQUFjLENBQUNtQixNQUFNLEVBQUViLGVBQWUsRUFBRUssYUFBYyxDQUFDO0FBQy9HLElBQUtNLGFBQWEsRUFBRztFQUNuQkEsYUFBYSxDQUNWRyxJQUFJLENBQUViLFlBQVksSUFBSTtJQUNyQixJQUFLSixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNDLEtBQUssS0FBSyxJQUFJLEVBQUc7TUFDM0ROLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFSCxZQUFhLENBQUM7TUFDMURGLFVBQVUsQ0FBQyxDQUFDO0lBQ2Q7RUFDRixDQUFFLENBQUMsQ0FDRmdCLEtBQUssQ0FBRUMsQ0FBQyxJQUFJO0lBQ1hULE9BQU8sQ0FBQ0MsSUFBSSxDQUFFLHFEQUFxRCxHQUFHUSxDQUFFLENBQUM7SUFDekVqQixVQUFVLENBQUMsQ0FBQztFQUNkLENBQUUsQ0FBQztBQUNQO0FBQ0EsZUFBZUYsa0JBQWtCIiwiaWdub3JlTGlzdCI6W119