<template>
  <div class="pt-10 px-10 flex justify-center align-middle">
      <img src="../assets/white-lux.png" style="width: 25%;"/><br/>
  </div>
  <ConfigPane :farmerAcc="farmerAcc" />
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
        <!-- <button
          v-if="farmerState === 'staked' && selectedNFTs.length > 0"
          class="nes-btn huVjiU is-primary uxbuttonleft"
          @click="addGems"
        >
          Add NFTs (resets lock timer)
        </button> -->
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
        <div class=""  style="position: relative;fontSize:x-small">
          <p class="mr-10">*Stop Staking to Add more NFT's</p> 
          </div>
        </div>
        <div class="right-buttons">
        <button
          v-if="availableA > 0"
          class="enabled-button nes-btn huVjiU uxbuttonright"
          @click="claim"
        >
        Claim {{ Math.floor(availableA / 1000000000) }} $LUX 
        </button>        
        <button
          v-if="availableA == 0"
          class="disabled-button nes-btn huVjiU uxbuttonright"
        >
          Withdraw {{ Math.floor(availableA / 1000000000) }} $LUX
        </button>
        </div>
        
        <div class="width100 flex justify-center huVjiU pt-5">          
          <div v-if="fixedRate > 0" class="accrued-reward uxbuttonleft left-buttons" > Estimated Rewards: {{ estRewards  }} $LUX</div>
          <!-- <div v-if="paidOutReward" class="total-earned-reward" > paidOutReward: {{paidOutReward}}</div> -->
          <div v-if="fixedRate > 0" class="currently-earning uxbuttonright right-buttons" > Currently generating: {{fixedRate / 1000000000}} $LUX per Week</div>
        </div>
        <div class="width100 flex justify-center huVjiU pt-5">          
          <div v-if="fixedRate > 0" class="accrued-reward uxbuttonleft left-buttons" >Total NFTs Staked: {{totalNFTsStaked}} / {{ Math.floor(totalNFTsStaked / totalNFTs * 100) }}% </div> 
          <!-- <div v-if="paidOutReward" class="total-earned-reward" > paidOutReward: {{paidOutReward}}</div> -->
          <div v-if="fixedRate > 0" class="currently-earning uxbuttonright right-buttons" > Staking Status: {{farmerState}}</div>
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
        <button class="nes-btn huVjiU new-staking-account" @click="initFarmer">
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
    const fixedRate = ref<number>();    
    const estFixedRate = ref<number>();
    const estRewards = ref<number>();

    const farmerIdentity = ref<string>();
    const farmerAcc = ref<any>();
    const farmerState = ref<string>();

    const availableA = ref<string>();
    const accruedA = ref<string>();
    const availableB = ref<string>();

    const VaultRef = ref<any>(null);

    const totalAccounts = ref<number>();
    const totalStakedAccounts = ref<number>();    
    const totalNFTsStaked = ref<number>();    
    const totalNFTs = ref<number>();    
    const farmerbeginStakingTs = ref<string>();

    //auto loading for when farm changes
    watch(farm, async () => {
      await freshStart();
    });

    const updateAvailableRewards = async () => {
      accruedReward.value = farmerAcc.value.rewardA.accruedReward.toString();
      paidOutReward.value = farmerAcc.value.rewardA.paidOutReward.toString();     
      fixedRate.value = (farmerAcc.value.rewardA.fixedRate.promisedSchedule.baseRate * farmerAcc.value.rarityPointsStaked.words[0]);
      estFixedRate.value = Math.floor((Date.now()/1000 - farmerAcc.value.minStakingEndsTs) * (fixedRate.value / 1000000000)/604799);
      estRewards.value = Math.floor(((Date.now()/1000) - farmerAcc.value.rewardA.fixedRate.lastUpdatedTs) * (fixedRate.value / 1000000000 / 7 / 24 / 60 / 60))
      availableA.value = farmerAcc.value.rewardA.accruedReward
        .sub(farmerAcc.value.rewardA.paidOutReward)
        .toString();
      availableB.value = farmerAcc.value.rewardB.accruedReward
        .sub(farmerAcc.value.rewardB.paidOutReward)
        .toString();   
     
      totalNFTs.value = 10000;
      farmerbeginStakingTs.value = farmerAcc.value.rewardA.fixedRate.beginStakingTs
      
    };

    const fetchFarn = async () => {   
      farmAcc.value = await gf.fetchFarmAcc(new PublicKey(farm.value!));  
        totalAccounts.value = farmAcc.value.farmerCount;
        totalStakedAccounts.value = farmAcc.value.stakedFarmerCount
        totalNFTsStaked.value = farmAcc.value.gemsStaked      
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
       setModalContent("Welcome to Lux Metaverse Staking", "We are actively updating this interface/staking solution. But please note before staking to make sure all your NFT's are in the Target Vault before staking. The act of clicking 'Start Staking' will lock this NFT for 7 days in this vault you will not be able to unstake during this time.", "modal-neutral", true, false);     
         showModal();
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
              fetchFarn();
              fetchFarmer();
          }, 600000);
        } catch (e) {
          console.log(`farm with PK ${farm.value} not found :(`);
        }
      }
    };

    const initFarmer = async () => {      
          try
          {           
            setModalContent("Submitting Transaction", "Creating new staking account: Transaction in Progress", "modal-neutral", false, true);    
             showModal();
              await gf.initFarmerWallet(new PublicKey(farm.value!));  
              await fetchFarmer();
          }
          catch(ex: unknown)
          {      
             let message = 'Unknown Error: Please try again. If the problem continues, please reach out to the site admin'
              if (ex instanceof Error) {
                hideModal();
                message = ex.message;
                if(message.includes("0x1770"))
                {
                message = "Transaction Failed: Compute limit(200000) reached. ";
                }
                if(message.includes("0x1"))
                {
                message = "Please make sure you have at least .05 Sol in your account to cover rental and transaction fees";
                }
                if(message.includes("0x1784"))
                {
                message = "Vault is Locked. Please try again after the minimum staking peroid has completed ";
                }
                
                showModal();
                setModalContent("There was a problem", message , "modal-bad", true, false);
                }
          }          
    };

    // --------------------------------------- staking
    const beginStaking = async () => {

      try
      {
        showModal();
        setModalContent("Submitting Transaction", "Transaction in Progress", "modal-neutral", false, true);     
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
              setModalContent("There was a problem", "You must move at least 1 NFT to the staking wallet. To do so, click the NFT then click the right arrow then hit Start Staking!" , "modal-bad", true, false);
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
        setModalContent("Submitting Transactions.", "Please Wait. Transaction in Progress", "modal-neutral", false, true);

          await gf.unstakeWallet(new PublicKey(farm.value!));
          await fetchFarmer();

        hideModal();
      }
      catch(ex: unknown)
      {      
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
      await gf.refreshFarmerWallet(
        new PublicKey(farm!),
        new PublicKey(farmerIdentity!)
          );
    };

    // --------------------------------------- adding extra gem
    const selectedNFTs = ref<INFT[]>([]);

    const handleNewSelectedNFT = (newSelectedNFTs: INFT[]) => {
      widthdrawNFTs.value = (VaultRef.value.currentVaultNFTs.length - VaultRef.value.desiredVaultNFTs.length> 0 )
      
      console.debug(`selected ${newSelectedNFTs.length} NFTs`);
      selectedNFTs.value = newSelectedNFTs; 
    };

    const handleNewSelectedVaultNFT = (newSelectedNFTs: INFT[]) => {
      widthdrawNFTs.value = (VaultRef.value.currentVaultNFTs.length - VaultRef.value.desiredVaultNFTs.length> 0 )
      
      console.debug(`selected ${newSelectedNFTs.length} NFTs`);
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
       try
      {
       showModal();
        setModalContent("Submitting Transactions.", "Please Wait. Transaction in Progress", "modal-neutral", false, true);
      await Promise.all(
        selectedNFTs.value.map((nft) => {
          const creator = new PublicKey(
            //todo currently simply taking the 1st creator
            (nft.onchainMetadata as any).data.creators[0].address
          );
          console.debug('creator is', creator.toBase58());

          addSingleGem(nft.mint, nft.pubkey!, creator);
        })
      );
      console.debug(
        `added another ${selectedNFTs.value.length} gems into staking vault`
      );
       await VaultRef.value.moveNFTsOnChain();
       hideModal();
      }
      catch(ex: unknown)
      {      
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
      estFixedRate,
      widthdrawNFTs,
      totalAccounts,
      totalStakedAccounts,
      totalNFTsStaked,
      totalNFTs,
      farmerbeginStakingTs,
      estRewards
    };
  },
});
</script>

<style scoped></style>
