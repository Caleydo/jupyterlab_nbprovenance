'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NotebookProvenance } from './notebook-provenance';
import { ProvenanceTreeVisualizationReact } from '@visualstorytelling/provenance-tree-visualization-react';
import { ApplicationShell } from '@jupyterlab/application';
import { NotebookPanel, Notebook, INotebookTracker } from '@jupyterlab/notebook';
import { notebookModelCache } from '.';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import './action-listener';
import { ProvenanceGraphTraverser } from '@visualstorytelling/provenance-core';

import '../style/side-bar.css';
import { SlideDeck } from './slide-deck';

/**
 * The main view for the notebook provenance.
 */
export class SideBar extends Widget {

    private notebookProvenance: NotebookProvenance | null = null;

    constructor(shell: ApplicationShell, nbTracker: INotebookTracker) {
        super();

        this.addClass('jp-nbprovenance-view');

        nbTracker.widgetAdded.connect((_: INotebookTracker, nbPanel: NotebookPanel) => {
            // wait until the session with the notebook model is ready
            nbPanel.session.ready.then(() => {
                // update provenance information only for the current widget
                if (shell.currentWidget instanceof NotebookPanel && nbPanel === shell.currentWidget) {
                    const notebook: Notebook = nbPanel.content;
                    this.notebookProvenance = (notebookModelCache.has(notebook)) ? notebookModelCache.get(notebook)! : null;
                    this.update();
                }
            });
        });

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
            return (
                <div>
                    <span>Provenance of `{(this.props.notebookProvenance.notebook.parent! as NotebookPanel).context.path}`</span>
                    <ProvenanceTreeVisualizationReact traverser={this.props.notebookProvenance.traverser as ProvenanceGraphTraverser} />
                    <SlideDeck traverser={this.props.notebookProvenance.traverser as ProvenanceGraphTraverser} />
                </div>
            );
        }
        return <div className='jp-nbprovenance-nograph'>No provenance available for the current tab.</div>;
    }
}
