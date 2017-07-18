<template>
  <div class="dashboard">
    <span class="label">What's your name?</span>
    <input class="user-input"
           type="text"
           v-model="user"
           v-on:keyup.enter="play()"></input>
    <span class="error" v-on:click="playPrevious()">
      {{ error }}
    </span>
    <button class="button"
            :class="{ disabled: !user.length }"
            v-on:click="play()">
            Play
    </button>
  </div>
</template>

<script>
import router from '../router'
import API from '../services/api'
import Store from '../services/store'

export default {
  name: 'login',
  data () {
    return {
      user: '',
      error: ''
    }
  },
  methods: {
    play () {
      if (this.user.length) {
        API.getStore(this.user).then(response => {
          this.error = 'Username already in use. Load previous game?'
        }, response => {
          Store.set(this.user)
          API.createStore(this.user).then(response => {
            router.push('home')
          })
        })
      }
    },
    playPrevious () {
      Store.set(this.user)
      API.createStore(this.user).then(response => {
        router.push('home')
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
  @import '../assets/settings.scss';

  .dashboard {
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .label {
      margin-bottom: 30px;
      font-size: 42px;
    }

    .user-input {
      font-size: 42px;
      text-align: center;
      padding: 10px 10px 14px;
      color: $primary;
      border: none;
      border-bottom: 4px solid $primary;
      margin-bottom: 20px;
    }

    .error {
      margin-bottom: 120px;
      color: #ff4545;
      height: 22px;
      width: 100%;
      cursor: pointer;
    }

    .button {
      border: none;
      background: $primary;
      padding: 24px 42px 28px;
      color: $light;
      font-size: 34px;
      cursor: pointer;
    }

    .button.disabled {
      background: #71b194;
      color: #3f926d;
      cursor: not-allowed;
    }
  }
</style>
