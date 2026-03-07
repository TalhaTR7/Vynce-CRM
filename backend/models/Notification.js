import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        users: [{
            _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            read: { type: Boolean, default: false },
        }],
        type: {
            type: String, enum: [
                "TASK_ASSIGNED",        // ✅ on task creation; assignee
                "TASK_REASSIGNED",      // ✅ on task creation; assignee
                "TASK_SUBMITTED",       // ✅ on task creation; creator
                "TASK_RETURNED",        // ✅ on task return; assignee
                "TASK_RESTORED",        // ✅ when the task is restored; assignee
                "TASK_DELETED",         // ✅ on task deletion without assignee reward; assignee
                "TASK_CLOSED",          // ✅ on task closure and assignee reward; assignee
                "TASK_DUE_IN",          // ✅ when the task is 2 days away from due; assignee
                "COMMENT",              // ✅ on task comment; assignee
                "SHREDDING",            // ✅ on hard deletion; admins, owner
                "NEW_BOARD",            // ✅ on board creation; admins, owner
                "EDIT_BOARD",           // ✅ on board edit; admins, owner
                "EDIT_PROJECT",         // ✅ on project edit; admins, owner
                "EDIT_TASK",            // ✅ on task edit; assignee
                "BID_CREATED",          // to creator when the assignee places the task on auction; creator
                "BID_PLACED",           // to creator and assignee when user places a bid on the task; creator, assignee
                "WEEKLY_MP",            // every sunday when the leaderboards reset with rewards; all
                "LEVEL_UP",             // every time when user levels up; all
                "PROMOTION",            // ✅ promoted admin; members
                "DEMOTION",             // ✅ demoted member; admins
                "OWNERSHIP_REQUEST",    // ✅ to targeted admin; admins
                "OWNERSHIP_RESPONSE",   // ✅ response in yes or no by targeted admin; owner
                "OWNERSHIP_ALERT",      // ✅ to all memmbers of the project on a change of OWNER; all
                "NEW_TO_PROJECT",       // ✅ to member when he joins a project; member
                "PROJECT_INVITATION",   // ✅ to user when an admin/owner invites a user; user 
                "ACCEPTED_INVITATION",  // ✅ when user accepts the invitation; owner
                "DECLINED_INVITATION",  // ✅ when user rejects the invitation; owner
                "WELCOME",              // ✅ when a user joins a project; admins
                "REMOVED_FROM_PROJECT", // ✅ when a member/admin is kicked out by owner; removed user
                "LEFT_PROJECT",         // ✅ when a member leaves the project; user that left
                "DELETED_ACCOUNT"       // ✅ when a member deletes his account; owner
            ], required: true
        },
        icon: {
            type: { type: String, enum: ["PROJECT", "USER", "SVG"], required: true },
            refId: { type: mongoose.Schema.Types.ObjectId, required: function () { return this.icon.type !== "SVG" } },
            url: { type: String, required: function () { return this.icon.type === "SVG" } }
        },
        title: { type: String, required: true },
        action: {
            type: { type: String, enum: ["NAVIGATE", "MESSAGE", "DIALOGUE"], required: true },
            url: { type: String, required: function () { return this.action.type === "NAVIGATE" } },
        },
        payload: { type: mongoose.Schema.Types.Mixed, required: function () { return this.action.type === "DIALOGUE" } }
    }, {
    timestamps: true,
    versionKey: false
});

notificationSchema.index({
    "users._id": 1,
    "users.read": 1,
    createdAt: -1
});

export default mongoose.model("Notification", notificationSchema);
