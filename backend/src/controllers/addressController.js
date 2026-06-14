import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getLatLngFromAddress } from "../utils/geocode.js";
import { createAddressSchema, updateAddressSchema } from "../validators/addressValidators.js";

const buildFullAddress = ({ line1, line2, city, state, postalCode }) =>
  [line1, line2, city, state, postalCode, "India"].filter(Boolean).join(", ");

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
  latitude: address.latitude,
  longitude: address.longitude,
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const listAddresses = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [addresses, total] = await Promise.all([
    prisma.address.findMany({
      where: { userId: req.user.sub },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.address.count({ where: { userId: req.user.sub } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Addresses fetched successfully",
      data: addresses.map(serializeAddress),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

const createAddress = async (req, res) => {
  const payload = createAddressSchema.parse(req.body);

  let lat = payload.lat ?? null;
  let lng = payload.lng ?? null;

  if (lat === null || lng === null) {
    const fullAddress = buildFullAddress({
      line1: payload.line1.trim(),
      line2: payload.line2?.trim(),
      city: payload.city.trim(),
      state: payload.state.trim(),
      postalCode: payload.postalCode.trim(),
    });
    const coords = await getLatLngFromAddress(fullAddress);
    lat = coords.lat;
    lng = coords.lng;
  }

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
        latitude: lat,
        longitude: lng,
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

  const nextAddressFields = {
    line1: payload.line1?.trim() ?? existingAddress.line1,
    line2: payload.line2 !== undefined ? payload.line2?.trim() || null : existingAddress.line2,
    city: payload.city?.trim() ?? existingAddress.city,
    state: payload.state?.trim() ?? existingAddress.state,
    postalCode: payload.postalCode?.trim() ?? existingAddress.postalCode,
  };

  const addressChanged =
    nextAddressFields.line1 !== existingAddress.line1 ||
    nextAddressFields.line2 !== existingAddress.line2 ||
    nextAddressFields.city !== existingAddress.city ||
    nextAddressFields.state !== existingAddress.state ||
    nextAddressFields.postalCode !== existingAddress.postalCode;

  const manualLat = payload.lat ?? null;
  const manualLng = payload.lng ?? null;
  const hasManualCoords = manualLat !== null && manualLng !== null;

  const coords = hasManualCoords
    ? { lat: manualLat, lng: manualLng }
    : addressChanged
      ? await getLatLngFromAddress(buildFullAddress(nextAddressFields))
      : { lat: existingAddress.latitude, lng: existingAddress.longitude };

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
        ...(hasManualCoords || addressChanged ? { latitude: coords.lat, longitude: coords.lng } : {}),
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
