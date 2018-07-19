import { JupyterLab, JupyterLabPlugin } from "@jupyterlab/application";
import { ProvenanceExtension } from "./provenance";
import "../style/index.css";

/**
 * Initialization data for the jupyterlab_nbprovenance extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: "jupyterlab_nbprovenance",
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log("JupyterLab extension jupyterlab_nbprovenance is activated!");

    const graph = new ProvenanceGraph({ name: 'nbprovenance.default.graph', version: app.info.version });

    let { commands, docRegistry } = app;
    let extension = new ProvenanceExtension(commands, graph);
    docRegistry.addWidgetExtension('Notebook', extension);
  }
};

export default extension;
