/* global Brekeke */

import EventEmitter from 'eventemitter3';
import './md5';
import './jsonrpc';
import './pal';

class PBX extends EventEmitter {
  client = null;

  async connect(profile) {
    if (this.client) {
      return Promise.reject(new Error('PAL client is connected'));
    }

    const wsUri = `wss://${profile.hostname}:${profile.port}/pbx/ws`;
    const client = Brekeke.pbx.getPal(wsUri, {
      tenant: profile.tenant,
      login_user: profile.username,
      login_password: profile.password,
      _wn: profile.accessToken,
      park: profile.parks,
      voicemail: 'self',
      user: '*',
      status: true,
    });

    client.debugLevel = 2;

    let timeout = null;

    await Promise.race([
      new Promise((onres, onerr) => {
        timeout = setTimeout(() => {
          client.close();
          onerr(new Error('Timeout'));
        }, 5000);
      }),
      new Promise((onres, onerr) => {
        client.login(onres, onerr);
      }),
    ]);

    clearTimeout(timeout);

    this.client = client;

    this.client.onClose = () => {
      this.emit('connection-stopped');
    };

    this.client.onError = err => {
      console.error(err);
    };

    this.client.notify_serverstatus = ev => {
      if (!ev) {
        return;
      }
      if (ev.status === 'active') {
        return this.emit('connection-started');
      }
      if (ev.status === 'inactive') {
        return this.emit('connection-stopped');
      }
    };

    this.client.notify_park = ev => {
      if (!ev) {
        return;
      }
      if (ev.status === 'on' && ev.park) {
        return this.emit('park-started', ev.park);
      }
      if (ev.status === 'off' && ev.park) {
        return this.emit('park-stopped', ev.park);
      }
    };

    this.client.notify_voicemail = ev => {
      if (!ev) {
        return;
      }
      this.emit('voicemail-updated', ev);
    };

    this.client.notify_status = ev => {
      if (!ev) {
        return;
      }

      switch (ev.status) {
        case '14': // user got answered on an outgoing call
        case '2': // user answered an incoming call
        case '36': // user started holding a call
          return this.emit('user-talking', {
            user: ev.user,
            talker: ev.talker_id,
          });
        case '35': // user stopped holding a call
          return this.emit('user-holding', {
            user: ev.user,
            talker: ev.talker_id,
          });
        case '-1': // user hanged up a call
          return this.emit('user-hanging', {
            user: ev.user,
            talker: ev.talker_id,
          });
        case '1': // user made an outgoing call
          return this.emit('user-calling', {
            user: ev.user,
            talker: ev.talker_id,
          });
        case '65': // user got an incoming call
          return this.emit('user-ringing', {
            user: ev.user,
            talker: ev.talker_id,
          });
      }
    };
  }

  disconnect() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  pal(method, params) {
    return new Promise((onres, onerr) => {
      if (!this.client) {
        return onerr(new Error('PAL client is not ready'));
      }
      if (typeof this.client[method] !== 'function') {
        return onerr(new Error(`PAL client doesn't support "${method}"`));
      }

      this.client[method](params, onres, onerr);
    });
  }

  getConfig() {
    return this.pal('getProductInfo');
  }

  createSIPAccessToken(sipUsername) {
    return this.pal('createAuthHeader', {
      username: sipUsername,
    });
  }

  getUsers(tenant) {
    return this.pal('getExtensions', {
      tenant,
      pattern: '..*',
      limit: -1,
      type: 'user',
    });
  }

  async getUser(tenant, userId) {
    const res = await this.pal('getExtensionProperties', {
      tenant: tenant,
      extension: userId,
      property_names: [
        'name',
        'p1_ptype',
        'p2_ptype',
        'p3_ptype',
        'p4_ptype',
        'pnumber',
      ],
    });

    const pnumber = res[5].split(',');
    const phones = [
      { id: pnumber[0], type: res[1] },
      { id: pnumber[1], type: res[2] },
      { id: pnumber[2], type: res[3] },
      { id: pnumber[3], type: res[4] },
    ];

    return {
      id: userId,
      name: res[0],
      phones,
    };
  }

  async getPhonebooks() {
    const res = await this.pal('getPhonebooks');
    return res.map(item => ({
      name: item.phonebook,
      shared: item.shared === 'true',
    }));
  }

  async getContacts(book, shared, opts = {}) {
    const res = await this.pal('getContactList', {
      phonebook: book,
      shared: shared === true ? 'true' : 'false',
      search_text: opts.searchText,
      offset: opts.offset,
      limit: opts.limit,
    });
    return res.map(contact => ({
      id: contact.aid,
      name: contact.display_name,
    }));
  }

  async getContact(id) {
    const res = await this.pal('getContact', { aid: id });
    res.info = res.info || {};
    return {
      id,
      firstName: res.info.$firstname,
      lastName: res.info.$lastname,
      workNumber: res.info.$tel_work,
      homeNumber: res.info.$tel_home,
      cellNumber: res.info.$tel_mobile,
      address: res.info.$address,
      company: res.info.$company,
      email: res.info.$email,
      job: res.info.$title,
      book: res.phonebook,
      shared: res.shared === 'true',
    };
  }

  setContact(contact) {
    return this.pal('setContact', {
      aid: contact.id,
      phonebook: contact.book,
      shared: contact.shared ? 'true' : 'false',
      info: {
        $firstname: contact.firstName,
        $lastname: contact.lastName,
        $tel_work: contact.workNumber,
        $tel_home: contact.homeNumber,
        $tel_mobile: contact.cellNumber,
        $address: contact.address,
        $title: contact.job,
        $email: contact.email,
        $company: contact.company,
      },
    });
  }

  holdTalker(tenant, talker) {
    return this.pal('hold', { tenant, tid: talker });
  }

  unholdTalker(tenant, talker) {
    return this.pal('unhold', { tenant, tid: talker });
  }

  startRecordingTalker(tenant, talker) {
    return this.pal('startRecording', { tenant, tid: talker });
  }

  stopRecordingTalker(tenant, talker) {
    return this.pal('stopRecording', { tenant, tid: talker });
  }

  transferTalkerBlind(tenant, talker, toUser) {
    return this.pal('transfer', {
      tenant,
      user: toUser,
      tid: talker,
      mode: 'blind',
    });
  }

  transferTalkerAttended(tenant, talker, toUser) {
    return this.pal('transfer', {
      tenant,
      user: toUser,
      tid: talker,
    });
  }

  joinTalkerTransfer(tenant, talker) {
    return this.pal('conference', { tenant, tid: talker });
  }

  stopTalkerTransfer(tenant, talker) {
    return this.pal('cancelTransfer', { tenant, tid: talker });
  }

  parkTalker(tenant, talker, atNumber) {
    return this.pal('park', { tenant, tid: talker, number: atNumber });
  }

  /* todo: refactor this
  registerWebPushEndpoint ({appId, endpoint, username, deviceId}) {
    if (!this.pal) {
      throw new Error('Not connected yet')
    }
    return promisify(this.pal.pnmanage, {
      service_id: '2',
      application_id: appId,
      command: 'add',
      username: username,
      endpoint,
      device_id: deviceId,
      user_agent: 'react-native'
    })
  }

  registerFCMEndpoint ({appId, username, subscription}) {
    if (!this.pal) {
      throw new Error('Not connected yet')
    }
    return promisify(this.pal.pnmanage, {
      service_id: '3',
      application_id: appId,
      command: 'add',
      username,
      endpoint: subscription.endpoint,
      auth_secret: subscription.keys.auth,
      key: subscription.keys.p256dh,
      user_agent: navigator.userAgent
    })
  }
  */
}

export default new PBX();
