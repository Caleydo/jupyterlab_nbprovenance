import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import '../style/index.css';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { Token } from '@phosphor/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NbProvenanceView } from './provenance-view';


/**
 * The token identifying the JupyterLab plugin.
 */
export const nbProvenanceExtension = new Token<INbProvenanceExtension>('jupyter.extensions.nbprovenance');

export type INbProvenanceExtension = DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>;

/**
 * IDs of the commands added by this extension.
 */
export namespace CommandIDs {
  export const provenanceView = 'nbprovenance:view';
}

/**
 * Initialization data for the jupyterlab_nbprovenance extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_nbprovenance',
  autoStart: true,
  requires: [ILayoutRestorer],
  // provides: nbProvenanceExtension,
  activate: (
    app: JupyterLab,
    restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension jupyterlab_nbprovenance is activated!');
    const provenanceView = new NbProvenanceView(app, app.shell);
    restorer.add(provenanceView, CommandIDs.provenanceView);
    app.shell.addToLeftArea(provenanceView, { rank: 700 });
  }
};

export default extension;
