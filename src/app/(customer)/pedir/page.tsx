import { redirect } from "next/navigation";

/** El descubrimiento de restaurantes vive en Inicio (/cuenta). */
export default function PedirPage() {
  redirect("/cuenta");
}
