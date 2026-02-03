import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Membership from "../models/Membership.js";
import Board from "../models/Board.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

const router = express.Router();

function recipients(ids) {
    return ids.map(id => ({ _id: id }));
}

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}

export async function createTask({ projectId, boardId, title, description = "", creatorId, assigneeId, dueDate = null, ethereum = 1, difficulty = 1, activity = [] }) {
    const task = await Task.create({ projectId, boardId, title, description, creatorId, assigneeId, dueDate, ethereum, difficulty, worktime: 0, motivation: 0, activity });
    return task;
}


// create a task
router.post("/create", authMiddleware, async (req, res) => {
    const {
        projectId,
        boardId,
        title,
        description = "",
        assigneeId,
        dueDate = null,
        ethereum = 1,
        difficulty = 1
    } = req.body;

    try {
        // validations and checks

        if (!projectId || !boardId || !title || !assigneeId)
            return res.status(400).json({ msg: "Required fields are missing" });

        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) return res.status(404).json({ msg: "Project not found" });

        const boardExists = await Board.exists({ _id: boardId, projectId });
        if (!boardExists) return res.status(404).json({ msg: "Board does not exist" });

        let membership = await Membership.findOne({
            projectId,
            userId: req.user.id,
        }).select("role");

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        if (!["OWNER", "ADMIN"].includes(membership.role))
            return res.status(403).json({ msg: "Not an OWNER or ADMIN" });

        const creator = await User.findById(req.user.id).select("firstname lastname");

        const assignee = await User.findById(assigneeId).select("currentMood");
        if (!assignee) return res.status(404).json({ msg: "Assignee not found" });

        membership = await Membership.findOne({
            projectId,
            userId: assignee._id,
        }).select("role");

        if (!membership) return res.status(403).json({ msg: "Assignee is not a member of this project" });

        // actual creation

        const setReward = Math.max(1, Number(ethereum) || 1);
        const multiplier = {
            ANGRY: 2,
            EXHAUSTED: 1.8,
            SICK: 1.6,
            SAD: 1.5,
            NORMAL: 1.5,
            OKAY: 1.5,
            VIBING: 1.4,
            HAPPY: 1.2,
            CHILLING: 1
        }[assignee.currentMood] || 1;
        const calculatedReward = Math.max(1, Math.floor(setReward * multiplier));

        const task = await Task.create({
            projectId,
            boardId,
            title,
            description,
            creatorId: req.user.id,
            assigneeId,
            dueDate,
            difficulty,
            ethereum: {
                assigned: setReward,
                calculated: calculatedReward,
            },
            activity: [{
                type: "ACTION",
                userId: req.user.id,
                action: "CREATED_TASK",
                content: `${creator.firstname} ${creator.lastname} created this task`
            }]
        });

        // notify assignee
        if (assigneeId !== req.user.id) {
            await Notification.create({
                users: recipients([assigneeId]),
                type: "TASK_ASSIGNED",
                icon: {
                    type: "PROJECT",
                    refId: projectId
                },
                title: `${creator.firstname} ${creator.lastname} assigned you a new task: ${title}`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            });
        }

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get tasks of a board
router.get("/board/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;

    try {
        const board = await Board.findById(boardId).select("projectId");
        if (!board) return res.status(404).json({ msg: "Board does not exist" });

        const membership = await Membership.findOne({
            projectId: board.projectId,
            userId: req.user.id,
        });

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        let tasks = await Task
            .find({ boardId })
            .sort({ createdAt: 1 })
            .select("projectId boardId assigneeId creatorId title ethereum worktime difficulty dueDate activity")
            .populate("projectId", "_id projectImage name")
            .populate("boardId", "name color")
            .populate("assigneeId", "profileImage firstname lastname")
            .populate("creatorId", "profileImage firstname lastname");


        tasks = tasks.map(task => {
            task = task.toObject();
            const comment_count = task?.activity?.filter(action => action.type === "COMMENT").length || 0;
            if (task.projectId?.projectImage?.url)
                task.projectId.projectImage = formatImage(task.projectId.projectImage);
            if (task.assigneeId?.profileImage?.url)
                task.assigneeId.profileImage = formatImage(task.assigneeId.profileImage);
            if (task.creatorId?.profileImage?.url)
                task.creatorId.profileImage = formatImage(task.creatorId.profileImage);

            return {
                _id: task._id,
                title: task.title,
                ethereum: task.ethereum,
                worktime: task.worktime,
                difficulty: task.difficulty,
                dueDate: task.dueDate,
                project: task.projectId,
                board: task.boardId,
                creator: task.creatorId,
                assignee: task.assigneeId,
                comments: comment_count
            };
        });

        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get tasks for dashboard
router.get("/dashboard/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;

    try {
        const tasks = await Task
            .find({
                boardId: boardId,
                assigneeId: req.user.id
            })
            .select("projectId title ethereum activity createdAt dueDate worktime")
            .populate("projectId", "projectImage")
            .sort({ dueDate: 1 })
            .limit(3);


        const response = tasks.map(task => {
            task.projectId.projectImage = formatImage(task.projectId.projectImage);

            return ({
                _id: task._id,
                projectImage: task.projectId.projectImage,
                title: task.title,
                ethereum: task.ethereum.calculated,
                comments: task.activity.filter(a => a.type === "COMMENT").length,
                createdAt: task.createdAt,
                dueDate: task.dueDate,
                worktime: task.worktime
            })
        });

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get task by id
router.get("/task/:taskId", authMiddleware, async (req, res) => {
    const { taskId } = req.params;

    try {
        let task = await Task
            .findById(taskId)
            .populate("boardId", "_id projectId name color")
            .populate("projectId", "_id projectImage name")
            .populate("creatorId", "_id profileImage firstname lastname")
            .populate("assigneeId", "_id profileImage firstname lastname currentMood");
        if (!task) return res.status(404).json({ msg: "Task does not exist" });

        const membership = await Membership.findOne({
            userId: req.user.id,
            projectId: task.projectId
        });

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        task = task.toObject();

        task.projectId.projectImage = formatImage(task.projectId.projectImage);
        task.creatorId.profileImage = formatImage(task.creatorId.profileImage);
        task.assigneeId.profileImage = formatImage(task.assigneeId.profileImage);

        task = {
            ...task,
            board: task.boardId,
            creator: task.creatorId,
            project: task.projectId,
            assignee: task.assigneeId,
            fetcher: {
                _id: req.user.id,
                role: membership.role
            },
            boardId: undefined,
            creatorId: undefined,
            projectId: undefined,
            assigneeId: undefined
        };

        task.activity = await Promise.all(
            task.activity.map(async object => {
                if (!object.userId) return object;

                const user = await User.findById(object.userId)
                    .select("_id firstname lastname profileImage");

                user.profileImage = formatImage(user.profileImage)

                return {
                    ...object,
                    user: user ? {
                        ...user.toObject(),
                    } : null,
                    userId: undefined
                };
            })
        );

        res.status(200).json(task);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit title
router.patch("/task/:taskId/editTitle", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        task.title = title;

        const editor = await User.findById(req.user.id).select("firstname lastname");
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_TITLE",
            content: `${editor.firstname} ${editor.lastname} changed the title`,
            time: new Date()
        });

        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            title: task.title,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// change the assignee
router.patch("/task/:taskId/reassign", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { assigneeId } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        const membership = await Membership.findOne({
            userId: assigneeId,
            projectId: task.projectId
        }).select("userId");

        if (!membership) return res.status(404).json({
            msg: "User is either not a member, or doesn't exist"
        });

        if (task.assigneeId.equals(assigneeId))
            return res.status(200).json({ msg: "No change" });

        const user = await User.findById(req.user.id).select("firstname lastname");

        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_ASSIGNEE",
            content: `${user.firstname} ${user.lastname} changed the assignee`,
            time: new Date()
        });

        task.assigneeId = assigneeId;

        if (assigneeId !== req.user.id) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "TASK_REASSIGNED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${user.firstname} ${user.lastname} reassigned you a task: ${task.title}`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        await task.save();

        res.status(200).json({
            assigneeId: task.assigneeId,
            activity: task.activity.at(-1)
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit due date
router.patch("/task/:taskId/editDueDate", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { dueDate } = req.body;

    const formatDueDate = (dueDate) => {
        if (!dueDate) return "None";

        const due = new Date(dueDate);
        const today = new Date();

        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (due.getTime() === today.getTime()) return "Today";
        if (due.getTime() < today.getTime()) return `${due.toLocaleDateString("en-US", { month: "short", day: "numeric", })} (Overdue)`;

        return due.toLocaleDateString("en-US", { month: "short", day: "numeric", });
    };

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (task.dueDate && new Date(task.dueDate).getTime() === new Date(dueDate).getTime())
            return res.status(200).json({ msg: "No change" });

        const editor = await User.findById(req.user.id).select("firstname lastname");
        const hadDueDate = !!task.dueDate;
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_DUE_DATE",
            content: !hadDueDate
                ? `${editor.firstname} ${editor.lastname} set a due date of ${formatDueDate(dueDate)}`
                : !dueDate ? `${editor.firstname} ${editor.lastname} removed the due date`
                    : `${editor.firstname} ${editor.lastname} moved the due date from ${formatDueDate(task.dueDate)} to ${formatDueDate(dueDate)}`,
            time: new Date()
        });

        task.dueDate = dueDate;
        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            dueDate: task.dueDate,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// change status
router.patch("/task/:taskId/changeStatus", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { boardId } = req.body;

    try {
        const task = await Task.findById(taskId).populate("boardId", "name projectId");
        if (!task) return res.status(404).json({ msg: "Task not found" });

        const newBoard = await Board.findById(boardId);
        if (!newBoard) return res.status(404).json({ msg: "Board not found" });

        if (!newBoard.projectId.equals(task.projectId))
            return res.status(400).json({ msg: "Irrelevant task" });

        if (task.boardId._id.equals(boardId))
            return res.status(200).json({ msg: "No change" });

        const editor = await User.findById(req.user.id).select("firstname lastname");

        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_STATUS",
            content: `${editor.firstname} ${editor.lastname} changed the status from ${task.boardId.name} to ${newBoard.name}`,
            time: new Date()
        });

        task.boardId = boardId;
        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            board: newBoard,
            activity: task.activity.at(-1)
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// start timer
router.patch("/task/:taskId/startTimer", authMiddleware, async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task
            .findById(taskId)
            .populate("assigneeId", "_id firstname lastname");
        if (!task) return res.status(404).json({ msg: "Task not found" });
        if (task.isTimerRunning)
            return res.status(400).json({ msg: "Timer is already running" });

        task.isTimerRunning = true;
        task.timerStartedAt = new Date();

        const assignee = task.assigneeId;

        task.activity.push({
            type: "ACTION",
            userId: assignee._id,
            action: "STARTED_TIMER",
            content: `${assignee.firstname} ${assignee.lastname} started the timer`
        })

        await task.save();
        res.status(200).json({
            task: task.toObject(),
            msg: "timer started",
            timerStartedAt: task.timerStartedAt
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// stop timer
router.patch("/task/:taskId/stopTimer", authMiddleware, async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task
            .findById(taskId)
            .populate("assigneeId", "_id firstname lastname");
        if (!task) return res.status(404).json({ msg: "Task not found" });
        if (!task.isTimerRunning || !task.timerStartedAt)
            return res.status(400).json({ msg: "Timer is not running" });

        const workedMinutes = Math.floor((Date.now() - task.timerStartedAt.getTime()) / 60000);
        task.worktime += workedMinutes;
        task.isTimerRunning = false;
        task.timerStartedAt = null;

        const hours = Math.floor(workedMinutes / 60);
        const minutes = workedMinutes % 60;
        const worktime = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
        const assignee = task.assigneeId;

        task.activity.push({
            type: "ACTION",
            userId: assignee._id,
            action: "STOPPED_TIMER",
            content: `${assignee.firstname} ${assignee.lastname} stopped the timer after ${worktime}`
        })

        await task.save();
        res.status(200).json({
            msg: "timer stopped",
            addedMinutes: workedMinutes,
            totalWorktime: task.worktime
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// change bounty
router.patch("/task/:taskId/changeBounty", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { bounty, mood } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });


        const setReward = Math.max(1, Number(bounty) || 1);
        const multiplier = {
            ANGRY: 2,
            EXHAUSTED: 1.8,
            SICK: 1.6,
            SAD: 1.5,
            NORMAL: 1.5,
            OKAY: 1.5,
            VIBING: 1.4,
            HAPPY: 1.2,
            CHILLING: 1
        }[mood] || 1;
        const calculatedReward = Math.max(1, Math.floor(setReward * multiplier));

        task.ethereum.assigned = setReward;
        task.ethereum.calculated = calculatedReward;

        const editor = await User.findById(req.user.id).select("firstname lastname");
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "UPDATED_REWARD",
            content: `${editor.firstname} ${editor.lastname} updated the bounty`,
            time: new Date()
        });

        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            ethereum: task.ethereum,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// change difficulty
router.patch("/task/:taskId/changeDifficulty", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { difficulty } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        task.difficulty = difficulty;

        const editor = await User.findById(req.user.id).select("firstname lastname");
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_DIFFICULTY",
            content: `${editor.firstname} ${editor.lastname} changed the difficulty`,
            time: new Date()
        });

        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            difficulty: task.difficulty,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit description
router.patch("/task/:taskId/editDescription", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { description } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        task.description = description;

        const editor = await User.findById(req.user.id).select("firstname lastname");
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "CHANGED_DESCRIPTION",
            content: `${editor.firstname} ${editor.lastname} made changes to the description`,
            time: new Date()
        });

        await task.save();

        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "EDIT_TASK",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${editor.firstname} ${editor.lastname} edited the task. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        res.status(200).json({
            description: task.description,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// put a comment
router.patch("/task/:taskId/addComment", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "")
        return res.status(400).json({ msg: "Comment cannot be empty" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        const membership = await Membership.findOne({
            userId: req.user.id,
            projectId: task.projectId
        });

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        task.activity.push({
            type: "COMMENT",
            userId: req.user.id,
            content: comment,
            time: new Date()
        });

        await task.save();

        await task.populate({
            path: 'activity.userId',
            select: 'firstname lastname profileImage'
        });

        const response = task.activity[task.activity.length - 1].toObject();
        response.userId.profileImage = formatImage(response.userId.profileImage);
        response.user = response.userId;
        response.userId = undefined;

        // make notification

        const commentor = await User
            .findById(req.user.id)
            .select("firstname lastname");

        await Notification.create({
            users: [{ _id: commentor._id.equals(task.assigneeId) ? task.creatorId : task.assigneeId }],
            type: "COMMENT",
            icon: {
                type: "PROJECT",
                refId: task.projectId
            },
            title: `${commentor.firstname} ${commentor.lastname} added a comment. Click to view!`,
            action: {
                type: "NAVIGATE",
                url: `/task/${task._id}`
            },
        })

        res.status(200).json({
            comment,
            activity: response
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// submit a task
router.patch("/task/submit", authMiddleware, async (req, res) => {
    const { taskId } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Unauthorized for submission" });

        if (task.isSubmitted)
            return res.status(400).json({ msg: "Task already submitted" });

        task.isSubmitted = true;

        const assignee = await User
            .findById(req.user.id)
            .select("firstname lastname");

        // make activity
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "TASK_SUBMITTED",
            content: `${assignee.firstname} ${assignee.lastname} submitted this task`,
            time: new Date()
        });

        // make notification
        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.creatorId]),
                type: "TASK_SUBMITTED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Submission by ${assignee.firstname} ${assignee.lastname}: ${task.title}`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        task.isTimerRunning = false;

        await task.save();
        res.status(200).json({
            submission: task.isSubmitted,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// return a task
router.patch("/task/return", authMiddleware, async (req, res) => {
    const { taskId } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.creatorId.equals(req.user.id))
            return res.status(403).json({ msg: "Unauthorized to review" });

        if (!task.isSubmitted)
            return res.status(400).json({ msg: "Task already returned" });

        task.isSubmitted = false;

        const creator = await User
            .findById(req.user.id)
            .select("firstname lastname");

        // make activity
        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "TASK_RETURNED",
            content: `${creator.firstname} ${creator.lastname} retruned this task`,
            time: new Date()
        });

        // make notification
        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create({
                users: recipients([task.assigneeId]),
                type: "TASK_RETURNED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Task returned by ${creator.firstname} ${creator.lastname}: ${task.title}`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            })
        }

        task.isTimerRunning = false;

        await task.save();
        res.status(200).json({
            submission: task.isSubmitted,
            activity: task.activity[task.activity.length - 1]
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;
