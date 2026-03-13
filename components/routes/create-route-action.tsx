"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type CreateRouteActionProps = {
  href: string
}

export function CreateRouteAction({ href }: CreateRouteActionProps) {
  return (
    <Button asChild>
      <Link href={href}>
        <Plus data-icon="inline-start" />
        Crear ruta
      </Link>
    </Button>
  )
}
