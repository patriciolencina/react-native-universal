// @flow
import * as ActionTypes from '../actions/types';
const actionHandlers = {
  [ActionTypes.SET_CURRENT_SCREEN](state, todo) {
    // do stuff
  },
  [ActionTypes.SET_VISIBILITY_FILTER](state, id) {
    // do stuff
  },
};

export default (state = {}, action) => {
  const { type, payload } = action;
  const actionHandler = actionHandlers[type];
  if (actionHandler) {
    return actionHandler(state, payload);
  }
  return state;
};
