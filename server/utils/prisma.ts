import pkg from '@prisma/client'

const _pkg: any = pkg
const PrismaClient = _pkg.PrismaClient as any

const prisma = new PrismaClient()

export default prisma
export { PrismaClient }
