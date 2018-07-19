import { VDomModel } from '@jupyterlab/apputils';
import { ProvenanceGraph, ProvenanceNode, ProvenanceGraphTraverser, IProvenanceGraphTraverser, IProvenanceGraph, ActionFunctionRegistry, IActionFunctionRegistry } from '@visualstorytelling/provenance-core';
import { JupyterLab } from '@jupyterlab/application';
import { nbformat } from '@jupyterlab/coreutils';
import { JSONValue } from '@phosphor/coreutils';

/**
 * Model for a provenance graph.
 */
export class NbProvenanceModel extends VDomModel {

    private _travserer: IProvenanceGraphTraverser;
    private _registry: IActionFunctionRegistry;
    private _graph: IProvenanceGraph;

    constructor(private app: JupyterLab) {
        super();
        this.init();
    }

    private init() {
        this._graph = new ProvenanceGraph({ name: 'nbprovenance.default.graph', version: this.app.info.version });
        this._graph.on('nodeAdded', (node: ProvenanceNode) => this.onNodeAdded(node));

        this._registry = new ActionFunctionRegistry();
        this._registry.register('addCell', this.addCell, this);
        this._registry.register('removeCell', this.removeCell, this);

        this._travserer = new ProvenanceGraphTraverser(this._registry, this.graph);

    }

    protected onNodeAdded(node: ProvenanceNode) {
        console.log('node added to graph', node);
        this.stateChanged.emit(undefined);
    }

    public get traverser(): IProvenanceGraphTraverser {
        return this._travserer;
    }

    public get graph(): ProvenanceGraph {
        return this._graph as ProvenanceGraph;
    }

    public get registry(): IActionFunctionRegistry {
        return this._registry;
    }


    private async addCell(newCell: nbformat.ICell, notebookJSON: JSONValue) {
        console.log('add this cell', newCell);
        return notebookJSON;
    }

    private async removeCell(oldCell: nbformat.ICell, notebookJSON: JSONValue) {
        console.log('remove this cell', oldCell);
        return notebookJSON;
    }

}
