# JupyterLab Notebook Provenance

Tracking user interactions in Jupyter notebooks in an interaction provenance graph.

In following two short screencasts presenting an early prototype with the provenance tracking in action.

<p align="center"><img width="100%" src="https://github.com/caleydo/jupyterlab_nbprovenance/blob/assets/provenance-tracking.gif" alt="Provenance Tracking"></p>

After jumping back to an earlier state the user can continue with a different path of the analysis, which results in additional branches in the provenance graph.

<p align="center"><img width="100%" src="https://github.com/caleydo/jupyterlab_nbprovenance/blob/assets/provenance-branching.gif" alt="Provenance Branching"></p>


## Prerequisites

* [JupyterLab](http://jupyterlab.readthedocs.io/en/latest/getting_started/installation.html)

## Installation

```bash
jupyter labextension install @visualstorytelling/jupyterlab_nbprovenance
```

You can also use this with the Docker base images:

```Dockerfile
FROM jupyter/minimal-notebook
RUN jupyter labextension install @visualstorytelling/jupyterlab_nbprovenance
CMD start.sh jupyter lab
```

## Development

For a development install (requires npm version 4 or later, yarn, and jupyterlab), do the following in the repository directory:

```bash

yarn install
jupyter labextension link .
```

Then build the files and start Jupyter Lab:

```bash
yarn watch
# in new window
jupyter lab --port=8889 --watch
```

Reload the page to see new code changes.

### Testing

First install cypress:

```bash
npm install -g cypress@1.0.3
```

Then you can run the tests:

```bash
cypress run
```

Or open Cypress for an interactive experience:

```bash
cypress open
```

## Docker

If you have Docker version >= 17.09.0-ce installed, you can also do all of the above with:

```bash
docker-compose up lab
```

Then you can run the tests with:

```bash
docker-compose run --rm test
```

If you change the installed packages, you have to remove the existing volume and rebuild the images:

```bash
docker-compose down -v
docker-compose build
```
