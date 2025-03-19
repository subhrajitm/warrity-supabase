import { Suspense, use } from "react"
import AdminEditProductForm from "./AdminEditProductForm"

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <p className="text-amber-800 text-xl">Loading product data...</p>
        </div>
      }>
        <AdminEditProductForm productId={id} />
      </Suspense>
    </div>
  )
}