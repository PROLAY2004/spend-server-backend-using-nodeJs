import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class LedgerController {
  fetchLedger = async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 2,
        search = '',
        filter = 'All',
        payerId,
        dateFrom,
        dateTo,
      } = req.body;

      // 1. Base Query (payerId is now optional)
      const query = { userId: req.user._id, isDeleted: false };

      if (payerId) query.payerId = payerId;
      if (filter === 'paid') query.status = 'paid';
      if (filter === 'non-paid') query.status = 'non-paid';

      // 2. Apply Date Range Filter (Optional)
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) {
          query.date.$gte = new Date(dateFrom); // Greater than or equal to dateFrom
        }
        if (dateTo) {
          // Appending time to ensure it covers the entire 'To' day up to midnight
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.date.$lte = toDate;
        }
      }

      // 3. Fetch ledgers matching the DB query
      let recordData = await record.find(query).sort({ createdAt: -1 });

      // 4. Apply In-Memory Search (Date, Category, Description)
      if (search) {
        const searchLower = search.toLowerCase();
        recordData = recordData.filter((item) => {
          const dateStr = new Date(item.date)
            .toLocaleDateString()
            .toLowerCase();
          return (
            (item.category &&
              item.category.toLowerCase().includes(searchLower)) ||
            (item.description &&
              item.description.toLowerCase().includes(searchLower)) ||
            dateStr.includes(searchLower)
          );
        });
      }

      // 5. Apply Pagination
      const totalLedgers = recordData.length;
      const totalPages = Math.ceil(totalLedgers / limit);
      const paginatedData = recordData.slice((page - 1) * limit, page * limit);

      // 6. Fetch all payers separately for the frontend dropdown
      // This is entirely independent of the ledger search filters above
      const payersList = await payer
        .find({
          userId: req.user._id,
          isDeleted: false,
        })
        .select('_id name mobile');

      // 7. Send Response
      res.status(200).json({
        message: 'Ledgers Fetched Successfully',
        success: true,
        data: {
          recordData: paginatedData,
          totalPages,
          currentPage: parseInt(page),
          totalLedgers,
          payersList, // Includes the separate payers list here
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
