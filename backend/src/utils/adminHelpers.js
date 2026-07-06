const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const parseDateRange = (query) => {
  const createdAt = {};

  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) {
      createdAt.gte = from;
    }
  }

  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildUniqueRestaurantSlug = async (prisma, name) => {
  const baseSlug = slugify(name) || "restaurant";
  const existing = await prisma.restaurant.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  });

  if (existing.length === 0) return baseSlug;

  const suffixes = existing
    .map((e) => e.slug.replace(`${baseSlug}-`, ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);

  const maxSuffix = suffixes.length ? Math.max(...suffixes) : 0;
  return maxSuffix === 0 ? `${baseSlug}-1` : `${baseSlug}-${maxSuffix + 1}`;
};

const buildOrderFilters = (query) => {
  const createdAt = parseDateRange(query);
  const where = {
    ...(createdAt ? { createdAt } : {}),
  };

  if (query.status?.trim()) {
    where.status = query.status.trim();
  }

  if (query.paymentMethod?.trim()) {
    where.paymentMethod = query.paymentMethod.trim();
  }

  if (query.paymentStatus?.trim()) {
    where.paymentStatus = query.paymentStatus.trim();
  }

  return Object.keys(where).length ? where : undefined;
};

const serializeSupportOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  tipAmount: Number(order.tipAmount || 0),
  restaurantInstructions: order.restaurantInstructions,
  deliveryInstructions: order.deliveryInstructions,
  totalAmount: Number(order.totalAmount),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        city: order.restaurant.city,
        vendor: order.restaurant.vendor
          ? {
              id: order.restaurant.vendor.id,
              name: order.restaurant.vendor.name,
              email: order.restaurant.vendor.email,
              phone: order.restaurant.vendor.phone,
            }
          : null,
      }
    : null,
  rider: order.rider
    ? {
        id: order.rider.id,
        name: order.rider.name,
        email: order.rider.email,
        phone: order.rider.phone,
      }
    : null,
  customer: order.customer
    ? {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      }
    : null,
  address: order.address,
  items: order.items?.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    menuItem: item.menuItem
      ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
        }
      : null,
  })),
});

export {
  parsePagination,
  parseDateRange,
  slugify,
  buildUniqueRestaurantSlug,
  buildOrderFilters,
  serializeSupportOrder,
};
