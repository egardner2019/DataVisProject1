// Adapted from https://observablehq.com/@d3/bar-chart/2
class Barchart {
  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 300,
      containerHeight: _config.containerHeight || 200,
      margin: { top: 20, bottom: 50, right: 30, left: 50 },
    };
    this.attributeName = "urban_rural_status";
    this.statusTypes = ["Rural", "Small City", "Suburban", "Urban"];

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

    vis.x = d3
      .scaleBand()
      .domain(vis.statusTypes)
      .range([0, vis.config.containerWidth]);
    vis.xAxis = vis.svg
      .append("g")
      .attr("transform", `translate(0,${vis.config.containerHeight})`)
      .call(d3.axisBottom(vis.x));

    vis.y = d3.scaleLinear().range([vis.config.containerHeight, 0]);
    vis.yAxis = vis.svg.append("g");

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

    // Count the number of counties of each type
    let statusCounts = [0, 0, 0, 0];
    vis.data.forEach(
      (county) =>
        statusCounts[vis.statusTypes.indexOf(county[vis.attributeName])]++
    );

    vis.y.domain([0, Math.max(...statusCounts)]);
    vis.yAxis.call(d3.axisLeft(vis.y));

    vis.svg
      .selectAll("rect.barchart-bar")
      .data(statusCounts)
      .join("rect")
      .attr("class", "barchart-bar")
      .attr("x", (d, index) => vis.x(vis.statusTypes[index]))
      .attr("y", (d) => vis.y(d))
      .attr("width", vis.x.bandwidth())
      .attr("height", (d) => vis.config.containerHeight - vis.y(d))
      .style("fill", attributes[vis.attributeName].color);

    // The following code was modified from https://observablehq.com/@giorgiofighera/histogram-with-tooltips-and-bars-highlighted-on-mouse-over
    d3.selectAll("rect.barchart-bar")
      .on("mouseover", function (event, d) {
        const mouseLoc = d3.pointer(event)[0];
        const bandwidth = vis.x.bandwidth();
        const hoveredStatus = vis.statusTypes.find((type) => {
          const barStart = vis.x(type);
          const barEnd = barStart + bandwidth;
          return barEnd >= mouseLoc && barStart <= mouseLoc;
        });
        d3.select(this).attr("stroke-width", "2").attr("stroke", "white");
        tooltip.style("visibility", "visible").html(`
            <div class="tooltip-title">${d} ${d === 1 ? "County" : "Counties"}</div>
            <div>Status: ${hoveredStatus}</div>
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
      const brushStart = extent[0];
      const brushEnd = extent[1];
      const bandwidth = vis.x.bandwidth();
      const filteredStatuses = [];
      vis.statusTypes.forEach((type) => {
        const barStart = vis.x(type);
        const barEnd = barStart + bandwidth;

        if (barEnd >= brushStart && barStart <= brushEnd)
          filteredStatuses.push(type);
      });

      // Filter the counties
      filteredCounties = countiesData
        .filter((d) => filteredStatuses.includes(d[vis.attributeName]))
        .map((d) => d.cnty_fips);
    }

    updateVisualizations(vis);

    vis.brushG.call(vis.brush.move, null);
  }
}
