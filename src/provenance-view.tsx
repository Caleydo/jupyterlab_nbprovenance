'use strict';

import * as React from 'react';

import { Widget, BoxLayout } from "@phosphor/widgets";
import { Kernel } from "@jupyterlab/services";
import { Toolbar, ToolbarButton, VDomRenderer } from "@jupyterlab/apputils";
import { ProvenanceGraph } from '@visualstorytelling/provenance-core';
import { NbProvenanceModel } from "./model";


/**
 * The main view for the notebook provenance.
 */
export class NbProvenanceView extends Widget {

    private _model: NbProvenanceModel;

    private _toolbar: Toolbar<Widget>;
    private _provenancegraph: ProvenanceGraphView;

    protected expandAllButton: ToolbarButton;
    protected collapseAllButton: ToolbarButton;

    constructor(kernel: Kernel.IKernelConnection, model: NbProvenanceModel) {
        super();
        this._model = model;

        this.addClass('jp-nbprovenance-view');
        this.id = `nbprovenance-${kernel.id}`;
        this.title.label = 'NB Provenance';
        this.title.closable = true;
        this.title.iconClass = 'jp-nbprovenanceIcon';

        let layout = this.layout = new BoxLayout();

        this._toolbar = new Toolbar();
        this._toolbar.addClass('jp-nbprovenance-toolbar');

        this._provenancegraph = new ProvenanceGraphView(this._model);

        layout.addWidget(this._toolbar);
        layout.addWidget(this._provenancegraph);

        BoxLayout.setStretch(this._toolbar, 0);
        BoxLayout.setStretch(this._provenancegraph, 1);
    }

}


/**
 * The main view for the provenance graph.
 */
export class ProvenanceGraphView extends VDomRenderer<NbProvenanceModel> {
    constructor(model: NbProvenanceModel) {
        super();
        this.model = model;
        this.id = `nbprovenance-graph`;
        this.addClass('jp-nbprovenance-graph');
    }

    /**
     * Render the extension discovery view using the virtual DOM.
     */
    protected render(): React.ReactElement<any>[] {
        const model = this.model!;
        const nodes = Object.values(model.graph.nodes);
        let elements: React.ReactElement<any>[] = [];

        elements = [...elements, ...nodes.map((node) => <p>{node.label} ({node.id})</p>)];

        return elements;
    }
}
