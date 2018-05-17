/**
 * webrtcclient.js
 * 1.0.0.8
 *
 * require jssip/jssip-0.7.11-1.js
 *          OR
 *         jssip/jssip-0.4.2-1.js AND jssip/rtcninja.js
 */

if (typeof Brekeke === 'undefined') {
  window.Brekeke = {};
}

/**
 * instance Brekeke.WebrtcClient
 */
if (!window.Brekeke.WebrtcClient) {
  window.Brekeke.WebrtcClient = {};
}
(function(WebrtcClient) {
  var Phone, Logger, by, clone, stringify, int, string;

  /**
   * class Brekeke.WebrtcClient.Phone
   */
  Phone = function(options) {
    var d;

    /**
     * private fields
     */
    this._options = clone(options) || {};
    this._logLevel = this._options.logLevel || 'log';
    this._jssipLogLevel = this._options.jssipLogLevel || this._logLevel;
    this._logger =
      this._options.logger ||
      new Brekeke.WebrtcClient.Logger(this._logLevel, null, true);
    this._audioContext =
      this._options.audioContext ||
      (window.AudioContext ? new window.AudioContext() : {});
    this._mediaStreamConverter = this._options.mediaStreamConverter || null;

    this._lastCreatedEventId = 0;
    this._eventIdFuncTable = {};
    this._eventNameIdsTable = {};

    this._ua = null;
    this._vua = null; // video client

    this._uaStarting = false;
    this._vuaStarting = false;
    this._phoneStatus = 'stopped';

    this._gettingUserMedia = false;
    this._getUserMediaTimeout = 30;

    this._defaultGatheringTimeout = 2000;

    this._user = '';
    this._videoClientUser = '';

    this._lastCreatedSessionId = 0;
    this._sessionTable = {};
    this._sessionRemoteStreamsTable = {};
    this._sessionRemoteStreamUrlTable = {};
    this._sessionLocalMediaTable = {};
    this._outgoingRtcInfo = {};
    this._lastCreatedVideoClientSessionId = 0;
    this._ridVideoClientSessionsTable = {};
    this._ridMembersTable = {};
    this._tryingVideoCallTargets = {};

    this._masterVolume =
      typeof this._options.masterVolume === 'number'
        ? this._options.masterVolume
        : 1000;

    /**
     * field autoAnswer
     */
    this.autoAnswer = this._options.autoAnswer || false;

    /**
     * field ctiAutoAnswer
     */
    this.ctiAutoAnswer = this._options.ctiAutoAnswer || false;

    /**
     * field doNotDisturb
     */
    this.doNotDisturb = this._options.doNotDisturb || false;

    /**
     * field multiSession
     */
    this.multiSession = this._options.multiSession || false;

    /**
     * field dtmfSendMode
     */
    this.dtmfSendMode = int(this._options.dtmfSendMode);

    /**
     * field defaultOptions
     */
    d = this._options.defaultOptions;
    this.defaultOptions = {
      main: {
        call: (d && d.main && d.main.call) || {
          mediaConstraints: { audio: true, video: false },
        },
        answer: (d && d.main && d.main.answer) || {
          mediaConstraints: { audio: true, video: false },
        },
      },
      withVideo: Boolean(d && d.withVideo),
      videoOptions: {
        call: (d && d.videoClient && d.videoClient.call) || {
          mediaConstraints: { audio: false, video: true },
        },
        answer: (d && d.videoClient && d.videoClient.answer) || {
          mediaConstraints: { audio: false, video: true },
        },
      },
      exInfo: '',
    };

    // enable jssip log
    if (
      this._jssipLogLevel !== 'none' &&
      JsSIP &&
      JsSIP.debug &&
      JsSIP.debug.enable
    ) {
      // jssip 0.6~
      JsSIP.debug.enable('*');
    }

    // for jssip ~0.5
    if (!JsSIP.rtcninja) {
      rtcninja();
      JsSIP.rtcninja = rtcninja;
    }
  };
  /**
   * Phone prototype
   */
  Phone.prototype = {
    /**
     * function addEventListener
     */
    addEventListener: function(eventName, func) {
      var eventId = 0;

      eventId = ++this._lastCreatedEventId;
      this._eventIdFuncTable[eventId] = func;
      if (!this._eventNameIdsTable[eventName]) {
        this._eventNameIdsTable[eventName] = [];
      }
      this._eventNameIdsTable[eventName].push(eventId);

      return string(eventId);
    },

    /**
     * function removeEventListener
     */
    removeEventListener: function(eventName, eventId) {
      var i = 0;

      eventId = int(eventId);

      if (eventId) {
        // remove one
        if (this._eventNameIdsTable[eventName]) {
          for (i = this._eventNameIdsTable[eventName].length; i--; ) {
            if (this._eventNameIdsTable[eventName][i] === eventId) {
              this._eventNameIdsTable[eventName].splice(i, 1);
            }
          }
        }
        delete this._eventIdFuncTable[eventId];
      } else {
        // remove all events in eventName
        if (this._eventNameIdsTable[eventName]) {
          for (i = this._eventNameIdsTable[eventName].length; i--; ) {
            delete this._eventIdFuncTable[
              this._eventNameIdsTable[eventName][i]
            ];
          }
          this._eventNameIdsTable[eventName] = [];
        }
      }
    },

    /**
     * function startWebRTC
     */
    startWebRTC: function(configuration) {
      var auth = '',
        url = '',
        urlUrl = null,
        host = '',
        password = '',
        port = 0,
        tls = false,
        user = '',
        userAgent = '',
        useVideoClient = false,
        videoClientUser = '';

      // check parameters
      if (!configuration) {
        this._logger.log('warn', 'Empty configuration');
        return;
      }
      url = string(configuration.url);
      if (url) {
        urlUrl = JsSIP.Grammar.parse(url, 'absoluteURI');
        host = string(urlUrl.host);
        port = int(urlUrl.port);
        tls = Boolean(string(urlUrl.scheme).toLowerCase() === 'wss');
      } else {
        host = string(configuration.host);
        if (!host) {
          this._logger.log('warn', 'Empty configuration.host');
          return;
        }
        port = int(configuration.port);
        if (port <= 0) {
          this._logger.log('warn', 'Invalid configuration.port');
          return;
        }
        tls = Boolean(configuration.tls);
      }
      user = string(configuration.user);
      if (!user) {
        this._logger.log('warn', 'Empty configuration.user');
        return;
      }
      auth = string(configuration.auth);
      password = string(configuration.password);
      useVideoClient = Boolean(configuration.useVideoClient);
      videoClientUser =
        string(configuration.videoClientUser) || user + '~video';
      userAgent = string(configuration.userAgent);

      // check environment
      if (this.getEnvironment().webRTC) {
        // WebRTC enabled
      } else {
        this._logger.log('warn', 'WebRTC not supported');
        return;
      }

      // check started
      if (this._ua) {
        this._logger.log('info', 'WebRTC already started');
        return;
      }

      // instantiate JsSIP.UA
      this._ua = new JsSIP.UA({
        log: { level: this._jssipLogLevel },
        uri: user + '@' + host,
        password: password,
        ws_servers: url ? url : (tls ? 'wss://' : 'ws://') + host + ':' + port,
        display_name: '',
        authorization_user: '',
        register:
          typeof configuration.register === 'boolean'
            ? configuration.register
            : true,
        register_expires:
          typeof configuration.register_expires === 'number'
            ? configuration.register_expires
            : 1296000,
        registrar_server: '',
        no_answer_timeout: 60,
        trace_sip: true,
        stun_servers: [],
        turn_servers: '',
        use_preloaded_route: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        hack_via_tcp: false,
        hack_ip_in_contact: false,
      });
      if (useVideoClient) {
        this._vua = new JsSIP.UA({
          log: { level: this._jssipLogLevel },
          uri: videoClientUser + '@' + host,
          password: password,
          ws_servers: url
            ? url
            : (tls ? 'wss://' : 'ws://') + host + ':' + port,
          display_name: '',
          authorization_user: '',
          register:
            typeof configuration.register === 'boolean'
              ? configuration.register
              : true,
          register_expires:
            typeof configuration.register_expires === 'number'
              ? configuration.register_expires
              : 1296000,
          registrar_server: '',
          no_answer_timeout: 60,
          trace_sip: true,
          stun_servers: [],
          turn_servers: '',
          use_preloaded_route: false,
          connection_recovery_min_interval: 2,
          connection_recovery_max_interval: 30,
          hack_via_tcp: false,
          hack_ip_in_contact: false,
        });
      }
      // set auth to registrator extra headers
      if (auth) {
        if (typeof this._ua.registrator === 'function') {
          this._ua.registrator().setExtraHeaders(['Authorization: ' + auth]);
          if (this._vua) {
            this._vua.registrator().setExtraHeaders(['Authorization: ' + auth]);
          }
        } else {
          this._ua.registrator.setExtraHeaders(['Authorization: ' + auth]);
          if (this._vua) {
            this._vua.registrator.setExtraHeaders(['Authorization: ' + auth]);
          }
        }
      }
      // user agent (jssip-0.7.11-1~ only)
      if (userAgent) {
        this._ua.userAgent = userAgent;
        if (this._vua) {
          this._vua.userAgent = userAgent;
        }
      }

      // attach JsSIP.UA event listeners
      if (configuration.register === false) {
        this._ua.on('connected', by(this, this._ua_registered));
      } else {
        this._ua.on('registered', by(this, this._ua_registered));
      }
      this._ua.on('unregistered', by(this, this._ua_unregistered));
      this._ua.on('registrationFailed', by(this, this._ua_registrationFailed));
      this._ua.on('newRTCSession', by(this, this._ua_newRTCSession));
      if (this._vua) {
        if (configuration.register === false) {
          this._vua.on('connected', by(this, this._vua_registered));
        } else {
          this._vua.on('registered', by(this, this._vua_registered));
        }
        this._vua.on('unregistered', by(this, this._vua_unregistered));
        this._vua.on(
          'registrationFailed',
          by(this, this._vua_registrationFailed),
        );
        this._vua.on('newRTCSession', by(this, this._vua_newRTCSession));
        this._vua.on('newNotify', by(this, this._vua_newNotify));
      }

      this._changePhoneStatus('starting');
      this._uaStarting = true;
      if (this._vua) {
        this._vuaStarting = true;
      }

      this._user = user;
      this._videoClientUser = videoClientUser;

      // start JsSIP.UA
      try {
        if (this._vua) {
          this._vua.start(); // start this._ua after _vua_registered
        } else {
          this._ua.start();
        }
      } catch (e) {
        this._logger.log(
          'warn',
          'UA.start error message: ' + e.message + '\nstack: ' + e.stack + '\n',
        );
        this.stopWebRTC(true);
      }
    },

    /**
     * function stopWebRTC
     */
    stopWebRTC: function(force) {
      var session, sessionId;

      // check stopped
      if (!this._ua) {
        this._logger.log('info', 'WebRTC already stopped');
        return;
      }

      this._changePhoneStatus('stopping');

      for (sessionId in this._sessionTable) {
        session = this._sessionTable[sessionId];
        if (session.sessionStatus !== 'terminated') {
          if (force) {
            this._terminateRtcSession(session.rtcSession);
          }
          setTimeout(by(this, this.stopWebRTC, [force]), 100);
          return;
        }
      }

      if (this._vua) {
        try {
          this._vua.stop();
        } catch (e) {
          this._logger.log(
            'warn',
            'UA.stop error message: ' +
              e.message +
              '\nstack: ' +
              e.stack +
              '\n',
          );
        }
        this._vua = null;
      }
      if (this._ua.isRegistered()) {
        try {
          this._ua.stop();
        } catch (e) {
          this._logger.log(
            'warn',
            'UA.stop error message: ' +
              e.message +
              '\nstack: ' +
              e.stack +
              '\n',
          );
        }
        // to _ua_unregistered
      } else {
        try {
          this._ua.stop();
        } catch (e) {
          this._logger.log(
            'warn',
            'UA.stop error message: ' +
              e.message +
              '\nstack: ' +
              e.stack +
              '\n',
          );
        }
        this._changePhoneStatus('stopped');
        this._ua = null;
        this._user = '';
        this._videoClientUser = '';
      }
    },

    /**
     * function checkUserMedia
     */
    checkUserMedia: function(callback, options) {
      if (!this._ua || this._phoneStatus !== 'started') {
        if (callback) {
          callback({
            enabled: false,
            message: 'WebRTC not started',
          });
        }
        return;
      }

      options =
        clone(
          options ||
            (this.defaultOptions &&
              this.defaultOptions.main &&
              this.defaultOptions.main.call),
        ) || {};
      if (!options.mediaConstraints) {
        options.mediaConstraints = { audio: true, video: false };
      }

      // getUserMedia
      this._getUserMedia(
        options.mediaConstraints,
        function(stream) {
          JsSIP.rtcninja.closeMediaStream(stream);
          if (callback) {
            callback({
              enabled: true,
              message: '',
            });
          }
        },
        function(error) {
          if (callback) {
            callback({
              enabled: false,
              message: stringify(error),
            });
          }
        },
        0,
      );
    },

    /**
     * function makeCall
     */
    makeCall: function(target, options, withVideo, videoOptions, exInfo) {
      var rtcInfoJsonStr;

      if (!this._ua || this._phoneStatus !== 'started') {
        this._logger.log('warn', 'WebRTC not started');
        return;
      }

      target = string(target);
      if (!target) {
        this._logger.log('warn', 'Empty target');
        return;
      }

      options =
        clone(
          options ||
            (this.defaultOptions &&
              this.defaultOptions.main &&
              this.defaultOptions.main.call),
        ) || {};
      if (!options.mediaConstraints) {
        options.mediaConstraints = { audio: true, video: false };
      }
      if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
        options.pcConfig = clone(options.pcConfig) || {};
        options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
      }
      if (!options.extraHeaders) {
        options.extraHeaders = [];
      }

      if (withVideo !== true && withVideo !== false) {
        withVideo = Boolean(
          this.defaultOptions && this.defaultOptions.withVideo,
        );
      }
      if (withVideo) {
        if (!this._vua) {
          this._logger.log('warn', 'Video client unavailable');
          return;
        }

        videoOptions =
          clone(
            videoOptions ||
              (this.defaultOptions && this.defaultOptions.videoOptions),
          ) || {};

        options.eventHandlers = clone(options.eventHandlers) || {};
        // make call of video session after main session response
        options.eventHandlers['progress'] = by(
          null,
          this._rtcSession_responseAfterMakeCallWithVideo,
          [this, videoOptions, options.eventHandlers['progress']],
        );
        options.eventHandlers['accepted'] = by(
          null,
          this._rtcSession_responseAfterMakeCallWithVideo,
          [this, videoOptions, options.eventHandlers['accepted']],
        );
      }

      exInfo = string(
        typeof exInfo !== 'undefined'
          ? exInfo
          : this.defaultOptions && this.defaultOptions.exInfo,
      );
      rtcInfoJsonStr = JSON.stringify({
        user: '',
        withVideo: withVideo,
      });
      options.extraHeaders = options.extraHeaders.concat(
        'X-UA-EX: rtcinfo=' + encodeURIComponent(rtcInfoJsonStr) + ';' + exInfo,
      );
      this._outgoingRtcInfo = JSON.parse(rtcInfoJsonStr);

      this._doCall(
        target,
        options,
        this._ua,
        by(this, this._rtcErrorOccurred, [
          { sessionId: null, target: target, options: options, client: 'main' },
        ]),
      );
    },

    /**
     * function setWithVideo
     */
    setWithVideo: function(sessionId, withVideo, videoOptions, exInfo) {
      var i, members, options, rid, rm, session, targets;

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];

      if (!session) {
        this._logger.log(
          'warn',
          'Not found session of sessionId: ' + sessionId,
        );
        return;
      }

      if (
        withVideo === true &&
        (!this._vua || this._phoneStatus !== 'started')
      ) {
        this._logger.log('warn', 'Video client unavailable');
        return;
      }

      session.exInfo = string(
        typeof exInfo !== 'undefined' ? exInfo : session.exInfo,
      );
      if (session.sessionStatus === 'connected') {
        this._sendInfoXUaEx(sessionId, false, withVideo, 0);
      } else if (session.rtcSession && session.rtcSession.on) {
        session.rtcSession.on(
          'accepted',
          by(this, this._sendInfoXUaEx, [sessionId, false, null, 500]),
        );
      }

      if (withVideo === true && !session.withVideo) {
        session.withVideo = true;

        videoOptions =
          clone(
            videoOptions ||
              (this.defaultOptions && this.defaultOptions.videoOptions),
          ) || {};

        // set videoOptions
        session.videoOptions = videoOptions;

        // try video call (earlier id -> later id)
        this._tryVideoCall(sessionId);

        // send request video call (later id -> earlier id)
        rid = this._getRid(sessionId);
        rm = rid && this._ridMembersTable[rid];
        members = rm && rm.members;
        if (members) {
          targets = [];
          for (i = 0; i < members.length; i++) {
            if (this._videoClientUser > members[i].phone_id) {
              // send request only to earlier id
              if (
                members[i].talker_hold !== 'h' &&
                rm.me.talker_hold !== 'h' &&
                members[i].talker_attr === rm.me.talker_attr
              ) {
                targets.push(members[i].phone_id);
              }
            }
          }
          options = clone(videoOptions.call) || {};
          if (!options.mediaConstraints) {
            options.mediaConstraints = { audio: false, video: true };
          }
          if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
            options.pcConfig = clone(options.pcConfig) || {};
            options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
          }
          if (!options.extraHeaders) {
            options.extraHeaders = [];
          }
          if (
            !options.extraHeaders.some(function(o) {
              return (
                string(o)
                  .split(':')[0]
                  .trim() === 'X-PBX'
              );
            })
          ) {
            options.extraHeaders = options.extraHeaders.concat('X-PBX: false');
          }
          options.extraHeaders = options.extraHeaders.concat(
            'X-REQUEST-VIDEO-CALL: true',
          ); // request video call
          for (i = 0; i < targets.length; i++) {
            // send
            this._doCall(
              targets[i],
              options,
              this._vua,
              by(this, this._rtcErrorOccurred, [
                {
                  sessionId: string(sessionId),
                  target: null,
                  options: options,
                  client: 'video',
                },
              ]),
            );
          }
        }
      } else if (withVideo === false && session.withVideo) {
        session.withVideo = false;
        session.videoOptions = null;

        // disconnect all
        this._checkAndTerminateVideo();
      } else {
        this._logger.log('info', 'Skipped changing withVideo');
      }
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },

    /**
     * function makeAdditionalVideoCall
     */
    makeAdditionalVideoCall: function(sessionId, videoOptions, targets) {
      var existing, i, j, members, memberTargets, options, rid, rm, session;

      if (!this._ua || this._phoneStatus !== 'started') {
        this._logger.log('warn', 'WebRTC not started');
        return;
      }

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];

      if (!session) {
        this._logger.log(
          'warn',
          'Not found session of sessionId: ' + sessionId,
        );
        return;
      }

      if (!session.withVideo) {
        this._logger.log('warn', 'Not with video');
        return;
      }

      if (!this._vua) {
        this._logger.log('warn', 'Video client unavailable');
        return;
      }

      videoOptions =
        clone(
          videoOptions ||
            session.videoOptions ||
            (this.defaultOptions && this.defaultOptions.videoOptions),
        ) || {};

      // rid
      rid = this._getRid(sessionId);
      if (!rid) {
        this._logger.log('debug', 'Session info (rid) not received yet');
        return;
      }

      // members
      rm = this._ridMembersTable[rid];
      if (!rm) {
        this._logger.log('debug', 'Members not notified yet');
        return;
      }
      members = rm.members;

      // targets
      memberTargets = [];
      for (i = 0; i < members.length; i++) {
        if (members[i].phone_id !== this._videoClientUser) {
          if (Array.isArray(targets) && targets.indexOf(members[i].user) >= 0) {
            memberTargets.push(members[i].phone_id);
          }
        }
      }

      // options
      options = clone(videoOptions.call) || {};
      if (!options.mediaConstraints) {
        options.mediaConstraints = { audio: false, video: true };
      }
      if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
        options.pcConfig = clone(options.pcConfig) || {};
        options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
      }
      if (!options.extraHeaders) {
        options.extraHeaders = [];
      }
      if (
        !options.extraHeaders.some(function(o) {
          return (
            string(o)
              .split(':')[0]
              .trim() === 'X-PBX'
          );
        })
      ) {
        options.extraHeaders = options.extraHeaders.concat('X-PBX: false');
      }

      // make call
      for (i = 0; i < memberTargets.length; i++) {
        this._doCall(
          memberTargets[i],
          options,
          this._vua,
          by(this, this._rtcErrorOccurred, [
            {
              sessionId: string(sessionId),
              target: null,
              options: options,
              client: 'video',
            },
          ]),
        );
      }
    },

    /**
     * function answer
     */
    answer: function(sessionId, options, withVideo, videoOptions, exInfo) {
      var rtcInfoJsonStr, session;

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];

      if (!session) {
        this._logger.log(
          'warn',
          'Not found session of sessionId: ' + sessionId,
        );
        return;
      }

      if (
        session.sessionStatus !== 'dialing' &&
        session.sessionStatus !== 'progress'
      ) {
        this._logger.log(
          'warn',
          'Invalid sessionStatus: ' + session.sessionStatus,
        );
        return;
      }

      if (withVideo !== true && withVideo !== false) {
        withVideo = Boolean(
          this.defaultOptions && this.defaultOptions.withVideo,
        );
      }
      if (withVideo) {
        if (!this._vua) {
          this._logger.log('warn', 'Video client unavailable');
          return;
        }

        session.withVideo = true;

        videoOptions =
          clone(
            videoOptions ||
              (this.defaultOptions && this.defaultOptions.videoOptions),
          ) || {};

        // set videoOptions
        session.videoOptions = videoOptions;

        this._tryVideoCall(sessionId);
      }

      options =
        clone(
          options ||
            (this.defaultOptions &&
              this.defaultOptions.main &&
              this.defaultOptions.main.answer),
        ) || {};
      if (!options.mediaConstraints) {
        options.mediaConstraints = { audio: true, video: false };
      }
      if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
        options.pcConfig = clone(options.pcConfig) || {};
        options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
      }
      if (!options.extraHeaders) {
        options.extraHeaders = [];
      }

      exInfo = string(
        typeof exInfo !== 'undefined'
          ? exInfo
          : this.defaultOptions && this.defaultOptions.exInfo,
      );
      rtcInfoJsonStr = JSON.stringify({
        user: string(
          session.incomingMessage &&
            session.incomingMessage.getHeader &&
            session.incomingMessage.getHeader('X-PBX-Session-Info'),
        )
          .split(';')
          .pop(),
        withVideo: withVideo,
      });
      options.extraHeaders = options.extraHeaders.concat(
        'X-UA-EX: rtcinfo=' + encodeURIComponent(rtcInfoJsonStr) + ';' + exInfo,
      );
      session.exInfo = exInfo;

      this._doAnswer(
        sessionId,
        options,
        session.rtcSession,
        by(this, this._rtcErrorOccurred, [
          {
            sessionId: string(sessionId),
            target: null,
            options: options,
            client: 'main',
          },
        ]),
      );
    },

    /**
     * function reconnectMicrophone
     */
    reconnectMicrophone: function(sessionId, options) {
      var mediaObject, session;

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];
      mediaObject = this._sessionLocalMediaTable[sessionId];
      if (mediaObject && mediaObject.sourceNode && mediaObject.gainNode) {
        options =
          clone(
            options ||
              (this.defaultOptions &&
                this.defaultOptions.main &&
                (session.rtcSession.direction === 'outgoing'
                  ? this.defaultOptions.main.call
                  : this.defaultOptions.main.answer)),
          ) || {};
        if (!options.mediaConstraints) {
          options.mediaConstraints = { audio: true, video: false };
        }

        // getUserMedia
        this._getUserMedia(
          options.mediaConstraints,
          function(stream) {
            JsSIP.rtcninja.closeMediaStream(mediaObject.localMediaStream);
            try {
              mediaObject.sourceNode.disconnect();
            } catch (e) {}
            mediaObject.sourceNode = this._audioContext.createMediaStreamSource(
              stream,
            );
            mediaObject.sourceNode.connect(mediaObject.gainNode);
            mediaObject.localMediaStream = stream;
          },
          function(error) {
            this._logger.log(
              'error',
              'getUserMedia() failed: ' + stringify(error),
            );
            this._rtcErrorOccurred(
              {
                sessionId: string(sessionId),
                target: null,
                options: options,
                client: 'main',
              },
              { from: 'browser', error: error },
            );
          },
          0,
        );
      }
    },

    /**
     * function setSessionVolume
     */
    setSessionVolume: function(volumePercent, sessionId) {
      var mediaObject;

      sessionId = int(sessionId) || this._getLatestSessionId();
      mediaObject = this._sessionLocalMediaTable[sessionId];
      if (mediaObject && mediaObject.gainNode) {
        mediaObject.volumePercent = int(volumePercent);
        mediaObject.gainNode.gain.value =
          this._masterVolume * mediaObject.volumePercent / 100000;
      }
    },

    /**
     * function sendDTMF
     */
    sendDTMF: function(tones, sessionId, options) {
      var duration, interToneGap, mediaObject, session, tasks;

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];
      mediaObject = this._sessionLocalMediaTable[sessionId];

      if (!session) {
        this._logger.log(
          'warn',
          'Not found session of sessionId: ' + sessionId,
        );
        return;
      }

      if (
        mediaObject &&
        mediaObject.gainNode &&
        mediaObject.dtmfOscillatorTable
      ) {
        // inband DTMF
        duration = int(options && options.duration) || 100;
        interToneGap = int(options && options.interToneGap) || 500;
        tasks = [];
        string(tones)
          .split('')
          .forEach(function(tone) {
            var oscillator;
            if (mediaObject.dtmfOscillatorTable[tone]) {
              oscillator = mediaObject.dtmfOscillatorTable[tone];
              tasks.push(function() {
                mediaObject.gainNode.gain.value = 0;
                oscillator.lowerGain.gain.value = 1;
                oscillator.upperGain.gain.value = 1;
                if (tasks.length > 0) {
                  setTimeout(tasks.shift(), duration);
                }
              });
              tasks.push(function() {
                mediaObject.gainNode.gain.value = 1;
                oscillator.lowerGain.gain.value = 0;
                oscillator.upperGain.gain.value = 0;
                if (tasks.length > 0) {
                  setTimeout(tasks.shift(), interToneGap);
                }
              });
            }
          });
        if (tasks.length > 0) {
          this._logger.log('debug', 'Play inband DTMF: ' + tones);
          tasks.shift()();
        }
      } else {
        // SIP INFO DTMF
        session.rtcSession.sendDTMF(tones, options);
      }
    },

    /**
     * function getPhoneStatus
     */
    getPhoneStatus: function() {
      return string(this._phoneStatus);
    },

    /**
     * function getSession
     */
    getSession: function(sessionId) {
      var localStreamUrl,
        localVideoStreamTimestamp,
        localVideoStreamUrl,
        remoteStreamUrl,
        remoteUserOptions,
        remoteUserOptionsTable,
        remoteWithVideo,
        rid,
        session,
        videoClientSession,
        videoClientSessionId,
        videoClientSessionTable;

      sessionId = int(sessionId) || this._getLatestSessionId();
      session = this._sessionTable[sessionId];

      if (!session) {
        this._logger.log(
          'info',
          'Not found session of sessionId: ' + sessionId,
        );
        return null;
      }

      remoteStreamUrl = '';
      localStreamUrl = '';
      localVideoStreamUrl = '';
      localVideoStreamTimestamp = +new Date() + 1;
      videoClientSessionTable = {};
      if (session.sessionStatus !== 'terminated') {
        // create remote stream url if not created
        if (!this._sessionRemoteStreamUrlTable[sessionId]) {
          this._sessionRemoteStreamUrlTable[
            sessionId
          ] = this._createRemoteStreamUrl(session.rtcSession);
        }
        remoteStreamUrl = this._sessionRemoteStreamUrlTable[sessionId];

        if (this._sessionLocalMediaTable[sessionId]) {
          // create local stream url if not created
          if (!this._sessionLocalMediaTable[sessionId].localStreamUrl) {
            this._sessionLocalMediaTable[
              sessionId
            ].localStreamUrl = this._createLocalStreamUrl(session.rtcSession);
          }
          localStreamUrl = this._sessionLocalMediaTable[sessionId]
            .localStreamUrl;
        }

        // video client sessions information
        rid = this._getRid(sessionId);
        if (rid) {
          if (this._ridVideoClientSessionsTable[rid]) {
            for (videoClientSessionId in this._ridVideoClientSessionsTable[
              rid
            ]) {
              videoClientSession = this._ridVideoClientSessionsTable[rid][
                videoClientSessionId
              ];
              if (
                videoClientSession &&
                videoClientSession.rtcSession &&
                videoClientSession.rtcSession.isEstablished()
              ) {
                if (!this._sessionRemoteStreamUrlTable[videoClientSessionId]) {
                  this._sessionRemoteStreamUrlTable[
                    videoClientSessionId
                  ] = this._createRemoteStreamUrl(
                    videoClientSession.rtcSession,
                  );
                }
                videoClientSessionTable[videoClientSessionId] = {
                  user: string(
                    videoClientSession.member && videoClientSession.member.user,
                  ),
                  remoteStreamUrl: this._sessionRemoteStreamUrlTable[
                    videoClientSessionId
                  ],
                  rtcSession: videoClientSession.rtcSession,
                };
                if (this._sessionLocalMediaTable[videoClientSessionId]) {
                  if (
                    !this._sessionLocalMediaTable[videoClientSessionId]
                      .localStreamUrl
                  ) {
                    this._sessionLocalMediaTable[
                      videoClientSessionId
                    ].localStreamUrl = this._createLocalStreamUrl(
                      videoClientSession.rtcSession,
                    );
                  }
                  if (
                    this._sessionLocalMediaTable[videoClientSessionId]
                      .timestamp < localVideoStreamTimestamp
                  ) {
                    localVideoStreamUrl = this._sessionLocalMediaTable[
                      videoClientSessionId
                    ].localStreamUrl;
                    localVideoStreamTimestamp = this._sessionLocalMediaTable[
                      videoClientSessionId
                    ].timestamp;
                  }
                }
              }
            }
          }
        }
      }

      remoteUserOptionsTable = {};
      remoteWithVideo = false;
      for (var user in session.remoteUserOptionsTable) {
        remoteUserOptions = session.remoteUserOptionsTable[user];
        remoteUserOptionsTable[user] = {
          withVideo: Boolean(remoteUserOptions.withVideo),
          exInfo: string(remoteUserOptions.exInfo),
        };
        if (remoteUserOptions.withVideo) {
          remoteWithVideo = true;
        }
      }

      return {
        sessionId: session.sessionId,
        sessionStatus: session.sessionStatus,
        audio: session.audio,
        video: session.video,
        remoteStreamUrl: remoteStreamUrl,
        localStreamUrl: localStreamUrl,
        remoteWithVideo: remoteWithVideo,
        withVideo: session.withVideo,
        exInfo: string(session.exInfo),
        localVideoStreamUrl: localVideoStreamUrl,
        videoClientSessionTable: videoClientSessionTable,
        rtcSession: session.rtcSession,
        incomingMessage: session.incomingMessage,
        remoteUserOptionsTable: remoteUserOptionsTable,
      };
    },

    /**
     * function getSessionTable
     */
    getSessionTable: function() {
      var sessionId = 0,
        sessionTable = {};

      // return copy of _sessionTable
      for (sessionId in this._sessionTable) {
        sessionTable[sessionId] = this.getSession(sessionId);
      }
      return sessionTable;
    },

    /**
     * function getEnvironment
     */
    getEnvironment: function() {
      var environment = {
        webRTC: false,
        gain: false,
        oscillator: false,
      };
      if (
        window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection
      ) {
        environment.webRTC = true;
      }
      if (
        typeof navigator === 'object' &&
        navigator.userAgent &&
        navigator.userAgent.indexOf('Firefox') >= 0
      ) {
        // "Cannot create an offer with no local tracks, no offerToReceiveAudio/Video, and no DataChannel."
      } else if (
        this._audioContext &&
        this._audioContext.createGain &&
        this._audioContext.createMediaStreamSource &&
        this._audioContext.createMediaStreamDestination
      ) {
        environment.gain = true;
        if (this._audioContext.createOscillator) {
          environment.oscillator = true;
        }
      }
      return environment;
    },

    /**
     * getter masterVolume
     */
    get masterVolume() {
      return this._masterVolume;
    },

    /**
     * setter masterVolume
     */
    set masterVolume(value) {
      var key, mediaObject;

      this._masterVolume = int(value);
      for (key in this._sessionLocalMediaTable) {
        mediaObject = this._sessionLocalMediaTable[key];
        if (mediaObject.gainNode) {
          mediaObject.gainNode.gain.value =
            this._masterVolume * mediaObject.volumePercent / 100000;
        }
      }
    },

    /**
     * private functions
     */
    _emitEvent: function(eventName, eventArgs) {
      var func,
        i = 0,
        len = 0;

      this._logger.log('debug', 'Emitting event: ' + eventName);

      if (this._eventNameIdsTable[eventName]) {
        for (
          i = 0, len = this._eventNameIdsTable[eventName].length;
          i < len;
          i++
        ) {
          func = this._eventIdFuncTable[this._eventNameIdsTable[eventName][i]];
          if (func) {
            func(eventArgs);
          }
        }
      }
    },
    _changePhoneStatus: function(status) {
      if (this._phoneStatus !== status) {
        this._phoneStatus = status;
        if (status !== 'starting') {
          this._uaStarting = false;
          this._vuaStarting = false;
        }
        this._emitEvent('phoneStatusChanged', {
          phoneStatus: string(this._phoneStatus),
        });
      }
    },
    _getUserMedia: function(
      constraints,
      successCallback,
      errorCallback,
      count,
    ) {
      this._logger.log('debug', '_getUserMedia #' + count);
      if (this._gettingUserMedia) {
        if (!count || count < this._getUserMediaTimeout) {
          setTimeout(
            by(this, this._getUserMedia, [
              constraints,
              successCallback,
              errorCallback,
              (count || 0) + 1,
            ]),
            1000,
          );
        } else {
          this._gettingUserMedia = false;
          if (errorCallback) {
            errorCallback.apply(this, ['_getUserMedia timeout']);
          }
        }
        return;
      }
      this._gettingUserMedia = true;
      JsSIP.rtcninja.getUserMedia(
        constraints,
        by(this, function(stream) {
          this._gettingUserMedia = false;
          if (successCallback) {
            successCallback.apply(this, [stream]);
          }
        }),
        by(this, function(error) {
          this._gettingUserMedia = false;
          if (errorCallback) {
            errorCallback.apply(this, [error]);
          }
        }),
      );
    },
    _doCall: function(target, options, ua, errorCallback) {
      options = clone(options);

      // getUserMedia
      this._getUserMedia(
        options.mediaConstraints,
        function(stream) {
          this._disposeLocalMedia('outgoing');
          try {
            options.mediaStream = this._createLocalMedia(
              'outgoing',
              stream,
              options.mediaConstraints,
            );
          } catch (e) {
            this._logger.log(
              'error',
              '_createLocalMedia() failed: ' + stringify(e),
            );
            if (errorCallback) {
              errorCallback.apply(this, [{ from: 'jssip', error: e }]);
            }
          }
          // call
          try {
            ua.call(target, options);
          } catch (e) {
            this._logger.log(
              'error',
              'JsSIP.UA.call() failed: ' + stringify(e),
            );
            if (errorCallback) {
              errorCallback.apply(this, [{ from: 'jssip', error: e }]);
            }
          }
        },
        function(error) {
          this._logger.log(
            'error',
            'getUserMedia() failed: ' + stringify(error),
          );
          if (errorCallback) {
            errorCallback.apply(this, [{ from: 'browser', error: error }]);
          }
        },
        0,
      );
    },
    _rtcErrorOccurred: function(eventArgs, e) {
      eventArgs.from = e.from;
      eventArgs.error = e.error;
      this._emitEvent('rtcErrorOccurred', eventArgs);
    },
    _doAnswer: function(sessionId, options, rtcSession, errorCallback) {
      if (rtcSession.direction !== 'incoming') {
        this._logger.log(
          'warn',
          'Invalid rtcSession.direction: ' + rtcSession.direction,
        );
        return;
      }
      if (rtcSession.status !== 4) {
        this._logger.log(
          'warn',
          'Invalid rtcSession.status: ' + rtcSession.status,
        );
        return;
      }

      options = clone(options);

      // getUserMedia
      this._getUserMedia(
        options.mediaConstraints,
        function(stream) {
          this._disposeLocalMedia(sessionId);
          try {
            options.mediaStream = this._createLocalMedia(
              sessionId,
              stream,
              options.mediaConstraints,
            );
          } catch (e) {
            this._logger.log(
              'error',
              '_createLocalMedia() failed: ' + stringify(e),
            );
            if (errorCallback) {
              errorCallback.apply(this, [{ from: 'jssip', error: e }]);
            }
          }
          // answer
          try {
            rtcSession.answer(options);
          } catch (e) {
            this._logger.log(
              'error',
              'JsSIP.RTCSession.answer() failed: ' + stringify(e),
            );
            if (errorCallback) {
              errorCallback.apply(this, [{ from: 'jssip', error: e }]);
            }
          }
        },
        function(error) {
          this._logger.log(
            'error',
            'getUserMedia() failed: ' + stringify(error),
          );
          if (errorCallback) {
            errorCallback.apply(this, [{ from: 'browser', error: error }]);
          }
        },
        0,
      );
    },
    _tryVideoCall: function(sessionId) {
      var clearTryingVideoCallTarget,
        i,
        j,
        members,
        mustUpdateRemoteWithVideo,
        options,
        rid,
        rm,
        session,
        targets;

      this._checkAndTerminateVideo();

      // make video call when all informations (session, rid, members) have been prepared

      // session
      session = this._sessionTable[sessionId];
      if (!session) {
        this._logger.log('info', 'Empty session');
        return;
      }
      if (!session.withVideo) {
        this._logger.log('debug', 'No need to try video call');
        return;
      }

      // rid
      rid = this._getRid(sessionId);
      if (!rid) {
        this._logger.log('debug', 'Session info (rid) not received yet');
        return;
      }

      // members
      rm = this._ridMembersTable[rid];
      if (!rm) {
        this._logger.log('debug', 'Members not notified yet');
        return;
      }
      members = rm.members;

      // targets
      targets = [];
      mustUpdateRemoteWithVideo = false;
      for (i = 0; i < members.length; i++) {
        if (this._videoClientUser < members[i].phone_id) {
          // make call only from earlier id
          if (
            members[i].talker_hold !== 'h' &&
            rm.me.talker_hold !== 'h' &&
            members[i].talker_attr === rm.me.talker_attr
          ) {
            if (!this._tryingVideoCallTargets[members[i].phone_id]) {
              targets.push(members[i].phone_id);
              this._tryingVideoCallTargets[members[i].phone_id] = true;
              // check remoteWithVideo updated
              if (
                !session.remoteUserOptionsTable[members[i].user] ||
                !session.remoteUserOptionsTable[members[i].user].withVideo
              ) {
                mustUpdateRemoteWithVideo = true;
              }
            }
          }
        }
      }

      // update remoteWithVideo
      if (mustUpdateRemoteWithVideo) {
        this._sendInfoXUaEx(sessionId, true, null, 0);
      }

      if (!this._vua || this._phoneStatus !== 'started') {
        this._logger.log('warn', 'Video client unavailable');
        return;
      }
      for (i = 0; i < targets.length; i++) {
        // options
        options =
          clone(session.videoOptions && session.videoOptions.call) || {};
        if (!options.mediaConstraints) {
          options.mediaConstraints = { audio: false, video: true };
        }
        if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
          options.pcConfig = clone(options.pcConfig) || {};
          options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
        }
        if (!options.extraHeaders) {
          options.extraHeaders = [];
        }
        if (
          !options.extraHeaders.some(function(o) {
            return (
              string(o)
                .split(':')[0]
                .trim() === 'X-PBX'
            );
          })
        ) {
          options.extraHeaders = options.extraHeaders.concat('X-PBX: false');
        }
        options.eventHandlers = clone(options.eventHandlers) || {};
        clearTryingVideoCallTarget = by(
          this,
          this._clearTryingVideoCallTarget,
          [targets[i]],
        );
        options.eventHandlers['failed'] = clearTryingVideoCallTarget;
        options.eventHandlers['ended'] = clearTryingVideoCallTarget;

        // make call
        this._doCall(
          targets[i],
          options,
          this._vua,
          by(this, this._tryVideoCallFailed, [
            targets[i],
            {
              sessionId: string(sessionId),
              target: null,
              options: options,
              client: 'video',
            },
          ]),
        );
      }
    },
    _tryVideoCallFailed: function(target, eventArgs, e) {
      this._clearTryingVideoCallTarget(target);
      this._rtcErrorOccurred(eventArgs, e);
    },
    _clearTryingVideoCallTarget: function(target) {
      delete this._tryingVideoCallTargets[target];
    },
    _checkAndTerminateVideo: function() {
      var i,
        member,
        memberOk,
        members,
        rid,
        rm,
        sessionId,
        sessionOk,
        videoClientSessionId;

      // check all video client sessions
      for (rid in this._ridVideoClientSessionsTable) {
        // check main session
        sessionOk = false;
        for (sessionId in this._sessionTable) {
          if (
            rid === this._getRid(sessionId) &&
            this._sessionTable[sessionId].withVideo
          ) {
            sessionOk = true;
          }
        }
        for (videoClientSessionId in this._ridVideoClientSessionsTable[rid]) {
          memberOk = false;
          if (sessionOk) {
            // check member
            member = this._ridVideoClientSessionsTable[rid][
              videoClientSessionId
            ].member;
            rm = this._ridMembersTable[rid];
            if (rm) {
              members = rm.members;
              for (i = 0; i < members.length; i++) {
                if (members[i].phone_id === member.phone_id) {
                  if (
                    members[i].talker_hold !== 'h' &&
                    rm.me.talker_hold !== 'h' &&
                    members[i].talker_attr === rm.me.talker_attr
                  ) {
                    memberOk = true;
                    break;
                  }
                }
              }
            }
          }
          // terminate ng video client session
          if (!sessionOk || !memberOk) {
            this._terminateRtcSession(
              this._ridVideoClientSessionsTable[rid][videoClientSessionId]
                .rtcSession,
            );
          }
        }
      }
    },
    _terminateRtcSession: function(rtcSession) {
      try {
        rtcSession.terminate();
      } catch (e) {
        this._logger.log(
          'info',
          'RTCSession.terminate error message: ' +
            e.message +
            '\nstack: ' +
            e.stack +
            '\n',
        );
      }
    },
    _getLatestSessionId: function() {
      var i = 0,
        sessionId;

      sessionId = 0;
      for (i in this._sessionTable) {
        if (this._sessionTable[i].sessionStatus !== 'terminated') {
          if (i > sessionId) {
            sessionId = i;
          }
        }
      }
      return sessionId;
    },
    _getRemoteStreams: function(sessionId) {
      return this._sessionRemoteStreamsTable[sessionId] || [];
    },
    _createRemoteStreamUrl: function(rtcSession) {
      var remoteStream, remoteStreamUrl;

      try {
        remoteStream = rtcSession.getRemoteStreams()[0];
      } catch (e) {
        remoteStream = null;
      }
      if (remoteStream) {
        remoteStreamUrl = window.URL.createObjectURL(remoteStream);
      } else {
        remoteStreamUrl = '';
      }
      return remoteStreamUrl;
    },
    _createLocalStreamUrl: function(rtcSession) {
      var localStream, localStreamUrl;

      if (rtcSession.connection && rtcSession.connection.getLocalStreams) {
        // jssip 0.6~
        try {
          localStream = rtcSession.connection.getLocalStreams()[0];
        } catch (e) {
          localStream = null;
        }
      } else if (rtcSession.getLocalStreams) {
        try {
          localStream = rtcSession.getLocalStreams()[0];
        } catch (e) {
          localStream = null;
        }
      } else {
        localStream = null;
      }
      if (localStream) {
        localStreamUrl = window.URL.createObjectURL(localStream);
      } else {
        localStreamUrl = '';
      }
      return localStreamUrl;
    },
    _createLocalMedia: function(sessionId, stream, mediaConstraints) {
      var environment,
        destinationNode = null,
        dtmfOscillatorTable = null,
        gainNode = null,
        mediaStreamForCall,
        oscillators = null,
        sourceNode = null,
        volumePercent;

      mediaStreamForCall = stream;
      volumePercent = 100;
      environment = this.getEnvironment();
      if (
        environment.gain &&
        mediaConstraints &&
        mediaConstraints.audio &&
        !mediaConstraints.video
      ) {
        // connect GainNode to control microphone volume
        gainNode = this._audioContext.createGain();
        sourceNode = this._audioContext.createMediaStreamSource(stream);
        destinationNode = this._audioContext.createMediaStreamDestination();
        sourceNode.connect(gainNode);
        if (typeof this._mediaStreamConverter === 'function') {
          this._mediaStreamConverter(gainNode, sessionId).connect(
            destinationNode,
          );
        } else {
          gainNode.connect(destinationNode);
        }
        gainNode.gain.value = this._masterVolume * volumePercent / 100000;

        if (environment.oscillator && int(this.dtmfSendMode) === 1) {
          // prepare OscillatorNodes to send inband DTMF
          oscillators = {};
          dtmfOscillatorTable = {};

          [
            ['1', [697, 1209]],
            ['2', [697, 1336]],
            ['3', [697, 1477]],
            ['A', [697, 1633]],
            ['4', [770, 1209]],
            ['5', [770, 1336]],
            ['6', [770, 1477]],
            ['B', [770, 1633]],
            ['7', [852, 1209]],
            ['8', [852, 1336]],
            ['9', [852, 1477]],
            ['C', [852, 1633]],
            ['*', [941, 1209]],
            ['0', [941, 1336]],
            ['#', [941, 1477]],
            ['D', [941, 1633]],
          ].forEach(
            function(a) {
              var frequencies, tone;
              tone = a[0];
              frequencies = a[1];
              frequencies.forEach(
                function(frequency) {
                  var oscillatorNode, oscillatorGain;
                  if (oscillators[frequency]) {
                    return;
                  }
                  oscillatorNode = this._audioContext.createOscillator();
                  oscillatorGain = this._audioContext.createGain();
                  oscillatorNode.frequency.value = frequency;
                  oscillatorNode.connect(oscillatorGain);
                  oscillatorGain.connect(destinationNode);
                  oscillatorGain.gain.value = 0;
                  oscillatorNode.start(0);
                  oscillators[frequency] = {
                    oscillatorNode: oscillatorNode,
                    oscillatorGain: oscillatorGain,
                  };
                }.bind(this),
              );
              dtmfOscillatorTable[tone] = {
                lowerNode: oscillators[frequencies[0]].oscillatorNode,
                upperNode: oscillators[frequencies[1]].oscillatorNode,
                lowerGain: oscillators[frequencies[0]].oscillatorGain,
                upperGain: oscillators[frequencies[1]].oscillatorGain,
              };
            }.bind(this),
          );
        }

        mediaStreamForCall = destinationNode.stream;
      }

      this._sessionLocalMediaTable[sessionId] = {
        localMediaStream: stream,
        localStreamUrl: '',
        mediaConstraints: mediaConstraints,
        volumePercent: volumePercent,
        gainNode: gainNode,
        sourceNode: sourceNode,
        destinationNode: destinationNode,
        oscillators: oscillators,
        dtmfOscillatorTable: dtmfOscillatorTable,
        timestamp: +new Date(),
      };

      return mediaStreamForCall;
    },
    _disposeRemoteMedia: function(sessionId) {
      if (this._sessionRemoteStreamUrlTable[sessionId]) {
        try {
          window.URL.revokeObjectURL(
            this._sessionRemoteStreamUrlTable[sessionId],
          );
        } catch (e) {}
      }
      delete this._sessionRemoteStreamUrlTable[sessionId];
    },
    _disposeLocalMedia: function(sessionId) {
      var mediaObject;

      if (this._sessionLocalMediaTable[sessionId]) {
        mediaObject = this._sessionLocalMediaTable[sessionId];

        // remove all tracks from the local stream to solve the issue
        // where UI hangs when enabling video from the second time on
        // native platforms
        var localStream = mediaObject.localMediaStream;
        localStream.getTracks().forEach(t => {
          localStream.removeTrack(t);
        });
        JsSIP.rtcninja.closeMediaStream(localStream);

        if (mediaObject.oscillators) {
          Object.keys(mediaObject.oscillators).forEach(function(i) {
            var oscillator = mediaObject.oscillators[i];
            try {
              oscillator.oscillatorGain.disconnect();
            } catch (e) {}
            try {
              oscillator.oscillatorNode.stop();
            } catch (e) {}
            try {
              oscillator.oscillatorNode.disconnect();
            } catch (e) {}
          });
        }
        if (mediaObject.gainNode) {
          try {
            mediaObject.gainNode.disconnect();
          } catch (e) {}
        }
        if (mediaObject.sourceNode) {
          try {
            mediaObject.sourceNode.disconnect();
          } catch (e) {}
        }
        if (mediaObject.destinationNode) {
          try {
            mediaObject.destinationNode.disconnect();
          } catch (e) {}
        }
        if (mediaObject.localStreamUrl) {
          try {
            window.URL.revokeObjectURL(mediaObject.localStreamUrl);
          } catch (e) {}
        }
        delete this._sessionLocalMediaTable[sessionId];
      }
    },
    _getRid: function(sessionId) {
      var rid = '',
        session;

      session = this._sessionTable[sessionId];
      if (
        session &&
        session.incomingMessage &&
        session.incomingMessage.getHeader
      ) {
        rid = string(session.incomingMessage.getHeader('X-PBX-Session-Info'));
        rid = rid.split(';');
        rid = string(rid[1]);
      }

      return rid;
    },
    _sendInfoXUaEx: function(sessionId, echo, withVideo, delay) {
      var session;

      if (delay) {
        setTimeout(
          by(this, this._sendInfoXUaEx, [sessionId, echo, withVideo, 0]),
          delay,
        );
        return;
      }
      session = this._sessionTable[sessionId];
      if (session && session.rtcSession && session.rtcSession.dialog) {
        session.rtcSession.dialog.sendRequest(
          {
            owner: { status: session.rtcSession.status },
            onRequestTimeout: this._dialog_emptyFunction,
            onTransportError: this._dialog_emptyFunction,
            onDialogError: this._dialog_emptyFunction,
            receiveResponse: this._dialog_emptyFunction,
          },
          'INFO',
          {
            extraHeaders: [
              'X-UA-EX: rtcinfo=' +
                encodeURIComponent(
                  JSON.stringify({
                    user: string(
                      session.incomingMessage &&
                        session.incomingMessage.getHeader &&
                        session.incomingMessage.getHeader('X-PBX-Session-Info'),
                    )
                      .split(';')
                      .pop(),
                    withVideo:
                      typeof withVideo === 'boolean'
                        ? withVideo
                        : Boolean(session.withVideo),
                    echo: Boolean(echo),
                  }),
                ) +
                ';' +
                session.exInfo,
            ],
          },
        );
      }
    },
    _putRemoteUserOptions: function(sessionId, xUaEx) {
      var exInfo = '',
        rtcInfo = null,
        session,
        user,
        withVideo,
        xUaExEntries,
        xUaExRtcInfo = '';

      session = this._sessionTable[sessionId];
      if (session && xUaEx) {
        xUaExEntries = string(xUaEx).split(';');
        xUaExEntries.forEach(function(s) {
          if (s.substr(0, 'rtcinfo='.length) === 'rtcinfo=') {
            xUaExRtcInfo = s;
          } else {
            if (exInfo !== '') {
              exInfo += ';';
            }
            exInfo += s;
          }
        });
        if (xUaExRtcInfo) {
          try {
            rtcInfo = JSON.parse(
              decodeURIComponent(xUaExRtcInfo.substr('rtcinfo='.length)),
            );
          } catch (e) {
            this._logger.log(
              'warn',
              'Cannot decode ' + xUaExRtcInfo + ' : ' + e.message,
            );
          }
        }
        if (rtcInfo && rtcInfo.echo) {
          this._sendInfoXUaEx(
            sessionId,
            false,
            null,
            Math.floor(Math.random() * 500) + 500,
          );
        }
        user = string(
          (rtcInfo && rtcInfo.user) ||
            (session.rtcSession && session.rtcSession.remote_identity.uri.user),
        );
        if (user) {
          withVideo = Boolean(rtcInfo && rtcInfo.withVideo);
          if (
            !session.remoteUserOptionsTable[user] ||
            session.remoteUserOptionsTable[user].withVideo !== withVideo ||
            session.remoteUserOptionsTable[user].exInfo !== exInfo
          ) {
            session.remoteUserOptionsTable[user] = {
              withVideo: withVideo,
              exInfo: exInfo,
            };
            return true;
          } else {
            // not changed
          }
        } else {
          this._logger.log('warn', 'Empty user: ' + xUaEx);
        }
      }
      return false;
    },

    /**
     * event listeners
     */
    _ua_registered: function(e) {
      this._uaStarting = false;
      if (this._vuaStarting) {
        try {
          this._vua.start();
        } catch (e) {
          this._logger.log(
            'warn',
            'UA.start error message: ' +
              e.message +
              '\nstack: ' +
              e.stack +
              '\n',
          );
          this.stopWebRTC(true);
        }
      } else {
        this._changePhoneStatus('started');
      }
    },
    _ua_unregistered: function(e) {
      if (this._phoneStatus !== 'stopping' && this._phoneStatus !== 'stopped') {
        this.stopWebRTC(true);
      }
      this._changePhoneStatus('stopped');
      this._ua = null;
      this._user = '';
      this._videoClientUser = '';
    },
    _ua_registrationFailed: function(e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      this._logger.log('warn', 'UA.registrationFailed cause: ' + data.cause);
      if (this._phoneStatus !== 'stopping' && this._phoneStatus !== 'stopped') {
        this.stopWebRTC(true);
      }
      this._changePhoneStatus('stopped');
      this._ua = null;
      this._user = '';
      this._videoClientUser = '';
    },
    _ua_newRTCSession: function(e) {
      var audio = false,
        data,
        options,
        sessionId = 0,
        sessionStatus = '',
        video = false;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      if (
        this._phoneStatus !== 'started' ||
        (!this.multiSession &&
          this._sessionTable[this._lastCreatedSessionId] &&
          this._sessionTable[this._lastCreatedSessionId].sessionStatus !==
            'terminated') ||
        (this.doNotDisturb && data.session.direction === 'incoming')
      ) {
        this._logger.log(
          'info',
          'Terminate session: phoneStatus: ' + this._phoneStatus,
        );
        // terminate
        setTimeout(by(this, this._terminateRtcSession, [data.session]), 0);
        // do not create session
        return;
      }

      sessionId = ++this._lastCreatedSessionId;
      sessionStatus = 'dialing';
      if (data.session.direction === 'outgoing') {
        if (this._sessionLocalMediaTable['outgoing']) {
          audio = this._sessionLocalMediaTable['outgoing'].mediaConstraints
            .audio;
          video = this._sessionLocalMediaTable['outgoing'].mediaConstraints
            .video;
          this._sessionLocalMediaTable[
            sessionId
          ] = this._sessionLocalMediaTable['outgoing'];
          delete this._sessionLocalMediaTable['outgoing'];
        }
      } else {
        if (data.request.body) {
          audio = data.request.body.indexOf('m=audio') >= 0;
          video = data.request.body.indexOf('m=video') >= 0;
        }
      }
      this._sessionTable[sessionId] = {
        sessionId: string(sessionId),
        sessionStatus: sessionStatus,
        audio: Boolean(audio),
        video: Boolean(video),
        withVideo:
          data.session.direction === 'outgoing'
            ? Boolean(this._outgoingRtcInfo.withVideo)
            : false,
        exInfo:
          data.session.direction === 'outgoing'
            ? string(this._outgoingRtcInfo.exInfo)
            : '',
        rtcSession: data.session,
        incomingMessage:
          data.session.direction === 'outgoing' ? null : data.request,
        videoOptions: null,
        remoteUserOptionsTable: {},
      };
      this._sessionRemoteStreamsTable[sessionId] = [];
      if (data.session.direction === 'incoming') {
        this._putRemoteUserOptions(
          sessionId,
          data.request.getHeader('X-UA-EX'),
        );
      }

      // attach JsSIP.RTCSession event listeners
      data.session.on(
        'progress',
        by(this, this._rtcSession_progress, [sessionId]),
      );
      data.session.on(
        'accepted',
        by(this, this._rtcSession_accepted, [sessionId]),
      );
      data.session.on(
        'notifiedSessionInfo',
        by(this, this._rtcSession_notifiedSessionInfo, [sessionId]),
      );
      data.session.on(
        'receivedInfoXUaEx',
        by(this, this._rtcSession_receivedInfoXUaEx, [sessionId]),
      );
      data.session.on('failed', by(this, this._rtcSession_ended, [sessionId]));
      data.session.on('ended', by(this, this._rtcSession_ended, [sessionId]));
      if (!data.session.getRemoteStreams) {
        // jssip 0.6~
        data.session.getRemoteStreams = by(this, this._getRemoteStreams, [
          sessionId,
        ]);
        data.session.on(
          'addstream',
          by(this, this._rtcSession_addstream, [sessionId]),
        );
        data.session.on(
          'removestream',
          by(this, this._rtcSession_removestream, [sessionId]),
        );
      }

      if (data.session.direction === 'incoming') {
        if (
          this.autoAnswer ||
          (this.ctiAutoAnswer &&
            string(data.request.getHeader('Call-Info')).indexOf(
              'answer-after=0',
            ) >= 0)
        ) {
          // auto answer

          if (this.defaultOptions && this.defaultOptions.withVideo) {
            this._sessionTable[sessionId].withVideo = true;
            this._sessionTable[sessionId].videoOptions =
              (this.defaultOptions && this.defaultOptions.videoOptions) || {};
            setTimeout(by(this, this._tryVideoCall, [sessionId]), 0);
          }

          options =
            clone(
              this.defaultOptions &&
                this.defaultOptions.main &&
                this.defaultOptions.main.answer,
            ) || {};
          if (!options.mediaConstraints) {
            options.mediaConstraints = { audio: true, video: false };
          }
          if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
            options.pcConfig = clone(options.pcConfig) || {};
            options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
          }

          // answer
          setTimeout(
            by(this, this._doAnswer, [
              sessionId,
              options,
              data.session,
              by(this, this._rtcErrorOccurred, [
                {
                  sessionId: string(sessionId),
                  target: null,
                  options: options,
                  client: 'main',
                },
              ]),
            ]),
            0,
          );
        }
      }

      this._emitEvent('sessionCreated', this.getSession(sessionId));
    },
    _vua_registered: function(e) {
      this._vuaStarting = false;
      if (this._uaStarting) {
        try {
          this._ua.start();
        } catch (e) {
          this._logger.log(
            'warn',
            'UA.start error message: ' +
              e.message +
              '\nstack: ' +
              e.stack +
              '\n',
          );
          this.stopWebRTC(true);
        }
      } else {
        this._changePhoneStatus('started');
      }
    },
    _vua_unregistered: function(e) {
      if (this._phoneStatus !== 'stopping' && this._phoneStatus !== 'stopped') {
        this.stopWebRTC(true);
      }
      this._vua = null;
    },
    _vua_registrationFailed: function(e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      this._logger.log('warn', 'UA.registrationFailed cause: ' + data.cause);
      if (this._phoneStatus !== 'stopping' && this._phoneStatus !== 'stopped') {
        this.stopWebRTC(true);
      }
      this._vua = null;
    },
    _vua_newRTCSession: function(e, count) {
      var data,
        i = 0,
        member,
        members,
        options,
        r,
        rid,
        sessionId,
        sid,
        videoClientSessionId;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      if (!data || !data.session || data.session.isEnded()) {
        // already ended
        this._logger.log('debug', 'Video client session already ended');
        return;
      }

      if (this._phoneStatus !== 'started') {
        this._logger.log(
          'info',
          'Terminate video client session: phoneStatus: ' + this._phoneStatus,
        );
        // terminate
        setTimeout(by(this, this._terminateRtcSession, [data.session]), 0);
        // do not create video client session
        return;
      }

      videoClientSessionId = 'v' + ++this._lastCreatedVideoClientSessionId;

      // specify member and main session
      sessionId = 0;
      rid = '';
      member = null;
      for (sid in this._sessionTable) {
        if (this._sessionTable[sid].withVideo) {
          r = this._getRid(sid);
          members = this._ridMembersTable[r].members;
          for (i = 0; i < members.length; i++) {
            if (members[i].phone_id === data.session.remote_identity.uri.user) {
              member = members[i];
              break;
            }
          }
          if (member) {
            sessionId = sid;
            rid = r;
            break;
          }
        }
      }

      if (
        sessionId &&
        rid &&
        member &&
        data.session.direction === 'incoming' &&
        data.request.getHeader &&
        data.request.getHeader('X-REQUEST-VIDEO-CALL') === 'true'
      ) {
        // receive request video call (later id -> earlier id)

        // terminate this request session
        setTimeout(by(this, this._terminateRtcSession, [data.session]), 0);

        // try video call (earlier id -> later id)
        setTimeout(by(this, this._tryVideoCall, [sessionId]), 0);
      } else if (sessionId && rid && member) {
        // specify ok

        if (data.session.direction === 'outgoing') {
          // outgoing
          if (this._sessionLocalMediaTable['outgoing']) {
            this._sessionLocalMediaTable[
              videoClientSessionId
            ] = this._sessionLocalMediaTable['outgoing'];
            delete this._sessionLocalMediaTable['outgoing'];
          }
        }

        // create video client session
        if (!this._ridVideoClientSessionsTable[rid]) {
          this._ridVideoClientSessionsTable[rid] = {};
        }
        this._ridVideoClientSessionsTable[rid][videoClientSessionId] = {
          member: member,
          rtcSession: data.session,
        };
        this._sessionRemoteStreamsTable[videoClientSessionId] = [];
        member.videoClientSessionId = videoClientSessionId;

        // attach JsSIP.RTCSession event listeners
        data.session.on(
          'failed',
          by(this, this._videoClientRtcSession_ended, [
            videoClientSessionId,
            sessionId,
          ]),
        );
        data.session.on(
          'ended',
          by(this, this._videoClientRtcSession_ended, [
            videoClientSessionId,
            sessionId,
          ]),
        );
        if (!data.session.getRemoteStreams) {
          // jssip 0.6~
          data.session.getRemoteStreams = by(this, this._getRemoteStreams, [
            videoClientSessionId,
          ]);
          data.session.on(
            'addstream',
            by(this, this._videoClientRtcSession_addstream, [
              videoClientSessionId,
              sessionId,
            ]),
          );
          data.session.on(
            'removestream',
            by(this, this._videoClientRtcSession_removestream, [
              videoClientSessionId,
              sessionId,
            ]),
          );
        }

        if (data.session.direction === 'incoming') {
          // answer
          options =
            clone(
              this._sessionTable[sessionId].videoOptions &&
                this._sessionTable[sessionId].videoOptions.answer,
            ) || {};
          if (!options.mediaConstraints) {
            options.mediaConstraints = { audio: false, video: true };
          }
          if (!options.pcConfig || !options.pcConfig.gatheringTimeout) {
            options.pcConfig = clone(options.pcConfig) || {};
            options.pcConfig.gatheringTimeout = this._defaultGatheringTimeout;
          }
          setTimeout(
            by(this, this._doAnswer, [
              videoClientSessionId,
              options,
              data.session,
              by(this, this._rtcErrorOccurred, [
                {
                  sessionId: string(sessionId),
                  target: null,
                  options: options,
                  client: 'video',
                },
              ]),
            ]),
            0,
          );
        }
      } else {
        // cannot specify member or main session

        if (data.session.direction === 'outgoing') {
          // outgoing
          this._disposeLocalMedia('outgoing');
        } else {
          // incoming, but informations (session, rid, members) have not been prepared
          count = count || 0;
          if (!count) {
            // first try
            // wait and retry
            setTimeout(by(this, this._vua_newRTCSession, [e, count + 1]), 1000);
            return;
          } else {
            // retry
            // to terminate
          }
        }

        // terminate
        setTimeout(by(this, this._terminateRtcSession, [data.session]), 0);
        // do not create video client session
        return;
      }
    },
    _vua_newNotify: function(e) {
      var body2 = [],
        data,
        i = 0,
        me = {},
        members = [],
        member2 = [],
        rid = '',
        sessionId;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      if (!data) {
        this._logger.log('warn', 'newNotify data empty');
        return;
      }
      if (!data.request) {
        this._logger.log('warn', 'newNotify request empty');
        return;
      }
      if (data.request.getHeader('Event') !== 'x-video-client') {
        this._logger.log(
          'warn',
          'newNotify invalid header Event: ' + data.request.getHeader('Event'),
        );
        return;
      }
      if (!data.request.body) {
        this._logger.log('warn', 'newNotify body empty');
        return;
      }

      // <rid>#<user 1>|<phone_id 1>|<talker_id 1>|<talker_attr 1>|<talker_hold 1>#<user 2>|<phone_id 2>|<talker_id 2>|<talker_attr 2>|<talker_hold 2>
      body2 = data.request.body.split('#');
      rid = body2[0];
      if (!rid) {
        this._logger.log('warn', 'newNotify rid empty');
        return;
      }
      me = {};
      members = [];
      for (i = 1; i < body2.length; i++) {
        member2 = body2[i].split('|');
        members.push({
          user: member2[0] || '',
          phone_id: member2[1] || '',
          talker_id: member2[2] || '',
          talker_attr: member2[3] || '',
          talker_hold: member2[4] || '',
        });
        if (this._videoClientUser === member2[1]) {
          me = members[members.length - 1];
        }
      }

      this._ridMembersTable[rid] = {
        members: members,
        me: me,
      };

      for (sessionId in this._sessionTable) {
        if (this._getRid(sessionId) === rid) {
          this._tryVideoCall(sessionId);
          break;
        }
      }
    },
    _rtcSession_progress: function(sessionId, e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      this._sessionTable[sessionId].sessionStatus = 'progress';
      if (data && data.response) {
        this._sessionTable[sessionId].incomingMessage = data.response;
        if (
          this._putRemoteUserOptions(
            sessionId,
            data.response.getHeader('X-UA-EX'),
          )
        ) {
          this._emitEvent(
            'remoteUserOptionsChanged',
            this.getSession(sessionId),
          );
        }
        this._tryVideoCall(sessionId);
      }
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },
    _rtcSession_accepted: function(sessionId, e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      this._sessionTable[sessionId].sessionStatus = 'connected';
      if (data && data.response) {
        this._sessionTable[sessionId].incomingMessage = data.response;
        if (
          this._putRemoteUserOptions(
            sessionId,
            data.response.getHeader('X-UA-EX'),
          )
        ) {
          this._emitEvent(
            'remoteUserOptionsChanged',
            this.getSession(sessionId),
          );
        }
        this._tryVideoCall(sessionId);
      }
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },
    _rtcSession_notifiedSessionInfo: function(sessionId, e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      if (data && data.request) {
        this._sessionTable[sessionId].incomingMessage = data.request;
        this._tryVideoCall(sessionId);
        if (
          Object.keys(this._sessionTable[sessionId].remoteUserOptionsTable)
            .length === 0
        ) {
          this._sendInfoXUaEx(sessionId, true, null, 0);
        }
      }
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },
    _rtcSession_receivedInfoXUaEx: function(sessionId, e) {
      var data;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      if (data && data.request) {
        if (
          this._putRemoteUserOptions(
            sessionId,
            data.request.getHeader('X-UA-EX'),
          )
        ) {
          this._emitEvent(
            'remoteUserOptionsChanged',
            this.getSession(sessionId),
          );
        }
      }
    },
    _rtcSession_ended: function(sessionId, e) {
      var data,
        rid = '',
        session,
        videoClientSessionId;

      data = e.data || e; // jssip ~0.5: e.data, jssip 0.6~: e

      rid = this._getRid(sessionId);
      if (rid) {
        if (this._ridVideoClientSessionsTable[rid]) {
          for (videoClientSessionId in this._ridVideoClientSessionsTable[rid]) {
            setTimeout(
              by(this, this._terminateRtcSession, [
                this._ridVideoClientSessionsTable[rid][videoClientSessionId]
                  .rtcSession,
              ]),
              0,
            );
            this._videoClientRtcSession_ended(videoClientSessionId, sessionId);
          }
        }
        if (this._ridMembersTable[rid]) {
          delete this._ridMembersTable[rid];
        }
      }

      this._sessionTable[sessionId].sessionStatus = 'terminated';
      if (data && data.message) {
        this._sessionTable[sessionId].incomingMessage = data.message;
      }
      session = this.getSession(sessionId);

      delete this._sessionTable[sessionId];
      delete this._sessionRemoteStreamsTable[sessionId];
      this._disposeRemoteMedia(sessionId);
      this._disposeLocalMedia(sessionId);
      this._emitEvent('sessionStatusChanged', session);
    },
    _rtcSession_addstream: function(sessionId, e) {
      this._sessionRemoteStreamsTable[sessionId].push(e.stream);
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },
    _rtcSession_removestream: function(sessionId, e) {
      var index;

      index = this._sessionRemoteStreamsTable[sessionId].indexOf(e.stream);
      if (index >= 0) {
        this._sessionRemoteStreamsTable[sessionId].splice(index, 1);
      }
      if (index === 0) {
        this._disposeRemoteMedia(sessionId);
      }
      this._emitEvent('sessionStatusChanged', this.getSession(sessionId));
    },
    _rtcSession_responseAfterMakeCallWithVideo: function(
      self,
      videoOptions,
      orgFunc,
      e,
    ) {
      // this: RTCSession
      var rtcSession = this,
        session,
        sessionId;

      // set videoOptions to session
      for (sessionId in self._sessionTable) {
        session = self._sessionTable[sessionId];
        if (session.rtcSession === rtcSession) {
          if (!session.videoOptions) {
            session.videoOptions = videoOptions;
            // make video call when members (phone_ids) have been notified
            self._tryVideoCall(sessionId);
          }
        }
      }

      if (orgFunc) {
        orgFunc.call(this, e);
      }
    },
    _videoClientRtcSession_ended: function(videoClientSessionId, sessionId) {
      var r;

      for (r in this._ridVideoClientSessionsTable) {
        if (this._ridVideoClientSessionsTable[r][videoClientSessionId]) {
          delete this._ridVideoClientSessionsTable[r][videoClientSessionId];
          if (Object.keys(this._ridVideoClientSessionsTable[r]).length === 0) {
            delete this._ridVideoClientSessionsTable[r];
          }
          break;
        }
      }
      delete this._sessionRemoteStreamsTable[videoClientSessionId];
      this._disposeRemoteMedia(videoClientSessionId);
      this._disposeLocalMedia(videoClientSessionId);

      if (this._sessionTable[sessionId]) {
        this._emitEvent('videoClientSessionEnded', {
          sessionId: string(sessionId),
          videoClientSessionId: string(videoClientSessionId),
        });
      }
    },
    _videoClientRtcSession_addstream: function(
      videoClientSessionId,
      sessionId,
      e,
    ) {
      this._sessionRemoteStreamsTable[videoClientSessionId].push(e.stream);

      if (this._sessionTable[sessionId]) {
        this._emitEvent('videoClientSessionCreated', {
          sessionId: string(sessionId),
          videoClientSessionId: string(videoClientSessionId),
        });
      }
    },
    _videoClientRtcSession_removestream: function(
      videoClientSessionId,
      sessionId,
      e,
    ) {
      var index;

      index = this._sessionRemoteStreamsTable[videoClientSessionId].indexOf(
        e.stream,
      );
      if (index >= 0) {
        this._sessionRemoteStreamsTable[videoClientSessionId].splice(index, 1);
      }
    },
    _dialog_emptyFunction: function() {},

    END_OF_PROTOTYPE: null,
  };

  /**
   * class Brekeke.WebrtcClient.Logger
   */
  Logger = function(level, func, withStackTrace) {
    var self = this;

    /**
     * fields
     */
    this._levelValue =
      level in this.LEVEL_VALUES
        ? this.LEVEL_VALUES[level]
        : this.LEVEL_VALUES['log'];
    this._logFunction = func;
    this._withStackTrace = withStackTrace;
    this._stackTraceHeaderLength = -2;

    // trial logging to initialize stackTraceHeaderLength
    (function TRIAL_LOGGING() {
      self.log('trial', 'logger initialized (' + self._levelValue + ')');
    })();
  };
  /**
   * Logger prototype
   */
  Logger.prototype = {
    /**
     * Constants
     */
    LEVEL_VALUES: {
      none: 0,
      trial: 1,
      fatal: 10,
      error: 20,
      warn: 30,
      log: 40,
      info: 40,
      debug: 50,
      trace: 60,
      all: 60,
    },

    /**
     * function setLoggerLevel
     */
    setLoggerLevel: function(level) {
      this._levelValue =
        level in this.LEVEL_VALUES
          ? this.LEVEL_VALUES[level]
          : this.LEVEL_VALUES['log'];
    },

    /**
     * function setLogFunction
     */
    setLogFunction: function(func) {
      this._logFunction = func;
    },

    /**
     * function log
     */
    log: function(level, content) {
      var stackTrace = '';

      try {
        if (this.LEVEL_VALUES[level] <= this._levelValue) {
          if (this._withStackTrace) {
            // get stack trace
            try {
              throw new Error();
            } catch (e) {
              stackTrace = String(e.stack);
            }
            if (this._stackTraceHeaderLength === -2) {
              // uninitialized
              // trial logging to initialize stackTraceHeaderLength
              this._stackTraceHeaderLength = stackTrace.indexOf(
                'TRIAL_LOGGING',
              );
            }
            if (this._stackTraceHeaderLength >= 0) {
              // OK
              // print stack trace from caller (cut header)
              stackTrace =
                ' @ ' + stackTrace.substr(this._stackTraceHeaderLength);
            } else {
              // failed to initialize stackTraceHeaderLength
              // print full stack trace
              stackTrace = ' : ' + stackTrace;
            }
          }
          if (this._logFunction) {
            if (!this._logFunction(level, content, stackTrace)) {
              this._logFunctionDefault(level, content, stackTrace);
            }
          } else {
            this._logFunctionDefault(level, content, stackTrace);
          }
        }
      } catch (e) {}
    },

    /**
     * private functions
     */
    _logFunctionDefault: function(level, content, stackTrace) {
      var func;

      if (console) {
        if (level === 'fatal') {
          func = console.error || console.log;
        } else if (level === 'error') {
          func = console.error || console.log;
        } else if (level === 'warn') {
          func = console.warn || console.log;
        } else if (level === 'info') {
          func = console.info || console.log;
        } else if (level === 'debug') {
          func = console.debug || console.log;
        } else if (level === 'trace') {
          func = console.debug || console.log;
        } else {
          func = console.log;
        }
        if (func) {
          func.call(
            console,
            new Date() + '[' + level + '] ' + content + stackTrace,
          );
          if (typeof content === 'object') {
            console.dir(content);
          }
        }
      }
    },

    END_OF_PROTOTYPE: null,
  };

  /**
   * utility functions
   */
  by = function(thisArg, func, argsArray) {
    // return function
    return function() {
      // if argsArray is not given, returned function calls func with arguments of itself
      return func.apply(
        thisArg || this,
        (argsArray || []).concat(Array.prototype.slice.call(arguments)),
      );
    };
  };
  clone = function(object) {
    var key, returnObject;

    if (object && typeof object === 'object') {
      // memberwise clone (shallow copy)
      returnObject = {};
      for (key in object) {
        returnObject[key] = object[key];
      }
      return returnObject;
    } else {
      return object;
    }
  };
  stringify = function(object) {
    var key, returnString;

    if (object && typeof object === 'object') {
      returnString = '';
      for (key in object) {
        returnString += string(key) + ': ' + string(object[key]) + ', ';
      }
      if (returnString.length > 2) {
        returnString = returnString.substr(0, returnString.length - 2);
      }
      return returnString;
    } else {
      return string(object);
    }
  };
  int = function(value) {
    return parseInt(value, 10) || 0;
  };
  string = function(value) {
    return String(value || value === 0 || value === false ? value : '');
  };

  // publicize Brekeke.WebrtcClient.Phone
  WebrtcClient.Phone = Phone;
  // publicize Brekeke.WebrtcClient.Logger
  WebrtcClient.Logger = Logger;
})(window.Brekeke.WebrtcClient);
