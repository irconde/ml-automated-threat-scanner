import csTools from "eac-cornerstone-tools";
import * as cornerstone from "cornerstone-core";
import { DETECTION_STYLE } from "../../../enums/detection-styles";
import {
  CommonDetections,
  CornerstoneMode,
  EditionMode,
  ToolNames,
} from "../../../enums/cornerstone";
import { getTextLabelSize } from "../text.utilities";
import {
  calculatePolygonMask,
  pointInRect,
  recalculateRectangle,
  renderPolygonMasks,
} from "../detection.utilities";

const drawHandles = csTools.importInternal("drawing/drawHandles");
const BaseAnnotationTool = csTools.importInternal("base/BaseAnnotationTool");
const getNewContext = csTools.importInternal("drawing/getNewContext");
const draw = csTools.importInternal("drawing/draw");
const setShadow = csTools.importInternal("drawing/setShadow");
const draw4CornerRect = csTools.importInternal("drawing/draw4CornerRect");
const drawRect = csTools.importInternal("drawing/drawRect");

/**
 * @public
 * @class BoundingBoxDrawingTool
 * @classdesc Tool for drawing rectangular regions of interest
 * @extends Tools.Base.BaseAnnotationTool
 */
export default class BoundingBoxDrawingTool extends BaseAnnotationTool {
  constructor(props = {}) {
    const defaultProps = {
      name: ToolNames.BoundingBox,
      supportedInteractionTypes: ["Mouse", "Touch"],
      configuration: {
        drawHandles: true,
        renderDashed: false,
      },
    };
    super(props, defaultProps);
  }

  /**
   * Method that overrides the original abstract method in the cornerstone-tools library
   * Automatically invoked on mouse move to know whether the mouse pointer is over (or close to) the rectangle's border
   *
   * @param {HTMLElement} element HTML Element where mouse is over
   * @param {{handles: {start: number, end: number}}} data HTML Element where mouse is over
   * @param {Array<number>} coords 2D point defined as a pair of coordinates (x,y)
   * @returns {boolean}
   */
  pointNearTool(element, data, coords, interactionType) {
    const hasStartAndEndHandles =
      data && data.handles && data.handles.start && data.handles.end;
    const validParameters = hasStartAndEndHandles;

    if (!validParameters) {
      console.log("invalid parameters supplied to tool's pointNearTool");
    }
    if (!validParameters || data.visible === false) {
      return false;
    }
    const startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
    const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
    const rect = [startCanvas.x, startCanvas.y, endCanvas.x, endCanvas.y];
    return pointInRect(coords, rect);
  }

  // Method that overrides the original abstract method in the cornerstone-tools library
  // Automatically invoked when a handle is selected and it's being dragged
  handleSelectedCallback(evt, toolData, handle, interactionType = "mouse") {
    if (this.options.editionMode === EditionMode.Bounding) {
      super.handleSelectedCallback(evt, toolData, handle, interactionType);
    }
  }

  /**
   * Method that overrides the original abstract method in the cornerstone-tools library
   * Automatically invoked to render all the widgets that comprise a detection
   * @param {*} evt Event object containing necessary event/canvas data
   */
  renderToolData(evt) {
    const toolData = csTools.getToolState(evt.currentTarget, this.name);
    if (!toolData) {
      // No tool data
      return;
    }
    const eventData = evt.detail;
    // eslint-disable-next-line no-unused-vars
    const { image, element } = eventData;
    const zoom = this.options.zoomLevel;
    const lineWidth = DETECTION_STYLE.BORDER_WIDTH;

    const lineDash = csTools.getModule("globalConfiguration").configuration
      .lineDash;
    const {
      handleRadius,
      drawHandlesOnHover,
      hideHandlesIfMoving,
      renderDashed,
    } = this.configuration;

    const context = getNewContext(eventData.canvasContext.canvas);

    const color = DETECTION_STYLE.NORMAL_COLOR;
    const handleOptions = {
      color,
      handleRadius: 8,
      handleLineWidth: 3,
      fill: "white",
      drawHandlesIfActive: drawHandlesOnHover,
      hideHandlesIfMoving,
    };

    draw(context, (context) => {
      // If we have tool data for this element - iterate over each set and draw it
      for (let i = 0; i < toolData.data.length; i++) {
        const data = toolData.data[i];
        if (data.visible === false) {
          continue;
        }
        // Configure
        setShadow(context, this.configuration);
        const rectOptions = { color };

        if (renderDashed) {
          rectOptions.lineDash = lineDash;
        }
        rectOptions.lineWidth = lineWidth;

        // Draw bounding box
        if (this.options.cornerstoneMode === CornerstoneMode.Edition) {
          data.handles = recalculateRectangle(data.handles);
          draw4CornerRect(
            context,
            element,
            data.handles.start,
            data.handles.end,
            data.handles.start_prima,
            data.handles.end_prima,
            rectOptions,
            "pixel",
          );
        } else {
          drawRect(
            context,
            element,
            data.handles.start,
            data.handles.end,
            rectOptions,
            "pixel",
          );
        }
        // Draw handles
        if (
          this.options.editionMode == EditionMode.Bounding &&
          this.configuration.drawHandles
        ) {
          drawHandles(context, eventData, data.handles, handleOptions);
        }
        // Label Rendering

        if (
          this.options.editionMode == EditionMode.NoTool &&
          data.updatingAnnotation === true
        ) {
          if (!data.handles.start.moving && !data.handles.end.moving) {
            let myCoords;
            if (
              data.handles.end.y < data.handles.start.y &&
              data.handles.end.x < data.handles.start.x
            ) {
              myCoords = cornerstone.pixelToCanvas(element, {
                x: data.handles.end.x,
                y: data.handles.end.y,
              });
            } else if (
              data.handles.end.y > data.handles.start.y &&
              data.handles.end.x < data.handles.start.x
            ) {
              myCoords = cornerstone.pixelToCanvas(element, {
                x: data.handles.end.x,
                y: data.handles.start.y,
              });
            } else if (data.handles.end.y < data.handles.start.y) {
              myCoords = cornerstone.pixelToCanvas(element, {
                x: data.handles.start.x,
                y: data.handles.end.y,
              });
            } else {
              myCoords = cornerstone.pixelToCanvas(element, data.handles.start);
            }

            context.font = DETECTION_STYLE.FONT_DETAILS.get(zoom);

            context.lineWidth = DETECTION_STYLE.BORDER_WIDTH;
            context.strokeStyle = data.renderColor;
            context.fillStyle = data.renderColor;
            const categoryName = data.categoryName;
            const labelSize = getTextLabelSize(
              context,
              categoryName,
              DETECTION_STYLE.LABEL_PADDING.LEFT,
              zoom,
              DETECTION_STYLE.LABEL_HEIGHT,
            );
            context.fillRect(
              myCoords.x - 1 * zoom,
              myCoords.y - labelSize.height,
              labelSize.width,
              labelSize.height,
            );
            context.fillStyle = DETECTION_STYLE.LABEL_TEXT_COLOR;
            context.fillText(
              categoryName,
              myCoords.x + DETECTION_STYLE.LABEL_PADDING.LEFT * zoom,
              myCoords.y - DETECTION_STYLE.LABEL_PADDING.BOTTOM * zoom,
            );
          }
        }
        // Polygon Mask Rendering
        // First check if it exists, new detections may not have this field built yet
        if (data.segmentation) {
          // Make sure it is non-empty, not all detections will have a mask
          // for (let z = 0; z < data.segmentation.length; z++) {

          const pixelStart = cornerstone.pixelToCanvas(element, {
            x: data.handles.start.x,
            y: data.handles.start.y,
          });
          const pixelEnd = cornerstone.pixelToCanvas(element, {
            x: data.handles.end.x,
            y: data.handles.end.y,
          });
          let flippedCoords = [
            pixelStart.x,
            pixelStart.y,
            pixelEnd.x,
            pixelEnd.y,
          ];
          // Fix flipped rectangle issues
          if (pixelStart.x > pixelEnd.x && pixelStart.y > pixelEnd.y) {
            flippedCoords = [
              pixelEnd.x,
              pixelEnd.y,
              pixelStart.x,
              pixelStart.y,
            ];
          } else if (pixelStart.x > pixelEnd.x) {
            flippedCoords = [
              pixelEnd.x,
              pixelStart.y,
              pixelStart.x,
              pixelEnd.y,
            ];
          } else if (pixelStart.y > pixelEnd.y) {
            flippedCoords = [
              pixelStart.x,
              pixelEnd.y,
              pixelEnd.x,
              pixelStart.y,
            ];
          }

          const [x_0, y_0, x_f, y_f] = flippedCoords;
          context.strokeRect(x_0, y_0, x_f - x_0, y_f - y_0);

          data.segmentation = calculatePolygonMask(
            flippedCoords,
            data.segmentation,
          );
          context.strokeStyle = DETECTION_STYLE.SELECTED_COLOR;
          context.fillStyle = DETECTION_STYLE.SELECTED_COLOR;
          context.globalAlpha = 0.5;

          renderPolygonMasks(context, data.segmentation);
          context.globalAlpha = 1.0;
          // }
        }
      }
    });
  }

  // eslint-disable-next-line no-unused-vars
  updateCachedStats(image, element, data) {}

  // Abstract method invoked when the mouse is clicked (on mouse down) to create and add a new annotation
  createNewMeasurement(eventData) {
    if (this.options.cornerstoneMode === CornerstoneMode.Edition) return;

    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;
    if (!goodEventData) {
      console.log(
        "required eventData not supplied to tool's createNewMeasurement",
      );
      return;
    }
    return {
      visible: true,
      active: true,
      color: undefined,
      invalidated: true,
      handles: {
        start: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: false,
        },
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true,
        },
        start_prima: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true,
        },
        end_prima: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true,
        },
        initialRotation: eventData.viewport.rotation,
        textBox: {
          active: false,
          hasMoved: false,
          movesIndependently: false,
          drawnIndependently: true,
          allowedOutsideImage: true,
          hasBoundingBox: true,
        },
      },
      categoryName: CommonDetections.Operator,
      updatingAnnotation: false,
    };
  }
}

/**
 *
 * @param {{x: number, y: number}} startHandle
 * @param {{x: number, y: number}} endHandle
 * @returns {{ left: number, top: number, width: number, height: number}}
 */

function _getRectangleImageCoordinates(startHandle, endHandle) {
  return {
    left: Math.min(startHandle.x, endHandle.x),
    top: Math.min(startHandle.y, endHandle.y),
    width: Math.abs(startHandle.x - endHandle.x),
    height: Math.abs(startHandle.y - endHandle.y),
  };
}

/**
 *
 * @param {EventData.Context} context
 * @param {{categoryName: string}}
 * @param {Array<string>} [options={}]
 * @returns {Array<string>}
 */

// eslint-disable-next-line no-unused-vars
function _createTextBoxContent(context, { categoryName }, options = {}) {
  const textLines = [];
  textLines.push(categoryName);
  return textLines;
}

/**
 *
 * @param {{x: number, y: number}} startHandle
 * @param {{x: number, y: number}} endHandle
 * @returns {Array<{x: number, y: number}>}
 */

// eslint-disable-next-line no-unused-vars
function _findTextBoxAnchorPoints(startHandle, endHandle) {
  const { left, top, width, height } = _getRectangleImageCoordinates(
    startHandle,
    endHandle,
  );

  return [
    {
      // Top middle point of rectangle
      x: left + width / 2,
      y: top,
    },
    {
      // Left middle point of rectangle
      x: left,
      y: top + height / 2,
    },
    {
      // Bottom middle point of rectangle
      x: left + width / 2,
      y: top + height,
    },
    {
      // Right middle point of rectangle
      x: left + width,
      y: top + height / 2,
    },
  ];
}
