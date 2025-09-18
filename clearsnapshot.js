import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const rl = readline.createInterface({ input, output });

const ask = async (question, fallback) => {
  const value = (await rl.question(question + (fallback ? ` [${fallback}]` : '') + ': ')).trim();
  return value || fallback || '';
};

const endpoint = await ask('S3 endpoint (e.g. http://127.0.0.1:3900)', process.env.S3_ENDPOINT);
const bucket = await ask('Bucket name', process.env.S3_BUCKET);
const region = await ask('Region', process.env.S3_REGION ?? 'us-east-1');
const accessKeyId = await ask('Access key ID', process.env.S3_ACCESS_KEY_ID);
const secretAccessKey = await ask('Secret access key', process.env.S3_SECRET_ACCESS_KEY);
const prefix = await ask('Prefix to clear', 'tiles/');

rl.close();

const missing = [];
if (!endpoint) missing.push('endpoint');
if (!bucket) missing.push('bucket');
if (!accessKeyId) missing.push('access key ID');
if (!secretAccessKey) missing.push('secret access key');
if (missing.length) {
  console.error('Missing required values:', missing.join(', '));
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

(async () => {
  let total = 0;
  let token;
  do {
    const resp = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    const objects = (resp.Contents ?? []).filter((o) => o.Key).map((o) => ({ Key: o.Key }));
    if (objects.length) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
      );
      total += objects.length;
      console.log(`Deleted ${objects.length} objects...`);
    }
    token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (token);
  console.log(`Finished deleting ${total} snapshot object(s) under prefix ${prefix}`);
})().catch((err) => {
  console.error('Failed to delete snapshots:', err);
  process.exit(1);
});
