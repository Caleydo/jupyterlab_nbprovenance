import { nbformat } from '@jupyterlab/coreutils';
import { ICellModel } from '@jupyterlab/cells';
import { NotebookActions, Notebook } from '@jupyterlab/notebook';


export class ActionFunctions {
    public pauseTracking: boolean = false;

    constructor(private notebook: Notebook) {}

    public async addCell(index: number, cell: nbformat.ICell) {
        console.log('added cell at index', index, cell);

        // code from NotebookModel.fromJSON() --> @jupyterlab/notebook/src/model.ts
        const factory = this.notebook.model.contentFactory;
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
        this.notebook.model.cells.insert(index, cellModel);
        this.pauseTracking = false;

        return null;
    }

    public async removeCell(index: number) {
        console.log('removed cell at index', index);
        this.pauseTracking = true;
        this.notebook.model.cells.remove(index);
        this.pauseTracking = false;
        return null;
    }

    public async moveCell(fromIndex: number, toIndex: number) {
        console.log('moved cell to index', fromIndex, toIndex);

        this.pauseTracking = true;
        this.notebook.model.cells.move(fromIndex, toIndex);
        this.pauseTracking = false;

        return null;
    }

    public async setCell(index: number, cell: nbformat.ICell) {
        console.log('set cell at index', index, cell);

        this.pauseTracking = true;
        NotebookActions.changeCellType(this.notebook, cell.cell_type as nbformat.CellType);
        this.pauseTracking = false;

        return null;
    }

    public async changeActiveCell(index: number) {
        console.log('change active cell to index', index);

        this.pauseTracking = true;
        this.notebook.activeCellIndex = index;
        this.pauseTracking = false;

        return null;
    }

    public async cellValue(index: number, value: string) {
        const cell = this.notebook.model.cells.get(index);
        if (cell) {
            cell.value.text = value;
        }
    }
}
