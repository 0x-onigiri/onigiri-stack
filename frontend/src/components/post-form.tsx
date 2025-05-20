"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { uploadToWalrus } from '@/lib/sui/walrus'
import { createPost } from '@/lib/sui-client'
import { NORI } from "@/constants";

export function PostForm() {
  const router = useRouter()
  const [text, setText] = useState("");
  const { toast } = useToast();
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const handleSubmit = async () => {
    // ここで投稿処理を実装します（例: APIへの送信など）
    console.log("投稿内容:", text);

    try {
      const contentBlobId = await uploadToWalrus(text)
      console.log('contentBlobId', contentBlobId)

      const tx = new Transaction()
      await createPost(tx, text, contentBlobId)


      const { digest } = await signAndExecuteTransaction({ transaction: tx })
      const { objectChanges } = await suiClient.waitForTransaction({
        digest,
        options: { showObjectChanges: true, showEffects: true },
      })

      const objChange = objectChanges?.find(
        change =>
          change.type === 'created' && change.objectType === `${NORI.testnet.packageId}::post::Post`,
      )
      const postId = objChange && objChange.type === 'created' ? objChange.objectId : null
      console.log('postId', postId)
      if (!postId) {
        console.error('Post ID not found')
        return
      }

      toast({
        title: "投稿しました",
        description: text,
      });
      router.push(`/${postId}`)
    }
    catch (error) {
      console.error('error', error)
    }
    finally {

    }
  };

  return (
    <div className="w-full space-y-4">
      <Textarea
        placeholder="いまどうしてる？"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[100px] resize-none"
      />
      <Button onClick={handleSubmit} disabled={!text.trim()} className="self-end float-right">
        投稿する
      </Button>
    </div>
  );
}
