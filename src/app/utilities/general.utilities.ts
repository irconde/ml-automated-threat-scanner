export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const buildIntervals = () => {
  const intervals = [{ min: 0, max: 255 }];
  for (let i = 255; i < 65535; i += 256) {
    intervals.push({ min: i, max: i + 256 });
  }
  return intervals;
};

/**
 * Converts a 16-bit value to an 8-bit value
 *
 * @param {number} greyScale - 16-bit gray scale value between 0 - 65535
 * @param {Array<{min: number, max: number}>} intervals - Build intervals for color conversion
 * @returns {number} - 8-Bit gray scale value
 */
export const findGrayValue = (
  greyScale: number,
  intervals: { min: number; max: number }[],
) => {
  const inRange = (value: number, min: number, max: number) => {
    return (value - min) * (value - max) <= 0;
  };

  // TODO: ensure a default value of 0 is okay here
  let result: number = 0;
  for (let x = 0; x < intervals.length; x++) {
    if (inRange(greyScale, intervals[x].min, intervals[x].max)) {
      result = x;
      break;
    }
  }
  return result;
};
