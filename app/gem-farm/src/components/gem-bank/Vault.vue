<template>
  <!--control buttons-->
  <div class="mb-10 flex flex-wrap justify-center">
    <!-- <button
      v-if="
        (toWalletNFTs && toWalletNFTs.length) ||
        (toVaultNFTs && toVaultNFTs.length)
      "
      class="enabled-button nes-btn huVjiU is-success uxbuttonleft"
      @click="moveNFTsOnChain"
    >
      Move NFTs
    </button> -->
    <slot />
  </div>

  <!--wallet + vault view-->
  <div class="flex items-stretch">
    <!--left-->
    <NFTGrid
      title="Your wallet"
      class="flex-1 huVjiU"
      :nfts="desiredWalletNFTs"
      @selected="handleWalletSelected"
    />

    <!--mid-->
    <div class="m-2 flex flex-col">
      <ArrowButton
        :disabled="vaultLocked"
        class="my-2 "
        @click="moveNFTsFE(false)"
      />
      <ArrowButton
        :disabled="vaultLocked"
        class="my-2"
        :left="true"
        @click="moveNFTsFE(true)"
      />
    </div>

    <!--right-->
    <NFTGrid
      v-if="bank && vault"
      title="Staking Wallet"
      class="flex-1 huVjiU"
      :nfts="desiredVaultNFTs"
      @selected="handleVaultSelected"
    >
      <div
        v-if="vaultLocked"
        class="locked flex-col justify-center items-center align-center"
      >
      <div>
        <p class="mt-10">STAKED - Vault Staking</p>
        <p v-if="parseDate(farmerAcc.minStakingEndsTs) <  Date.now()" class="mt-10">NFTs Locked for</p>
        <!-- <p class="mt-10">End Date: {{ parseDate(farmerAcc.minStakingEndsTs) }}</p>     -->
        
        <vue-countdown v-if="(Math.floor(farmerAcc.minStakingEndsTs - Date.now()/1000) *1000) > 0" :time="Math.floor(farmerAcc.minStakingEndsTs - Date.now()/1000) *1000" v-slot="{ days, hours, minutes, seconds }">
         {{(seconds > 0) ? "Time Remaining：" : ""}}{{ (days > 0) ? days + " d ," : ""}} {{ (hours > 0) ? hours + " h ," : ""}} {{ (minutes > 0) ? minutes + " m ," : ""}} {{ (seconds > 0) ? seconds + " s" : ""}}
        </vue-countdown>
      </div>
      </div>
    </NFTGrid>          
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import NFTGrid from '@/components/gem-bank/NFTGrid.vue';
import ArrowButton from '@/components/ArrowButton.vue';
import useWallet from '@/composables/wallet';
import useCluster from '@/composables/cluster';
import {
  getNFTMetadataForMany,
  getNFTsByOwner,
  INFT,
} from '@/common/web3/NFTget';
import { initGemBank } from '@/common/gem-bank';
import { PublicKey } from '@solana/web3.js';
import { getListDiffBasedOnMints, removeManyFromList } from '@/common/util';
import { BN } from '@project-serum/anchor';
import { parseDate } from '@/common/util';
import VueCountdown from '@chenfengyuan/vue-countdown';

export default defineComponent({
  inheritAttrs: false,
  components: { ArrowButton, NFTGrid, VueCountdown},
  props: {
    vault: String,    
    farmerAcc: { type: Object}
  },
  emits: ['selected-wallet-nft','selected-vault-nft'],
  
  setup(props, ctx) {
    const { wallet, getWallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    // --------------------------------------- state

    //current walet/vault state
    const currentWalletNFTs = ref<INFT[]>([]);
    const currentVaultNFTs = ref<INFT[]>([]);
    //selected but not yet moved over in FE
    const selectedWalletNFTs = ref<INFT[]>([]);
    const selectedVaultNFTs = ref<INFT[]>([]);
    //moved over in FE but not yet onchain
    const desiredWalletNFTs = ref<INFT[]>([]);
    const desiredVaultNFTs = ref<INFT[]>([]);
    //moved over onchain
    const toWalletNFTs = ref<INFT[]>([]);
    const toVaultNFTs = ref<INFT[]>([]);

    // --------------------------------------- populate initial nfts

    const populateWalletNFTs = async () => {
      // zero out to begin with
      currentWalletNFTs.value = [];
      selectedWalletNFTs.value = [];
      desiredWalletNFTs.value = [];
      
      if (getWallet()) {
        currentWalletNFTs.value = await getNFTsByOwner(
          getWallet()!.publicKey!,
          getConnection()
        );
        desiredWalletNFTs.value = [...currentWalletNFTs.value];
      }
    };
  
    const populateVaultNFTs = async () => {
      // zero out to begin with
      currentVaultNFTs.value = [];
      selectedVaultNFTs.value = [];
      desiredVaultNFTs.value = [];

      const foundGDRs = await gb.fetchAllGdrPDAs(vault.value);
      if (foundGDRs && foundGDRs.length) {
        gdrs.value = foundGDRs;
        console.debug(`found a total of ${foundGDRs.length} gdrs`);

        const mints = foundGDRs.map((gdr: any) => {
          return { mint: gdr.account.gemMint };
        });
        currentVaultNFTs.value = await getNFTMetadataForMany(
          mints,
          getConnection()
        );
        desiredVaultNFTs.value = [...currentVaultNFTs.value];
        console.debug(
          `populated a total of ${currentVaultNFTs.value.length} vault NFTs`
        );
      }
    };

    const updateVaultState = async () => {
      vaultAcc.value = await gb.fetchVaultAcc(vault.value)
      console.debug("vault locked"+ vaultAcc.value.locked);
      bank.value = vaultAcc.value.bank;
      vaultLocked.value = vaultAcc.value.locked;
    };

    
    watch([wallet, cluster], async () => {
      gb = await initGemBank(getConnection(), getWallet()!);

      //populate wallet + vault nfts
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    });
    // program to display a text using setInterval method
    onMounted(async () => {
      gb = await initGemBank(getConnection(), getWallet()!);

      //prep vault + bank variables
      vault.value = new PublicKey(props.vault!);
      await updateVaultState();

      //populate wallet + vault nfts
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    });

    // --------------------------------------- moving nfts

    const handleWalletSelected = (e: any) => {
      if (e.selected) {
        selectedWalletNFTs.value.push(e.nft);
      } else {
        const index = selectedWalletNFTs.value.indexOf(e.nft);
        selectedWalletNFTs.value.splice(index, 1);
      }
      ctx.emit('selected-wallet-nft', selectedWalletNFTs.value);
    };

    const handleVaultSelected = (e: any) => {
      if (e.selected) {
        selectedVaultNFTs.value.push(e.nft);
      } else {
        const index = selectedVaultNFTs.value.indexOf(e.nft);
        selectedVaultNFTs.value.splice(index, 1);
      }
      ctx.emit('selected-vault-nft', selectedVaultNFTs.value);
    };

    const moveNFTsFE = (moveLeft: boolean) => {
      if (moveLeft) {        
        //push selected vault nfts into desired wallet
        desiredWalletNFTs.value.push(...selectedVaultNFTs.value);
        //remove selected vault nfts from desired vault
        removeManyFromList(selectedVaultNFTs.value, desiredVaultNFTs.value);
        //empty selection list
        selectedVaultNFTs.value = [];  
        
        ctx.emit('selected-wallet-nft', selectedVaultNFTs.value);
              
      } else {
        //push selected wallet nfts into desired vault
        desiredVaultNFTs.value.push(...selectedWalletNFTs.value);
        //remove selected wallet nfts from desired wallet
        removeManyFromList(selectedWalletNFTs.value, desiredWalletNFTs.value);
        //empty selected walelt
        selectedWalletNFTs.value = [];        
        ctx.emit('selected-vault-nft', selectedVaultNFTs.value);
      }
    };

    //todo jam into single tx
    const moveNFTsOnChain = async () => {
      for (const nft of toVaultNFTs.value) {
        console.debug(nft);
        const creator = new PublicKey(
          //todo currently simply taking the 1st creator
          (nft.onchainMetadata as any).data.creators[0].address
        );
        console.debug('creator is', creator.toBase58());
        await depositGem(nft.mint, creator, nft.pubkey!);
      }
      for (const nft of toWalletNFTs.value) {
        await withdrawGem(nft.mint);
      }
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    };

    //to vault = vault desired - vault current
    watch(
      desiredVaultNFTs,
      () => {
        toVaultNFTs.value = getListDiffBasedOnMints(
          desiredVaultNFTs.value,
          currentVaultNFTs.value
        );
        console.debug('to vault nfts are', toVaultNFTs.value);
      },
      { deep: true }
    );

    //to wallet = wallet desired - wallet current
    watch(
      desiredWalletNFTs,
      () => {
        toWalletNFTs.value = getListDiffBasedOnMints(
          desiredWalletNFTs.value,
          currentWalletNFTs.value
        );
        console.debug('to wallet nfts are', toWalletNFTs.value); 
      },
      { deep: true }
    );

    // --------------------------------------- gem bank

    let gb: any;
    const bank = ref<PublicKey>();
    const vault = ref<PublicKey>();
    const vaultAcc = ref<any>();
    const gdrs = ref<PublicKey[]>([]);
    const vaultLocked = ref<boolean>(false);

    const depositGem = async (
      mint: PublicKey,
      creator: PublicKey,
      source: PublicKey
    ) => {
      const { txSig } = await gb.depositGemWallet(
        bank.value,
        vault.value,
        new BN(1),
        mint,
        source,
        creator
      );
      console.log('deposit done', txSig);
    };

    const withdrawGem = async (mint: PublicKey) => {
      const { txSig } = await gb.withdrawGemWallet(
        bank.value,
        vault.value,
        new BN(1),
        mint
      );
      console.log('withdrawal done', txSig);
    };

    // --------------------------------------- return

    return {
      wallet,
      desiredWalletNFTs,
      desiredVaultNFTs,
      currentWalletNFTs,
      currentVaultNFTs,
      toVaultNFTs, 
      toWalletNFTs,
      handleWalletSelected,
      handleVaultSelected,
      moveNFTsFE,
      moveNFTsOnChain,
      parseDate,
      bank,
      // eslint-disable-next-line vue/no-dupe-keys
      vault,
      vaultLocked,
    };
  },
});
</script>

<style scoped>

</style>
