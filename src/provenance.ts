import { IDisposable, DisposableDelegate } from "@phosphor/disposable";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookPanel, INotebookModel, Notebook } from "@jupyterlab/notebook";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { each } from "@phosphor/algorithm";
import { IObservableList } from "@jupyterlab/observables";
import {
  ActionFunctionRegistry,
  ProvenanceGraph,
  ProvenanceGraphTraverser,
  ProvenanceTracker,
  ReversibleAction,
  StateNode
} from '@visualstorytelling/provenance-core';
import { JupyterLab } from "@jupyterlab/application";
import { JSONValue } from "@phosphor/coreutils";

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

    const registry = new ActionFunctionRegistry();
    registry.register('stateChanged', async (name, value) => {
      switch (name) {
        case 'activeCellIndex':
          panel.notebook.activeCellIndex = value;
          break;

        case 'mode':
          panel.notebook.mode = value;
          break;

        default:
          Promise.reject('Unknown name for stateChanged signal');
          break;
      }
    });

    const graph = new ProvenanceGraph({ name: JupyterLab.defaultInfo.name, version: JupyterLab.defaultInfo.version });
    const tracker = new ProvenanceTracker(registry, graph);
    const traverser = new ProvenanceGraphTraverser(registry, graph);

    console.log(panel, context);

    const modelChangedListener = (notebook: Notebook) => {
      console.log("modelChanged", notebook, notebook.model.toJSON());
    };

    /*const modelContentChangedListener = (notebook: Notebook) => {
      console.log("modelContentChanged", notebook);
    };*/

    const stateChangedListener = (
      notebook: Notebook,
      args: IChangedArgs<any>
    ) => {
      console.log("stateChanged", notebook, args);

      const action = {
        do: 'stateChanged',
        doArguments: [args.name, args.newValue],
        undo: 'stateChanged',
        undoArguments: [args.name, args.oldValue]
      } as ReversibleAction;

      tracker.applyAction(action, true)
        .then((node: StateNode) => {
          node.label = `stateChanged for ${args.name}`;
          node.artifacts.notebook = notebook.model.toJSON();
          return node;
        });
      console.log('graph', graph);
    };
    panel.notebook.stateChanged.connect(stateChangedListener);

    const activeCellChangedListener = (notebook: Notebook, args: Cell) => {
      console.log("activeCellChanged", notebook, args);
    };

    const selectionChangedListener = (notebook: Notebook) => {
      console.log("selectionChanged", notebook);
    };

    panel.notebook.model.cells.changed.connect(this._onCellsChanged, this);

    panel.notebook.modelChanged.connect(modelChangedListener);
    //panel.notebook.modelContentChanged.connect(modelContentChangedListener);
    panel.notebook.stateChanged.connect(stateChangedListener);
    panel.notebook.activeCellChanged.connect(activeCellChangedListener);
    panel.notebook.selectionChanged.connect(selectionChangedListener);

    return new DisposableDelegate(() => {
      panel.notebook.modelChanged.disconnect(modelChangedListener);
      //panel.notebook.modelContentChanged.disconnect(
      //  modelContentChangedListener
      //);
      panel.notebook.stateChanged.disconnect(stateChangedListener);
      panel.notebook.activeCellChanged.disconnect(activeCellChangedListener);
      panel.notebook.selectionChanged.disconnect(selectionChangedListener);
    });
  }

  /**
   * Handle a change in the cells list.
   */
  private _onCellsChanged(
    list: IObservableList<ICellModel>,
    change: IObservableList.IChangedArgs<ICellModel>
  ): void {
    console.groupCollapsed("cells changed", change.type);

    switch (change.type) {
      case "add":
        each(change.newValues, cell => {
          console.log("newValues", cell);
          cell.contentChanged.connect(this.triggerContentChange);
        });
        break;
      case "remove":
        each(change.oldValues, cell => {
          console.log("oldValues", cell);
          cell.contentChanged.disconnect(this.triggerContentChange);
          /* no op */
        });
        break;
      case "move":
        each(change.newValues, cell => {
          console.log("newValues", cell);
        });
        break;
      case "set":
        each(change.newValues, cell => {
          console.log("newValues", cell);
          cell.contentChanged.connect(this.triggerContentChange, this);
        });
        each(change.oldValues, cell => {
          console.log("oldValues", cell);
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
    console.log("content change", this);
  }
}
