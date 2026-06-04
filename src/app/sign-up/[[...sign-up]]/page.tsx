import { SignUp } from "@clerk/nextjs";

/**
 * Registro de CLIENTES (Google + email/password habilitados en Clerk).
 * Los comercios NO se autoregistran: el superadmin crea la organización
 * e invita a los usuarios.
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignUp
        appearance={{ elements: { rootBox: "mx-auto" } }}
        signInUrl="/sign-in"
      />
    </div>
  );
}
