<template>
  <div class="chatbox">
    <div class="messages">
      <div v-for="message in messages"
           :class="{ sent: message.sender === 'user', received: message.sender !== 'user' }">
        <div class="message">
          <div>{{message.text}}</div>
          <img v-if="message.image" :src="message.image">
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
import Store from '../services/store'
import Observer from '../services/observer'
import config from '../../config'
import CE from 'controlled-english'

export default {
  name: 'chatbox',
  data () {
    return {
      message: '',
      messages: [{
        sender: 'hudson',
        text: 'Ask me about the house'
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
      ],
      viewingMessages: [
        'show',
        'view'
      ]
    }
  },
  mounted () {
    this.setUpStore()
  },
  methods: {
    setUpStore () {
      this.user = Store.get()
      this.store = new CE.Store({
        host: config.ceStore.url,
        store: this.user
      })
    },
    send () {
      this.messages.push({
        sender: 'user',
        text: this.message
      })

      let sentences = new CE.Sentences()
      sentences
        .there_is_a('message', 'message_{uid}')
        .has('value', this.user, 'sender')
        .has('value', this.message, 'text')
        .has('value', '{now}', 'timestamp')

      this.store.save(sentences)

      API.sendMessage({
        text: this.message
      }, this.user).then(response => {
        this.message = ''
        this.handleResponse(response.body.interpretations[0].result)
      })
    },
    handleResponse (results) {
      let questions = []
      let actions = []
      let openingThings = []
      let switchingThings = []
      let temperatureSensors = []
      let cameras = []
      let states = []
      let controlConcepts = []
      let rooms = []
      let all = false
      let temperature = false

      console.log(results)

      let removeDuplicates = things => {
        let seen = {}
        let noDuplicates = things.filter(thing => {
          return seen[thing._id] ? false : (seen[thing._id] = true)
        })
        return noDuplicates
      }

      let handleThings = () => {
        openingThings = removeDuplicates(openingThings)
        switchingThings = removeDuplicates(switchingThings)

        console.log('questions', questions)
        console.log('openingThings', openingThings)
        console.log('switchingThings', switchingThings)
        console.log('temperatureSensors', temperatureSensors)
        console.log('cameras', cameras)
        console.log('states', states)
        console.log('actions', actions)
        console.log('controlConcepts', controlConcepts)
        console.log('rooms', rooms)

        let thingMentioned = openingThings.length || switchingThings.length || cameras.length

        if (questions.length && (thingMentioned ||
            temperatureSensors.length || controlConcepts.length)) {
          this.handleQuestion(questions, openingThings, switchingThings, temperatureSensors, states, controlConcepts)
        } else if (actions.length && thingMentioned) {
          if (openingThings.length) {
            this.handleOpeningThings(actions, openingThings)
          }
          if (switchingThings.length) {
            this.handleSwitchingThings(actions, switchingThings)
          }
          if (cameras.length) {
            this.handleCameras(actions, cameras)
          }
        } else {
          this.reply('Sorry, I didn\'t understand that')
        }
      }

      // Sort entities
      if (results.instances) {
        for (let instance of results.instances) {
          for (let entity of instance.entities) {
            if (entity._concept.indexOf('question word') > -1) {
              questions.push(entity)
            }
            if (entity._concept.indexOf('action') > -1) {
              actions.push(entity)
            }
            if (entity._concept.indexOf('opening thing') > -1) {
              openingThings.push(entity)
            }
            if (entity._concept.indexOf('switching thing') > -1) {
              switchingThings.push(entity)
            }
            if (entity._concept.indexOf('camera') > -1) {
              cameras.push(entity)
            }
            if (entity._concept.indexOf('state') > -1) {
              states.push(entity)
            }
            if (entity._concept.indexOf('room') > -1) {
              rooms.push(entity)
            }
            if (entity._id === 'all') {
              all = true
            }
            if (entity._id === 'temperature') {
              temperature = true
            }
          }
        }

        if (results.concepts) {
          for (let concept of results.concepts) {
            for (let entity of concept.entities) {
              if (entity._concept.indexOf('controllable concept') > -1) {
                controlConcepts.push(entity)
              }
            }
          }
        }

        if (rooms.length) {
          for (let room of rooms) {
            API.getInstance(room._id, this.user, 1).then(response => {
              console.log(response.body)
              let refs = response.body.referring_instances
              for (let ref of refs['is located in']) {
                for (let concept of controlConcepts) {
                  if (ref._concept.indexOf(concept._id) > -1) {
                    if (ref._concept.indexOf('opening thing') > -1) {
                      openingThings.push(ref)
                    }
                    if (ref._concept.indexOf('switching thing') > -1) {
                      switchingThings.push(ref)
                    }
                  }
                }
                if (temperature && ref._concept.indexOf('temperature sensor') > -1) {
                  temperatureSensors.push(ref)
                }
              }

              handleThings()
            })
          }
        } else {
          if (!switchingThings.length && !openingThings.length) {
            all = true
          }

          if (results.concepts && !rooms.length) {
            for (let concept of results.concepts) {
              for (let entity of concept.entities) {
                if (all) {
                  API.getInstances(entity._id, this.user).then(response => {
                    for (let thing of response.body) {
                      if (thing._concept.indexOf('opening thing') > -1) {
                        openingThings.push(thing)
                      }
                      if (thing._concept.indexOf('switching thing') > -1) {
                        switchingThings.push(thing)
                      }
                    }

                    handleThings()
                  })
                } else {
                  if (entity._concept.indexOf('controllable concept')) {
                    controlConcepts.push(entity)
                  }
                }
              }
            }

            if (!all) {
              handleThings()
            }
          } else {
            handleThings()
          }
        }
      } else {
        handleThings()
      }
    },
    getCurrentState (instance) {
      let refs = instance.referring_instances

      let maxTimestamp = 0
      let currentState

      // Look through previous states
      if (refs && refs['applies to']) {
        for (let sc of refs['applies to']) {
          if (sc.timestamp > maxTimestamp) {
            maxTimestamp = sc.timestamp
            currentState = sc['current state']
          }
        }
      }

      return currentState
    },
    handleQuestion (questions, openingThings, switchingThings, temperatureSensors, states, controlConcepts) {
      // No need for handling of different question words at the moment
      if (temperatureSensors.length) {
        for (let sensor of temperatureSensors) {
          API.getInstance(sensor._id, this.user).then(response => {
            let instance = response.body
            let currentState = this.getCurrentState(instance)
            console.log(currentState)
            this.reply('The ' + sensor._id + ' is ' + currentState + ' degrees')
          })
        }
      } else if (switchingThings.length || openingThings.length) {
        if (states.length) {
          for (let state of states) {
            let stateId = state._id.toLowerCase()
            if (switchingThings.length && (stateId === 'on' || stateId === 'off')) {
              for (let switchingThing of switchingThings) {
                API.getInstance(switchingThing._id, this.user).then(response => {
                  let instance = response.body
                  console.log(instance)
                  let currentState = this.getCurrentState(instance)
                  console.log(currentState)
                  this.reply('Current state of ' + switchingThing._id + ' is ' + currentState)
                })
              }
            } else if (openingThings.length && (stateId === 'open' || stateId === 'closed')) {
              for (let openingThing of openingThings) {
                API.getInstance(openingThing._id, this.user).then(response => {
                  let instance = response.body
                  console.log(instance)
                  let currentState = this.getCurrentState(instance)
                  console.log(currentState)
                  this.reply('The current state of the ' + openingThing._id + ' is ' + currentState.toLowerCase())
                })
              }
            } else {
              this.reply('Sorry, I didn\'t understand that')
            }
          }
        } else {
          this.reply('Sorry, I didn\'t understand that')
        }
      } else if (controlConcepts.length) {
        for (let concept of controlConcepts) {
          API.getInstances(concept._id, this.user).then(response => {
            let insts = response.body
            for (let inst of insts) {
              API.getInstance(inst._id, this.user).then(response => {
                let instance = response.body
                let currentState = this.getCurrentState(instance)
                this.reply('The current state of the ' + inst._id + ' is ' + currentState.toLowerCase())
              })
            }
          })
        }
      } else {
        this.reply('Sorry, I didn\'t understand that')
      }
    },
    handleOpeningThings (actions, openingThings) {
      for (let action of actions) {
        if (this.openingMessages.indexOf(action._id.toLowerCase()) > -1) {
          let actionName = action._id.toLowerCase() === 'open' ? 'Open' : 'Closed'

          for (let openingThing of openingThings) {
            API.getInstance(openingThing._id, this.user).then(response => {
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
              let sentences = new CE.Sentences()
              let sentence = sentences
                .there_is_a(stateChangeType, 'sc_{uid}')
                .property('applies to', 'device', sensor)
                .has('binary state', actionName, 'current state')
                .has(null, '{now}', 'timestamp')

              if (prevState) {
                sentence.has('binary state', prevState, 'previous state')
              }

              console.log(sentence.toString())

              // Save CE
              this.store.save(sentences)
                .then(result => {
                  Observer.update()

                  let message = actionName === 'Open' ? 'Opening the ' : 'Closing the '
                  this.reply(message + openingThing._id)
                })
            })
          }
        }
      }
    },
    handleSwitchingThings (actions, switchingThings) {
      for (let action of actions) {
        if (this.switchingMessages.indexOf(action._id.toLowerCase()) > -1) {
          let actionName = action._id.toLowerCase().indexOf('on') > -1 ? 'On' : 'Off'

          for (let switchingThing of switchingThings) {
            API.getInstance(switchingThing._id, this.user).then(response => {
              let instance = response.body
              let prevState = this.getCurrentState(instance)

              // Set state change type
              let stateChangeType = 'state change'
              if (switchingThing._concept.indexOf('light') > -1) {
                stateChangeType = 'light state change'
              }

              // Create CE sentence for state change
              let sentences = new CE.Sentences()
              let sentence = sentences
                .there_is_a(stateChangeType, 'sc_{uid}')
                .property('applies to', 'device', switchingThing._id)
                .has('binary state', actionName, 'current state')
                .has(null, '{now}', 'timestamp')

              if (prevState) {
                sentence.has('binary state', prevState, 'previous state')
              }

              console.log(sentence.toString())

              // Save CE
              this.store.save(sentences)
                .then(result => {
                  Observer.update()

                  let message = 'Turning '
                  this.reply(message + switchingThing._id + ' ' + actionName.toLowerCase())
                })
            })
          }
        }
      }
    },
    handleCameras (actions, cameras) {
      console.log('handle cameras')
      for (let camera of cameras) {
        console.log(camera)
        this.reply('Here\'s the latest image from the ' + camera._id + ':', camera['static image url'])
      }
    },
    reply (message, imageUrl) {
      this.messages.push({
        sender: 'hudson',
        text: message,
        image: imageUrl
      })

      let sentences = new CE.Sentences()
      sentences
        .there_is_a('message', 'message_{uid}')
        .has('value', 'hudson', 'sender')
        .has('value', message, 'text')
        .has('value', '{now}', 'timestamp')

      this.store.save(sentences)
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

        img {
          margin-top: 20px;
          max-width: 100%;
        }
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
