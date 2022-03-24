import { readonly, ref } from 'vue';
import { Commitment, Connection } from '@solana/web3.js';

export enum Cluster {
  Mainnet = 'mainnet',
  Devnet = 'devnet',
  Testnet = 'testnet',
  Localnet = 'localnet',
}

export enum BankAddr {
   FARM = '2S2G3UQQG4wABb5QgWreEPRrgPb5PSABJKFb51RTzZdY',
  // BATC = 'BMpfNmid8wLrQaYNo9Ro3tJetCXyYJBdY83e31PZWWAF',
}

const clusterURLMapping = {
  mainnet: process.env.VUE_APP_MAINNET_URL || 'https://restless-silent-cloud.solana-mainnet.quiknode.pro/',
  // mainnet: process.env.VUE_APP_DEVNET_URL || 'https://api.devnet.solana.com',
  devnet: process.env.VUE_APP_DEVNET_URL || 'https://api.devnet.solana.com',
  testnet: process.env.VUE_APP_TESTNET_URL || 'https://api.testnet.solana.com',
  localnet: process.env.VUE_APP_LOCALNET_URL || 'http://localhost:8899',
};

const cluster = ref<Cluster>(Cluster.Devnet);
const bankAddr = ref<BankAddr>(BankAddr.FARM);

export default function useCluster() {
  const getClusterURL = (): string => clusterURLMapping[cluster.value];

  const getConnection = (committment?: Commitment): Connection =>
    new Connection(getClusterURL(), committment ?? 'processed');

  const setCluster = (newCluster: Cluster) => {
    cluster.value = newCluster;
    // capping at 20 chars due to security (not to expose the token)
    console.log(
      `Cluster updated,  now ${newCluster} (${getClusterURL().substr(0, 20)})`
    );
  };

  return {
    bankAddr: readonly(bankAddr),
    cluster: readonly(cluster),
    getClusterURL,
    getConnection,
    setCluster,
  };
}
