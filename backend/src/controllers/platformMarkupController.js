import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// GET /api/v1/platform-markup — get all category markups
export const getAllMarkups = async (req, res) => {
  const markups = await prisma.platformMarkup.findMany({
    orderBy: { category: "asc" },
  });
  res.status(200).json(
    apiResponse({
      message: "Platform markups fetched",
      data: markups.map((m) => ({ ...m, markup: Number(m.markup) })),
    }),
  );
};

// PUT /api/v1/platform-markup/:category — upsert markup for a category
export const upsertMarkup = async (req, res) => {
  const { category } = req.params;
  const markup = Number(req.body.markup);

  if (!Number.isFinite(markup) || markup < 0) {
    throw new ApiError(400, "markup must be a non-negative number");
  }

  const record = await prisma.platformMarkup.upsert({
    where: { category },
    update: { markup, updatedAt: new Date() },
    create: { category, markup },
  });

  res.status(200).json(
    apiResponse({
      message: `Markup for "${category}" updated`,
      data: { ...record, markup: Number(record.markup) },
    }),
  );
};

// DELETE /api/v1/platform-markup/:category — remove a category markup
export const deleteMarkup = async (req, res) => {
  const { category } = req.params;
  const existing = await prisma.platformMarkup.findUnique({ where: { category } });
  if (!existing) throw new ApiError(404, "Markup not found for this category");

  await prisma.platformMarkup.delete({ where: { category } });

  res.status(200).json(apiResponse({ message: `Markup for "${category}" deleted`, data: null }));
};
