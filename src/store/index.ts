import Vue from "vue"
import Vuex from "vuex"
Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        msCmdTip: "",
        tipCoord: "",
        //  光标大小
        cursorSize: 128,
        // cursorRectSize 光标矩形框大小
        cursorRectSize: 10,
        points: []
    },
    
    mutations: {
        setMsCmdTip(state, data) {
            console.log(data, 1111)
            state.msCmdTip = data
        },
        setTipCoord(state, data) {
            state.tipCoord = data
        },
        setCursorSize(state, data) {
            state.cursorSize = data
        },
        setCursorRectSize(state, data) {
            state.cursorRectSize = data
        },
        setPointData(state, data) {
            console.log(data, 2222)
            state.points = data
        }
    }
})
export default store