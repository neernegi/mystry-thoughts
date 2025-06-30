import mongoose, { Schema, Document } from 'mongoose';

export interface IAISlide extends Document {
  slideNumber: number;
  type: 'thoughts' | 'confessions';
  selectedPost: mongoose.Types.ObjectId;
  keyTerms: {
    heading: string;
    points: string[];
  }[];
  createdAt: Date;
  expiresAt: Date;
}

const AISlideSchema: Schema = new Schema({
  slideNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  type: {
    type: String,
    enum: ['thoughts', 'confessions'],
    required: true
  },
  selectedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Thought',
    required: true
  },
  keyTerms: [{
    heading: {
      type: String,
      required: true
    },
    points: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
  }
});

// Auto-delete expired slides
AISlideSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AISlide || mongoose.model<IAISlide>('AISlide', AISlideSchema);