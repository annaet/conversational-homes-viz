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

      // ROOMS
      let rooms = this.floorplan.append('g')
        .attr('class', 'rooms')

      // DOORS
      let doors = this.floorplan.append('g')
        .attr('class', 'doors')

      // WINDOWS
      let windows = this.floorplan.append('g')
        .attr('class', 'windows')

      // LIGHTS
      let lights = this.floorplan.append('g')
        .attr('class', 'lights')

      // CAMERAS
      let cameras = this.floorplan.append('g')
        .attr('class', 'cameras')

      API.getInstances('room').then(response => {
        let newRooms = response.body

        newRooms = newRooms.map(room => {
          room.dimensions = JSON.parse(room.dimensions)

          // Find max X and Y dimensions
          for (let dimension of room.dimensions) {
            if (dimension[0] > maxX) {
              maxX = dimension[0]
            }
            if (dimension[1] > maxY) {
              maxY = dimension[1]
            }
          }

          this.center = [maxX / 2, maxY / 2]

          // Add first dimension to the array to close the polygon when drawing
          room.dimensions.push(room.dimensions[0])
          return room
        })
        console.log(this.center)

        this.rooms = newRooms

        // Calculate multiplier to calculate transformations
        this.multiplier = Math.min(width / maxX, height / maxY)

        this.lineFunction = d3.line()
            .x(d => { return d[0] * this.multiplier })
            .y(d => { return d[1] * this.multiplier })
        this.curveFunction = d3.line()
            .x(d => { return d[0] * this.multiplier })
            .y(d => { return d[1] * this.multiplier })
            .curve(d3.curveBasis)

        this.updateRooms(rooms)

        API.getInstances('light').then(response => {
          this.lights = response.body
          this.updateLights(lights)
        })

        API.getInstances('door').then(response => {
          let newDoors = response.body

          newDoors = newDoors.map(door => {
            door.dimensions = JSON.parse(door.dimensions)
            return door
          })

          this.doors = newDoors

          this.updateDoors(doors)
        })

        API.getInstances('window').then(response => {
          let newWindows = response.body

          newWindows = newWindows.map(window => {
            window.dimensions = JSON.parse(window.dimensions)
            return window
          })

          this.windows = newWindows

          this.updateWindows(windows)
        })

        API.getInstances('camera').then(response => {
          this.cameras = response.body
          this.updateCameras(cameras)
        })
      })

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
    },
    updateRooms (rooms) {
      // Create group for each room
      let room = rooms.selectAll('g.room')
        .data(this.rooms)

      // ENTER
      room = room.enter()
        .append('g')
        .attr('class', function (d) {
          return 'room ' + d._id
        })
        .merge(room)

      room.append('path')
        .attr('class', 'walls')
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })

      room.exit().remove()
    },
    updateDoors (doors) {
      let door = doors.selectAll('path.door')
        .data(this.doors)

      door = door.enter()
        .append('g')
        .attr('class', 'door-group')
        .merge(door)

      door.append('path')
        .attr('class', 'door closed-door')
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })

      door.append('path')
        .attr('class', 'door open-door')
        .attr('d', d => {
          let horizontal = d.dimensions[0][1] === d.dimensions[1][1]
          let facingAway

          if (horizontal) {
            facingAway = d.dimensions[0][1] <= this.center[1]
          } else {
            facingAway = d.dimensions[0][0] <= this.center[0]
          }

          let multiplier = facingAway ? 1 : -1
          let openDoorDimensions = [d.dimensions[0]]

          if (horizontal) {
            openDoorDimensions.push([d.dimensions[0][0], d.dimensions[1][1] - (5 * multiplier)])
          } else {
            openDoorDimensions.push([d.dimensions[0][0] + (5 * multiplier), d.dimensions[0][1]])
          }

          return this.lineFunction(openDoorDimensions)
        })

      door.append('path')
        .attr('class', 'door-path')
        .attr('d', d => {
          let horizontal = d.dimensions[0][1] === d.dimensions[1][1]
          let facingAway

          if (horizontal) {
            facingAway = d.dimensions[0][1] <= this.center[1]
          } else {
            facingAway = d.dimensions[0][0] <= this.center[0]
          }

          let multiplier = facingAway ? 1 : -1
          let doorPath = [d.dimensions[1]]

          if (horizontal) {
            doorPath.push([d.dimensions[1][0] - 1.5, d.dimensions[0][1] - (3.5 * multiplier)])
            doorPath.push([d.dimensions[0][0], d.dimensions[1][1] - (5 * multiplier)])
          } else {
            doorPath.push([d.dimensions[1][0] + 3.5, d.dimensions[0][1] + (3.5 * multiplier)])
            doorPath.push([d.dimensions[0][0] + (5 * multiplier), d.dimensions[0][1]])
          }

          return this.curveFunction(doorPath)
        })
    },
    updateWindows (windows) {
      let window = windows.selectAll('g.window')
        .data(this.windows)

      window.enter()
        .append('path')
        .attr('class', 'window')
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })
    },
    updateLights (lights) {
      let light = lights.selectAll('g.light-group')
        .data(this.lights)

      // ENTER
      light = light.enter()
        .append('g')
        .attr('class', 'light-group')
        .merge(light)

      light.append('circle')
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

      light.append('circle')
        .attr('class', 'light')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 0.5 * this.multiplier)

      // EXIT
      light.exit().remove()
    },
    updateCameras (cameras) {
      let camera = cameras.selectAll('g.camera-group')
        .data(this.cameras)

      camera = camera.enter()
        .append('g')
        .attr('class', 'camera-group')

      camera.append('path')
        .attr('class', 'camera-view')
        .attr('d', d => {
          let cx = parseInt(d['x position'])
          let cy = parseInt(d['y position'])
          let orientation = parseInt(d['orientation'])

          let r0 = (orientation - 40) * (Math.PI / 180)
          let r1 = (orientation + 40) * (Math.PI / 180)

          let startX = -1.5 * Math.sin(-r0) + cx
          let startY = -1.5 * Math.cos(-r0) + cy

          let endX = -1.5 * Math.sin(-r1) + cx
          let endY = -1.5 * Math.cos(-r1) + cy

          let cameraView = [[startX, startY], [cx, cy], [endX, endY]]

          return this.lineFunction(cameraView)
        })

      camera.append('circle')
        .attr('class', 'camera')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 0.3 * this.multiplier)
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

  .door {
    stroke: #cc993c;
    stroke-width: 4px;
  }

  .door-path {
    stroke-width: 1px;
    stroke-dasharray: 2, 2;
  }

  .window {
    stroke: #e4e4e4;
    stroke-width: 12px;
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

  .camera {
    fill: #ff4545;
    stroke: black;
    stroke-width: 2px;
  }

  .camera-view {
    stroke: #888888;
    stroke-dasharray: 4, 2;
    stroke-width: 1px;
  }
</style>
