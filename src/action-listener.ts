import * as nb from '@jupyterlab/notebook';

const handler = {
    get: function(target: any, name: any, receiver: any) {
        console.log(['Proxy called via get :', target, name, receiver]);
        return Reflect.get(target, name, receiver);
    },
    apply: function(target: any, thisArg: any, argumentsList: any) {
        console.log(['Proxy called via apply :', target.name, argumentsList]);
        return target.apply(thisArg, argumentsList);
    }
};

export const originalNotebookActions: any = {};

console.log('Adding proxy around NotebookActions from @jupyterlab/notebook');

const proxiedActions = new Set([
    'changeCellType',
    'deleteCells',
    'deselectAll',
    'disableOutputScrolling',
    'enableOutputScrolling',
    'hideAllCode',
    'hideAllOutputs',
    'hideCode',
    'hideOutput',
    'insertAbove',
    'insertBelow',
    'moveDown',
    'moveUp',
    'selectAbove',
    'selectAll',
    'selectBelow',
    'showAllCode',
    'showAllOutputs',
    'showCode',
    'showOutput',
    'splitCell',
    'toggleAllLineNumbers'
]);

for (const prop in nb.NotebookActions) {
    if (proxiedActions.has(prop)) {
        originalNotebookActions[prop] = (nb.NotebookActions as any )[prop];
        (nb.NotebookActions as any)[prop] = new Proxy(originalNotebookActions[prop], handler);
    }
}
