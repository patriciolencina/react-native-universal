import EventEmitter from 'eventemitter3';
import UCClient from './ucclient';

class UC extends EventEmitter {
  constructor() {
    super();

    const logger = new UCClient.Logger('all');
    this.client = new UCClient.ChatClient(logger);
    this.client.setEventListeners({
      forcedSignOut: this.onConnectionStopped,
      buddyStatusChanged: this.onUserUpdated,
      receivedTyping: null,
      receivedText: this.onTextReceived,
      fileReceived: this.onFileReceived,
      fileInfoChanged: this.onFileProgress,
      fileTerminated: this.onFileFinished,
      invitedToConference: this.onGroupInvited,
      conferenceMemberChanged: this.onGroupUpdated,
    });
  }

  onConnectionStopped = () => {
    this.emit('connection-stopped');
  };

  onUserUpdated = ev => {
    if (!ev) return;

    this.emit('user-updated', {
      id: ev.user_id,
      name: ev.name,
      mood: ev.display,
      offline: ev.status === 0,
      online: ev.status === 1,
      idle: ev.status === 2,
      busy: ev.status === 3,
      avatar: ev.profile_image_url,
    });
  };

  onTextReceived = ev => {
    if (!ev || !ev.sender) return;

    ev.conf_id
      ? this.emit('group-chat-created', {
          id: ev.received_text_id,
          group: ev.conf_id,
          text: ev.text,
          creator: ev.sender.user_id,
          created: ev.sent_tstamp,
        })
      : this.emit('buddy-chat-created', {
          id: ev.received_text_id,
          text: ev.text,
          creator: ev.sender.user_id,
          created: ev.sent_tstamp,
        });
  };

  onFileReceived = ev => {
    if (!ev || !ev.fileInfo) return;

    const file = {
      id: ev.fileInfo.file_id,
      name: ev.fileInfo.name,
      size: ev.fileInfo.size,
      incoming: true,
      transferPercent: ev.fileInfo.progress,
      transferWaiting: ev.fileInfo.status === 0 || ev.fileInfo.status === 1,
      transferStarted: ev.fileInfo.status === 2,
      transferSuccess: ev.fileInfo.status === 3,
      transferStopped: ev.fileInfo.status === 4 || ev.fileInfo.status === 5,
      transferFailure: ev.fileInfo.status === 6,
    };

    this.emit('file-received', file);

    ev.conf_id
      ? this.emit('group-chat-created', {
          id: ev.text_id,
          creator: ev.fileInfo.target.user_id,
          group: ev.conf_id,
          file: file.id,
          created: ev.sent_tstamp,
        })
      : this.emit('buddy-chat-created', {
          id: ev.text_id,
          creator: ev.fileInfo.target.user_id,
          file: file.id,
          created: ev.sent_tstamp,
        });
  };

  onFileProgress = ev => {
    if (!ev || !ev.fileInfo) return;

    this.emit('file-progress', {
      id: ev.fileInfo.file_id,
      transferPercent: ev.fileInfo.progress,
      transferWaiting: ev.fileInfo.status === 0 || ev.fileInfo.status === 1,
      transferStarted: ev.fileInfo.status === 2,
      transferSuccess: ev.fileInfo.status === 3,
      transferStopped: ev.fileInfo.status === 4 || ev.fileInfo.status === 5,
      transferFailure: ev.fileInfo.status === 6,
    });
  };

  onFileFinished = ev => {
    if (!ev || !ev.fileInfo) return;

    this.emit('file-finished', {
      id: ev.fileInfo.file_id,
      transferPercent: ev.fileInfo.progress,
      transferWaiting: ev.fileInfo.status === 0 || ev.fileInfo.status === 1,
      transferStarted: ev.fileInfo.status === 2,
      transferSuccess: ev.fileInfo.status === 3,
      transferStopped: ev.fileInfo.status === 4 || ev.fileInfo.status === 5,
      transferFailure: ev.fileInfo.status === 6,
    });
  };

  onGroupInvited = ev => {
    if (!ev || !ev.conference) return;

    this.emit('chat-group-invited', {
      id: ev.conference.conf_id,
      name: ev.conference.subject,
      inviter: ev.conference.from.user_id,
      buddies: ev.conference.user || [],
    });
  };

  onGroupUpdated = ev => {
    if (!ev || !ev.conference) return;

    if (ev.conference.conf_status === 0) {
      this.emit('chat-group-revoked', {
        id: ev.conference.conf_id,
      });
      return;
    }

    this.emit('chat-group-updated', {
      id: ev.conference.conf_id,
      name: ev.conference.subject,
      jointed: ev.conference.conf_status === 2,
      members: (ev.conference.user || [])
        .filter(user => user.conf_status === 2)
        .map(user => user.user_id),
    });
  };

  connect(profile) {
    return new Promise((onres, onerr) =>
      this.client.signIn(
        {
          host: `https://${profile.hostname}:${profile.port}`,
          path: profile.pathname || 'uc',
          tenant: profile.tenant,
          user: profile.username,
          pass: profile.password,
        },
        onres,
        onerr,
      ),
    );
  }

  disconnect() {
    this.client.signOut();
  }

  me() {
    const profile = this.client.getProfile() || {};
    const status = this.client.getStatus() || {};

    return {
      id: profile.user_id,
      name: profile.name,
      mood: status.display,
      avatar: profile.profile_image_url,
      offline: status.status === 0,
      online: status.status === 1,
      idle: status.status === 2,
      busy: status.status === 3,
    };
  }

  setOffline(mood) {
    return new Promise((onres, onerr) =>
      this.client.changeStatus(0, mood, onres, onerr),
    );
  }

  setOnline(mood) {
    return new Promise((onres, onerr) =>
      this.client.changeStatus(1, mood, onres, onerr),
    );
  }

  setBusy(mood) {
    return new Promise((onres, onerr) =>
      this.client.changeStatus(3, mood, onres, onerr),
    );
  }

  getUsers() {
    const buddyList = this.client.getBuddylist();
    if (!buddyList || !Array.isArray(buddyList.user)) {
      return [];
    }
    return buddyList.user.map(user => ({
      id: user.user_id,
      avatar: user.profile_image_url,
      name: user.name,
      offline: user.status === 0,
      online: user.status === 1,
      busy: user.status === 2,
      mood: user.display,
    }));
  }

  async getUnreadChats() {
    const res = await new Promise((onres, onerr) => {
      this.client.receiveUnreadText(onres, onerr);
    });

    if (!res || !Array.isArray(res.messages)) {
      return [];
    }

    const readRequiredMessageIds = res.messages
      .filter(msg => msg.requires_read)
      .map(msg => msg.received_text_id);

    this.client.readText(readRequiredMessageIds);

    return res.messages.map(msg => ({
      id: msg.received_text_id,
      text: msg.text,
      creator: msg.sender && msg.sender.user_id,
      created: msg.sent_tstamp,
    }));
  }

  async getBuddyChats(buddy, opts) {
    const res = await new Promise((onres, onerr) =>
      this.client.searchTexts(
        {
          user_id: buddy,
          max: opts.max,
          begin: opts.begin,
          end: opts.end,
          asc: opts.asc,
        },
        onres,
        onerr,
      ),
    );
    if (!res || !Array.isArray(res.logs)) {
      return [];
    }
    return res.logs.map(log => ({
      id: log.log_id,
      text:
        log.ctype === 5 // ctype-file-request
          ? JSON.parse(log.content).name
          : log.content,
      creator: log.sender.user_id,
      created: log.tstamp,
    }));
  }

  async getGroupChats(group, opts) {
    const res = await new Promise((onres, onerr) =>
      this.client.searchTexts(
        {
          conf_id: group,
          max: opts.max,
          begin: opts.begin,
          end: opts.end,
          asc: opts.asc,
        },
        onres,
        onerr,
      ),
    );
    if (!res || !Array.isArray(res.logs)) {
      return [];
    }
    return res.logs.map(log => ({
      id: log.log_id,
      text: log.content,
      creator: log.sender.user_id,
      created: log.tstamp,
    }));
  }

  sendBuddyChatText(buddy, text) {
    return new Promise((onres, onerr) =>
      this.client.sendText(
        text,
        { user_id: buddy },
        res =>
          onres({
            id: res.text_id,
            text,
            creator: this.client.getProfile().user_id,
            created: res.tstamp,
          }),
        onerr,
      ),
    );
  }

  sendGroupChatText(group, text) {
    return new Promise((onres, onerr) =>
      this.client.sendConferenceText(
        text,
        group,
        res =>
          onres({
            id: res.text_id,
            text,
            creator: this.client.getProfile().user_id,
            created: res.tstamp,
          }),
        onerr,
      ),
    );
  }

  async createChatGroup(name, members = []) {
    const res = await new Promise((onres, onerr) => {
      this.client.createConference(name, members, onres, onerr);
    });

    return {
      id: res.conference.conf_id,
      name: res.conference.subject,
      jointed: true,
    };
  }

  async joinChatGroup(group) {
    await new Promise((onres, onerr) => {
      this.client.joinConference(group, null, onres, onerr);
    });

    return {
      id: group,
    };
  }

  async leaveChatGroup(group) {
    await new Promise((onres, onerr) => {
      this.client.leaveConference(group, onres, onerr);
    });

    return {
      id: group,
    };
  }

  inviteChatGroupMembers(group, members) {
    return new Promise((onres, onerr) => {
      this.client.inviteToConference(group, members, onres, onerr);
    });
  }

  acceptFile(file) {
    return new Promise((onres, onerr) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = function(ev) {
        if (this.status === 200) onres(this.response);
      };
      this.client.acceptFileWithXhr(file, xhr, onerr);
    });
  }

  rejectFile(file) {
    return new Promise((onres, onerr) => {
      this.client.cancelFile(file, onerr);
      onres();
    });
  }

  async sendFile(buddy, file) {
    const target = { user_id: buddy };
    const files = [file];
    const form = { elements: { name: 'file', files } };
    const input = { files, form };

    const res = await new Promise((onres, onerr) =>
      this.client.sendFile(target, input, onres, onerr),
    );

    return {
      file: {
        id: res.fileInfo.file_id,
        name: res.fileInfo.name,
        size: res.fileInfo.size,
        transferPercent: res.fileInfo.progress,
        transferWaiting: res.fileInfo.status === 0 || res.fileInfo.status === 1,
        transferStarted: res.fileInfo.status === 2,
        transferSuccess: res.fileInfo.status === 3,
        transferStopped: res.fileInfo.status === 4 || res.fileInfo.status === 5,
        transferFailure: res.fileInfo.status === 6,
      },
      chat: {
        id: res.text_id,
        file: res.fileInfo.file_id,
        creator: this.client.getProfile().user_id,
        created: res.tstamp,
      },
    };
  }
}

export default new UC();
