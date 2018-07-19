import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ProvenanceExtension } from './provenance-tracker';
import '../style/index.css';
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Token } from '@phosphor/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NbProvenanceView } from './provenance-view';
import { NbProvenanceModel } from './model';


/**
 * The token identifying the JupyterLab plugin.
 */
export const nbProvenanceExtension = new Token<INbProvenanceExtension>('jupyter.extensions.nbprovenance');

export type INbProvenanceExtension = DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>;


/**
 * IDs of the commands added by this extension.
 */
export namespace CommandIDs {
  export const newProvenance = 'nbprovenance:new';
}


/**
 * Add the main file view commands to the application's command registry.
 */
function addCommands(
  app: JupyterLab,
  tracker: INotebookTracker,
  palette: ICommandPalette,
  menu: IMainMenu,
  nbProvenanceModel: NbProvenanceModel
): void {
  const { commands, shell } = app;

  /**
   * Whether there is an active notebook.
   */
  function hasKernel(): boolean {
    return (
      tracker.currentWidget !== null &&
      tracker.currentWidget.context.session.kernel !== null
    );
  }

  commands.addCommand(CommandIDs.newProvenance, {
    label: 'Notebook Provenance',
    caption: 'Open a window to explore the interaction history with the notebook',
    iconClass: 'jp-nbprovenanceIcon',
    isEnabled: hasKernel,
    execute: (args) => {
      let current = tracker.currentWidget;
      if (!current) {
        return;
      }
      const widget = new NbProvenanceView(current.context.session.kernel!, nbProvenanceModel);
      shell.addToMainArea(widget);
      if (args['activate'] !== false) {
        shell.activateById(widget.id);
      }
    }
  });

  palette.addItem({
    command: CommandIDs.newProvenance,
    category: 'View',
  });

  menu.viewMenu.addGroup([
    { command: CommandIDs.newProvenance },
  ]);
}

/**
 * Initialization data for the jupyterlab_nbprovenance extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_nbprovenance',
  autoStart: true,
  requires: [ILayoutRestorer, INotebookTracker, ICommandPalette, IMainMenu],
  provides: nbProvenanceExtension,
  activate: (
    app: JupyterLab,
    restorer: ILayoutRestorer,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    mainMenu: IMainMenu
  ) => {

    console.log('JupyterLab extension jupyterlab_nbprovenance is activated!');

    const nbProvenanceModel = new NbProvenanceModel(app);

    let { commands, docRegistry } = app;
    let extension = new ProvenanceExtension(commands, nbProvenanceModel);
    docRegistry.addWidgetExtension('Notebook', extension);

    // TODO: Recreate views from layout restorer

    addCommands(app, tracker, palette, mainMenu, nbProvenanceModel);

    function refreshNewCommand() {
      commands.notifyCommandChanged(CommandIDs.newProvenance);
    }

    // Update the command registry when the notebook state changes.
    tracker.currentChanged.connect(refreshNewCommand);

    // TODO the command should not be bind to the `kernelChanged` signal
    let prevWidget: NotebookPanel | null = tracker.currentWidget;
    if (prevWidget) {
      prevWidget.context.session.kernelChanged.connect(refreshNewCommand);
    }
    tracker.currentChanged.connect((tracker) => {
      if (prevWidget) {
        prevWidget.context.session.kernelChanged.disconnect(refreshNewCommand);
      }
      prevWidget = tracker.currentWidget;
      if (prevWidget) {
        prevWidget.context.session.kernelChanged.connect(refreshNewCommand);
      }
    });
  }
};

export default extension;
