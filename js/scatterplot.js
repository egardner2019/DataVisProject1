class Scatterplot {
  constructor(_config, _data, _attribute1Name, _attribute2Name) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 450,
      containerHeight: _config.containerHeight || 450,
      color: _config.color || "#474242",
      margin: { top: 20, bottom: 50, right: 30, left: 50 },
    };
    this.data = _data;
    this.attribute1Name = _attribute1Name;
    this.attribute2Name = _attribute2Name;

    this.initVis();
  }

  initVis() {
    const vis = this;

    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr(
        "width",
        vis.config.containerWidth +
          vis.config.margin.left +
          vis.config.margin.right
      )
      .attr(
        "height",
        vis.config.containerHeight +
          vis.config.margin.top +
          vis.config.margin.bottom
      )
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.x = d3.scaleLinear().range([0, vis.config.containerWidth]);
    vis.xAxis = vis.svg
      .append("g")
      .attr("transform", `translate(0,${vis.config.containerHeight})`);

    vis.y = d3.scaleLinear().range([vis.config.containerHeight, 0]);
    vis.yAxis = vis.svg.append("g");

    this.updateVis();
  }

  updateVis() {
    const vis = this;

    vis.data = vis.data.filter(
      (d) => d[vis.attribute1Name] != -1 && d[vis.attribute2Name] != -1
    );

    vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attribute2Name])]);
    vis.xAxis.call(d3.axisBottom(vis.x));

    vis.y.domain([0, d3.max(vis.data, (d) => d[vis.attribute1Name])]);
    vis.yAxis.call(d3.axisLeft(vis.y));

    // X axis label
    vis.svg
      .selectAll("text.xLabel")
      .data([vis.attribute2Name])
      .join("text")
      .attr("class", "xLabel")
      .attr(
        "transform",
        "translate(" +
          vis.config.containerWidth / 2 +
          " ," +
          (vis.config.containerHeight + 35) +
          ")"
      )
      .style("text-anchor", "middle")
      .text(attributes[vis.attribute2Name].label);

    // Y axis label
    vis.svg
      .selectAll("text.yLabel")
      .data([vis.attribute1Name])
      .join("text")
      .attr("class", "yLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - vis.config.margin.left)
      .attr("x", 0 - vis.config.containerHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(attributes[vis.attribute1Name].label);

    vis.svg
      .selectAll("circle.point")
      .data(vis.data)
      .join("circle")
      .attr("class", "point")
      .attr("cx", (d) => vis.x(d[vis.attribute2Name]))
      .attr("cy", (d) => vis.y(d[vis.attribute1Name]))
      .attr("r", 2)
      .style("fill", vis.config.color);
  }
}
