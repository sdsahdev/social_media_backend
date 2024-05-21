const multer = require("multer");

const multerUpload = multer({
    limits:{
        fileSize: 1024 * 1024 * 2
      }
})

const singleAvatar = multerUpload.single("avatar")
const attachmentMulter = multerUpload.array("files", 5)

module.exports = {singleAvatar,attachmentMulter };