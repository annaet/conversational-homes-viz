<template>
  <div class="container">
    <h2 class="player">Playing as {{store}}</h2>
    <svg id="floorplan"></svg>
    <div class="tooltip">
      <h3 id="room-name"></h3>
      <p id="details"></p>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import API from '../services/api'
import Store from '../services/store'
import Observer from '../services/observer'

export default {
  name: 'floorplan',
  data () {
    return {
      transitionDuration: 1500,
      store: ''
    }
  },
  mounted () {
    this.store = Store.get()
    console.log('floorplan: ' + this.store)
    this.buildFloorplan()
    Observer.registerCallback(() => {
      this.getLightStateChanges()
      this.getDoorStateChanges()
      this.getWindowStateChanges()
    })
  },
  methods: {
    buildFloorplan () {
      let boundingBox = d3.select('.container').node().getBoundingClientRect()

      var svg = d3.select('svg#floorplan')

      svg.attr('width', +boundingBox.width)
      svg.attr('height', +boundingBox.height - 60)

      var margin = {top: 100, right: 100, bottom: 150, left: 100}
      var width = +boundingBox.width - margin.left - margin.right
      var height = +boundingBox.height - margin.top - margin.bottom
      this.floorplan = svg.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      let maxX = 0
      let maxY = 0

      this.roomsGroup = this.floorplan.append('g')
        .attr('class', 'rooms')
      this.doorsGroup = this.floorplan.append('g')
        .attr('class', 'doors')
      this.windowsGroup = this.floorplan.append('g')
        .attr('class', 'windows')
      this.lightsGroup = this.floorplan.append('g')
        .attr('class', 'lights')
      this.camerasGroup = this.floorplan.append('g')
        .attr('class', 'cameras')
      this.sensorsGroup = this.floorplan.append('g')
        .attr('class', 'sensors')

      API.getInstances('room', this.store).then(response => {
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

        this.updateRooms()

        this.getLights()
        this.getDoors()
        this.getWindows()

        API.getInstances('camera', this.store).then(response => {
          this.cameras = response.body
          this.updateCameras()
        })

        API.getInstances('temperature sensor', this.store).then(response => {
          this.temperatureSensors = response.body
          this.updateTemperatureSensors()
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
    getLights () {
      API.getInstances('light', this.store).then(response => {
        this.lights = response.body
        this.lightMap = {}

        for (let i = 0; i < this.lights.length; ++i) {
          let light = this.lights[i]
          light.on = false
          this.lightMap[light._id] = i
        }

        this.getLightStateChanges()
      })
    },
    getLightStateChanges () {
      API.getInstances('light state change', this.store).then(response => {
        let stateChanges = response.body

        for (let sc of stateChanges) {
          let i = this.lightMap[sc['applies to']]
          let light = this.lights[i]
          let ts = parseInt(sc.timestamp, 10)

          if (!light.lastUpdated || light.lastUpdated < ts) {
            light.on = sc['current state'] === 'On'
            light.lastUpdated = ts
          }
        }

        this.updateLights()
      })
    },
    getDoors () {
      API.getInstances('door', this.store).then(response => {
        let newDoors = response.body
        this.doorMap = {}

        newDoors = newDoors.map((door, i) => {
          door.dimensions = JSON.parse(door.dimensions)
          door.open = true
          this.doorMap[door._id + ' Sensor'] = i
          return door
        })

        this.doors = newDoors
        this.getDoorStateChanges()
      })
    },
    getDoorStateChanges () {
      API.getInstances('door sensor state change', this.store).then(response => {
        let stateChanges = response.body

        for (let sc of stateChanges) {
          let i = this.doorMap[sc['applies to']]
          let door = this.doors[i]
          let ts = parseInt(sc.timestamp, 10)

          if (!door.lastUpdated || door.lastUpdated <= ts) {
            door.open = sc['current state'] === 'Open'
            door.lastUpdated = ts
          }
        }

        this.updateDoors()
      })
    },
    getWindows () {
      API.getInstances('window', this.store).then(response => {
        let newWindows = response.body
        this.windowMap = {}

        newWindows = newWindows.map((window, i) => {
          window.dimensions = JSON.parse(window.dimensions)
          window.open = true
          this.windowMap[window._id + ' Sensor'] = i
          return window
        })

        this.windows = newWindows
        this.getWindowStateChanges()
      })
    },
    getWindowStateChanges () {
      API.getInstances('window sensor state change', this.store).then(response => {
        let stateChanges = response.body

        for (let sc of stateChanges) {
          let i = this.windowMap[sc['applies to']]
          let window = this.windows[i]
          let ts = parseInt(sc.timestamp, 10)

          if (!window.lastUpdated || window.lastUpdated <= ts) {
            window.open = sc['current state'] === 'Open'
            window.lastUpdated = ts
          }
        }

        this.updateWindows()
      })
    },
    mouseenter (d) {
      let tooltip = d3.select('.tooltip')
        .style('display', 'inline')

      tooltip.select('#room-name')
        .text(d._id)

      tooltip.select('#details')
        .text(() => {
          if (typeof d.on === 'boolean') {
            return d.on ? 'Turned on' : 'Turned off'
          }
          if (typeof d.open === 'boolean') {
            return d.open ? 'Open' : 'Closed'
          }
        })
    },
    mouseleave (d) {
      d3.select('.tooltip')
        .style('display', 'none')
    },
    mousemove (d) {
      d3.select('.tooltip')
        .style('left', (d3.event.pageX + 20) + 'px')
        .style('top', (d3.event.pageY + 20) + 'px')
    },
    updateRooms () {
      // Create group for each room
      let room = this.roomsGroup.selectAll('g.room')
        .data(this.rooms, d => { return d._id })

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
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)

      room.exit().remove()
    },
    updateDoors () {
      let door = this.doorsGroup.selectAll('g.door-group')
        .data(this.doors, d => { return d._id })

      let isHorizontal = d => {
        return d.dimensions[0][1] === d.dimensions[1][1]
      }

      let isFacingAway = (d, horizontal) => {
        if (horizontal) {
          return d.dimensions[0][1] <= this.center[1]
        } else {
          return d.dimensions[0][0] <= this.center[0]
        }
      }

      let getTransform = d => {
        if (d.open) {
          let horizontal = isHorizontal(d)
          let facingAway = isFacingAway(d, horizontal)

          let multiplier = facingAway ? -1 : 1
          let i = horizontal ? 0 : 1
          let xLength = multiplier * +(d.dimensions[1][i] - d.dimensions[0][i]) * this.multiplier / 2
          let yLength = multiplier * -(d.dimensions[1][i] - d.dimensions[0][i]) * this.multiplier / 2

          xLength = horizontal ? multiplier * 50 + '%' : xLength + 'px'
          yLength = horizontal ? yLength + 'px' : multiplier * 50 + '%'

          return 'rotate(90deg) translateX(' + xLength + ') translateY(' + yLength + ')'
        } else {
          return 'rotate(0deg) translateX(0) translateY(0)'
        }
      }

      let getDoorPathCurve = d => {
        if (d.open) {
          let horizontal = isHorizontal(d)
          let facingAway = isFacingAway(d, horizontal)

          let multiplier = facingAway ? 1 : -1
          let i = facingAway ? 1 : 0
          let j = 1 - i
          let doorPath = [d.dimensions[i]]

          if (horizontal) {
            doorPath.push([d.dimensions[i][0] - 1.5 * multiplier, d.dimensions[j][1] - (3.5 * multiplier)])
            doorPath.push([d.dimensions[j][0], d.dimensions[i][1] - (5 * multiplier)])
          } else {
            doorPath.push([d.dimensions[i][0] + 3.5 * multiplier, d.dimensions[j][1] + (3.5 * multiplier)])
            doorPath.push([d.dimensions[j][0] + (5 * multiplier), d.dimensions[j][1]])
          }

          return this.curveFunction(doorPath)
        }
      }

      // UPDATE
      door.selectAll('path.door')
        // .transition().duration(this.transitionDuration) // doesn't work
        .style('transform', getTransform)

      door.selectAll('path.door-path')
        .transition().duration(this.transitionDuration)
        .attr('d', d => {
          return getDoorPathCurve(d)
        })

      // ENTER
      door = door.enter()
        .append('g')
        .attr('class', d => {
          let classes = 'door-group'
          if (d.open) {
            classes += ' door-open'
          } else {
            classes += ' door-closed'
          }
          return classes
        })
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)

      door.append('path')
        .attr('class', 'door-floor')
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })

      door.append('path')
        .attr('class', 'door')
        .style('transform-origin', 'center')
        .style('transform', getTransform)
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })

      door.append('path')
        .attr('class', 'door-path')
        .attr('d', d => {
          return getDoorPathCurve(d)
        })

      // ENTER + UPDATE
      door = door.merge(door)

      // EXIT
      door.exit().remove()
    },
    updateWindows () {
      let window = this.windowsGroup.selectAll('g.window-group')
        .data(this.windows, d => { return d._id })

      // UPDATE
      window.selectAll('path.window')
        .transition().duration(this.transitionDuration)
        .style('stroke', d => {
          return d.open ? '#e4e4e4' : '#4c4c4c'
        })

      // ENTER
      window = window.enter()
        .append('g')
        .attr('class', 'window-group')
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)

      window.append('path')
        .attr('class', 'window')
        .attr('d', d => {
          return this.lineFunction(d.dimensions)
        })
        .style('stroke', d => {
          return d.open ? '#e4e4e4' : '#4c4c4c'
        })

      // ENTER + UPDATE
      window = window.merge(window)

      // EXIT
      window.exit().remove()
    },
    updateLights () {
      let light = this.lightsGroup.selectAll('g.light-group')
        .data(this.lights, d => { return d._id })

      // UPDATE
      light.selectAll('circle.light-glow')
        .transition().duration(this.transitionDuration)
        .attr('r', d => {
          return d.on ? 6 * this.multiplier : 0
        })

      // ENTER
      light = light.enter()
        .append('g')
        .attr('class', 'light-group')
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)

      light.append('circle')
        .attr('class', 'light-glow')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .style('fill', 'url(#radial-gradient)')
        .attr('r', 0)
        .transition().duration(this.transitionDuration)
        .attr('r', d => {
          return d.on ? 6 * this.multiplier : 0
        })

      light.append('circle')
        .attr('class', 'light')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 0.5 * this.multiplier)

      // ENTER + UPDATE
      light = light.merge(light)

      // EXIT
      light.exit().remove()
    },
    updateCameras () {
      let camera = this.camerasGroup.selectAll('g.camera-group')
        .data(this.cameras, d => { return d._id })

      camera = camera.enter()
        .append('g')
        .attr('class', 'camera-group')
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)
        .merge(camera)

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
    },
    updateTemperatureSensors () {
      let sensor = this.sensorsGroup.selectAll('g.sensor-group')
        .data(this.temperatureSensors, d => { return d._id })

      sensor = sensor.enter()
        .append('g')
        .attr('class', 'sensor-group')
        .on('mouseenter', this.mouseenter)
        .on('mousemove', this.mousemove)
        .on('mouseleave', this.mouseleave)
        .merge(sensor)

      sensor.append('circle')
        .attr('class', 'sensor')
        .attr('cx', d => { return parseInt(d['x position'], 10) * this.multiplier })
        .attr('cy', d => { return parseInt(d['y position'], 10) * this.multiplier })
        .attr('r', 0.3 * this.multiplier)
    }
  }
}
</script>

<!-- styling for the component -->
<style lang='scss'>
  @import '../assets/settings.scss';

  .container {
    display: inline-block;
    height: 100%;

    .player {
      text-align: left;
      margin: 20px 0 0 24px;
    }
  }

  .tooltip {
    position: absolute;
    z-index: 10;
    background: white;
    border: 2px solid black;
    display: none;
    padding: 0 10px;
  }

  path {
    fill: none;
    stroke: $dark;
    stroke-width: 2px;
  }

  .walls {
    fill: $floor;
  }

  .door {
    stroke: $door;
    stroke-width: 4px;
  }

  .door-path {
    stroke: $dotted;
    stroke-width: 1px;
    stroke-dasharray: 2, 2;
  }

  .door-floor {
    stroke: $floor;
    stroke-width: 1.5px;
  }

  .window {
    stroke-width: 12px;
  }

  .light {
    fill: white;
    stroke: $dark;
    stroke-width: 2px;
  }

  .camera {
    fill: $camera;
    stroke: $dark;
    stroke-width: 2px;
  }

  .camera-view {
    stroke: $dotted;
    stroke-dasharray: 4, 2;
    stroke-width: 1px;
  }

  .sensor {
    fill: $sensor;
    stroke: $dark;
    stroke-width: 2px;
  }
</style>
