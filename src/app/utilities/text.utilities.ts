export const limitCharCount = (string: string, count = 16): string => {
  if (string.length > count) {
    return string.slice(0, count) + '...';
  } else {
    return string;
  }
};

export const getTextLabelSize = (
  context: CanvasRenderingContext2D,
  text: string,
  padding: number,
  zoom: number,
  height = 28,
): { height: number; width: number } => {
  const stringWidth = context.measureText(text).width;
  return {
    width: stringWidth + (padding / zoom) * 2,
    height: height / zoom,
  };
};

/**
 * Converts hex format to a rgb object. If fails to parse, it will return white
 * @param hex
 */
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: 255,
        g: 255,
        b: 255,
      };
};

/**
 * Converts hex string to a css rgb string. ex: '#FFFFFF' --> 'rgb(255, 255, 255)'
 * @param hex
 * @param alpha
 */
export const hexToCssRgba = (hex: string, alpha = 0.25) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
