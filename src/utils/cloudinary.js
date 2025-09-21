import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

// Configure Cloudinary with explicit credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dqxmgdj5i",
    api_key: process.env.API_KEY || "766337761652718", 
    api_secret: process.env.API_SECRET || "WdKmctLgJyXhgisDeBbLAcAaVss",
    secure: true
})
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)return null;
        const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
fs.unlinkSync(localFilePath);
return response
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log(error);
        return null;
    }
}
export {uploadOnCloudinary};