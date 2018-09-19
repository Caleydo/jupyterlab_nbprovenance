import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import '../style/index.css';
import { NotebookPanel, Notebook, INotebookTracker } from '@jupyterlab/notebook';
import { SideBar } from './side-bar';
import { NotebookProvenance } from './notebook-provenance';

/**
 * Initialization data for the jupyterlab_nbprovenance extension.
 */
const plugin: JupyterLabPlugin<void> = {
  id: 'jupyterlab_nbprovenance',
  autoStart: true,
  requires: [ILayoutRestorer, INotebookTracker],
  activate,
};

export default plugin;

export const notebookModelCache = new Map<Notebook, NotebookProvenance>();

function activate(app: JupyterLab, restorer: ILayoutRestorer, nbTracker: INotebookTracker): void {
  nbTracker.widgetAdded.connect((_: INotebookTracker, nbPanel: NotebookPanel) => {
    // wait until the session with the notebook model is ready
    nbPanel.session.ready.then(() => {
      const notebook: Notebook = nbPanel.content;
      if (!notebookModelCache.has(notebook)) {
        notebookModelCache.set(notebook, new NotebookProvenance(app, notebook));
      }
    });
  });

  const provenanceView = new SideBar(app.shell, nbTracker);
  provenanceView.id = 'nbprovenance-view';
  provenanceView.title.caption = 'Notebook Provenance';
  provenanceView.title.iconClass = 'jp-nbprovenanceIcon';

  restorer.add(provenanceView, 'nbprovenance_view');

  // Rank has been chosen somewhat arbitrarily
  app.shell.addToLeftArea(provenanceView, { rank: 700 });
}
