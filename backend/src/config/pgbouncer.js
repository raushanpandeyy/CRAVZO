import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const getReplicaUrl = () => {
  if (env.REPLICA_DATABASE_URL) return env.REPLICA_DATABASE_URL;
  if (env.PGBOUNCER_URL) return env.PGBOUNCER_URL;
  return null;
};

const replicaUrl = getReplicaUrl();

const prismaRead = replicaUrl
  ? new PrismaClient({
      log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      datasources: {
        db: { url: replicaUrl },
      },
    })
  : null;

export { prismaRead };
