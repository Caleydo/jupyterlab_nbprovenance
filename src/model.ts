import { VDomModel } from "@jupyterlab/apputils";
import { ProvenanceGraph, ProvenanceNode } from "@visualstorytelling/provenance-core";

/**
 * Model for a provenance graph.
 */
export class NbProvenanceModel extends VDomModel {
    constructor(public graph: ProvenanceGraph) {
        super();
        graph.on('nodeAdded', (node: ProvenanceNode) => this.onNodeAdded(node));
    }

    protected onNodeAdded(node: ProvenanceNode) {
        console.log('node added to graph', node);
        this.stateChanged.emit(undefined);
    }

}
