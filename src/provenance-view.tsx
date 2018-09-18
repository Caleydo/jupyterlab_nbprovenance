'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NbProvenanceModel } from './model';
import { ProvenanceGraphTree } from '@visualstorytelling/provenance-react';
import { ApplicationShell } from '@jupyterlab/application';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { notebookModelCache } from '.';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';

/**
 * The main view for the notebook provenance.
 */
export class NbProvenanceView extends Widget {

    private model: NbProvenanceModel | null = null;

    constructor(shell: ApplicationShell) {
        super();

        this.addClass('jp-nbprovenance-view');

        shell.currentChanged.connect((shell: ApplicationShell) => {
            const currentWidget = shell.currentWidget;
            if (currentWidget === null || (currentWidget instanceof NotebookPanel) === false) {
                this.model = null;
                this.update();
                return;
            }

            const notebook: INotebookModel = (currentWidget as NotebookPanel).content.model;
            this.model = (notebookModelCache.has(notebook)) ? notebookModelCache.get(notebook)! : null;
            console.log(notebook, this.model);
            this.update();
        });
    }

    protected onUpdateRequest(msg: Message): void {
        ReactDOM.render(
            <div className='jp-nbprovenance-graph'>
                <ProvenanceGraphTreeComponent model={this.model}></ProvenanceGraphTreeComponent>
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
    model: NbProvenanceModel | null;
}

interface IState {
    //
}

class ProvenanceGraphTreeComponent extends React.Component<IProps, IState> {
    constructor(public props: IProps, context?: any) {
        super(props, context);
    }

    render() {
        if (this.props.model) {
            return <ProvenanceGraphTree traverser={this.props.model.traverser} />;
        }
        return <div>No provenance graph available. No active notebook!</div>;
    }
}
