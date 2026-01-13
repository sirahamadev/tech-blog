"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, Github, Twitter, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "Notes", href: "/notes" },
]

const socials = [
  { name: "GitHub", href: "https://github.com", icon: Github },
  { name: "Twitter", href: "https://twitter.com", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">sirahama</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Social Icons */}
        <div className="hidden items-center gap-2 md:flex">
          {socials.map((social) => (
            <Button key={social.name} variant="ghost" size="icon" asChild>
              <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                <social.icon className="h-4 w-4" />
              </a>
            </Button>
          ))}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>
              <div className="flex flex-col gap-4 pt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {socials.map((social) => (
                    <Button key={social.name} variant="ghost" size="icon" asChild>
                      <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                        <social.icon className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
