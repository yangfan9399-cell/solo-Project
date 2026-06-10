import { createStartHandler } from '@tanstack/start/server'
import { getRouter } from './router'

export default createStartHandler({ router: getRouter() })
