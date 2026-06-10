import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import InventoryList from './pages/InventoryList'
import AssetList from './pages/AssetList'
import ApprovalList from './pages/ApprovalList'
import ReviewPage from './pages/ReviewPage'
import InventoryDetail from './pages/InventoryDetail'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <InventoryList />,
      },
      {
        path: '/inventory/:id',
        element: <InventoryDetail />,
      },
      {
        path: '/assets',
        element: <AssetList />,
      },
      {
        path: '/approval',
        element: <ApprovalList />,
      },
      {
        path: '/review',
        element: <ReviewPage />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}