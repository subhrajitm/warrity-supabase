import { ReactNode, use } from "react"
import { notFound } from "next/navigation"

export default function EditProductLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  
  // Validate the ID parameter at the layout level
  if (!id || typeof id !== "string") {
    notFound()
  }

  return children
}
