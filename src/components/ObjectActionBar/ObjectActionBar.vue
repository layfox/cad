<template>    
     <div class="object-active-bar-box" v-show="isShow">
        <!-- 复制对象 -->
        <div class="object-active-bar-box-item iconfont icon-fuzhi1" 
        @click="copyObj"
        >  
        </div>

         <!-- 修改颜色 -->
        <div class="object-active-bar-box-item iconfont icon-tianchong"
            @click="isShowColors = !isShowColors"

        >    <div class="toast" style="display: flex" v-show="isShowColors">
                <div v-for="(color, index) in colors" :key="index" @click="setColor(color)"
                    class="colorbox" :style="{ background:  color }">
                </div>
            </div>
        </div>
         <!-- 删除 -->
        <div class="object-active-bar-box-item iconfont icon-shanchu1"
            @click="deleteObj"
        >  
        </div>
    </div>
</template>

<script lang="ts">
import { MxFun } from "mxdraw";
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({
  name: "ObjectActionBar",
})

export default class ObjectActionBar extends Vue {
    @Prop({
        type: Boolean,
        default: false
    }) isShow!: boolean

    isShowColors = false
    colors = ['red', 'yellow', 'blue']
    setColor(color:string) {
        // 设置颜色
        MxFun.sendStringToExecute("BR_SetEntityColor",color);
    }
    copyObj() {
        // 复制对象
        MxFun.sendStringToExecute("BR_CopyEntity");
    }
    deleteObj() {
        // 删除对象
        MxFun.sendStringToExecute("BR_DeleteEntity");
       
    }
    
}
</script>

<style>
.object-active-bar-box {
    background: rgb(46,46,46);
    padding: 10px;
    border-radius: 8px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    bottom: 50px;
    position :absolute;
    left: calc(50% - 250px);
    flex: 1;
    width: 500px;
}
.object-active-bar-box-item {
    font-size: 28px;
    margin: 2px ;
    color: #fff;
    cursor: pointer;
    position: relative;
}
.colorbox {
    width:28px;
    height: 28px;
}
.toast{
    min-width: 80px;
    min-height: 30px;
    border: 2px  solid rgb(80,80,80);
    border-radius: 7px;
    position: absolute;
    background: rgb(80, 80, 80);
    top: calc(-100% - 14px);
    left: calc(-50% - 14px);
    padding:1px 2px;
}
.toast::before{
    content: '';
    width: 0;
    height: 0;
    border: 6px solid;
    position: absolute;
    bottom: -12px; 
    left: calc( 50% - 6px);
    border-color:rgb(80,80,80) transparent transparent;
}
.toast:after{
    content :'';
    width: 0;
    height: 0;
    border: 6px solid;
    position: absolute;
    bottom: -14px;
    left: calc( 50% - 6px);
    border-color: rgb(80,80,80) transparent transparent;
}

</style>