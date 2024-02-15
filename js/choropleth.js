class Choropleth {
  constructor(_config, _data, _attributeName, _num) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || { top: 10, right: 10, bottom: 10, left: 10 },
      color: _config.color,
      tooltipPadding: 10,
      legendBottom: 20,
      legendLeft: 50,
      legendRectHeight: 12,
      legendRectWidth: 300,
    };
    this.data = _data;
    this.number = _num;
    this.attributeName = _attributeName;
    this.us = _data;
    this.active = d3.select(null);

    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("class", "center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // vis.svg
    //   .append("rect")
    //   .attr("class", "background center-container")
    //   .attr("height", vis.config.containerWidth) //height + margin.top + margin.bottom)
    //   .attr("width", vis.config.containerHeight) //width + margin.left + margin.right)
    //   .on("click", vis.clicked);
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.projection = d3
      .geoAlbersUsa()
      .translate([vis.width / 2, vis.height / 2])
      .scale(vis.width);

    vis.path = d3.geoPath().projection(vis.projection);

    vis.g = vis.svg
      .append("g")
      .attr("class", "center-container center-items us-state")
      .attr(
        "transform",
        "translate(" +
          vis.config.margin.left +
          "," +
          vis.config.margin.top +
          ")"
      )
      .attr(
        "width",
        vis.width + vis.config.margin.left + vis.config.margin.right
      )
      .attr(
        "height",
        vis.height + vis.config.margin.top + vis.config.margin.bottom
      );

    // vis.counties
    //   .on("mousemove", (d, event) => {
    //     console.log(d);
    //     console.log(event);
    //     const popDensity = d.properties.pop
    //       ? `<strong>${d.properties.pop}</strong> pop. density per km<sup>2</sup>`
    //       : "No data available";
    //     d3
    //       .select("#tooltip")
    //       .style("display", "block")
    //       .style("left", event.pageX + vis.config.tooltipPadding + "px")
    //       .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
    //                       <div class="tooltip-title">${d.properties.name}</div>
    //                       <div>${popDensity}</div>
    //                     `);
    //   })
    //   .on("mouseleave", () => {
    //     d3.select("#tooltip").style("display", "none");
    //   });

    vis.g
      .append("path")
      .datum(topojson.mesh(vis.us, vis.us.objects.states, (a, b) => a !== b))
      .attr("id", "state-borders")
      .attr("d", vis.path);

    vis.linearGradient = vis.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", `legend-gradient-${vis.number}`);

    // Append legend
    vis.legend = vis.chart
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${vis.config.legendLeft},${
          vis.height - vis.config.legendBottom
        })`
      );

    vis.legendRect = vis.legend
      .append("rect")
      .attr("width", vis.config.legendRectWidth)
      .attr("height", vis.config.legendRectHeight);

    this.updateVis();
  }

  updateVis() {
    const vis = this;

    const filteredData = 
      vis.data.objects.counties.geometries.filter(
        (d) => d.properties[vis.attributeName] != -1
      );

    vis.legendTitle = vis.legend
      .append("text")
      .attr("class", "legend-title")
      .attr("dy", ".35em")
      .attr("y", -10)
      .text(attributes[vis.attributeName].label);

    const attributeExtent = d3.extent(
      filteredData,
      (d) => d.properties[vis.attributeName]
    );

    vis.colorScale = d3
      .scaleLinear()
      .domain(attributeExtent)
      .range(["#ffffff", vis.config.color])
      .interpolate(d3.interpolateHcl);

    vis.counties = vis.g
      .append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(topojson.feature(vis.us, vis.us.objects.counties).features)
      .enter()
      .append("path")
      .attr("d", vis.path)
      // .attr("class", "county-boundary")
      .attr("fill", (d) => {
        if (
          d.properties[vis.attributeName] &&
          d.properties[vis.attributeName] != -1
        ) {
          return vis.colorScale(d.properties[vis.attributeName]);
        } else {
          return "url(#lightstripe)";
        }
      });

    vis.legendStops = [
      {
        color: "#ffffff",
        value: attributeExtent[0],
        offset: 0,
      },
      {
        color: vis.config.color,
        value: attributeExtent[1],
        offset: 100,
      },
    ];

    // Add legend labels
    vis.legend
      .selectAll(".legend-label")
      .data(vis.legendStops)
      .join("text")
      .attr("class", "legend-label")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("y", 20)
      .attr("x", (d, index) => {
        return index == 0 ? 0 : vis.config.legendRectWidth;
      })
      .text((d) => Math.round(d.value * 10) / 10);

    // Update gradient for legend
    vis.linearGradient
      .selectAll("stop")
      .data(vis.legendStops)
      .join("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    vis.legendRect.attr("fill", `url(#legend-gradient-${vis.number})`);
  }
}
