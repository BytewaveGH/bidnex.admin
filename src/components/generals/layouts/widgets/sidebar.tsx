"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Fragment } from "react"
import Image from "next/image"
import byteLogo from "@/assets/images/byte.png"


interface SidebarProps {
  isGrouped?: boolean
  groupedItems?: any[]
}
// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar({ isGrouped, groupedItems = [] }: SidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-3 border-b border-sidebar-border flex items-center gap-2.5">
          <Image src={byteLogo} alt="ByteWave" width={34} height={34} className="object-contain rounded-lg flex-shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-endeavour tracking-tight">Gems.Bid</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">Admin Portal</span>
          </div>
        </div>
        <SidebarGroup>
          {isGrouped ? (
            <>
              {groupedItems.map((group:{title:string, items: {label:string, href:string, icon:React.ReactNode | any}[]}) => {
                return (
                  <>
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton asChild>
                              <a href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </>
                )
              })}
            </>

          ) :
            (
              <Fragment key={"no-group"}>
                <SidebarGroupLabel>Application</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </Fragment>
            )
          }
        </SidebarGroup>
      </SidebarContent >
    </Sidebar >
  )
}
