import express from "express";
import { getInfohashes, addInfohash, removeInfohashes, getTopInfohashes, getInfohashData, getAllInfohashes, uploadTorrent, uploadCsvToDatabase } from "../controllers/infohashesController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for .torrent files



// Routes for managing infohashes
router.post("/", addInfohash);
router.delete("/", removeInfohashes);
router.get("/top-infohashes", getTopInfohashes); // Add this line
router.get("/infohash-data/:infohash", getInfohashData);
router.get("/all-infohashes", getAllInfohashes);
router.post("/upload-torrent", upload.single("torrent"), uploadTorrent);
router.post('/upload-csv/:table', upload.single('zipFile'), uploadCsvToDatabase);

export default router;