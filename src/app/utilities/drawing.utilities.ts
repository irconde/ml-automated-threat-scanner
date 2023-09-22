import { Coordinate2D } from '../../models/detection';
import { cornerstone } from '../csSetup';
import { COLORS } from '../../enums/detection-styles';

export const renderBboxCrosshair = (
  context: CanvasRenderingContext2D,
  target: HTMLElement,
  mousePosition: Coordinate2D,
  imgDimensions: { width: number; height: number },
) => {
  const crosshairLength = 8;
  const mousePos = cornerstone.pageToPixel(
    target,
    mousePosition.x,
    mousePosition.y,
  );
  const { width, height } = imgDimensions;
  context.lineWidth = 2;
  if (
    mousePos.x >= 0 &&
    mousePos.x <= width &&
    mousePos.y >= 0 &&
    mousePos.y <= height
  ) {
    context.beginPath();
    context.setLineDash([2, 2]);
    context.strokeStyle = 'grey';
    context.moveTo(mousePos.x, 0);
    context.lineTo(mousePos.x, height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, mousePos.y);
    context.lineTo(width, mousePos.y);
    context.stroke();
  }
  context.setLineDash([]);
  context.strokeStyle = COLORS.BLUE;
  context.beginPath();
  context.moveTo(mousePos.x - crosshairLength, mousePos.y);
  context.lineTo(mousePos.x + crosshairLength, mousePos.y);
  context.stroke();
  context.beginPath();
  context.moveTo(mousePos.x, mousePos.y - crosshairLength);
  context.lineTo(mousePos.x, mousePos.y + crosshairLength);
  context.stroke();
};
