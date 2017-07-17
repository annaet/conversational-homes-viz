<template>
  <div class="dashboard">
    <floorplan class="floorplan"></floorplan>
    <chatbox></chatbox>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {},
  mounted () {
    this.update()
  },
  methods: {
    update () {
      setTimeout(() => {
        // console.log('set history')
        this.history = [{
          _source: {
            speed: 2
          }
        }]
      }, 500)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
  @import '../assets/settings.scss';

  .dashboard {
    .floorplan {
      width: 75%;
    }

    .chatbox {
      width: 25%;
    }
  }
</style>
