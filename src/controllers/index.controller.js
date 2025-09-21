import {asyncHandler} from "./../utils/asyncHandler.js";
const indexRoute = asyncHandler(async(req,res)=>{
    res.status(200).send({
        success:true,
        message:"Welcome to backend API"
    });
});
export default indexRoute;