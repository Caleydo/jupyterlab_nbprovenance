import { VDomModel } from '@jupyterlab/apputils';
import { ProvenanceGraph, ProvenanceNode, ProvenanceGraphTraverser, IProvenanceGraphTraverser, IProvenanceGraph, ActionFunctionRegistry, IActionFunctionRegistry } from '@visualstorytelling/provenance-core';
import { JupyterLab } from '@jupyterlab/application';
import { nbformat } from '@jupyterlab/coreutils';
import { INotebookModel, NotebookActions, Notebook } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ICellModel } from '@jupyterlab/cells';

/**
 * Model for a provenance graph.
 */
export class NbProvenanceModel extends VDomModel {

    private _travserer: IProvenanceGraphTraverser;
    private _registry: IActionFunctionRegistry;
    private _graph: IProvenanceGraph;

    public notebook: Notebook;
    public context: DocumentRegistry.IContext<INotebookModel>;

    public pauseTracking: boolean = false;

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
        this._registry.register('moveCell', this.moveCell, this);
        this._registry.register('setCell', this.setCell, this);

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


    private async addCell(index: number, cell: nbformat.ICell) {
        console.log('added cell at index', index, cell);

        // code from NotebookModel.fromJSON() --> @jupyterlab/notebook/src/model.ts
        const factory = this.context.model.contentFactory;
        let cellModel: ICellModel;

        switch (cell.cell_type) {
            case 'code':
                cellModel = factory.createCodeCell({ cell });
                break;
            case 'markdown':
                cellModel = factory.createMarkdownCell({ cell });
                break;
            case 'raw':
                cellModel = factory.createRawCell({ cell });
                break;
            default:
                console.error('Unknown cell type', cell.cell_type);
                return null;
        }

        this.pauseTracking = true;
        this.context.model.cells.insert(index, cellModel);
        this.pauseTracking = false;

        return null;
    }

    private async removeCell(index: number) {
        console.log('removed cell at index', index);
        this.pauseTracking = true;
        this.context.model.cells.remove(index);
        this.pauseTracking = false;
        return null;
    }

    private async moveCell(fromIndex: number, toIndex: number) {
        console.log('moved cell to index', fromIndex, toIndex);

        this.pauseTracking = true;
        this.context.model.cells.move(fromIndex, toIndex);
        this.pauseTracking = false;

        return null;
    }

    private async setCell(index: number, cell: nbformat.ICell) {
        console.log('set cell at index', index, cell);

        this.pauseTracking = true;
        NotebookActions.changeCellType(this.notebook, cell.cell_type as nbformat.CellType);
        this.pauseTracking = false;

        return null;
    }
}
