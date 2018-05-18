//@flow
import { combineReducers } from 'redux';
import auth from '../reducers/auth';
import feed from '../reducers/feed';

export default combineReducers({
  auth,
  feed,
});
