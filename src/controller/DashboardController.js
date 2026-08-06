import record from '../models/recordsModel.js';
import payer from '../models/payerModel.js';

export default class DashboardController {
  getDashboardOverview = async (req, res, next) => {
    try {
      const userId = String(req.user._id);
      const { lineFilter = 'thisWeek', barFilter = 'thisMonth' } = req.body;

      const baseMatch = {
        userId: userId,
        isDeleted: { $ne: true },
      };

      // --- SETUP DATES & CHART GROUPINGS ---
      const getStartDate = (filter) => {
        const now = new Date();
        switch (filter) {
          case 'today':
            return new Date(now.setHours(0, 0, 0, 0));
          case 'thisWeek':
            return new Date(
              new Date().setDate(now.getDate() - now.getDay())
            ).setHours(0, 0, 0, 0);
          case 'thisMonth':
            return new Date(now.getFullYear(), now.getMonth(), 1);
          case 'thisYear':
            return new Date(now.getFullYear(), 0, 1);
          case 'lifetime':
          default:
            return new Date(0);
        }
      };

      const lineStartDate = new Date(getStartDate(lineFilter));
      const barStartDate = new Date(getStartDate(barFilter));

      let lineLabels = [];
      let lineDataArray = [];
      let lineOriginalDataArray = []; // NEW: Setup array for Original Amounts
      let lineGroupStage = {};

      switch (lineFilter) {
        case 'today':
          lineLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          lineDataArray = new Array(24).fill(0);
          lineOriginalDataArray = new Array(24).fill(0);
          lineGroupStage = { $hour: '$date' };
          break;
        case 'thisWeek':
          lineLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          lineDataArray = new Array(7).fill(0);
          lineOriginalDataArray = new Array(7).fill(0);
          lineGroupStage = { $dayOfWeek: '$date' };
          break;
        case 'thisMonth':
          lineLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          lineDataArray = new Array(4).fill(0);
          lineOriginalDataArray = new Array(4).fill(0);
          lineGroupStage = { $dayOfMonth: '$date' };
          break;
        case 'thisYear':
          lineLabels = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          lineDataArray = new Array(12).fill(0);
          lineOriginalDataArray = new Array(12).fill(0);
          lineGroupStage = { $month: '$date' };
          break;
      }

      // STEP 2: Execute all analytical queries in PARALLEL (2nd Await)
      const [cardsDataRaw, lineChartPipeline, barChartPipeline] =
        await Promise.all([
          // A. Cards Data: Push all calculations ($sum, $subtract, $cond) directly to MongoDB
          record.aggregate([
            { $match: baseMatch },
            {
              $group: {
                _id: null,
                totalRecordsCount: { $sum: 1 },
                totalOriginal: { $sum: { $ifNull: ['$originalAmount', 0] } },
                totalSpend: { $sum: { $ifNull: ['$spendAmount', 0] } },
                paidCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
                },
                nonPaidCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'non-paid'] }, 1, 0] },
                },
                totalDue: {
                  $sum: {
                    $cond: [
                      { $eq: ['$status', 'paid'] },
                      0,
                      { $ifNull: ['$dueAmount', 0] },
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalRecordsCount: 1,
                totalOriginal: 1,
                totalDue: 1,
                paidCount: 1,
                nonPaidCount: 1,
                totalSavings: { $subtract: ['$totalOriginal', '$totalSpend'] },
                totalCollected: { $subtract: ['$totalOriginal', '$totalDue'] },
              },
            },
          ]),

          // B. Line Chart Data
          record.aggregate([
            { $match: { ...baseMatch, date: { $gte: lineStartDate } } },
            {
              $group: {
                _id: lineGroupStage,
                totalSpend: { $sum: '$spendAmount' },
                totalOriginal: { $sum: '$originalAmount' }, // NEW: Added totalOriginal summation
              },
            },
          ]),

          // C. Bar Chart Data
          record.aggregate([
            { $match: { ...baseMatch, date: { $gte: barStartDate } } },
            {
              $group: {
                _id: '$category',
                totalSpend: { $sum: '$spendAmount' },
              },
            },
          ]),
        ]);

      // --- PROCESS CARDS DATA ---
      // Extract DB results, safely defaulting to 0 if the user has no records yet
      const {
        totalOriginal = 0,
        totalSavings = 0,
        totalDue = 0,
        totalCollected = 0,
        paidCount = 0,
        nonPaidCount = 0,
        totalRecordsCount = 0,
      } = cardsDataRaw[0] || {};

      const savingsTrendPercentage =
        totalOriginal > 0 ? (totalSavings / totalOriginal) * 100 : 0;
      const dueTrendPercentage =
        totalOriginal > 0 ? (totalDue / totalOriginal) * 100 : 0;
      const unpaidTrendPercentage =
        totalRecordsCount > 0 ? (nonPaidCount / totalRecordsCount) * 100 : 0;

      // --- PROCESS LINE CHART DATA ---
      lineChartPipeline.forEach((item) => {
        if (lineFilter === 'today') {
          if (item._id >= 0 && item._id <= 23) {
            lineDataArray[item._id] = item.totalSpend;
            lineOriginalDataArray[item._id] = item.totalOriginal; // NEW
          }
        } else if (lineFilter === 'thisWeek') {
          const index = item._id === 1 ? 6 : item._id - 2; // Maps Sunday(1)->6, Monday(2)->0, etc.
          if (index >= 0 && index <= 6) {
            lineDataArray[index] = item.totalSpend;
            lineOriginalDataArray[index] = item.totalOriginal; // NEW
          }
        } else if (lineFilter === 'thisMonth') {
          const weekIndex = Math.floor((item._id - 1) / 7);
          if (weekIndex >= 0 && weekIndex <= 3) {
            lineDataArray[weekIndex] += item.totalSpend;
            lineOriginalDataArray[weekIndex] += item.totalOriginal; // NEW
          }
        } else if (lineFilter === 'thisYear') {
          const index = item._id - 1;
          if (index >= 0 && index <= 11) {
            lineDataArray[index] = item.totalSpend;
            lineOriginalDataArray[index] = item.totalOriginal; // NEW
          }
        }
      });

      // --- PROCESS BAR CHART DATA ---
      const categoriesList = [
        'Medicine & Healthcare',
        'Food & Dining',
        'Income or Cashback',
        'Travel & Transport',
        'Fuel',
        'Money Transfer',
        'Shopping',
        'Bills & Utilities',
        'Grocerry',
        'Entertelment & Subscription',
        'Investment',
        'Others',
      ];

      const barDataValues = categoriesList.map((cat) => {
        const found = barChartPipeline.find((b) => b._id === cat);
        return found ? found.totalSpend : 0;
      });

      // STEP 3: Send Response
      res.status(200).json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          user: req.user,
          cards: {
            totalSavings: totalSavings,
            savingsTrend: savingsTrendPercentage,
            unpaidCategories: nonPaidCount,
            categoriesTrend: unpaidTrendPercentage,
            totalDue: totalDue,
            dueTrend: dueTrendPercentage,
          },
          doughnut1: [totalDue, totalCollected],
          doughnut2: [paidCount, nonPaidCount],
          doughnutTotalSpend: totalDue + totalCollected,
          doughnutTotalRecords: totalRecordsCount,
          lineChart: {
            labels: lineLabels,
            data: lineDataArray,
            originalData: lineOriginalDataArray, // NEW: Export the original amounts array to the frontend
          },
          barChart: {
            labels: categoriesList.map((c) => c.split(' ')[0]),
            data: barDataValues,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  exportDashboardExcel = async (req, res, next) => {
    try {
      const userId = String(req.user._id);

      // 1. Fetch active payers to map names to IDs
      const activePayers = await payer.find(
        { userId, isDeleted: { $ne: true } },
        '_id name'
      );
      const payerMap = {};
      const activePayerIds = [];

      activePayers.forEach((p) => {
        const idStr = String(p._id);
        payerMap[idStr] = p.name;
        activePayerIds.push(idStr);
      });

      // 2. Fetch all active records for these payers
      const records = await record
        .find({
          userId: userId,
          isDeleted: { $ne: true },
          payerId: { $in: activePayerIds },
        })
        .sort({ date: -1 }); // Newest first

      // 3. Initialize Analytics & Overview Variables
      let totalOriginal = 0,
        totalSavings = 0,
        totalDue = 0,
        totalCollected = 0;
      let paidCount = 0,
        dueCount = 0;

      const spendOverview = {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        lifetime: 0,
      };
      const categoryOverview = {}; // Will hold dynamically generated categories

      // Date boundaries
      const now = new Date();
      const todayStr = new Date(now.setHours(0, 0, 0, 0)).getTime();
      const firstDayOfWeek = now.getDate() - now.getDay();
      const weekStr = new Date(new Date().setDate(firstDayOfWeek)).setHours(
        0,
        0,
        0,
        0
      );
      const monthStr = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const yearStr = new Date(now.getFullYear(), 0, 1).getTime();

      // 4. Process all records in one loop
      const rawRecords = records.map((rec) => {
        const original = rec.originalAmount || 0;
        const spend = rec.spendAmount || 0;
        let due = rec.dueAmount || 0;

        if (rec.status === 'paid') due = 0;

        // Overall Stats
        totalOriginal += original;
        totalSavings += original - spend;
        totalDue += due;
        totalCollected += original - due;

        if (rec.status === 'paid') paidCount++;
        if (rec.status === 'non-paid') dueCount++;

        // Timeframe & Category Stats (Excluding Income from Spend Overviews)
        const recTime = new Date(rec.date).getTime();
        const cat = rec.category;

        if (!categoryOverview[cat]) {
          categoryOverview[cat] = {
            today: 0,
            week: 0,
            month: 0,
            year: 0,
            lifetime: 0,
          };
        }

        if (cat !== 'Income or Cashback') {
          if (recTime >= todayStr) {
            spendOverview.today += spend;
            categoryOverview[cat].today += spend;
          }
          if (recTime >= weekStr) {
            spendOverview.week += spend;
            categoryOverview[cat].week += spend;
          }
          if (recTime >= monthStr) {
            spendOverview.month += spend;
            categoryOverview[cat].month += spend;
          }
          if (recTime >= yearStr) {
            spendOverview.year += spend;
            categoryOverview[cat].year += spend;
          }
          spendOverview.lifetime += spend;
          categoryOverview[cat].lifetime += spend;
        }

        // Return formatted row for Excel
        return {
          Date: new Date(rec.date).toLocaleDateString('en-IN'), // Formats to DD/MM/YYYY
          'Payer Name': payerMap[rec.payerId] || 'Unknown',
          Category: cat,
          'Original Amount': original,
          'Spend Amount': spend,
          'Due Amount': due,
          'Current Status': rec.status.toUpperCase(),
          Description: rec.description || 'N/A',
        };
      });

      // 5. Send payload
      res.status(200).json({
        success: true,
        data: {
          analytics: {
            date: new Date().toLocaleDateString('en-IN'),
            totalRecords: records.length,
            dueCount,
            paidCount,
            totalDue,
            totalSavings,
            totalCollected,
          },
          spendOverview,
          categoryOverview,
          rawRecords,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
