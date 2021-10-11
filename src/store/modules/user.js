import { login, logout } from '@/api/user'
import { removeToken, setToken, getToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: [],
  status: null,
  userId: null,
}

const mutations = {
  SET_USERID: (rqState, id) => {
    const res = rqState
    res.userId = id
  },
  SET_STATUS: (rqState, status) => {
    const res = rqState
    res.status = status
  },
  SET_TOKEN: (rqState, localStorage) => {
    const res = rqState
    res.token = localStorage
  },
  SET_INTRODUCTION: (rqState, introduction) => {
    const res = rqState
    res.introduction = introduction
  },
  SET_NAME: (rqState, name) => {
    const res = rqState
    res.name = name
  },
  SET_AVATAR: (rqState, avatar) => {
    const res = rqState
    res.avatar = avatar
  },
  SET_ROLES: (rqState, roles) => {
    const res = rqState
    res.roles = roles
  },
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo

    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password }).then(res => {
        console.log(res)
        const {
          access,
          avatar,
          nickname,
          token,
          status,
          mobile,
          id,
        } = res.response

        commit('SET_USERID', id)
        commit('SET_STATUS', status)
        commit('SET_TOKEN', token)
        commit('SET_ROLES', access)
        commit('SET_NAME', nickname)
        commit('SET_AVATAR', avatar)
        commit('SET_INTRODUCTION', mobile)
        setToken(token)

        // roles must be a non-empty array
        if (!access || access.length <= 0) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('userInfo: access must be a non-null array!')
        }

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, rqState, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(rqState.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()

        // reset visited views and cached views
        // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const localStorage = `${role}-localStorage`

    commit('SET_TOKEN', localStorage)
    setToken(localStorage)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })

    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
