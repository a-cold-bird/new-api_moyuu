import test from 'node:test';
import assert from 'node:assert/strict';

import { processModelsData } from './playgroundModels.js';

const pricing = [
  { model_name: 'codex-mini', enable_groups: ['codex'] },
  { model_name: 'gemini-pro', enable_groups: ['gemini'] },
  { model_name: 'shared-model', enable_groups: ['all'] },
];

test('processModelsData filters models by selected group and switches invalid selection', () => {
  const { modelOptions, selectedModel } = processModelsData(
    ['codex-mini', 'gemini-pro', 'shared-model'],
    'gemini-pro',
    'codex',
    pricing,
  );

  assert.deepEqual(
    modelOptions.map((option) => option.value),
    ['codex-mini', 'shared-model'],
  );
  assert.equal(selectedModel, 'codex-mini');
});

test('processModelsData treats auto as the union of configured auto groups', () => {
  const { modelOptions, selectedModel } = processModelsData(
    ['codex-mini', 'gemini-pro', 'shared-model'],
    'gemini-pro',
    'auto',
    pricing,
    ['codex'],
  );

  assert.deepEqual(
    modelOptions.map((option) => option.value),
    ['codex-mini', 'shared-model'],
  );
  assert.equal(selectedModel, 'codex-mini');
});

test('processModelsData clears selected model when selected group has no models', () => {
  const { modelOptions, selectedModel } = processModelsData(
    ['codex-mini', 'gemini-pro'],
    'codex-mini',
    'anthropic',
    pricing,
  );

  assert.deepEqual(modelOptions, []);
  assert.equal(selectedModel, '');
});
