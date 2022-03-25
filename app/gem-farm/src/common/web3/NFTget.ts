import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { programs } from '@metaplex/js';

const {
  metadata: { Metadata },
} = programs;

export interface INFT {
  pubkey?: PublicKey;
  mint: PublicKey;
  onchainMetadata: unknown;
  externalMetadata: unknown;
}

async function getTokensByOwner(owner: PublicKey, conn: Connection) {
  const tokens = await conn.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  // initial filter - only tokens with 0 decimals & of which 1 is present in the wallet
  return tokens.value
    .filter((t) => {
      const amount = t.account.data.parsed.info.tokenAmount;
      return amount.decimals === 0 && amount.uiAmount === 1;
    })
    .map((t) => {
      return { pubkey: t.pubkey, mint: t.account.data.parsed.info.mint };
    });
}

async function getNFTMetadata(
  mint: string,
  conn: Connection,
  pubkey?: string
): Promise<INFT | undefined> {
  // console.log('Pulling metadata for:', mint);
  try {
    const metadataPDA = await Metadata.getPDA(mint);
    const onchainMetadata = (await Metadata.load(conn, metadataPDA)).data;
    const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
    return {
      pubkey: pubkey ? new PublicKey(pubkey) : undefined,
      mint: new PublicKey(mint),
      onchainMetadata,
      externalMetadata,
    };
  } catch (e) {
    console.log(`failed to pull metadata for token ${mint}`);
  }
}

export async function getNFTMetadataForMany(
  tokens: any[],
  conn: Connection
): Promise<INFT[]> {
  const promises: Promise<INFT | undefined>[] = [];
  tokens.forEach((t) => promises.push(getNFTMetadata(t.mint, conn, t.pubkey)));

  let nfts_temp : { [key: string]: any } = {};
  nfts_temp = (await Promise.all(promises)).filter((n) => !!n);
 
  let tok=[];
  for( let nft in nfts_temp)
  {
    if(nfts_temp[nft].onchainMetadata?.data?.creators?.length > 0)
    {
      let address =  nfts_temp[nft].onchainMetadata.data.creators[0]?.address || " ";
      //console.log("found creator NFT :" + address)
      if(address == '9rbRFrWt81a17ArmzDcUhZmMf6VFiW7Dmy8FETmkj4s4' || address == '3hehTpQPm6b3vsS9iGyDXwqCuVn4vs8RcRbg8T54sBNz'|| address == 'AGDBeUaKReqE3DdtWq6J9TRAarScBRhGJ77cD82wLNvD' || address == '5gx13mAde8kjx2aevhceBJtiPDNo78WppFzd9RdVN5ch' )
        tok.push(nfts_temp[nft]);
    }
  }
  const nfts = tok
  
  //.filter((t) => (t[0].onchainMetadatadata.creators[0] == 'ExQoMC78E7U2UY3jYUN8wWKg1VdvA27WMsbJvgwtw16M' || t.onchainMetadatadata.creators[0] == '9rbRFrWt81a17ArmzDcUhZmMf6VFiW7Dmy8FETmkj4s4' || t.onchainMetadatadata.creators[0] == 'xFKGtNuAUxMvkzxR1jyLcNMZxNGmqeafiEk3tEcNRpt'))
    
  console.log(`found ${nfts.length} metadatas`);

  return nfts as INFT[];
}

export async function getNFTsByOwner(
  owner: PublicKey,
  conn: Connection
): Promise<INFT[]> {
  const tokens = await getTokensByOwner(owner, conn);
  console.log(`found ${tokens.length} tokens`);

  return await getNFTMetadataForMany(tokens, conn);
}
