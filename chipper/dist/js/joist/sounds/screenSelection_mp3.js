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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbInNjcmVlblNlbGVjdGlvbl9tcDMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hc3luY0xvYWRlci5qcyc7XHJcbmltcG9ydCBiYXNlNjRTb3VuZFRvQnl0ZUFycmF5IGZyb20gJy4uLy4uL3RhbWJvL2pzL2Jhc2U2NFNvdW5kVG9CeXRlQXJyYXkuanMnO1xyXG5pbXBvcnQgV3JhcHBlZEF1ZGlvQnVmZmVyIGZyb20gJy4uLy4uL3RhbWJvL2pzL1dyYXBwZWRBdWRpb0J1ZmZlci5qcyc7XHJcbmltcG9ydCBwaGV0QXVkaW9Db250ZXh0IGZyb20gJy4uLy4uL3RhbWJvL2pzL3BoZXRBdWRpb0NvbnRleHQuanMnO1xyXG5cclxuY29uc3Qgc291bmRVUkkgPSAnZGF0YTphdWRpby9tcGVnO2Jhc2U2NCwvL3N3eEFBQUJFdzIzcFRFZ0RsMkRpY3pPMEFBTFNqY3RoZ3NMQlhFc0c0TnllTHduRXNHNE54SEo0am45MkZ3VEFHQnNucEJnQUFBQVFCQUdRNkVBQUFBQnZJREFPWVlFb0xBa1l6aXRZbkRLb1RqZkJKallQcnozU3Y2ZlE2VXBreUhKcmdWcGorZ0dCNmNvSG42Z0VSQUI3dkE1cHNEQmhRTUtCQTNzUUcwUm0vREJZdUFuR0FYTkFPQ2dCQnd5bjBQSmxSQUM0QUE2YW1yLy9zeXhBT0JDRlJYUk4zTUFERVBDcWFPdVlBR01vV0lnQ1lVSVpwaTZIb1ZnWnRNUmtvbG1LZ2VLZ1F3eUhCa0JsMFhpaHA0MWhsckJWd2VPUU9FODBac2MxLzJzNHJheXh4dytNM0xWWmQ0S0FzQUNiNE9CQ3YwYkJHQ3pIQXVOdDlZM0tQakFRN0Voa1BCVUdnd3RNWUZCVEw0RWw4WmkyS3lSTExUM21wN091L3JHenl0Zi9mT1kwdmNUTi8vL1c3LzhqVm5WREIzWlZlWWlQLzdNc1FFQUFpa1czWFpqQUFRL1lybXo3cndCcGtBQUFBQUNPbFVpMmtUK0pTcFhwSnBmQTdUWWJ4QWdPSU5pRXRpNEZ6c3ZlZU5QMG5JamFoVzdrNEpPZmwxVWszZC9XSCs0TkJGSkJSMGxlMlN4QUFBNFNZaTBsTm0vRkFEQUJSbTBsVUdVWllHSFFRbUdRUG9pcHBNUGYySDJjczVuUTViVTRab0JFWHBYUnExMWh5eGVKYi8yZlJxdkJzZml2NmxBQUlCQ01VZklPSUxpVnIvK3pMRUJZSUlDRWNvVFBSbHNRY0k1VjJQYklaNzhtU0NYbnhhbm5Fd2FHSnhER0g1U0FVRzB5QUtBeTJFMUpxUlUyVExIQlZuSWhKZzYyc0puQmNFeXdpVTlQLy8vLy8vK2dKSmJzWUN0eGI5b3FtQWRNRytNQTBVOHhTbEFUNzRVek5ITTNPUU1VTEdxd2xWZmN0bEV2WWxISHdVVnVaMzhjdjVuK3BHdENkUGIzZC90cC9rZjdFZjZRQTdxQUMwdzJrMCtkTVpvOHdTVUY0ei8vc3d4QWlEQ0JnN0htejdaRkVVQ2VWSm51Q1drSStES3hDY01Bc0w4NlRyTTdCakJBRXNDcTZ4R0lOclR0Z2VkQUJRUFdDa0tGMFZIZnEzaXlrLzI5L2QraitrVHpBVlhWT3NJMmNBSEhlbVlvR1Vkb3ZnYVRESVpBZ3lJQ1dNU0FnUGtBQ2M5cFJudnNBTE5vQTJES0FOUlRva0VOdVcvRkp1VnYvZnBKWmgvMGdSbysvOTMvK2hDQUFBQnR0QUFBRFZWTm5nV0VMeXBVQUUvL3N5eEFrQVNYUmROYTdreWFFQ2lLVk56MkRJTkRDNkZUUDVOakxoY2ltTUxNakVKckptS0V2WmF5UlNnYW9sVmxucnBldGpqWFM4QW9pWVliRFh0WjhzTTRWRkZjQ1M1eW5FU1VkYlVHcUkyQmcrNnhmd2FCd0dNSmpGRkh1TmtZL0k0eHFyQjFtRVFEYVBBR0hMSW9ZRkNHU0srcFZkdXFyWVd5UTJkSnhsZFJwRUNIczYxTmE4RlVobXBmcFZJQUFvQWEwbGFsRXhwZEtxUS8vN01zUUdnd2M0UnlSdTZpa1E3QW1samR5SkxpTEJwcnpCZ3hXcC9rclk3aU1HUFV5WTVJR2l4NWwrSy8yTWNoeWdnSi95S2dLb2JEK2JpZGZkLy8vL3VJRXRnQVdnWDJpOGtMNWxuREJFUlRGbCt6R0tPelUwa3o1MEFTcVB6V0hlaDYzWm5udXJWYkVDYXh1S1UyZGZvOFZacS9yVytqNUgvLzVOQUFBWkRBQVRhVEVnNktwMEJnTWhVaFRXb3Z6SWQwejZjYVQ5YkhrQ3VCbi8rekxFRUFKSFBFc3BMdVhvTVNzS1pxWE41UmVwOFVEOWRGK1dsN0I4RWxnWk1NQ29ZMEdGL1duUUpYLzcway8wRG9NbHJReXJFaEFZRkY1a21DR0hCUWRCTXhsd0VhN2FuVW5aa0FrWWFLZ2hJQVJhWHpSb1NEQlFCWjhFVkxwTWhCTzkxRnBLRHVSSjFMSUNTZFFKcVFnK1I0V3NRbHNUZ21BTUdrWUFBQVpGVXNxTnhSeEY0bW5ZbU1sR2hGRGdZTmZ6STBNRFU5MHVJcWVWLy9zd3hCR0FSMHhSUDAxeDZIakRDT1padnFVWHpCQ2ZkVXFXYmJHNWJsNWRrZWZnZGRpOHZXaHlOaExvQllCMG1nUUt6bFB4TUllQnpScFV5K3FPZUlqQWdOekdTZFFnUlZObjllNnZOT1BEUlVzUCtVNGJWOW9hYUg1c1ZRQWtPMkFBUDAyc0hVQ3Yza01GQ3dSd3d6U3BEcnczUStNbU1rQnh0QkFLcXhBWVAwV1pCNFZCWW0zMi9MOCtzVSt6N0pIcjlkMzFpQllBRUFYeS8vc3l4QjhDQndSSEt1NTFLSERiQmlTZHZxVFdIQU03azN5TGhpcDhjR2RHQkFMbWpRWmtRV0dvZGFoQ0tEd0Z1b0ZRZ0xtR1JvMEhoOVpmR3R0MS8vLy8vL3AvMWdSUUFBQ3hVUHE5NlU0b2xTSmh3cG00dldZVzFaaDQzbU9JUEgwMmdHYW9QZ1lXQjRGayttWHc0MWFLeEt2QVRVclJBOWtxZiswY0FBRDRRRmRVVlRkR29tUlJVYXlnaG1Hd25teFdZR0N3ZitwU1pHQlVZUC83TXNRcmc0YmdNeFpzYzZSUTNRWmlUWTUwaWtnYW5BbGkweGtiOXlhZ3BxWm0zYnRYLy8vLy9aOWE2Z0FCUUFEUU4vR2lPT3RBRWxNT2lwTTZWZ01paXRPVlNJTUZVR00wc0JqekE3QmxBd0VDQjZHTVB3TEZxc3FvNDYrWXVHKzMvLy8vOXdZb2NZQ09LZjhydG8wZ2tGQllwbUsrQ2F5UlIzVTVESkRIL2QyQUhoU2JBZ2hhR29QcDhKaTFYbDNuUjJpT1gvN3YvL1RlNzVYLyt6TEVPQU1ISkRFS2JIZkVVT1FHWU0zTzVRYlo5TlVBQUF6SmhRQUZoWkMzOE1WbmVRSWh4MU1YcEF3SURqQlJUUENhay9YVUdaeW5CaldaeVFkQWgxZTl2Mi8vL29DRlFFYVdBSnhVeTlsWlFvZ2pYZG9NZnpRN3NHekE0Y2pqWGtqN3JBc0JSdU1hQmRiR2NxMmx1YTdYc3c0UjJBQUFBQ3BOZ0FBQS9MY3FQdEsySUd0R2IrQkJNQ3BDRkFXWm9wSXNXVTFuQldDeHpWeG8vL3N3eEVLQ1JmQXZEVTVnU25DOWhWK2R6dWtHVVRuc0NoV1VCVWNERTN0Y0taMGhFQUFjaVZSZEh3d3JBekRBa0REU1pGVEhNNFRXSXNURTBZRENEOWoyUWdCRmdxQm13Q3RseFduV28xekMzRVNYMlhVQUFBQXZYWUFBQUVBSkxseXlZUVBEQnJ3Y2plMDNQY1dPTis3RGY2NnY3eXExeGhrUTA3eWJoQ3I2d2dBQUZOc0FKQkFFRFFiTU9tQVBqU3pKTXpuZ0NnTWU1a0hFLy9zeXhGYUNSb3hkQmF6d1J2REpCaDFkanV5VTEwMFpLZm9lUHhTdUltOG5CR0s3TjR0TFBXbVBsVFNBQXBOdGdBQUE2VDdOKzFKdU53cUNtRnVZUUlIMmJvZXNjdVRPMG5UR0xZQlVCRFc2SHJydWdhNllYWVZwMDlDNnZYdkprQUFCWGlCYmVpUXpsRmxydUNuY3BVckV6RTVGemxVMXg1SkZ6ZEVQWUZ5aUNFdHg2S2g2MFphNVZhb0FBQU11R0RzR1ZLMHF6bDl5MnhnS2FmLzdNc1JuQUVWb1J2MmphTVV3d0FvZWRZMHcxaHZhd1F5L1J0UUE1aGtYUjhmOHhtMktoYWt2Y09zTVlFbUc5TkxScWo1dGhPekk2Q0FGRHN4aWVjbmdNcDU4WWhsVkNqeEw4a1FMdFVOT0RrSlJaTkZTZGM1RFZqaStYVERXeTFsaHF6WHY3S20vNEFBQUFCRHBYaUY1ZEFIU1JNTU5paERRZ3hNU0JxaWFVVnREVks1R1JDVzJsZDFvQUE0QjJOOHhGY3pxVGViTURWRFhldzcvK3pMRWZRREdpRXp0ck9tSXNLK0gzZmo4dkY2WC9NWkpSZ1BNMjRUN2hJV1h5WU1EbHFRWnZOMUx6THE4dTh1d0FBQUFGU2w1cjlWRHhFOHhwck1lbVRidU04bE9OZE1qS05vNU0xQVNJTENZQUFiRkNCT3FDc3k3b0FBRTVWME1wTUlRempyazRUWlBqVkFNYUwzaU14WGNNWFFPdWF1N3V3QUFBQUJJNWIzTzBrVExLZ1hCSmtYY2hKT2lVNURidFF5b01KVHVpQUJpMVNIQS8vc3d4SkNBeG13NnVvejE1T0N4QnhyNWpMMFc0VWJuYmhwMHluYkV5ZUI3eGdhNEJLWVErSVFHUTFsckJsNUIxR1p0TVF6R3p6d2p4b1Y1RWtZS29Ia21EZ0FIaGloT1Z4ZE1RVTFGTXk0NU9TNDFWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlYvL3N5eEtRQXhId25IY3hoNFhpd0JSZlJuZUNmVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZReE1RVTFGTXk0NU9TNDFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXYvN01zVEFBTVZ3S3VmTWJTRndlUVFidU4za1Y2cXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxVEVGTlJUTXVPVGt1TmFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxci8rekRFM3dERDJDREx6R2NJT1BTRVJKSFA3SnlxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXIvK3pMRXZBUEFIQUlBQVFBQUlBQUFOSUFBQUFTcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcS8vc3l4THVEd0FBQnBBQUFBQ0FBQURTQUFBQUVxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxZz09JztcclxuY29uc3Qgc291bmRCeXRlQXJyYXkgPSBiYXNlNjRTb3VuZFRvQnl0ZUFycmF5KCBwaGV0QXVkaW9Db250ZXh0LCBzb3VuZFVSSSApO1xyXG5jb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBzb3VuZFVSSSApO1xyXG5jb25zdCB3cmFwcGVkQXVkaW9CdWZmZXIgPSBuZXcgV3JhcHBlZEF1ZGlvQnVmZmVyKCk7XHJcblxyXG4vLyBzYWZlIHdheSB0byB1bmxvY2tcclxubGV0IHVubG9ja2VkID0gZmFsc2U7XHJcbmNvbnN0IHNhZmVVbmxvY2sgPSAoKSA9PiB7XHJcbiAgaWYgKCAhdW5sb2NrZWQgKSB7XHJcbiAgICB1bmxvY2soKTtcclxuICAgIHVubG9ja2VkID0gdHJ1ZTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBvbkRlY29kZVN1Y2Nlc3MgPSBkZWNvZGVkQXVkaW8gPT4ge1xyXG4gIGlmICggd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkudmFsdWUgPT09IG51bGwgKSB7XHJcbiAgICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIGRlY29kZWRBdWRpbyApO1xyXG4gICAgc2FmZVVubG9jaygpO1xyXG4gIH1cclxufTtcclxuY29uc3Qgb25EZWNvZGVFcnJvciA9IGRlY29kZUVycm9yID0+IHtcclxuICBjb25zb2xlLndhcm4oICdkZWNvZGUgb2YgYXVkaW8gZGF0YSBmYWlsZWQsIHVzaW5nIHN0dWJiZWQgc291bmQsIGVycm9yOiAnICsgZGVjb2RlRXJyb3IgKTtcclxuICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIHBoZXRBdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyKCAxLCAxLCBwaGV0QXVkaW9Db250ZXh0LnNhbXBsZVJhdGUgKSApO1xyXG4gIHNhZmVVbmxvY2soKTtcclxufTtcclxuY29uc3QgZGVjb2RlUHJvbWlzZSA9IHBoZXRBdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKCBzb3VuZEJ5dGVBcnJheS5idWZmZXIsIG9uRGVjb2RlU3VjY2Vzcywgb25EZWNvZGVFcnJvciApO1xyXG5pZiAoIGRlY29kZVByb21pc2UgKSB7XHJcbiAgZGVjb2RlUHJvbWlzZVxyXG4gICAgLnRoZW4oIGRlY29kZWRBdWRpbyA9PiB7XHJcbiAgICAgIGlmICggd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkudmFsdWUgPT09IG51bGwgKSB7XHJcbiAgICAgICAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBkZWNvZGVkQXVkaW8gKTtcclxuICAgICAgICBzYWZlVW5sb2NrKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKVxyXG4gICAgLmNhdGNoKCBlID0+IHtcclxuICAgICAgY29uc29sZS53YXJuKCAncHJvbWlzZSByZWplY3Rpb24gY2F1Z2h0IGZvciBhdWRpbyBkZWNvZGUsIGVycm9yID0gJyArIGUgKTtcclxuICAgICAgc2FmZVVubG9jaygpO1xyXG4gICAgfSApO1xyXG59XHJcbmV4cG9ydCBkZWZhdWx0IHdyYXBwZWRBdWRpb0J1ZmZlcjsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsT0FBT0EsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxzQkFBc0IsTUFBTSwwQ0FBMEM7QUFDN0UsT0FBT0Msa0JBQWtCLE1BQU0sc0NBQXNDO0FBQ3JFLE9BQU9DLGdCQUFnQixNQUFNLG9DQUFvQztBQUVqRSxNQUFNQyxRQUFRLEdBQUcsaWhKQUFpaEo7QUFDbGlKLE1BQU1DLGNBQWMsR0FBR0osc0JBQXNCLENBQUVFLGdCQUFnQixFQUFFQyxRQUFTLENBQUM7QUFDM0UsTUFBTUUsTUFBTSxHQUFHTixXQUFXLENBQUNPLFVBQVUsQ0FBRUgsUUFBUyxDQUFDO0FBQ2pELE1BQU1JLGtCQUFrQixHQUFHLElBQUlOLGtCQUFrQixDQUFDLENBQUM7O0FBRW5EO0FBQ0EsSUFBSU8sUUFBUSxHQUFHLEtBQUs7QUFDcEIsTUFBTUMsVUFBVSxHQUFHQSxDQUFBLEtBQU07RUFDdkIsSUFBSyxDQUFDRCxRQUFRLEVBQUc7SUFDZkgsTUFBTSxDQUFDLENBQUM7SUFDUkcsUUFBUSxHQUFHLElBQUk7RUFDakI7QUFDRixDQUFDO0FBRUQsTUFBTUUsZUFBZSxHQUFHQyxZQUFZLElBQUk7RUFDdEMsSUFBS0osa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDQyxLQUFLLEtBQUssSUFBSSxFQUFHO0lBQzNETixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNFLEdBQUcsQ0FBRUgsWUFBYSxDQUFDO0lBQzFERixVQUFVLENBQUMsQ0FBQztFQUNkO0FBQ0YsQ0FBQztBQUNELE1BQU1NLGFBQWEsR0FBR0MsV0FBVyxJQUFJO0VBQ25DQyxPQUFPLENBQUNDLElBQUksQ0FBRSwyREFBMkQsR0FBR0YsV0FBWSxDQUFDO0VBQ3pGVCxrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNFLEdBQUcsQ0FBRVosZ0JBQWdCLENBQUNpQixZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRWpCLGdCQUFnQixDQUFDa0IsVUFBVyxDQUFFLENBQUM7RUFDaEhYLFVBQVUsQ0FBQyxDQUFDO0FBQ2QsQ0FBQztBQUNELE1BQU1ZLGFBQWEsR0FBR25CLGdCQUFnQixDQUFDb0IsZUFBZSxDQUFFbEIsY0FBYyxDQUFDbUIsTUFBTSxFQUFFYixlQUFlLEVBQUVLLGFBQWMsQ0FBQztBQUMvRyxJQUFLTSxhQUFhLEVBQUc7RUFDbkJBLGFBQWEsQ0FDVkcsSUFBSSxDQUFFYixZQUFZLElBQUk7SUFDckIsSUFBS0osa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDQyxLQUFLLEtBQUssSUFBSSxFQUFHO01BQzNETixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNFLEdBQUcsQ0FBRUgsWUFBYSxDQUFDO01BQzFERixVQUFVLENBQUMsQ0FBQztJQUNkO0VBQ0YsQ0FBRSxDQUFDLENBQ0ZnQixLQUFLLENBQUVDLENBQUMsSUFBSTtJQUNYVCxPQUFPLENBQUNDLElBQUksQ0FBRSxxREFBcUQsR0FBR1EsQ0FBRSxDQUFDO0lBQ3pFakIsVUFBVSxDQUFDLENBQUM7RUFDZCxDQUFFLENBQUM7QUFDUDtBQUNBLGVBQWVGLGtCQUFrQiIsImlnbm9yZUxpc3QiOltdfQ==