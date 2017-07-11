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
      lineData: [
        { 'x': 20, 'y': 20 },
        { 'x': 20, 'y': 0 },
        { 'x': 40, 'y': 0 },
        { 'x': 40, 'y': 20 },
        { 'x': 20, 'y': 20 },
        { 'x': 20, 'y': 20 },
        { 'x': 40, 'y': 10 },
        { 'x': 60, 'y': 40 },
        { 'x': 80, 'y': 5 },
        { 'x': 100, 'y': 60 }
      ],
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
          ],
          lights: [
            {
              position: { 'x': 30, 'y': 10 },
              on: true
            }
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
      let roomMap = {
        'Bathroom': 0,
        'Bedroom': 1,
        'Hallway': 2,
        'Front Room': 3,
        'Cupboard': 4,
        'Building Hallway': 5
      }

      // API.getInstances('room').then(response => {
      //   console.log(response.body)

      //   for (let room of response.body) {
      //     roomMap[room._id] = this.rooms.length
      //     this.rooms.push({
      //       name: room._id,
      //       features: {}
      //     })
      //   }

        // TODO: walls

      API.getInstances('light').then(response => {
        console.log(response.body)

        for (let light of response.body) {
          console.log(light['is located in'])

          let x = light['x position']
          let y = light['y position']

          let i = roomMap[light['is located in']]
          this.rooms[i].lights = this.rooms[i].lights ? this.rooms[i].lights : []
          this.rooms[i].lights.push({
            position: { 'x': x, 'y': y },
            on: true
          })
        }
        console.log(this.rooms)
      })
      // })
      let boundingBox = d3.select('.container').node().getBoundingClientRect()

      var svg = d3.select('svg#floorplan')

      svg.attr('width', +boundingBox.width)
      svg.attr('height', +boundingBox.height)

      var margin = {top: 50, right: 50, bottom: 50, left: 50}
      var width = +boundingBox.width - margin.left - margin.right
      var height = +boundingBox.height - margin.top - margin.bottom
      var g = svg.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          // .data(this.rooms)

      console.log(this.rooms)

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

      let multiplier = Math.min(width / maxX, height / maxY)

      var lineFunction = d3.line()
          .x(function (d) { return d.x * multiplier })
          .y(function (d) { return d.y * multiplier })
      var curveFunction = d3.line()
          .x(function (d) { return d.x * multiplier })
          .y(function (d) { return d.y * multiplier })
          .curve(d3.curveBasis)

      // ROOMS

      let room = g.selectAll('g.room')
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
        // .on('mouseover', function (d) {
        //   console.log(d)
        // })
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

      // LIGHTS

      let radialGradient = g.append('defs')
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

      let light = room.selectAll('path.light')
        .data(function (d) {
          if (d.features.lights) {
            return d.features.lights
          } else {
            return []
          }
        })

      light.enter().append('circle')
        .attr('class', function (d) {
          let classAttr
          if (d.on) {
            classAttr = ' light-on'
          } else {
            classAttr = ' light-off'
          }
          return classAttr
        })
        .attr('cx', function (d) { return d.position.x * multiplier })
        .attr('cy', function (d) { return d.position.y * multiplier })
        .attr('r', 6 * multiplier)
        .style('fill', 'url(#radial-gradient)')

      light.enter().append('circle')
        .attr('class', 'light')
        .attr('cx', function (d) { return d.position.x * multiplier })
        .attr('cy', function (d) { return d.position.y * multiplier })
        .attr('r', 0.5 * multiplier)
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
