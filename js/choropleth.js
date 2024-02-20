// Adapted from the UBC InfoVis course materials/code
class Choropleth {
  constructor(_config, _attributeName, _num) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 475,
      margin: _config.margin || { top: 5, right: 5, bottom: 10, left: 5 },
      color: attributes[_attributeName].color,
      tooltipPadding: 10,
      legendBottom: 20,
      legendLeft: 50,
      legendRectHeight: 12,
      legendRectWidth: 300,
    };
    this.us = geoData;
    this.number = _num;
    this.attributeName = _attributeName;
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
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

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

    vis.svg
      .append("path")
      .datum(topojson.mesh(vis.us, vis.us.objects.states, (a, b) => a !== b))
      .attr("id", "state-borders")
      .attr("d", vis.path)
      .attr(
        "transform",
        "translate(" +
          vis.config.margin.left +
          "," +
          vis.config.margin.top +
          ")"
      );

    vis.linearGradient = vis.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", `legend-gradient-${vis.number}`);

    // Append legend
    vis.legend = vis.chart
      .append("g")
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

    vis.brushG = vis.g.append("g").attr("class", "brush");

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

    vis.config.color = attributes[vis.attributeName].color;

    const filteredData = geoData.objects.counties.geometries.filter(
      (d) => d.properties[vis.attributeName] != -1
    );

    vis.legendTitle = vis.legend
      .selectAll(".legend-title")
      .data([vis.attributeName])
      .join("text")
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
      .join("path")
      .attr("d", vis.path)
      .attr("fill", (d) => {
        // TODO: simplify this to remove duplication
        if (filteredCounties.length !== 0) {
          if (
            filteredCounties.find(
              (filteredCounty) => filteredCounty == d.properties.cnty_fips
            )
          ) {
            if (
              d.properties[vis.attributeName] &&
              d.properties[vis.attributeName] != -1
            ) {
              return vis.colorScale(d.properties[vis.attributeName]);
            } else {
              return "url(#lightstripe)";
            }
          } else {
            return "gray";
          }
        } else {
          if (
            d.properties[vis.attributeName] &&
            d.properties[vis.attributeName] != -1
          ) {
            return vis.colorScale(d.properties[vis.attributeName]);
          } else {
            return "url(#lightstripe)";
          }
        }
      });

    vis.counties
      .on("mouseover", function (event, d) {
        const attrVal = d.properties[vis.attributeName];
        d3.select(this).attr("stroke-width", "2").attr("stroke", "white");
        tooltip.style("visibility", "visible").html(`
          <div class="tooltip-title">${d.properties.display_name}</div>
          ${
            attrVal == -1
              ? "<div><i>No data available</i></div>"
              : `<div><b>${
                  attributes[vis.attributeName].label
                }</b>: ${attrVal}</div>`
          }
          
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
              layerX: event.layerX,
              layerY: event.layerY,
              cancelable: true,
              view: window,
            })
          );
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

    vis.brushG.call(vis.brush);
  }

  filterBySelection(result, vis) {
    if (!result.sourceEvent) return; // Only transition after input

    const extent = result.selection;

    if (!extent) {
      // Reset the counties filter (include them all)
      filteredCounties = [];
    } else {
      filteredCounties = topojson
        .feature(vis.us, vis.us.objects.counties)
        .features.filter((d) => {
          // Use the path generator to create a bounding box for each county
          const boundingBox = vis.path.bounds(d);
          const xMin = boundingBox[0][0];
          const yMin = boundingBox[0][1];
          const xMax = boundingBox[1][0];
          const yMax = boundingBox[1][1];

          // Check if the bounding box intersects with the selection box
          return (
            xMax >= extent[0][0] &&
            xMin <= extent[1][0] &&
            yMax >= extent[0][1] &&
            yMin <= extent[1][1]
          );
        })
        .map((d) => d.properties.cnty_fips);
    }

    updateVisualizations(vis);
  }
}
