import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    payerId: {
      type: String,
      required: true,
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now(),
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Bills & Utilities',
        'Food & Dining',
        'Medicine & Healthcare',
        'Money Transfer',
        'Shopping',
        'Travel & Transport',
        'Income or Cashback',
        'Fuel',
        'Grocerry',
        'Entertelment & Subscription',
        'Investment',
        'Others',
      ],
    },

    spendAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    originalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    dueAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      required: true,
      enum: ['paid', 'non-paid'],
      default: 'non-paid',
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const record = mongoose.model('recordData', recordSchema);
export default record;
