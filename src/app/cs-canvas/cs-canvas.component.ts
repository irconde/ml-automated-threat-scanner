import { Component, OnInit } from '@angular/core';
import { cornerstone } from '../csSetup';
import { CornerstoneDirective } from '../directives/cornerstone.directive';
import { CornerstoneService } from '../services/cornerstone.service';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import {
  CurrentLocalDirectoryPayload,
  CurrentRemoteServerPayload,
} from '../../../shared/models/file-models';
import { FileParserService } from '../services/file-parser/file-parser.service';
import { base64ToArrayBuffer } from '../utilities/general.utilities';

export interface Viewports {
  top: cornerstone.Image | null;
  side: cornerstone.Image | null;
}

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true,
  imports: [CornerstoneDirective],
})
export class CsCanvasComponent implements OnInit {
  imageData: Viewports = {
    top: null,
    side: null,
  };

  constructor(
    private csService: CornerstoneService,
    private fileService: FileService,
    private fileParserService: FileParserService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.fileService
      .getCurrentFile()
      .subscribe(
        (
          currentFile: CurrentLocalDirectoryPayload | CurrentRemoteServerPayload
        ) => {
          console.log(
            '-------------------Current File-------------------------'
          );
          console.log(currentFile);
          console.log(
            '--------------------------------------------------------'
          );
          if ('file' in currentFile) {
            this.fileParserService
              .loadData(base64ToArrayBuffer(currentFile.file))
              .then((parsedFile) => {
                console.log(
                  '-------------------Parsed File--------------------------'
                );
                console.log(parsedFile);
                console.log(
                  '--------------------------------------------------------'
                );

                parsedFile.imageData.forEach((pixelData) => {
                  this.csService.getImageData(pixelData).subscribe((image) => {
                    if (
                      Object.keys(this.imageData).includes(pixelData.viewpoint)
                    ) {
                      this.imageData[pixelData.viewpoint as keyof Viewports] =
                        image;
                    } else {
                      console.log('Viewport name is not recognized');
                    }
                  });
                });
              });
          } else if ('pixelData' in currentFile) {
            // TODO: Electron logic change to load ORA file
          }
        }
      );
  }

  handleChangeImage(next = true) {
    this.fileService.requestNextFile(next);
  }
}
