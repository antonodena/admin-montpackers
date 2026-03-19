"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type CreatePoiActionProps = {
  href: string
}

export function CreatePoiAction({ href }: CreatePoiActionProps) {
  return (
    <Button asChild>
      <Link href={href}>
        <Plus data-icon="inline-start" />
        Crear POI
      </Link>
    </Button>
  )
}
