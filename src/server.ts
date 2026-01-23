import dotenv from "dotenv"
import app from "./app.ts"
import connectDatabase from "./config/database"

dotenv.config()

const startServer = async () => {
  try {
    await connectDatabase()
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`Server running on port ${port}`))
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
