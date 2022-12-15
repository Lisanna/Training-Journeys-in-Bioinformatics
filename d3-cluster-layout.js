"use strict";

// ****************** get and reformat data ***************************

d3.tsv("./data/Training_personas.tsv").then(function(data) {
//d3.csv("./data/names.csv").then(function(data) {
    console.log(data)

    let root = d3.stratify()
        .id(function(d) { return d.name; })
        .parentId(function(d) { return d.parent; })
        (data);
    console.log(root)

    // ****************** tree functions ***************************

    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/tree
    function Tree(data, html_id, { // data is either tabular (array of objects) or hierarchy (nested objects)
        path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
        id = Array.isArray(data) ? d => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
        parentId = Array.isArray(data) ? d => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
        children, // if hierarchical data, given a d in data, returns its children
        tree = d3.tree, // layout algorithm (typically d3.tree or d3.cluster)
        sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
        label, // given a node d, returns the display name
        title, // given a node d, returns its hover text
        link, // given a node d, its link (if any)
        linkTarget = "_blank", // the target attribute for links (if any)
        width = 640, // outer width, in pixels
        height, // outer height, in pixels
        r = 8, // radius of nodes
        padding = 1, // horizontal padding for first and last column
        fill = "#999", // fill for nodes
        fillOpacity, // fill opacity for nodes
        stroke = "#555", // stroke for links
        strokeWidth = 1.5, // stroke width for links
        strokeOpacity = 0.4, // stroke opacity for links
        strokeLinejoin, // stroke line join for links
        strokeLinecap, // stroke line cap for links
        halo = "#fff", // color of label halo
        haloWidth = 3, // padding around the labels
        curve = d3.curveBumpX, // curve for the link
    } = {}) {

        // If id and parentId options are specified, or the path option, use d3.stratify
        // to convert tabular data to a hierarchy; otherwise we assume that the data is
        // specified as an object {children} with nested objects (a.k.a. the “flare.json”
        // format), and use d3.hierarchy.
        const root = path != null ? d3.stratify().path(path)(data)
            : id != null || parentId != null ? d3.stratify().id(id).parentId(parentId)(data)
                : d3.hierarchy(data, children);

        // Sort the nodes.
        if (sort != null) root.sort(sort);

        // Compute labels and titles.
        const descendants = root.descendants();
        const L = label == null ? null : descendants.map(d => label(d.data, d));

        // Compute the layout.
        const dx = 10;
        const dy = width / (root.height + padding);
        tree().nodeSize([dx, dy])(root);

        // Center the tree.
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });

        // Compute the default height.
        if (height === undefined) height = x1 - x0 + dx * 2;

        // Use the required curve
        if (typeof curve !== "function") throw new Error(`Unsupported curve`);

        const svg = d3.select(html_id)
            .append("svg")
            .attr("viewBox", [-dy * padding / 2, x0 - dx, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10);

        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", stroke)
            .attr("stroke-opacity", strokeOpacity)
            .attr("stroke-linecap", strokeLinecap)
            .attr("stroke-linejoin", strokeLinejoin)
            .attr("stroke-width", strokeWidth)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.link(curve)
                .x(d => d.y)
                .y(d => d.x));

        svg.selectAll("g.node")


        const node = svg.selectAll("g.node")
            .data(descendants, d => d.data.name)

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('class', d => 'node node-' + d.data.type)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on('click', click);

        nodeEnter.append("circle")
            .attr("fill", d => d.children ? stroke : fill)
            .attr("r", r);

        if (title != null) nodeEnter.append("title")
            .text(d => title(d.data, d));

        if (L) nodeEnter.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .attr("paint-order", "stroke")
            .attr("stroke", halo)
            .attr("stroke-width", haloWidth)
            .text((d, i) => L[i]);

        return svg.node();
    }

    let Treeoptions = {
        label: d => d.data.annotation,
        annotation: d => d.data.annotation,
        title: (d, n) => `${n.ancestors().reverse().map(d => d.data.name).join(".")}`, // hover text
        link: (d, n) => `https://github.com/prefuse/Flare/${n.children ? "tree" : "blob"}/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}${n.children ? "" : ".as"}`,
        sort: (a, b) => d3.descending(a.height, b.height), // reduce link crossings
        tree: d3.cluster,
        width: 1152
    }

    // Collapse the node and all it's children
    /*function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }*/

    // Toggle children on click.
    function click(d) {
        console.log(d)
        // check if clickable
        if (d.children||d._children) {
            console.log(d)
            // toggle child component classification
            this.identifier = d.data.id;
            // toggle children opening/closing
            if (d.children) {
                // closing
                d._children = d.children;
                d.children = null;
            } else {
                // opening
                d.children = d._children;
                d._children = null;
            }
        }
        // ****************** clear and update tree ***************************
        d3.select("#tree-container").selectAll("*").remove();
        Tree(root, "#tree-container", Treeoptions);
    };

    // ****************** build tree ***************************
    // Collapse by default after the second level
    /*if (root.children) {
        root.children.forEach(collapse);
    }*/
    Tree(root, "#tree-container", Treeoptions);
});
