import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TemaService } from './tema.service';

/** Botão que troca entre o tema claro e o escuro. */
@Component({
  selector: 'app-botao-tema',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './botao-tema.html',
})
export class BotaoTema {
  protected readonly temas = inject(TemaService);
}
