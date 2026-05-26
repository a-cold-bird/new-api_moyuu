import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAutoGroupChain,
  getPricingVisibleGroups,
  getVisibleModelGroups,
  isModelVisibleInGroup,
} from './autoGroup.js';

test('buildAutoGroupChain formats configured auto group order and ratios', () => {
  const chain = buildAutoGroupChain(
    ['codex', 'gemini', ' anthropic_aws', 'deepseek_official'],
    {
      codex: 0.2,
      gemini: 0.4,
      ' anthropic_aws': 0.4,
      deepseek_official: 1,
    },
  );

  assert.equal(
    chain,
    'codex(0.2x) -> gemini(0.4x) -> anthropic_aws(0.4x) -> deepseek_official(1x)',
  );
});

test('getPricingVisibleGroups hides empty and auto pseudo groups', () => {
  const groups = getPricingVisibleGroups({
    codex: {},
    auto: {},
    '': {},
    gemini: {},
  });

  assert.deepEqual(groups, ['all', 'codex', 'gemini']);
});

test('getVisibleModelGroups only returns groups selectable by the user', () => {
  assert.deepEqual(
    getVisibleModelGroups(['default', 'svip', 'auto'], { default: {}, vip: {}, auto: {} }),
    ['default'],
  );
});

test('getVisibleModelGroups expands all to user selectable groups', () => {
  assert.deepEqual(
    getVisibleModelGroups(['all'], { default: {}, vip: {}, auto: {} }),
    ['default', 'vip'],
  );
});

test('isModelVisibleInGroup treats all-enabled models as visible in every group', () => {
  assert.equal(isModelVisibleInGroup({ enable_groups: ['all'] }, 'codex'), true);
  assert.equal(isModelVisibleInGroup({ enable_groups: ['codex'] }, 'codex'), true);
  assert.equal(isModelVisibleInGroup({ enable_groups: ['codex'] }, 'gemini'), false);
});
