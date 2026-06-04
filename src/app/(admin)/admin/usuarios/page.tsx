import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminUsuariosPage() {
  return (
    <ModulePlaceholder
      title="Usuarios"
      phase="Fase 2"
      description="Gestión global de usuarios y sus membresías/roles por organización."
      features={[
        "Listado global de usuarios",
        "Roles por organización",
        "Invitaciones",
        "Suspender / reactivar",
        "Asignar superadmin",
        "Auditoría de accesos",
      ]}
    />
  );
}
