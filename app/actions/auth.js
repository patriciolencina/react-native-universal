//@flow
/*
 * action types
 */
import * as ActionTypes from './types';

export const setCurrentScreen = title => ({
  type: ActionTypes.SET_CURRENT_SCREEN,
  payload: title,
});
export const setDrawerOpen = () => ({
  type: ActionTypes.SET,
});
