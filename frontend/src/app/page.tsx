import { PostForm } from "@/components/post-form"; // インポートパスをケバブケースに変更

export default function Home() {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold self-center">ホーム</h1>
      <PostForm />
      {/* 投稿された内容を表示するエリア（将来的に実装） */}
    </main>
  );
}
