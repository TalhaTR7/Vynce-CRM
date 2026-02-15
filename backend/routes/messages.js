import express from "express";
import authMiddleware from "../middleware/auth.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get user chats
router.get("/user", authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const chats = await Chat
            .find({ participants: userId, hiddenFor: { $ne: userId } })
            .sort({ updatedAt: -1 })
            .populate("participants", "firstname lastname profileImage");

        const chatData = chats.map((chat) => {
            const otherUser = chat.participants.find(user => user._id.toString() !== userId);
            return {
                _id: chat._id,
                otherUser: {
                    _id: otherUser._id,
                    firstname: otherUser.firstname,
                    lastname: otherUser.lastname,
                    profileImage: formatImage(otherUser.profileImage),
                },
                updatedAt: chat.updatedAt
            };
        });

        res.status(200).json(chatData);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// start/continue a chat
router.post("/user/:userId", authMiddleware, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.params.userId;
    const { content } = req.body;

    if (senderId === receiverId)
        return res.status(400).json({ msg: "Cannot chat to yourself" });

    const participants = [senderId, receiverId].sort();

    try {
        let chat = await Chat.findOne({ participants });

        if (chat && chat.hiddenFor.includes(senderId)) {
            chat.hiddenFor.pull(senderId);
            await chat.save();
        }

        if (!chat) chat = await Chat.create({ participants });


        let message = null;
        if (content) {
            message = await Message.create({
                chatId: chat._id,
                senderId,
                content
            });
            await message.populate("senderId", "firstname lastname profileImage");
        }

        res.status(201).json({
            chat,
            message: message && {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                isMine: true,
                sender: {
                    _id: message.senderId._id.toString(),
                    firstname: message.senderId.firstname,
                    lastname: message.senderId.lastname,
                    profileImage: formatImage(message.senderId.profileImage)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get chat data
router.get("/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        const chat = await Chat
            .findById(chatId)
            .populate("participants", "firstname lastname profileImage");

        if (!chat) res.status(404).json({ msg: "Chat couldn't found" });

        const isUser = chat.participants.some(id => id.equals(userId));
        if (!isUser) res.status(403).json({ msg: "Unauthorized" });

        if (chat.hiddenFor.includes(userId)) {
            chat.hiddenFor.pull(userId);
            await chat.save();
        }

        const messages = await Message.find({ chatId: chat._id })
            .select("-chatId")
            .populate("senderId", "firstname lastname profileImage")
            .sort({ createdAt: 1 });

        const _participants = chat.participants.map(user => ({
            _id: user._id.toString(),
            firstname: user.firstname,
            lastname: user.lastname,
            profileImage: formatImage(user.profileImage),
        }))

        const _messages = messages.map(message => {
            const sender = message.senderId;
            return {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                isMine: sender._id.toString() === userId,
                sender: {
                    _id: sender._id.toString(),
                    firstname: sender.firstname,
                    lastname: sender.lastname,
                    profileImage: formatImage(sender.profileImage)
                }
            };
        });

        res.status(200).json({
            chat: {
                _id: chat._id,
                participants: _participants,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
            },
            messages: _messages
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// hide a chat
router.patch("/chat/:chatId", authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat)
            return res.status(404).json({ msg: "Chat couldn't be found" });

        const isUser = chat.participants.some(id =>
            id.toString() === userId
        );
        if (!isUser)
            return res.status(403).json({ msg: "Unauthorized: Not a chat participant" });

        await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { hiddenFor: userId } }
        );

        return res.status(200).json({ msg: "Chat hidden for user" });

    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});



export default router;