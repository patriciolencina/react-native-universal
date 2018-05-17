import { createModel } from '@thenewvu/redux-model';
import immutable from '@thenewvu/immutable';
import pickProps from 'lodash.pick';

const allowedToCreateProps = [
  'id',
  'incoming',
  'partyName',
  'partyNumber',
  'localVideoEnabled',
  'remoteVideoStreamURL',
  'createdAt',
];
const validateCreatingCall = call => pickProps(call, allowedToCreateProps);

const allowedToUpdateProps = [
  'incoming',
  'answered',
  'holding',
  'recording',
  'transfering',
  'partyName',
  'partyNumber',
  'pbxTenant',
  'pbxTalkerId',
  'voiceStreamURL',
  'localVideoEnabled',
  'remoteVideoStreamURL',
];
const validateUpdatingCall = call => pickProps(call, allowedToUpdateProps);

export default createModel({
  prefix: 'runningCalls',
  origin: {
    idsByOrder: [],
    detailMapById: {},
  },
  getter: {
    idsByOrder: state => state.idsByOrder,
    detailMapById: state => state.detailMapById,
  },
  action: {
    create: (state, call) =>
      immutable.on(state)(
        immutable.fset('idsByOrder', ids => [...ids, call.id]),
        immutable.vset(`detailMapById.${call.id}`, validateCreatingCall(call)),
      ),
    update: (state, call) =>
      immutable.on(state)(
        immutable.fset(`detailMapById.${call.id}`, old => ({
          ...old,
          ...validateUpdatingCall(call),
        })),
      ),
    remove: (state, id) =>
      immutable.on(state)(
        immutable.fset('idsByOrder', ids => ids.filter(_id => _id !== id)),
        immutable.fset('detailMapById', ({ [id]: removed, ...rest }) => rest),
      ),
  },
});
