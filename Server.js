const fastify = require("fastify")({ logger: true });
const rateLimit = require("@fastify/rate-limit");
const swagger = require("@fastify/swagger");
const swaggerUI = require("@fastify/swagger-ui");

const pool = require("./db");
const redis = require("./redisClient");

fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
});

// Swagger config
fastify.register(swagger, {
  swagger: {
    info: {
      title: "Scalable API",
      description: "Backend API documentation",
      version: "1.0.0"
    }
  }
});

fastify.register(swaggerUI, {
  routePrefix: "/docs"
});

fastify.get("/users", async () => {

  const cache = await redis.get("users");

  if (cache) {
    return JSON.parse(cache);
  }

  const result = await pool.query("SELECT * FROM users");

  await redis.set("users", JSON.stringify(result.rows), {
    EX: 60
  });

  return result.rows;
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Server running on port 3000");
});