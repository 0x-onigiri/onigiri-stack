import { fetchPost } from "@/lib/sui-client";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 15,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 1,
        margin: "25px 0 10px",
        color: "gray",
      }}
    >
      {children}
    </label>
  )
}


function processText(text: string) {
  if (!text) return []

  // Split the text by [Redacted] to get parts before and after
  const parts = text.split("[Redacted]")

  // Create an array of elements with redacted parts as black boxes
  const elements = []

  for (let i = 0; i < parts.length; i++) {
    // Add the regular text
    if (parts[i]) {
      elements.push(<span key={`text-${i}`}>{parts[i]}</span>)
    }

    // Add the redacted box (except after the last part)
    if (i < parts.length - 1) {
      elements.push(
        <span
          key={`redacted-${i}`}
          style={{
            backgroundColor: "black",
            color: "black",
            padding: "0 4px",
            borderRadius: "2px",
            margin: "0 2px",
          }}
        >
          REDACTED
        </span>,
      )
    }
  }

  return elements
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await fetchPost(id)
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-xl mx-auto p-4">
      <h2>{post.publicContent}</h2>

       {/* <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          padding: "40px 50px",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: 28,
          backgroundColor: "white",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 30 }}>title</div>

        <Label>Redacted Content</Label>
        <div style={{ display: "flex", lineHeight: 1.5 }}>{processText("this is a [Redacted] document that you need. is about [Redacted] and...")}</div>

        <div
          style={{
            marginTop: "auto",
            fontSize: 16,
            color: "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>Generated on {new Date().toLocaleDateString()}</div>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "6px 12px",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            CONFIDENTIAL
          </div>
        </div>
      </div> */}

    </main>
  );
}
