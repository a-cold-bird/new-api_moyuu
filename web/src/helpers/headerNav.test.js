import test from 'node:test';
import assert from 'node:assert/strict';

import { getHeaderNavModuleAccess } from './headerNav.js';

test('parses pricing object access from HeaderNavModules', () => {
  const access = getHeaderNavModuleAccess(
    '{"pricing":{"enabled":false,"requireAuth":true}}',
    'pricing',
  );

  assert.deepEqual(access, { enabled: false, requireAuth: true });
});

test('supports legacy boolean pricing access', () => {
  const access = getHeaderNavModuleAccess('{"pricing":false}', 'pricing');

  assert.deepEqual(access, { enabled: false, requireAuth: false });
});

test('parses string and numeric module access values', () => {
  assert.deepEqual(getHeaderNavModuleAccess('{"pricing":"false"}', 'pricing'), {
    enabled: false,
    requireAuth: false,
  });
  assert.deepEqual(getHeaderNavModuleAccess('{"pricing":0}', 'pricing'), {
    enabled: false,
    requireAuth: false,
  });
});

test('falls back to enabled public access when config is absent or invalid', () => {
  assert.deepEqual(getHeaderNavModuleAccess('', 'pricing'), {
    enabled: true,
    requireAuth: false,
  });
  assert.deepEqual(getHeaderNavModuleAccess('{bad json', 'pricing'), {
    enabled: true,
    requireAuth: false,
  });
});
