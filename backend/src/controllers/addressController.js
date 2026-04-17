import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { createAddressSchema, updateAddressSchema } from "../validators/addressValidators.js";

const serializeAddress = (address) => ({
  id: address.id,
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const listAddresses = async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.sub },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  res.status(200).json(
    apiResponse({
      message: "Addresses fetched successfully",
      data: addresses.map(serializeAddress),
    }),
  );
};

const createAddress = async (req, res) => {
  const payload = createAddressSchema.parse(req.body);

  const address = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.address.count({
      where: { userId: req.user.sub },
    });

    const shouldBeDefault = payload.isDefault ?? existingCount === 0;

    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: req.user.sub },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId: req.user.sub,
        label: payload.label || "OTHER",
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        line1: payload.line1.trim(),
        line2: payload.line2?.trim() || null,
        city: payload.city.trim(),
        state: payload.state.trim(),
        postalCode: payload.postalCode.trim(),
        isDefault: shouldBeDefault,
      },
    });
  });

  res.status(201).json(
    apiResponse({
      message: "Address created successfully",
      data: serializeAddress(address),
    }),
  );
};

const updateAddress = async (req, res) => {
  const payload = updateAddressSchema.parse(req.body);

  const existingAddress = await prisma.address.findFirst({
    where: {
      id: req.params.addressId,
      userId: req.user.sub,
    },
  });

  if (!existingAddress) {
    throw new ApiError(404, "Address not found");
  }

  const address = await prisma.$transaction(async (tx) => {
    const shouldBeDefault = payload.isDefault === true;

    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: {
          userId: req.user.sub,
          id: { not: req.params.addressId },
        },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: req.params.addressId },
      data: {
        ...(payload.label !== undefined ? { label: payload.label || "OTHER" } : {}),
        ...(payload.fullName !== undefined ? { fullName: payload.fullName.trim() } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
        ...(payload.line1 !== undefined ? { line1: payload.line1.trim() } : {}),
        ...(payload.line2 !== undefined ? { line2: payload.line2?.trim() || null } : {}),
        ...(payload.city !== undefined ? { city: payload.city.trim() } : {}),
        ...(payload.state !== undefined ? { state: payload.state.trim() } : {}),
        ...(payload.postalCode !== undefined ? { postalCode: payload.postalCode.trim() } : {}),
        ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {}),
      },
    });
  });

  res.status(200).json(
    apiResponse({
      message: "Address updated successfully",
      data: serializeAddress(address),
    }),
  );
};

const deleteAddress = async (req, res) => {
  const existingAddress = await prisma.address.findFirst({
    where: {
      id: req.params.addressId,
      userId: req.user.sub,
    },
  });

  if (!existingAddress) {
    throw new ApiError(404, "Address not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({
      where: { id: req.params.addressId },
    });

    if (existingAddress.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { userId: req.user.sub },
        orderBy: { updatedAt: "desc" },
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }
  });

  res.status(200).json(
    apiResponse({
      message: "Address deleted successfully",
      data: { addressId: req.params.addressId },
    }),
  );
};

export { createAddress, deleteAddress, listAddresses, updateAddress };
