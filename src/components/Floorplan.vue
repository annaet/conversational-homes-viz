<template>
  <div class="container">
    <svg id='floorplan'></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import API from '../services/api'

export default {
  name: 'floorplan',
  data () {
    return {
      floorplan: null,
      multiplier: 1,
      lights: [{
        'is located in': 'Bathroom',
        'x position': 30,
        'y position': 10,
        'on': true
      }],
      rooms: [{
        name: 'Bathroom',
        features: {
          walls: [
            { 'x': 20, 'y': 0 },
            { 'x': 40, 'y': 0 },
            { 'x': 40, 'y': 20 },
            { 'x': 20, 'y': 20 },
            { 'x': 20, 'y': 0 }
          ],
          door: {
            door: [
              { 'x': 35, 'y': 20 },
              { 'x': 35, 'y': 15 }
            ],
            path: [
              { 'x': 35, 'y': 15 },
              { 'x': 38.5, 'y': 16.5 },
              { 'x': 40, 'y': 20 }
            ]
          },
          window: [
            { 'x': 35, 'y': 0 },
            { 'x': 35, 'y': 1 },
            { 'x': 25, 'y': 1 },
            { 'x': 25, 'y': 0 },
            { 'x': 35, 'y': 0 }
          ]
        }
      }, {
        name: 'Bedroom',
        features: {
          walls: [
            { 'x': 40, 'y': 0 },
            { 'x': 80, 'y': 0 },
            { 'x': 80, 'y': 40 },
            { 'x': 40, 'y': 40 },
            { 'x': 40, 'y': 0 }
          ]
        }
      }, {
        name: 'Hallway',
        features: {
          walls: [
            { 'x': 10, 'y': 20 },
            { 'x': 40, 'y': 20 },
            { 'x': 40, 'y': 30 },
            { 'x': 10, 'y': 30 },
            { 'x': 10, 'y': 20 }
          ]
        }
      }, {
        name: 'Front Room',
        features: {
          walls: [
            { 'x': 10, 'y': 30 },
            { 'x': 40, 'y': 30 },
            { 'x': 40, 'y': 50 },
            { 'x': 10, 'y': 50 },
            { 'x': 10, 'y': 30 }
          ]
        }
      }, {
        name: 'Cupboard',
        features: {
          walls: [
            { 'x': 40, 'y': 40 },
            { 'x': 50, 'y': 40 },
            { 'x': 50, 'y': 50 },
            { 'x': 40, 'y': 50 },
            { 'x': 40, 'y': 40 }
          ]
        }
      }, {
        name: 'Building Hallway',
        features: {
          walls: [
            { 'x': 0, 'y': 20 },
            { 'x': 10, 'y': 20 },
            { 'x': 10, 'y': 50 },
            { 'x': 0, 'y': 50 },
            { 'x': 0, 'y': 20 }
          ]
        }
      }]
    }
  },
  mounted () {
    this.buildFloorplan()
  },
  methods: {
    buildFloorplan () {
      let boundingBox = d3.select('.container').node().getBoundingClientRect()

      var svg = d3.select('svg#floorplan')

      svg.attr('width', +boundingBox.width)
      svg.attr('height', +boundingBox.height)

      var margin = {top: 50, right: 50, bottom: 50, left: 50}
      var width = +boundingBox.width - margin.left - margin.right
      var height = +boundingBox.height - margin.top - margin.bottom
      this.floorplan = svg.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      let maxX = 0
      let maxY = 0

      for (let room of this.rooms) {
        let walls = room.features.walls
        for (let wall of walls) {
          if (wall.x > maxX) {
            maxX = wall.x
          }
          if (wall.y > maxY) {
            maxY = wall.y
          }
        }
      }

      this.multiplier = Math.min(width / maxX, height / maxY)

      API.getInstances('light').then(response => {
        this.lights = response.body
        this.updateRooms()
      })

      var lineFunction = d3.line()
          .x(d => { return d.x * this.multiplier })
          .y(d => { return d.y * this.multiplier })
      var curveFunction = d3.line()
          .x(d => { return d.x * this.multiplier })
          .y(d => { return d.y * this.multiplier })
          .curve(d3.curveBasis)

      // ROOMS

      let room = this.floorplan.selectAll('g.room')
        .data(this.rooms)

      room = room.enter().append('g')
        .attr('class', function (d) {
          return 'room ' + d.name
        })
        .merge(room)

      room.exit().remove()

      // WALLS

      let walls = room.selectAll('path.walls')
        .data(function (d) { return [d.features.walls] })

      walls.enter().append('path')
        .attr('class', 'walls')
        .attr('d', lineFunction)
        .merge(walls)

      // DOORS

      let door = room.selectAll('path.door')
        .data(function (d) {
          if (d.features.door) {
            return [d.features.door]
          } else {
            return []
          }
        })

      door.enter().append('path')
        .attr('class', 'door')
        .attr('d', function (d) {
          return lineFunction(d.door)
        })
      door.enter().append('path')
        .attr('class', 'door-path')
        .attr('d', function (d) {
          return curveFunction(d.path)
        })

      // WINDOWS

      let window = room.selectAll('path.window')
        .data(function (d) {
          if (d.features.window) {
            return [d.features.window]
          } else {
            return []
          }
        })

      window.enter().append('path')
        .attr('class', 'window')
        .attr('d', lineFunction)

      // RADIAL GRADIENT

      let radialGradient = this.floorplan.append('defs')
        .append('radialGradient')
          .attr('id', 'radial-gradient')

      radialGradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', 'white')

      radialGradient.append('stop')
          .attr('offset', '50%')
          .attr('stop-color', 'white')
          .attr('stop-opacity', '.6')

      radialGradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', 'white')
          .attr('stop-opacity', '0')

      this.updateRooms()
    },
    updateRooms () {
      // LIGHTS
      let allLights = this.floorplan.append('g')
        .attr('class', 'lights')

      // Create group for each light fitting
      let lightGroups = allLights.selectAll('g.light-group')
        .data(this.lights)

      // ENTER
      lightGroups = lightGroups.enter()
        .append('g')
        .attr('class', 'light-group')
        .merge(lightGroups)

      lightGroups.append('circle')
        .attr('class', function (d) {
          let classAttr
          if (d.on) {
            classAttr = 'light-on'
          } else {
            classAttr = 'light-off'
          }
          return classAttr
        })
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 6 * this.multiplier)
        .style('fill', 'url(#radial-gradient)')

      lightGroups.append('circle')
        .attr('class', 'light')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 0.5 * this.multiplier)

      // EXIT
      lightGroups.exit().remove()
    }
  }
}
</script>

<!-- styling for the component -->
<style lang='scss'>
  .container {
    display: inline-block;
    height: 100%;
  }

  path {
    fill: none;
    stroke: black;
    stroke-width: 2px;
  }

  .walls {
    fill: #efd697; //#ad9a6b;
  }

  .door-path {
    stroke-width: 1px;
    stroke-dasharray: 2, 2;
  }

  .window {
    fill: white;
  }

  .light {
    fill: white;
    stroke: black;
    stroke-width: 2px;
  }

  .lights-on {
    fill: #efd697;
  }

  .light-off {
    display: none;
  }
</style>
