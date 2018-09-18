import { JupyterLab, JupyterLabPlugin, ILayoutRestorer, ApplicationShell } from '@jupyterlab/application';
import '../style/index.css';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { NbProvenanceView } from './provenance-view';
import { NbProvenanceModel } from './model';

/**
 * Initialization data for the jupyterlab_nbprovenance extension.
 */
const plugin: JupyterLabPlugin<void> = {
  id: 'jupyterlab_nbprovenance',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate,
};

export default plugin;


export const notebookModelCache = new Map<INotebookModel, NbProvenanceModel>();

function activate(app: JupyterLab, restorer: ILayoutRestorer): void {
  const updateModelCache = (shell: ApplicationShell) => {
    const currentWidget = shell.currentWidget;
    if (currentWidget === null || (currentWidget instanceof NotebookPanel) === false) {
      return;
    }

    const notebook: INotebookModel = (currentWidget as NotebookPanel).content.model;
    let model;
    if (notebookModelCache.has(notebook)) {
      model = notebookModelCache.get(notebook);
    } else {
      model = new NbProvenanceModel(app);
      notebookModelCache.set(notebook, model);
    }
  };

  app.shell.currentChanged.connect(updateModelCache);

  const provenanceView = new NbProvenanceView(app.shell);
  provenanceView.id = 'nbprovenance-view';
  provenanceView.title.caption = 'Notebook Provenance';
  provenanceView.title.iconClass = 'jp-nbprovenanceIcon';

  restorer.add(provenanceView, 'nbprovenance_view');

  // Rank has been chosen somewhat arbitrarily
  app.shell.addToLeftArea(provenanceView, { rank: 700 });
}
