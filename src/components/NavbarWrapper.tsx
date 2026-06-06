'use client'

import { Navbar } from './Navbar'
import { useRole } from '@/context/RoleContext'

export function NavbarWrapper() {
  const { currentRole, setCurrentRole } = useRole()
  return <Navbar currentRole={currentRole} onRoleChange={setCurrentRole} />
}
