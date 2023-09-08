import { Component, OnInit } from '@angular/core';
import { CornerstoneDirective } from '../directives/cornerstone.directive';
import { CornerstoneService } from '../services/cornerstone.service';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { FilePayload } from '../../../shared/models/file-models';
import { FileParserService } from '../services/file-parser/file-parser.service';
import { IonicModule } from '@ionic/angular';
import { KeyValuePipe, NgForOf, NgIf, NgStyle } from '@angular/common';
import { of } from 'rxjs';
import { ViewportsMap } from '../../models/viewport';
import { Detection } from '../../models/detection';

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true,
  imports: [
    CornerstoneDirective,
    IonicModule,
    NgIf,
    NgForOf,
    KeyValuePipe,
    NgStyle,
  ],
})
export class CsCanvasComponent implements OnInit {
  viewportsData: ViewportsMap = {
    top: { imageData: null, detectionData: [] },
    side: { imageData: null, detectionData: [] },
  };
  protected readonly of = of;
  protected readonly Object = Object;

  constructor(
    private csService: CornerstoneService,
    private fileService: FileService,
    private fileParserService: FileParserService,
    private settingsService: SettingsService,
  ) {}

  public getImageData(): (keyof ViewportsMap)[] {
    return Object.keys(this.viewportsData) as (keyof ViewportsMap)[];
  }

  ngOnInit() {
    this.fileService.getCurrentFile().subscribe((currentFile: FilePayload) => {
      console.log('-------------------Current File-------------------------');
      console.log(currentFile);
      console.log('--------------------------------------------------------');
      this.fileParserService.loadData(currentFile.file).then((parsedFile) => {
        console.log('-------------------Parsed File--------------------------');
        console.log(parsedFile);
        console.log('--------------------------------------------------------');

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
              .map<Detection>((detection) => ({
                ...detection,
                // TODO: set these values to something that makes sense
                selected: false,
                categorySelected: false,
                visible: true,
                id: '',
                isCrowd: 0,
                color: 'orange',
                categoryName: detection.className,
              }));
            this.viewportsData[viewpoint] = {
              imageData,
              detectionData,
            };
          });
        });
      });
    });
  }

  handleChangeImage(next = true) {
    this.fileService.requestNextFile(next);
  }
}
