import { getBinaryBlobUrl } from "#server/utils/helpers"
import { defineEventHandler, getRouterParam, sendRedirect } from "h3"

export default defineEventHandler(async (event) => {
  const binary = getRouterParam(event, "binary")
  if (!binary) {
    throw createError({ status: 400, message: "Binary name is required" })
  }

  const blobUrl = await getBinaryBlobUrl(binary)
  return sendRedirect(event, blobUrl, 302)
})
