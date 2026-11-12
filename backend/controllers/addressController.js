const { Address, sequelize } = require('../models');
const { AppError, asyncHandler } = require('../utils/helpers');

exports.listMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({
    where: { userId: req.user.id },
    order: [
      ['isDefault', 'DESC'],
      ['id', 'DESC']
    ]
  });

  res.json({
    success: true,
    data: addresses
  });
});

exports.createAddress = asyncHandler(async (req, res) => {
  const { label, streetAddress, apartment, entrance, floor, landmark, isDefault } = req.body;

  if (!label || !streetAddress) {
    throw new AppError('Manzil nomi va ko\'cha manzili kiritilishi shart.', 400);
  }

  const address = await sequelize.transaction(async (t) => {
    const existingCount = await Address.count({ where: { userId: req.user.id }, transaction: t });
    const makeDefault = existingCount === 0 || isDefault === true || isDefault === 'true';

    if (makeDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction: t });
    }

    return Address.create(
      {
        userId: req.user.id,
        label: String(label).trim(),
        streetAddress: String(streetAddress).trim(),
        apartment: apartment ? String(apartment).trim() : null,
        entrance: entrance ? String(entrance).trim() : null,
        floor: floor ? String(floor).trim() : null,
        landmark: landmark ? String(landmark).trim() : null,
        isDefault: makeDefault
      },
      { transaction: t }
    );
  });

  res.status(201).json({
    success: true,
    message: 'Manzil saqlandi.',
    data: address
  });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!address) {
    throw new AppError('Manzil topilmadi.', 404);
  }

  const { label, streetAddress, apartment, entrance, floor, landmark, isDefault } = req.body;

  await sequelize.transaction(async (t) => {
    if (isDefault === true || isDefault === 'true') {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction: t });
      address.isDefault = true;
    }
    if (label !== undefined) address.label = String(label).trim();
    if (streetAddress !== undefined) address.streetAddress = String(streetAddress).trim();
    if (apartment !== undefined) address.apartment = apartment ? String(apartment).trim() : null;
    if (entrance !== undefined) address.entrance = entrance ? String(entrance).trim() : null;
    if (floor !== undefined) address.floor = floor ? String(floor).trim() : null;
    if (landmark !== undefined) address.landmark = landmark ? String(landmark).trim() : null;

    await address.save({ transaction: t });
  });

  res.json({
    success: true,
    message: 'Manzil yangilandi.',
    data: address
  });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!address) {
    throw new AppError('Manzil topilmadi.', 404);
  }

  const wasDefault = address.isDefault;
  await address.destroy();

  if (wasDefault) {
    const nextAddress = await Address.findOne({
      where: { userId: req.user.id },
      order: [['id', 'DESC']]
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json({
    success: true,
    message: 'Manzil o\'chirildi.'
  });
});
