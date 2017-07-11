<template>
  <floorplan :data="history" class="floorplan"></floorplan>
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

.floorplan {
  width: 100%;
}
</style>
