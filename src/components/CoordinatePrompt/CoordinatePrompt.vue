<template>
  <div class="coordinate_prompt">{{ tipCoord }}</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
@Component({
  name: "CoordinatePrompt",
})
export default class CoordinatePrompt extends Vue {
     get tipCoord() {
        return this.$store.state.tipCoord
    } 
}
</script>

<style>
.coordinate_prompt {
    padding: 1px 20px;
    background-color: #555555;
    color: #fff;
    border-radius: 10px;
    position: absolute;
    bottom: 10px;
    right: 0;
}
</style>