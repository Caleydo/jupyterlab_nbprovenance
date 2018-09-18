'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NotebookProvenance } from './notebook-provenance';
import { ProvenanceTreeVisualizationReact } from '@visualstorytelling/provenance-tree-visualization-react';
import { ApplicationShell } from '@jupyterlab/application';
import { NotebookPanel, Notebook } from '@jupyterlab/notebook';
import { notebookModelCache } from '.';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import './action-listener';
import { ProvenanceGraphTraverser } from '@visualstorytelling/provenance-core';

/**
 * The main view for the notebook provenance.
 */
export class SideBar extends Widget {

    private notebookProvenance: NotebookProvenance | null = null;

    constructor(shell: ApplicationShell) {
        super();

        this.addClass('jp-nbprovenance-view');

        shell.currentChanged.connect((shell: ApplicationShell) => {
            const currentWidget = shell.currentWidget;
            if (currentWidget === null || (currentWidget instanceof NotebookPanel) === false) {
                this.notebookProvenance = null;
                this.update();
                return;
            }

            const notebook: Notebook = (currentWidget as NotebookPanel).content;
            this.notebookProvenance = (notebookModelCache.has(notebook)) ? notebookModelCache.get(notebook)! : null;
            this.update();
        });
    }

    protected onUpdateRequest(msg: Message): void {
        ReactDOM.render(
            <div className='jp-nbprovenance-graph'>
                <ProvenanceGraphTreeComponent notebookProvenance={this.notebookProvenance}></ProvenanceGraphTreeComponent>
            </div>,
            this.node
        );
    }

    /**
     * Called after the widget is attached to the DOM
     *
     * Make sure the widget is rendered, even if the model has not changed.
     */
    protected onAfterAttach(msg: Message): void {
        this.update();
    }

}

interface IProps {
    notebookProvenance: NotebookProvenance | null;
}

interface IState {
    //
}

class ProvenanceGraphTreeComponent extends React.Component<IProps, IState> {
    constructor(public props: IProps, context?: any) {
        super(props, context);
    }

    render() {
        if (this.props.notebookProvenance) {
            return <ProvenanceTreeVisualizationReact traverser={this.props.notebookProvenance.traverser as ProvenanceGraphTraverser} />;
        }
        return <div>No provenance graph available. No active notebook!</div>;
    }
}
