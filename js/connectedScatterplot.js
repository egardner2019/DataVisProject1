// Adapted from https://d3-graph-gallery.com/graph/connectedscatter_multi.html
class ConnectedScatterplot {
  constructor(_config, _attributeName) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 450,
      containerHeight: _config.containerHeight || 200,
      color: _config.color || "#474242",
      margin: { top: 20, bottom: 50, right: 50, left: 65 },
    };
    this.attributeName = _attributeName;

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

    vis.colorScale = d3
      .scaleOrdinal()
      .domain(["Rural", "Small City", "Suburban", "Urban"])
      .range(d3.schemeSet2);

    // Add legend
    vis.legend = vis.svg.append("g").attr("class", "legend");
    const legend = vis.legend
      .selectAll(".legend")
      .data(["Rural", "Small City", "Suburban", "Urban"])
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        (d, index) =>
          `translate(${vis.config.containerWidth - 40},${index * 22})`
      );
    legend
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d) => vis.colorScale(d))
      .style("stroke", (d) => vis.colorScale(d));
    legend
      .append("text")
      .attr("x", 22)
      .attr("y", 14)
      .text((d) => d);

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

    const lineData = [
      { groupName: "Rural", points: [] },
      { groupName: "Small City", points: [] },
      { groupName: "Suburban", points: [] },
      { groupName: "Urban", points: [] },
    ];

    // Reformat the data
    bins.map((bin, binIndex) => {
      lineData.forEach(
        (group) =>
          (group.points[binIndex] = { x0: bin.x0, x1: bin.x1, counties: [] })
      );
      Object.entries(bin).forEach((county) => {
        // Add each county at this x value to the correct type group
        if (county[0] != "x0" && county[0] != "x1")
          lineData[
            lineData.findIndex(
              (group) => group.groupName === county[1]["urban_rural_status"]
            )
          ].points[binIndex].counties.push(county[1]);
      });
    });

    console.log(lineData);

    // Find the maximum Y value for the scatterplot
    const allPointsArrays = lineData.flatMap((group) => group.points || []);
    const maxYValue = allPointsArrays.reduce((maxLength, pointsArray) => {
      return Math.max(maxLength, pointsArray.counties.length);
    }, 0);

    vis.y.domain([0, maxYValue]);
    vis.yAxis.call(d3.axisLeft(vis.y));

    // Y axis label
    vis.svg
      .selectAll("text.yLabel")
      .data([vis.attributeName])
      .join("text")
      .attr("class", "yLabel")
      .attr("transform", "rotate(-90)")
      .attr(
        "y",
        0 -
          vis.config.margin.left +
          (vis.attributeName === "median_household_income" ? 0 : 15)
      )
      .attr("x", 0 - vis.config.containerHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Counties");

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

    console.log(lineData);
    // Add lines
    vis.line = d3
      .line()
      .x((d, index) => vis.x((d.x0 + d.x1) / 2))
      .y((d) => vis.y(d.counties.length));
    vis.svg
      .selectAll("path.line")
      .data(lineData)
      .join("path")
      .attr("class", "line")
      .attr("d", (d) => vis.line(d.points))
      .attr("stroke", (d) => vis.colorScale(d.groupName))
      .style("stroke-width", 4)
      .style("fill", "none");

    // Add points
    vis.svg
      .selectAll(".linePoint")
      .data(lineData)
      .join("g")
      .attr("class", "linePoint")
      .style("fill", (d) => vis.colorScale(d.groupName))
      .selectAll("circle.connectedPoint")
      .data((d) => d.points)
      .join("circle")
      .attr("class", "connectedPoint")
      .attr("cx", (d, index) => vis.x((d.x0 + d.x1) / 2))
      .attr("cy", (d) => vis.y(d.counties.length))
      .attr("r", 5);

    // The following code was modified from https://observablehq.com/@giorgiofighera/histogram-with-tooltips-and-bars-highlighted-on-mouse-over
    d3.selectAll("circle.connectedPoint")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", "2").attr("stroke", "white");
        tooltip.style("visibility", "visible").html(`
            <div>${
              d.counties.length
            } counties at approximately ${Math.round(vis.x.invert(d3.pointer(event)[0]) * 100) / 100}</div>
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
      // TODO: MODIFY THIS LOGIC SO IT WORKS FOR THE CONNECTED SCATTERPLOT

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
