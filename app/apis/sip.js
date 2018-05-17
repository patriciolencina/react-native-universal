/* global Brekeke */

import EventEmitter from 'eventemitter3';
import { Platform } from 'react-native';
import './webrtcclient';

class SIP extends EventEmitter {
  constructor() {
    super();

    this.phone = new Brekeke.WebrtcClient.Phone({
      logLevel: 'all',
      multiSession: true,
      defaultOptions: {
        videoClient: {
          call: {
            mediaConstraints: {
              audio: false,
              video: {
                mandatory: {
                  minWidth: 0,
                  minHeight: 0,
                  minFrameRate: 0,
                },
                facingMode: Platform.OS === 'web' ? undefined : 'user',
              },
            },
          },
          answer: {
            mediaConstraints: {
              audio: false,
              video: {
                mandatory: {
                  minWidth: 0,
                  minHeight: 0,
                  minFrameRate: 0,
                },
                facingMode: Platform.OS === 'web' ? undefined : 'user',
              },
            },
          },
        },
      },
    });

    this.phone.addEventListener('phoneStatusChanged', ev => {
      if (!ev) return;

      if (ev.phoneStatus === 'started') {
        return this.emit('connection-started');
      }
      if (ev.phoneStatus === 'stopped') {
        return this.emit('connection-stopped');
      }
    });

    this.phone.addEventListener('sessionCreated', ev => {
      if (!ev) return;

      this.emit('session-started', {
        id: ev.sessionId,
        incoming: ev.rtcSession.direction === 'incoming',
        partyNumber: ev.rtcSession.remote_identity.uri.user,
        partyName: ev.rtcSession.remote_identity.display_name,
        remoteVideoEnabled: ev.remoteWithVideo,
        createdAt: Date.now(),
      });
    });

    this.phone.addEventListener('sessionStatusChanged', ev => {
      if (!ev) return;

      if (ev.sessionStatus === 'terminated') {
        return this.emit('session-stopped', ev.sessionId);
      }

      const patch = {
        answered: ev.sessionStatus === 'connected',
        remoteVideoEnabled: ev.remoteWithVideo,
        voiceStreamURL: ev.remoteStreamUrl,
        localVideoEnabled: ev.withVideo,
      };

      if (ev.incomingMessage) {
        const pbxSessionInfo = ev.incomingMessage.getHeader(
          'X-PBX-Session-Info',
        );
        if (typeof pbxSessionInfo === 'string') {
          const infos = pbxSessionInfo.split(';');
          patch.pbxTenant = infos[0];
          patch.pbxRoomId = infos[1];
          patch.pbxTalkerId = infos[2];
          patch.pbxUsername = infos[3];
        }
      }

      this.emit('session-updated', { id: ev.sessionId, ...patch });
    });

    this.phone.addEventListener('videoClientSessionCreated', ev => {
      if (!ev) return;

      const session = this.phone.getSession(ev.sessionId);
      const videoSession =
        session.videoClientSessionTable[ev.videoClientSessionId];
      this.emit('session-updated', {
        id: ev.sessionId,
        remoteVideoStreamURL: videoSession.remoteStreamUrl,
      });
    });

    this.phone.addEventListener('videoClientSessionEnded', ev => {
      if (!ev) return;

      this.emit('session-updated', {
        id: ev.sessionId,
        remoteVideoStream: null,
      });
    });

    this.phone.addEventListener('rtcErrorOccurred', ev => {
      console.error(ev);
    });
  }

  connect(profile) {
    this.phone.startWebRTC({
      host: profile.hostname,
      port: profile.port,
      tls: true,
      tenant: profile.tenant,
      user: profile.username,
      password: profile.password,
      auth: profile.accessToken,
      useVideoClient: true,
    });
  }

  disconnect() {
    this.phone.stopWebRTC();
  }

  createSession(number, opts = {}) {
    this.phone.makeCall(number, null, opts.videoEnabled);
  }

  hangupSession(sessionId) {
    const session = this.phone.getSession(sessionId);
    const rtcSession = session && session.rtcSession;
    rtcSession && rtcSession.terminate();
  }

  answerSession(sessionId, opts = {}) {
    this.phone.answer(sessionId, null, opts.videoEnabled);
  }

  sendDTMF(dtmf, sessionId) {
    this.phone.sendDTMF(dtmf, sessionId);
  }

  enableVideo(sessionId) {
    this.phone.setWithVideo(sessionId, true);
  }

  disableVideo(sessionId) {
    this.phone.setWithVideo(sessionId, false);
  }
}

export default new SIP();
