export default defineEventHandler(async (event) => {
  const rawToken = extractServiceToken(getHeader(event, "authorization"))
  if (!rawToken) {
    throw createError({ statusCode: 401, statusMessage: "Service token required (Bearer st_...)" })
  }

  const serviceToken = await requireServiceToken(rawToken)

  // Rate limit: 120 requests per hour per token
  await enforceRateLimit(event, `service-token:get:${serviceToken.id}`, 120)

  return {
    serviceToken: {
      id: serviceToken.id,
      name: serviceToken.name,
      environment: serviceToken.environment,
      expiresAt: serviceToken.expiresAt,
      project: serviceToken.project,
    },
  }
})

defineRouteMeta({
  openAPI: {
    summary: "Validate service token",
    description: "Validates a service token and returns its scoped project and allowed environments. Used by the CLI for CI authentication.",
    tags: ["Service Tokens"],
    parameters: [
      { in: "header", name: "Authorization", required: true, schema: { type: "string" }, description: "Bearer service token (e.g. `Bearer st_...`)." },
    ],
    responses: {
      200: { description: "Service token details and scoped project" },
      401: { description: "Missing, invalid, or expired service token" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
