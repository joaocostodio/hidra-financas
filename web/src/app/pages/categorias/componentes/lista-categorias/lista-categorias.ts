import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeCategoriaPipe } from '../../../../common/formatos';
import { Categoria } from '../../model/categoria.model';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDialog } from '../categoria-dialog/categoria-dialog';

/** Cadastro de categorias: lista, nova, clicar para detalhar (salvar / excluir). */
@Component({
  selector: 'app-lista-categorias',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, IconeCategoriaPipe],
  templateUrl: './lista-categorias.html',
  styleUrl: './lista-categorias.css',
})
export class ListaCategorias implements OnInit {
  private readonly service = inject(CategoriaService);
  private readonly dialog = inject(MatDialog);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.categorias.set(lista);
        this.erro.set('');
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected abrir(categoria?: Categoria): void {
    this.dialog
      .open(CategoriaDialog, { data: categoria ?? null, width: '420px' })
      .afterClosed()
      .subscribe((mudou) => mudou && this.carregar());
  }
}
