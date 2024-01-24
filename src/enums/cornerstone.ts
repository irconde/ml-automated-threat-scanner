export enum ToolNames {
  BoundingBox = 'BoundingBoxDrawing',
  Polygon = 'PolygonDrawingTool',
  Movement = 'AnnotationMovementTool',
  Pan = 'Pan',
  ZoomMouseWheel = 'ZoomMouseWheel',
  ZoomTouchPinch = 'ZoomTouchPinch',
}

export enum CornerstoneMode {
  Selection = 'selection',
  Annotation = 'annotation',
  Edition = 'edition',
}

export enum DetectionType {
  Bounding = 'bounding',
  Binary = 'binary',
  Polygon = 'polygon',
  NoTool = 'none',
}

export enum AnnotationMode {
  Bounding = 'bounding',
  Polygon = 'polygon',
  NoTool = 'none',
}

export enum EditionMode {
  Label = 'label',
  Bounding = 'bounding',
  Move = 'movement',
  Polygon = 'polygon',
  Delete = 'delete',
  NoTool = 'none',
  Color = 'color',
}

export enum CommonDetections {
  Unknown = 'unknown',
  Operator = 'OPERATOR',
}

export const CS_EVENTS = {
  RENDER: 'cornerstoneimagerendered',
  CLICK: 'cornerstonetoolsmouseclick',
  POLYGON_MASK_CREATED: 'polygon_mask_created',
  POLYGON_MASK_MODIFIED: 'polygon_mask_modified',
  POLYGON_RENDER: 'cornerstonetoolsmousedrag',
} as const;
