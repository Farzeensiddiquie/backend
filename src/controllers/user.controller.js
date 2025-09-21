import {asyncHandler} from "./../utils/asyncHandler.js";
const welcome = asyncHandler(async(req,res)=>{
    res.status(200).send({
        success:true,
        message:"Welcome to User API"
    });
});
export default welcome;