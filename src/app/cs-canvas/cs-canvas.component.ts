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
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true,
  imports: [CornerstoneDirective, IonicModule],
})
export class CsCanvasComponent implements OnInit {
  imageData: cornerstone.Image | null = null;

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
              .loadData(currentFile.file)
              .then((parsedFile) => {
                console.log(
                  '-------------------Parsed File--------------------------'
                );
                console.log(parsedFile);
                console.log(
                  '--------------------------------------------------------'
                );
                // TODO: Cornerstone Image Rendering Logic. Viewports etc.
                // this.csService
                //   .getImageData(currentFile.fileName, // TODO)
                //   .subscribe((image) => {
                //     this.imageData = image;
                //   });
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
