import { Transaction } from '@mysten/sui/transactions'
import { AGGREGATOR, NORI } from '@/constants'
import { objResToFields, objResToOwner } from '@polymedia/suitcase-core'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import type { Post } from '@/types'
import { PostModule } from '@/lib/sui/post-functions'
import { uploadToWalrus } from '@/lib/sui/walrus'

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })


export async function fetchPost(
  postId: string,
) {
  console.log('postId', postId)
  const postObject = await suiClient.getObject({
    id: postId,
    options: {
      showContent: true,
      showOwner: true,
    },
  })
  console.log('postObject', postObject)
  const fields = objResToFields(postObject)
  console.log('fields', fields)
  const authorAddress = objResToOwner(postObject)

  if (authorAddress === 'unknown') {
    throw new Error('Invalid post owner')
  }

  const post: Post = {
    id: fields.id.id,
    author: authorAddress,
    publicContent: fields.public_content,
    contentBlobId: fields.content_blob_id,
  }

  console.log('post', post)

  return post
}

// export async function fetchPostContent(
//   blobId: string,
// ) {
//   try {
//     const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`)

//     if (!response.ok) {
//       throw new Error(
//         `コンテンツの取得に失敗しました: ${response.statusText}`,
//       )
//     }

//     return await response.text()
//   }
//   catch (err) {
//     console.error('コンテンツ取得エラー:', err)
//   }
// }



export async function createPost(tx: Transaction, publicContent: string, content: string) {
  const contentBlobId = await uploadToWalrus(content)

  return PostModule.createPost(
    tx,
    NORI.testnet.packageId,
    publicContent,
    contentBlobId,
  )
}
