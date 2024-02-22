import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CommonDetections } from '../../../enums/cornerstone';
import randomColor from 'randomcolor';
import { BehaviorSubject } from 'rxjs';

type ColorsCache = Record<string, string>;

@Injectable({
  providedIn: 'root',
})
export class ColorsCacheService {
  private colorsCache: ColorsCache | null = null;
  private isLoading = new BehaviorSubject(true);
  private readonly STORAGE_KEY = 'CACHED_COLORS';
  private readonly DEFAULT_CACHE: ColorsCache = {
    [CommonDetections.Unknown]: this.generateDetectionColor(
      CommonDetections.Unknown,
    ),
  } as const;
  public $isLoading = this.isLoading.asObservable();

  constructor() {
    this.init().then();
  }

  private async init() {
    // Load colors using Capacitor Preferences
    this.colorsCache = await this.loadCachedColors();
  }

  private addCachedColor(className: string, color: string) {
    if (this.colorsCache === null) {
      throw Error("Can't add a color before async initialization");
    }
    this.colorsCache[className] = color;
    this.storeCachedColors(this.colorsCache).then();
  }

  private storeCachedColors = async (colorsCache: ColorsCache) => {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(colorsCache),
    });
  };

  private loadCachedColors = async (): Promise<ColorsCache> => {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    if (value !== null) {
      return JSON.parse(value) as ColorsCache;
    }
    await this.storeCachedColors(this.DEFAULT_CACHE);
    return this.DEFAULT_CACHE;
  };

  private generateDetectionColor(className: string): string {
    return randomColor({
      seed: className.toLowerCase(),
      hue: 'random',
      luminosity: 'bright',
    });
  }

  public getDetectionColor(className: string): string {
    if (this.colorsCache === null) {
      throw Error("Can't access cached colors before async initialization");
    }
    const cachedColor: string | undefined = this.colorsCache[className];
    if (cachedColor) return cachedColor;
    else {
      const newColor = this.generateDetectionColor(className);
      this.addCachedColor(className, newColor);
      return newColor;
    }
  }
}
