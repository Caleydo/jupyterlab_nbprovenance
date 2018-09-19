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

        this._registry = new ActionFunctionRegistry();
        this._actionFunctions = new ActionFunctions(this.notebook);
        // get method names from the object (see https://stackoverflow.com/a/48051971)
        let actionFunctionNames = Object.getPrototypeOf(this._actionFunctions);
        Object.getOwnPropertyNames(actionFunctionNames)
            .filter((d) => d !== 'constructor')
            .map((name: string) => {
                // dynamically register all functions from the ActionFunctions class/object
                this._registry.register(name, (this._actionFunctions as any)[name], this._actionFunctions);
            });

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
