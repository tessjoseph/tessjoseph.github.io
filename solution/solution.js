// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
        d.Engagement = +d.Engagement;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 30, bottom: 30, left: 40};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#box-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add scales     
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Number of Likes");

    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return {min, q1, median, q3, max};
    };

    const quantilesBySpecies = d3.rollup(data, rollupFunction, d => d.Platform);
//Groups data by platform and calculates quantiles (min, q1, median, q3, max) using the rollupFunction for each platform
    quantilesBySpecies.forEach((quantiles, Platform) => {
        const x = xScale(Platform); 
//gets x-position for current platform
        const boxWidth = xScale.bandwidth();
//gets the width for each platform
        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth/2)
            .attr("x2", x + boxWidth/2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Draw box
        svg.append("rect")
            .attr("x", x + boxWidth/4)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth/2)
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Draw median line
        svg.append("line")
            .attr("x1", x + boxWidth/4)
            .attr("x2", x + boxWidth*3/4)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    });
});

// Calculate average likes by platform and post type
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Calculate averages
    const averages = d3.rollup(data, 
        v => d3.mean(v, d => d.Likes),
        d => d.Platform,
        d => d.PostType
    );

    // Convert to array format
    const avgData = [];
    averages.forEach((platformData, platform) => {
        platformData.forEach((avg, postType) => {
            avgData.push({
                Platform: platform,
                PostType: postType,
                AverageLikes: avg
            });
        });
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 150, bottom: 30, left: 40};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#bar-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    const x0 = d3.scaleBand()
        .domain([...new Set(avgData.map(d => d.Platform))])
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain([...new Set(avgData.map(d => d.PostType))])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(avgData, d => d.AverageLikes)])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain([...new Set(avgData.map(d => d.PostType))])
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    

    // Add scales x0 and y     
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Average Number of Likes");

    // Group container for bars
    const barGroups = svg.selectAll("bar")
        .data(avgData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.Platform)},0)`);

    // Draw bars
    barGroups.append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AverageLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AverageLikes))
        .attr("fill", d => color(d.PostType));

    // Add the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 150}, ${margin.top})`);

    const types = [...new Set(avgData.map(d => d.PostType))];
 
    types.forEach((type, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(type));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(type)
            .attr("alignment-baseline", "middle");
    });
});

// Calculate daily average likes
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Calculate daily averages
    const dailyAverages = d3.rollup(data, 
        v => d3.mean(v, d => d.Likes),
        d => d.Date.split(' ')[0] // Get just the date part
    );

    // Convert to array format
    const timeData = Array.from(dailyAverages, ([Date, AverageLikes]) => ({
        Date,
        AverageLikes
    }));

    // Sort by date
    timeData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // Define the dimensions and margins for the SVG
    const margin = {top: 20, right: 30, bottom: 30, left: 40};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#line-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes  
    const xScale = d3.scalePoint()
        .domain(timeData.map(d => d.Date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(timeData, d => d.AverageLikes)])
        .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Average Number of Likes");

    // Draw the line and path. Remember to use curveNatural. 
    const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d.AverageLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(timeData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
});
