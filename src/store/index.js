import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);
const store = new Vuex.Store({
    state: {
        msCmdTip: "",
        tipCoord: ""
    },
    mutations: {
        setMsCmdTip(state, data) {
            state.msCmdTip = data;
        },
        setTipCoord(state, data) {
            state.tipCoord = data;
        }
    }
});
export default store;
//# sourceMappingURL=index.js.map