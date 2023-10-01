import csTools from 'eac-cornerstone-tools';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import {CS_EVENTS, ToolNames} from "../../../enums/cornerstone";
import {DETECTION_STYLE} from "../../../enums/detection-styles";
import {renderPolygonMasks} from "../detection.utilities";
const drawHandles = csTools.importInternal('drawing/drawHandles');
const BaseAnnotationTool = csTools.importInternal('base/BaseAnnotationTool');
const getNewContext = csTools.importInternal('drawing/getNewContext');
const draw = csTools.importInternal('drawing/draw');
const drawJoinedLines = csTools.importInternal('drawing/drawJoinedLines');
const freehandUtils = csTools.importInternal('util/freehandUtils');
const triggerEvent = csTools.importInternal('util/triggerEvent');
const moveHandleNearImagePoint = csTools.importInternal(
    'manipulators/moveHandleNearImagePoint'
);
const state = csTools.importInternal('store/state');
const clipToBox = csTools.importInternal('util/clipToBox');
const EVENTS = csTools.importInternal('constants/events');

const { freehandArea, freehandIntersect, FreehandHandleData } = freehandUtils;

/**
 * @public
 * @class SegmentationDrawingTool
 * @memberof Tools.Annotation
 * @classdesc Tool for drawing arbitrary Segmentation regions of interest, and
 * measuring the statistics of the enclosed pixels.
 * @extends Tools.Base.BaseAnnotationTool
 */
export default class SegmentationDrawingTool extends BaseAnnotationTool {
    constructor(props = {}) {
        const defaultProps = {
            name: ToolNames.Segmentation,
            supportedInteractionTypes: ['Mouse', 'Touch'],
            configuration: defaultFreehandConfiguration(),
        };
        super(props, defaultProps);
        this.isMultiPartTool = true;
        this._drawing = false;
        this._dragging = false;
        this._modifying = false;

        // Create bound callback functions for private event loops
        this._drawingMouseDownCallback =
            this._drawingMouseDownCallback.bind(this);
        this._drawingMouseMoveCallback =
            this._drawingMouseMoveCallback.bind(this);
        this._drawingMouseUpCallback = this._drawingMouseUpCallback.bind(this);
        this._drawingMouseDoubleClickCallback =
            this._drawingMouseDoubleClickCallback.bind(this);
        this._editMouseUpCallback = this._editMouseUpCallback.bind(this);
        this._editMouseDragCallback = this._editMouseDragCallback.bind(this);

        this._drawingTouchStartCallback =
            this._drawingTouchStartCallback.bind(this);
        this._drawingDoubleTapClickCallback =
            this._drawingDoubleTapClickCallback.bind(this);
        this._editTouchDragCallback = this._editTouchDragCallback.bind(this);
    }

    createNewMeasurement(eventData) {
        const goodEventData =
            eventData &&
            eventData.currentPoints &&
            eventData.currentPoints.image;

        if (!goodEventData) {
            console.log(
                `required eventData not supplied to tool ${this.name}'s createNewMeasurement`
            );
            return;
        }
        const measurementData = {
            visible: true,
            active: true,
            invalidated: true,
            color: undefined,
            handles: {
                points: [],
            },
        };
        measurementData.handles.textBox = {
            active: false,
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true,
        };
        return measurementData;
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
    pointNearTool(element, data, coords) {
        const validParameters = data && data.handles && data.handles.points;

        if (!validParameters) {
            throw new Error(
                `invalid parameters supplied to tool ${this.name}'s pointNearTool`
            );
        }
        if (!validParameters || data.visible === false) {
            return false;
        }
        const isPointNearTool = this._pointNearHandle(element, data, coords);
        if (isPointNearTool !== undefined) {
            return true;
        }
        return false;
    }

    /**
     * @param {{handles: {points: Array<number>}}} data HTML Element where mouse is over
     * @param {Array<number>} coords 2D point defined as a pair of coordinates (x,y)
     * @returns {number} the distance in px from the provided coordinates to the
     * closest rendered portion of the annotation. -1 if the distance cannot be
     * calculated.
     */
    distanceFromPoint(element, data, coords) {
        let distance = Infinity;
        for (let i = 0; i < data.handles.points.length; i++) {
            const distanceI = cornerstoneMath.point.distance(
                data.handles.points[i],
                coords
            );

            distance = Math.min(distance, distanceI);
        }
        // If an error caused distance not to be calculated, return -1.
        if (distance === Infinity) {
            return -1;
        }
        return distance;
    }

    /**
     * @param {Object} image image
     * @param {Object} data data
     */
    updateCachedStats(image, element, data) {
        const points = data.handles.points;
        // If the data has been invalidated, and the tool is not currently active,
        // We need to calculate it again.

        // Retrieve the bounds of the ROI in image coordinates
        const bounds = {
            left: points[0].x,
            right: points[0].x,
            bottom: points[0].y,
            top: points[0].x,
        };

        for (let i = 0; i < points.length; i++) {
            bounds.left = Math.min(bounds.left, points[i].x);
            bounds.right = Math.max(bounds.right, points[i].x);
            bounds.bottom = Math.min(bounds.bottom, points[i].y);
            bounds.top = Math.max(bounds.top, points[i].y);
        }

        const polyBoundingBox = {
            left: bounds.left,
            top: bounds.bottom,
            width: Math.abs(bounds.right - bounds.left),
            height: Math.abs(bounds.top - bounds.bottom),
        };

        // Store the bounding box information for the text box
        data.polyBoundingBox = polyBoundingBox;

        // Retrieve the pixel spacing values, and if they are not
        // Real non-zero values, set them to 1
        const columnPixelSpacing = image.columnPixelSpacing || 1;
        const rowPixelSpacing = image.rowPixelSpacing || 1;
        const scaling = columnPixelSpacing * rowPixelSpacing;

        const area = freehandArea(data.handles.points, scaling);

        // If the area value is sane, store it for later retrieval
        if (!isNaN(area)) {
            data.area = area;
        }

        // Set the invalidated flag to false so that this data won't automatically be recalculated
        data.invalidated = false;
    }

    /**
     * Method that overrides the original abstract method in the cornerstone-tools library
     * Automatically invoked to render all the widgets that comprise a detection
     * @param {*} evt Event object containing necessary event/canvas data
     */
    renderToolData(evt) {
        const eventData = evt.detail;
        // If we have no toolState for this element, return immediately as there is nothing to do
        const toolState = csTools.getToolState(evt.currentTarget, this.name);
        if (!toolState) {
            return;
        }
        const { image, element } = eventData;
        const config = this.configuration;

        // We have tool data for this element - iterate over each one and draw it
        const context = getNewContext(eventData.canvasContext.canvas);
        const { renderDashed } = config;
        const lineDash = csTools.getModule('globalConfiguration').configuration
            .lineDash;

        for (let i = 0; i < toolState.data.length; i++) {
            const data = toolState.data[i];
            if (data.visible === false) {
                continue;
            }
            draw(context, (context) => {
                let color = DETECTION_STYLE.NORMAL_COLOR;
                let fillColor;
                if (data.active) {
                    if (data.handles.invalidHandlePlacement) {
                        color = config.invalidColor;
                        fillColor = config.invalidColor;
                    } else {
                        color = DETECTION_STYLE.NORMAL_COLOR;
                        fillColor = DETECTION_STYLE.NORMAL_COLOR;
                    }
                } else {
                    fillColor = DETECTION_STYLE.NORMAL_COLOR;
                }

                let options = { color };

                if (renderDashed) {
                    options.lineDash = lineDash;
                }

                if (data.handles.points.length) {
                    const points = data.handles.points;
                    drawJoinedLines(
                        context,
                        element,
                        points[0],
                        points,
                        options
                    );
                    if (data.polyBoundingBox) {
                        drawJoinedLines(
                            context,
                            element,
                            points[points.length - 1],
                            [points[0]],
                            options
                        );
                    } else {
                        if (data.updatingAnnotation) {
                            drawJoinedLines(
                                context,
                                element,
                                points[points.length - 1],
                                points,
                                options
                            );
                        } else {
                            drawJoinedLines(
                                context,
                                element,
                                points[points.length - 1],
                                [config.mouseLocation.handles.start],
                                options
                            );
                        }
                    }
                }

                // Draw handles
                options = {
                    color,
                    fill: fillColor,
                };
                if (
                    config.alwaysShowHandles ||
                    (data.active && data.polyBoundingBox) ||
                    data.updatingAnnotation
                ) {
                    // Render all handles
                    options.handleRadius = config.activeHandleRadius;

                    if (this.configuration.drawHandles) {
                        drawHandles(
                            context,
                            eventData,
                            data.handles.points,
                            options
                        );
                    }
                }
                if (data.canComplete) {
                    // Draw large handle at the origin if can complete drawing
                    options.handleRadius = config.completeHandleRadius;
                    const handle = data.handles.points[0];
                    if (this.configuration.drawHandles) {
                        drawHandles(context, eventData, [handle], options);
                    }
                }
                if (data.active && !data.polyBoundingBox) {
                    // Draw handle at origin and at mouse if actively drawing
                    options.handleRadius = config.activeHandleRadius;
                    if (this.configuration.drawHandles) {
                        drawHandles(
                            context,
                            eventData,
                            config.mouseLocation.handles,
                            options
                        );
                    }

                    const firstHandle = data.handles.points[0];

                    if (this.configuration.drawHandles) {
                        drawHandles(context, eventData, [firstHandle], options);
                    }
                }
                // Invoked when a closed Segmentation is created
                if (data.invalidated === true && !data.active) {
                    this.updateCachedStats(image, element, data);
                }

                if (data.updatingAnnotation) {
                    let segmentationCoords = [];
                    for (let i = 0; i < data.handles.points.length; i++) {
                        const point = cornerstone.pixelToCanvas(element, {
                            x: data.handles.points[i].x,
                            y: data.handles.points[i].y,
                        });
                        segmentationCoords.push(point);
                    }
                    context.strokeStyle =
                        DETECTION_STYLE.SELECTED_COLOR;
                    context.fillStyle =
                        DETECTION_STYLE.SELECTED_COLOR;
                    context.globalAlpha = 0.5;
                    if (segmentationCoords !== undefined)
                        renderPolygonMasks(context, segmentationCoords);
                    context.globalAlpha = 1.0;
                }
            });
        }
    }

    addNewMeasurement(evt) {
        const eventData = evt.detail;
        if (this._options.updatingAnnotation === false) {
            this._startDrawing(evt);
            this._addPoint(eventData);
            preventPropagation(evt);
        } else {
            return;
        }
    }

    handleSelectedCallback(evt, toolData, handle, interactionType = 'mouse') {
        const { element } = evt.detail;
        const toolState = csTools.getToolState(element, this.name);
        if (handle.hasBoundingBox) {
            // Use default move handler.
            moveHandleNearImagePoint(
                evt,
                this,
                toolData,
                handle,
                interactionType
            );
            return;
        }
        const config = this.configuration;
        config.dragOrigin = {
            x: handle.x,
            y: handle.y,
        };
        // Iterating over handles of all toolData instances to find the indices of the selected handle
        for (
            let toolIndex = 0;
            toolIndex < toolState.data.length;
            toolIndex++
        ) {
            const points = toolState.data[toolIndex].handles.points;
            for (let p = 0; p < points.length; p++) {
                if (points[p] === handle) {
                    config.currentHandle = p;
                    config.currentTool = toolIndex;
                }
            }
        }
        this._modifying = true;
        this._activateModify(element);
        // Interrupt eventDispatchers
        preventPropagation(evt);
    }

    /**
     * Event handler for MOUSE_DOWN during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingMouseDownCallback(evt) {
        const eventData = evt.detail;
        const { buttons, currentPoints, element } = eventData;

        if (!this.options.mouseButtonMask.includes(buttons)) {
            return;
        }

        const coords = currentPoints.canvas;
        const config = this.configuration;
        const currentTool = config.currentTool;
        const toolState = csTools.getToolState(element, this.name);
        const data = toolState.data[currentTool];

        const handleNearby = this._pointNearHandle(element, data, coords);

        if (!freehandIntersect.end(data.handles.points) && data.canComplete) {
            const lastHandlePlaced = config.currentHandle;
            this._endDrawing(element, lastHandlePlaced);
        } else if (handleNearby === undefined) {
            this._addPoint(eventData);
        }
        preventPropagation(evt);
        return;
    }

    /**
     * Ends the active drawing loop and completes the Segmentation.
     *
     * @private
     * @param {Object} element - The element on which the roi is being drawn.
     * @param {Object} handleNearby - the handle nearest to the mouse cursor.
     * @returns {undefined}
     */
    _endDrawing(element, handleNearby) {
        const toolState = csTools.getToolState(element, this.name);
        const config = this.configuration;
        const data = toolState.data[config.currentTool];
        if (data === undefined) return;
        data.active = false;
        data.highlight = false;
        data.handles.invalidHandlePlacement = false;

        // Connect the end handle to the origin handle
        if (handleNearby !== undefined) {
            const points = data.handles.points;
            points[config.currentHandle - 1].lines.push(points[0]);
        }

        if (this._modifying) {
            this._modifying = false;
            data.invalidated = true;
        }

        // Reset the current handle
        config.currentHandle = 0;
        config.currentTool = -1;
        data.canComplete = false;

        if (this._drawing) {
            this._deactivateDraw(element);
        }

        this.fireModifiedEvent(element, data);
        this.fireCompletedEvent(element, data);
    }

    /**
     * Returns a handle of a particular tool if it is close to the mouse cursor
     *
     * @private
     * @param {Object} element - The element on which the roi is being drawn.
     * @param {Object} data      Data object associated with the tool.
     * @param {*} coords
     * @returns {number|Object|boolean}
     */
    _pointNearHandle(element, data, coords) {
        if (data === undefined) return;
        if (data.handles === undefined || data.handles.points === undefined) {
            return;
        }

        if (data.visible === false) {
            return;
        }

        for (let i = 0; i < data.handles.points.length; i++) {
            const handleCanvas = cornerstone.pixelToCanvas(
                element,
                data.handles.points[i]
            );

            if (cornerstoneMath.point.distance(handleCanvas, coords) < 6) {
                return i;
            }
        }
    }

    /**
     * Fire MEASUREMENT_MODIFIED event on provided element
     * @param {any} element which freehand data has been modified
     * @param {any} measurementData the measurement data
     * @returns {void}
     */
    fireModifiedEvent(element, measurementData) {
        const eventType = CS_EVENTS.POLYGON_MASK_MODIFIED;
        const eventData = {
            toolName: this.name,
            toolType: this.name, // Deprecation notice: toolType will be replaced by toolName
            element,
            measurementData,
        };
        triggerEvent(element, eventType, eventData);
    }

    fireCompletedEvent(element, measurementData) {
        const eventType = CS_EVENTS.POLYGON_MASK_CREATED;
        const eventData = {
            toolName: this.name,
            toolType: this.name, // Deprecation notice: toolType will be replaced by toolName
            element,
            measurementData,
        };
        triggerEvent(element, eventType, eventData);
    }

    /**
     * Removes drawing loop event listeners.
     *
     * @private
     * @param {Object} element - The viewport element to remove event listeners from.
     * @modifies {element}
     * @returns {undefined}
     */
    _deactivateDraw(element) {
        this._drawing = false;
        state.isMultiPartToolActive = false;
        this._drawingInteractionType = null;

        element.removeEventListener(
            EVENTS.MOUSE_DOWN,
            this._drawingMouseDownCallback
        );
        element.removeEventListener(
            EVENTS.MOUSE_MOVE,
            this._drawingMouseMoveCallback
        );
        element.removeEventListener(
            EVENTS.MOUSE_DOUBLE_CLICK,
            this._drawingMouseDoubleClickCallback
        );
        element.removeEventListener(
            EVENTS.MOUSE_UP,
            this._drawingMouseUpCallback
        );
        // Touch
        element.removeEventListener(
            EVENTS.TOUCH_START,
            this._drawingTouchStartCallback
        );
        element.removeEventListener(
            EVENTS.TOUCH_DRAG,
            this._drawingTouchDragCallback
        );
        element.removeEventListener(
            EVENTS.TOUCH_START,
            this._drawingMouseMoveCallback
        );
        element.removeEventListener(
            EVENTS.TOUCH_END,
            this._drawingMouseUpCallback
        );
        cornerstone.updateImage(element);
    }

    /**
     * Adds modify loop event listeners.
     *
     * @private
     * @param {Object} element - The viewport element to add event listeners to.
     * @modifies {element}
     * @returns {undefined}
     */
    _activateModify(element) {
        state.isToolLocked = true;
        element.addEventListener(EVENTS.MOUSE_UP, this._editMouseUpCallback);
        element.addEventListener(
            EVENTS.MOUSE_DRAG,
            this._editMouseDragCallback
        );
        element.addEventListener(EVENTS.MOUSE_CLICK, this._editMouseUpCallback);
        element.addEventListener(EVENTS.TOUCH_END, this._editMouseUpCallback);
        element.addEventListener(
            EVENTS.TOUCH_DRAG,
            this._editTouchDragCallback
        );
        cornerstone.updateImage(element);
    }

    /**
     * Removes modify loop event listeners.
     *
     * @private
     * @param {Object} element - The viewport element to remove event listeners from.
     * @modifies {element}
     * @returns {undefined}
     */
    _deactivateModify(element) {
        state.isToolLocked = false;
        element.removeEventListener(EVENTS.MOUSE_UP, this._editMouseUpCallback);
        element.removeEventListener(
            EVENTS.MOUSE_DRAG,
            this._editMouseDragCallback
        );
        element.removeEventListener(
            EVENTS.MOUSE_CLICK,
            this._editMouseUpCallback
        );
        element.removeEventListener(
            EVENTS.TOUCH_END,
            this._editMouseUpCallback
        );
        element.removeEventListener(
            EVENTS.TOUCH_DRAG,
            this._editTouchDragCallback
        );
        cornerstone.updateImage(element);
    }

    passiveCallback(element) {
        this._closeToolIfDrawing(element);
    }

    enabledCallback(element) {
        this._closeToolIfDrawing(element);
    }

    disabledCallback(element) {
        this._closeToolIfDrawing(element);
    }

    _closeToolIfDrawing(element) {
        if (this._drawing) {
            // Actively drawing but changed mode.
            const config = this.configuration;
            const lastHandlePlaced = config.currentHandle;

            this._endDrawing(element, lastHandlePlaced);
            cornerstone.updateImage(element);
        }
    }

    /**
     * Adds a point on mouse click in Segmentation mode.
     *
     * @private
     * @param {Object} eventData - data object associated with an event.
     * @returns {undefined}
     */
    _addPoint(eventData) {
        const { currentPoints, element } = eventData;
        const toolState = csTools.getToolState(element, this.name);

        // Get the toolState from the last-drawn Segmentation
        const config = this.configuration;
        const data = toolState.data[config.currentTool];

        if (data.handles.invalidHandlePlacement) {
            return;
        }

        const newHandleData = new FreehandHandleData(currentPoints.image);

        // If this is not the first handle
        if (data.handles.points.length) {
            // Add the line from the current handle to the new handle
            data.handles.points[config.currentHandle - 1].lines.push(
                currentPoints.image
            );
        }

        // Add the new handle
        data.handles.points.push(newHandleData);
        // Increment the current handle value
        config.currentHandle += 1;
        // Force onImageRendered to fire
        cornerstone.updateImage(element);
        this.fireModifiedEvent(element, data);
    }

    /**
     * Event handler for MOUSE_MOVE during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingMouseMoveCallback(evt) {
        const eventData = evt.detail;
        const { currentPoints, element } = eventData;
        const toolState = csTools.getToolState(element, this.name);
        const config = this.configuration;
        const currentTool = config.currentTool;
        const data = toolState.data[currentTool];
        if (data === undefined) return;
        const coords = currentPoints.canvas;

        // Set the mouseLocation handle
        this._getMouseLocation(eventData);
        this._checkInvalidHandleLocation(data, eventData);

        // Mouse move -> Segmentation Mode
        const handleNearby = this._pointNearHandle(element, data, coords);
        const points = data.handles.points;
        // If there is a handle nearby to snap to
        // (and it's not the actual mouse handle)
        if (
            handleNearby !== undefined &&
            !handleNearby.hasBoundingBox &&
            handleNearby < points.length - 1
        ) {
            config.mouseLocation.handles.start.x = points[handleNearby].x;
            config.mouseLocation.handles.start.y = points[handleNearby].y;
        }
        // Force onImageRendered
        cornerstone.updateImage(element);
    }

    /**
     * Gets the current mouse location and stores it in the configuration object.
     *
     * @private
     * @param {Object} eventData The data associated with the event.
     * @returns {undefined}
     */
    _getMouseLocation(eventData) {
        const { currentPoints, image } = eventData;
        // Set the mouseLocation handle
        const config = this.configuration;
        config.mouseLocation.handles.start.x = currentPoints.image.x;
        config.mouseLocation.handles.start.y = currentPoints.image.y;
        clipToBox(config.mouseLocation.handles.start, image);
    }

    /**
     * Event handler for MOUSE_UP during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingMouseUpCallback(evt) {
        const { element } = evt.detail;

        if (!this._dragging) {
            return;
        }

        this._dragging = false;

        const config = this.configuration;
        const currentTool = config.currentTool;
        const toolState = csTools.getToolState(element, this.name);
        const data = toolState.data[currentTool];

        if (!freehandIntersect.end(data.handles.points) && data.canComplete) {
            const lastHandlePlaced = config.currentHandle;

            this._endDrawing(element, lastHandlePlaced);
        }

        preventPropagation(evt);

        return;
    }

    /**
     * Event handler for MOUSE_DOUBLE_CLICK during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingMouseDoubleClickCallback(evt) {
        const { element } = evt.detail;
        this.completeDrawing(element);
        preventPropagation(evt);
    }

    /** Ends the active drawing loop and completes the Segmentation.
     *
     * @public
     * @param {Object} element - The element on which the roi is being drawn.
     * @returns {null}
     */
    completeDrawing(element) {
        if (!this._drawing) {
            return;
        }
        const toolState = csTools.getToolState(element, this.name);
        const config = this.configuration;
        const data = toolState.data[config.currentTool];

        if (
            !freehandIntersect.end(data.handles.points) &&
            data.handles.points.length >= 2
        ) {
            const lastHandlePlaced = config.currentHandle;

            data.polyBoundingBox = {};
            this._endDrawing(element, lastHandlePlaced);
        }
    }

    /**
     * Event handler for MOUSE_UP during handle drag event loop.
     *
     * @private
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _editMouseUpCallback(evt) {
        const eventData = evt.detail;
        const { element } = eventData;
        const toolState = csTools.getToolState(element, this.name);
        this._deactivateModify(element);
        if (toolState.data.length === 0) return;
        this._dropHandle(eventData, toolState);
        this._endDrawing(element);
        cornerstone.updateImage(element);
    }

    /**
     * Places a handle of the freehand tool if the new location is valid.
     * If the new location is invalid the handle snaps back to its previous position.
     *
     * @private
     * @param {Object} eventData - Data object associated with the event.
     * @param {Object} toolState - The data associated with the freehand tool.
     * @modifies {toolState}
     * @returns {undefined}
     */
    _dropHandle(eventData, toolState) {
        const config = this.configuration;
        const currentTool = config.currentTool;
        const handles = toolState.data[currentTool].handles;
        const points = handles.points;

        // Don't allow the line being modified to intersect other lines
        if (handles.invalidHandlePlacement) {
            const currentHandle = config.currentHandle;
            const currentHandleData = points[currentHandle];
            let previousHandleData;

            if (currentHandle === 0) {
                const lastHandleID = points.length - 1;

                previousHandleData = points[lastHandleID];
            } else {
                previousHandleData = points[currentHandle - 1];
            }

            // Snap back to previous position
            currentHandleData.x = config.dragOrigin.x;
            currentHandleData.y = config.dragOrigin.y;
            previousHandleData.lines[0] = currentHandleData;

            handles.invalidHandlePlacement = false;
        }
    }

    /**
     * Beginning of drawing loop when tool is active and a click event happens far
     * from existing handles.
     *
     * @private
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _startDrawing(evt) {
        const eventData = evt.detail;
        const measurementData = this.createNewMeasurement(eventData);
        const { element } = eventData;
        const config = this.configuration;
        let interactionType;

        if (evt.type === EVENTS.MOUSE_DOWN_ACTIVATE) {
            interactionType = 'Mouse';
        } else if (evt.type === EVENTS.TOUCH_START_ACTIVE) {
            interactionType = 'Touch';
        }
        this._activateDraw(element, interactionType);
        this._getMouseLocation(eventData);

        csTools.addToolState(element, this.name, measurementData);

        const toolState = csTools.getToolState(element, this.name);

        config.currentTool = toolState.data.length - 1;
    }

    /**
     * Event handler for MOUSE_DRAG during handle drag event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _editMouseDragCallback(evt) {
        const eventData = evt.detail;
        const { element, buttons } = eventData;

        if (!this.options.mouseButtonMask.includes(buttons)) {
            return;
        }

        const toolState = csTools.getToolState(element, this.name);

        const config = this.configuration;
        const data = toolState.data[config.currentTool];
        const currentHandle = config.currentHandle;
        const points = data.handles.points;
        let handleIndex = -1;

        // Set the mouseLocation handle
        this._getMouseLocation(eventData);

        data.handles.invalidHandlePlacement = freehandIntersect.modify(
            points,
            currentHandle
        );
        data.active = true;
        data.highlight = true;
        let newPoint = {
            x: config.mouseLocation.handles.start.x,
            y: config.mouseLocation.handles.start.y,
        };
        points[currentHandle] = newPoint;

        handleIndex = this._getPrevHandleIndex(currentHandle, points);

        if (currentHandle >= 0) {
            if (points[handleIndex].lines === undefined) return;
            const lastLineIndex = points[handleIndex].lines.length - 1;
            const lastLine = points[handleIndex].lines[lastLineIndex];

            lastLine.x = config.mouseLocation.handles.start.x;
            lastLine.y = config.mouseLocation.handles.start.y;
        }

        // Update the image
        cornerstone.updateImage(element);
    }

    /**
     * Event handler for TOUCH_START during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingTouchStartCallback(evt) {
        const eventData = evt.detail;
        const { currentPoints, element } = eventData;

        const coords = currentPoints.canvas;

        const config = this.configuration;
        const currentTool = config.currentTool;
        const toolState = csTools.getToolState(element, this.name);
        const data = toolState.data[currentTool];

        const handleNearby = this._pointNearHandle(element, data, coords);

        if (!freehandIntersect.end(data.handles.points) && data.canComplete) {
            const lastHandlePlaced = config.currentHandle;

            this._endDrawing(element, lastHandlePlaced);
        } else if (handleNearby === undefined) {
            this._addPoint(eventData);
        }
        preventPropagation(evt);
        return;
    }

    /**
     * Event handler for DOUBLE_TAP during drawing event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {undefined}
     */
    _drawingDoubleTapClickCallback(evt) {
        const { element } = evt.detail;
        this.completeDrawing(element);
        preventPropagation(evt);
    }

    /**
     * Compares the distance between two points to this.configuration.spacing.
     *
     * @private
     * @param {Object} element     The element on which the roi is being drawn.
     * @param {Object} p1          The first point, in pixel space.
     * @param {Object} p2          The second point, in pixel space.
     * @param {string} comparison  The comparison to make.
     * @param {number} spacing     The allowed canvas spacing
     * @returns {boolean}           True if the distance is smaller than the
     *                              allowed canvas spacing.
     */
    _compareDistanceToSpacing(
        element,
        p1,
        p2,
        comparison = '>',
        spacing = this.configuration.spacing
    ) {
        if (comparison === '>') {
            return cornerstoneMath.point.distance(p1, p2) > spacing;
        }
        return cornerstoneMath.point.distance(p1, p2) < spacing;
    }

    /**
     * Adds drawing loop event listeners.
     *
     * @private
     * @param {Object} element - The viewport element to add event listeners to.
     * @param {string} interactionType - The interactionType used for the loop.
     * @modifies {element}
     * @returns {undefined}
     */
    _activateDraw(element, interactionType = 'Mouse') {
        this._drawing = true;
        this._drawingInteractionType = interactionType;
        state.isMultiPartToolActive = true;

        // Segmentation Mode
        element.addEventListener(
            EVENTS.MOUSE_DOWN,
            this._drawingMouseDownCallback
        );
        element.addEventListener(
            EVENTS.MOUSE_MOVE,
            this._drawingMouseMoveCallback
        );
        element.addEventListener(
            EVENTS.MOUSE_DOUBLE_CLICK,
            this._drawingMouseDoubleClickCallback
        );

        element.addEventListener(EVENTS.MOUSE_UP, this._drawingMouseUpCallback);

        // Touch
        element.addEventListener(
            EVENTS.TOUCH_START,
            this._drawingMouseMoveCallback
        );
        element.addEventListener(
            EVENTS.TOUCH_START,
            this._drawingTouchStartCallback
        );

        element.addEventListener(
            EVENTS.TOUCH_DRAG,
            this._drawingTouchDragCallback
        );
        element.addEventListener(
            EVENTS.TOUCH_END,
            this._drawingMouseUpCallback
        );
        element.addEventListener(
            EVENTS.DOUBLE_TAP,
            this._drawingDoubleTapClickCallback
        );

        cornerstone.updateImage(element);
    }

    /**
     * Returns true if the proposed location of a new handle is invalid.
     *
     * @private
     * @param {Object} data      Data object associated with the tool.
     * @param {Object} eventData The data associated with the event.
     * @returns {Boolean}
     */
    _checkInvalidHandleLocation(data, eventData) {
        if (data.handles.points.length < 2) {
            return true;
        }
        let invalidHandlePlacement = this._checkHandlesSegmentationMode(
            data,
            eventData
        );
        data.handles.invalidHandlePlacement = invalidHandlePlacement;
    }

    /**
     * Returns true if two points are closer than this.configuration.spacing.
     *
     * @private
     * @param {Object} element     The element on which the roi is being drawn.
     * @param {Object} p1          The first point, in pixel space.
     * @param {Object} p2          The second point, in pixel space.
     * @returns {boolean}            True if the distance is smaller than the
     *                              allowed canvas spacing.
     */
    _isDistanceSmallerThanCompleteSpacingCanvas(element, p1, p2) {
        const p1Canvas = cornerstone.pixelToCanvas(element, p1);
        const p2Canvas = cornerstone.pixelToCanvas(element, p2);
        let completeHandleRadius;
        if (this._drawingInteractionType === 'Mouse') {
            completeHandleRadius = this.configuration.completeHandleRadius;
        } else if (this._drawingInteractionType === 'Touch') {
            completeHandleRadius = this.configuration.completeHandleRadiusTouch;
        }
        return this._compareDistanceToSpacing(
            element,
            p1Canvas,
            p2Canvas,
            '<',
            completeHandleRadius
        );
    }

    /**
     * Returns true if the proposed location of a new handle is invalid (in Segmentation mode).
     *
     * @private
     *
     * @param {Object} data - data object associated with the tool.
     * @param {Object} eventData The data associated with the event.
     * @returns {Boolean}
     */
    _checkHandlesSegmentationMode(data, eventData) {
        const config = this.configuration;
        const { element } = eventData;
        const mousePoint = config.mouseLocation.handles.start;
        const points = data.handles.points;
        let invalidHandlePlacement = false;
        data.canComplete = false;
        const mouseAtOriginHandle =
            this._isDistanceSmallerThanCompleteSpacingCanvas(
                element,
                points[0],
                mousePoint
            );
        if (
            mouseAtOriginHandle &&
            !freehandIntersect.end(points) &&
            points.length > 2
        ) {
            data.canComplete = true;
            invalidHandlePlacement = false;
        } else {
            invalidHandlePlacement = freehandIntersect.newHandle(
                mousePoint,
                points
            );
        }
        return invalidHandlePlacement;
    }

    /**
     * Event handler for TOUCH_DRAG during handle drag event loop.
     *
     * @event
     * @param {Object} evt - The event.
     * @returns {void}
     */
    _editTouchDragCallback(evt) {
        const eventData = evt.detail;
        const { element } = eventData;
        const toolState = csTools.getToolState(element, this.name);
        const config = this.configuration;
        const data = toolState.data[config.currentTool];
        const currentHandle = config.currentHandle;
        const points = data.handles.points;
        let handleIndex = -1;
        // Set the mouseLocation handle
        this._getMouseLocation(eventData);

        data.handles.invalidHandlePlacement = freehandIntersect.modify(
            points,
            currentHandle
        );
        data.active = true;
        data.highlight = true;
        let newPoint = {
            x: config.mouseLocation.handles.start.x,
            y: config.mouseLocation.handles.start.y,
        };
        points[currentHandle] = newPoint;

        handleIndex = this._getPrevHandleIndex(currentHandle, points);

        if (currentHandle >= 0) {
            if (points[handleIndex].lines === undefined) return;
            const lastLineIndex = points[handleIndex].lines.length - 1;
            const lastLine = points[handleIndex].lines[lastLineIndex];

            lastLine.x = config.mouseLocation.handles.start.x;
            lastLine.y = config.mouseLocation.handles.start.y;
        }

        // Update the image
        cornerstone.updateImage(element);
    }

    /**
     * Returns the previous handle to the current one.
     * @param {number} currentHandle - the current handle index
     * @param {Array} points - the handles Array of the freehand data
     * @returns {number} - The index of the previous handle
     */
    _getPrevHandleIndex(currentHandle, points) {
        if (currentHandle === 0) {
            return points.length - 1;
        }
        return currentHandle - 1;
    }
}

function defaultFreehandConfiguration() {
    return {
        mouseLocation: {
            handles: {
                start: {
                    highlight: true,
                    active: true,
                },
            },
        },
        spacing: 1,
        activeHandleRadius: 3,
        completeHandleRadius: 6,
        completeHandleRadiusTouch: 28,
        alwaysShowHandles: false,
        invalidColor: 'crimson',
        currentHandle: 0,
        currentTool: -1,
        drawHandles: true,
        renderDashed: false,
    };
}

function preventPropagation(evt) {
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    evt.preventDefault();
}
