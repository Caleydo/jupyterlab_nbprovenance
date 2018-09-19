import * as nb from '@jupyterlab/notebook';
import { notebookModelCache } from '.';
import { NotebookProvenance } from './notebook-provenance';
import { Action } from '@visualstorytelling/provenance-core';
import { findAction } from './provenance-tracker';

const handler = {
    apply: function (target: any, thisArg: any, argumentsList: any) {
        console.log('Proxy called via apply :', target.name, argumentsList);
        const nbprov: NotebookProvenance | undefined = notebookModelCache.get(argumentsList[0]);
        if (nbprov && !nbprov.pauseTracking) {
            try {
                const action: Action = findAction(target.name, argumentsList);
                nbprov.tracker.applyAction(action, true);

            } catch (e) {
                // TODO handle error
            }
        }
        return target.apply(thisArg, argumentsList);
    }
};

export const originalNotebookActions: any = {};

console.log('Adding proxy around NotebookActions from @jupyterlab/notebook');

const proxiedActions = new Set([
    // 'changeCellType', handled in activeCellChanged
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
        originalNotebookActions[prop] = (nb.NotebookActions as any)[prop];
        (nb.NotebookActions as any)[prop] = new Proxy(originalNotebookActions[prop], handler);
    }
}
