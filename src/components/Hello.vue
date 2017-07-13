<template>
  <div class="dashboard">
    <floorplan :data="history" class="floorplan"></floorplan>
    <chatbox></chatbox>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Your Vue.js PWA',
      history: null
    }
  },
  created () {
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

  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }

  .dashboard {
    height: 100%;
    width: 100%;
    display: flex;

    .floorplan {
      width: 75%;
    }

    .chatbox {
      width: 25%;
    }
  }
</style>
