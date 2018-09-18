'use strict';

import * as React from 'react';
import { Widget, BoxLayout } from '@phosphor/widgets';
import { VDomRenderer } from '@jupyterlab/apputils';
import { NbProvenanceModel } from './model';
import { ProvenanceTreeVisualizationReact } from '@visualstorytelling/provenance-tree-visualization-react';
import { ApplicationShell, JupyterLab } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ProvenanceGraphTraverser } from '@visualstorytelling/provenance-core';

/**
 * The main view for the notebook provenance.
 */
export class NbProvenanceView extends Widget {

    // private _toolbar: Toolbar<Widget>;
    private _provenancegraph: VDomRenderer<any>;

    constructor(app: JupyterLab, shell: ApplicationShell) {
        super();

        shell.activeChanged.connect((shell: ApplicationShell) => {
            const activeWidget = shell.activeWidget;
            if (activeWidget === null || (activeWidget instanceof NotebookPanel) === false) {
                this._provenancegraph.model = null;
                return;
            }
            console.log('Yeah, it\'s a Notebook Panel!', activeWidget.title);
            this._provenancegraph.model = new NbProvenanceModel(app);
        });

        this.id = 'nbprovenance-view';

        this.addClass('jp-nbprovenance-view');
        this.title.closable = true;
        this.title.caption = 'Notebook Provenance';
        this.title.iconClass = 'jp-nbprovenanceIcon';

        this.prepareLayout();
    }

    private prepareLayout() {
        let layout = this.layout = new BoxLayout();

        // this._toolbar = new Toolbar();
        // this._toolbar.addClass('jp-nbprovenance-toolbar');

        this._provenancegraph = new ProvenanceGraphView(null);

        // layout.addWidget(this._toolbar);
        layout.addWidget(this._provenancegraph);

        // BoxLayout.setStretch(this._toolbar, 0);
        BoxLayout.setStretch(this._provenancegraph, 1);
    }
}


/**
 * The main view for the provenance graph.
 */
export class ProvenanceGraphView extends VDomRenderer<NbProvenanceModel> {
    constructor(public model: NbProvenanceModel | null) {
        super();
        this.model = model;
        this.id = `nbprovenance-graph`;
        this.addClass('jp-nbprovenance-graph');
    }

    /**
     * Render the extension discovery view using the virtual DOM.
     */
    protected render(): React.ReactElement<any>[] {
        return [(this.model) ? <ProvenanceTreeVisualizationReact traverser={this.model.traverser as ProvenanceGraphTraverser} /> : <div>No provenance graph available. No active notebook!</div>];
    }
}
