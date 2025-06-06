import { SealClient, SessionKey, NoAccessError, EncryptedObject } from '@mysten/seal'
import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import React from 'react'
import { COINS_TYPE_LIST, AGGREGATOR } from '@/constants'

export type MoveCallConstructor = (tx: Transaction, id: string) => void

export const downloadAndDecrypt = async (
  blobIds: string[],
  sessionKey: SessionKey,
  suiClient: SuiClient,
  sealClient: SealClient,
  moveCallConstructor: (tx: Transaction, id: string) => void,
  setError: (error: string | null) => void,
  setDecryptedFileUrls: (urls: string[]) => void,
  setReloadKey: (updater: (prev: number) => number) => void,
) => {
  // First, download all files in parallel (ignore errors)
  const downloadResults = await Promise.all(
    blobIds.map(async (blobId) => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        const aggregatorUrl = `${AGGREGATOR}/v1/blobs/${blobId}`
        console.log('aggregatorUrl', aggregatorUrl)
        const response = await fetch(aggregatorUrl, { signal: controller.signal })
        clearTimeout(timeout)
        if (!response.ok) {
          return null
        }
        return await response.arrayBuffer()
      }
      catch (err) {
        console.error(`Blob ${blobId} cannot be retrieved from Walrus`, err)
        return null
      }
    }),
  )

  // Filter out failed downloads
  const validDownloads = downloadResults.filter((result): result is ArrayBuffer => result !== null)
  console.log('validDownloads count', validDownloads.length, validDownloads)

  if (validDownloads.length === 0) {
    const errorMsg
      = 'Cannot retrieve files from this Walrus aggregator, try again (a randomly selected aggregator will be used). Files uploaded more than 1 epoch ago have been deleted from Walrus.'
    console.error(errorMsg)
    setError(errorMsg)
    return
  }

  // Fetch keys in batches of <=10
  for (let i = 0; i < validDownloads.length; i += 10) {
    const batch = validDownloads.slice(i, i + 10)
    console.log('batch', batch)
    const ids = batch.map(enc => EncryptedObject.parse(new Uint8Array(enc)).id)
    const tx = new Transaction()
    ids.forEach(id => moveCallConstructor(tx, id))
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true })
    try {
      await sealClient.fetchKeys({ ids, txBytes, sessionKey, threshold: 2 })
    }
    catch (err) {
      console.log(err)
      const errorMsg
        = err instanceof NoAccessError
          ? 'No access to decryption keys'
          : 'Unable to decrypt files, try again'
      console.error(errorMsg, err)
      setError(errorMsg)
      return
    }
  }

  // Then, decrypt files sequentially
  const decryptedFileUrls: string[] = []
  for (const encryptedData of validDownloads) {
    const fullId = EncryptedObject.parse(new Uint8Array(encryptedData)).id
    const tx = new Transaction()
    moveCallConstructor(tx, fullId)
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true })
    try {
      const decryptedFileBytes = await sealClient.decrypt({
        data: new Uint8Array(encryptedData),
        sessionKey,
        txBytes,
      })
      const textDecoder = new TextDecoder('utf-8')
      const decryptedString = textDecoder.decode(decryptedFileBytes)
      decryptedFileUrls.push(decryptedString)
    }
    catch (err) {
      console.log(err)
      const errorMsg
        = err instanceof NoAccessError
          ? 'No access to decryption keys'
          : 'Unable to decrypt files, try again'
      console.error(errorMsg, err)
      setError(errorMsg)
      return
    }
  }

  if (decryptedFileUrls.length > 0) {
    setDecryptedFileUrls(decryptedFileUrls)
    setReloadKey(prev => prev + 1)
  }
}

export const getObjectExplorerLink = (id: string): React.ReactElement => {
  return React.createElement(
    'a',
    {
      href: `https://testnet.suivision.xyz/object/${id}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      style: { textDecoration: 'underline' },
    },
    id.slice(0, 10) + '...',
  )
}

export async function getInputCoins(
  tx: Transaction,
  client: SuiClient,
  owner: string,
  coinType: string,
  ...amounts: number[]
) {
  let totalAmount = 0
  for (const amount of amounts) {
    totalAmount += amount
  }

  if (totalAmount == 0) {
    return tx.moveCall({
      target: '0x2::coin::zero',
      typeArguments: [coinType],
    })
  }

  if (coinType === COINS_TYPE_LIST.SUI) {
    return tx.splitCoins(
      tx.gas,
      amounts.map(amount => tx.pure.u64(amount)),
    )
  }
  else {
    const { data: userCoins } = await client.getCoins({ owner, coinType })
    const [mainCoin, ...otherCoins] = userCoins.map(coin =>
      tx.objectRef({
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
      }),
    )
    if (!mainCoin) {
      return tx.moveCall({
        target: `0x2::coin::zero`,
        typeArguments: [coinType],
      })
    }

    if (otherCoins.length > 0) {
      tx.mergeCoins(mainCoin, otherCoins)
    }

    return tx.splitCoins(
      mainCoin,
      amounts.map(amount => tx.pure.u64(amount)),
    )
  }
}
