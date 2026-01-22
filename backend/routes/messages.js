import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js"
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const router = express.Router();

function formatProfileImage(profileImage) {
    const url = profileImage?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get user chats
router.get("/user", authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const chats = await Chat.find({
            $or: [{ userId1: userId }, { userId2: userId }]
        }).sort({ updatedAt: -1 });

        const chatData = await Promise.all(
            chats.map(async (chat) => {
                const otherUserId = chat.userId1.toString() === userId ? chat.userId2 : chat.userId1;
                const otherUser = await User.findById(otherUserId).select("_id firstname lastname profileImage");
                otherUser.profileImage = formatProfileImage(otherUser.profileImage);

                return {
                    _id: chat._id,
                    otherUser,
                    updatedAt: chat.updatedAt
                };
            })
        );

        res.status(200).json(chatData);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// start/continue a chat
router.post("/:userId", authMiddleware, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.params.userId;
    const { content } = req.body;

    if (!content) return res.status(400).json({ msg: "Message content is required" });

    if (senderId === receiverId)
        return res.status(400).json({ msg: "Cannot chat with yourself" });

    try {
        let chat = await Chat.findOne({
            $or: [
                { userId1: senderId, userId2: receiverId },
                { userId1: receiverId, userId2: senderId }
            ]
        });

        if (!chat) {
            chat = new Chat({ userId1: senderId, userId2: receiverId });
            await chat.save();
        }

        const message = await Message.create({
            chatId: chat._id,
            senderId,
            content
        });

        await message.populate("senderId", "firstname lastname profileImage");

        const sender = message.senderId.toObject();
        sender.profileImage = formatProfileImage(sender.profileImage);

        res.status(201).json({
            chat,
            message: {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                isMine: true,
                sender
            }

        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get specific user chat data
router.get("/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId)
            .populate("userId1", "firstname lastname profileImage")
            .populate("userId2", "firstname lastname profileImage");

        let messages = await Message.find({ chatId: chat._id })
            .select("-chatId")
            .populate("senderId", "firstname lastname profileImage")
            .sort({ createdAt: 1 });

        chat.userId1.profileImage = formatProfileImage(chat.userId1.profileImage);
        chat.userId2.profileImage = formatProfileImage(chat.userId2.profileImage);

        messages = messages.map(message => {
            const sender = message.senderId;
            sender.profileImage = formatProfileImage(sender.profileImage);

            return {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                isMine: sender._id.toString() === req.user.id,
                sender: {
                    _id: sender._id.toString(),
                    firstname: sender.firstname,
                    lastname: sender.lastname,
                    profileImage: sender.profileImage
                }
            };
        });

        res.status(200).json({
            chat,
            messages
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;