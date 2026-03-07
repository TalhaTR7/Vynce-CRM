import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    projectImage: {
        url: { type: String, default: "/assets/project.png" },
    },
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Project", projectSchema);
