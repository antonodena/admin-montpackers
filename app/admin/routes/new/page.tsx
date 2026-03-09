import { PlusCircle } from "lucide-react"

export default function NewRoutePage() {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <PlusCircle className="size-5" />
        <h1 className="text-lg font-semibold">Crear ruta</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Formulario de creación de ruta pendiente de siguiente iteración.
      </p>
    </section>
  )
}
