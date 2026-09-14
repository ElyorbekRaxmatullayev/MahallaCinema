import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MovieClient from "./MovieClient";

export const dynamic = "force-dynamic";

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound();

  return <MovieClient event={event} />;
}
