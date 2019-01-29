import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Action, ReversibleAction, IrreversibleAction } from '@visualstorytelling/provenance-core';
import { IObservableList } from '@jupyterlab/observables';
import { ICellModel, Cell } from '@jupyterlab/cells';
import { NotebookProvenance } from './notebook-provenance';
import { toArray } from '@phosphor/algorithm';

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class NotebookProvenanceTracker {
  /**
   *
   */
  constructor(private notebookProvenance: NotebookProvenance) {

    this.trackActiveCell();

    // this.notebookProvenance.notebook.model.contentChanged.connect(() => {
    //   console.log(['contentChanged', arguments]);
    // });
    // fires when which cell is active is changed
    // this.notebookProvenance.notebook.activeCellChanged.connect(() => {
    //   console.log(['activeCellChanged', arguments]);
    // });
    this.notebookProvenance.notebook.model.cells.changed.connect(this._onCellsChanged, this);

    this.trackCellExecution();

    // return new DisposableDelegate(() => {
    //   panel.content.model.cells.changed.disconnect(this._onCellsChanged);
    //   panel.content.activeCellChanged.disconnect(activeCellChangedListener);
    // });
  }

  trackActiveCell(): any {
    let prevActiveCellIndex = this.notebookProvenance.notebook.activeCellIndex;
    let prevActiveCellValue: string;
    if (this.notebookProvenance.notebook.activeCell) {
      prevActiveCellValue = this.notebookProvenance.notebook.activeCell.model.value.text;
    }
    const activeCellChangedListener = (notebook: Notebook) => {
      if (this.notebookProvenance.pauseTracking) {
        return;
      }

      const activeCell = notebook.activeCell;
      if (typeof prevActiveCellValue !== 'undefined') {
        // Check if cell has changed
        const cell = notebook.model.cells.get(prevActiveCellIndex);
        if (cell && prevActiveCellValue !== cell.value.text) {
          // if so add to prov
          const cellChangedAction = {
            do: 'cellValue',
            doArguments: [prevActiveCellIndex, cell.value.text],
            undo: 'cellValue',
            undoArguments: [prevActiveCellIndex, prevActiveCellValue]
          };
          Promise.resolve(this.notebookProvenance.tracker.applyAction(cellChangedAction, true));
        }
      }

      const action = {
        do: 'changeActiveCell',
        doArguments: [notebook.activeCellIndex],
        undo: 'changeActiveCell',
        undoArguments: [prevActiveCellIndex]
      };

      Promise.resolve(this.notebookProvenance.tracker.applyAction(action, true));

      prevActiveCellIndex = notebook.activeCellIndex;
      if (activeCell) {
        prevActiveCellValue = activeCell.model.value.text;
      }
    };

    this.notebookProvenance.notebook.activeCellChanged.connect(activeCellChangedListener);
  }

  trackCellExecution(): any {
    const self = this;
    NotebookActions.executed.connect((_dummy, obj: { notebook: Notebook, cell: Cell }) => {
      console.log('Cell ran', obj.cell);
      let index = -1;
      // either notebook is missing model sometimes, test both
      if (self.notebookProvenance.notebook.model && self.notebookProvenance.notebook.model.cells) {
         index = toArray(self.notebookProvenance.notebook.model.cells.iter()).indexOf(obj.cell.model);
      } else if (obj.notebook.model && obj.notebook.model.cells) {
         index = toArray(obj.notebook.model.cells.iter()).indexOf(obj.cell.model);
      } else {
        throw new Error('Unable to find cell in notebook');
      }
      let action: ReversibleAction;
      let iaction: IrreversibleAction;

      switch (obj.cell.model.type) {
        case 'markdown':
        case 'raw':
          action = {
            do: 'cellOutputs',
            doArguments: [index, []],
            undo: 'clearOutputs',
            undoArguments: [index]
          };
          Promise.resolve(this.notebookProvenance.tracker.applyAction(action, true));
          break;
        case 'code':
          iaction = {
            do: 'executeCell',
            doArguments: [index],
          };
          Promise.resolve(this.notebookProvenance.tracker.applyAction(iaction, true));
          break;
        default:
          break;
      }
    }, this);
  }

  /**
   * Handle a change in the cells list
   */
  private _onCellsChanged(
    list: IObservableList<ICellModel>,
    change: IObservableList.IChangedArgs<ICellModel>
  ): void {
    if (this.notebookProvenance.pauseTracking) {
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

    Promise.resolve(this.notebookProvenance.tracker.applyAction(action!, true));
    console.groupEnd();
  }

}

export function findAction(actionName: string, args: any) {
  const notebook: Notebook = args[0];
  let action: Action;
  switch (actionName) {
    case 'enableOutputScrolling':
      action = {
        do: 'enableOutputScrolling',
        doArguments: [notebook.activeCellIndex],
        undo: 'disableOutputScrolling',
        undoArguments: [notebook.activeCellIndex]
      };
      break;
    case 'disableOutputScrolling':
      action = {
        do: 'disableOutputScrolling',
        doArguments: [notebook.activeCellIndex],
        undo: 'enableOutputScrolling',
        undoArguments: [notebook.activeCellIndex]
      };
      break;
    case 'selectAll':
      action = {
        do: 'selectAll',
        doArguments: [],
        undo: 'deselectAll',
        undoArguments: []
      };
      break;
    case 'deselectAll':
      action = {
        do: 'deselectAll',
        doArguments: [],
        undo: 'selectAll',
        undoArguments: []
      };
      break;
    case 'selectAbove':
      action = {
        do: 'selectAbove',
        doArguments: [notebook.activeCellIndex],
        undo: 'deselectAll', // TODO instead of deselectAll the old selection should be stored and restored
        undoArguments: []
      };
      break;
    case 'selectBelow':
      action = {
        do: 'selectBelow',
        doArguments: [notebook.activeCellIndex],
        undo: 'deselectAll', // TODO instead of deselectAll the old selection should be stored and restored
        undoArguments: []
      };
      break;
    default:
      throw new Error('Unknown action name, no compatible provenance action available.');
  }
  return action;
}
