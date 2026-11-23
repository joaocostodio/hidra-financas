import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  constructor() {
    // Os ícones vêm da fonte Material Symbols (carregada no index.html)
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
