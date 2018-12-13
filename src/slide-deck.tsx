import React from 'react';
import ReactDOM from 'react-dom';
import {
  Application,
  ProvenanceGraphTraverser,
  ProvenanceSlidedeck
} from '@visualstorytelling/provenance-core';
import { SlideDeckVisualization } from '@visualstorytelling/slide-deck-visualization';
import '@visualstorytelling/slide-deck-visualization/dist/bundle.css';
export interface IProps {
  traverser: ProvenanceGraphTraverser;
}

const application: Application = {
  name: 'Jupyter Lab slides',
  version: '1',
};

export class SlideDeck extends React.Component<IProps> {
  private slideDeck: ProvenanceSlidedeck;

  public render() {
    return React.createElement('div');
  }

  public shouldComponentUpdate() {
    return false;
  }

  private get elm() {
    return ReactDOM.findDOMNode(this) as HTMLDivElement;
  }

  public componentWillReceiveProps(props: IProps) {
    this.slideDeck = new ProvenanceSlidedeck(
      application,
      this.props.traverser,
    );
    this.elm.innerHTML = '';
    new SlideDeckVisualization(
      this.slideDeck,
      this.elm,
    );
  }

  public componentDidMount() {
    console.log('will mount');
    this.slideDeck = new ProvenanceSlidedeck(
      application,
      this.props.traverser,
    );
    this.elm.innerHTML = '';
    new SlideDeckVisualization(
      this.slideDeck,
      this.elm,
    );
  }
}