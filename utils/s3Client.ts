import {S3, ListBucketsCommand} from '@aws-sdk/client-s3';

const s3Client = new S3({
    region: process.env.NEXT_PUBLIC_ORACLE_REGION,
    endpoint: process.env.NEXT_PUBLIC_ORACLE_ENDPOINT,
    credentials: {
         accessKeyId: process.env.NEXT_PUBLIC_ORACLE_ACCESS_KEY!,
        secretAccessKey: process.env.NEXT_PUBLIC_ORACLE_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

export default s3Client;