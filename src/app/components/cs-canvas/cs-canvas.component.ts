import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CornerstoneDirective } from '../../directives/cornerstone.directive';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
import { FileService } from '../../services/file/file.service';
import { FilePayload } from '../../../../shared/models/file-models';
import { FileParserService } from '../../services/file-parser/file-parser.service';
import { IonicModule } from '@ionic/angular';
import { KeyValuePipe, NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { DetectionToolboxFabComponent } from '../detection-toolbox-fab/detection-toolbox-fab.component';
import { ViewportsMap } from '../../../models/viewport';
import { DetectionsService } from '../../services/detections/detections.service';
import { Detection, RawDetection } from '../../../models/detection';
import { CornerstoneMode, ToolNames } from '../../../enums/cornerstone';
import { cornerstoneTools } from '../../csSetup';
import BoundingBoxDrawingTool from '../../utilities/cornerstone-tools/BoundingBoxDrawingTool';
import PolygonDrawingTool from '../../utilities/cornerstone-tools/PolygonDrawingTool';
import { UiService } from '../../services/ui/ui.service';
import { resizeCornerstoneViewports } from '../../utilities/cornerstone.utilities';
import { DetectionContextMenuComponent } from '../detection-context-menu/detection-context-menu.component';
import { AlgorithmInfoComponent } from '../algorithm-info/algorithm-info.component';
import AnnotationMovementTool from '../../utilities/cornerstone-tools/AnnotationMovementTool';
import { generateDetectionColor } from '../../utilities/detection.utilities';
import { ImageStatus } from '../../services/ui/model/enum';

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true,
  imports: [
    CornerstoneDirective,
    DetectionToolboxFabComponent,
    IonicModule,
    NgIf,
    NgForOf,
    KeyValuePipe,
    NgStyle,
    NgClass,
    DetectionContextMenuComponent,
    AlgorithmInfoComponent,
  ],
})
export class CsCanvasComponent implements OnInit, AfterViewInit {
  public isSideMenuOpen: boolean = false;
  viewportsData: ViewportsMap = {
    top: { imageData: null, detectionData: [] },
    side: { imageData: null, detectionData: [] },
  };
  isAnnotating: boolean = false;
  isVisible: boolean = false;

  constructor(
    private csService: CornerstoneService,
    private fileService: FileService,
    private fileParserService: FileParserService,
    private detectionsService: DetectionsService,
    private uiService: UiService,
  ) {
    this.csService.getCsConfiguration().subscribe((csConfig) => {
      this.isAnnotating =
        csConfig.cornerstoneMode === CornerstoneMode.Annotation;
    });
    this.uiService.getIsSideMenuOpen().subscribe((isOpen) => {
      this.isSideMenuOpen = isOpen;
      setTimeout(() => {
        resizeCornerstoneViewports();
      }, 0);
    });
    this.uiService.getImageStatus().subscribe((status) => {
      this.isVisible = status !== ImageStatus.NoImage;
    });
  }

  public getImageData(): (keyof ViewportsMap)[] {
    return Object.keys(this.viewportsData) as (keyof ViewportsMap)[];
  }

  ngOnInit() {
    this.detectionsService.getDetectionData().subscribe((detectionsMap) => {
      this.viewportsData.top.detectionData = detectionsMap.top;
      this.viewportsData.side.detectionData = detectionsMap.side;
    });
    this.fileService
      .getCurrentFile()
      .subscribe((currentFile: FilePayload | null) => {
        if (!currentFile) {
          return;
        }
        this.fileParserService.loadData(currentFile.file).then((parsedFile) => {
          if (parsedFile.algorithms) {
            this.detectionsService.setAlgorithms(parsedFile.algorithms);
          }

          this.fileService.setPixelData(parsedFile.pixelDataList);
          Object.keys(this.viewportsData).forEach((key): void => {
            const viewpoint = key as keyof ViewportsMap;
            const pixelData = parsedFile.pixelDataList.find(
              (img) => img.viewpoint === key,
            );
            if (!pixelData) {
              this.viewportsData[viewpoint].imageData = null;
              this.viewportsData[viewpoint].detectionData = [];
              return;
            }

            this.csService.getImageData(pixelData).subscribe((imageData) => {
              const detectionData = parsedFile.detectionData
                .filter((detect) => detect.viewpoint === viewpoint)
                .map(this.getDetection);
              this.viewportsData[viewpoint] = {
                imageData,
                detectionData: [],
              };
              this.detectionsService.setDetectionData({
                [viewpoint]: detectionData,
              });
              this.uiService.setImageStatus(ImageStatus.HasImage);
            });
          });
        });
      });
  }

  handleChangeImage() {
    // return this.uiService.getImageStatus() === ImageStatus.HasImage;
  }

  ngAfterViewInit(): void {
    const PanTool = cornerstoneTools.PanTool;
    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.setToolActive(ToolNames.Pan, { mouseButtonMask: 1 });

    const ZoomMouseWheelTool = cornerstoneTools.ZoomMouseWheelTool;
    cornerstoneTools.addTool(ZoomMouseWheelTool);
    cornerstoneTools.setToolActive(ToolNames.ZoomMouseWheel, {});

    const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool;
    cornerstoneTools.addTool(ZoomTouchPinchTool);
    cornerstoneTools.setToolActive(ToolNames.ZoomTouchPinch, {
      mouseButtonMask: 1,
    });

    cornerstoneTools.addTool(BoundingBoxDrawingTool);
    cornerstoneTools.addTool(PolygonDrawingTool);
    cornerstoneTools.addTool(AnnotationMovementTool);
  }

  /**
   * Converts a raw detection to a detection for the application to use
   */
  private getDetection(rawDetection: RawDetection): Detection {
    return {
      ...rawDetection,
      // TODO: set these values to something that makes sense
      selected: false,
      categorySelected: false,
      visible: true,
      id: '',
      iscrowd: 0,
      color: generateDetectionColor(rawDetection.className),
      categoryName: rawDetection.className,
    };
  }

  protected readonly ImageStatus = ImageStatus;
}
