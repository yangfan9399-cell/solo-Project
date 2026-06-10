import { createFileRoute } from '@tanstack/start'
import { Layout } from '@/components/layout/Layout'
import { ClaimList } from '@/components/claims/ClaimList'

export const Route = createFileRoute('/')({
  async loader() {
    const response = await fetch('/api/claims')
    const { claims } = await response.json()
    return { claims }
  },
  component: IndexPage
})

function IndexPage() {
  const { claims } = Route.useLoaderData()

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">索赔列表</h2>
        <p className="text-secondary mt-1">显示所有质量索赔记录</p>
      </div>
      <ClaimList claims={claims} />
    </Layout>
  )
}
