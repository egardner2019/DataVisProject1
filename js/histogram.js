// Adapted from https://d3-graph-gallery.com/graph/histogram_binSize.html
class Histogram {
  constructor(_config, _attributeName, _num) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 450,
      containerHeight: _config.containerHeight || 200,
      margin: { top: 20, bottom: 50, right: 30, left: 50 },
    };
    this.attributeName = _attributeName;
    this.number = _num;

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

    // Y axis label
    vis.svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - vis.config.margin.left)
      .attr("x", 0 - vis.config.containerHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Counties");

    vis.brushG = vis.svg.append("g").attr("class", "brush");

    vis.brush = d3
      .brushX()
      .extent([
        [0, 0],
        [vis.config.containerWidth, vis.config.containerHeight],
      ])
      // Reset the filtered counties
      .on("start", () => (filteredCounties = []))
      .on("end", (result) => vis.filterBySelection(result, vis));

    this.updateVis();
  }

  updateVis() {
    const vis = this;

    vis.data = countiesData.filter(
      (d) =>
        d[vis.attributeName] != -1 &&
        (filteredCounties.length == 0 ||
          (filteredCounties.length != 0 &&
            filteredCounties.find(
              (filteredCounty) => filteredCounty == d.cnty_fips
            )))
    );

    vis.x.domain([0, d3.max(vis.data, (d) => d[vis.attributeName])]);
    vis.xAxis.call(d3.axisBottom(vis.x));

    const histogram = d3
      .histogram()
      .value((d) => d[vis.attributeName])
      .domain(vis.x.domain())
      .thresholds(vis.x.ticks(50));

    const bins = histogram(vis.data);

    vis.y.domain([0, d3.max(bins, (d) => d.length)]);
    vis.yAxis.call(d3.axisLeft(vis.y));

    // X axis label
    vis.svg
      .selectAll("text.xLabel")
      .data([vis.attributeName])
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
      .text(attributes[vis.attributeName].label);

    vis.svg
      .selectAll(`rect.bar-${this.number}`)
      .data(bins)
      .join("rect")
      .attr("class", `bar-${this.number}`)
      .attr("x", 1)
      .attr("transform", (d) => `translate(${vis.x(d.x0)}, ${vis.y(d.length)})`)
      .attr("width", (d) => vis.x(d.x1) - vis.x(d.x0))
      .attr("height", (d) => vis.config.containerHeight - vis.y(d.length))
      .style("fill", attributes[vis.attributeName].color);

    // The following code was modified from https://observablehq.com/@giorgiofighera/histogram-with-tooltips-and-bars-highlighted-on-mouse-over
    d3.selectAll(`rect.bar-${this.number}`)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", "2").attr("stroke", "white");
        tooltip.style("visibility", "visible").html(`
          <div>${
            d.length
          } ${d.length === 1 ? "County" : "Counties"} Between ${d.x0}-${d.x1}</div>
        `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", "0");
        tooltip.style("visibility", "hidden");
      })
      .on("mousedown", function (event) {
        vis.svg
          .select(".overlay")
          .node()
          .dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles: true,
              clientX: event.clientX,
              clientY: event.clientY,
              pageX: event.pageX,
              pageY: event.pageY,
              view: window,
              layerX: event.layerX,
              layerY: event.layerY,
              cancelable: true,
            })
          );
      });

    vis.brushG.call(vis.brush);
  }

  filterBySelection(result, vis) {
    if (!result.sourceEvent) return; // Only transition after input

    const extent = result.selection;

    if (!extent) {
      // Reset the counties filter (include them all)
      filteredCounties = [];
    } else {
      // Filter the counties
      const range = [vis.x.invert(extent[0]), vis.x.invert(extent[1])];

      filteredCounties = countiesData
        .filter((d) => {
          const attrVal = d[vis.attributeName];

          return attrVal >= range[0] && attrVal <= range[1];
        })
        .map((d) => d.cnty_fips);
    }

    updateVisualizations(vis);

    vis.brushG.call(vis.brush.move, null);
  }
}
