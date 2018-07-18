import { IDisposable, DisposableDelegate } from "@phosphor/disposable";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookPanel, INotebookModel } from "@jupyterlab/notebook";
import { ICellModel } from "@jupyterlab/cells";
import { each } from "@phosphor/algorithm";
import { IObservableList } from "@jupyterlab/observables";
import {
  ActionFunctionRegistry,
  ProvenanceGraph,
  ProvenanceTracker
} from '@visualstorytelling/provenance-core';
import { nbformat } from "@jupyterlab/coreutils";

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ProvenanceExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  private context: DocumentRegistry.IContext<INotebookModel>;
  private tracker: ProvenanceTracker;
  private graph: ProvenanceGraph;

  /**
   * Create a new extension object
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    console.log(panel, context);

    this.context = context;

    const registry = new ActionFunctionRegistry();
    registry.register('addCell', this.addCell, this);
    registry.register('removeCell', this.removeCell, this);

    this.graph = new ProvenanceGraph({ name: context.path, version: '0.0.1' });
    this.tracker = new ProvenanceTracker(registry, this.graph);


    panel.notebook.model.cells.changed.connect(this._onCellsChanged, this);

    return new DisposableDelegate(() => {
      panel.notebook.model.cells.changed.disconnect(this._onCellsChanged);
    });
  }

  /**
   * Handle a change in the cells list
   */
  private _onCellsChanged(
    list: IObservableList<ICellModel>,
    change: IObservableList.IChangedArgs<ICellModel>
  ): void {
    console.groupCollapsed("cells changed ->", change.type);

    switch (change.type) {
      case "add":
        each(change.newValues, cell => {
          console.log("newValues", cell);
        });
        Promise.resolve(
          this.tracker.applyAction({
            do: 'addCell',
            doArguments: [change.newValues[0].toJSON()],
            undo: 'removeCell',
            undoArguments: [change.newValues[0].toJSON()]
          })
        );
        break;
      case "remove":
        each(change.oldValues, cell => {
          console.log("oldValues", cell);
          /* no op */
        });
        Promise.resolve(
          this.tracker.applyAction({
            do: 'removeCell',
            doArguments: [change.oldValues[0].toJSON()],
            undo: 'addCell',
            undoArguments: [change.oldValues[0].toJSON()]
          })
        );
        break;
      case "move":
        each(change.newValues, cell => {
          console.log("newValues", cell);
        });
        break;
      case "set":
        each(change.newValues, cell => {
          console.log("newValues", cell);
        });
        each(change.oldValues, cell => {
          console.log("oldValues", cell);
          /* no op */
        });
        break;
      default:
        return;
    }

    console.groupEnd();

    console.log(`graph.nodes`, this.graph.nodes);
  }

  private async addCell(newCell: nbformat.ICell) {
    console.log('add this cell', newCell)
    return this.context.model.toJSON();
  }

  private async removeCell(oldCell: nbformat.ICell) {
    console.log('remove this cell', oldCell)
    return this.context.model.toJSON();
  }
}
