# Purpose

A tool to automated as much as possible the prototyping of new web apps. 
Takes in a set of interface specifications from a playbook file and generates the code
needed to represent the interface data.

Currently generates code that uses the following stack:

1. React
2. Mobx
3. Express

## Installation

```console
npm i puppetmaster
```

or globally
```console
npm i -g puppetmaster
```

## Usage

Currently, there the puppetmaster CLI offers the following commands:

1. `new`  - Creates a new project
2. `generate` - Generates the components and models according to the Playbook file

### Initializing a new project

```console
puppetmaster new
```

Creates a new project in the current directory. In order to start using you're new project
edit the `puppetmaster.config.js` file and the `playbook.ts` file.

The config file is responsabile for the tool configuration, eg where to find the playbook file, what UI framework to use etc.

The 'playbook.ts' file is the one that controls which views/entities/routes and server side code gets generated.

### Generating code

```console
puppetmaster generate
```

It reads the playbook file, parses the interfaces defined in it and generates the components/models/routes and server side code.

The playbook file should be a valid Typescript syntax file containing only interface definitions - so no runtime code here, just plain interface definitions( puppetmaster doesn't check it's correctness).

## The `playbook.ts` file

Puppetmaster heavily uses convention over configuration to get you off the ground quickly with prototyping new projects.

As such there are several conventions that are being employed:

* Any interface name that ends with `View` describes a view component. Sub-views are created intelligently for every other interface member type it contains. Primitive types are rendered within a div.
* Any interface name that ends with `Entity` describes a model that should be persisted server side and it should have it's own set of REST-full API endpoints.