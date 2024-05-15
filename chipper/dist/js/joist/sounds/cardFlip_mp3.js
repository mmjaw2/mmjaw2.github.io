/* eslint-disable */
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '../../tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '../../tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '../../tambo/js/phetAudioContext.js';
const soundURI = 'data:audio/mpeg;base64,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Ak9VmOWhIXESKVktJ2z4qoUibZXEhJVmo54y2pTCpKrkqInxtCMiURCZMUikUkts1JpZqUkLOLbHCI0RE1oSXNz+SbNkLMYykmzS0yFmTUlVCZ6udDBEKnkJlZCQhktiVP8kt2mGpHnoyCiA//u0xFQAFJGA2aSZNKMnNZKxzTAlCSoDGlYIaVGpygYYefKF0UpWkqkrtgp6HRRPZ5axHA+enRVOHHuXIak+k6KgHkM9YJwSlxO+7i7XWv7etVMjdXHJVJA/RPnrxiHQnFtT7Ubs7M81d1qM5hc9lw+EkhHZdLh2oMkqI6XmSVTa388cpVBk+crFS06YfpGtgvy6B6ubzT5iVVCpnL8ZJXz2BGeprtHKHFuQrC0SWDoeSoZnhGAiKi22w9p6SjtQfUMkPvmzPZvfXN6zV52lmQL/9EfSDeEzcSop1UxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//u0xAADwAAAAAAAACAAADSAAAAETEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbImNhcmRGbGlwX21wMy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgYXN5bmNMb2FkZXIgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FzeW5jTG9hZGVyLmpzJztcclxuaW1wb3J0IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkgZnJvbSAnLi4vLi4vdGFtYm8vanMvYmFzZTY0U291bmRUb0J5dGVBcnJheS5qcyc7XHJcbmltcG9ydCBXcmFwcGVkQXVkaW9CdWZmZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvV3JhcHBlZEF1ZGlvQnVmZmVyLmpzJztcclxuaW1wb3J0IHBoZXRBdWRpb0NvbnRleHQgZnJvbSAnLi4vLi4vdGFtYm8vanMvcGhldEF1ZGlvQ29udGV4dC5qcyc7XHJcblxyXG5jb25zdCBzb3VuZFVSSSA9ICdkYXRhOmF1ZGlvL21wZWc7YmFzZTY0LC8vdTB4QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFTVzVtYndBQUFBOEFBQUFKQUFBV2dBQWNIQndjSEJ3Y0hCd2NIRGc0T0RnNE9EZzRPRGc0VlZWVlZWVlZWVlZWVlZWeGNYRnhjWEZ4Y1hGeGNZNk9qbzZPam82T2pvNk9xcXFxcXFxcXFxcXFxcXJIeDhmSHg4Zkh4OGZIeCtQajQrUGo0K1BqNCtQai8vLy8vLy8vLy8vLy8vOEFBQUE4VEVGTlJUTXVPVGx5QWMwQUFBQUFBQUFBQURUQUpBWldnUUFBd0FBQUZvQWZZT21KQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQS8vdTB4QUFBR1ZsL0M3U1dBQVE1d2FqL05UQUFJTUFTQkRBS2lrNEF3QmdtS3cyVG13VUZBQXdUSjNrQUJBTUhndUlBTkJJSmxTV0RjL2dKWWxtWTd2SEFnRXhPZU1rc1J6OHFBZ0loZkFBQUlXT3ZpeHhPRFFSRHpwWVdPTmlRSWlqYjRzNXNTQklNSE5YZzNKOWlXSllsbVptZnI3TEJMTTM4V1U2WnBTakN3d1BJaVdCQUdoNVZ1LzYyWUdDem0xNjkrVzE2OTlna0EwTENjQ0FIRHlGZXY5aFl2TXpNemZnT0R5RWtHRG1uWkxKNzV3Qk1HNStqV09UaElBbUZhdGd3V1VZTUFiZzNCdUk1UGZ4WXNYdm54T0h4R0gxSElZMGM1MUJnb0dFUmJablExTUhNWFVNeHF2SDZhM29qTEFucEQ4cUFRelJrSUJrU1owMVFFZ1V3NHN4WXhkN1g1b2VDQXdrQ2pJK3g3QnVZR0FBRnpnYTFnM2dFYUNVd3kyRmxKSmdNaUJBZ01zRVRFR2lQd3QvQ3lZQU1CT0IwZ0dFWWZPTmdpaE5oaWNqeGhqUGgrZ2U4QktZR21JQll5YUFPZVM1bU9BMFRSRUV4UzRsb3M0MEp3WjRpZ2V1Tm82YWsyb1dXYkZ4S1Q1Y0pjMUo4dWtpVWh0eTRnWkRHU1lQRVhJR1h5Zk15K1N4Z1Q1UU4weUJFUUdVR1VJMFpBcU9RU2dibkR4VFBvRjh2dWZSTlMyVkVURXZGQVpRelpJZ2hZTnhsQmppV0o4OG1wUmdUaWRBdm04MEtwbVQ1dWdkV21qTjNNeHdHaE9KTWJwbUJxZklnWFAvLy8vK3V6OSsyMy8vNlJneWtEUmFYUndvcVZDYUpWb0FUQUFBQUJSVGNxS1JibE9Cc0VrSUJ2a21Rd0JzUWxTQWxrWVNFZ0ZDeGk0VW1lRUlBUnNZM0dRWUlsZHBCaUlLZzVCbDdRTVZSSXBMMElrRExYTmY0eTQzK2g0dWxGbjBWYVpBby8vdTB4Q2lBSStHYlFmbk1nQVVFeEdyL040QUFOSlBSR3UxMkFualNnZmR0cWRCb0Vnb1BTNStYVVhMaTVVUEtkeHVEbVROTGRZTEJxYU5abVpiTzB0cUdvS2xNdGhxSTNuTEZBRnFzMmNtU1ZhTnJVV240cEpZdS83NFhvaTArRU8xRHJvbzJsb1dVdHF2bHBWaTV2TEc3MzY5UHF4Vnh4cFc2c3NXakpvWmpTdHF3c2RaVGhmNVlyNGQzWXQ5bVl0Qjd3eWJOMDVSRUY4d1d1bVVRNDR6ZFgrazY4V3RRTTJOL1haaGlXMDJxZXBMYXMzZDYyakxJRmhoaWM1R3FqV0pEVmpVRzAxWE8vR2FDenpmL2xqekdzQi82eTRvQnNCa2t0L2dvOTZpQTVCdUlKNFpYT0hOaU5UQzRkRFVZaUVaQTI0VEx3SGtrSUpEZ3hxWVduVUNpd2RMek1nTXdvUVJ0TFdRSVlncXBqaU1ZQXczQW9NQUJXZzFyUWkwb3NGMEV5bWJKRmt5M25EREk0SmVPU2x1b3lid29DMFd6Q3BCOWlhVEVNZGhZS1VqU2pYRmt1Rk5BZ0tBSnBNQ1dManBRSEZMYitPdzhSZHhranVNNmJxbk03YWVyVHVPTzJrVnZ6ZGxQQkg4dW9qeWhXNUwwRi9XOG1WU3NJU3BZUkxuN2Z0L0lZdlJoMTNVTDF4WitIWHduTGJVblNaYzJOY3pyZGRMRDVaVXBMVVlpa1hwR2tOTXA1STdqT0oySDFOTHk2bGdWcE4rdVdKcGl1SXlsbHNWa2ZlWEpaK1ZtM2R2NVRTNjNIcEU2Nk9IRSswMEZZR2NTQys4RHN0eWM1cFN3elgwTWsra3RYNmNsalgvL2YvLy8vLy8vLy8vLy8vLy8vLy85LzRmN25UNVc5NTQ5d3oxK2VzUC8vLy8vLy8vLzNKY0tIb2pZbDJXZUVNekZIVGQ1cW0zVlpUcDRxOG1KZDNZejI5L3VzZ2tGd09XTFRDUlV6OEpNTUQxMy8vdTB4QTJBRzZWaFovbThBQVNiT0djN3Q0QUZTYzJjVkVRK1lXUUs3TVdBNmhpNFNsYUZRTUZGSU9GVllRV3NJWXNsTFIwR0hJb3F3RmswUm12THlwclUwV25GU2tVM3JpYVl0ck8wQkFEM21DTC9aS1g5dnhtU09rLzEra2kxTXNlbVhYS245c3M3WmJCMHRtN1YvREs3dmtUZ2VBNWMxeHVrQzFJTnBwYkJVY2dibi8vOTIxOTFYSGZ4cWJPTExxVnExdUhYMWxFdXB2Ly8vLytQdjNFNTUrSlZPdy9NeWV0UTV4bTVXdjNzZGYvLy8vLys1RVBSU054V043aThZcGJOUGFpTXBsRXZsMUxWeXBaSmNwNHorWEVILy9hSnJNeER3eVRGMTVsRThZakVEa3FaOGhtMEM1a2JBWis2bWRJWnJrT2ErTG1SRjVrQXlLQTVrQWVZeVlGZ0FNTkFDSU9CSmdTVVJzTHBobTJHaFlrUElBbFFFMVZSUGxGRXhVbEVsbEdaRWhzcGt3ZFlpQTlzaldVRWFSYkxZOG9pbFNtQ2dKWHErTFRwSlNTNktVY2xnWnlIZGJzeXBDTmQwTkY0bDVLWlBvaU10SmlTUHpqMm5jWnE4VG11cFF2TTRrR3NsWEZUT003ampPNjExeW9yTnZ5L1RKYkVDU3BhVC9xcXN2WmhMWDduYXNtak1hZHArbkdpVXpGb2FoNXNVTXhPVHdCRjZlNDNGMnNiTGNwUEMzZWZTR1lKVnRqcjFTcVF4V0dkc0dpYnh5cDJvdlE0UHhrMTJsZmFrZjZCcGJGV2RRM0h1YXhhOURUdXNsZVYvWTNLbjVoNmZuWVp0MUxQL3ovdmR1L2orT0d1NWR3M3ptdi9uNzUvNDFQalFlSXRlWWFxQjNaOWVHVlVWRlcyeldmVFFCellBamRGd2RVS3FjeVNFSVlEUnNPL2t5TTB4VXZRWkVrUktoR0pRR05OTElnNEN5a0FQRzJHR0RrQVBnZFNZTW9taDRvUy8vdTB4Q0VBSGhGN09lMDlrZVE3c0dXOXZEMzljSUN5eXJ5aFdES0ZlSmthOFJYR2FseUVyeXVOMWpIYVpKZ0Z3VEpjMGZDaGxDY3BBa3VDZ1M0bklRVStWQXVWOStjeXl6TWpjRU9OTlNvMVRvWTRYWVdiSmJFV3NtaWV4WEg1RkVGSVNRbUJzNElPRVFTaEJIazVXaDBUM3lHdEpKKzVHdHV2Sm9palphWEhibE1kVjY0ZTR4REVVdzRpcGpkS1JqK0ZDSStSUE1KMlY5VjhSYVVydVFrajJDS2lWT3RucW94V3djZExvRStsYUZtSmJFRW0xTUhwdkNTbTIzWVZ0UXpnRUdkMm1iWldUamNia05EZ2tvUU9IbVRDNWtTV1lndm5HSnBuQUdNR0tLNGlPd3NIQTQyTTdHUlVvTWdHVENnUURCUmM5WHc0SmZLdUM1S3NJZHhsN2h0T1dUQnp6UTdFTGFEVHRMV2E4bkNwZ1cyYjVvQzZVN3hLcWNDbmJESGxlMUhrdHl5Tnltdk16YUREYjJQODF4V0ZwUXdFV3pGbjlIaXdkRllzN3JwM24wYTI0bitpeDlDUEtKbE5RVFV0cENTVldWWnNQMVJLcEZYTnRpZklNRzhsenlINDVIVWpUeE81ZG44Y1VaaWNWNTVPcEJibXhGS0Zsa1pFZEFTVU5xZEtZNmtQTERaTnE1T08yeFRuS2pYVEM2UzJDbFVjUlN1TFV1MCs3VXhoMmdwU0krZk56RXBVOU1ubVJoaXFsRkgyZVYxT2RNbXpSSm50WXlTZnByMkplZnZVYUt2RXE0V0N1Ym5kTE5VRmFJcVhoV2NrVFNTTWR6TVVNTlRFTWExTk1aTmRGTXBIWndaWW1HYUFBSU1Lck1BeGRvd0lBR21nRUtUVkVZbEc1eEdpRjhsdklCVXRYVmdadzJTSkRML2pIczJTMWNaTWVDRWRnNFdyWTl0bFp5MFlNVEtSdGJWTHR5R2JIVVM4a1NvTVZSbk00SzhzVEtqaS8vdTB4RGFBSUFXUEorMDltcXoyUENJNXZENDFnSjBQVWxpOEtKVHBwbWtUUnp6R2taTGdob3NLalpVQWwzaCtNYUdGMlNaaUllQWxCUHcrVUJPVXpvc0dSSldKQzRXQ3k4WW96OFNublRIem81UHhGUEJLVW9HbWJGaDVjY05qeEJRVHBrNE5pS0pJZ1BGTVNoSmZPWEVHU3ltUGlLOFJuVE1xSE5YMFM1R0RabDg0YlpXTGNLZG9MSVJWUEd5cTBoS2sxKytmMTdmMFNvZVVnM1RJV0Y2dkZncytQc0R0Z2l0RHU4SXl6S29mclhHVkU1dkN1ZGUxSEpKS0FVeEplT1FQd01hbUl2WkVjbVFNSm9TZWEwd21pQzZpQkNJbUpCdzhiQTVZQndxbWUwNDVIUEdTWnFCc3JCUFZIWGFTNmFZSVJNSWFVMHd1dXBzcHVoYUtpTFRMMFNyR0JyQ2wzVVFFNGsrVjJLWkp5cVRVQnhUemlzdFlVNHpjS0JBQ0pRUktOaVY5TCtEalA2OGJJVmlwZE44NG9oSW5odnYxQ2Z3bnNpaVBFMEFiUlBrV2l6ZUtZc1F0b3RxYkJoRnpIUVNVZW9uNHR4aUFYZzVXQWdwMXVrV0VOSHlocjRzSmJSZW40WkNISGNLcXhvbEFyaS9QQzRJcHJPWWd6OTR2R1FxeGhIRU9VeUJjaVFqcFZ4SkNGcVZEVzRueGR4dXRCL3JSWVMrbzh2OGFpdVdsTXA0YmdyVkl4dkdOWmlITzRLS3pNcUdsRklmT2hxNXc1V2ZLZE92MlhLaGNMUllUeGs4bTRlNDhXUnppd21GN015dWFlcExCN2FxVmRHOUkxbnNaeEpBeUUzMjMrMWt0c1pKN0txdmlqR3prY0NqcWsyeUVXS3JKSFFxbHJucG5LMm80Z29GTG1DcE90NGtLdXN1aXdkRGRwQ0p1bmRVdFp6TXRLVEZkVXVzMlJZcENGUVZZcW1LNkx4QW9OU3I1aDEwWDlkbGRMa2pMTVluSi8vdTB4QzBBSGlHQkY2MDlPeXlMdlIrMXpESDRQUkpVSlNheThKOE9rd2gzbDFNc01FVkpVbWlyMXlib2dMR1l5R3dKWEZWbHRQMGZwZlJOVDlINlQ1WFBsS2JKNFJ4OGt0RW1YYTRPSll5UWxDVzA2bTRuUmJpSHFxejlVUURkZnhrNm55ZEljWExER1p6MkpPaW1sd1lseXVwT0lqYjBrRnVPd1ZuY1VUMFFpbDFFS05wWExxVVlOeFMycTJwSDExcXUwa1NtckUwc3NnbVhsd1ozRC9yak51S1NicUNocFZYM2tnRWdsRzVKYldpMEk0SWFWQ1JnUURvbGdvV0VRTFQyQ0JNejJvaE9NRWdKTThTQkxRVEE0T01EZ1pTNFFIWUE3S2hLNHpaVUlpSzZGcEYzbzYxT3NGem8rd1dJb21ZSUZJWldKRHJXTzIyR2h4UzR4dGFnT3NNeWJrR2VRZlVGVWZUQkw2cTRGaEZya1VrNlVFUk50SkpIUnI0RlVuVzBwQmx4RTcxdElCV1l5Q0RHNXFDRE4wTFJ4Q2txbkk5RndFbFlMR2duanFXa0ZaZDFjUVIxcVBKNzloS0h0ZXRIWTZDWjB1TnFXVUU1T1RKdTRpb2lzVlRWd1NpY1pIUzVJZk1nNEhaNGducDBVVnhYSW9URWtRUkpCaVJhT2w0bm5TNGxFOG5nSllKcU01MVVFcE9PajhSU29XaXNKUzg3S3BlTjNCSldGa1ZHTFIrOTlMelpjdlltQnBPVlZDRXVWcFYxVEZFK3VxNGRKcnBVeCswK3BlU0hST1ZXZVlwNWtxbXpYUUFBR2piVGFiUHpPZ1lFS3BscEU4a1RsRGxuTXloYUx6SjM1bFMrbDNWMnN2WXpGcHN5bUt5Uk5kbHk4bHF1S3hwbHhkZElCVXhoWUV3cHFLZXFISlU4bmEwZ0JYK0Fxb3hEZ2pScUNaa0diVGZBbFZwZ0xFVFVJZU53TDRPb2NDWk5GR25DY1ZrbWNLc1lHMUpKVTkwSy8vdTB4RGlBSXBIazcwMjlPY3QrTUI0MWg3TDBUcE9pM0k1a1kwTklLUW1aS3VMQkNSaXBrVEJldDV1YngzRHFUeEJpeGtJSkdmcEJqU0x5eG4waDU3SzFUTG1BMklsT29GY3FRdHFHcTF5VDBCa2dKQktzS2RQcWlSSnF4dUZoWFcwVEdJUHBEbEVycE1tbEVUYXcydGpVVDFsWFRjUVpEbWx3aUhDM2tpb1NweWJ5VWw1bGozSUtRbTdjWEpGSXhDam1oTmwrdVVhNkRUUkZxVHVUSHpNWlFJbzlLdVZJU1ZkWVJHN1UxRThSRUtRTEh5R3BQbkFDaXRyVGNscmtwbWFQQmQ3Y1JkbDhzNWEzV0JYK2JhSFlaYzJIbitlV0duU2g2QW1YUzF3V3U5bE5oM3E4MVB6cmhJU2gwSkZKTmtkdzRyY2l6a0ZlUE0vbVptVHhiVmFxWlNDbVMzTUtzU3IxbU5KamlMc1FsR21VaEowdlVTcVg1Q1VOVEtvWnkydUt1VnJwbW1MOFFwQ29MaTJ2VkMydlVOWVhqOVF2MWtnems0RnVSS3RZVlFubDhxazhqbGU5WVZhWDBreWRlSWxVOTdRMHNTRitQbm1pQ0FWU0RWaGV3cVNGcjRWMTBxd2VUeGNaQ1V5QUtEVWRWbU5Ba0FFWEMrYUd4NDhuRUVCcDlHU1IxT2hTc0FVQVpJKzVIdXFQR1BMTnM1M3NBSUtocVNDYVlMaHduRE9jcVNySWhTNU15UkpwSWlJdzlXTVVJMEdyUlNSSlZVa1FDa2FpS0FSTFNLTkZnRUNIRVdzVXRLcENvVk5pa3lSSkFrOVZtT1doSVhFU0tWa3RKMno0cW9VaWJaWEVoSlZtbzU0eTJwVENwS3JrcUlueHRDTWlVUkNaTVVpa1VrdHMxSnBacVVrTE9MYkhDSTBSRTFvU1hOeitTYk5rTE1ZeWttelMweUZtVFVsVkNaNnVkREJFS25rSmxaQ1Foa3RpVlA4a3QybUdwSG5veUNpQS8vdTB4RlFBRkpHQTJhU1pOS01uTlpLeHpUQWxDU29ER2xZSWFWR3B5Z1lZZWZLRjBVcFdrcWtydGdwNkhSUlBaNWF4SEErZW5SVk9ISHVYSWFrK2s2S2dIa005WUp3U2x4Tys3aTdYV3Y3ZXRWTWpkWEhKVkpBL1JQbnJ4aUhRbkZ0VDdVYnM3TTgxZDFxTTVoYzlsdytFa2hIWmRMaDJvTWtxSTZYbVNWVGEzODhjcFZCaytjckZTMDZZZnBHdGd2eTZCNnVielQ1aVZWQ3BuTDhaSlh6MkJHZXBydEhLSEZ1UXJDMFNXRG9lU29abmhHQWlLaTIydzlwNlNqdFFmVU1rUHZtelBadmZYTjZ6VjUybG1RTC85RWZTRGVFemNTb3AxVXhCVFVVekxqazVMalZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVi8vdTB4QUFEd0FBQUFBQUFBQ0FBQURTQUFBQUVURUZOUlRNdU9Ua3VOVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVk1RVTFGTXk0NU9TNDFWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVic7XHJcbmNvbnN0IHNvdW5kQnl0ZUFycmF5ID0gYmFzZTY0U291bmRUb0J5dGVBcnJheSggcGhldEF1ZGlvQ29udGV4dCwgc291bmRVUkkgKTtcclxuY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggc291bmRVUkkgKTtcclxuY29uc3Qgd3JhcHBlZEF1ZGlvQnVmZmVyID0gbmV3IFdyYXBwZWRBdWRpb0J1ZmZlcigpO1xyXG5cclxuLy8gc2FmZSB3YXkgdG8gdW5sb2NrXHJcbmxldCB1bmxvY2tlZCA9IGZhbHNlO1xyXG5jb25zdCBzYWZlVW5sb2NrID0gKCkgPT4ge1xyXG4gIGlmICggIXVubG9ja2VkICkge1xyXG4gICAgdW5sb2NrKCk7XHJcbiAgICB1bmxvY2tlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3Qgb25EZWNvZGVTdWNjZXNzID0gZGVjb2RlZEF1ZGlvID0+IHtcclxuICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBkZWNvZGVkQXVkaW8gKTtcclxuICAgIHNhZmVVbmxvY2soKTtcclxuICB9XHJcbn07XHJcbmNvbnN0IG9uRGVjb2RlRXJyb3IgPSBkZWNvZGVFcnJvciA9PiB7XHJcbiAgY29uc29sZS53YXJuKCAnZGVjb2RlIG9mIGF1ZGlvIGRhdGEgZmFpbGVkLCB1c2luZyBzdHViYmVkIHNvdW5kLCBlcnJvcjogJyArIGRlY29kZUVycm9yICk7XHJcbiAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBwaGV0QXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgMSwgcGhldEF1ZGlvQ29udGV4dC5zYW1wbGVSYXRlICkgKTtcclxuICBzYWZlVW5sb2NrKCk7XHJcbn07XHJcbmNvbnN0IGRlY29kZVByb21pc2UgPSBwaGV0QXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YSggc291bmRCeXRlQXJyYXkuYnVmZmVyLCBvbkRlY29kZVN1Y2Nlc3MsIG9uRGVjb2RlRXJyb3IgKTtcclxuaWYgKCBkZWNvZGVQcm9taXNlICkge1xyXG4gIGRlY29kZVByb21pc2VcclxuICAgIC50aGVuKCBkZWNvZGVkQXVkaW8gPT4ge1xyXG4gICAgICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICAgICAgc2FmZVVubG9jaygpO1xyXG4gICAgICB9XHJcbiAgICB9IClcclxuICAgIC5jYXRjaCggZSA9PiB7XHJcbiAgICAgIGNvbnNvbGUud2FybiggJ3Byb21pc2UgcmVqZWN0aW9uIGNhdWdodCBmb3IgYXVkaW8gZGVjb2RlLCBlcnJvciA9ICcgKyBlICk7XHJcbiAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgIH0gKTtcclxufVxyXG5leHBvcnQgZGVmYXVsdCB3cmFwcGVkQXVkaW9CdWZmZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLE9BQU9BLFdBQVcsTUFBTSxtQ0FBbUM7QUFDM0QsT0FBT0Msc0JBQXNCLE1BQU0sMENBQTBDO0FBQzdFLE9BQU9DLGtCQUFrQixNQUFNLHNDQUFzQztBQUNyRSxPQUFPQyxnQkFBZ0IsTUFBTSxvQ0FBb0M7QUFFakUsTUFBTUMsUUFBUSxHQUFHLHloUEFBeWhQO0FBQzFpUCxNQUFNQyxjQUFjLEdBQUdKLHNCQUFzQixDQUFFRSxnQkFBZ0IsRUFBRUMsUUFBUyxDQUFDO0FBQzNFLE1BQU1FLE1BQU0sR0FBR04sV0FBVyxDQUFDTyxVQUFVLENBQUVILFFBQVMsQ0FBQztBQUNqRCxNQUFNSSxrQkFBa0IsR0FBRyxJQUFJTixrQkFBa0IsQ0FBQyxDQUFDOztBQUVuRDtBQUNBLElBQUlPLFFBQVEsR0FBRyxLQUFLO0FBQ3BCLE1BQU1DLFVBQVUsR0FBR0EsQ0FBQSxLQUFNO0VBQ3ZCLElBQUssQ0FBQ0QsUUFBUSxFQUFHO0lBQ2ZILE1BQU0sQ0FBQyxDQUFDO0lBQ1JHLFFBQVEsR0FBRyxJQUFJO0VBQ2pCO0FBQ0YsQ0FBQztBQUVELE1BQU1FLGVBQWUsR0FBR0MsWUFBWSxJQUFJO0VBQ3RDLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztJQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztJQUMxREYsVUFBVSxDQUFDLENBQUM7RUFDZDtBQUNGLENBQUM7QUFDRCxNQUFNTSxhQUFhLEdBQUdDLFdBQVcsSUFBSTtFQUNuQ0MsT0FBTyxDQUFDQyxJQUFJLENBQUUsMkRBQTJELEdBQUdGLFdBQVksQ0FBQztFQUN6RlQsa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVaLGdCQUFnQixDQUFDaUIsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVqQixnQkFBZ0IsQ0FBQ2tCLFVBQVcsQ0FBRSxDQUFDO0VBQ2hIWCxVQUFVLENBQUMsQ0FBQztBQUNkLENBQUM7QUFDRCxNQUFNWSxhQUFhLEdBQUduQixnQkFBZ0IsQ0FBQ29CLGVBQWUsQ0FBRWxCLGNBQWMsQ0FBQ21CLE1BQU0sRUFBRWIsZUFBZSxFQUFFSyxhQUFjLENBQUM7QUFDL0csSUFBS00sYUFBYSxFQUFHO0VBQ25CQSxhQUFhLENBQ1ZHLElBQUksQ0FBRWIsWUFBWSxJQUFJO0lBQ3JCLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztNQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztNQUMxREYsVUFBVSxDQUFDLENBQUM7SUFDZDtFQUNGLENBQUUsQ0FBQyxDQUNGZ0IsS0FBSyxDQUFFQyxDQUFDLElBQUk7SUFDWFQsT0FBTyxDQUFDQyxJQUFJLENBQUUscURBQXFELEdBQUdRLENBQUUsQ0FBQztJQUN6RWpCLFVBQVUsQ0FBQyxDQUFDO0VBQ2QsQ0FBRSxDQUFDO0FBQ1A7QUFDQSxlQUFlRixrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=