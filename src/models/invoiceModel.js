import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    payerId: {
      type: String,
      required: true,
    },

    invoiceName: {
      type: String,
      required: true,
    },

    payerName: {
      type: String,
      required: true,
    },

    payerMobile: {
      type: Number,
      required: true,
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      enum: ['paid', 'non-paid', 'partially-paid'],
      required: true,
    },

    recordData: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const invoice = mongoose.model('invoiceData', invoiceSchema);
export default invoice;
