import mongoose from 'mongoose';

const usrSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model('userdata', usrSchema);
export default user;
