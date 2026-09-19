import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config.js";
import { routes } from "./routes.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await app.register(jwt, { secret: env.API_SECRET });

await app.register(swagger, {
  openapi: {
    info: {
      title: "Sports Analysis API",
      version: "1.0.0",
      description: "API de dados, estatísticas, value betting e análise de futebol."
    },
    servers: [{ url: `http://localhost:${env.PORT}` }]
  }
});

await app.register(swaggerUi, { routePrefix: "/docs" });
await app.register(routes);

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  reply.code((error as any).statusCode ?? 500).send({
    error: "internal_error",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message
  });
});

await app.listen({ port: env.PORT, host: "0.0.0.0" });
