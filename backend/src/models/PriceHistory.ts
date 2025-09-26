import mongoose, { Schema, Document, Types } from 'mongoose';
import { PriceHistory as IPriceHistory } from '../types';

export type PriceHistoryDocument =
  Document<Types.ObjectId> &
  Omit<IPriceHistory, '_id'> & { _id: Types.ObjectId };

const priceHistorySchema = new Schema<PriceHistoryDocument>({
  symbol: { type: String, required: true, uppercase: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  volume_24h: { type: Number },
  market_cap: { type: Number }
});

// Indexes 
priceHistorySchema.index({ symbol: 1, timestamp: -1 });
priceHistorySchema.index({ timestamp: -1 });

export const PriceHistory = mongoose.model<PriceHistoryDocument>('PriceHistory', priceHistorySchema);
