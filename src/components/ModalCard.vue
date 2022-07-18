<template>


  <div class="modal-wrapper" @click.self="clickClose">
    <div class="container">
<!--      <div class="item" v-for="i in items" :key="i">-->
<!--        {{ i }}-->
<!--      </div>-->
      <div @click="clickClose" class="close">
        close
      </div>

      <modal-card-bottom
          :code="secretCode"
          @click-close="clickClose">
        <template #item="data">
          {{ data }}
        </template>

      </modal-card-bottom>

    </div>


  </div>


</template>

<script>
import ModalCardBottom from "@/components/ModalCardBottom";

export default {
  name: "ModalCard",

  data() {
    return {
      secretCode: "fff"
    };
  },

  methods: {
    clickClose() {
      this.$emit("click-close");
    }
  },
  components: {ModalCardBottom},
  props: {
    items: {
      type: Array,
      required: true
    }
  }
};
</script>

<style scoped>
.close {
  cursor: pointer;
  color: red;
}

.modal-wrapper {
  position: fixed;
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, .7);
  z-index: 100;
}

.container {
  position: absolute;
  padding: 20px;
  border-radius: 20px;
  width: 400px;
  height: 400px;
  background-color: white;
  border: 1px solid black;
}
</style>