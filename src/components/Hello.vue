<template>
  <div class="dashboard">
    <floorplan class="floorplan"></floorplan>
    <chatbox></chatbox>
  </div>
</template>

<script>
import router from '../router'
import Store from '../services/store'

export default {
  name: 'home',
  mounted () {
    this.store = Store.get()
    if (this.store === 'DEFAULT') {
      router.push('/')
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
