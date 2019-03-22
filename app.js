/**
 * Upload a file to AWS S3
 *
 */
require('dotenv').config();
const express = require('express'); //"^4.13.4"
const aws = require('aws-sdk'); //"^2.2.41"
const bodyParser = require('body-parser');
const multer = require('multer'); // "^1.3.0"
const multerS3 = require('multer-s3'); //"^2.7.0"
const path = require('path');

console.log(process.env.AWS_IAM_USER_KEY);
console.log(process.env.AWS_IAM_USER_SECRET);
console.log(process.env.REGION);

aws.config.update({
    secretAccessKey: process.env.AWS_IAM_USER_SECRET,
    accessKeyId: process.env.AWS_IAM_USER_KEY_ID,
    region: process.env.REGION
});

const expressPort = process.env.EXPRESS_PORT;

const app = express();
const s3 = new aws.S3();

app.use(bodyParser.json());

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/gif' ||
        file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        req.fileValidationError = 'Only standard image files are allowed. -  ex. jpeg, jpg, gif, png';
        return cb(null, false, new Error('Only standard image files are allowed. - ex. jpeg, jpg, gif, png') );
    }
};

const multerS3Config = multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: process.env.BUCKET_NAME,
    //metadata: function (req, file, cb) {
    //    cb(null, { fieldName: file.fieldname });
    //},
    key: function (req, file, cb) {
        console.log(file);
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: multerS3Config,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
    }
});


/*const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: process.env.BUCKET_NAME,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname); //use Date.now() for unique file keys
        },
    })
});*/

//open http://localhost:3000/ in browser to see upload form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

//used by upload form
app.post('/upload', upload.array( 'upLoadFiles', 10 ), ( req, res, next ) => {
    const files = req.files;
    if ( ! files ) {
        const error = new Error('Please choose some image files!');
        error.httpStatusCode = 400;
        return next(error);
    } else if( req.fileValidationError ) {
        return res.end(req.fileValidationError );
    }
    else {
        res.send("Files Uploaded!");
    }
});

app.listen( expressPort, () => {
    console.log('Example app listening on port ' + expressPort +'!');
});