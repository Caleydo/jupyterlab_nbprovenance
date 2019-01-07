import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Action, ReversibleAction } from '@visualstorytelling/provenance-core';
import { IObservableList } from '@jupyterlab/observables';
import { ICellModel, Cell, CodeCell } from '@jupyterlab/cells';
import { NotebookProvenance } from './notebook-provenance';
import { toArray } from '@phosphor/algorithm';
import debounce from 'lodash/debounce';

// We need to store the old value of each cell to be able to create the undo action
interface ICellWithOldValue extends ICellModel {
  oldTextValue: string;
}

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class NotebookProvenanceTracker {
  /**
   *
   */
  constructor(private notebookProvenance: NotebookProvenance) {

    // this.trackActiveCell();

    // this.notebookProvenance.notebook.model.contentChanged.connect(() => {
    //   console.log(['contentChanged', arguments]);
    // });
    // fires when which cell is active is changed
    // this.notebookProvenance.notebook.activeCellChanged.connect(() => {
    //   console.log(['activeCellChanged', arguments]);
    // });
    this.notebookProvenance.notebook.model.cells.changed.connect(this._onCellsChanged, this);

    this.trackCellOutput();


    // listen to content changes of current cells
    let cell;
    let cellIterator = this.notebookProvenance.notebook.model.cells.iter();
    // tslint:disable-next-line
    while (cell = cellIterator.next()) {
      this.trackCellContents(cell);
    }

    // listen to content changes of new cells
    this.notebookProvenance.notebook.model.cells.changed.connect((list, mutation) => {
      if (mutation.type === 'add') {
        this.trackCellContents(mutation.newValues[0]);
      }
    }, this);

    // return new DisposableDelegate(() => {
    //   panel.content.model.cells.changed.disconnect(this._onCellsChanged);
    //   panel.content.activeCellChanged.disconnect(activeCellChangedListener);
    // });
  }

  trackCellContents(cell: ICellModel) {
    // Since we deal with an array abstraction (IObservableList), we need some function to get
    // the index of a cell given the cell and the containing list.
    const getCellIndex = (list: IObservableList<ICellModel>, cell: ICellModel) => {
      for (let i = 0; i < list.length; i++) {
        if (list.get(i) === cell) {
          return i;
        }
      }
      throw new Error('cell not part of list');
    };

    // store the current value
    (cell as ICellWithOldValue).oldTextValue = cell.value.text;

    const cellUpdated = (cell: ICellModel) => {
      const cellIndex = getCellIndex(this.notebookProvenance.notebook.model.cells, cell);
      const cellChangedAction = {
        do: 'cellValue',
        doArguments: [cellIndex, cell.value.text],
        undo: 'cellValue',
        undoArguments: [cellIndex, (cell as ICellWithOldValue).oldTextValue]
      };
      // update value for next change.
      (cell as any).oldTextValue = cell.value.text;
      Promise.resolve(this.notebookProvenance.tracker.applyAction(cellChangedAction, true));
    };

    // add listener
    console.log(debounce);
    cell.contentChanged.connect(debounce(cellUpdated, 1000));
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

  trackCellOutput(): any {
    NotebookActions.executed.connect((_dummy, obj: { notebook: Notebook; cell: Cell }) => {
      console.log('Cell ran', obj.cell);
      const index = toArray(obj.notebook.model.cells.iter()).indexOf(obj.cell.model);
      let action: ReversibleAction;

      switch (obj.cell.model.type) {
        case 'markdown':
          action = {
            do: 'cellOutputs',
            doArguments: [index, []],
            undo: 'clearOutputs',
            undoArguments: [index]
          };
          Promise.resolve(this.notebookProvenance.tracker.applyAction(action, true));
          break;
        case 'code':
          const outputs = (obj.cell as CodeCell).model.outputs.toJSON();
          action = {
            do: 'cellOutputs',
            doArguments: [index, outputs],
            undo: 'clearOutputs',
            undoArguments: [index]
          };
          Promise.resolve(this.notebookProvenance.tracker.applyAction(action, true));
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
