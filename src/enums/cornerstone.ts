export enum ToolNames {
  BoundingBox = 'BoundingBoxDrawing',
  Segmentation = 'SegmentationDrawingTool',
  AnnotationMovement = 'AnnotationMovementTool',
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
  Unknown = 'Unknown',
}

export const CS_EVENTS = {
  RENDER: 'cornerstoneimagerendered',
  CLICK: 'cornerstonetoolsmouseclick',
} as const;
