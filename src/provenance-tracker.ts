import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel, Notebook } from '@jupyterlab/notebook';
import { ProvenanceTracker, IProvenanceTracker, Action } from '@visualstorytelling/provenance-core';
import { IObservableList } from '@jupyterlab/observables';
import { ICellModel, Cell } from '@jupyterlab/cells';
import { NbProvenanceModel } from './model';


/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ProvenanceExtension {

  private tracker: IProvenanceTracker;

  /**
   *
   */
  constructor(private nbProvenanceModel: NbProvenanceModel) {
    //
  }

  public initTracking(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    console.log(panel, context);
    this.nbProvenanceModel.context = context;
    this.nbProvenanceModel.notebook = panel.content;

    this.tracker = new ProvenanceTracker(this.nbProvenanceModel.registry, this.nbProvenanceModel.graph);

    let prevActiveCellIndex = -1;

    const activeCellChangedListener = (notebook: Notebook, args: Cell) => {
      if (this.nbProvenanceModel.pauseTracking) {
        return;
      }

      const action = {
        do: 'changeActiveCell',
        doArguments: [notebook.activeCellIndex],
        undo: 'changeActiveCell',
        undoArguments: [prevActiveCellIndex]
      };

      Promise.resolve(this.tracker.applyAction(action, true));

      prevActiveCellIndex = notebook.activeCellIndex;
    };

    panel.content.model.cells.changed.connect(this._onCellsChanged, this);
    panel.content.activeCellChanged.connect(activeCellChangedListener);

    // TODO executed is a private signal (see @jupyterlab/notebook/src/actions.tsx) --> ask jupyterlab team to make it public
    // NotebookActions.executed.connect((obj: { notebook: Notebook; cell: Cell }) => {
    //   console.log('executed', obj);
    // }, this);

    // return new DisposableDelegate(() => {
    //   panel.content.model.cells.changed.disconnect(this._onCellsChanged);
    //   panel.content.activeCellChanged.disconnect(activeCellChangedListener);
    // });
  }

  /**
   * Handle a change in the cells list
   */
  private _onCellsChanged(
    list: IObservableList<ICellModel>,
    change: IObservableList.IChangedArgs<ICellModel>
  ): void {
    if (this.nbProvenanceModel.pauseTracking) {
      return;
    }

    console.groupCollapsed('cells changed ->', change.type);
    console.log(change);

    let action: Action;

    switch (change.type) {
      case 'add':
        action = {
          do: 'addCell',
          doArguments: [change.newIndex, change.newValues[0].toJSON()],
          undo: 'removeCell',
          undoArguments: [change.newIndex]
        };
        break;
      case 'remove':
        action = {
          do: 'removeCell',
          doArguments: [change.oldIndex],
          undo: 'addCell',
          undoArguments: [change.oldIndex, change.oldValues[0].toJSON()]
        };
        break;
      case 'move':
        action = {
          do: 'moveCell',
          doArguments: [change.oldIndex, change.newIndex],
          undo: 'moveCell',
          undoArguments: [change.newIndex, change.oldIndex]
        };
        break;
      case 'set': // caused by, e.g., change cell type
        action = {
          do: 'setCell',
          doArguments: [change.newIndex, change.newValues[0].toJSON()],
          undo: 'setCell',
          undoArguments: [change.oldIndex, change.oldValues[0].toJSON()]
        };
        break;
      default:
        return;
    }

    Promise.resolve(this.tracker.applyAction(action!, true));
    console.groupEnd();
  }

}