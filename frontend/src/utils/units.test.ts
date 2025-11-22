/**
 * 單位轉換工具模組測試
 * 驗證基本功能是否正常運作
 */
import { describe, it, expect } from 'vitest';
import { mlToOz, ozToMl, formatVolume, parseVolume, units } from './units';

describe('單位轉換工具模組', () => {
  describe('mlToOz', () => {
    it('應該正確轉換 ml 到 oz', () => {
      expect(mlToOz(250)).toBeCloseTo(8.5, 1);
      expect(mlToOz(500)).toBeCloseTo(16.9, 1);
    });

    it('應該處理零值', () => {
      expect(mlToOz(0)).toBe(0);
    });

    it('應該處理負值', () => {
      expect(mlToOz(-100)).toBe(0);
    });
  });

  describe('ozToMl', () => {
    it('應該正確轉換 oz 到 ml', () => {
      expect(ozToMl(8.5)).toBeCloseTo(251, 0);
      expect(ozToMl(16.9)).toBeCloseTo(500, 0);
    });

    it('應該處理零值', () => {
      expect(ozToMl(0)).toBe(0);
    });

    it('應該處理負值', () => {
      expect(ozToMl(-10)).toBe(0);
    });
  });

  describe('formatVolume', () => {
    it('應該格式化 ml 為整數字串', () => {
      expect(formatVolume(250.7, 'ml')).toBe('251');
      expect(formatVolume(500, 'ml')).toBe('500');
    });

    it('應該格式化 oz 為小數點後 1 位字串', () => {
      expect(formatVolume(8.5, 'oz')).toBe('8.5');
      expect(formatVolume(16.9, 'oz')).toBe('16.9');
    });

    it('應該處理負值', () => {
      expect(formatVolume(-100, 'ml')).toBe('0');
    });
  });

  describe('parseVolume', () => {
    it('應該解析 ml 字串為整數', () => {
      expect(parseVolume('250', 'ml')).toBe(250);
      expect(parseVolume('250.7', 'ml')).toBe(251);
    });

    it('應該解析 oz 字串為小數點後 1 位', () => {
      expect(parseVolume('8.45', 'oz')).toBe(8.5);
      expect(parseVolume('16.9', 'oz')).toBe(16.9);
    });

    it('應該處理無效輸入', () => {
      expect(parseVolume('abc', 'ml')).toBe(0);
      expect(parseVolume('-100', 'oz')).toBe(0);
    });
  });

  describe('units 物件', () => {
    it('應該提供所有轉換函式', () => {
      expect(units.mlToOz).toBeDefined();
      expect(units.ozToMl).toBeDefined();
      expect(units.formatVolume).toBeDefined();
      expect(units.parseVolume).toBeDefined();
    });
  });
});
