# JupyterLab Notebook Provenance

Tracking changes in Jupyter notebooks in an interactive provenance graph.

## Prerequisites

* [JupyterLab](http://jupyterlab.readthedocs.io/en/latest/getting_started/installation.html)

## Installation

```bash
jupyter labextension install jupyterlab_nbprovenance
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

