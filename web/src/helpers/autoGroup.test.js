import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAutoGroupChain,
  getPricingVisibleGroups,
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
