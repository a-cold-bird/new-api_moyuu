export const DEFAULT_HEADER_NAV_ACCESS = {
  enabled: true,
  requireAuth: false,
};

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return fallback;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

export function normalizeHeaderNavModules(config) {
  if (!config) return null;
  try {
    const modules = typeof config === 'string' ? JSON.parse(config) : { ...config };
    if (typeof modules.pricing === 'boolean') {
      modules.pricing = {
        enabled: modules.pricing,
        requireAuth: false,
      };
    }
    return modules;
  } catch {
    return null;
  }
}

export function getHeaderNavModuleAccess(config, moduleKey) {
  const modules = normalizeHeaderNavModules(config);
  if (!modules || modules[moduleKey] === undefined) return DEFAULT_HEADER_NAV_ACCESS;

  const moduleConfig = modules[moduleKey];
  if (['boolean', 'number', 'string'].includes(typeof moduleConfig)) {
    return {
      enabled: parseBoolean(moduleConfig, DEFAULT_HEADER_NAV_ACCESS.enabled),
      requireAuth: false,
    };
  }
  if (moduleConfig && typeof moduleConfig === 'object') {
    return {
      enabled: parseBoolean(moduleConfig.enabled, DEFAULT_HEADER_NAV_ACCESS.enabled),
      requireAuth: parseBoolean(moduleConfig.requireAuth, DEFAULT_HEADER_NAV_ACCESS.requireAuth),
    };
  }
  return DEFAULT_HEADER_NAV_ACCESS;
}
