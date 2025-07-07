// models/EmailHistory.ts
import mongoose, { Schema, Document } from "mongoose";

interface IEmailHistory extends Document {
  fromUserId?: string; // Optionnel pour les réponses entrantes
  fromCompanyId: string;
  toContactId: string;
  toEmail: string;
  fromEmail?: string; // Nouveau : pour les emails entrants
  subject: string;
  body: string;
  htmlBody?: string;
  status: "sent" | "failed" | "pending" | "received"; // Ajout de "received"
  sentAt?: Date;
  errorMessage?: string;
  emailProvider: string;

  // Nouveaux champs pour le tracking des réponses
  trackingId?: string;
  isReply?: boolean;
  originalEmailId?: mongoose.Types.ObjectId;
  hasReply?: boolean;
  replyCount?: number;
  lastReplyAt?: Date;

  metadata?: {
    userSignature?: string;
    companyInfo?: any;
    contactInfo?: any;
    template?: string;
    messageId?: string;
    response?: string;
    brevoMessageId?: string; // Nouveau
    originalTrackingId?: string; // Nouveau
    inboundMessageId?: string; // Nouveau
    receivedAt?: Date; // Nouveau
    webhookData?: any; // Nouveau
  };
}

const EmailHistorySchema = new Schema<IEmailHistory>(
  {
    fromUserId: { type: String, required: false }, // Plus obligatoire pour les réponses
    fromCompanyId: { type: String, required: true },
    toContactId: { type: String, required: true },
    toEmail: { type: String, required: true },
    fromEmail: { type: String }, // Nouveau champ
    subject: { type: String, required: true },
    body: { type: String, required: true },
    htmlBody: { type: String },
    status: {
      type: String,
      enum: ["sent", "failed", "pending", "received"], // Ajout de "received"
      default: "pending"
    },
    sentAt: { type: Date },
    errorMessage: { type: String },
    emailProvider: { type: String, default: "smtp" },

    // Nouveaux champs pour le tracking
    trackingId: { type: String, unique: true, sparse: true },
    isReply: { type: Boolean, default: false },
    originalEmailId: { type: Schema.Types.ObjectId, ref: "EmailHistory" },
    hasReply: { type: Boolean, default: false },
    replyCount: { type: Number, default: 0 },
    lastReplyAt: { type: Date },

    metadata: {
      userSignature: String,
      companyInfo: Schema.Types.Mixed,
      contactInfo: Schema.Types.Mixed,
      template: String,
      messageId: String,
      response: String,
      brevoMessageId: String, // Nouveau
      originalTrackingId: String, // Nouveau
      inboundMessageId: String, // Nouveau
      receivedAt: Date, // Nouveau
      webhookData: Schema.Types.Mixed // Nouveau
    }
  },
  {
    timestamps: true
  }
);

// Index pour améliorer les performances de recherche
EmailHistorySchema.index({ trackingId: 1 });
EmailHistorySchema.index({ originalEmailId: 1 });
EmailHistorySchema.index({ fromUserId: 1, fromCompanyId: 1 });
EmailHistorySchema.index({ toContactId: 1 });

export default mongoose.model<IEmailHistory>(
  "EmailHistory",
  EmailHistorySchema
);
