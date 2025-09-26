import mongoose, { Schema, Document, Types } from 'mongoose';
import { Alert as IAlert } from '../types';

export type AlertDocument = Document<Types.ObjectId> & Omit<IAlert,'_id'> & { _id: Types.ObjectId };

const alertSchema = new Schema<AlertDocument>({
  userId: { type: String, default: 'default' }, // For demo purposes
  symbol: { type: String, required: true, uppercase: true },
  condition: {
    type: String,
    enum: ['above', 'below', 'percent_increase', 'percent_decrease'],
    required: true
  },
  targetPrice: { 
    type: Number, 
    required: function(this: AlertDocument) {
      return ['above', 'below'].includes(this.condition);
    }
  },
  percentageChange: {
    type: Number,
    required: function(this: AlertDocument) {
      return ['percent_increase', 'percent_decrease'].includes(this.condition);
    }
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Indexes 
alertSchema.index({ symbol: 1, isActive: 1 });
alertSchema.index({ userId: 1 });

export const Alert = mongoose.model<AlertDocument>('Alert', alertSchema);