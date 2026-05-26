export const buildAutoGroupChain = (autoGroups = [], groupRatio = {}) => {
  if (!Array.isArray(autoGroups)) return '';

  return autoGroups
    .map((group) => {
      const rawGroup = String(group || '');
      const displayGroup = rawGroup.trim();
      if (!displayGroup) return '';
      const ratio = groupRatio[rawGroup] ?? groupRatio[displayGroup] ?? 1;
      return `${displayGroup}(${ratio}x)`;
    })
    .filter(Boolean)
    .join(' -> ');
};

export const getPricingVisibleGroups = (usableGroup = {}) => [
  'all',
  ...Object.keys(usableGroup).filter((key) => key !== '' && key !== 'auto'),
];

export const getVisibleModelGroups = (modelEnableGroups = [], usableGroup = {}) => {
  const selectableGroups = Object.keys(usableGroup).filter(
    (key) => key !== '' && key !== 'auto',
  );
  if (!Array.isArray(modelEnableGroups) || modelEnableGroups.length === 0) {
    return [];
  }
  if (modelEnableGroups.includes('all')) {
    return selectableGroups;
  }
  return modelEnableGroups.filter((group) => selectableGroups.includes(group));
};

export const isModelVisibleInGroup = (model = {}, group = 'all') => {
  if (group === 'all') return true;
  const enableGroups = Array.isArray(model.enable_groups) ? model.enable_groups : [];
  return enableGroups.includes('all') || enableGroups.includes(group);
};
