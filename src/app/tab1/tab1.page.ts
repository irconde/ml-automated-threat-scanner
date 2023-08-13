import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {CsCanvasComponent} from "../cs-canvas/cs-canvas.component";
import {SocketService} from "../services/socket/socket.service";

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CsCanvasComponent],
})
export class Tab1Page {
  status: string = "IDLE"

  constructor(private socketService: SocketService) {
    this.socketService.testConnection().subscribe((status) => {
      console.log("status: " + status)
        this.status = status;
    })
  }

}
