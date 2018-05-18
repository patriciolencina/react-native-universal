// @flow
import { createSelector } from 'reselect';

export const squaresSelector = createSelector(state => state.board.fen);
