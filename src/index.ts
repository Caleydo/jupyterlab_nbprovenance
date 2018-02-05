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
    app.docRegistry.addWidgetExtension("Notebook", new ProvenanceExtension());
  }
};

export default extension;
