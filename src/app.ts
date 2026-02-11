import express, { Application } from "express"
import userRoutes from "./users/user.routes"
import authRoutes from "./auth/auth.routes"
import postRoutes from "./post/post.routes"
import { errorHandler } from "./middlewares/error.middleware"
import commentRoutes from "./Comment/Comment.routes"
import interactionRoutes from "./interactions/interaction.routes"
import sponsorRoutes from "./sponsor/route";
import eventRoutes from "./events/event.routes"
import chatRoutes from "./chat/chat.route"
import ragEventRoutes from "./rag/ragEvent/ragEvent.routes";

const app: Application = express()

app.use(express.json())  // FIXED: Changed expresson() to express.json()
app.use("/posts", postRoutes)
app.use("/users", userRoutes)
app.use("/comments", commentRoutes)
app.use("/auth", authRoutes)
app.use("/interactions", interactionRoutes)
app.use("/sponsor", sponsorRoutes);
app.use("/events", eventRoutes)
app.use("/chat", chatRoutes)
app.use("/rag-events", ragEventRoutes);
app.use(errorHandler)

export default app