<template>
  <div class="pt-10 px-10 flex justify-center align-middle">
      <img src="../assets/white-lux.png" style="width: 25%;"/><br/>
  </div>
  <ConfigPane />
  <div v-if="!wallet" class="text-center"></div>
  <div v-else>
    <div v-if="farmerAcc">  
        <Modal 
          @close="toggleModal" 
          :modalActive="modalActive" 
          :modalBad="modalBad" 
          :modalGood="modalGood"
          :modalNeutral="modalNeutral"
          :modalShowClose="modalShowClosebutton">
        <div class="modal-content">
          <div class="modal-header">
           <h1>{{ModalHeader}}</h1>
          </div>
          <div class="modal-spinner">
            <svg v-show="modalShowWheel" class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
              <circle v-show="modalShowWheel" class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>
            <!-- <img v-show="modalShowWheel" src='../assets/spining_wheel_1.gif' width="50" height="50" alt='spining wheel'/> -->
          </div>
          <div class="modal-text">
            <p>{{ModalMessage}}</p>
          </div>
        </div>
      </Modal>   
      <Vault
        :key="farmerAcc"
        class="mb-10"
        :vault="farmerAcc.vault.toBase58()"
        :farmerAcc="farmerAcc"
        @selected-wallet-nft="handleNewSelectedNFT"
        @selected-vault-nft="handleNewSelectedVaultNFT"
        ref= 'VaultRef'
      >
        <div class="left-buttons">
        <button
          v-if="farmerState === 'staked' && selectedNFTs.length > 0"
          class="nes-btn huVjiU is-primary uxbuttonleft"
          @click="addGems"
        >
          Add NFTs (resets lock timer)
        </button>
        <button
          v-if="farmerState === 'unstaked' && !widthdrawNFTs"
          class="enabled-button nes-btn huVjiU is-success uxbuttonleft"
          @click="beginStaking"
        >
          Start Staking
        </button>
        <button
          v-if="farmerState === 'unstaked'  && widthdrawNFTs" 
          class="enabled-button nes-btn huVjiU is-success uxbuttonleft"
          @click="beginStaking"
        >
          Withdraw NFTs
        </button>
        <button
          v-if="farmerState === 'staked'"
          class="enabled-button nes-btn huVjiU is-error uxbuttonleft"
          @click="endStaking(true)"
        >
          Stop Staking
        </button>
        <button
          v-if="farmerState === 'pendingCooldown'"
          class="enabled-button nes-btn huVjiU is-error uxbuttonleft"
          @click="endStaking(true)"
        >
          Stop Staking
        </button>
        </div>
        <div class="right-buttons">
        <button
          v-if="availableA > 0"
          class="enabled-button nes-btn huVjiU uxbuttonright"
          @click="claim"
        >
        Claim {{ availableA / 1000000000 }} $LUX 
        </button>        
        <button
          v-if="availableA == 0"
          class="disabled-button nes-btn huVjiU uxbuttonright"
        >
          Withdraw {{ availableA / 1000000000  }} $LUX
        </button>
        </div>
        <div class="staking-info flex justify-center huVjiU">          
          <div v-if="accruedReward" class="accrued-reward uxbuttonleft left-buttons" > Pending Rewards: {{(accruedReward - paidOutReward) / 1000000000}} $LUX</div>
          <!-- <div v-if="paidOutReward" class="total-earned-reward" > paidOutReward: {{paidOutReward}}</div> -->
          <div v-if="fixedRate" class="currently-earning uxbuttonright right-buttons" > Currently generating: {{fixedRate / 1000000000}} $LUX per Week</div>
        </div>
        
<!--         <button class="nes-btn huVjiU mr-5" @click="handleRefreshFarmer">
          Force Refresh Vault
        </button> -->
        <!-- <div v-if="!!accruedReward" class="w-full text-center mb-5">
          Accrued $DAB: {{accruedReward}} Paid out $DAB: {{paidOutReward}}
        </div> -->
      </Vault>
    </div>
    <div v-else>
      <div class="w-full text-center mb-5">
        Staking account not found. Click here to create a new one.
      </div>
      <div class="w-full text-center">
        <button class="nes-btn huVjiU" @click="initFarmer">
          New staking account
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import useWallet from '@/composables/wallet';
import useCluster, { BankAddr } from '@/composables/cluster';
import { initGemFarm } from '@/common/gem-farm';
import { PublicKey } from '@solana/web3.js';
import ConfigPane from '@/components/ConfigPane.vue';
import FarmerDisplay from '@/components/gem-farm/FarmerDisplay.vue';
import Vault from '@/components/gem-bank/Vault.vue';
import { INFT } from '@/common/web3/NFTget';
import { findFarmerPDA, stringifyPKsAndBNs } from '@gemworks/gem-farm-ts';
import Modal from "@/components/Modal.vue";

export default defineComponent({
  components: { Vault, FarmerDisplay, ConfigPane, Modal},
  setup(props, ctx) {
    const { wallet, getWallet } = useWallet();
    const { cluster, getConnection } = useCluster();
    const widthdrawNFTs = ref(false);
    const modalActive = ref(false);
    const modalGood = ref(false);
    const modalBad = ref(false);
    const modalNeutral = ref(false);
    const modalShowWheel = ref(false);
    const modalShowClosebutton = ref(false);

    const toggleModal = () => {
      modalActive.value = !modalActive.value;
    };

    const showModal = () => {
      modalActive.value = true;
    };

    const hideModal = () => {
      modalActive.value = false;
    };

    const setModalContent = (header:string, content:string, style:string, showClose:boolean, showWheel:boolean) => {
        modalGood.value = false;
        modalBad.value = false;
        modalNeutral.value = false;

        ModalHeader.value = header;
        ModalMessage.value = content; 

        modalShowClosebutton.value = showClose;
        modalShowWheel.value = showWheel;

        if(style == 'modal-good')
                modalGood.value = true
        if(style == 'modal-bad')
                modalBad.value = true
        if(style == 'modal-neutral')
                modalNeutral.value = true


    };

    let gf: any;
    watch([wallet, cluster], async () => {
      await freshStart();
    });

    //needed in case we switch in from another window
    onMounted(async () => {
      await freshStart();
    });

    // --------------------------------------- farmer details
    const farm = ref<string>();
    const farmAcc = ref<any>();
    const ModalMessage  = ref<string>();    
    const ModalHeader  = ref<string>();  
    const accruedReward  = ref<string>();
    const paidOutReward = ref<string>();    
    const fixedRate = ref<string>();

    const farmerIdentity = ref<string>();
    const farmerAcc = ref<any>();
    const farmerState = ref<string>();

    const availableA = ref<string>();
    const accruedA = ref<string>();
    const availableB = ref<string>();

    const VaultRef = ref<any>(null);

    //auto loading for when farm changes
    watch(farm, async () => {
      await freshStart();
    });

    const updateAvailableRewards = async () => {
      accruedReward.value = farmerAcc.value.rewardA.accruedReward.toString();
      paidOutReward.value = farmerAcc.value.rewardA.paidOutReward.toString();
      fixedRate.value = farmerAcc.value.rewardA.fixedRate.promisedSchedule.baseRate.toString();

      availableA.value = farmerAcc.value.rewardA.accruedReward
        .sub(farmerAcc.value.rewardA.paidOutReward)
        .toString();
      availableB.value = farmerAcc.value.rewardB.accruedReward
        .sub(farmerAcc.value.rewardB.paidOutReward)
        .toString();   
    };

    const fetchFarn = async () => {   
      farmAcc.value = await gf.fetchFarmAcc(new PublicKey(farm.value!));  
      console.log(
        `farm found at ${farm.value}:`,
        stringifyPKsAndBNs(farmAcc.value)
      );
    };

    const fetchFarmer = async () => {
      const [farmerPDA] = await findFarmerPDA(
        new PublicKey(farm.value!),
        getWallet()!.publicKey!
      );
      farmerIdentity.value = getWallet()!.publicKey?.toBase58();
      farmerAcc.value = await gf.fetchFarmerAcc(farmerPDA);
      farmerState.value = gf.parseFarmerState(farmerAcc.value);
      await updateAvailableRewards();
      console.log(
        `farmer found at ${farmerIdentity.value}:`,
        stringifyPKsAndBNs(farmerAcc.value)
      );
    };

    const freshStart = async () => {
      if (getWallet() && getConnection()) {
        gf = await initGemFarm(getConnection(), getWallet()!);
        farmerIdentity.value = getWallet()!.publicKey?.toBase58();
        farm.value = BankAddr.LUX;

        //reset stuff
        farmAcc.value = undefined;
        farmerAcc.value = undefined;
        farmerState.value = undefined;
        availableA.value = undefined;
        availableB.value = undefined;
        widthdrawNFTs.value = false;

        try {          
          await fetchFarn();
          await fetchFarmer();
           setInterval(function () {
              handleRefreshFarmer()
          }, 600000);
        } catch (e) {
          console.log(`farm with PK ${farm.value} not found :(`);
        }
      }
    };

    const initFarmer = async () => {
      await gf.initFarmerWallet(new PublicKey(farm.value!));  
      await fetchFarmer();
    };

    // --------------------------------------- staking
    const beginStaking = async () => {

      try
      {
        showModal();
        setModalContent("Submiting Transaction", "Transaction in Progress", "modal-neutral", false, true);     
        //debugger;           
          if((VaultRef.value.desiredVaultNFTs.length >= VaultRef.value.currentVaultNFTs.length && VaultRef.value.desiredVaultNFTs.length > 0))
          {
            await VaultRef.value.moveNFTsOnChain();
            await gf.stakeWallet(new PublicKey(farm.value!));
            hideModal();
          }
          else
          {
            if((VaultRef.value.desiredVaultNFTs.length - VaultRef.value.currentVaultNFTs.length) >= 0 && VaultRef.value.desiredVaultNFTs.length < 1)
            {
              setModalContent("There was a problem", "Must have at least 1 NFT staked in the Vault." , "modal-bad", true, false);
            }
            else
            {
              await VaultRef.value.moveNFTsOnChain();                
              hideModal();
            }             
          }
          await fetchFarmer();        
      }
      catch(ex: unknown)
      {      
        hideModal();
        //debugger;
        let message = 'Unknown Error: Please try again. If the problem continues, please reach out to the site admin'
        if (ex instanceof Error) {
          message = ex.message;
          if(message.includes("0x179a"))
          {
           message = "Minimum staking time not reached. ";
          }
          if(message.includes("0x1785"))
          {
           message = "Must have at least 1 NFT staked in the Vault. ";
          }
          if(message.includes("0x1784"))
          {
           message = "Vault is Locked. Please try again after the minimum staking peroid has completed ";
          }
           
           showModal();
           setModalContent("There was a problem", message , "modal-bad", true, false);
        }
      }
      selectedNFTs.value = [];
    };

    const endStaking = async (finalize:boolean) => {
      try
      {
        showModal();
        setModalContent("Submiting Transactions.", "Please Wait. Transaction in Progress", "modal-neutral", false, true);

          await gf.unstakeWallet(new PublicKey(farm.value!));
          await fetchFarmer();

        hideModal();
      }
      catch(ex: unknown)
      {      
        //debugger;
        let message = 'Unknown Error: Please try again. If the problem continues, please reach out to the site admin'
        if (ex instanceof Error) {
          message = ex.message;
          if(message.includes("0x179a"))
          {
           message = "Minimum staking time not reached. ";
          }
           showModal();
           setModalContent("There was a problem", message , "modal-bad", true, false);
        }
      }
      selectedNFTs.value = [];

      if(finalize)
        endStaking(false);
    };

    

    const claim = async () => {
      await gf.claimWallet(
        new PublicKey(farm.value!),
        new PublicKey(farmAcc.value.rewardA.rewardMint!),
        new PublicKey(farmAcc.value.rewardB.rewardMint!)
      );
      await fetchFarmer();
    };

    const handleRefreshFarmer = async () => {
      await fetchFarmer();
    };

    // --------------------------------------- adding extra gem
    const selectedNFTs = ref<INFT[]>([]);

    const handleNewSelectedNFT = (newSelectedNFTs: INFT[]) => {
      //debugger
      widthdrawNFTs.value = (VaultRef.value.currentVaultNFTs.length - VaultRef.value.desiredVaultNFTs.length> 0 )
      
      console.log(`selected ${newSelectedNFTs.length} NFTs`);
      selectedNFTs.value = newSelectedNFTs; 
    };

    const handleNewSelectedVaultNFT = (newSelectedNFTs: INFT[]) => {
      //debugger;
      widthdrawNFTs.value = (VaultRef.value.currentVaultNFTs.length - VaultRef.value.desiredVaultNFTs.length> 0 )
      
      console.log(`selected ${newSelectedNFTs.length} NFTs`);
      selectedNFTs.value = newSelectedNFTs;
    };

    const addSingleGem = async (
      gemMint: PublicKey,
      gemSource: PublicKey,
      creator: PublicKey
    ) => {
      await gf.flashDepositWallet(
        new PublicKey(farm.value!),
        '1',
        gemMint,
        gemSource,
        creator
      );
      await fetchFarmer();
    };

    const addGems = async () => {
      await Promise.all(
        selectedNFTs.value.map((nft) => {
          const creator = new PublicKey(
            //todo currently simply taking the 1st creator
            (nft.onchainMetadata as any).data.creators[0].address
          );
          console.log('creator is', creator.toBase58());

          addSingleGem(nft.mint, nft.pubkey!, creator);
        })
      );
      console.log(
        `added another ${selectedNFTs.value.length} gems into staking vault`
      );
    };

    return {
      wallet,
      farm,
      farmAcc,
      farmer: farmerIdentity,
      farmerAcc,
      farmerState,
      availableA,
      availableB,
      initFarmer,
      beginStaking,
      endStaking,
      claim,
      handleRefreshFarmer,
      selectedNFTs,
      handleNewSelectedNFT,
      handleNewSelectedVaultNFT,
      addGems,
      VaultRef,
      modalActive, 
      toggleModal,
      showModal,
      hideModal,
      setModalContent,
      modalGood,
      modalBad,
      modalNeutral,
      modalShowClosebutton,
      modalShowWheel,
      ModalMessage,
      ModalHeader,
      accruedReward,
      paidOutReward,
      fixedRate,
      widthdrawNFTs
    };
  },
});
</script>

<style scoped></style>
