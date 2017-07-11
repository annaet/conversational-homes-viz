<template>
  <div id="about">
    <p>
      When you have a great story about how your product or service was built to change lives, share it. The "About Us" page is a great place for it to live, too. Good stories humanize your brand, providing context and meaning for your product. What’s more, good stories are sticky -- which means people are more likely to connect with them and pass them on.
    </p>

    <div id="map" class="map"></div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import API from '../services/api'

export default {
  name: 'about',
  data () {
    return {
      zoom: 13,
      center: [51.941196, 4.512291],
      url: 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5uYWV0IiwiYSI6ImNpcXdkeTFhdzAwMnBodG5qZnhsa3pwNzgifQ.sLCy6WaD4pURO1ulOFoVCg',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
    }
  },
  created () {
    this.fetchClients()
  },
  mounted () {
    this.setUpMap()
  },
  methods: {
    fetchClients () {
      return API.getClients().then(response => {
        console.log(response)
      })
    },
    setUpMap () {
      var map = L.map('map').setView(this.center, this.zoom)

      L.tileLayer(this.url, {
        attribution: this.attribution,
        maxZoom: 18
      }).addTo(map)

      var redMarker = L.AwesomeMarkers.icon({
        icon: 'coffee',
        prefix: 'fa',
        markerColor: 'red'
      })

      L.marker([51.941196, 4.512291], {icon: redMarker}).addTo(map)
    }
  }
}
</script>

<!-- styling for the component -->
<style lang='scss' scoped>
@import "~leaflet/dist/leaflet.css";
@import "~leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
@import "~font-awesome/css/font-awesome.css";

@import '../assets/settings.scss';

#about {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $primary-color;
  margin-top: 60px;

  .map {
    height: 300px;
  }
}
</style>
