'use client'

import { LayoutDashboard, Gavel, Tag, Users, AlertCircle, Package } from 'lucide-react'
import { ITopNavItems } from './interface'

export const topNavItems: ITopNavItems[] = [{ id: 1, label: '', content: '' }]

export const sidebarItems = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/en/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Auctions',
    items: [
      { label: 'All Auctions', href: '/en/admin/auctions', icon: Gavel },
      { label: 'Vendor Lots', href: '/en/admin/lots', icon: Package },
    ],
  },
  {
    title: 'Catalog',
    items: [{ label: 'Categories', href: '/en/admin/categories', icon: Tag }],
  },
  {
    title: 'Users',
    items: [{ label: 'All Users', href: '/en/admin/users', icon: Users }],
  },
  {
    title: 'Support',
    items: [{ label: 'Disputes', href: '/en/admin/disputes', icon: AlertCircle }],
  },
]
