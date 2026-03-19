import * as React from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PageSectionCardProps = {
  title: React.ReactNode
  description?: React.ReactNode
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  footerClassName?: string
}

export function PageSectionCard({
  title,
  description,
  headerAction,
  footer,
  children,
  className,
  contentClassName,
  footerClassName,
}: PageSectionCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {headerAction ? <CardAction>{headerAction}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter className={cn(footerClassName)}>{footer}</CardFooter> : null}
    </Card>
  )
}
