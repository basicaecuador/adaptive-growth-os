export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenido a Adaptive Growth OS
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Marcas activas', value: '—' },
          { label: 'Contenido este mes', value: '—' },
          { label: 'Pendientes de aprobación', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold text-card-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground">Primeros pasos</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Crea tu primera organización en <strong className="text-foreground">Organizaciones</strong></li>
          <li>Agrega una marca en <strong className="text-foreground">Marcas</strong></li>
          <li>Genera contenido con IA en <strong className="text-foreground">Contenido</strong></li>
        </ol>
      </div>
    </div>
  )
}
