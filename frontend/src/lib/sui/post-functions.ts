import { Transaction, TransactionResult, TransactionArgument } from '@mysten/sui/transactions'


export const PostModule
= {
  createPost: (
    tx: Transaction,
    packageId: string,
    publicContent: string,
    contentBlobId: string,
  ): TransactionResult => {
    return tx.moveCall({
      target: `${packageId}::post::create_post`,
      arguments: [
        tx.pure.string(publicContent),
        tx.pure.string(contentBlobId),
      ],
    })
  },
}
