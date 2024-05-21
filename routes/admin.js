const router = require("express").Router();
const User = require("../model/User");
const Chat = require("../model/chat-app/chat.models");


router.get('/');
router.post('/verify');
router.post('/logout');


// router.post('/users', async (req, res) => {
//     try {
//         const user = await User.findById({})

//             const tranformUSers = user.map(( user , profilepic, _id)=>{
              
//                 const [] = await Promise.all([Chat.countDocuments])
//                 return {
//                     username,
//                     profilepic,
//                     _id
//                 }
//             } )




//         return res.status(200).json({status:true, message :"success", users:user})
//     }catch(e){

//         console.log(e);
//     }
//  });
router.post('/chat');
router.post('/message');
router.post('/status');

module.exports = router;