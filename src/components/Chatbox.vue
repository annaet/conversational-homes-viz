<template>
  <div class="chatbox">
    <div class="messages">
      <div v-for="message in messages"
           :class="{ sent: message.sender === 'user', received: message.sender !== 'user' }">
        <div class="message">
          {{message.text}}
        </div>
      </div>
    </div>

    <div class="command-input">
      <input type="text"
             v-model="message"
             v-on:keyup.enter="send"
             placeholder="Say something"></input>
    </div>
  </div>
</template>

<script>
import API from '../services/api'
import Observer from '../services/observer'
import CE from 'controlled-english'

export default {
  name: 'chatbox',
  data () {
    return {
      message: 'open front door',
      messages: [{
        sender: 'hudson',
        text: 'hello'
      }, {
        sender: 'user',
        text: 'hi!'
      }],
      openingMessages: [
        'open',
        'close'
      ],
      switchingMessages: [
        'switch on',
        'switch off',
        'turn on',
        'turn off'
      ]
    }
  },
  mounted () {
    this.setUpStore()
  },
  methods: {
    setUpStore () {
      this.store = new CE.Store({
        host: 'localhost:8080',
        store: 'DEFAULT'
      })
    },
    send () {
      this.messages.push({
        sender: 'user',
        text: this.message
      })
      API.sendMessage({
        text: this.message
      }).then(response => {
        this.message = ''
        this.handleResponse(response.body.interpretations[0].result)
      })
    },
    handleResponse (results) {
      let actions = []
      let openingThings = []
      let switchingThings = []
      let devices = []

      // Look for actions
      if (results.instances) {
        for (let instance of results.instances) {
          for (let entity of instance.entities) {
            if (entity._concept.indexOf('action') > -1) {
              actions.push(entity)
            }
            if (entity._concept.indexOf('opening thing') > -1) {
              openingThings.push(entity)
            }
            if (entity._concept.indexOf('switching thing') > -1) {
              switchingThings.push(entity)
            }
            if (entity._concept.indexOf('device') > -1) {
              devices.push(entity)
            }
          }
        }

        if (openingThings.length) {
          this.handleOpeningThings(actions, openingThings)
        }
        if (switchingThings.length) {
          this.handleSwitchingThings(actions, switchingThings)
        }
      } else {
        this.reply('Sorry, I didn\'t understand that.')
      }
    },
    handleOpeningThings (actions, openingThings) {
      for (let action of actions) {
        if (this.openingMessages.indexOf(action._id) > -1) {
          let actionName = action._id === 'open' ? 'Open' : 'Close'

          for (let openingThing of openingThings) {
            API.getInstance(openingThing._id).then(response => {
              let instance = response.body
              let refs = instance.referring_instances

              let maxTimestamp = 0
              let prevState
              let sensor = openingThing._id + ' Sensor'

              // Look through previous states
              if (refs && refs['applies to']) {
                for (let sc of refs['applies to']) {
                  if (sc.timestamp > maxTimestamp) {
                    maxTimestamp = sc.timestamp
                    prevState = sc['current state']
                    sensor = sc['applies to']
                  }
                }
              }

              // Set state change type
              let stateChangeType = 'state change'
              if (openingThing._concept.indexOf('window') > -1) {
                stateChangeType = 'window sensor state change'
              } else if (openingThing._concept.indexOf('door') > -1) {
                stateChangeType = 'door sensor state change'
              }

              // Create CE sentence for state change
              this.sentences = new CE.Sentences()
              let sentence = this.sentences
                .there_is_a(stateChangeType, 'sc_{uid}')
                .property('applies to', 'device', sensor)
                .has('binary state', actionName, 'current state')
                .has(null, '{now}', 'timestamp')

              if (prevState) {
                sentence.has('binary state', prevState, 'previous state')
              }

              console.log(sentence.toString())

              // Save CE
              this.store.save(this.sentences)
                .then(result => {
                  Observer.update()
                  this.reply('OK')
                })
            })
          }
        }
      }
    },
    handleSwitchingThings (actions, switchingThings) {
      for (let action of actions) {
        if (this.switchingMessages.indexOf(action._id) > -1) {
          let actionName = action._id.indexOf('on') > -1 ? 'On' : 'Off'

          for (let switchingThing of switchingThings) {
            API.getInstance(switchingThing._id).then(response => {
              let instance = response.body
              let refs = instance.referring_instances

              let maxTimestamp = 0
              let prevState

              // Look through previous states
              if (refs && refs['applies to']) {
                for (let sc of refs['applies to']) {
                  if (sc.timestamp > maxTimestamp) {
                    maxTimestamp = sc.timestamp
                    prevState = sc['current state']
                    // sensor = sc['applies to']
                  }
                }
              }

              // Set state change type
              let stateChangeType = 'state change'
              if (switchingThing._concept.indexOf('light') > -1) {
                stateChangeType = 'light state change'
              }

              // Create CE sentence for state change
              this.sentences = new CE.Sentences()
              let sentence = this.sentences
                .there_is_a(stateChangeType, 'sc_{uid}')
                .property('applies to', 'device', switchingThing._id)
                .has('binary state', actionName, 'current state')
                .has(null, '{now}', 'timestamp')

              if (prevState) {
                sentence.has('binary state', prevState, 'previous state')
              }

              console.log(sentence.toString())

              // Save CE
              this.store.save(this.sentences)
                .then(result => {
                  Observer.update()
                  this.reply('OK')
                })
            })
          }
        }
      }
    },
    reply (message) {
      this.messages.push({
        sender: 'hudson',
        text: message
      })
    }
  }
}
</script>

<!-- styling for the component -->
<style lang='scss'>
  @import '../assets/settings.scss';

  .chatbox {
    background: $dark;

    .messages {
      overflow: scroll;
      padding-bottom: 15px;
      height: calc(100% - 72px);

      .message {
        border-radius: 4px;
        margin: 15px 15px 0;
        padding: 16px 24px;
        display: inline-block;
      }

      .received {
        text-align: left;

        .message {
          background: white;
          border: 1px solid $primary;
          color: $dark;
        }
      }

      .sent {
        text-align: right;

        .message {
          background: $primary;
          border: 1px solid white;
          color: white;
        }
      }
    }

    .command-input {
      input {
        width: calc(100% - 50px);
        background: white;
        border: 1px solid $dark;
        padding: 16px 24px;
        font-size: 20px;
      }
    }
  }
</style>
