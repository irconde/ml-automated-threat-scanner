export const COLORS = {
  WHITE: '#FFFFFF',
  YELLOW: '#F7B500',
  GREEN: '#0b8409',
  RED: '#ff4b4b',
  BLUE: '#367FFF',
  HOVER_COLOR: '#2658b2',
} as const;
export const DETECTION_STYLE = {
  NORMAL_COLOR: COLORS.BLUE,
  SELECTED_COLOR: COLORS.BLUE,
  VALID_COLOR: COLORS.GREEN,
  INVALID_COLOR: COLORS.RED,
  LABEL_PADDING: {
    LEFT: 10,
    BOTTOM: 8,
  },
  LABEL_FONT: 'bold 13px Noto Sans JP',
  FONT_DETAILS: {
    FAMILY: 'Noto Sans JP',
    SIZE: 13,
    WEIGHT: 'bold',
    get(zoom = 1) {
      return `${this.WEIGHT} ${this.SIZE / zoom}px ${this.FAMILY}`;
    },
  },
  LABEL_HEIGHT: 28,
  LABEL_TEXT_COLOR: COLORS.WHITE,
  BORDER_WIDTH: 2,
} as const;


