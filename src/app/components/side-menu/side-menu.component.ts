import { Component, OnInit } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class SideMenuComponent implements OnInit {
  public isOpen: boolean = false;

  constructor(private uiService: UiService) {
    this.uiService.getIsSideMenuOpen().subscribe((isSideMenuOpen) => {
      this.isOpen = isSideMenuOpen;
    });
  }

  ngOnInit() {}
}
