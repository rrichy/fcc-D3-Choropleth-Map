const EDUCATION_DATA = d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json');
const COUNTY_DATA = d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json');

const SVG_DIM = {W: 960, H: 600};
const PADDING = {TOP: 0};

const LEGEND_DIM = {W:24, H: 220, LEFT: 900, TOP: 260};

Promise.all([EDUCATION_DATA, COUNTY_DATA]).then(([education, topology]) => {
    const wrapper = d3.select('body').append('div').attr('id', 'wrapper');

    // title
    wrapper.append('h1')
        .text('United States Educational Attainment')
        .attr('id', 'title');

    // // description
    wrapper.append('p')
        .text('Percentage of adults age 25 and older with a bachelor\'s degree or higher (2010-2014)')
        .attr('id', 'description');
    
    // svg
    const svg = wrapper.append('svg')
        .attr('width', SVG_DIM.W)
        .attr('height', SVG_DIM.H);

    const tooltip = wrapper.append('div').attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', 'yellow')
        .style('padding', '8px')
        .style('opacity', 0);

    // legend
    const extent = d3.extent(education.map(a => a.bachelorsOrHigher));

    const color = d3.scaleThreshold()
        .domain(d3.range(...extent, (extent[1] - extent[0]) / 8))
        .range(d3.schemeBlues[9]);

    const legendScale = d3.scaleLinear()
        .domain(extent.reverse())
        .range([0, LEGEND_DIM.H]);

    const legend = svg.append('g')
        .attr('id', 'legend');

    const legendAxis = d3.axisRight(legendScale)
        .tickFormat(d => Math.round(d) + '%')
        .tickValues(color.domain())
        .tickSizeOuter(0);

    legend.append('g')
        .attr('transform', 'translate(' + LEGEND_DIM.LEFT + ',' + LEGEND_DIM.TOP + ')')
        .call(legendAxis);

    legend.selectAll('rect')
        .data((d3.range(...extent, (extent[1] - extent[0]) / 8)))
        .enter()
        .append('rect')
        .attr('class', 'legend-rect')
        .attr('width', LEGEND_DIM.W)
        .attr('height', LEGEND_DIM.H / 8)
        .attr('fill', d => color(d - .1))
        .attr('y', d => legendScale(d) + LEGEND_DIM.TOP)
        .attr('x', LEGEND_DIM.LEFT - LEGEND_DIM.W)

    // draw
    const topo = topojson.feature(topology, topology.objects.counties);
    
    const counties = svg.append('g')
        .attr('class', 'counties')
        .attr('transform', 'translate(0,' + PADDING.TOP + ')');
        
    counties.selectAll('path')
        .data(topo.features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('data-fips', d => d.id)
        .attr('data-education', d => {
            let state = education.find(a => a.fips === d.id)
            if(state) return state.bachelorsOrHigher
            else return ''
        })
        .attr('d', d3.geoPath())
        .attr('fill', d => {
            let state = education.find(a => a.fips === d.id)
            if(state) return color(state.bachelorsOrHigher)
            else return ''
        })
        .on('mouseover', (e, d) => {
            let state = education.find(a => a.fips === d.id);
            tooltip
                .attr('data-education', () => {
                    if(state) return state.bachelorsOrHigher;
                    else return ''
                })
                .html(state.area_name + ', ' + state.state + ': ' + state.bachelorsOrHigher + '%')
                .style('top', (e.pageY - 32) + 'px')
                .style('left', e.pageX + 'px')
                .style('opacity', .8);
        })
        .on('mouseout', () => {
            tooltip
                .style('opacity', 0)
                .html('');
        });

    wrapper.append('p')
        .html('Source: <a href=\"https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx\">USDA Economic Research Service</a>')
});

