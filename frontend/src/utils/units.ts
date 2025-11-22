/**
 * 單位轉換工具模組
 * 
 * 提供毫升 (ml) 和液體盎司 (oz) 之間的雙向轉換功能，
 * 包含格式化、解析和驗證等輔助函式。
 * 
 * @module utils/units
 * @see {@link https://en.wikipedia.org/wiki/Fluid_ounce|Fluid Ounce - Wikipedia}
 * 
 * @example
 * ```typescript
 * import { mlToOz, ozToMl, formatVolume } from '@/utils/units';
 * 
 * // 轉換 250ml 為盎司
 * const oz = mlToOz(250); // 8.5
 * 
 * // 轉換 8.5oz 為毫升
 * const ml = ozToMl(8.5); // 251
 * 
 * // 格式化顯示
 * const display = formatVolume(250, 'ml'); // "250"
 * ```
 * 
 * 根據需求 7.1-7.5 實作：
 * - 7.1: ml → oz 轉換使用標準係數
 * - 7.2: oz → ml 轉換使用標準係數
 * - 7.3: oz 顯示小數點後 1 位，ml 顯示整數
 * - 7.4: 提供格式化和解析函式
 * - 7.5: 處理邊界情況（零、負值）
 * 
 * 轉換係數: 1 oz = 29.5735 ml (US fluid ounce)
 */

/**
 * 轉換係數：毫升轉液體盎司
 * @constant {number}
 * @default 0.033814
 */
const ML_TO_OZ = 0.033814; // 1 ml = 0.033814 oz

/**
 * 轉換係數：液體盎司轉毫升
 * @constant {number}
 * @default 29.5735
 */
const OZ_TO_ML = 29.5735;  // 1 oz = 29.5735 ml

/**
 * 支援的容量單位類型
 * @typedef {'ml' | 'oz'} VolumeUnit
 */
export type VolumeUnit = 'ml' | 'oz';

/**
 * 將毫升轉換為液體盎司
 * 
 * 使用標準轉換係數 (1 oz = 29.5735 ml) 進行轉換，
 * 結果四捨五入至小數點後 1 位以符合顯示需求。
 * 
 * @param {number} ml - 毫升數值
 * @returns {number} 液體盎司數值，四捨五入至小數點後 1 位
 * 
 * @example
 * ```typescript
 * mlToOz(250);  // 8.5
 * mlToOz(500);  // 16.9
 * mlToOz(0);    // 0
 * mlToOz(-100); // 0 (負值視為無效)
 * ```
 * 
 * @remarks
 * - 需求 7.1: 使用轉換係數 1 oz = 29.5735 ml
 * - 需求 7.3: 四捨五入至小數點後 1 位
 * - 需求 7.5: 處理零和負值等邊界情況
 * 
 * @see {@link ozToMl} 反向轉換函式
 */
export const mlToOz = (ml: number): number => {
  // 處理邊界情況
  if (ml === 0) return 0;
  if (ml < 0) return 0; // 負值視為無效，回傳 0
  
  const oz = ml * ML_TO_OZ;
  // 四捨五入至小數點後 1 位
  return Math.round(oz * 10) / 10;
};

/**
 * 將液體盎司轉換為毫升
 * 
 * 使用標準轉換係數 (1 oz = 29.5735 ml) 進行轉換，
 * 結果四捨五入至整數以符合毫升的顯示慣例。
 * 
 * @param {number} oz - 液體盎司數值
 * @returns {number} 毫升數值，四捨五入至整數
 * 
 * @example
 * ```typescript
 * ozToMl(8.5);  // 251
 * ozToMl(16.9); // 500
 * ozToMl(0);    // 0
 * ozToMl(-10);  // 0 (負值視為無效)
 * ```
 * 
 * @remarks
 * - 需求 7.2: 使用轉換係數 1 oz = 29.5735 ml
 * - 需求 7.5: 處理零和負值等邊界情況
 * - 毫升始終顯示為整數，不保留小數位
 * 
 * @see {@link mlToOz} 反向轉換函式
 */
export const ozToMl = (oz: number): number => {
  // 處理邊界情況
  if (oz === 0) return 0;
  if (oz < 0) return 0; // 負值視為無效，回傳 0
  
  const ml = oz * OZ_TO_ML;
  // 四捨五入至整數
  return Math.round(ml);
};

/**
 * 格式化容量值為顯示字串
 * 
 * 根據單位類型套用不同的格式化規則：
 * - 毫升 (ml): 顯示為整數
 * - 液體盎司 (oz): 顯示小數點後 1 位
 * 
 * @param {number} value - 容量數值
 * @param {VolumeUnit} unit - 單位類型 ('ml' 或 'oz')
 * @returns {string} 格式化後的字串
 * 
 * @example
 * ```typescript
 * formatVolume(250, 'ml');    // "250"
 * formatVolume(250.7, 'ml');  // "251"
 * formatVolume(8.5, 'oz');    // "8.5"
 * formatVolume(8.45, 'oz');   // "8.5"
 * formatVolume(-100, 'ml');   // "0"
 * ```
 * 
 * @remarks
 * - 需求 7.3: 液體盎司顯示小數點後 1 位，毫升顯示整數
 * - 需求 7.4: 提供格式化函式供 UI 使用
 * - 負值會被格式化為 "0"
 * 
 * @see {@link parseVolume} 反向解析函式
 */
export const formatVolume = (value: number, unit: VolumeUnit): string => {
  if (value < 0) return '0';
  
  if (unit === 'oz') {
    // 液體盎司顯示小數點後 1 位
    return value.toFixed(1);
  } else {
    // 毫升顯示整數
    return Math.round(value).toString();
  }
};

/**
 * 解析字串為容量數值
 * 
 * 將使用者輸入的字串轉換為數值，並根據單位類型套用適當的精度：
 * - 毫升 (ml): 四捨五入至整數
 * - 液體盎司 (oz): 四捨五入至小數點後 1 位
 * 
 * @param {string} value - 輸入字串
 * @param {VolumeUnit} unit - 單位類型 ('ml' 或 'oz')
 * @returns {number} 解析後的數值
 * 
 * @example
 * ```typescript
 * parseVolume('250', 'ml');     // 250
 * parseVolume('250.7', 'ml');   // 251
 * parseVolume('8.45', 'oz');    // 8.5
 * parseVolume('16.9', 'oz');    // 16.9
 * parseVolume('abc', 'ml');     // 0 (無效輸入)
 * parseVolume('-100', 'oz');    // 0 (負值)
 * ```
 * 
 * @remarks
 * - 需求 7.4: 提供解析函式處理使用者輸入
 * - 需求 7.5: 處理無效輸入和負值
 * - 無法解析的字串回傳 0
 * - 負值視為無效，回傳 0
 * 
 * @see {@link formatVolume} 反向格式化函式
 */
export const parseVolume = (value: string, unit: VolumeUnit): number => {
  const parsed = parseFloat(value);
  
  // 處理無效輸入
  if (isNaN(parsed) || parsed < 0) return 0;
  
  if (unit === 'oz') {
    // 液體盎司四捨五入至小數點後 1 位
    return Math.round(parsed * 10) / 10;
  } else {
    // 毫升四捨五入至整數
    return Math.round(parsed);
  }
};

/**
 * 單位轉換工具物件
 * 
 * 提供統一的命名空間存取所有轉換函式，
 * 方便批次匯入和使用。
 * 
 * @constant {Object} units
 * @property {Function} mlToOz - 毫升轉液體盎司
 * @property {Function} ozToMl - 液體盎司轉毫升
 * @property {Function} formatVolume - 格式化容量值
 * @property {Function} parseVolume - 解析容量字串
 * 
 * @example
 * ```typescript
 * import { units } from '@/utils/units';
 * 
 * const oz = units.mlToOz(250);
 * const ml = units.ozToMl(8.5);
 * const display = units.formatVolume(250, 'ml');
 * const value = units.parseVolume('8.5', 'oz');
 * ```
 */
export const units = {
  mlToOz,
  ozToMl,
  formatVolume,
  parseVolume,
};

/**
 * 通用容量單位轉換函式
 * 
 * 根據來源和目標單位自動選擇適當的轉換函式。
 * 如果來源和目標單位相同，直接回傳原值。
 * 
 * @param {number} volume - 容量數值
 * @param {VolumeUnit} from - 來源單位
 * @param {VolumeUnit} to - 目標單位
 * @returns {number} 轉換後的數值
 * 
 * @example
 * ```typescript
 * convertVolume(250, 'ml', 'oz');  // 8.5
 * convertVolume(8.5, 'oz', 'ml');  // 251
 * convertVolume(250, 'ml', 'ml');  // 250 (相同單位)
 * ```
 * 
 * @deprecated 建議直接使用 {@link mlToOz} 或 {@link ozToMl}
 * @remarks 保留此函式以維持向後相容性
 */
export const convertVolume = (volume: number, from: VolumeUnit, to: VolumeUnit): number => {
  if (from === to) return volume;
  
  if (from === 'ml' && to === 'oz') {
    return mlToOz(volume);
  } else if (from === 'oz' && to === 'ml') {
    return ozToMl(volume);
  }
  
  return volume;
};

/**
 * 取得容量單位的中文標籤
 * 
 * @param {VolumeUnit} unit - 單位類型
 * @returns {string} 中文標籤
 * 
 * @example
 * ```typescript
 * getVolumeUnitLabel('ml');  // "毫升"
 * getVolumeUnitLabel('oz');  // "盎司"
 * ```
 */
export const getVolumeUnitLabel = (unit: VolumeUnit): string => {
  const labels: Record<VolumeUnit, string> = {
    'ml': '毫升',
    'oz': '盎司',
  };
  
  return labels[unit] || unit;
};

/**
 * 取得常用容量預設值陣列
 * 
 * 回傳一組常用的容量數值，可用於快速輸入按鈕。
 * 根據指定單位自動轉換數值。
 * 
 * @param {VolumeUnit} [unit='ml'] - 單位類型，預設為 'ml'
 * @returns {number[]} 常用容量數值陣列
 * 
 * @example
 * ```typescript
 * getCommonVolumes('ml');  // [250, 350, 500, 750, 1000]
 * getCommonVolumes('oz');  // [8.5, 11.8, 16.9, 25.4, 33.8]
 * getCommonVolumes();      // [250, 350, 500, 750, 1000] (預設 ml)
 * ```
 * 
 * @remarks
 * 常用容量基準值 (ml): 250, 350, 500, 750, 1000
 */
export const getCommonVolumes = (unit: VolumeUnit = 'ml'): number[] => {
  const commonVolumesInMl = [250, 350, 500, 750, 1000];
  
  if (unit === 'ml') {
    return commonVolumesInMl;
  }
  
  return commonVolumesInMl.map(volume => mlToOz(volume));
};

/**
 * 驗證容量值是否在有效範圍內
 * 
 * 檢查容量值是否在 1ml 到 5000ml 之間。
 * 自動將其他單位轉換為毫升後進行驗證。
 * 
 * @param {number} volume - 容量數值
 * @param {VolumeUnit} [unit='ml'] - 單位類型，預設為 'ml'
 * @returns {boolean} 是否在有效範圍內
 * 
 * @example
 * ```typescript
 * validateVolumeRange(250, 'ml');    // true
 * validateVolumeRange(8.5, 'oz');    // true (約 251ml)
 * validateVolumeRange(0, 'ml');      // false (小於 1ml)
 * validateVolumeRange(6000, 'ml');   // false (大於 5000ml)
 * validateVolumeRange(200, 'oz');    // false (約 5915ml，超過上限)
 * ```
 * 
 * @remarks
 * 有效範圍: 1ml ≤ volume ≤ 5000ml
 */
export const validateVolumeRange = (volume: number, unit: VolumeUnit = 'ml'): boolean => {
  const volumeInMl = unit === 'ml' ? volume : ozToMl(volume);
  return volumeInMl >= 1 && volumeInMl <= 5000;
};