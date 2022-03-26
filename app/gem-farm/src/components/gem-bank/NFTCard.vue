<template>
  <div
    class="m-1 card flex justify-center card-parent-div"
    :class="{ 'card-selected': selected }"
    @click="toggleSelect"
  >
    <img
      :src="nft.externalMetadata.image"
      :alt="nft.onchainMetadata.data.name"
    />
    <div class="hover-text">1K $LUX Per Week</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
export default defineComponent({
  props: {
    nft: { type: Object, required: true },
  },
  emits: ['selected'],
  setup(props, ctx) {
    const selected = ref<boolean>(false);

    const toggleSelect = () => {
      selected.value = !selected.value;
      console.log('selected', props.nft.mint.toBase58());
      ctx.emit('selected', {
        nft: props.nft,
        selected: selected.value,
      });
    };

    return {
      selected,
      toggleSelect,
    };
  },
});
</script>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  border-radius:5px;
}

img:hover {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
  border-radius:5px;
}

.card {
  width: 150px;
  height: 150px;
}

.card:hover {
  @apply border-4 border-solid border-gray-200;
  border-radius:10px;
}

.card-selected {
  @apply border-4 border-solid;
  border-color: #47d34b  !important;
  border-radius:10px;
}
.card-parent-div{
 position: relative;
 float: left;
}
.hover-text{
 position: absolute;
 bottom: 0;
 right: 0;
 width:100%;
 background: black;
 color: white;
 margin: auto;
 opacity: 0;
 visibility: visible;
 -webkit-transition: visibility 0s, opacity 0.5s linear; 
 /* transition: visibility 0s, opacity 0.5s linear; */
}
.hover-text:hover{
 visibility: visible;
 opacity: 0.7; 
}
</style>
