import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import ViewerPanel2 from '../components/ViewerPanel/ViewerPanel2.vue';
import ViewerPanel3 from '../components/ViewerPanel/ViewerPanel3.vue';
export default {
  data() {
    return {
        tabs: ['安全监测', '水文监测', '瓦斯抽采', '人员定位'],
        tabIndex: 0,
        fileName: '图纸1',
        panelCollapsed: true,
        panelCollapsed1: true,
        categories: [
            {
                name: '甲烷',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            },
            {
                name: '氧气',
                expanded: false,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            },
            {
                name: '粉尘',
                expanded: false,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            }
        ],
        categories1: [
            {
                name: '水文监测站',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ],
        categories2: [
            {
                name: '瓦斯监测',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ],
        categories3: [
            {
                name: '分站-122-11盘区水泵房122号基站',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ]
    }
  },
  components: {
    ViewerPanel,
    ViewerPanel1,
    ViewerPanel2,
    ViewerPanel3
  },
  methods: {
    onTabClick(item, index) {
        this.tabIndex = index
        this.panelCollapsed = true
    },
    onAlarmHandle() {
        
    }
  },
}
