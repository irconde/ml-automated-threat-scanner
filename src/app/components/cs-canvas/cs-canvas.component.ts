import { Component, OnInit } from '@angular/core';
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
import { CornerstoneMode } from '../../../enums/cornerstone';

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
  ],
})
export class CsCanvasComponent implements OnInit {
  viewportsData: ViewportsMap = {
    top: { imageData: null, detectionData: [] },
    side: { imageData: null, detectionData: [] },
  };
  isAnnotating: boolean = false;

  constructor(
    private csService: CornerstoneService,
    private fileService: FileService,
    private fileParserService: FileParserService,
    private detectionsService: DetectionsService,
  ) {
    this.csService.getCsConfiguration().subscribe((csConfig) => {
      this.isAnnotating =
        csConfig.cornerstoneMode === CornerstoneMode.Annotation;
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
        console.log('-------------------Current File-------------------------');
        console.log(currentFile);
        console.log('--------------------------------------------------------');
        if (!currentFile) return;
        this.fileParserService.loadData(currentFile.file).then((parsedFile) => {
          console.log(
            '-------------------Parsed File--------------------------',
          );
          console.log(parsedFile);
          console.log(
            '--------------------------------------------------------',
          );

          Object.keys(this.viewportsData).forEach((key): void => {
            const viewpoint = key as keyof ViewportsMap;
            const pixelData = parsedFile.imageData.find(
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
            });
          });
        });
      });
  }

  handleChangeImage(next = true) {
    this.fileService.requestNextFile(next);
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
      color: 'orange',
      categoryName: rawDetection.className,
    };
  }
}
