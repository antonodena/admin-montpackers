import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PageMessageCardProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  footerClassName?: string
}

export function PageMessageCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  footerClassName,
}: PageMessageCardProps) {
  const hasHeader = title || description

  return (
    <Card className={cn(className)}>
      {hasHeader ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      {children ? <CardContent className={cn(contentClassName)}>{children}</CardContent> : null}
      {action ? <CardFooter className={cn(footerClassName)}>{action}</CardFooter> : null}
    </Card>
  )
}
