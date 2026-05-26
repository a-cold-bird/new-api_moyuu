/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

const isModelEnabledForGroup = (pricing, group, autoGroups = []) => {
  if (!pricing || !Array.isArray(pricing.enable_groups)) {
    return true;
  }

  if (pricing.enable_groups.includes('all')) {
    return true;
  }

  if (group === 'auto') {
    return autoGroups.some((autoGroup) =>
      pricing.enable_groups.includes(autoGroup),
    );
  }

  if (!group) {
    return true;
  }

  return pricing.enable_groups.includes(group);
};

// 处理模型数据
export const processModelsData = (
  data,
  currentModel,
  selectedGroup = '',
  pricingData = [],
  autoGroups = [],
) => {
  const pricingByModel = new Map(
    pricingData.map((pricing) => [pricing.model_name, pricing]),
  );

  const modelOptions = data
    .filter((model) =>
      isModelEnabledForGroup(
        pricingByModel.get(model),
        selectedGroup,
        autoGroups,
      ),
    )
    .map((model) => ({
      label: model,
      value: model,
    }));

  const hasCurrentModel = modelOptions.some(
    (option) => option.value === currentModel,
  );
  const selectedModel =
    hasCurrentModel && modelOptions.length > 0
      ? currentModel
      : modelOptions[0]?.value || '';

  return { modelOptions, selectedModel };
};
