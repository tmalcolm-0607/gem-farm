<template>
  <transition name="modal-animation">
    <div v-show="modalActive" class="modal">
      <transition name="modal-animation-inner">
        <div v-show="modalActive" :class="[modalNeutral ? 'modal-neutral' : modalGood ? 'modal-good' : modalBad ? 'modal-bad' : '', '']">
          <i @click="close" class="far fa-times-circle"></i>
          <!-- Modal Content -->
          <slot />                    
          <button v-show="modalShowClose" @click="close" type="button">Close</button>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
export default {
  props: ["modalActive","modalShowClose","modalNeutral","modalGood","modalBad"],
  setup(props, { emit }) {
    const close = () => {
      emit("close");
    };
    return { close };
  },
};
</script>

<style lang="css" scoped>
.modal-animation-enter-active,.modal-animation-leave-active
    {
        transition:opacity .7s cubic-bezier(.52,.02,.19,1.02)
    }
    .modal-animation-enter-from,.modal-animation-leave-to{opacity:0}.modal-animation-inner-enter-active
    {
        transition:all .7s cubic-bezier(.52,.02,.19,1.02) .15s
    }
    .modal-animation-inner-leave-active
    {
        transition:all .7s cubic-bezier(.52,.02,.19,1.02)
    }
    .modal-animation-inner-enter-from
    {
        opacity:0;transform:scale(.8)
    }
    .modal-animation-inner-leave-to
    {
        transform:scale(.8)
    }
    /* .modal-good
    {
        background-image:linear-gradient(90deg,rgba(93,255,156,0),rgba(93,255,156,.7),rgba(93,255,156,.7),rgba(93,255,156,.7),rgba(93,255,156,0));
        color:#000;
        border:#5dff9c;
        min-width:500px
    } */
    /* .modal-neutral
    {
        background: rgba(0, 0, 0, 0.7);
        min-width: 500px;
    } */
    /* .modal-bad{background-image:linear-gradient(90deg,rgba(172,10,23,0),rgba(172,10,23,.7),rgba(172,10,23,.7),rgba(172,10,23,.7),rgba(172,10,23,0));
        border:#ac0a17;
        min-width:500px
    } */
    .modal-good{
      background-color: rgba(0, 0, 0, 0.7);
      border: 1px solid #fff;
      max-width: 90%;
    }
    .modal-neutral{
      background-color: rgba(0, 0, 0, 0.7);
      border: 1px solid #fff;
      max-width: 90%;
    }
    .modal-bad{
      background-color: rgba(0, 0, 0, 0.7);
      border: 1px solid #fff;
      max-width: 90%;
    }
    .modal
    {
        display:flex;z-index:1000;
        justify-content:center;
        align-items:center;
        text-align:center;
        font-family:poppins,sans-serif;
        height:100vh;
        width:100vw;
        position:fixed;
        top:0;
        left:0;
        background-color:rgba(0,0,0,0.8)
    }
    .modal-inner
    {
        position:relative;
        max-width:640px;
        box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -1px rgba(0,0,0,.9);
        padding:16px 32px;
        border-width:3px;
        border-style:solid
    }
    button
    {
        padding: 15px 20px;
        text-transform: uppercase;
        margin: 15px;
        border: none;
        font-size: 16px;
        font-family: poppins,sans-serif;
        font-weight: 700;
        background-color: #3A39AA;
        color: #fff;
        cursor: pointer;
        border-radius: 3px;
    }
    i
    {
        position:absolute;
        top:15px;
        right:15px;
        font-size:20px;
        cursor:pointer
    }
</style>