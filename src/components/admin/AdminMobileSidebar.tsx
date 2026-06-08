'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import AdminNav from '@/components/admin/AdminNav'

export default function AdminMobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors">
        <Menu size={20} />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 border-none">
        <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
          <div className="p-5 border-b border-gray-700">
            <Link href="/" className="text-lg font-bold text-[#c9a84c]" onClick={() => setOpen(false)}>
              MOBİLYA<span className="text-white">STORE</span>
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">Admin Paneli</p>
          </div>
          <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
            <AdminNav />
          </div>
          <div className="p-3 border-t border-gray-700">
            <Link
              href="/auth/giris"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <LogOut size={16} /> Çıkış Yap
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
