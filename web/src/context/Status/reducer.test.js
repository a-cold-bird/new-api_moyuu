import test from 'node:test';
import assert from 'node:assert/strict';

import { initialState, reducer } from './reducer.js';

test('status reducer marks status load failures as completed', () => {
  const nextState = reducer(initialState, { type: 'load_failed' });

  assert.equal(nextState.status, undefined);
  assert.equal(nextState.statusLoaded, true);
});
