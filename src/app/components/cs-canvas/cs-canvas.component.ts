import { Component, OnInit } from '@angular/core';
import { cornerstone } from '../../csSetup';
import { CornerstoneDirective } from '../../directives/cornerstone.directive';
import { CornerstoneService } from '../../services/cornerstone.service';
import { FileService } from '../../services/file/file.service';
import { SettingsService } from '../../services/settings/settings.service';
import { FilePayload } from '../../../../shared/models/file-models';
import { FileParserService } from '../../services/file-parser/file-parser.service';
import { IonicModule } from '@ionic/angular';
import { KeyValuePipe, NgForOf, NgIf, NgStyle } from '@angular/common';
import { of } from 'rxjs';
import { DetectionToolboxFabComponent } from '../detection-toolbox-fab/detection-toolbox-fab.component';

export interface Viewports {
  top: cornerstone.Image | null;
  side: cornerstone.Image | null;
}

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
  ],
})
export class CsCanvasComponent implements OnInit {
  imageData: Viewports = {
    top: null,
    side: null,
  };
  protected readonly of = of;
  protected readonly Object = Object;

  constructor(
    private csService: CornerstoneService,
    private fileService: FileService,
    private fileParserService: FileParserService,
    private settingsService: SettingsService,
  ) {}

  public getImageData(): (keyof Viewports)[] {
    return Object.keys(this.imageData) as (keyof Viewports)[];
  }

  ngOnInit() {
    this.fileService
      .getCurrentFile()
      .subscribe((currentFile: FilePayload | null) => {
        console.log('-------------------Current File-------------------------');
        console.log(currentFile);
        console.log('--------------------------------------------------------');
        if (currentFile === null) {
          this.imageData.top = null;
          this.imageData.side = null;
          return;
        }
        this.fileParserService.loadData(currentFile.file).then((parsedFile) => {
          console.log(
            '-------------------Parsed File--------------------------',
          );
          console.log(parsedFile);
          console.log(
            '--------------------------------------------------------',
          );

          Object.keys(this.imageData).forEach((key, i): void => {
            const pixelData = parsedFile.imageData[i];
            if (!pixelData) {
              this.imageData[key as keyof Viewports] = null;
              return;
            }
            const isValidView = Object.keys(this.imageData).includes(
              pixelData.viewpoint,
            );
            if (isValidView) {
              this.csService.getImageData(pixelData).subscribe((image) => {
                this.imageData[pixelData.viewpoint as keyof Viewports] = image;
              });
            } else
              throw Error(
                `${pixelData.viewpoint} is not a valid viewpoint name`,
              );
          });
        });
      });
  }

  handleChangeImage(next = true) {
    this.fileService.requestNextFile(next);
  }
}
