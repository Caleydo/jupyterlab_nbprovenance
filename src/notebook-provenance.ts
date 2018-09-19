import { ProvenanceGraph, ProvenanceNode, ProvenanceGraphTraverser, IProvenanceGraphTraverser, IProvenanceGraph, ActionFunctionRegistry, IActionFunctionRegistry, IProvenanceTracker, ProvenanceTracker, serializeProvenanceGraph, restoreProvenanceGraph, SerializedProvenanceGraph } from '@visualstorytelling/provenance-core';
import { JupyterLab } from '@jupyterlab/application';
import { Notebook } from '@jupyterlab/notebook';
import { ActionFunctions } from './action-functions';
import { NotebookProvenanceTracker } from './provenance-tracker';

/**
 * Model for a provenance graph.
 */
export class NotebookProvenance {

    private _traverser: IProvenanceGraphTraverser;
    private _registry: IActionFunctionRegistry;
    private _graph: IProvenanceGraph;
    private _actionFunctions: ActionFunctions;
    private _tracker: IProvenanceTracker;
    private _nbtracker: NotebookProvenanceTracker;

    constructor(private app: JupyterLab, public readonly notebook: Notebook) {
        this.init();
    }

    private init() {
        if (this.notebook.model.metadata.has('provenance')) {
            const serGraph = this.notebook.model.metadata.get('provenance');
            if (serGraph) {
                this._graph = restoreProvenanceGraph(serGraph as SerializedProvenanceGraph);
            } else {
                this._graph = new ProvenanceGraph({ name: 'nbprovenance.default.graph', version: this.app.info.version });
            }
        } else {
            this._graph = new ProvenanceGraph({ name: 'nbprovenance.default.graph', version: this.app.info.version });
        }
        this._graph.on('nodeAdded', (node: ProvenanceNode) => this.onNodeAdded(node));

        this._actionFunctions = new ActionFunctions(this.notebook);
        this._registry = new ActionFunctionRegistry();
        this._registry.register('addCell', this._actionFunctions.addCell, this._actionFunctions);
        this._registry.register('removeCell', this._actionFunctions.removeCell, this._actionFunctions);
        this._registry.register('moveCell', this._actionFunctions.moveCell, this._actionFunctions);
        this._registry.register('setCell', this._actionFunctions.setCell, this._actionFunctions);
        this._registry.register('changeActiveCell', this._actionFunctions.changeActiveCell, this._actionFunctions);
        this._registry.register('cellValue', this._actionFunctions.cellValue, this._actionFunctions);
        this._registry.register('cellOutputs', this._actionFunctions.cellOutputs, this._actionFunctions);
        this._registry.register('clearOutputs', this._actionFunctions.clearOutputs, this._actionFunctions);
        this._registry.register('enableOutputScrolling', this._actionFunctions.enableOutputScrolling, this._actionFunctions);
        this._registry.register('disableOutputScrolling', this._actionFunctions.disableOutputScrolling, this._actionFunctions);
        this._registry.register('selectAll', this._actionFunctions.selectAll, this._actionFunctions);
        this._registry.register('deselectAll', this._actionFunctions.deselectAll, this._actionFunctions);

        this._traverser = new ProvenanceGraphTraverser(this._registry, this._graph);
        this._tracker = new ProvenanceTracker(this._registry, this._graph);
        this._nbtracker = new NotebookProvenanceTracker(this);
    }

    protected onNodeAdded(node: ProvenanceNode) {
        this.notebook.model.metadata.set('provenance', serializeProvenanceGraph(this._graph as ProvenanceGraph));
        // console.log('node added to graph', node);
    }

    public get traverser(): IProvenanceGraphTraverser {
        return this._traverser;
    }

    public get tracker(): IProvenanceTracker {
        return this._tracker;
    }

    public get nbtracker(): NotebookProvenanceTracker {
        return this._nbtracker;
    }

    public get pauseTracking() {
        return this._actionFunctions.pauseTracking;
    }

    public get graph(): ProvenanceGraph {
        return this._graph as ProvenanceGraph;
    }

    public get registry(): IActionFunctionRegistry {
        return this._registry;
    }
}
