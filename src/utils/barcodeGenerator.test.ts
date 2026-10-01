import { describe, it, expect } from 'vitest';
import { encodeCode128B, generateBarcodeSVGPaths } from './barcodeGenerator';

describe('Barcode Generator (Code 128-B)', () => {
  it('should encode user name into valid modules', () => {
    const result = encodeCode128B('AHMAD TAJUDIN');
    expect(result.valid).toBe(true);
    expect(result.modules.length).toBeGreaterThan(50);
    // Modules must contain true (bars) and false (spaces)
    expect(result.modules.some((m) => m === true)).toBe(true);
    expect(result.modules.some((m) => m === false)).toBe(true);
  });

  it('should handle custom usernames and alphanumeric codes', () => {
    const usernames = ['ridwan_gym', 'Member-001', 'VIP USER 99', 'Alex Turner'];
    for (const name of usernames) {
      const res = encodeCode128B(name);
      expect(res.valid).toBe(true);
      expect(res.checksum).toBeGreaterThanOrEqual(0);
      expect(res.checksum).toBeLessThan(103);
    }
  });

  it('should generate SVG path string for rendering on card', () => {
    const svgData = generateBarcodeSVGPaths('AHMAD TAJUDIN', 280, 48);
    expect(svgData.paths).toContain('M ');
    expect(svgData.paths).toContain('Z');
    expect(svgData.width).toBe(280);
    expect(svgData.height).toBe(48);
    expect(svgData.rawText).toBe('AHMAD TAJUDIN');
  });

  it('should fallback gracefully on empty string', () => {
    const emptyResult = encodeCode128B('');
    expect(emptyResult.valid).toBe(true);
    expect(emptyResult.modules.length).toBeGreaterThan(0);
  });
});
