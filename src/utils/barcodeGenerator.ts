/**
 * Code 128-B & Code 39 Barcode Generator for Digital Member Pass
 * Generates SVG/Canvas representations of 1D linear barcodes for any username, ID, or custom text.
 */

// Standard Code 128 pattern table (patterns 0 to 106)
// Each number corresponds to widths of bars and spaces [b1, s1, b2, s2, b3, s3]
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP code with 7 widths)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes text into Code 128 (Subset B) binary modules (1 for bar, 0 for space)
 */
export function encodeCode128B(text: string): { modules: boolean[]; checksum: number; valid: boolean } {
  if (!text || text.length === 0) {
    text = 'RFA';
  }

  // Filter text to printable ASCII (32-126)
  const clean = text.replace(/[^\x20-\x7E]/g, ' ');

  let checksum = START_CODE_B;
  const patternIndices: number[] = [START_CODE_B];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    patternIndices.push(code);
    checksum += code * (i + 1);
  }

  const checkCode = checksum % 103;
  patternIndices.push(checkCode);
  patternIndices.push(STOP_CODE);

  // Convert pattern sequence into boolean modules
  const modules: boolean[] = [];

  for (const idx of patternIndices) {
    const pattern = CODE128_PATTERNS[idx];
    if (!pattern) continue;

    let isBar = true;
    for (let c = 0; c < pattern.length; c++) {
      const width = parseInt(pattern[c], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  return {
    modules,
    checksum: checkCode,
    valid: true
  };
}

/**
 * Generates an SVG path for drawing barcode bars
 */
export function generateBarcodeSVGPaths(
  text: string,
  totalWidth: number = 260,
  barHeight: number = 42
): { paths: string; width: number; height: number; rawText: string } {
  const { modules } = encodeCode128B(text);
  if (modules.length === 0) return { paths: '', width: totalWidth, height: barHeight, rawText: text };

  // Quiet zones on both sides (10 modules each)
  const quietZoneModules = 10;
  const totalModules = modules.length + quietZoneModules * 2;
  const moduleWidth = totalWidth / totalModules;

  let pathData = '';
  let inBar = false;
  let barStart = 0;

  // Add quiet zone offset
  const fullModules: boolean[] = [
    ...new Array(quietZoneModules).fill(false),
    ...modules,
    ...new Array(quietZoneModules).fill(false)
  ];

  for (let i = 0; i < fullModules.length; i++) {
    const isBar = fullModules[i];
    if (isBar && !inBar) {
      inBar = true;
      barStart = i * moduleWidth;
    } else if (!isBar && inBar) {
      inBar = false;
      const barEnd = i * moduleWidth;
      const w = barEnd - barStart;
      pathData += `M ${barStart.toFixed(2)},0 L ${(barStart + w).toFixed(2)},0 L ${(barStart + w).toFixed(2)},${barHeight} L ${barStart.toFixed(2)},${barHeight} Z `;
    }
  }

  if (inBar) {
    const barEnd = fullModules.length * moduleWidth;
    const w = barEnd - barStart;
    pathData += `M ${barStart.toFixed(2)},0 L ${(barStart + w).toFixed(2)},0 L ${(barStart + w).toFixed(2)},${barHeight} L ${barStart.toFixed(2)},${barHeight} Z `;
  }

  return {
    paths: pathData,
    width: totalWidth,
    height: barHeight,
    rawText: text
  };
}
