import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },

  filename: function (req, file, cb) {
    const fileName = Date.now() + "-" + file.originalname;
    cb(null, fileName)
  },
});

const upload = multer({ 
    storage,
    limit: {fileSize: 5 * 1024 * 1024}, // 5mb limit
  });

export default upload;