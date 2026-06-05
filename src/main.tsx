import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './App'
import BookingList from './pages/BookingList'
import BookingDetail from './pages/BookingDetail'
import NewBooking from './pages/NewBooking'
import Dashboard from './pages/Dashboard'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <BookingList />,
      },
      {
        path: 'booking/new',
        element: <NewBooking />,
      },
      {
        path: 'booking/:id',
        element: <BookingDetail />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
