import mongoose, { Schema, Document } from 'mongoose';

// TypeScript interface
export interface ILocation extends Document {
  name: string;
  code: string;
  state: string;
  headquarters: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'District name is required'],
    trim: true,
    maxlength: [50, 'District name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'District code is required'],
    uppercase: true,
    trim: true,
    length: [3, 'District code must be exactly 3 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [30, 'State name cannot exceed 30 characters']
  },
  headquarters: {
    type: String,
    required: [true, 'Headquarters is required'],
    trim: true,
    maxlength: [50, 'Headquarters name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'districts'
});

// Indexes
LocationSchema.index({ name: 1, state: 1 }, { unique: true });
LocationSchema.index({ code: 1, state: 1 }, { unique: true });
LocationSchema.index({ state: 1 });

// Export the model
export const Locations = mongoose.model<ILocation>('Locations', LocationSchema);