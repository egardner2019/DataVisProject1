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

Promise.all([
  d3.json("data/counties-10m.json"),
  d3.csv("data/national_health_data.csv"),
])
  .then((data) => {
    const geoData = data[0];
    const countiesData = data[1];

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

    // Create the charts/graphs
    const histogram1 = new Histogram(
      {
        parentElement: "#histogram1",
      },
      countiesData,
      attribute1Select.value
    );
    const histogram2 = new Histogram(
      {
        parentElement: "#histogram2",
      },
      countiesData,
      attribute2Select.value
    );
    const scatterplot = new Scatterplot(
      {
        parentElement: "#scatterplot",
      },
      countiesData,
      attribute1Select.value,
      attribute2Select.value
    );
    const choropleth1 = new Choropleth(
      {
        parentElement: "#choropleth1",
      },
      geoData,
      attribute1Select.value,
      1
    );
    const choropleth2 = new Choropleth(
      {
        parentElement: "#choropleth2",
      },
      geoData,
      attribute2Select.value,
      2
    );
    // TODO: add work for barchart for urban/rural status

    // Add the onchange events to the dropdowns
    attribute1Select.onchange = (event) => {
      // Update the histogram for the first attribute
      histogram1.attributeName = event.target.value;
      histogram1.updateVis();

      // Update the scatterplot
      scatterplot.attribute1Name = event.target.value;
      scatterplot.updateVis();

      // Update the first choropleth map
      choropleth1.attributeName = event.target.value;
      choropleth1.updateVis();
    };
    attribute2Select.onchange = (event) => {
      // Update the histogram for the second attribute
      histogram2.attributeName = event.target.value;
      histogram2.updateVis();

      // Update the scatterplot
      scatterplot.attribute2Name = event.target.value;
      scatterplot.updateVis();

      // Update the second choropleth map
      choropleth2.attributeName = event.target.value;
      choropleth2.updateVis();
    };

    // TODO: Create the instances of the charts/graphs
  })
  .catch((error) => {
    console.error("Error loading the data", error);
  });
