const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs");
const axios = require("axios").default

const mysql = require("mysql");
const pool = mysql.createPool({
    host: process.env.soam14host,
    database: process.env.soam14db,
    user: process.env.soam14user,
    password: process.env.soam14pass
});

function executeQuery(q) {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, conn) {
            if (err) {
                reject(err);
            }
            else {
                conn.query(q, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(results);
                    }
                })
            }
        });
    });
}

// const storage = multer.diskStorage({
//     destination: "uploads/",
//     filename: function (req, file, cb) {
//         cb(null, req.body.nama);
//     }
// });

const storage = multer.memoryStorage()

const upload = multer({
    storage: storage
});

app.use(express.urlencoded({ extended: true }));

app.get("/api/test", async function (req, res) {
    const hasil = await executeQuery(`select * from test`);
    return res.status(200).send(hasil);
});

const FormData = require("form-data");

app.post("/api/test", upload.single("photo"), async function (req, res) {
    const nama = req.body.nama;
    const hasil = await executeQuery(`insert into test values('${nama}')`);

    const form = new FormData();
    form.append("file",req.file.buffer,req.body.nama);
    const response = await axios.post(
        "https://api.anonfiles.com/upload",
        form,
        {
            headers:{
                ...form.getHeaders()
            }
        }
    )

    const data = response.data;
    const url = data.data.file.url.full;

    return res.status(201).send({ "nama": nama , "url" :url});
});

app.delete("/api/test", upload.none(), async function (req, res) {
    const nama = req.body.nama;
    const hasil = await executeQuery(`delete from test where test.test = '${nama}'`);
    //fs.unlinkSync(`uploads/${nama}`);
    return res.status(200).send({});
});

const port = 3000;
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});