import mongoose from "mongoose";

const { Schema } = mongoose;

const metricSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  carbonEmissions: {
    type: Number,
    required: true,
  },
  waterUsage: {
    type: Number,
    required: true,
  },
  wasteDistributed: {
    type: Number,
    required: true,
  },
  energyConsumption: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
});

const Metric = mongoose.models.Metric || mongoose.model("Metric", metricSchema);
export default Metric;
