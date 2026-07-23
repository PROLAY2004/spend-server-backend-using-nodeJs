import SendEmailService from '../services/sendMailService.js';
import record from '../models/recordsModel.js';
import payer from '../models/payerModel.js';

const mailer = new SendEmailService();

export default class UserController {
  contact = async (req, res, next) => {
    try {
      const { name, email, message } = req.body;

      mailer.contactMailer(name, email, message);

      res.status(200).json({
        message: 'Response Submitted Successfully',
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getDashboardOverview = async (req, res, next) => {
    try {
      const userId = String(req.user._id);
      const { lineFilter = 'thisWeek', barFilter = 'thisMonth' } = req.body;

      // STEP 1: Find all ACTIVE payers for this user
      const activePayers = await payer.find(
        {
          userId: userId,
          isDeleted: { $ne: true },
        },
        '_id'
      );

      const activePayerIds = activePayers.map((p) => String(p._id));

      // STEP 2: Update Base Match
      const baseMatch = {
        userId: userId,
        isDeleted: { $ne: true },
        payerId: { $in: activePayerIds },
      };

      const getStartDate = (filter) => {
        const now = new Date();
        switch (filter) {
          case 'today':
            return new Date(now.setHours(0, 0, 0, 0));
          case 'thisWeek':
            const first = now.getDate() - now.getDay();
            return new Date(new Date().setDate(first)).setHours(0, 0, 0, 0);
          case 'thisMonth':
            return new Date(now.getFullYear(), now.getMonth(), 1);
          case 'thisYear':
            return new Date(now.getFullYear(), 0, 1);
          case 'lifetime':
          default:
            return new Date(0);
        }
      };

      // 3. Simple Fetch for Cards Data
      const records = await record.find(baseMatch);

      let totalOriginal = 0;
      let totalSavings = 0;
      let totalDue = 0;
      let totalCollected = 0;
      let paidCount = 0;
      let nonPaidCount = 0;
      const totalRecordsCount = records.length;

      records.forEach((rec) => {
        const original = rec.originalAmount || 0;
        const spend = rec.spendAmount || 0;
        let due = rec.dueAmount || 0;

        if (rec.status === 'paid') {
          due = 0;
        }

        totalOriginal += original;
        totalSavings += original - spend;
        totalDue += due;
        totalCollected += original - due;

        if (rec.status === 'paid') {
          paidCount += 1;
        }

        if (rec.status === 'non-paid') {
          nonPaidCount += 1;
        }
      });

      // Calculate Trends
      let savingsTrendPercentage = 0;
      let dueTrendPercentage = 0;
      let unpaidTrendPercentage = 0;

      if (totalOriginal > 0) {
        savingsTrendPercentage = (totalSavings / totalOriginal) * 100;
        dueTrendPercentage = (totalDue / totalOriginal) * 100;
      }

      if (totalRecordsCount > 0) {
        unpaidTrendPercentage = (nonPaidCount / totalRecordsCount) * 100;
      }

      // 4. Fetch Line Chart Data (Dynamic X-Axis based on filter)
      const lineStartDate = new Date(getStartDate(lineFilter));
      let lineLabels = [];
      let lineDataArray = [];
      let lineGroupStage = {};

      switch (lineFilter) {
        case 'today':
          lineLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          lineDataArray = new Array(24).fill(0);
          lineGroupStage = { $hour: '$date' };
          break;
        case 'thisWeek':
          lineLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          lineDataArray = new Array(7).fill(0);
          lineGroupStage = { $dayOfWeek: '$date' };
          break;
        case 'thisMonth':
          lineLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
          lineDataArray = new Array(5).fill(0);
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
          lineGroupStage = { $month: '$date' };
          break;
      }

      const lineChartPipeline = await record.aggregate([
        {
          $match: {
            ...baseMatch,
            category: { $ne: 'Income or Cashback' },
            date: { $gte: lineStartDate },
          },
        },
        {
          $group: {
            _id: lineGroupStage,
            totalSpend: { $sum: '$spendAmount' },
          },
        },
      ]);

      lineChartPipeline.forEach((item) => {
        if (lineFilter === 'today') {
          if (item._id >= 0 && item._id <= 23)
            lineDataArray[item._id] = item.totalSpend;
        } else if (lineFilter === 'thisWeek') {
          const index = item._id === 1 ? 6 : item._id - 2;
          if (index >= 0 && index <= 6) lineDataArray[index] = item.totalSpend;
        } else if (lineFilter === 'thisMonth') {
          const weekIndex = Math.floor((item._id - 1) / 7);
          if (weekIndex >= 0 && weekIndex <= 4)
            lineDataArray[weekIndex] += item.totalSpend;
        } else if (lineFilter === 'thisYear') {
          const index = item._id - 1;
          if (index >= 0 && index <= 11) lineDataArray[index] = item.totalSpend;
        }
      });

      // 5. Fetch Bar Chart Data
      const barStartDate = new Date(getStartDate(barFilter));
      const barChartPipeline = await record.aggregate([
        {
          $match: {
            ...baseMatch,
            date: { $gte: barStartDate },
          },
        },
        {
          $group: {
            _id: '$category',
            totalSpend: { $sum: '$spendAmount' },
          },
        },
      ]);

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

      // 6. Send Formatted Response
      res.status(200).json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          user: req.user,
          cards: {
            totalSavings: totalSavings,
            savingsTrend: savingsTrendPercentage, // Sent as raw numbers for the UI to format
            unpaidCategories: nonPaidCount,
            categoriesTrend: unpaidTrendPercentage,
            totalDue: totalDue,
            dueTrend: dueTrendPercentage,
          },
          doughnut1: [totalDue, totalCollected],
          doughnut2: [paidCount, nonPaidCount],
          doughnutTotalSpend: totalDue + totalCollected,
          doughnutTotalRecords: paidCount + nonPaidCount,
          lineChart: {
            labels: lineLabels,
            data: lineDataArray,
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
