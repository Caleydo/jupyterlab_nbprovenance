import { IDisposable, DisposableDelegate } from '@phosphor/disposable';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel, Notebook } from '@jupyterlab/notebook';
import { find } from '@phosphor/algorithm';
import { CommandRegistry } from '@phosphor/commands';
import { ToolbarButton, Toolbar } from '@jupyterlab/apputils';
import { CommandIDs } from '.';
import { ProvenanceTracker, IProvenanceTracker, Action } from '@visualstorytelling/provenance-core';
import { IObservableList } from '@jupyterlab/observables';
import { ICellModel, Cell } from '@jupyterlab/cells';
import { NbProvenanceModel } from './model';


/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ProvenanceExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  private commands: CommandRegistry;

  private tracker: IProvenanceTracker;

  /**
   *
   */
  constructor(commands: CommandRegistry, private nbProvenanceModel: NbProvenanceModel) {
    this.commands = commands;
  }

  /**
   * Create a new extension object
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // Add buttons to toolbar
    let buttons: ToolbarButton[] = [];
    let insertionPoint = -1;
    find(panel.toolbar.children(), (tbb: ToolbarButton, index) => {
      if (tbb.hasClass('jp-Notebook-toolbarCellType')) {
        insertionPoint = index;
        return true;
      }
      return false;
    });
    let i = 1;
    for (let id of [CommandIDs.newProvenance]) {
      let button = Toolbar.createFromCommand(this.commands, id);
      if (button === null) {
        throw new Error('Cannot create button, command not registered!');
      }
      if (insertionPoint >= 0) {
        panel.toolbar.insertItem(insertionPoint + i++, this.commands.label(id), button);
      } else {
        panel.toolbar.addItem(this.commands.label(id), button);
      }
      buttons.push(button);
    }

    this.initTracking(panel, context);

    return new DisposableDelegate(() => {
      // Cleanup extension here
      for (let btn of buttons) {
        btn.dispose();
      }
    });
  }

  private initTracking(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    console.log(panel, context);
    this.nbProvenanceModel.context = context;
    this.nbProvenanceModel.notebook = panel.notebook;

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

    panel.notebook.model.cells.changed.connect(this._onCellsChanged, this);
    panel.notebook.activeCellChanged.connect(activeCellChangedListener);

    return new DisposableDelegate(() => {
      panel.notebook.model.cells.changed.disconnect(this._onCellsChanged);
      panel.notebook.activeCellChanged.disconnect(activeCellChangedListener);
    });
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
