import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'

import { Route as IndexRoute } from './routes/index'
import { Route as RecallIdRoute } from './routes/recalls.$id'
import { Route as RecallNewRoute } from './routes/recalls.new'
import { Route as AnalyticsRoute } from './routes/analytics'

const routeTree = rootRoute.addChildren([
  IndexRoute,
  RecallIdRoute,
  RecallNewRoute,
  AnalyticsRoute,
])

export const router = createRouter({ routeTree })

export default routeTree
