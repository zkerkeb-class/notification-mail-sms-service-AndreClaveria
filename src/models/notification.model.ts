import mongoose, { Document, Schema } from "mongoose";

// Interface pour le document de notification
export interface INotification extends Document {
  type: string;
  recipient: string;
  subject: string;
  content: string;
  status: "pending" | "sent" | "failed";
  metadata: Record<string, any>;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma pour les notifications
const NotificationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["confirmation", "reset-password", "welcome", "general"],
      index: true
    },
    recipient: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    sentAt: {
      type: Date
    }
  },
  {
    timestamps: true // Ajoute automatiquement createdAt et updatedAt
  }
);

// Créer et exporter le modèle
const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

export default Notification;
