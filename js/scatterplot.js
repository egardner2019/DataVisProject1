// Adapted from https://d3-graph-gallery.com/graph/scatter_buttonXlim.html
class Scatterplot {
  constructor(_config, _attribute1Name, _attribute2Name) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 450,
      containerHeight: _config.containerHeight || 200,
      color: _config.color || "#474242",
      margin: { top: 20, bottom: 50, right: 50, left: 65 },
    };
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

    vis.brushG = vis.svg.append("g").attr("class", "brush");

    vis.brush = d3
      .brush()
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
      .attr(
        "y",
        0 -
          vis.config.margin.left +
          (vis.attribute1Name === "median_household_income" ? 0 : 15)
      )
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
      .style("fill", vis.config.color)
      .style("fill-opacity", (d) => {
        if (filteredCounties.length !== 0) {
          if (
            filteredCounties.find(
              (filteredCounty) => filteredCounty == d.cnty_fips
            )
          )
            return 1;
          else return 0.1;
        } else return 1;
      });

    // The following code was modified from https://observablehq.com/@giorgiofighera/histogram-with-tooltips-and-bars-highlighted-on-mouse-over
    d3.selectAll("circle")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", "2").attr("stroke", "white");
        tooltip.style("visibility", "visible").html(`
          <div class="tooltip-title">${d.display_name}</div>
          <div><b>${
            attributes[vis.attribute1Name].label
          }</b>: ${d[vis.attribute1Name]}</div>
          <div><b>${
            attributes[vis.attribute2Name].label
          }</b>: ${d[vis.attribute2Name]}</div>
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
      const xRange = [vis.x.invert(extent[0][0]), vis.x.invert(extent[1][0])];
      const yRange = [vis.y.invert(extent[1][1]), vis.y.invert(extent[0][1])];

      filteredCounties = countiesData
        .filter((d) => {
          const attr1Val = d[vis.attribute1Name];
          const attr2Val = d[vis.attribute2Name];

          return (
            attr1Val >= yRange[0] &&
            attr1Val <= yRange[1] &&
            attr2Val >= xRange[0] &&
            attr2Val <= xRange[1]
          );
        })
        .map((d) => d.cnty_fips);
    }

    updateVisualizations(vis);
  }
}
