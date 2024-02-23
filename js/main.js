const attributes = {
  poverty_perc: {
    label: "Poverty (%)",
    color: "#d49b2a",
  },
  median_household_income: {
    label: "Median Household Income ($)",
    color: "#b5732b",
  },
  education_less_than_high_school_percent: {
    label: "Education Less Than High School (%)",
    color: "#cfac38",
  },
  air_quality: {
    label: "Air Quality",
    color: "#8bbd53",
  },
  park_access: {
    label: "Park Access",
    color: "#367d3e",
  },
  percent_inactive: {
    label: "Inactive (%)",
    color: "#6539a3",
  },
  percent_smoking: {
    label: "Smoking (%)",
    color: "#8c2ed9",
  },
  urban_rural_status: {
    label: "Urban/Rural Status",
    color: "#c447b6",
  },
  elderly_percentage: {
    label: "Elderly (%)",
    color: "#b8407e",
  },
  number_of_hospitals: {
    label: "Number of Hospitals",
    color: "#156796",
  },
  number_of_primary_care_physicians: {
    label: "Number of Primary Care Physicians",
    color: "#072e73",
  },
  percent_no_heath_insurance: {
    label: "No Health Insurance (%)",
    color: "#4650c7",
  },
  percent_high_blood_pressure: {
    label: "High Blood Pressure (%)",
    color: "#941038",
  },
  percent_coronary_heart_disease: {
    label: "Coronary Heart Disease (%)",
    color: "#b5070a",
  },
  percent_stroke: {
    label: "Stroke (%)",
    color: "#800f09",
  },
  percent_high_cholesterol: {
    label: "High Cholesterol (%)",
    color: "#a12727",
  },
};

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden");

let filteredCounties, geoData, countiesData;
let histogram1,
  histogram2,
  barchart1,
  barchart2,
  scatterplot,
  choropleth1,
  choropleth2;
let updateVisualizations;

Promise.all([
  d3.json("data/counties-10m.json"),
  d3.csv("data/national_health_data.csv"),
])
  .then((data) => {
    geoData = data[0];
    countiesData = data[1];

    const attributesAvailable = [
      "cnty_fips",
      "display_name",
      "poverty_perc",
      "median_household_income",
      "education_less_than_high_school_percent",
      "air_quality",
      "park_access",
      "percent_inactive",
      "percent_smoking",
      "urban_rural_status",
      "elderly_percentage",
      "number_of_hospitals",
      "number_of_primary_care_physicians",
      "percent_no_heath_insurance",
      "percent_high_blood_pressure",
      "percent_coronary_heart_disease",
      "percent_stroke",
      "percent_high_cholesterol",
    ];

    // Process the countiesData
    countiesData.forEach((d) => {
      // Convert to numbers
      d.cnty_fips = +d.cnty_fips;
      d.display_name = d.display_name
        .replaceAll('"', "")
        .replaceAll("(", "")
        .replaceAll(")", "");
      d.poverty_perc = +d.poverty_perc;
      d.median_household_income = +d.median_household_income;
      d.education_less_than_high_school_percent =
        +d.education_less_than_high_school_percent;
      d.air_quality = +d.air_quality;
      d.park_access = +d.park_access;
      d.percent_inactive = +d.percent_inactive;
      d.percent_smoking = +d.percent_smoking;
      d.elderly_percentage = +d.elderly_percentage;
      d.number_of_hospitals = +d.number_of_hospitals;
      d.number_of_primary_care_physicians =
        +d.number_of_primary_care_physicians;
      d.percent_no_heath_insurance = +d.percent_no_heath_insurance;
      d.percent_high_blood_pressure = +d.percent_high_blood_pressure;
      d.percent_coronary_heart_disease = +d.percent_coronary_heart_disease;
      d.percent_stroke = +d.percent_stroke;
      d.percent_high_cholesterol = +d.percent_high_cholesterol;
    });

    // Combine the datasets
    geoData.objects.counties.geometries.forEach((geo) => {
      countiesData.forEach((county) => {
        // If the IDs match, add all of the attributes data
        if (geo.id == county.cnty_fips) {
          attributesAvailable.forEach((attribute) => {
            geo.properties[attribute] = county[attribute];
          });
        }
      });
    });

    const attribute1Select = document.getElementById("attribute1Select");
    const attribute2Select = document.getElementById("attribute2Select");

    Object.entries(attributes).forEach((attribute, index) => {
      // Add all of the options to the 2 attribute selectors
      const opt1 = document.createElement("option");
      const opt2 = document.createElement("option");
      opt1.value = opt2.value = attribute[0];
      opt1.text = opt2.text = attribute[1].label;
      attribute1Select.add(opt1);
      attribute2Select.add(opt2);

      // Select the second option within the selector for attribute 2
      if (index == 1) attribute2Select.value = attribute[0];
    });

    filteredCounties = [];

    updateVisualizations = (currentVis) => {
      const selectedAttr1 = attribute1Select.value;
      const selectedAttr2 = attribute2Select.value;

      // Update all of the visualizations' content
      if (selectedAttr1 === "urban_rural_status") barchart1.updateVis();
      if (selectedAttr2 === "urban_rural_status") barchart2.updateVis();
      if (selectedAttr1 !== "urban_rural_status") histogram1.updateVis();
      if (selectedAttr2 !== "urban_rural_status") histogram2.updateVis();
      scatterplot.updateVis();
      choropleth1.updateVis();
      choropleth2.updateVis();

      // Modify the brushes of the visualizations
      histogram1.brushG.call(histogram1.brush.move, null);
      histogram2.brushG.call(histogram2.brush.move, null);
      if (currentVis != barchart1)
        barchart1.brushG.call(barchart1.brush.move, null);
      if (currentVis != barchart2)
        barchart2.brushG.call(barchart2.brush.move, null);
      if (currentVis != scatterplot)
        scatterplot.brushG.call(scatterplot.brush.move, null);
      if (currentVis != choropleth1)
        choropleth1.brushG.call(choropleth1.brush.move, null);
      if (currentVis != choropleth2)
        choropleth2.brushG.call(choropleth2.brush.move, null);
    };

    // Create the charts/graphs
    histogram1 = new Histogram(
      {
        parentElement: "#histogram1",
      },
      attribute1Select.value,
      1
    );
    histogram2 = new Histogram(
      {
        parentElement: "#histogram2",
      },
      attribute2Select.value,
      2
    );
    barchart1 = new Barchart({ parentElement: "#barchart1" });
    barchart2 = new Barchart({ parentElement: "#barchart2" });
    scatterplot = new Scatterplot(
      {
        parentElement: "#scatterplot",
      },
      attribute1Select.value,
      attribute2Select.value
    );
    choropleth1 = new Choropleth(
      {
        parentElement: "#choropleth1",
      },
      attribute1Select.value,
      1
    );
    choropleth2 = new Choropleth(
      {
        parentElement: "#choropleth2",
      },
      attribute2Select.value,
      2
    );

    // Add the onchange events to the dropdowns
    attribute1Select.onchange = (event) => {
      const selectedAttr = event.target.value;
      const histogram1Element = document.getElementById("histogram1");
      const barchart1Element = document.getElementById("barchart1");
      if (selectedAttr === "urban_rural_status") {
        histogram1Element.style.display = "none";
        barchart1Element.style.display = "block";
      } else {
        histogram1Element.style.display = "block";
        barchart1Element.style.display = "none";
      }

      // Update the histogram for the first attribute
      histogram1.attributeName = selectedAttr;

      // Update the scatterplot
      scatterplot.attribute1Name = selectedAttr;

      // Update the first choropleth map
      choropleth1.attributeName = selectedAttr;

      updateVisualizations(null);
    };
    attribute2Select.onchange = (event) => {
      const selectedAttr = event.target.value;
      const histogram2Element = document.getElementById("histogram2");
      const barchart2Element = document.getElementById("barchart2");
      if (selectedAttr === "urban_rural_status") {
        histogram2Element.style.display = "none";
        barchart2Element.style.display = "block";
      } else {
        histogram2Element.style.display = "block";
        barchart2Element.style.display = "none";
      }

      // Update the histogram for the second attribute
      histogram2.attributeName = selectedAttr;

      // Update the scatterplot
      scatterplot.attribute2Name = selectedAttr;

      // Update the second choropleth map
      choropleth2.attributeName = selectedAttr;

      updateVisualizations(null);
    };
  })
  .catch((error) => {
    console.error("Error loading the data", error);
  });
