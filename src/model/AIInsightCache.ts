import mongoose, { Document } from 'mongoose';

export interface AIInsightCache extends Document {
  content: string;
  type: 'thought' | 'confession';
  slides: Array<{
    heading: string;
    bulletPoints: string[];
  }>;
  createdAt: Date;
  expiresAt: Date;
}

const AIInsightCacheSchema = new mongoose.Schema({
  content: { type: String, required: true },
  type: { type: String, enum: ['thought', 'confession'], required: true },
  slides: [{
    heading: String,
    bulletPoints: [String]
  }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 1 day from now
});

// TTL index for automatic expiration
AIInsightCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AIInsightCache || mongoose.model<AIInsightCache>('AIInsightCache', AIInsightCacheSchema);