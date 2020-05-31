import {IGeolocation} from '../../modules/GeoLocation/GeolocationService'

// Initial state
const state = {
    location: null
}

// getters
const getters = {
    location() {
        return state.location
    }
}

// actions
const actions = {
    updateLocation({ commit, state }, newLocation) {
        commit('location', newLocation)
    }
}

// mutations
const mutations = {
    updateLocationState(newLocation: IGeolocation) {
        state.location = newLocation
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}