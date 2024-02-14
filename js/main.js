d3.csv("data/national_health_data.csv")
  .then((data) => {
    // Process the data
    data.forEach((d) => {
      // Convert to numbers
      d.cnty_fips = +d.cnty_fips;
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

    const attribute1 = document.getElementById("attribute1");
    const attribute2 = document.getElementById("attribute2");

    // Create the charts/graphs
    const histogram1 = new Histogram(
      {
        parentElement: "#histogram1",
      },
      data,
      attribute1.value
    );
    const histogram2 = new Histogram(
      {
        parentElement: "#histogram2",
      },
      data,
      attribute2.value
    );

    // Add the onchange events to the dropdowns
    attribute1.onchange = (event) => {
      // Update the histogram for the first attribute
      histogram1.attributeName = event.target.value;
      histogram1.updateVis();
    };
    attribute2.onchange = (event) => {
      // Update the histogram for the second attribute
      histogram2.attributeName = event.target.value;
      histogram2.updateVis();
    };

    // TODO: Create the instances of the charts/graphs
  })
  .catch((error) => {
    console.error("Error loading the data", error);
  });
