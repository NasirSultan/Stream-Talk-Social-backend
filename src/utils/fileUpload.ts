import axios from "axios"
import FormData from "form-data"

export const uploadFileToImgbb = async (buffer: Buffer) => {
  const form = new FormData()
  form.append("image", buffer.toString("base64"))

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.IMGBB_API_KEY}`,
    form,
    { headers: form.getHeaders() }
  )

  return response.data.data.url
}
