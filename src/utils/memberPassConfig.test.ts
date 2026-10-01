import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPassBackgroundConfig,
  savePassBackgroundConfig,
  resetPassBackgroundConfig,
  DEFAULT_PASS_BACKGROUND_CONFIG,
  PRESET_BACKGROUND_TEMPLATES,
  PassBackgroundConfig
} from './memberPassConfig';

describe('Member Pass Dynamic Background Config', () => {
  beforeEach(() => {
    resetPassBackgroundConfig();
  });

  it('should return default config if nothing in localStorage', () => {
    const config = getPassBackgroundConfig();
    expect(config.type).toBe('default');
    expect(config.opacity).toBe(1.0);
    expect(config.presetId).toBe('cyber_armor');
  });

  it('should persist and load custom background image and settings', () => {
    const customConfig: PassBackgroundConfig = {
      type: 'custom_image',
      customImageUrl: 'data:image/png;base64,mockImageData123',
      customImageName: 'custom-gym-art.png',
      opacity: 0.8,
      darkOverlay: 25,
      showArmorPanels: false,
      showHexMesh: false,
      backgroundColor: '#050505',
      blendMode: 'overlay'
    };

    savePassBackgroundConfig(customConfig);
    const loaded = getPassBackgroundConfig();

    expect(loaded.type).toBe('custom_image');
    expect(loaded.customImageUrl).toBe('data:image/png;base64,mockImageData123');
    expect(loaded.customImageName).toBe('custom-gym-art.png');
    expect(loaded.opacity).toBe(0.8);
    expect(loaded.darkOverlay).toBe(25);
    expect(loaded.showArmorPanels).toBe(false);
  });

  it('should support preset background templates', () => {
    expect(PRESET_BACKGROUND_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    const goldPreset = PRESET_BACKGROUND_TEMPLATES.find((p) => p.id === 'dark_gold_marble');
    expect(goldPreset).toBeDefined();
    expect(goldPreset?.backgroundStyle).toBeDefined();
  });

  it('should reset back to default official configuration', () => {
    savePassBackgroundConfig({
      ...DEFAULT_PASS_BACKGROUND_CONFIG,
      type: 'preset',
      presetId: 'neon_cyber_grid'
    });

    const reset = resetPassBackgroundConfig();
    expect(reset.type).toBe('default');
    expect(getPassBackgroundConfig().type).toBe('default');
  });
});
