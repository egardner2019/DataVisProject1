d3.csv("data/national_health_data.csv")
  .then((data) => {
    console.log("Data loading complete. Work with dataset.", data);

    // TODO: Process the data
    data.forEach((d) => {

    });

    // TODO: Create the instances of the charts/graphs

  })
  .catch((error) => {
    console.error("Error loading the data", error);
  });
