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
        points: '',
        tzInfo: {},
        tzPoints: [],
        tzpzInfo: {
            TZPZ_NO: '',
        }
    },
    
    mutations: {
        setMsCmdTip(state, data) {
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
            state.points = new Date().getTime() + ''
        },
        setTzInfo(state, data) {
            state.tzInfo = data
        },
        setTzPoint(state, data) {
            state.tzPoints = data
        },
        setTzNo(state, data) {
            state.tzpzInfo.TZPZ_NO = data
        }
    }
})
export default store