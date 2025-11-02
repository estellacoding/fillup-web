/**
 * 單位轉換相關工具函數
 */

export type VolumeUnit = 'ml' | 'l' | 'oz' | 'cup';

export const convertVolume = (volume: number, from: VolumeUnit, to: VolumeUnit): number => {
  // 先轉換為 ml (基準單位)
  let volumeInMl: number;
  
  switch (from) {
    case 'ml':
      volumeInMl = volume;
      break;
    case 'l':
      volumeInMl = volume * 1000;
      break;
    case 'oz':
      volumeInMl = volume * 29.5735; // 1 fl oz = 29.5735 ml
      break;
    case 'cup':
      volumeInMl = volume * 240; // 1 cup = 240 ml (US standard)
      break;
    default:
      volumeInMl = volume;
  }
  
  // 再轉換為目標單位
  switch (to) {
    case 'ml':
      return Math.round(volumeInMl);
    case 'l':
      return Math.round(volumeInMl / 1000 * 100) / 100;
    case 'oz':
      return Math.round(volumeInMl / 29.5735 * 100) / 100;
    case 'cup':
      return Math.round(volumeInMl / 240 * 100) / 100;
    default:
      return volumeInMl;
  }
};

export const getVolumeUnitLabel = (unit: VolumeUnit): string => {
  const labels: Record<VolumeUnit, string> = {
    'ml': '毫升',
    'l': '公升',
    'oz': '盎司',
    'cup': '杯'
  };
  
  return labels[unit] || unit;
};

export const getCommonVolumes = (unit: VolumeUnit = 'ml'): number[] => {
  const commonVolumesInMl = [250, 350, 500, 750, 1000];
  
  if (unit === 'ml') {
    return commonVolumesInMl;
  }
  
  return commonVolumesInMl.map(volume => convertVolume(volume, 'ml', unit));
};

export const validateVolumeRange = (volume: number, unit: VolumeUnit = 'ml'): boolean => {
  const volumeInMl = convertVolume(volume, unit, 'ml');
  return volumeInMl >= 1 && volumeInMl <= 5000;
};