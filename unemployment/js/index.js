(function(){
  const config = {w: 960, h: 600, range: 10, legend: {w: 30, h: 10, bands: 9}}

  const container = d3.select('.container');

  const popover = container.append('div');

  const svg = container.append('svg')
    .attr('width', config.w)
    .attr('height', config.h)
    .attr('viewBox','0 0 '+config.w+' '+config.h)
    .attr('preserveAspectRatio','xMidYMid')
    .on('click', stopped, true);

  const features = svg.append('g');

  let active = d3.select(null);

  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on('zoom', zoomed);

  const unemployment = d3.map();

  const path = d3.geoPath();

  const x = d3.scaleLinear()
    .domain([1, config.range])
    .rangeRound([0,config.legend.w * config.legend.bands])

  // const color = d3.scaleThreshold()
  //   .domain(d3.range(2, config.range))
  //   .range(d3.schemeReds[9]);

  const color = d3.scaleThreshold()
    .domain(d3.range(2, config.range))
    .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
    "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43"]);

  d3.select('button')
    .on('click', reset);

  d3.json('data/us.json')
    .then(d => us = d)
    .then(function(){
      d3.csv('data/unemployment.csv', d => {
        unemployment.set(d.id, {rate: parseFloat(d.rate), cnty: d.cnty, state: d.state, pop: d3.format(',')(d.pop)});
      })
      .then(() => {
        buildMap(us, unemployment);
        addLegend();
      })
    });

  function buildMap(us, unemployment) {
    features.append('g')
      .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append('path')
      .attr('fill', d => {
        d.details = unemployment.get(d.id);
        return color(d.details.rate);
      })
      .attr('d', path)
      .attr('class', 'county')
      .on('click', zoomToBounds)
    .append('title')
      .text(d => d.details.rate + '%');

    features.append('path')
      .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
      .attr('class', 'states')
      .attr('d', path);
  }

  function addLegend() {
    const legend = svg.append('g')
      .attr('class', 'key')
      .attr('transform', `translate(${config.w / 2},${config.h - 40})`);

    legend.append('rect')
      .attr('width', config.legend.w * config.range)
      .attr('height', config.legend.h * 5)
      .attr('y', -config.legend.h * 2)
      .attr('x', -config.legend.w / 2)
      .attr('class', 'legend-bg')

    legend.selectAll('rect.band')
      .data(color.range().map(d => {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
      .enter().append('rect')
        .attr('height', config.legend.h)
        .attr('x', (d, i) => config.legend.w * i)
        .attr('width', config.legend.w)
        .attr('fill', d => color(d[0]));

    legend.append('text')
      .attr('class', 'caption')
      .attr('x', x.range()[0])
      .attr('y', -6)
      .attr('fill', 'crimson')
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold')
      .text('Unemployment Rate');

    legend.call(
      d3.axisBottom(x)
        .tickSize(config.legend.h + 2)
        .tickFormat((x, i) => i ? x : x + '%')
        .tickValues(color.domain())
      )
      .select('.domain')
      .remove();
  }

  function zoomed() {
    features.attr('transform', d3.event.transform);
  }

  function zoomToBounds(d) {

    if (active.node() === this) return reset();
    active.classed('active', false);
    active = d3.select(this).classed('active', true);

    popover
      .classed('popover', true)
      .selectAll('*').remove();

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = Math.max(1, Math.min(15, 0.9 / Math.max(dx / config.w, dy / config.h))),
        translate = [config.w / 2 - scale * x, config.h / 2 - scale * y];

    features
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale));

    popover.append('h4')
      .text(d.details.cnty+', '+d.details.state);
    popover.append('p')
      .text('pop. '+d.details.pop);
    popover.append('h2')
      .text(d.details.rate+'%');
  }

  function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
  }

  function reset() {
    active.classed('active', false);
    active = d3.select(null);
    features.transition()
      .duration(1000)
      .call(zoom.transform, d3.zoomIdentity);
    popover.classed('popover', false).selectAll('*').remove();
  }

  features.call(zoom);
})();
