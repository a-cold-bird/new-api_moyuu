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
