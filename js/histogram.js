class Histogram {
  constructor(_config, _data, _attributeName) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 10, bottom: 30, right: 10, left: 50 },
    };
    this.data = _data.filter((d) => d[_attributeName] != -1);
    this.attributeName = _attributeName;

    this.initVis();
  }

  initVis() {
    const vis = this;

    vis.svg = d3
      .select("#histogram1")
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
    vis.xAxis = vis.svg.append("g");

    vis.y = d3.scaleLinear().range([vis.config.containerHeight, 0]);
    vis.yAxis = vis.svg.append("g");

    this.updateVis();
  }

  updateVis() {
    const vis = this;

    vis.data = vis.data.filter((d) => d[vis.attributeName] != -1);

    vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attributeName])]);
    vis.xAxis
      .attr("transform", `translate(0,${vis.config.containerHeight})`)
      .call(d3.axisBottom(vis.x));

    const histogram = d3
      .histogram()
      .value((d) => d[vis.attributeName])
      .domain(vis.x.domain())
      .thresholds(vis.x.ticks(50));

    const bins = histogram(vis.data);

    vis.y.domain([0, d3.max(bins, (d) => d.length)]);
    vis.yAxis.call(d3.axisLeft(vis.y));

    vis.svg
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", 1)
      .attr("transform", (d) => `translate(${vis.x(d.x0)}, ${vis.y(d.length)})`)
      .attr("width", (d) => vis.x(d.x1) - vis.x(d.x0))
      .attr("height", (d) => vis.config.containerHeight - vis.y(d.length))
      .style("fill", "#69b3a2");
  }
}
