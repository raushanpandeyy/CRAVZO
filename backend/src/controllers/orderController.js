import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const serializeOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  packagingFee: Number(order.packagingFee),
  taxAmount: Number(order.taxAmount),
  totalAmount: Number(order.totalAmount),
  notes: order.notes,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  restaurant: order.restaurant
    ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
        imageUrl: order.restaurant.imageUrl,
        city: order.restaurant.city,
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
          imageUrl: item.menuItem.imageUrl,
        }
      : null,
  })),
});

const createOrder = async (req, res) => {
  const { restaurantId, items = [], address = null, addressId = null, paymentMethod = "COD", notes = null } = req.body;

  if (!restaurantId || items.length === 0) {
    throw new ApiError(400, "Restaurant and at least one item are required");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, status: "ACTIVE" },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item) => item.menuItemId) },
      restaurantId,
      status: "ACTIVE",
    },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(400, "Some cart items are no longer available");
  }

  const subtotal = items.reduce((sum, item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const packagingFee = Number((subtotal * 0.03).toFixed(2));
  const taxAmount = Number((subtotal * 0.18).toFixed(2));
  const totalAmount = subtotal + deliveryFee + packagingFee + taxAmount;

  let resolvedAddressId = null;

  if (addressId) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: req.user.sub,
      },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Saved address not found");
    }

    resolvedAddressId = existingAddress.id;
  } else if (address && address.fullName && address.phone && address.line1 && address.city && address.state && address.postalCode) {
    const createdAddress = await prisma.address.create({
      data: {
        userId: req.user.sub,
        label: address.label || "Delivery Address",
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        isDefault: false,
      },
    });

    resolvedAddressId = createdAddress.id;
  }

  const order = await prisma.order.create({
    data: {
      customerId: req.user.sub,
      restaurantId,
      addressId: resolvedAddressId,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
      subtotal,
      deliveryFee,
      packagingFee,
      taxAmount,
      totalAmount,
      notes,
      items: {
        create: items.map((item) => {
          const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: Number(menuItem.price) * item.quantity,
          };
        }),
      },
    },
    include: {
      restaurant: true,
      address: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  res.status(201).json(
    apiResponse({
      message: "Order created successfully",
      data: serializeOrder(order),
    }),
  );
};

const getMyOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      customerId: req.user?.sub,
    },
    include: {
      restaurant: true,
      address: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Customer orders fetched successfully",
      data: orders.map(serializeOrder),
    }),
  );
};

const getVendorOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      restaurant: {
        vendorId: req.user.sub,
      },
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Vendor orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: order.customer,
      })),
    }),
  );
};

const getRiderOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { riderId: req.user.sub },
        { riderId: null, status: "READY_FOR_PICKUP" },
      ],
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Rider orders fetched successfully",
      data: orders.map((order) => ({
        ...serializeOrder(order),
        customer: order.customer,
        isAvailable: !order.riderId && order.status === "READY_FOR_PICKUP",
      })),
    }),
  );
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = [
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REJECTED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (req.user.role === "VENDOR" && order.restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to update this order");
  }

  if (req.user.role === "RIDER") {
    const canClaimReadyOrder = !order.riderId && status === "OUT_FOR_DELIVERY" && order.status === "READY_FOR_PICKUP";
    const ownsOrder = order.riderId === req.user.sub;

    if (!canClaimReadyOrder && !ownsOrder) {
      throw new ApiError(403, "You do not have permission to update this order");
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.orderId },
    data: {
      status,
      ...(req.user.role === "RIDER" && status === "OUT_FOR_DELIVERY" ? { riderId: req.user.sub } : {}),
      ...(status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
    },
    include: {
      restaurant: true,
      address: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Order status updated successfully",
      data: {
        ...serializeOrder(updatedOrder),
        customer: updatedOrder.customer,
      },
    }),
  );
};

export { createOrder, getMyOrders, getRiderOrders, getVendorOrders, updateOrderStatus };
