import { IDisposable, DisposableDelegate } from '@phosphor/disposable';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel, Notebook } from '@jupyterlab/notebook';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { each } from '@phosphor/algorithm';
import { IObservableList } from '@jupyterlab/observables';

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ProvenanceExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Create a new extension object.
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    console.log(panel, context);

    const modelChangedListener = (notebook: Notebook) => {
      console.log('modelChanged', notebook, notebook.model.toJSON());
    };

    /*const modelContentChangedListener = (notebook: Notebook) => {
      console.log('modelContentChanged', notebook);
    };*/

    const stateChangedListener = (
      notebook: Notebook,
      args: IChangedArgs<any>
    ) => {
      console.log('stateChanged', notebook, args);
    };

    const activeCellChangedListener = (notebook: Notebook, args: Cell) => {
      console.log('activeCellChanged', notebook, args);
    };

    const selectionChangedListener = (notebook: Notebook) => {
      console.log('selectionChanged', notebook);
    };

    panel.content.model.cells.changed.connect(this._onCellsChanged, this);

    panel.content.modelChanged.connect(modelChangedListener);
    // panel.notebook.modelContentChanged.connect(modelContentChangedListener);
    panel.content.stateChanged.connect(stateChangedListener);
    panel.content.activeCellChanged.connect(activeCellChangedListener);
    panel.content.selectionChanged.connect(selectionChangedListener);

    return new DisposableDelegate(() => {
      panel.content.modelChanged.disconnect(modelChangedListener);
      // panel.notebook.modelContentChanged.disconnect(
      //   modelContentChangedListener
      // );
      panel.content.stateChanged.disconnect(stateChangedListener);
      panel.content.activeCellChanged.disconnect(activeCellChangedListener);
      panel.content.selectionChanged.disconnect(selectionChangedListener);
    });
  }

  /**
   * Handle a change in the cells list.
   */
  private _onCellsChanged(
    list: IObservableList<ICellModel>,
    change: IObservableList.IChangedArgs<ICellModel>
  ): void {
    console.groupCollapsed('cells changed', change.type);

    switch (change.type) {
      case 'add':
        each(change.newValues, cell => {
          console.log('newValues', cell);
          cell.contentChanged.connect(this.triggerContentChange);
        });
        break;
      case 'remove':
        each(change.oldValues, cell => {
          console.log('oldValues', cell);
          cell.contentChanged.disconnect(this.triggerContentChange);
          /* no op */
        });
        break;
      case 'move':
        each(change.newValues, cell => {
          console.log('newValues', cell);
        });
        break;
      case 'set':
        each(change.newValues, cell => {
          console.log('newValues', cell);
          cell.contentChanged.connect(this.triggerContentChange, this);
        });
        each(change.oldValues, cell => {
          console.log('oldValues', cell);
          cell.contentChanged.disconnect(this.triggerContentChange, this);
          /* no op */
        });
        break;
      default:
        return;
    }

    console.groupEnd();
  }

  private triggerContentChange() {
    console.log('content change', this);
  }
}
