const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.AWS_REGION || 'ap-south-1';

const s3 = process.env.AWS_ACCESS_KEY_ID
    ? new S3Client({
          region: REGION,
          credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
      })
    : null;

async function uploadBuffer(key, buffer, mimeType) {
    if (!s3 || !BUCKET) throw new Error('S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET.');
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256',
        },
    });
    await upload.done();
    return key;
}

async function getObjectBuffer(key) {
    if (!s3 || !BUCKET) throw new Error('S3 not configured.');
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks = [];
    for await (const chunk of response.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function streamObject(key, res, contentType) {
    if (!s3 || !BUCKET) throw new Error('S3 not configured.');
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    response.Body.pipe(res);
}

async function getPresignedUrl(key, expiresIn = 3600) {
    if (!s3 || !BUCKET) throw new Error('S3 not configured.');
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

module.exports = { s3, BUCKET, uploadBuffer, getObjectBuffer, streamObject, getPresignedUrl };
