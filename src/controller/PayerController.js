import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class PayerController {
  addPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;

      const existingPayer = await payer.findOne({
        userId: req.user._id,
        mobile,
        isDeleted: false,
      });

      if (existingPayer) {
        res.status(400);
        throw new Error('Payer Mobile No. Already Exists.');
      }

      await payer.create({
        name,
        mobile,
        userId: req.user._id,
      });

      res.status(201).json({
        message: 'New Payer Added Successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  editPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;
      const payerId = req.params.payerId;

      if (!payerId) {
        res.status(400);
        throw new Error('Payer Id is Required');
      }

      // Check if mobile already exists for another payer
      const existingPayer = await payer.findOne({
        _id: { $ne: payerId }, // Exclude the current payer
        userId: req.user._id,
        mobile,
        isDeleted: false,
      });

      if (existingPayer) {
        res.status(409);
        throw new Error('Mobile number already exists.');
      }

      const updatedPayer = await payer.findOneAndUpdate(
        {
          _id: payerId,
          userId: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            name,
            mobile,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedPayer) {
        res.status(404);
        throw new Error('Payer does not exist.');
      }

      res.status(200).json({
        success: true,
        message: 'Payer Updated Successfully',
        data: updatedPayer,
      });
    } catch (err) {
      next(err);
    }
  };

  deletePayer = async (req, res, next) => {
    try {
      const payerId = req.params.payerId;

      if (!payerId) {
        res.status(400);
        throw new Error('Payer Id is Required');
      }

      const updatedPayer = await payer.findOneAndUpdate(
        {
          _id: payerId,
          userId: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedPayer) {
        res.status(404);
        throw new Error('Payer does not exist.');
      }

      res.status(200).json({
        success: true,
        message: 'Payer Deleted Successfully',
        data: updatedPayer,
      });
    } catch (err) {
      next(err);
    }
  };

  fetchPayer = async (req, res, next) => {
    try {
      const user = req.user;

      // Extract parameters with defaults
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 5;
      const search = (req.body.search || '').toLowerCase();
      const filter = req.body.filter || 'All';
      const sortOption = req.body.sort || 'Newest First';

      // Fetch all base payers
      const payerDetails = await payer.find({
        userId: user._id,
        isDeleted: false,
      });

      // Calculate total due for all payers
      let updatedPayerDetails = await Promise.all(
        payerDetails.map(async (payerData) => {
          const recordDetails = await record.find({
            userId: user._id,
            payerId: payerData._id,
            isDeleted: false,
            status: 'non-paid',
          });

          const totalDue = recordDetails.reduce(
            (sum, item) => sum + item.dueAmount,
            0
          );

          return {
            ...payerData.toObject(),
            totalDue,
          };
        })
      );

      // 1. Apply Search (Name and Mobile)
      if (search) {
        updatedPayerDetails = updatedPayerDetails.filter(
          (p) =>
            p.name.toLowerCase().includes(search) || p.mobile.includes(search)
        );
      }

      // 2. Apply Dropdown Filter
      if (filter === 'Paid') {
        updatedPayerDetails = updatedPayerDetails.filter(
          (p) => p.totalDue === 0
        );
      } else if (filter === 'Non-Paid') {
        updatedPayerDetails = updatedPayerDetails.filter((p) => p.totalDue > 0);
      }

      // 3. Apply Sorting
      updatedPayerDetails.sort((a, b) => {
        if (sortOption === 'Name A-Z') return a.name.localeCompare(b.name);
        if (sortOption === 'Name Z-A') return b.name.localeCompare(a.name);
        if (sortOption === 'Due: High to Low') return b.totalDue - a.totalDue;
        if (sortOption === 'Due: Low to High') return a.totalDue - b.totalDue;
        // Default: Newest First
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // 4. Apply Pagination
      const totalPayers = updatedPayerDetails.length;
      const totalPages = Math.ceil(totalPayers / limit);
      const paginatedPayers = updatedPayerDetails.slice(
        (page - 1) * limit,
        page * limit
      );

      res.status(200).json({
        message: 'Payers Fetched Successfully',
        success: true,
        data: {
          user,
          payerDetails: paginatedPayers,
          totalPages,
          currentPage: page,
          totalPayers,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  fetchLedger = async (req, res, next) => {
    try {
      const payerId = req.params.payerId;

      if (!payerId) {
        res.status(400);
        throw new Error('Payer Id is Required');
      }

      const recordData = await record
        .find({ payerId, userId: req.user._id, isDeleted: false })
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: 'Ledgers Fetched Successfully',
        success: true,
        data: {
          recordData,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
