import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { IniciaisPipe } from '../formatos';
import { Marca } from '../marca/marca';
import { BotaoTema } from '../tema/botao-tema';

interface ItemMenu {
  rota: string;
  icone: string;
  nome: string;
  exato?: boolean;
}

/**
 * Moldura das telas do sistema: menu lateral fixo (no celular ele abre e fecha pelo botão do topo).
 */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    Marca,
    BotaoTema,
    IniciaisPipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly auth = inject(AuthService);

  /** Tela estreita (celular): o menu vira gaveta. */
  protected readonly celular = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 860px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly menu: ItemMenu[] = [
    { rota: '/', icone: 'home', nome: 'Início', exato: true },
    { rota: '/transacoes', icone: 'receipt_long', nome: 'Transações' },
    { rota: '/contas', icone: 'account_balance_wallet', nome: 'Contas' },
    { rota: '/categorias', icone: 'sell', nome: 'Categorias' },
    { rota: '/transferencia', icone: 'swap_horiz', nome: 'Transferir' },
  ];
}
