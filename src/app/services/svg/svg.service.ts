import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs';

/**
 * Service for handling dynamic SVG icons.
 */
@Injectable({
  providedIn: 'root',
})
export class SvgService {
  constructor(
    private http: HttpClient,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {}

  /**
   * Loads and registers an SVG icon from the specified path.
   * @param (filePath) path to the SVG file
   * @param (iconName) name of the icon to be registered
   * @returns (Observable<string>) name of the registered icon
   */
  public loadAndRegisterSvg(
    filePath: string,
    iconName: string,
  ): Observable<string> {
    return new Observable<string>((observer) => {
      this.extractSvgContents(filePath).subscribe((svgContent: string) => {
        const name = this.registerSvg(svgContent, iconName);
        observer.next(name);
        observer.complete();
      });
    });
  }

  /**
   * Extracts the contents of an SVG file.
   * @param (filePath) path to the SVG file
   * @private
   * @returns (Observable<string>) contents of the SVG file as a string literal to be used in registering the icon
   */
  private extractSvgContents(filePath: string): Observable<string> {
    return this.http.get(filePath, { responseType: 'text' });
  }

  /**
   * Registers an SVG icon.
   * @param (svgContent) contents of the SVG file
   * @param (iconName) name of the icon to be registered
   * @private
   * @returns (string) name of the registered icon
   */
  private registerSvg(svgContent: string, iconName: string): string {
    this.iconRegistry.addSvgIconLiteral(
      iconName,
      this.sanitizer.bypassSecurityTrustHtml(svgContent),
    );
    return iconName;
  }
}
